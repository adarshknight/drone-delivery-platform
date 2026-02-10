// Drone controller - handles individual drone behavior and movement

import type { Drone, Position, Order, Kiosk } from '../types/entities.js';
import { DroneStatus, OrderStatus, WeatherCondition } from '../types/entities.js';
import { calculateDistance, interpolatePosition, calculateBearing, calculateFlightAltitude, calculateOptimizedRoute, checkNoFlyZoneViolation } from './pathfinding.js';
import { calculateBatteryDrain, calculateIdleDrain, shouldReturnToKiosk } from './battery-model.js';
import { dataStore } from '../data/store.js';

export class DroneController {
    private drone: Drone;
    private updateIntervalMs: number = 100; // 100ms update rate

    constructor(drone: Drone) {
        this.drone = drone;
    }

    update(deltaTimeSeconds: number, simulationSpeed: number) {
        const adjustedDelta = deltaTimeSeconds * simulationSpeed;

        switch (this.drone.status) {
            case DroneStatus.IDLE:
                this.handleIdle(adjustedDelta);
                break;
            case DroneStatus.CHARGING:
                this.handleCharging(adjustedDelta);
                break;
            case DroneStatus.FLYING_TO_RESTAURANT:
            case DroneStatus.FLYING_TO_CUSTOMER:
            case DroneStatus.RETURNING_TO_KIOSK:
                this.handleFlying(adjustedDelta);
                break;
            case DroneStatus.WAITING_FOR_PICKUP:
                this.handleWaitingForPickup(adjustedDelta);
                break;
            case DroneStatus.DELIVERING:
                this.handleDelivering(adjustedDelta);
                break;
            case DroneStatus.EMERGENCY_LANDING:
                this.handleEmergencyLanding(adjustedDelta);
                break;
        }
    }

    private handleIdle(deltaTime: number) {
        // Idle drones consume minimal battery
        const drain = calculateIdleDrain(deltaTime);
        this.drone.battery = Math.max(0, this.drone.battery - drain);
        this.drone.speed = 0;

        // Check if battery is low and needs charging (increased threshold for better fleet health)
        if (this.drone.battery < 40) {
            this.requestCharging();
        }
    }

    private handleCharging(deltaTime: number) {
        // Charge the drone
        const chargeRate = 0.01389 * deltaTime; // 50% per hour (increased for faster turnaround)
        this.drone.battery = Math.min(100, this.drone.battery + chargeRate);
        this.drone.speed = 0;

        // When fully charged, return to idle (increased to 98% for better battery health)
        if (this.drone.battery >= 98) {
            this.drone.status = DroneStatus.IDLE;
            this.drone.isAvailable = true;

            // Remove from charging queue
            const kiosk = dataStore.kiosks.get(this.drone.assignedKioskId);
            if (kiosk) {
                kiosk.availableChargingSlots++;
                const queueIndex = kiosk.chargingQueue.indexOf(this.drone.id);
                if (queueIndex > -1) {
                    kiosk.chargingQueue.splice(queueIndex, 1);
                }
            }
        }
    }

