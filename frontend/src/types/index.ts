// Shared types for frontend (matching backend)

export interface Position {
    lat: number;
    lng: number;
    altitude: number;
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

export enum ScenarioType {
    NORMAL = 'NORMAL',
    PEAK_HOUR = 'PEAK_HOUR',
    BAD_WEATHER = 'BAD_WEATHER',
}

export interface Drone {
    id: string;
    name: string;
    status: DroneStatus;
    position: Position;
    battery: number;
    maxBatteryCapacity: number;
    speed: number;
    maxSpeed: number;
    maxRange: number;
    maxPayload: number;
    currentPayload: number;
    assignedKioskId: string;
    currentOrderId: string | null;
    route: Position[];
    currentWaypointIndex: number;
    totalFlightTime: number;
    totalDistance: number;
    lastMaintenanceDate: Date;
    isAvailable: boolean;
}

export interface Kiosk {
    id: string;
    name: string;
    position: Position;
    capacity: number;
    currentDrones: string[];
    chargingSlots: number;
    availableChargingSlots: number;
    chargingQueue: string[];
    coverageRadius: number;
    isOperational: boolean;
}

export interface Restaurant {
    id: string;
    name: string;
    position: Position;
    cuisine: string;
    averagePrepTime: number;
    currentOrders: string[];
    rating: number;
    isOpen: boolean;
    operatorId?: string;
}

export interface Customer {
    id: string;
    name: string;
    position: Position;
    phone: string;
    orderHistory: string[];
}

export interface OrderItem {
    name: string;
    quantity: number;
    weight: number;
    price: number;
}

export interface OrderEvent {
    timestamp: Date;
    status: OrderStatus;
    description: string;
}

export interface Order {
    id: string;
    customerId: string;
    restaurantId: string;
    assignedDroneId: string | null;
    status: OrderStatus;
    priority: OrderPriority;
    items: OrderItem[];
    totalWeight: number;
    totalPrice: number;
    createdAt: Date;
    estimatedPrepTime: number;
    estimatedDeliveryTime: Date | null;
    actualDeliveryTime: Date | null;
    pickupTime: Date | null;
    timeline: OrderEvent[];
    deliveryAddress: Position;
}

export interface NoFlyZone {
    id: string;
    name: string;
    polygon: Position[];
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
    relatedEntityId: string | null;
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

export interface KPIMetrics {
    totalDrones: number;
    activeDrones: number;
    idleDrones: number;
    chargingDrones: number;
    ordersToday: number;
    ordersInProgress: number;
    ordersCompleted: number;
    ordersCancelled: number;
    onTimeDeliveryRate: number;
    averageDeliveryTime: number;
    totalAlerts: number;
    criticalAlerts: number;
    totalRevenue: number;
    averageBatteryLevel: number;
}

export interface User {
    id: string;
    username: string;
    role: UserRole;
    assignedEntityId?: string;
}
