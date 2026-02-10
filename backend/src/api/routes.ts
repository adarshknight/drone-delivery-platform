// REST API routes

import express from 'express';
import { dataStore } from '../data/store.js';
import { simulationEngine } from '../simulation/engine.js';
import { weatherService } from '../services/weather-service.js';

const router = express.Router();

// Get all drones
router.get('/drones', (req, res) => {
    res.json(dataStore.getAllDrones());
});

// Get single drone
router.get('/drones/:id', (req, res) => {
    const drone = dataStore.drones.get(req.params.id);
    if (!drone) {
        return res.status(404).json({ error: 'Drone not found' });
    }
    res.json(drone);
});

// Get all kiosks
router.get('/kiosks', (req, res) => {
    res.json(dataStore.getAllKiosks());
});

// Get all restaurants
router.get('/restaurants', (req, res) => {
    res.json(dataStore.getAllRestaurants());
});

// Get all customers
router.get('/customers', (req, res) => {
    res.json(dataStore.getAllCustomers());
});

// Get all orders
router.get('/orders', (req, res) => {
    res.json(dataStore.getAllOrders());
});

// Get single order
router.get('/orders/:id', (req, res) => {
    const order = dataStore.orders.get(req.params.id);
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
});

// Get all no-fly zones
router.get('/no-fly-zones', (req, res) => {
    res.json(dataStore.getAllNoFlyZones());
});

// Get all alerts
router.get('/alerts', (req, res) => {
    res.json(dataStore.getAllAlerts());
});

// Get event logs
router.get('/events', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 100;
    res.json(dataStore.getRecentEventLogs(limit));
});

// Get KPI metrics
router.get('/kpi', (req, res) => {
    res.json(simulationEngine.calculateKPIMetrics());
});

// Get simulation state
router.get('/simulation/state', (req, res) => {
    res.json(dataStore.simulationState);
});

// Create order
router.post('/orders', (req, res) => {
    try {
        const { restaurantId, customerId, items, priority } = req.body;
        const order = simulationEngine.createOrder(restaurantId, customerId, items, priority);
        res.json(order);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Get current weather (from simulation)
router.get('/weather', async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat as string) || 28.6139; // Default to Delhi
        const lon = parseFloat(req.query.lon as string) || 77.2090;

        // Import dynamically to avoid circular dependencies
        const { getCurrentSimulationWeather } = await import('../services/simulation-weather-converter.js');
        const weather = getCurrentSimulationWeather(lat, lon);

        res.json(weather);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get flight restrictions based on simulation weather
router.get('/weather/restrictions', async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat as string) || 28.6139;
        const lon = parseFloat(req.query.lon as string) || 77.2090;

        // Import dynamically to avoid circular dependencies
        const {
            getCurrentSimulationWeather,
            getSimulationFlightRestrictions,
            getSimulationWeatherImpact
        } = await import('../services/simulation-weather-converter.js');

        const weather = getCurrentSimulationWeather(lat, lon);
        const restrictions = getSimulationFlightRestrictions(weather);
        const impact = getSimulationWeatherImpact(weather);

        res.json({ weather, restrictions, impact });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// AI Route Optimization Endpoints

// Optimize route using AI
router.get('/routes/optimize', async (req, res) => {
    try {
        const fromLat = parseFloat(req.query.fromLat as string);
        const fromLng = parseFloat(req.query.fromLng as string);
        const toLat = parseFloat(req.query.toLat as string);
        const toLng = parseFloat(req.query.toLng as string);
        const droneId = req.query.droneId as string;

        if (!fromLat || !fromLng || !toLat || !toLng) {
            return res.status(400).json({ error: 'Missing coordinates' });
        }

        const { aiRouteOptimizer } = await import('../services/ai-route-optimizer.js');
        const { getCurrentSimulationWeather } = await import('../services/simulation-weather-converter.js');

        const start = { lat: fromLat, lng: fromLng, altitude: 0 };
        const end = { lat: toLat, lng: toLng, altitude: 0 };

        // Get drone battery level
        let batteryLevel = 80;
        if (droneId) {
            const drone = dataStore.drones.get(droneId);
            if (drone) batteryLevel = drone.battery;
        }

        // Get current weather
        const weather = getCurrentSimulationWeather(fromLat, fromLng);

        const constraints = {
            batteryLevel,
            maxDistance: 15,
            weatherConditions: {
                windSpeed: weather.windSpeed,
                precipitation: weather.precipitation,
                temperature: weather.temperature
            },
            avoidNoFlyZones: true
        };

        const optimizedRoute = await aiRouteOptimizer.optimizeRoute(start, end, constraints);
        res.json(optimizedRoute);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Compare optimized vs direct route
router.get('/routes/compare', async (req, res) => {
    try {
        const fromLat = parseFloat(req.query.fromLat as string);
        const fromLng = parseFloat(req.query.fromLng as string);
        const toLat = parseFloat(req.query.toLat as string);
        const toLng = parseFloat(req.query.toLng as string);
        const droneId = req.query.droneId as string;

        if (!fromLat || !fromLng || !toLat || !toLng) {
            return res.status(400).json({ error: 'Missing coordinates' });
        }

        const { aiRouteOptimizer } = await import('../services/ai-route-optimizer.js');
        const { getCurrentSimulationWeather } = await import('../services/simulation-weather-converter.js');

        const start = { lat: fromLat, lng: fromLng, altitude: 0 };
        const end = { lat: toLat, lng: toLng, altitude: 0 };

        let batteryLevel = 80;
        if (droneId) {
            const drone = dataStore.drones.get(droneId);
            if (drone) batteryLevel = drone.battery;
        }

        const weather = getCurrentSimulationWeather(fromLat, fromLng);

        const constraints = {
            batteryLevel,
            maxDistance: 15,
            weatherConditions: {
                windSpeed: weather.windSpeed,
                precipitation: weather.precipitation,
                temperature: weather.temperature
            },
            avoidNoFlyZones: true
        };

        const comparison = await aiRouteOptimizer.compareRoutes(start, end, constraints);
        res.json(comparison);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Train AI model
router.post('/routes/train', async (req, res) => {
    try {
        const { aiRouteOptimizer } = await import('../services/ai-route-optimizer.js');
        const epochs = parseInt(req.body.epochs as string) || 50;

        // Start training asynchronously
        aiRouteOptimizer.trainModel(epochs).catch(err => {
            console.error('Training error:', err);
        });

        res.json({ message: 'Training started', epochs });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get model training status
router.get('/routes/model/status', async (req, res) => {
    try {
        const { aiRouteOptimizer } = await import('../services/ai-route-optimizer.js');
        const status = aiRouteOptimizer.getStatus();
        res.json(status);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;