    private handleFlying(deltaTime: number) {
        if (this.drone.route.length === 0 || this.drone.currentWaypointIndex >= this.drone.route.length) {
            this.arrivedAtDestination();
            return;
        }

        const currentWaypoint = this.drone.route[this.drone.currentWaypointIndex];
        const distanceToWaypoint = calculateDistance(this.drone.position, currentWaypoint);

        // Calculate speed based on weather
        const weather = dataStore.simulationState.weatherCondition;
        const weatherImpact = dataStore.simulationState.weatherImpact;
        const weatherMultiplier = 1 - (weatherImpact / 100) * 0.5; // Up to 50% speed reduction
        this.drone.speed = this.drone.maxSpeed * weatherMultiplier;

        // Calculate distance traveled in this update
        const distanceTraveledKm = (this.drone.speed * deltaTime) / 3600; // speed in km/h, time in seconds

        if (distanceTraveledKm >= distanceToWaypoint) {
            // Reached waypoint - validate before moving
            const violation = checkNoFlyZoneViolation(currentWaypoint, dataStore.getAllNoFlyZones());
            if (violation) {
                // Waypoint is in no-fly zone! Recalculate route
                console.warn(`⚠️ Drone ${this.drone.id} waypoint in no-fly zone ${violation.name}. Recalculating route.`);
                this.recalculateRoute();
                return;
            }

            this.drone.position = { ...currentWaypoint };
            this.drone.currentWaypointIndex++;
            this.drone.totalDistance += distanceToWaypoint;

            // Battery drain for distance traveled
            const drain = calculateBatteryDrain(this.drone, distanceToWaypoint, weather, weatherImpact);
            this.drone.battery = Math.max(0, this.drone.battery - drain);
        } else {
            // Move towards waypoint - validate next position first
            const fraction = distanceTraveledKm / distanceToWaypoint;
            const nextPosition = interpolatePosition(this.drone.position, currentWaypoint, fraction);

            // Check if next position would violate no-fly zone
            const violation = checkNoFlyZoneViolation(nextPosition, dataStore.getAllNoFlyZones());
            if (violation) {
                // Next position is in no-fly zone! Hold position and recalculate
                console.warn(`🚫 Drone ${this.drone.id} would enter no-fly zone ${violation.name}. Holding position and recalculating.`);
                this.drone.speed = 0; // Stop moving
                this.recalculateRoute();
                return;
            }

            // Safe to move
            this.drone.position = nextPosition;
            this.drone.totalDistance += distanceTraveledKm;

            // Battery drain
            const drain = calculateBatteryDrain(this.drone, distanceTraveledKm, weather, weatherImpact);
            this.drone.battery = Math.max(0, this.drone.battery - drain);
        }

        this.drone.totalFlightTime += deltaTime / 3600; // Convert to hours

        // Check if battery is critically low
        if (this.drone.battery < 10) {
            this.initiateEmergencyReturn();
        }

        // Check if should return to kiosk
        const kiosk = dataStore.kiosks.get(this.drone.assignedKioskId);
        if (kiosk && shouldReturnToKiosk(this.drone, calculateDistance(this.drone.position, kiosk.position), weather, weatherImpact)) {
            if (this.drone.status !== DroneStatus.RETURNING_TO_KIOSK) {
                this.initiateEmergencyReturn();
            }
        }
    }

    private recalculateRoute() {
        // Recalculate route from current position to current destination
        const currentWaypoint = this.drone.route[this.drone.route.length - 1];
        if (!currentWaypoint) return;

        console.log(`🔄 Recalculating route for drone ${this.drone.id}`);
        const newRoute = calculateOptimizedRoute(
            this.drone.position,
            currentWaypoint,
            dataStore.getAllNoFlyZones()
        );

        this.drone.route = newRoute;
        this.drone.currentWaypointIndex = 0;
    }

    private handleWaitingForPickup(deltaTime: number) {
        // Hovering at restaurant, waiting for order to be ready
        const drain = calculateIdleDrain(deltaTime) * 1.5; // Hovering uses more battery than idle
        this.drone.battery = Math.max(0, this.drone.battery - drain);
        this.drone.speed = 0;

        // Check if order is ready (simulated with random chance)
        if (Math.random() < 0.02) { // 2% chance per update
            this.pickupOrder();
        }
    }

    private handleDelivering(deltaTime: number) {
        // Landing and delivering
        const drain = calculateIdleDrain(deltaTime);
        this.drone.battery = Math.max(0, this.drone.battery - drain);
        this.drone.speed = 0;

        // Delivery takes 30 seconds
        setTimeout(() => {
            this.completeDelivery();
        }, 30000 / dataStore.simulationState.speed);
    }

    private handleEmergencyLanding(deltaTime: number) {
        // Emergency landing - descending
        if (this.drone.position.altitude > 0) {
            this.drone.position.altitude = Math.max(0, this.drone.position.altitude - 10 * deltaTime);
        } else {
            this.drone.status = DroneStatus.MAINTENANCE;
            this.drone.isAvailable = false;
            this.drone.speed = 0;
        }
    }

    private arrivedAtDestination() {
        switch (this.drone.status) {
            case DroneStatus.FLYING_TO_RESTAURANT:
                this.drone.status = DroneStatus.WAITING_FOR_PICKUP;
                this.drone.speed = 0;
                break;
            case DroneStatus.FLYING_TO_CUSTOMER:
                this.drone.status = DroneStatus.DELIVERING;
                this.drone.speed = 0;
                break;
            case DroneStatus.RETURNING_TO_KIOSK:
                this.returnToKiosk();
                break;
        }
    }

