// AI Route Optimizer using TensorFlow.js
// Optimizes drone delivery routes using neural networks

import * as tf from '@tensorflow/tfjs-node';
import { dataStore } from '../data/store.js';
import { calculateDistance, calculateOptimizedRoute, checkNoFlyZoneViolation } from '../simulation/pathfinding.js';
import { getCurrentSimulationWeather } from './simulation-weather-converter.js';
import type { Position, Drone, Order } from '../types/entities.js';

interface RouteConstraints {
    batteryLevel: number;
    maxDistance: number;
    weatherConditions: {
        windSpeed: number;
        precipitation: number;
        temperature: number;
    };
    avoidNoFlyZones: boolean;
}

interface OptimizedRoute {
    waypoints: Position[];
    distance: number;
    estimatedTime: number;
    batteryUsage: number;
    safetyScore: number;
    confidence: number;
}

interface RouteComparison {
    optimizedRoute: OptimizedRoute;
    directRoute: OptimizedRoute;
    distanceSaved: number;
    timeSaved: number;
    batterySaved: number;
    improvementPercentage: number;
}

class AIRouteOptimizer {
    private model: tf.LayersModel | null = null;
    private isTraining: boolean = false;
    private trainingProgress: number = 0;
    private modelTrained: boolean = false;

    constructor() {
        this.initializeModel();
    }

