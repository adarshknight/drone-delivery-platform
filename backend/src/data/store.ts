// In-memory data store for the simulation

import {
    DroneStatus,
    OrderStatus,
    OrderPriority,
    AlertType,
    AlertSeverity,
    WeatherCondition,
    ScenarioType,
    UserRole,
} from '../types/entities.js';
import type {
    Drone,
    Kiosk,
    Restaurant,
    Customer,
    Order,
    NoFlyZone,
    Alert,
    EventLog,
    SimulationState,
    User,
    Position,
} from '../types/entities.js';

class DataStore {
    drones: Map<string, Drone> = new Map();
    kiosks: Map<string, Kiosk> = new Map();
    restaurants: Map<string, Restaurant> = new Map();
    customers: Map<string, Customer> = new Map();
    orders: Map<string, Order> = new Map();
    noFlyZones: Map<string, NoFlyZone> = new Map();
    alerts: Map<string, Alert> = new Map();
    eventLogs: EventLog[] = [];
    users: Map<string, User> = new Map();

    simulationState: SimulationState = {
        isRunning: false,
        speed: 1,
        currentScenario: ScenarioType.NORMAL,
        weatherCondition: WeatherCondition.CLEAR,
        weatherImpact: 0,
        startTime: new Date(),
        elapsedTime: 0,
    };

    constructor() {
        this.initializeMockData();
    }

