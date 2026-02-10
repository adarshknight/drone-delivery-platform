// Dashboard Page

import React, { useEffect } from 'react';
import { Plane, Package, TrendingUp, AlertTriangle, Battery, Play, Pause, Zap, MapPin, Utensils, Plug } from 'lucide-react';
import { KPICard } from '../components/ui/KPICard';
import { AlertPanel } from '../components/ui/AlertPanel';
import { useKPIStore } from '../stores/kpi-store';
import { useDroneStore } from '../stores/drone-store';
import { useOrderStore } from '../stores/order-store';
import { useSimulationStore } from '../stores/simulation-store';
import { useKioskStore } from '../stores/kiosk-store';
import { useRestaurantStore } from '../stores/restaurant-store';
import { socketService } from '../services/socket';
import { API_CONFIG } from '../config/api';

export const Dashboard: React.FC = () => {
    const { metrics, setMetrics, addAlert } = useKPIStore();
    const { setDrones } = useDroneStore();
    const { setOrders } = useOrderStore();
    const { isRunning, speed, setSpeed, updateState, scenario, weatherImpact } = useSimulationStore();
    const { kiosks, setKiosks } = useKioskStore();
    const { restaurants, setRestaurants } = useRestaurantStore();
    const [localWeatherImpact, setLocalWeatherImpact] = React.useState(weatherImpact);

    // Fetch kiosks and restaurants on mount
    useEffect(() => {
        fetch(`${API_CONFIG.BACKEND_URL}/api/kiosks`)
            .then(res => res.json())
            .then(setKiosks)
            .catch(console.error);

        fetch(`${API_CONFIG.BACKEND_URL}/api/restaurants`)
            .then(res => res.json())
            .then(setRestaurants)
            .catch(console.error);
    }, []);

    useEffect(() => {
        // Setup socket listeners
        socketService.on('kpi:update', setMetrics);
        socketService.on('drone:update', setDrones);
        socketService.on('order:batch', setOrders);
        socketService.on('alert:new', addAlert);
        socketService.on('simulation:state', updateState);

        return () => {
            socketService.off('kpi:update', setMetrics);
            socketService.off('drone:update', setDrones);
            socketService.off('order:batch', setOrders);
            socketService.off('alert:new', addAlert);
            socketService.off('simulation:state', updateState);
        };
    }, []);

    // Sync weather impact from store
    useEffect(() => {
        setLocalWeatherImpact(weatherImpact);
    }, [weatherImpact]);

    const handleSimulationToggle = () => {
        if (isRunning) {
            socketService.pauseSimulation();
        } else {
            socketService.startSimulation();
        }
    };

    const handleSpeedChange = (newSpeed: number) => {
        setSpeed(newSpeed);
        socketService.setSimulationSpeed(newSpeed);
    };

    const handleScenarioChange = (newScenario: string) => {
        socketService.setScenario(newScenario as any);
    };

    const handleWeatherImpactChange = (value: number) => {
        setLocalWeatherImpact(value);
        socketService.setWeatherImpact(value);
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header - Responsive */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">Real-time drone delivery operations</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                    {/* Speed Controls - Hidden on mobile */}
                    <div className="hidden sm:flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Speed:</span>
                        {[0.5, 1, 2, 5, 10].map((s) => (
                            <button
                                key={s}
                                onClick={() => handleSpeedChange(s)}
                                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors btn-touch ${speed === s
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {s}x
                            </button>
                        ))}
                    </div>

                    {/* Play/Pause Button - Touch friendly */}
                    <button
                        onClick={handleSimulationToggle}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors btn-touch ${isRunning
                            ? 'bg-warning-600 hover:bg-warning-700 text-white'
                            : 'bg-success-600 hover:bg-success-700 text-white'
                            }`}
                    >
                        {isRunning ? (
                            <>
                                <Pause className="w-5 h-5" />
                                <span>Pause</span>
                            </>
                        ) : (
                            <>
                                <Play className="w-5 h-5" />
                                <span>Start</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Weather and Scenario Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Simulation Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Scenario Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Scenario
                        </label>
                        <select
                            value={scenario}
                            onChange={(e) => handleScenarioChange(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="NORMAL">Normal Operations</option>
                            <option value="PEAK_HOUR">Peak Hour Rush</option>
                            <option value="BAD_WEATHER">Bad Weather</option>
                        </select>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {scenario === 'NORMAL' && 'Standard delivery operations with moderate order frequency'}
                            {scenario === 'PEAK_HOUR' && 'High order volume, increased demand'}
                            {scenario === 'BAD_WEATHER' && 'Challenging weather conditions, reduced efficiency'}
                        </p>
                    </div>

                    {/* Weather Impact Slider */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Weather Impact: {localWeatherImpact}%
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={localWeatherImpact}
                            onChange={(e) => handleWeatherImpactChange(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                        />
                        <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>Clear (0%)</span>
                            <span className={localWeatherImpact > 50 ? 'text-warning-600 font-semibold' : ''}>
                                {localWeatherImpact <= 25 && 'Light Rain'}
                                {localWeatherImpact > 25 && localWeatherImpact <= 50 && 'Heavy Rain'}
                                {localWeatherImpact > 50 && localWeatherImpact <= 75 && 'Strong Wind'}
                                {localWeatherImpact > 75 && 'Storm'}
                            </span>
                            <span>Storm (100%)</span>
                        </div>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Higher values reduce drone speed and increase battery consumption
                        </p>
                    </div>
                </div>
            </div>

            {/* KPI Cards - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <KPICard
                    title="Total Drones"
                    value={metrics.totalDrones}
                    icon={<Plane className="w-6 h-6" />}
                    color="primary"
                />
                <KPICard
                    title="Active Drones"
                    value={metrics.activeDrones}
                    icon={<Zap className="w-6 h-6" />}
                    color="success"
                    trend="up"
                    trendValue={`${((metrics.activeDrones / metrics.totalDrones) * 100).toFixed(0)}%`}
                />
                <KPICard
                    title="Orders Today"
                    value={metrics.ordersToday}
                    icon={<Package className="w-6 h-6" />}
                    color="primary"
                />
                <KPICard
                    title="On-Time Rate"
                    value={`${metrics.onTimeDeliveryRate.toFixed(1)}%`}
                    icon={<TrendingUp className="w-6 h-6" />}
                    color="success"
                />
                <KPICard
                    title="Alerts"
                    value={metrics.totalAlerts}
                    icon={<AlertTriangle className="w-6 h-6" />}
                    color={metrics.criticalAlerts > 0 ? 'danger' : 'warning'}
                />
                <KPICard
                    title="Avg Battery"
                    value={`${metrics.averageBatteryLevel.toFixed(0)}%`}
                    icon={<Battery className="w-6 h-6" />}
                    color={metrics.averageBatteryLevel > 50 ? 'success' : 'warning'}
                />
            </div>

            {/* Charts and Alerts - Responsive */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Operations Overview
                    </h3>
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="p-3 md:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">In Progress</p>
                            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                                {metrics.ordersInProgress}
                            </p>
                        </div>
                        <div className="p-3 md:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</p>
                            <p className="text-xl md:text-2xl font-bold text-success-600">
                                {metrics.ordersCompleted}
                            </p>
                        </div>
                        <div className="p-3 md:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Delivery Time</p>
                            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                                {metrics.averageDeliveryTime.toFixed(0)}m
                            </p>
                        </div>
                        <div className="p-3 md:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">Revenue</p>
                            <p className="text-xl md:text-2xl font-bold text-success-600">
                                ${metrics.totalRevenue}
                            </p>
                        </div>
                    </div>
                </div>

                <AlertPanel />
            </div>

            {/* Kiosk and Restaurant Network */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Kiosk Overview */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary-600" />
                            Charging Stations ({kiosks.length})
                        </h3>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {kiosks.slice(0, 10).map((kiosk) => {
                            const utilizationPercent = ((kiosk.chargingSlots - kiosk.availableChargingSlots) / kiosk.chargingSlots) * 100;
                            return (
                                <div key={kiosk.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Plug className={`w-4 h-4 ${kiosk.isOperational ? 'text-success-600' : 'text-danger-600'}`} />
                                            <span className="font-medium text-gray-900 dark:text-white text-sm">
                                                {kiosk.name}
                                            </span>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${utilizationPercent > 80
                                            ? 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400'
                                            : utilizationPercent > 50
                                                ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
                                                : 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                                            }`}>
                                            {utilizationPercent.toFixed(0)}% Used
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                                        <span>Charging: {kiosk.chargingSlots - kiosk.availableChargingSlots}/{kiosk.chargingSlots}</span>
                                        <span>Queue: {kiosk.chargingQueue.length}</span>
                                        <span>Drones: {kiosk.currentDrones.length}/{kiosk.capacity}</span>
                                    </div>
                                    {/* Charging slots visual */}
                                    <div className="mt-2 flex gap-1">
                                        {Array.from({ length: kiosk.chargingSlots }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-1.5 flex-1 rounded ${i < (kiosk.chargingSlots - kiosk.availableChargingSlots)
                                                    ? 'bg-warning-500'
                                                    : 'bg-gray-300 dark:bg-gray-600'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        {kiosks.length > 10 && (
                            <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2">
                                Showing 10 of {kiosks.length} stations
                            </p>
                        )}
                    </div>

                    {/* Kiosk Summary Stats */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {kiosks.filter(k => k.isOperational).length}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Operational</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-warning-600">
                                {kiosks.reduce((sum, k) => sum + (k.chargingSlots - k.availableChargingSlots), 0)}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Charging Now</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {kiosks.reduce((sum, k) => sum + k.chargingQueue.length, 0)}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">In Queue</p>
                        </div>
                    </div>
                </div>

                {/* Restaurant Overview */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Utensils className="w-5 h-5 text-primary-600" />
                            Restaurant Network ({restaurants.length})
                        </h3>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {restaurants.slice(0, 10).map((restaurant) => (
                            <div key={restaurant.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <span className="font-medium text-gray-900 dark:text-white text-sm block">
                                            {restaurant.name}
                                        </span>
                                        <span className="text-xs text-gray-600 dark:text-gray-400">
                                            {restaurant.cuisine}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-xs px-2 py-1 rounded-full ${restaurant.isOpen
                                            ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                                            }`}>
                                            {restaurant.isOpen ? 'Open' : 'Closed'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                                    <span>⭐ {restaurant.rating.toFixed(1)}</span>
                                    <span>Prep: {restaurant.averagePrepTime}min</span>
                                    <span className={restaurant.currentOrders.length > 0 ? 'text-warning-600 font-semibold' : ''}>
                                        Orders: {restaurant.currentOrders.length}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {restaurants.length > 10 && (
                            <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2">
                                Showing 10 of {restaurants.length} restaurants
                            </p>
                        )}
                    </div>

                    {/* Restaurant Summary Stats */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-success-600">
                                {restaurants.filter(r => r.isOpen).length}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Open Now</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {new Set(restaurants.map(r => r.cuisine)).size}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Cuisines</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-warning-600">
                                {restaurants.reduce((sum, r) => sum + r.currentOrders.length, 0)}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Active Orders</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
