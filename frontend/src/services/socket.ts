// Socket.IO client service

import { io, Socket } from 'socket.io-client';
import type { Drone, Order, Alert, KPIMetrics, EventLog, ScenarioType } from '../types';
import { API_CONFIG } from '../config/api';

const SOCKET_URL = API_CONFIG.BACKEND_URL;

class SocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, Set<Function>> = new Map();

    connect() {
        if (this.socket?.connected) return;

        this.socket = io(SOCKET_URL, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
            console.log('✅ Connected to server');
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Disconnected from server');
        });

        // Setup event listeners
        this.socket.on('drone:update', (drones: Drone[]) => {
            this.emit('drone:update', drones);
        });

        this.socket.on('drone:single', (drone: Drone) => {
            this.emit('drone:single', drone);
        });

        this.socket.on('order:update', (order: Order) => {
            this.emit('order:update', order);
        });

        this.socket.on('order:batch', (orders: Order[]) => {
            this.emit('order:batch', orders);
        });

        this.socket.on('kpi:update', (metrics: KPIMetrics) => {
            this.emit('kpi:update', metrics);
        });

        this.socket.on('alert:new', (alert: Alert) => {
            this.emit('alert:new', alert);
        });

        this.socket.on('event:log', (event: EventLog) => {
            this.emit('event:log', event);
        });

        this.socket.on('simulation:state', (state: any) => {
            this.emit('simulation:state', state);
        });

        this.socket.on('auth:success', (user: any) => {
            this.emit('auth:success', user);
        });

        this.socket.on('auth:error', (message: string) => {
            this.emit('auth:error', message);
        });
    }

    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
    }

    // Event emitter pattern
    on(event: string, callback: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);
    }

    off(event: string, callback: Function) {
        this.listeners.get(event)?.delete(callback);
    }

    private emit(event: string, data: any) {
        this.listeners.get(event)?.forEach(callback => callback(data));
    }

    // Simulation controls
    startSimulation() {
        this.socket?.emit('simulation:start');
    }

    pauseSimulation() {
        this.socket?.emit('simulation:pause');
    }

    resumeSimulation() {
        this.socket?.emit('simulation:resume');
    }

    setSimulationSpeed(speed: number) {
        this.socket?.emit('simulation:speed', speed);
    }

    setScenario(scenario: ScenarioType) {
        this.socket?.emit('simulation:scenario', scenario);
    }

    setWeatherImpact(impact: number) {
        this.socket?.emit('weather:update', impact);
    }

    // Drone commands
    sendDroneCommand(droneId: string, command: 'return' | 'emergency_land' | 'pause') {
        this.socket?.emit('drone:command', { droneId, command });
    }

    // Order creation
    createOrder(orderData: any) {
        this.socket?.emit('order:create', orderData);
    }

    // Authentication
    login(username: string, password: string) {
        this.socket?.emit('auth:login', { username, password });
    }
}

export const socketService = new SocketService();