    private initializeMockData() {
        // Initialize Kiosks (Drone Stations) - 30 locations across Delhi NCR
        const kiosks: Kiosk[] = [
            // Central Delhi
            { id: 'kiosk-1', name: 'Connaught Place Hub', position: { lat: 28.6139, lng: 77.2090, altitude: 0 }, capacity: 15, currentDrones: [], chargingSlots: 8, availableChargingSlots: 8, chargingQueue: [], coverageRadius: 5, isOperational: true },
            { id: 'kiosk-2', name: 'Chandni Chowk Station', position: { lat: 28.6506, lng: 77.2303, altitude: 0 }, capacity: 12, currentDrones: [], chargingSlots: 6, availableChargingSlots: 6, chargingQueue: [], coverageRadius: 4, isOperational: true },
            { id: 'kiosk-3', name: 'India Gate Hub', position: { lat: 28.6129, lng: 77.2295, altitude: 0 }, capacity: 10, currentDrones: [], chargingSlots: 5, availableChargingSlots: 5, chargingQueue: [], coverageRadius: 4, isOperational: true },

            // North Delhi
            { id: 'kiosk-4', name: 'Rohini Station', position: { lat: 28.7041, lng: 77.1025, altitude: 0 }, capacity: 12, currentDrones: [], chargingSlots: 6, availableChargingSlots: 6, chargingQueue: [], coverageRadius: 4, isOperational: true },
            { id: 'kiosk-5', name: 'Pitampura Hub', position: { lat: 28.6942, lng: 77.1314, altitude: 0 }, capacity: 10, currentDrones: [], chargingSlots: 5, availableChargingSlots: 5, chargingQueue: [], coverageRadius: 3, isOperational: true },
            { id: 'kiosk-6', name: 'Model Town Station', position: { lat: 28.7196, lng: 77.1910, altitude: 0 }, capacity: 8, currentDrones: [], chargingSlots: 4, availableChargingSlots: 4, chargingQueue: [], coverageRadius: 3, isOperational: true },
            { id: 'kiosk-7', name: 'Shalimar Bagh Hub', position: { lat: 28.7196, lng: 77.1538, altitude: 0 }, capacity: 10, currentDrones: [], chargingSlots: 5, availableChargingSlots: 5, chargingQueue: [], coverageRadius: 4, isOperational: true },

            // South Delhi
            { id: 'kiosk-8', name: 'Saket Station', position: { lat: 28.5244, lng: 77.2066, altitude: 0 }, capacity: 12, currentDrones: [], chargingSlots: 6, availableChargingSlots: 6, chargingQueue: [], coverageRadius: 5, isOperational: true },
            { id: 'kiosk-9', name: 'Hauz Khas Hub', position: { lat: 28.5494, lng: 77.2001, altitude: 0 }, capacity: 10, currentDrones: [], chargingSlots: 5, availableChargingSlots: 5, chargingQueue: [], coverageRadius: 4, isOperational: true },
            { id: 'kiosk-10', name: 'Greater Kailash Station', position: { lat: 28.5494, lng: 77.2428, altitude: 0 }, capacity: 8, currentDrones: [], chargingSlots: 4, availableChargingSlots: 4, chargingQueue: [], coverageRadius: 3, isOperational: true },
            { id: 'kiosk-11', name: 'Nehru Place Hub', position: { lat: 28.5494, lng: 77.2501, altitude: 0 }, capacity: 12, currentDrones: [], chargingSlots: 6, availableChargingSlots: 6, chargingQueue: [], coverageRadius: 4, isOperational: true },

            // East Delhi
            { id: 'kiosk-12', name: 'Laxmi Nagar Station', position: { lat: 28.6357, lng: 77.2767, altitude: 0 }, capacity: 10, currentDrones: [], chargingSlots: 5, availableChargingSlots: 5, chargingQueue: [], coverageRadius: 4, isOperational: true },
            { id: 'kiosk-13', name: 'Preet Vihar Hub', position: { lat: 28.6428, lng: 77.2950, altitude: 0 }, capacity: 8, currentDrones: [], chargingSlots: 4, availableChargingSlots: 4, chargingQueue: [], coverageRadius: 3, isOperational: true },
            { id: 'kiosk-14', name: 'Mayur Vihar Station', position: { lat: 28.6082, lng: 77.2989, altitude: 0 }, capacity: 10, currentDrones: [], chargingSlots: 5, availableChargingSlots: 5, chargingQueue: [], coverageRadius: 4, isOperational: true },

            // West Delhi
            { id: 'kiosk-15', name: 'Rajouri Garden Hub', position: { lat: 28.6412, lng: 77.1214, altitude: 0 }, capacity: 10, currentDrones: [], chargingSlots: 5, availableChargingSlots: 5, chargingQueue: [], coverageRadius: 4, isOperational: true },
            { id: 'kiosk-16', name: 'Janakpuri Station', position: { lat: 28.6219, lng: 77.0855, altitude: 0 }, capacity: 8, currentDrones: [], chargingSlots: 4, availableChargingSlots: 4, chargingQueue: [], coverageRadius: 3, isOperational: true },
            { id: 'kiosk-17', name: 'Dwarka Hub', position: { lat: 28.5921, lng: 77.0460, altitude: 0 }, capacity: 12, currentDrones: [], chargingSlots: 6, availableChargingSlots: 6, chargingQueue: [], coverageRadius: 5, isOperational: true },
            { id: 'kiosk-18', name: 'Vikaspuri Station', position: { lat: 28.6417, lng: 77.0656, altitude: 0 }, capacity: 8, currentDrones: [], chargingSlots: 4, availableChargingSlots: 4, chargingQueue: [], coverageRadius: 3, isOperational: true },

            // Noida
            { id: 'kiosk-19', name: 'Sector 18 Noida Hub', position: { lat: 28.5677, lng: 77.3210, altitude: 0 }, capacity: 15, currentDrones: [], chargingSlots: 8, availableChargingSlots: 8, chargingQueue: [], coverageRadius: 5, isOperational: true },
            { id: 'kiosk-20', name: 'Sector 62 Station', position: { lat: 28.6082, lng: 77.3648, altitude: 0 }, capacity: 10, currentDrones: [], chargingSlots: 5, availableChargingSlots: 5, chargingQueue: [], coverageRadius: 4, isOperational: true },
            { id: 'kiosk-21', name: 'Greater Noida Hub', position: { lat: 28.4744, lng: 77.5040, altitude: 0 }, capacity: 12, currentDrones: [], chargingSlots: 6, availableChargingSlots: 6, chargingQueue: [], coverageRadius: 5, isOperational: true },

            // Gurgaon
            { id: 'kiosk-22', name: 'Cyber City Hub', position: { lat: 28.4950, lng: 77.0890, altitude: 0 }, capacity: 15, currentDrones: [], chargingSlots: 8, availableChargingSlots: 8, chargingQueue: [], coverageRadius: 5, isOperational: true },
            { id: 'kiosk-23', name: 'MG Road Station', position: { lat: 28.4595, lng: 77.0266, altitude: 0 }, capacity: 12, currentDrones: [], chargingSlots: 6, availableChargingSlots: 6, chargingQueue: [], coverageRadius: 4, isOperational: true },
            { id: 'kiosk-24', name: 'Sohna Road Hub', position: { lat: 28.4089, lng: 77.0507, altitude: 0 }, capacity: 10, currentDrones: [], chargingSlots: 5, availableChargingSlots: 5, chargingQueue: [], coverageRadius: 4, isOperational: true },

            // Airport Area
            { id: 'kiosk-25', name: 'IGI Airport Hub', position: { lat: 28.5562, lng: 77.1000, altitude: 0 }, capacity: 15, currentDrones: [], chargingSlots: 8, availableChargingSlots: 8, chargingQueue: [], coverageRadius: 5, isOperational: true },
            { id: 'kiosk-26', name: 'Aerocity Station', position: { lat: 28.5562, lng: 77.1200, altitude: 0 }, capacity: 12, currentDrones: [], chargingSlots: 6, availableChargingSlots: 6, chargingQueue: [], coverageRadius: 4, isOperational: true },

            // Faridabad
            { id: 'kiosk-27', name: 'Faridabad Sector 16 Hub', position: { lat: 28.4089, lng: 77.3178, altitude: 0 }, capacity: 10, currentDrones: [], chargingSlots: 5, availableChargingSlots: 5, chargingQueue: [], coverageRadius: 4, isOperational: true },
            { id: 'kiosk-28', name: 'NIT Faridabad Station', position: { lat: 28.3670, lng: 77.3178, altitude: 0 }, capacity: 8, currentDrones: [], chargingSlots: 4, availableChargingSlots: 4, chargingQueue: [], coverageRadius: 3, isOperational: true },

            // Ghaziabad
            { id: 'kiosk-29', name: 'Vaishali Hub', position: { lat: 28.6507, lng: 77.3410, altitude: 0 }, capacity: 10, currentDrones: [], chargingSlots: 5, availableChargingSlots: 5, chargingQueue: [], coverageRadius: 4, isOperational: true },
            { id: 'kiosk-30', name: 'Indirapuram Station', position: { lat: 28.6419, lng: 77.3750, altitude: 0 }, capacity: 12, currentDrones: [], chargingSlots: 6, availableChargingSlots: 6, chargingQueue: [], coverageRadius: 4, isOperational: true },
        ];
        kiosks.forEach(k => this.kiosks.set(k.id, k));

        // Initialize Drones - Expanded fleet for peak hours
        const droneNames = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta',
            'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi',
            'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega',
            'Aether', 'Blaze', 'Comet', 'Dash', 'Echo', 'Falcon', 'Glide', 'Hawk',
            'Iris', 'Jet', 'Kite', 'Lightning', 'Meteor', 'Nova', 'Orbit', 'Phoenix',
            'Nebula', 'Quasar', 'Pulsar', 'Vortex', 'Zenith', 'Aurora', 'Cosmos', 'Eclipse',
            'Galaxy', 'Horizon', 'Infinity', 'Lunar', 'Mercury', 'Neptune', 'Orion', 'Polaris',
            'Quantum', 'Radiant', 'Stellar', 'Titan', 'Uranus', 'Venus', 'Warp', 'Xeno',
            'Yonder', 'Zephyr', 'Astro', 'Celestial', 'Draco', 'Equinox'];

