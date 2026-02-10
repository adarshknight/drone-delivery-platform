// Core entity type definitions for the drone delivery platform

export interface Position {
    lat: number;
    lng: number;
    altitude: number; // meters above ground
}

export enum DroneStatus {
    IDLE = 'IDLE',
    CHARGING = 'CHARGING',
    FLYING_TO_RESTAURANT = 'FLYING_TO_RESTAURANT',
    WAITING_FOR_PICKUP = 'WAITING_FOR_PICKUP',
    FLYING_TO_CUSTOMER = 'FLYING_TO_CUSTOMER',
    DELIVERING = 'DELIVERING',
    RETURNING_TO_KIOSK = 'RETURNING_TO_KIOSK',
    EMERGENCY_LANDING = 'EMERGENCY_LANDING',
    MAINTENANCE = 'MAINTENANCE',
}

export enum OrderStatus {
    PENDING = 'PENDING',
    ASSIGNED = 'ASSIGNED',
    PICKED_UP = 'PICKED_UP',
    IN_TRANSIT = 'IN_TRANSIT',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
    FAILED = 'FAILED',
}

export enum OrderPriority {
    LOW = 'LOW',
    NORMAL = 'NORMAL',
    HIGH = 'HIGH',
    URGENT = 'URGENT',
}

export enum AlertType {
    LOW_BATTERY = 'LOW_BATTERY',
    NO_FLY_ZONE_VIOLATION = 'NO_FLY_ZONE_VIOLATION',
    DELAYED_ORDER = 'DELAYED_ORDER',
    EMERGENCY_LANDING = 'EMERGENCY_LANDING',
    MAINTENANCE_REQUIRED = 'MAINTENANCE_REQUIRED',
    WEATHER_WARNING = 'WEATHER_WARNING',
    COLLISION_RISK = 'COLLISION_RISK',
    SYSTEM = 'SYSTEM',
}

export enum AlertSeverity {
    INFO = 'INFO',
    WARNING = 'WARNING',
    CRITICAL = 'CRITICAL',
}

export enum WeatherCondition {
    CLEAR = 'CLEAR',
    LIGHT_RAIN = 'LIGHT_RAIN',
    HEAVY_RAIN = 'HEAVY_RAIN',
    STRONG_WIND = 'STRONG_WIND',
    STORM = 'STORM',
}

export enum UserRole {
    ADMIN = 'ADMIN',
    RESTAURANT_OPERATOR = 'RESTAURANT_OPERATOR',
    KIOSK_OPERATOR = 'KIOSK_OPERATOR',
}

export interface Drone {
    id: string;
    name: string;
    status: DroneStatus;
    position: Position;
    battery: number; // 0-100
    maxBatteryCapacity: number; // mAh
    speed: number; // km/h
    maxSpeed: number; // km/h
    maxRange: number; // km
    maxPayload: number; // kg
    currentPayload: number; // kg
    assignedKioskId: string;
    currentOrderId: string | null;
    route: Position[]; // waypoints
    currentWaypointIndex: number;
    totalFlightTime: number; // hours
    totalDistance: number; // km
    lastMaintenanceDate: Date;
    isAvailable: boolean;
}

export interface Kiosk {
    id: string;
    name: string;
    position: Position;
    capacity: number; // max drones
    currentDrones: string[]; // drone IDs
    chargingSlots: number;
    availableChargingSlots: number;
    chargingQueue: string[]; // drone IDs waiting to charge
    coverageRadius: number; // km
    isOperational: boolean;
}

export interface Restaurant {
    id: string;
    name: string;
    position: Position;
    cuisine: string;
    averagePrepTime: number; // minutes
    currentOrders: string[]; // order IDs
    rating: number; // 0-5
    isOpen: boolean;
    operatorId?: string;
}

export interface Customer {
    id: string;
    name: string;
    position: Position;
    phone: string;
    orderHistory: string[]; // order IDs
}

export interface Order {
    id: string;
    customerId: string;
    restaurantId: string;
    assignedDroneId: string | null;
    status: OrderStatus;
    priority: OrderPriority;
    items: OrderItem[];
    totalWeight: number; // kg
    totalPrice: number;
    createdAt: Date;
    estimatedPrepTime: number; // minutes
    estimatedDeliveryTime: Date | null;
    actualDeliveryTime: Date | null;
    pickupTime: Date | null;
    timeline: OrderEvent[];
    deliveryAddress: Position;
}

export interface OrderItem {
    name: string;
    quantity: number;
    weight: number; // kg
    price: number;
}

export interface OrderEvent {
    timestamp: Date;
    status: OrderStatus;
    description: string;
}

export interface NoFlyZone {
    id: string;
    name: string;
    polygon: Position[]; // boundary points
    severity: AlertSeverity;
    reason: string;
    isActive: boolean;
}

export interface Alert {
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    message: string;
    timestamp: Date;
    relatedEntityId: string | null; // drone, order, or kiosk ID
    isResolved: boolean;
    resolvedAt: Date | null;
}

export interface EventLog {
    id: string;
    timestamp: Date;
    type: 'ORDER' | 'DRONE' | 'ALERT' | 'SYSTEM';
    severity: AlertSeverity;
    description: string;
    metadata: Record<string, any>;
}

export interface SimulationState {
    isRunning: boolean;
    speed: number; // 0.5x, 1x, 2x, 5x
    currentScenario: ScenarioType;
    weatherCondition: WeatherCondition;
    weatherImpact: number; // 0-100 (slider value)
    startTime: Date;
    elapsedTime: number; // seconds
}

export enum ScenarioType {
    NORMAL = 'NORMAL',
    PEAK_HOUR = 'PEAK_HOUR',
    BAD_WEATHER = 'BAD_WEATHER',
}

export interface Scenario {
    type: ScenarioType;
    name: string;
    description: string;
    parameters: {
        orderFrequency: number; // orders per minute
        activeDrones: number;
        weatherCondition: WeatherCondition;
        speedMultiplier: number;
        batteryDrainMultiplier: number;
        failureRate: number; // 0-1
    };
}

export interface KPIMetrics {
    totalDrones: number;
    activeDrones: number;
    idleDrones: number;
    chargingDrones: number;
    ordersToday: number;
    ordersInProgress: number;
    ordersCompleted: number;
    ordersCancelled: number;
    onTimeDeliveryRate: number; // percentage
    averageDeliveryTime: number; // minutes
    totalAlerts: number;
    criticalAlerts: number;
    totalRevenue: number;
    averageBatteryLevel: number; // percentage
}

export interface RouteComparison {
    orderId: string;
    optimizedRoute: Position[];
    directRoute: Position[];
    optimizedDistance: number; // km
    directDistance: number; // km
    distanceSaved: number; // km
    timeSaved: number; // minutes
    batterySaved: number; // percentage
}

export interface User {
    id: string;
    username: string;
    role: UserRole;
    assignedEntityId?: string; // restaurant or kiosk ID
}
