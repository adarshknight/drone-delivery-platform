// Drones Page

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDroneStore } from '../stores/drone-store';
import { socketService } from '../services/socket';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Battery, Navigation } from 'lucide-react';
import { API_CONFIG } from '../config/api';

export const Drones: React.FC = () => {
    const { drones, setDrones } = useDroneStore();
    const navigate = useNavigate();

    useEffect(() => {
        // Socket.IO real-time updates
        socketService.on('drone:update', setDrones);

        // Auto-refresh: Fetch fresh data every 5 seconds as backup
        const fetchDrones = async () => {
            try {
                const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/drones`);
                if (response.ok) {
                    const data = await response.json();
                    setDrones(data);
                }
            } catch (error) {
                console.error('Failed to fetch drones:', error);
            }
        };

        // Initial fetch
        fetchDrones();

        // Set up 5-second interval
        const intervalId = setInterval(fetchDrones, 5000);

        // Cleanup on unmount
        return () => {
            socketService.off('drone:update', setDrones);
            clearInterval(intervalId);
        };
    }, [setDrones]);

    const handleDroneClick = (droneId: string) => {
        navigate(`/live-map?drone=${droneId}`);
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Drone Fleet</h1>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">Monitor and manage all drones (click to view on map)</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {drones.map((drone) => (
                    <div
                        key={drone.id}
                        onClick={() => handleDroneClick(drone.id)}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 hover:shadow-lg transition-all cursor-pointer hover:scale-105"
                    >
                        <div className="flex items-center justify-between mb-3 md:mb-4">
                            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                                {drone.name}
                            </h3>
                            <StatusBadge status={drone.status} type="drone" />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Battery className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Battery</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${drone.battery > 50
                                                ? 'bg-success-500'
                                                : drone.battery > 20
                                                    ? 'bg-warning-500'
                                                    : 'bg-danger-500'
                                                }`}
                                            style={{ width: `${drone.battery}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {drone.battery.toFixed(0)}%
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Navigation className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Speed</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {drone.speed.toFixed(0)} km/h
                                </span>
                            </div>

                            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                                    <span>Distance: {drone.totalDistance.toFixed(1)} km</span>
                                    <span>Time: {drone.totalFlightTime.toFixed(1)} hrs</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