        for (let i = 0; i < 70; i++) {
            const kioskId = kiosks[i % kiosks.length].id;
            const kiosk = this.kiosks.get(kioskId)!;

            const drone: Drone = {
                id: `drone-${i + 1}`,
                name: `Drone ${droneNames[i]}`,
                status: DroneStatus.IDLE,
                position: { ...kiosk.position, altitude: 0 },
                battery: 80 + Math.random() * 20,
                maxBatteryCapacity: 15000,
                speed: 0,
                maxSpeed: 60,
                maxRange: 15,
                maxPayload: 2.5,
                currentPayload: 0,
                assignedKioskId: kioskId,
                currentOrderId: null,
                route: [],
                currentWaypointIndex: 0,
                totalFlightTime: Math.random() * 100,
                totalDistance: Math.random() * 500,
                lastMaintenanceDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                isAvailable: true,
            };

            this.drones.set(drone.id, drone);
            kiosk.currentDrones.push(drone.id);
        }

        // Initialize Restaurants - 50+ diverse restaurants across Delhi NCR
        const restaurants: Restaurant[] = [
            // Italian Restaurants
            { id: 'rest-1', name: 'Pizza Palace', position: { lat: 28.6289, lng: 77.2065, altitude: 0 }, cuisine: 'Italian', averagePrepTime: 15, currentOrders: [], rating: 4.5, isOpen: true },
            { id: 'rest-2', name: 'Pasta Paradise', position: { lat: 28.5562, lng: 77.3910, altitude: 0 }, cuisine: 'Italian', averagePrepTime: 13, currentOrders: [], rating: 4.5, isOpen: true },
            { id: 'rest-3', name: 'La Trattoria', position: { lat: 28.5494, lng: 77.2066, altitude: 0 }, cuisine: 'Italian', averagePrepTime: 18, currentOrders: [], rating: 4.7, isOpen: true },
            { id: 'rest-4', name: 'Roma Ristorante', position: { lat: 28.6792, lng: 77.1500, altitude: 0 }, cuisine: 'Italian', averagePrepTime: 16, currentOrders: [], rating: 4.6, isOpen: true },

            // American Restaurants
            { id: 'rest-5', name: 'Burger Barn', position: { lat: 28.6519, lng: 77.2315, altitude: 0 }, cuisine: 'American', averagePrepTime: 12, currentOrders: [], rating: 4.2, isOpen: true },
            { id: 'rest-6', name: 'BBQ Pit', position: { lat: 28.6139, lng: 77.0500, altitude: 0 }, cuisine: 'American', averagePrepTime: 22, currentOrders: [], rating: 4.8, isOpen: true },
            { id: 'rest-7', name: 'Steakhouse Supreme', position: { lat: 28.5634, lng: 77.0609, altitude: 0 }, cuisine: 'American', averagePrepTime: 25, currentOrders: [], rating: 4.9, isOpen: true },
            { id: 'rest-8', name: 'Diner Delight', position: { lat: 28.4284, lng: 77.2757, altitude: 0 }, cuisine: 'American', averagePrepTime: 10, currentOrders: [], rating: 4.3, isOpen: true },

            // Indian Restaurants
            { id: 'rest-9', name: 'Curry Corner', position: { lat: 28.6692, lng: 77.4538, altitude: 0 }, cuisine: 'Indian', averagePrepTime: 18, currentOrders: [], rating: 4.6, isOpen: true },
            { id: 'rest-10', name: 'Biryani Bliss', position: { lat: 28.3586, lng: 77.1857, altitude: 0 }, cuisine: 'Indian', averagePrepTime: 25, currentOrders: [], rating: 4.9, isOpen: true },
            { id: 'rest-11', name: 'Tandoor Tales', position: { lat: 28.6944, lng: 77.0622, altitude: 0 }, cuisine: 'Indian', averagePrepTime: 20, currentOrders: [], rating: 4.7, isOpen: true },
            { id: 'rest-12', name: 'Masala Magic', position: { lat: 28.6528, lng: 77.2850, altitude: 0 }, cuisine: 'Indian', averagePrepTime: 17, currentOrders: [], rating: 4.5, isOpen: true },
            { id: 'rest-13', name: 'Spice Route', position: { lat: 28.461, lng: 77.0619, altitude: 0 }, cuisine: 'Indian', averagePrepTime: 19, currentOrders: [], rating: 4.6, isOpen: true },

            // Chinese Restaurants
            { id: 'rest-14', name: 'Noodle House', position: { lat: 28.6328, lng: 77.2197, altitude: 0 }, cuisine: 'Chinese', averagePrepTime: 14, currentOrders: [], rating: 4.4, isOpen: true },
            { id: 'rest-15', name: 'Wok & Roll', position: { lat: 28.3925, lng: 77.2323, altitude: 0 }, cuisine: 'Chinese', averagePrepTime: 12, currentOrders: [], rating: 4.5, isOpen: true },
            { id: 'rest-16', name: 'Dragon Palace', position: { lat: 28.3938, lng: 77.4281, altitude: 0 }, cuisine: 'Chinese', averagePrepTime: 16, currentOrders: [], rating: 4.6, isOpen: true },
            { id: 'rest-17', name: 'Dim Sum Delight', position: { lat: 28.6197, lng: 77.3984, altitude: 0 }, cuisine: 'Chinese', averagePrepTime: 15, currentOrders: [], rating: 4.4, isOpen: true },

            // Japanese Restaurants
            { id: 'rest-18', name: 'Sushi Supreme', position: { lat: 28.5965, lng: 77.2270, altitude: 0 }, cuisine: 'Japanese', averagePrepTime: 20, currentOrders: [], rating: 4.8, isOpen: true },
            { id: 'rest-19', name: 'Ramen Republic', position: { lat: 28.598, lng: 77.4948, altitude: 0 }, cuisine: 'Japanese', averagePrepTime: 18, currentOrders: [], rating: 4.7, isOpen: true },
            { id: 'rest-20', name: 'Tokyo Terrace', position: { lat: 28.6607, lng: 77.3510, altitude: 0 }, cuisine: 'Japanese', averagePrepTime: 22, currentOrders: [], rating: 4.8, isOpen: true },

            // Mexican Restaurants
            { id: 'rest-21', name: 'Taco Town', position: { lat: 28.7166, lng: 77.4229, altitude: 0 }, cuisine: 'Mexican', averagePrepTime: 10, currentOrders: [], rating: 4.3, isOpen: true },
            { id: 'rest-22', name: 'Burrito Bay', position: { lat: 28.7042, lng: 77.1414, altitude: 0 }, cuisine: 'Mexican', averagePrepTime: 12, currentOrders: [], rating: 4.4, isOpen: true },
            { id: 'rest-23', name: 'Quesadilla Queen', position: { lat: 28.5517, lng: 77.3288, altitude: 0 }, cuisine: 'Mexican', averagePrepTime: 11, currentOrders: [], rating: 4.2, isOpen: true },

            // Middle Eastern Restaurants
            { id: 'rest-24', name: 'Kebab Kingdom', position: { lat: 28.5244, lng: 77.1855, altitude: 0 }, cuisine: 'Middle Eastern', averagePrepTime: 16, currentOrders: [], rating: 4.7, isOpen: true },
            { id: 'rest-25', name: 'Shawarma Station', position: { lat: 28.4029, lng: 77.1791, altitude: 0 }, cuisine: 'Middle Eastern', averagePrepTime: 10, currentOrders: [], rating: 4.5, isOpen: true },
            { id: 'rest-26', name: 'Falafel Factory', position: { lat: 28.446, lng: 77.1032, altitude: 0 }, cuisine: 'Middle Eastern', averagePrepTime: 12, currentOrders: [], rating: 4.6, isOpen: true },

            // Thai Restaurants
            { id: 'rest-27', name: 'Thai Spice', position: { lat: 28.6733, lng: 77.4825, altitude: 0 }, cuisine: 'Thai', averagePrepTime: 17, currentOrders: [], rating: 4.6, isOpen: true },
            { id: 'rest-28', name: 'Bangkok Bites', position: { lat: 28.5398, lng: 77.4057, altitude: 0 }, cuisine: 'Thai', averagePrepTime: 16, currentOrders: [], rating: 4.5, isOpen: true },
            { id: 'rest-29', name: 'Pad Thai Palace', position: { lat: 28.7063, lng: 77.482, altitude: 0 }, cuisine: 'Thai', averagePrepTime: 15, currentOrders: [], rating: 4.4, isOpen: true },

            // Vietnamese Restaurants
            { id: 'rest-30', name: 'Pho Fusion', position: { lat: 28.5800, lng: 77.3200, altitude: 0 }, cuisine: 'Vietnamese', averagePrepTime: 15, currentOrders: [], rating: 4.4, isOpen: true },
            { id: 'rest-31', name: 'Banh Mi Bar', position: { lat: 28.3588, lng: 77.5087, altitude: 0 }, cuisine: 'Vietnamese', averagePrepTime: 10, currentOrders: [], rating: 4.3, isOpen: true },

            // Korean Restaurants
            { id: 'rest-32', name: 'Seoul Kitchen', position: { lat: 28.6881, lng: 77.4776, altitude: 0 }, cuisine: 'Korean', averagePrepTime: 20, currentOrders: [], rating: 4.7, isOpen: true },
            { id: 'rest-33', name: 'BBQ Seoul', position: { lat: 28.4212, lng: 77.0239, altitude: 0 }, cuisine: 'Korean', averagePrepTime: 25, currentOrders: [], rating: 4.8, isOpen: true },
            { id: 'rest-34', name: 'Kimchi Corner', position: { lat: 28.7096, lng: 77.1638, altitude: 0 }, cuisine: 'Korean', averagePrepTime: 18, currentOrders: [], rating: 4.6, isOpen: true },

            // Mediterranean Restaurants
            { id: 'rest-35', name: 'Greek Grill', position: { lat: 28.4961, lng: 77.5163, altitude: 0 }, cuisine: 'Mediterranean', averagePrepTime: 16, currentOrders: [], rating: 4.5, isOpen: true },
            { id: 'rest-36', name: 'Mediterranean Mezze', position: { lat: 28.3823, lng: 77.074, altitude: 0 }, cuisine: 'Mediterranean', averagePrepTime: 18, currentOrders: [], rating: 4.6, isOpen: true },

            // French Restaurants
            { id: 'rest-37', name: 'Café Paris', position: { lat: 28.5954, lng: 77.4538, altitude: 0 }, cuisine: 'French', averagePrepTime: 22, currentOrders: [], rating: 4.8, isOpen: true },
            { id: 'rest-38', name: 'Bistro Belle', position: { lat: 28.628, lng: 77.455, altitude: 0 }, cuisine: 'French', averagePrepTime: 24, currentOrders: [], rating: 4.7, isOpen: true },

            // Continental Restaurants
            { id: 'rest-39', name: 'Continental Café', position: { lat: 28.6457, lng: 77.2867, altitude: 0 }, cuisine: 'Continental', averagePrepTime: 20, currentOrders: [], rating: 4.5, isOpen: true },
            { id: 'rest-40', name: 'Fusion Bistro', position: { lat: 28.5877, lng: 77.3410, altitude: 0 }, cuisine: 'Continental', averagePrepTime: 19, currentOrders: [], rating: 4.6, isOpen: true },

            // Fast Food Chains
            { id: 'rest-41', name: 'Quick Bites', position: { lat: 28.6289, lng: 77.2197, altitude: 0 }, cuisine: 'Fast Food', averagePrepTime: 8, currentOrders: [], rating: 4.0, isOpen: true },
            { id: 'rest-42', name: 'Speed Eats', position: { lat: 28.6842, lng: 77.1214, altitude: 0 }, cuisine: 'Fast Food', averagePrepTime: 7, currentOrders: [], rating: 3.9, isOpen: true },
            { id: 'rest-43', name: 'Express Kitchen', position: { lat: 28.7482, lng: 77.1424, altitude: 0 }, cuisine: 'Fast Food', averagePrepTime: 9, currentOrders: [], rating: 4.1, isOpen: true },

            // Dessert & Bakery
            { id: 'rest-44', name: 'Sweet Treats', position: { lat: 28.5605, lng: 77.2291, altitude: 0 }, cuisine: 'Desserts', averagePrepTime: 10, currentOrders: [], rating: 4.7, isOpen: true },
            { id: 'rest-45', name: 'Bakery Bliss', position: { lat: 28.5093, lng: 77.3365, altitude: 0 }, cuisine: 'Bakery', averagePrepTime: 12, currentOrders: [], rating: 4.5, isOpen: true },
            { id: 'rest-46', name: 'Cake Castle', position: { lat: 28.4123, lng: 77.4564, altitude: 0 }, cuisine: 'Desserts', averagePrepTime: 15, currentOrders: [], rating: 4.6, isOpen: true },

            // Health Food
            { id: 'rest-47', name: 'Salad Bar', position: { lat: 28.4049, lng: 77.1261, altitude: 0 }, cuisine: 'Healthy', averagePrepTime: 10, currentOrders: [], rating: 4.4, isOpen: true },
            { id: 'rest-48', name: 'Green Bowl', position: { lat: 28.6126, lng: 77.5444, altitude: 0 }, cuisine: 'Healthy', averagePrepTime: 12, currentOrders: [], rating: 4.5, isOpen: true },

            // Specialty Cuisines
            { id: 'rest-49', name: 'Spanish Tapas', position: { lat: 28.3732, lng: 77.4389, altitude: 0 }, cuisine: 'Spanish', averagePrepTime: 18, currentOrders: [], rating: 4.6, isOpen: true },
            { id: 'rest-50', name: 'Brazilian Grill', position: { lat: 28.4074, lng: 77.394, altitude: 0 }, cuisine: 'Brazilian', averagePrepTime: 23, currentOrders: [], rating: 4.7, isOpen: true },
            { id: 'rest-51', name: 'Turkish Delight', position: { lat: 28.6328, lng: 77.2950, altitude: 0 }, cuisine: 'Turkish', averagePrepTime: 17, currentOrders: [], rating: 4.5, isOpen: true },
            { id: 'rest-52', name: 'Lebanese Lounge', position: { lat: 28.4808, lng: 77.1134, altitude: 0 }, cuisine: 'Lebanese', averagePrepTime: 16, currentOrders: [], rating: 4.6, isOpen: true },
        ];
        restaurants.forEach(r => this.restaurants.set(r.id, r));