    /**
     * Initialize the neural network model
     */
    private initializeModel() {
        // Create a sequential model for route optimization
        this.model = tf.sequential({
            layers: [
                // Input layer: start/end coords, battery, weather (8 features)
                tf.layers.dense({
                    inputShape: [8],
                    units: 64,
                    activation: 'relu',
                    kernelInitializer: 'heNormal'
                }),
                tf.layers.dropout({ rate: 0.2 }),

                tf.layers.dense({
                    units: 32,
                    activation: 'relu',
                    kernelInitializer: 'heNormal'
                }),
                tf.layers.dropout({ rate: 0.2 }),

                tf.layers.dense({
                    units: 16,
                    activation: 'relu',
                    kernelInitializer: 'heNormal'
                }),

                // Output layer: waypoint adjustments (4 values: lat/lng offsets for 2 waypoints)
                tf.layers.dense({
                    units: 4,
                    activation: 'tanh' // -1 to 1 for coordinate offsets
                })
            ]
        });

        // Compile the model
        this.model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'meanSquaredError',
            metrics: ['mae']
        });

        console.log('🤖 AI Route Optimizer model initialized');
    }

    /**
     * Generate training data from simulated routes
     */
    private generateTrainingData(numSamples: number = 1000): { inputs: number[][], outputs: number[][] } {
        const inputs: number[][] = [];
        const outputs: number[][] = [];

        const restaurants = dataStore.getAllRestaurants();
        const customers = dataStore.getAllCustomers();
        const noFlyZones = dataStore.getAllNoFlyZones();

        for (let i = 0; i < numSamples; i++) {
            // Random start and end points
            const start = restaurants[Math.floor(Math.random() * restaurants.length)].position;
            const end = customers[Math.floor(Math.random() * customers.length)].position;

            // Random conditions
            const battery = 50 + Math.random() * 50; // 50-100%
            const windSpeed = Math.random() * 20; // 0-20 m/s
            const precipitation = Math.random() * 15; // 0-15 mm
            const temperature = 10 + Math.random() * 30; // 10-40°C

            // Normalize inputs
            const input = [
                (start.lat - 28.4) / 0.4, // Normalize around Delhi NCR
                (start.lng - 77.0) / 0.5,
                (end.lat - 28.4) / 0.4,
                (end.lng - 77.0) / 0.5,
                battery / 100,
                windSpeed / 20,
                precipitation / 15,
                temperature / 40
            ];

            // Calculate optimal waypoints (avoiding no-fly zones)
            const directDistance = calculateDistance(start, end);
            const midLat = (start.lat + end.lat) / 2;
            const midLng = (start.lng + end.lng) / 2;

            // Add strategic waypoints to avoid no-fly zones and optimize for weather
            let waypoint1Offset = { lat: 0, lng: 0 };
            let waypoint2Offset = { lat: 0, lng: 0 };

            // Check if direct path crosses no-fly zones
            const midpoint1 = { lat: start.lat + (end.lat - start.lat) * 0.33, lng: start.lng + (end.lng - start.lng) * 0.33, altitude: 50 };
            const midpoint2 = { lat: start.lat + (end.lat - start.lat) * 0.67, lng: start.lng + (end.lng - start.lng) * 0.67, altitude: 50 };

            if (checkNoFlyZoneViolation(midpoint1, noFlyZones)) {
                // Offset perpendicular to path
                waypoint1Offset = { lat: 0.01, lng: -0.01 };
            }

            if (checkNoFlyZoneViolation(midpoint2, noFlyZones)) {
                waypoint2Offset = { lat: -0.01, lng: 0.01 };
            }

            // Adjust for wind (fly upwind when possible)
            if (windSpeed > 10) {
                waypoint1Offset.lat += 0.005;
                waypoint2Offset.lng += 0.005;
            }

            // Normalize outputs to -1 to 1 range
            const output = [
                Math.max(-1, Math.min(1, waypoint1Offset.lat * 100)),
                Math.max(-1, Math.min(1, waypoint1Offset.lng * 100)),
                Math.max(-1, Math.min(1, waypoint2Offset.lat * 100)),
                Math.max(-1, Math.min(1, waypoint2Offset.lng * 100))
            ];

            inputs.push(input);
            outputs.push(output);
        }

        return { inputs, outputs };
    }

    /**
     * Train the model on generated data
     */
    async trainModel(epochs: number = 50): Promise<void> {
        if (this.isTraining) {
            console.log('⚠️ Model is already training');
            return;
        }

        this.isTraining = true;
        this.trainingProgress = 0;

        console.log('🎓 Starting AI model training...');

        try {
            // Generate training data
            const { inputs, outputs } = this.generateTrainingData(2000);

            // Convert to tensors
            const xs = tf.tensor2d(inputs);
            const ys = tf.tensor2d(outputs);

            // Train the model
            await this.model!.fit(xs, ys, {
                epochs,
                batchSize: 32,
                validationSplit: 0.2,
                callbacks: {
                    onEpochEnd: (epoch: number, logs: any) => {
                        this.trainingProgress = ((epoch + 1) / epochs) * 100;
                        if ((epoch + 1) % 10 === 0) {
                            console.log(`📊 Epoch ${epoch + 1}/${epochs} - Loss: ${logs?.loss.toFixed(4)}, Val Loss: ${logs?.val_loss.toFixed(4)}`);
                        }
                    }
                }
            });

            // Clean up tensors
            xs.dispose();
            ys.dispose();

            this.modelTrained = true;
            console.log('✅ Model training complete!');
        } catch (error) {
            console.error('❌ Model training failed:', error);
            throw error;
        } finally {
            this.isTraining = false;
        }
    }

    /**
     * Optimize a route using the trained model
     */
    async optimizeRoute(
        start: Position,
        end: Position,
        constraints: RouteConstraints
    ): Promise<OptimizedRoute> {
        if (!this.modelTrained) {
            console.log('⚠️ Model not trained, using traditional optimization');
            return this.fallbackOptimization(start, end, constraints);
        }

        try {
            // Prepare input features
            const input = tf.tensor2d([[
                (start.lat - 28.4) / 0.4,
                (start.lng - 77.0) / 0.5,
                (end.lat - 28.4) / 0.4,
                (end.lng - 77.0) / 0.5,
                constraints.batteryLevel / 100,
                constraints.weatherConditions.windSpeed / 20,
                constraints.weatherConditions.precipitation / 15,
                constraints.weatherConditions.temperature / 40
            ]]);

            // Predict waypoint offsets
            const prediction = this.model!.predict(input) as tf.Tensor;
            const offsets = await prediction.data();

            // Clean up tensors
            input.dispose();
            prediction.dispose();

            // Convert offsets to waypoints
            const waypoint1 = {
                lat: start.lat + (end.lat - start.lat) * 0.33 + offsets[0] / 100,
                lng: start.lng + (end.lng - start.lng) * 0.33 + offsets[1] / 100,
                altitude: 50
            };

            const waypoint2 = {
                lat: start.lat + (end.lat - start.lat) * 0.67 + offsets[2] / 100,
                lng: start.lng + (end.lng - start.lng) * 0.67 + offsets[3] / 100,
                altitude: 50
            };

            // Build route
            const waypoints = [start, waypoint1, waypoint2, end];

            // Validate and adjust for no-fly zones
            const validatedWaypoints = this.validateRoute(waypoints);

            // Calculate metrics
            const distance = this.calculateRouteDistance(validatedWaypoints);
            const estimatedTime = this.calculateRouteTime(validatedWaypoints, constraints);
            const batteryUsage = this.calculateBatteryUsage(distance, constraints);
            const safetyScore = this.calculateSafetyScore(validatedWaypoints);

            return {
                waypoints: validatedWaypoints,
                distance,
                estimatedTime,
                batteryUsage,
                safetyScore,
                confidence: 0.85 // Model confidence
            };
        } catch (error) {
            console.error('❌ Route optimization failed:', error);
            return this.fallbackOptimization(start, end, constraints);
        }
    }

    /**
     * Fallback to traditional A* optimization if AI fails
     */
    private fallbackOptimization(
        start: Position,
        end: Position,
        constraints: RouteConstraints
    ): OptimizedRoute {
        const waypoints = calculateOptimizedRoute(start, end, dataStore.getAllNoFlyZones());
        const distance = this.calculateRouteDistance(waypoints);
        const estimatedTime = this.calculateRouteTime(waypoints, constraints);
        const batteryUsage = this.calculateBatteryUsage(distance, constraints);
        const safetyScore = this.calculateSafetyScore(waypoints);

        return {
            waypoints,
            distance,
            estimatedTime,
            batteryUsage,
            safetyScore,
            confidence: 0.6 // Lower confidence for fallback
        };
    }

    /**
     * Validate route and adjust for no-fly zones
     */
    private validateRoute(waypoints: Position[]): Position[] {
        const noFlyZones = dataStore.getAllNoFlyZones();
        const validated: Position[] = [];

        for (let i = 0; i < waypoints.length; i++) {
            const point = waypoints[i];

            if (checkNoFlyZoneViolation(point, noFlyZones)) {
                // Adjust point to avoid no-fly zone
                validated.push({
                    lat: point.lat + 0.01,
                    lng: point.lng + 0.01,
                    altitude: point.altitude
                });
            } else {
                validated.push(point);
            }
        }

        return validated;
    }

    /**
     * Calculate total route distance
     */
    private calculateRouteDistance(waypoints: Position[]): number {
        let totalDistance = 0;
        for (let i = 0; i < waypoints.length - 1; i++) {
            totalDistance += calculateDistance(waypoints[i], waypoints[i + 1]);
        }
        return totalDistance;
    }

    /**
     * Calculate estimated route time
     */
    private calculateRouteTime(waypoints: Position[], constraints: RouteConstraints): number {
        const distance = this.calculateRouteDistance(waypoints);
        const baseSpeed = 60; // km/h

        // Adjust for weather
        const weatherMultiplier = 1 - (constraints.weatherConditions.windSpeed / 20) * 0.3;
        const adjustedSpeed = baseSpeed * weatherMultiplier;

        return (distance / adjustedSpeed) * 60; // minutes
    }

    /**
     * Calculate battery usage
     */
    private calculateBatteryUsage(distance: number, constraints: RouteConstraints): number {
        const baseDrain = distance * 2; // 2% per km
        const weatherMultiplier = 1 + (constraints.weatherConditions.windSpeed / 20) * 0.5;
        return baseDrain * weatherMultiplier;
    }

    /**
     * Calculate safety score
     */
    private calculateSafetyScore(waypoints: Position[]): number {
        const noFlyZones = dataStore.getAllNoFlyZones();
        let violations = 0;

        for (const point of waypoints) {
            if (checkNoFlyZoneViolation(point, noFlyZones)) {
                violations++;
            }
        }

        return Math.max(0, 100 - violations * 25);
    }

    /**
     * Compare optimized route with direct route
     */
    async compareRoutes(
        start: Position,
        end: Position,
        constraints: RouteConstraints
    ): Promise<RouteComparison> {
        // Get optimized route
        const optimizedRoute = await this.optimizeRoute(start, end, constraints);

        // Get direct route
        const directWaypoints = [start, end];
        const directDistance = calculateDistance(start, end);
        const directRoute: OptimizedRoute = {
            waypoints: directWaypoints,
            distance: directDistance,
            estimatedTime: this.calculateRouteTime(directWaypoints, constraints),
            batteryUsage: this.calculateBatteryUsage(directDistance, constraints),
            safetyScore: this.calculateSafetyScore(directWaypoints),
            confidence: 1.0
        };

        // Calculate savings
        const distanceSaved = directRoute.distance - optimizedRoute.distance;
        const timeSaved = directRoute.estimatedTime - optimizedRoute.estimatedTime;
        const batterySaved = directRoute.batteryUsage - optimizedRoute.batteryUsage;
        const improvementPercentage = (distanceSaved / directRoute.distance) * 100;

        return {
            optimizedRoute,
            directRoute,
            distanceSaved,
            timeSaved,
            batterySaved,
            improvementPercentage
        };
    }

    /**
     * Get model training status
     */
    getStatus() {
        return {
            isTraining: this.isTraining,
            trainingProgress: this.trainingProgress,
            modelTrained: this.modelTrained
        };
    }
}

// Export singleton instance
export const aiRouteOptimizer = new AIRouteOptimizer();