    private pickupOrder() {
        if (!this.drone.currentOrderId) return;

        const order = dataStore.orders.get(this.drone.currentOrderId);
        if (!order) return;

        order.status = OrderStatus.PICKED_UP;
        order.pickupTime = new Date();
        order.timeline.push({
            timestamp: new Date(),
            status: OrderStatus.PICKED_UP,
            description: `Order picked up by ${this.drone.name}`,
        });

        this.drone.currentPayload = order.totalWeight;
        this.drone.status = DroneStatus.FLYING_TO_CUSTOMER;

        // Set route to customer (avoiding no-fly zones)
        const customer = dataStore.customers.get(order.customerId);
        if (customer) {
            this.drone.route = calculateOptimizedRoute(
                this.drone.position,
                order.deliveryAddress,
                Array.from(dataStore.noFlyZones.values())
            );
            this.drone.currentWaypointIndex = 0;
        }
    }

    private completeDelivery() {
        if (!this.drone.currentOrderId) return;

        const order = dataStore.orders.get(this.drone.currentOrderId);
        if (!order) return;

        order.status = OrderStatus.DELIVERED;
        order.actualDeliveryTime = new Date();
        order.timeline.push({
            timestamp: new Date(),
            status: OrderStatus.DELIVERED,
            description: `Order delivered by ${this.drone.name}`,
        });

        this.drone.currentPayload = 0;
        this.drone.currentOrderId = null;
        this.drone.status = DroneStatus.RETURNING_TO_KIOSK;

        // Set route back to kiosk (avoiding no-fly zones)
        const kiosk = dataStore.kiosks.get(this.drone.assignedKioskId);
        if (kiosk) {
            this.drone.route = calculateOptimizedRoute(
                this.drone.position,
                kiosk.position,
                Array.from(dataStore.noFlyZones.values())
            );
            this.drone.currentWaypointIndex = 0;
        }
    }

    private returnToKiosk() {
        this.drone.status = DroneStatus.IDLE;
        this.drone.speed = 0;
        this.drone.isAvailable = true;

        // Check if needs charging
        if (this.drone.battery < 40) {
            this.requestCharging();
        }
    }

    private requestCharging() {
        const kiosk = dataStore.kiosks.get(this.drone.assignedKioskId);
        if (!kiosk) return;

        if (kiosk.availableChargingSlots > 0) {
            this.drone.status = DroneStatus.CHARGING;
            this.drone.isAvailable = false;
            kiosk.availableChargingSlots--;
            kiosk.chargingQueue.push(this.drone.id);
        } else {
            // Add to queue
            if (!kiosk.chargingQueue.includes(this.drone.id)) {
                kiosk.chargingQueue.push(this.drone.id);
            }
        }
    }

    private initiateEmergencyReturn() {
        // Cancel current order if any
        if (this.drone.currentOrderId) {
            const order = dataStore.orders.get(this.drone.currentOrderId);
            if (order) {
                order.status = OrderStatus.FAILED;
                order.timeline.push({
                    timestamp: new Date(),
                    status: OrderStatus.FAILED,
                    description: 'Drone emergency return - low battery',
                });
            }
            this.drone.currentOrderId = null;
            this.drone.currentPayload = 0;
        }

        this.drone.status = DroneStatus.RETURNING_TO_KIOSK;

        // Set direct route to kiosk
        const kiosk = dataStore.kiosks.get(this.drone.assignedKioskId);
        if (kiosk) {
            this.drone.route = calculateOptimizedRoute(
                this.drone.position,
                kiosk.position,
                Array.from(dataStore.noFlyZones.values())
            );
            this.drone.currentWaypointIndex = 0;
        }
    }