        // Initialize Customers
        for (let i = 0; i < 30; i++) {
            const customer: Customer = {
                id: `customer-${i + 1}`,
                name: `Customer ${i + 1}`,
                position: {
                    lat: 28.5 + Math.random() * 0.3,
                    lng: 77.1 + Math.random() * 0.4,
                    altitude: 0,
                },
                phone: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
                orderHistory: [],
            };
            this.customers.set(customer.id, customer);
        }

        // Initialize No-Fly Zones
        const noFlyZones: NoFlyZone[] = [
            {
                id: 'nfz-1',
                name: 'Airport Zone',
                polygon: [
                    { lat: 28.5562, lng: 77.0999, altitude: 0 },
                    { lat: 28.5662, lng: 77.0999, altitude: 0 },
                    { lat: 28.5662, lng: 77.1199, altitude: 0 },
                    { lat: 28.5562, lng: 77.1199, altitude: 0 },
                ],
                severity: AlertSeverity.CRITICAL,
                reason: 'Airport restricted airspace',
                isActive: true,
            },
            {
                id: 'nfz-2',
                name: 'Government Building',
                polygon: [
                    { lat: 28.6127, lng: 77.2273, altitude: 0 },
                    { lat: 28.6147, lng: 77.2273, altitude: 0 },
                    { lat: 28.6147, lng: 77.2313, altitude: 0 },
                    { lat: 28.6127, lng: 77.2313, altitude: 0 },
                ],
                severity: AlertSeverity.CRITICAL,
                reason: 'Restricted government area',
                isActive: true,
            },
        ];
        noFlyZones.forEach(z => this.noFlyZones.set(z.id, z));

