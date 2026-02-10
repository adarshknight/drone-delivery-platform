// WebSocket handlers using Socket.IO

import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '../types/events.js';
import { simulationEngine } from '../simulation/engine.js';
import { dataStore } from '../data/store.js';
import { OrderPriority } from '../types/entities.js';

export function setupWebSocket(httpServer: HTTPServer) {
    const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Send initial data
        socket.emit('drone:update', dataStore.getAllDrones());
        socket.emit('order:batch', dataStore.getAllOrders());
        socket.emit('kpi:update', simulationEngine.calculateKPIMetrics());
        socket.emit('simulation:state', {
            isRunning: dataStore.simulationState.isRunning,
            speed: dataStore.simulationState.speed,
            scenario: dataStore.simulationState.currentScenario,
            weather: dataStore.simulationState.weatherCondition,
            weatherImpact: dataStore.simulationState.weatherImpact,
        });

        // Simulation control handlers
        socket.on('simulation:start', () => {
            simulationEngine.start((data) => {
                // Broadcast updates to all clients
                if (data.drones) {
                    io.emit('drone:update', data.drones);
                }
                if (data.orders) {
                    io.emit('order:batch', data.orders);
                }
                if (data.kpi) {
                    io.emit('kpi:update', data.kpi);
                }
                if (data.alert) {
                    io.emit('alert:new', data.alert);
                }
            });

            io.emit('simulation:state', {
                isRunning: true,
                speed: dataStore.simulationState.speed,
                scenario: dataStore.simulationState.currentScenario,
                weather: dataStore.simulationState.weatherCondition,
                weatherImpact: dataStore.simulationState.weatherImpact,
            });
        });

        socket.on('simulation:pause', () => {
            simulationEngine.pause();
            io.emit('simulation:state', {
                isRunning: false,
                speed: dataStore.simulationState.speed,
                scenario: dataStore.simulationState.currentScenario,
                weather: dataStore.simulationState.weatherCondition,
                weatherImpact: dataStore.simulationState.weatherImpact,
            });
        });

        socket.on('simulation:resume', () => {
            simulationEngine.resume();
            io.emit('simulation:state', {
                isRunning: true,
                speed: dataStore.simulationState.speed,
                scenario: dataStore.simulationState.currentScenario,
                weather: dataStore.simulationState.weatherCondition,
                weatherImpact: dataStore.simulationState.weatherImpact,
            });
        });

        socket.on('simulation:speed', (speed) => {
            simulationEngine.setSpeed(speed);
            io.emit('simulation:state', {
                isRunning: dataStore.simulationState.isRunning,
                speed: speed,
                scenario: dataStore.simulationState.currentScenario,
                weather: dataStore.simulationState.weatherCondition,
                weatherImpact: dataStore.simulationState.weatherImpact,
            });
        });

        socket.on('simulation:scenario', (scenario) => {
            simulationEngine.setScenario(scenario);
            io.emit('simulation:state', {
                isRunning: dataStore.simulationState.isRunning,
                speed: dataStore.simulationState.speed,
                scenario: scenario,
                weather: dataStore.simulationState.weatherCondition,
                weatherImpact: dataStore.simulationState.weatherImpact,
            });
        });

        socket.on('weather:update', (impact) => {
            simulationEngine.setWeatherImpact(impact);
            io.emit('simulation:state', {
                isRunning: dataStore.simulationState.isRunning,
                speed: dataStore.simulationState.speed,
                scenario: dataStore.simulationState.currentScenario,
                weather: dataStore.simulationState.weatherCondition,
                weatherImpact: impact,
            });
        });

        // Drone command handlers
        socket.on('drone:command', ({ droneId, command }) => {
            console.log(`🎮 Received command "${command}" for drone ${droneId}`);
            const controller = simulationEngine.getDroneController(droneId);
            if (!controller) {
                console.log(`❌ Controller not found for drone ${droneId}`);
                return;
            }

            switch (command) {
                case 'return':
                    console.log(`✈️ Forcing drone ${droneId} to return`);
                    controller.forceReturn();
                    break;
                case 'emergency_land':
                    console.log(`🚨 Emergency landing drone ${droneId}`);
                    controller.emergencyLand();
                    break;
            }

            const drone = dataStore.drones.get(droneId);
            if (drone) {
                console.log(`📡 Emitting updated drone state: ${drone.status}`);
                io.emit('drone:single', drone);
            }
        });

        // Order creation handler
        socket.on('order:create', (orderData) => {
            try {
                const order = simulationEngine.createOrder(
                    orderData.restaurantId,
                    orderData.customerId,
                    orderData.items,
                    orderData.priority as OrderPriority
                );
                io.emit('order:update', order);
            } catch (error) {
                console.error('Error creating order:', error);
            }
        });

        // Authentication handler (simple mock)
        socket.on('auth:login', ({ username, password }) => {
            const user = Array.from(dataStore.users.values()).find(u => u.username === username);
            if (user) {
                socket.data.userId = user.id;
                socket.data.role = user.role;
                socket.emit('auth:success', {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                });
            } else {
                socket.emit('auth:error', 'Invalid credentials');
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    // Periodic KPI updates (every 2 seconds)
    setInterval(() => {
        if (dataStore.simulationState.isRunning) {
            io.emit('kpi:update', simulationEngine.calculateKPIMetrics());
        }
    }, 2000);

    return io;
}
