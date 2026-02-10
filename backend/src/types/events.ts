// WebSocket event type definitions

import type {
    Drone,
    Order,
    Alert,
    KPIMetrics,
    EventLog,
    ScenarioType,
    WeatherCondition,
    Position,
} from './entities.js';

// Client to Server events
export interface ClientToServerEvents {
    'simulation:start': () => void;
    'simulation:pause': () => void;
    'simulation:resume': () => void;
    'simulation:speed': (speed: number) => void;
    'simulation:scenario': (scenario: ScenarioType) => void;
    'drone:command': (data: { droneId: string; command: 'return' | 'emergency_land' | 'pause' }) => void;
    'order:create': (orderData: {
        restaurantId: string;
        customerId: string;
        items: any[];
        priority: string;
    }) => void;
    'weather:update': (impact: number) => void;
    'auth:login': (credentials: { username: string; password: string }) => void;
}

// Server to Client events
export interface ServerToClientEvents {
    'drone:update': (drones: Drone[]) => void;
    'drone:single': (drone: Drone) => void;
    'order:update': (order: Order) => void;
    'order:batch': (orders: Order[]) => void;
    'kpi:update': (metrics: KPIMetrics) => void;
    'alert:new': (alert: Alert) => void;
    'event:log': (event: EventLog) => void;
    'simulation:state': (state: {
        isRunning: boolean;
        speed: number;
        scenario: ScenarioType;
        weather: WeatherCondition;
        weatherImpact: number;
    }) => void;
    'auth:success': (user: { id: string; username: string; role: string }) => void;
    'auth:error': (message: string) => void;
}

export interface InterServerEvents {
    ping: () => void;
}

export interface SocketData {
    userId?: string;
    role?: string;
}
