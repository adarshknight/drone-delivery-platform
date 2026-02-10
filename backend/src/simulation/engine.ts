// Main simulation engine - orchestrates the entire simulation

import { DroneController } from './drone-controller.js';
import { dataStore } from '../data/store.js';
import { getScenario } from './scenarios.js';
import { calculateDistance, checkNoFlyZoneViolation, calculateOptimizedRoute } from './pathfinding.js';
import type { Order, Alert, EventLog, KPIMetrics, Drone } from '../types/entities.js';
import { OrderStatus, OrderPriority, DroneStatus, AlertType, AlertSeverity, ScenarioType } from '../types/entities.js';

export class SimulationEngine {
    private droneControllers: Map<string, DroneController> = new Map();
    private intervalId: NodeJS.Timeout | null = null;
    private lastUpdateTime: number = Date.now();
    private orderCreationTimer: number = 0;
    private onUpdate?: (data: any) => void;

    constructor() {
        this.initializeDroneControllers();
    }

    private initializeDroneControllers() {
        dataStore.getAllDrones().forEach(drone => {
            this.droneControllers.set(drone.id, new DroneController(drone));
        });
    }

    start(onUpdate?: (data: any) => void) {
        if (this.intervalId) return;

        this.onUpdate = onUpdate;
        dataStore.simulationState.isRunning = true;
        dataStore.simulationState.startTime = new Date();
        this.lastUpdateTime = Date.now();

        // Main simulation loop - runs every 100ms
        this.intervalId = setInterval(() => {
            this.update();
        }, 100);

        this.logEvent({
            id: `event-${Date.now()}`,
            timestamp: new Date(),
            type: 'SYSTEM',
            severity: AlertSeverity.INFO,
            description: 'Simulation started',
            metadata: { scenario: dataStore.simulationState.currentScenario },
        });
    }

    pause() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        dataStore.simulationState.isRunning = false;