        // Initialize Users
        const users: User[] = [
            { id: 'user-1', username: 'admin', role: UserRole.ADMIN },
            { id: 'user-2', username: 'restaurant1', role: UserRole.RESTAURANT_OPERATOR, assignedEntityId: 'rest-1' },
            { id: 'user-3', username: 'kiosk1', role: UserRole.KIOSK_OPERATOR, assignedEntityId: 'kiosk-1' },
        ];
        users.forEach(u => this.users.set(u.id, u));
    }

    // Helper methods
    getAllDrones(): Drone[] {
        return Array.from(this.drones.values());
    }

    getAllKiosks(): Kiosk[] {
        return Array.from(this.kiosks.values());
    }

    getAllRestaurants(): Restaurant[] {
        return Array.from(this.restaurants.values());
    }

    getAllCustomers(): Customer[] {
        return Array.from(this.customers.values());
    }

    getAllOrders(): Order[] {
        return Array.from(this.orders.values());
    }

    getAllNoFlyZones(): NoFlyZone[] {
        return Array.from(this.noFlyZones.values());
    }

    getAllAlerts(): Alert[] {
        return Array.from(this.alerts.values());
    }

    getRecentEventLogs(limit: number = 100): EventLog[] {
        return this.eventLogs.slice(-limit);
    }

    addEventLog(log: EventLog) {
        this.eventLogs.push(log);
        // Keep only last 1000 events
        if (this.eventLogs.length > 1000) {
            this.eventLogs = this.eventLogs.slice(-1000);
        }
    }

    addAlert(alert: Alert) {
        this.alerts.set(alert.id, alert);
    }

    addOrder(order: Order) {
        this.orders.set(order.id, order);
    }

    updateDrone(droneId: string, updates: Partial<Drone>) {
        const drone = this.drones.get(droneId);
        if (drone) {
            Object.assign(drone, updates);
        }
    }

    updateOrder(orderId: string, updates: Partial<Order>) {
        const order = this.orders.get(orderId);
        if (order) {
            Object.assign(order, updates);
        }
    }
}

export const dataStore = new DataStore();