    assignOrder(order: Order) {
        if (!this.drone.isAvailable || this.drone.status !== DroneStatus.IDLE) {
            return false;
        }

        // Pre-flight battery validation to ensure delivery can be completed
        const restaurant = dataStore.restaurants.get(order.restaurantId);
        const kiosk = dataStore.kiosks.get(this.drone.assignedKioskId);

        if (!restaurant || !kiosk) {
            return false;
        }

        // Calculate total distance for the complete delivery cycle
        const distanceToRestaurant = calculateDistance(this.drone.position, restaurant.position);
        const distanceToCustomer = calculateDistance(restaurant.position, order.deliveryAddress);
        const distanceBackToKiosk = calculateDistance(order.deliveryAddress, kiosk.position);
        const totalDistance = distanceToRestaurant + distanceToCustomer + distanceBackToKiosk;

        // Get current weather conditions for accurate battery calculations
        const weather = dataStore.simulationState.weatherCondition;
        const weatherImpact = dataStore.simulationState.weatherImpact;

        // Calculate battery drain for the complete mission
        const drainToRestaurant = calculateBatteryDrain(
            this.drone,
            distanceToRestaurant,
            weather,
            weatherImpact
        );
        const drainToCustomer = calculateBatteryDrain(
            { ...this.drone, currentPayload: order.totalWeight },
            distanceToCustomer,
            weather,
            weatherImpact
        );
        const drainBackToKiosk = calculateBatteryDrain(
            this.drone,
            distanceBackToKiosk,
            weather,
            weatherImpact
        );

        // Add battery drain for hovering at restaurant (avg 5 minutes) and delivery (0.5 minutes)
        const hoveringTime = 5 * 60; // 5 minutes in seconds
        const deliveryTime = 30; // 30 seconds
        const hoveringDrain = calculateIdleDrain(hoveringTime / 3600) * 1.5; // Hovering uses 1.5x idle drain
        const deliveryDrain = calculateIdleDrain(deliveryTime / 3600);

        const totalBatteryNeeded = drainToRestaurant + drainToCustomer + drainBackToKiosk + hoveringDrain + deliveryDrain;

        // Add 50% safety margin to account for unexpected conditions, detours, and weather changes
        const safetyMargin = 1.5;
        const requiredBattery = totalBatteryNeeded * safetyMargin;

        // Reject order if drone doesn't have enough battery
        if (this.drone.battery < requiredBattery) {
            console.log(`Drone ${this.drone.id} rejected order ${order.id}: insufficient battery (has ${this.drone.battery.toFixed(1)}%, needs ${requiredBattery.toFixed(1)}%)`);
            return false;
        }

        // Also reject if battery is below 60% (conservative threshold for mission reliability)
        if (this.drone.battery < 60) {
            console.log(`Drone ${this.drone.id} rejected order ${order.id}: battery too low (${this.drone.battery.toFixed(1)}%)`);
            return false;
        }

        this.drone.currentOrderId = order.id;
        this.drone.status = DroneStatus.FLYING_TO_RESTAURANT;
        this.drone.isAvailable = false;

        order.assignedDroneId = this.drone.id;
        order.status = OrderStatus.ASSIGNED;

        // Calculate estimated delivery time based on total distance and drone speed
        const avgDroneSpeed = 60; // km/h (average speed considering acceleration, deceleration, etc.)
        const totalMissionTime = (totalDistance / avgDroneSpeed) * 60; // Convert to minutes
        const preparationTime = 5; // Average restaurant preparation time in minutes
        const estimatedTotalTime = totalMissionTime + preparationTime;

        order.estimatedDeliveryTime = new Date(Date.now() + estimatedTotalTime * 60000); // Convert minutes to ms

        order.timeline.push({
            timestamp: new Date(),
            status: OrderStatus.ASSIGNED,
            description: `Assigned to ${this.drone.name} - ETA: ${Math.round(estimatedTotalTime)} min`,
        });

        // Set route to restaurant with altitude layering and no-fly zone avoidance
        if (restaurant) {
            // Calculate altitude based on flight direction
            const flightAltitude = calculateFlightAltitude(this.drone.position, restaurant.position);
            const restaurantPosition = { ...restaurant.position, altitude: flightAltitude };

            // Create optimized route avoiding no-fly zones
            this.drone.route = calculateOptimizedRoute(
                this.drone.position,
                restaurantPosition,
                Array.from(dataStore.noFlyZones.values())
            );
            this.drone.currentWaypointIndex = 0;
        }

        return true;
    }

    forceReturn() {
        this.initiateEmergencyReturn();
    }

    emergencyLand() {
        this.drone.status = DroneStatus.EMERGENCY_LANDING;
        this.drone.route = [];
        this.drone.currentWaypointIndex = 0;
    }
}