        this.logEvent({
            id: `event-${Date.now()}`,
            timestamp: new Date(),
            type: 'SYSTEM',
            severity: AlertSeverity.INFO,
            description: 'Simulation paused',
            metadata: {},
        });
    }

    resume() {
        if (!this.intervalId && !dataStore.simulationState.isRunning) {
            this.start(this.onUpdate);
        }
    }

    setSpeed(speed: number) {
        dataStore.simulationState.speed = speed;
        this.logEvent({
            id: `event-${Date.now()}`,
            timestamp: new Date(),
            type: 'SYSTEM',
            severity: AlertSeverity.INFO,
            description: `Simulation speed changed to ${speed}x`,
            metadata: { speed },
        });
    }

    setScenario(scenarioType: ScenarioType) {
        const scenario = getScenario(scenarioType);

        if (!scenario) {
            console.error(`Invalid scenario type: ${scenarioType}`);
            return;
        }

        dataStore.simulationState.currentScenario = scenarioType;
        dataStore.simulationState.weatherCondition = scenario.parameters.weatherCondition;

        this.logEvent({
            id: `event-${Date.now()}`,
            timestamp: new Date(),
            type: 'SYSTEM',
            severity: AlertSeverity.INFO,
            description: `Scenario changed to ${scenario.name}`,
            metadata: { scenario: scenarioType },
        });
    }

    setWeatherImpact(impact: number) {
        dataStore.simulationState.weatherImpact = Math.max(0, Math.min(100, impact));
    }

    private update() {
        const now = Date.now();
        const deltaTimeMs = now - this.lastUpdateTime;
        const deltaTimeSeconds = deltaTimeMs / 1000;
        this.lastUpdateTime = now;

        const speed = dataStore.simulationState.speed;
        dataStore.simulationState.elapsedTime += deltaTimeSeconds * speed;

        // Update all drones
        this.droneControllers.forEach(controller => {
            controller.update(deltaTimeSeconds, speed);
        });

        // Check for no-fly zone violations
        this.checkNoFlyZoneViolations();

        // Check for drone collisions
        this.checkDroneCollisions();

        // Check for low battery alerts
        this.checkLowBatteryAlerts();

        // Check for delayed orders
        this.checkDelayedOrders();

        // Assign pending orders to available drones
        this.assignOrders();

        // Generate new orders based on scenario
        this.generateOrders(deltaTimeSeconds * speed);

        // Broadcast updates
        if (this.onUpdate) {
            this.onUpdate({
                drones: dataStore.getAllDrones(),
                orders: dataStore.getAllOrders(),
                kpi: this.calculateKPIMetrics(),
            });
        }
    }

    private generateOrders(deltaTime: number) {
        const scenario = getScenario(dataStore.simulationState.currentScenario);
        this.orderCreationTimer += deltaTime;

        const orderInterval = 60 / scenario.parameters.orderFrequency; // seconds between orders

        if (this.orderCreationTimer >= orderInterval) {
            this.orderCreationTimer = 0;
            this.createRandomOrder();
        }
    }

    createOrder(restaurantId: string, customerId: string, items: any[], priority: OrderPriority): Order {
        const restaurant = dataStore.restaurants.get(restaurantId);
        const customer = dataStore.customers.get(customerId);

        if (!restaurant || !customer) {
            throw new Error('Invalid restaurant or customer');
        }

        const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0.5), 0);
        const totalPrice = items.reduce((sum, item) => sum + (item.price || 10), 0);

        const order: Order = {
            id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            customerId,
            restaurantId,
            assignedDroneId: null,
            status: OrderStatus.PENDING,
            priority,
            items,
            totalWeight,
            totalPrice,
            createdAt: new Date(),
            estimatedPrepTime: restaurant.averagePrepTime,
            estimatedDeliveryTime: null,
            actualDeliveryTime: null,
            pickupTime: null,
            timeline: [{
                timestamp: new Date(),
                status: OrderStatus.PENDING,
                description: 'Order created',
            }],
            deliveryAddress: customer.position,
        };

        dataStore.addOrder(order);
        restaurant.currentOrders.push(order.id);

        this.logEvent({
            id: `event-${Date.now()}`,
            timestamp: new Date(),
            type: 'ORDER',
            severity: AlertSeverity.INFO,
            description: `New order created: ${order.id}`,
            metadata: { orderId: order.id, restaurantId, customerId },
        });

        return order;
    }

    private createRandomOrder() {
        const restaurants = dataStore.getAllRestaurants().filter(r => r.isOpen);
        const customers = dataStore.getAllCustomers();

        if (restaurants.length === 0 || customers.length === 0) return;

        const restaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
        const customer = customers[Math.floor(Math.random() * customers.length)];

        const items = [
            { name: 'Item 1', quantity: 1, weight: 0.5, price: 15 },
            { name: 'Item 2', quantity: 1, weight: 0.3, price: 10 },
        ];

        const priorities = [OrderPriority.NORMAL, OrderPriority.NORMAL, OrderPriority.HIGH, OrderPriority.LOW];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];

        this.createOrder(restaurant.id, customer.id, items, priority);
    }

    private assignOrders() {
        const pendingOrders = dataStore.getAllOrders()
            .filter(o => o.status === OrderStatus.PENDING)
            .sort((a, b) => {
                // Sort by priority
                const priorityOrder = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            });

        const availableDrones = dataStore.getAllDrones()
            .filter(d => d.isAvailable && d.status === DroneStatus.IDLE && d.battery > 40);

        for (const order of pendingOrders) {
            if (availableDrones.length === 0) break;

            const restaurant = dataStore.restaurants.get(order.restaurantId);
            if (!restaurant) continue;

            // Find closest available drone
            let closestDrone = availableDrones[0];
            let minDistance = calculateDistance(closestDrone.position, restaurant.position);

            for (const drone of availableDrones) {
                const distance = calculateDistance(drone.position, restaurant.position);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestDrone = drone;
                }
            }

            // Assign order to drone
            const controller = this.droneControllers.get(closestDrone.id);
            if (controller && controller.assignOrder(order)) {
                availableDrones.splice(availableDrones.indexOf(closestDrone), 1);

                this.logEvent({
                    id: `event-${Date.now()}`,
                    timestamp: new Date(),
                    type: 'ORDER',
                    severity: AlertSeverity.INFO,
                    description: `Order ${order.id} assigned to ${closestDrone.name}`,
                    metadata: { orderId: order.id, droneId: closestDrone.id },
                });
            }
        }
    }

    private checkNoFlyZoneViolations() {
        // No-fly zone alerts disabled per user request
        // Drones still avoid no-fly zones via pathfinding, but no alerts are generated
    }

    private checkLowBatteryAlerts() {
        dataStore.getAllDrones().forEach(drone => {
            // Only alert when battery is critically low (<10%)
            if (drone.battery < 10 && drone.battery > 0 && drone.status !== DroneStatus.CHARGING) {
                // Check if alert already exists
                const existingAlert = Array.from(dataStore.alerts.values()).find(
                    a => a.type === AlertType.LOW_BATTERY && a.relatedEntityId === drone.id && !a.isResolved
                );

                if (!existingAlert) {
                    this.createAlert({
                        id: `alert-${Date.now()}-${drone.id}`,
                        type: AlertType.LOW_BATTERY,
                        severity: AlertSeverity.CRITICAL,
                        message: `${drone.name} has critically low battery: ${drone.battery.toFixed(1)}%`,
                        timestamp: new Date(),
                        relatedEntityId: drone.id,
                        isResolved: false,
                        resolvedAt: null,
                    });
                }
            }
        });
    }

    private checkDelayedOrders() {
        const now = new Date();

        dataStore.getAllOrders().forEach(order => {
            if (order.status === OrderStatus.IN_TRANSIT || order.status === OrderStatus.ASSIGNED) {
                if (order.estimatedDeliveryTime && now > order.estimatedDeliveryTime) {
                    const existingAlert = Array.from(dataStore.alerts.values()).find(
                        a => a.type === AlertType.DELAYED_ORDER && a.relatedEntityId === order.id && !a.isResolved
                    );

                    if (!existingAlert) {
                        this.createAlert({
                            id: `alert-${Date.now()}-${order.id}`,
                            type: AlertType.DELAYED_ORDER,
                            severity: AlertSeverity.WARNING,
                            message: `Order ${order.id} is delayed`,
                            timestamp: new Date(),
                            relatedEntityId: order.id,
                            isResolved: false,
                            resolvedAt: null,
                        });
                    }
                }
            }
        });
    }

    private checkDroneCollisions() {
        const MIN_SEPARATION = 0.1; // 100 meters in km
        const drones = dataStore.getAllDrones()
            .filter(d => d.status !== DroneStatus.IDLE &&
                d.status !== DroneStatus.CHARGING &&
                d.status !== DroneStatus.MAINTENANCE);

        // Check all pairs of flying drones
        for (let i = 0; i < drones.length; i++) {
            for (let j = i + 1; j < drones.length; j++) {
                const distance = calculateDistance(
                    drones[i].position,
                    drones[j].position
                );

                if (distance < MIN_SEPARATION) {
                    this.handleCollisionRisk(drones[i], drones[j], distance);
                }
            }
        }
    }

    private handleCollisionRisk(drone1: Drone, drone2: Drone, distance: number) {
        // Create alert (only if not already alerted in last 5 seconds)
        const recentAlert = Array.from(dataStore.alerts.values()).find(
            a => a.type === AlertType.COLLISION_RISK &&
                (a.relatedEntityId === drone1.id || a.relatedEntityId === drone2.id) &&
                !a.isResolved &&
                (Date.now() - a.timestamp.getTime()) < 5000
        );

        if (!recentAlert) {
            this.createAlert({
                id: `alert-collision-${Date.now()}`,
                type: AlertType.COLLISION_RISK,
                severity: AlertSeverity.CRITICAL,
                message: `Collision risk: ${drone1.name} and ${drone2.name} (${(distance * 1000).toFixed(0)}m apart)`,
                timestamp: new Date(),
                relatedEntityId: drone1.id,
                isResolved: false,
                resolvedAt: null,
            });
        }

        // Avoidance: Adjust altitude if at same height
        if (Math.abs(drone1.position.altitude - drone2.position.altitude) < 10) {
            // Drone with lower ID climbs, other descends (deterministic choice)
            const climbingDrone = drone1.id < drone2.id ? drone1 : drone2;
            climbingDrone.position.altitude += 20;

            this.logEvent({
                id: `event-${Date.now()}`,
                timestamp: new Date(),
                type: 'DRONE',
                severity: AlertSeverity.WARNING,
                description: `Collision avoidance: ${climbingDrone.name} climbed 20m to avoid ${drone1.id < drone2.id ? drone2.name : drone1.name}`,
                metadata: {
                    drone1: drone1.id,
                    drone2: drone2.id,
                    distance: distance,
                    action: 'altitude_adjustment'
                },
            });
        }
    }

    private createAlert(alert: Alert) {
        dataStore.addAlert(alert);

        if (this.onUpdate) {
            this.onUpdate({ alert });
        }
    }

    private logEvent(event: EventLog) {
        dataStore.addEventLog(event);
    }

    calculateKPIMetrics(): KPIMetrics {
        const drones = dataStore.getAllDrones();
        const orders = dataStore.getAllOrders();
        const alerts = dataStore.getAllAlerts();

        const activeDrones = drones.filter(d =>
            d.status !== DroneStatus.IDLE &&
            d.status !== DroneStatus.CHARGING &&
            d.status !== DroneStatus.MAINTENANCE
        ).length;

        const idleDrones = drones.filter(d => d.status === DroneStatus.IDLE).length;
        const chargingDrones = drones.filter(d => d.status === DroneStatus.CHARGING).length;

        const ordersCompleted = orders.filter(o => o.status === OrderStatus.DELIVERED).length;
        const ordersInProgress = orders.filter(o =>
            o.status === OrderStatus.ASSIGNED ||
            o.status === OrderStatus.PICKED_UP ||
            o.status === OrderStatus.IN_TRANSIT
        ).length;
        const ordersCancelled = orders.filter(o => o.status === OrderStatus.CANCELLED || o.status === OrderStatus.FAILED).length;

        // Calculate on-time delivery rate
        const deliveredOrders = orders.filter(o => o.status === OrderStatus.DELIVERED);
        const onTimeOrders = deliveredOrders.filter(o => {
            if (!o.estimatedDeliveryTime || !o.actualDeliveryTime) return false;
            return o.actualDeliveryTime <= o.estimatedDeliveryTime;
        });
        const onTimeDeliveryRate = deliveredOrders.length > 0 ? (onTimeOrders.length / deliveredOrders.length) * 100 : 100;

        // Calculate average delivery time
        const avgDeliveryTime = deliveredOrders.length > 0
            ? deliveredOrders.reduce((sum, o) => {
                if (!o.createdAt || !o.actualDeliveryTime) return sum;
                return sum + (o.actualDeliveryTime.getTime() - o.createdAt.getTime()) / 60000; // minutes
            }, 0) / deliveredOrders.length
            : 0;

        const criticalAlerts = alerts.filter(a => a.severity === AlertSeverity.CRITICAL && !a.isResolved).length;

        const totalRevenue = ordersCompleted * 50; // Assume $50 per order

        const avgBatteryLevel = drones.reduce((sum, d) => sum + d.battery, 0) / drones.length;

        return {
            totalDrones: drones.length,
            activeDrones,
            idleDrones,
            chargingDrones,
            ordersToday: orders.length,
            ordersInProgress,
            ordersCompleted,
            ordersCancelled,
            onTimeDeliveryRate,
            averageDeliveryTime: avgDeliveryTime,
            totalAlerts: alerts.filter(a => !a.isResolved).length,
            criticalAlerts,
            totalRevenue,
            averageBatteryLevel: avgBatteryLevel,
        };
    }

    getDroneController(droneId: string): DroneController | undefined {
        return this.droneControllers.get(droneId);
    }
}

export const simulationEngine = new SimulationEngine();
