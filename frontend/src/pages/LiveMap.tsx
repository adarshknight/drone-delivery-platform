// Live Map Page with Pigeon Maps

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Map, Marker, Overlay } from 'pigeon-maps';
import { useDroneStore } from '../stores/drone-store';
import { socketService } from '../services/socket';
import { API_CONFIG } from '../config/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { WeatherWidget } from '../components/weather/WeatherWidget';
import { X, Navigation, Battery, Package, Menu } from 'lucide-react';

export const LiveMap: React.FC = () => {
    const { drones, selectedDrone, selectDrone, setDrones } = useDroneStore();
    const [searchParams] = useSearchParams();
    const [showDrawer, setShowDrawer] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const [showDrones, setShowDrones] = useState(true);
    const [showKiosks, setShowKiosks] = useState(false);
    const [showRestaurants, setShowRestaurants] = useState(false);
    const [kiosks, setKiosks] = useState<any[]>([]);
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [center, setCenter] = useState<[number, number]>([28.6139, 77.2090]); // Delhi
    const [zoom, setZoom] = useState(11);
    const [hoveredDrone, setHoveredDrone] = useState<string | null>(null);

    useEffect(() => {
        // Fetch kiosks and restaurants
        fetch(`${API_CONFIG.BACKEND_URL}/api/kiosks`)
            .then(res => res.json())
            .then(data => {
                console.log('Loaded kiosks:', data.length);
                setKiosks(data);
            })
            .catch(err => console.error('Failed to fetch kiosks:', err));

        fetch(`${API_CONFIG.BACKEND_URL}/api/restaurants`)
            .then(res => res.json())
            .then(data => {
                console.log('Loaded restaurants:', data.length);
                setRestaurants(data);
            })
            .catch(err => console.error('Failed to fetch restaurants:', err));

        socketService.on('drone:update', setDrones);

        return () => {
            socketService.off('drone:update', setDrones);
        };
    }, [setDrones]);

    // Handle URL parameter for selected drone
    useEffect(() => {
        const droneId = searchParams.get('drone');
        if (droneId && drones.length > 0) {
            const drone = drones.find(d => d.id === droneId);
            if (drone) {
                // Center map on drone
                setCenter([drone.position.lat, drone.position.lng]);
                // Zoom in
                setZoom(14);
                // Select drone
                selectDrone(drone);
                // Open drawer
                setShowDrawer(true);
            }
        }
    }, [searchParams, drones, selectDrone]);


    const handleDroneCommand = (command: 'return' | 'emergency_land') => {
        if (selectedDrone) {
            console.log(`🎮 Sending command "${command}" to drone ${selectedDrone.id}`);
            socketService.sendDroneCommand(selectedDrone.id, command);
        }
    };

    const handleDroneClick = (drone: any) => {
        selectDrone(drone);
        setShowDrawer(true);
    };

    // Custom marker component for kiosks
    const KioskMarker = () => (
        <div
            style={{
                fontSize: '32px',
                cursor: 'pointer',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
            }}
        >
            🏢
        </div>
    );

    // Custom marker component for restaurants
    const RestaurantMarker = () => (
        <div
            style={{
                fontSize: '32px',
                cursor: 'pointer',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
            }}
        >
            🍽️
        </div>
    );

    return (
        <div className="relative w-full h-full">
            {/* Pigeon Map - Full height */}
            <div className="absolute inset-0">
                <Map
                    center={center}
                    zoom={zoom}
                    onBoundsChanged={({ center, zoom }) => {
                        setCenter(center);
                        setZoom(zoom);
                    }}
                >
                    {/* Drone Markers */}
                    {showDrones && drones.map((drone) => (
                        <Marker
                            key={drone.id}
                            anchor={[drone.position.lat, drone.position.lng]}
                            payload={drone}
                            onClick={() => handleDroneClick(drone)}
                        >
                            <div
                                style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '50%',
                                    backgroundColor: drone.status === 'IDLE' ? '#10b981' :
                                        drone.status === 'CHARGING' ? '#f59e0b' :
                                            drone.status.includes('FLYING') ? '#3b82f6' : '#6b7280',
                                    border: '3px solid white',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '16px',
                                    transform: hoveredDrone === drone.id ? 'scale(1.2)' : 'scale(1)',
                                    transition: 'transform 0.2s',
                                    pointerEvents: 'auto',
                                }}
                                onMouseEnter={() => setHoveredDrone(drone.id)}
                                onMouseLeave={() => setHoveredDrone(null)}
                            >
                                🚁
                            </div>
                        </Marker>
                    ))}

                    {/* Kiosk Markers */}
                    {showKiosks && kiosks.map((kiosk) => (
                        <Marker
                            key={kiosk.id}
                            anchor={[kiosk.position.lat, kiosk.position.lng]}
                        >
                            <KioskMarker />
                        </Marker>
                    ))}

                    {/* Restaurant Markers */}
                    {showRestaurants && restaurants.map((restaurant) => (
                        <Marker
                            key={restaurant.id}
                            anchor={[restaurant.position.lat, restaurant.position.lng]}
                        >
                            <RestaurantMarker />
                        </Marker>
                    ))}

                    {/* Hover tooltip for drones */}
                    {hoveredDrone && drones.find(d => d.id === hoveredDrone) && (
                        <Overlay
                            anchor={[
                                drones.find(d => d.id === hoveredDrone)!.position.lat,
                                drones.find(d => d.id === hoveredDrone)!.position.lng
                            ]}
                            offset={[0, -40]}
                        >
                            <div
                                style={{
                                    backgroundColor: 'white',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                    fontSize: '12px',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                <div style={{ fontWeight: 'bold' }}>
                                    {drones.find(d => d.id === hoveredDrone)!.name}
                                </div>
                                <div>
                                    Battery: {drones.find(d => d.id === hoveredDrone)!.battery.toFixed(0)}%
                                </div>
                            </div>
                        </Overlay>
                    )}
                </Map>
            </div>

            {/* Mobile Controls Toggle Button */}
            <button
                onClick={() => setShowControls(!showControls)}
                className="md:hidden absolute top-4 left-4 z-20 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg btn-touch"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Map Controls - Desktop: top-left overlay, Mobile: bottom sheet */}
            {/* Desktop Controls */}
            <div className="hidden md:block absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 space-y-2 z-10">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Map Controls</h3>
                <div className="space-y-2">
                    <button
                        onClick={() => setShowDrones(!showDrones)}
                        className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${showDrones
                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                    >
                        {showDrones ? '✓ ' : ''}Show Drones ({drones.length})
                    </button>
                    <button
                        onClick={() => setShowKiosks(!showKiosks)}
                        className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${showKiosks
                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                    >
                        {showKiosks ? '✓ ' : ''}Show Kiosks ({kiosks.length})
                    </button>
                    <button
                        onClick={() => setShowRestaurants(!showRestaurants)}
                        className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${showRestaurants
                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                    >
                        {showRestaurants ? '✓ ' : ''}Show Restaurants ({restaurants.length})
                    </button>
                </div>
            </div>

            {/* Mobile Controls - Bottom Sheet */}
            <div className={`md:hidden ${showControls ? 'bottom-sheet open' : 'bottom-sheet'}`}>
                <div className="flex items-center justify-between mb-4 p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Map Controls</h3>
                    <button onClick={() => setShowControls(false)} className="p-2">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4">
                    <div className="space-y-2">
                        <button
                            onClick={() => setShowDrones(!showDrones)}
                            className={`w-full px-3 py-3 rounded-lg text-sm font-medium transition-colors btn-touch ${showDrones
                                ? 'bg-primary-600 text-white hover:bg-primary-700'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            {showDrones ? '✓ ' : ''}Show Drones ({drones.length})
                        </button>
                        <button
                            onClick={() => setShowKiosks(!showKiosks)}
                            className={`w-full px-3 py-3 rounded-lg text-sm font-medium transition-colors btn-touch ${showKiosks
                                ? 'bg-primary-600 text-white hover:bg-primary-700'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            {showKiosks ? '✓ ' : ''}Show Kiosks ({kiosks.length})
                        </button>
                        <button
                            onClick={() => setShowRestaurants(!showRestaurants)}
                            className={`w-full px-3 py-3 rounded-lg text-sm font-medium transition-colors btn-touch ${showRestaurants
                                ? 'bg-primary-600 text-white hover:bg-primary-700'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            {showRestaurants ? '✓ ' : ''}Show Restaurants ({restaurants.length})
                        </button>
                    </div>
                </div>
            </div>

            {/* Weather Widget - Hidden on mobile */}
            <div className="hidden md:block absolute top-4 right-4 w-80 z-10">
                <WeatherWidget lat={center[0]} lon={center[1]} />
            </div>

            {/* Drone Details Drawer - Responsive */}
            {showDrawer && selectedDrone && (
                <>
                    {/* Overlay for mobile */}
                    <div
                        className="md:hidden fixed inset-0 bg-black/50 z-30"
                        onClick={() => setShowDrawer(false)}
                    />

                    {/* Drawer */}
                    <div className="fixed md:absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-white dark:bg-gray-800 shadow-2xl p-4 md:p-6 overflow-y-auto animate-slide-in z-40">
                        <div className="flex items-center justify-between mb-4 md:mb-6">
                            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                                {selectedDrone.name}
                            </h2>
                            <button
                                onClick={() => setShowDrawer(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg btn-touch"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <StatusBadge status={selectedDrone.status} type="drone" />
                            </div>

                            <div className="grid grid-cols-2 gap-3 md:gap-4">
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Battery className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Battery</p>
                                    </div>
                                    <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                                        {selectedDrone.battery.toFixed(0)}%
                                    </p>
                                </div>

                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Navigation className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Speed</p>
                                    </div>
                                    <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                                        {selectedDrone.speed.toFixed(0)} km/h
                                    </p>
                                </div>

                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Package className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Payload</p>
                                    </div>
                                    <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                                        {selectedDrone.currentPayload.toFixed(1)} kg
                                    </p>
                                </div>

                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Altitude</p>
                                    <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                                        {selectedDrone.position.altitude.toFixed(0)}m
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Actions</h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => handleDroneCommand('return')}
                                        className="w-full px-4 py-3 bg-warning-600 text-white rounded-lg hover:bg-warning-700 btn-touch"
                                    >
                                        Force Return to Kiosk
                                    </button>
                                    <button
                                        onClick={() => handleDroneCommand('emergency_land')}
                                        className="w-full px-4 py-3 bg-danger-600 text-white rounded-lg hover:bg-danger-700 btn-touch"
                                    >
                                        Emergency Landing
                                    </button>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Statistics</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Total Distance</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {selectedDrone.totalDistance.toFixed(1)} km
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Flight Time</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {selectedDrone.totalFlightTime.toFixed(1)} hrs
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Max Range</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {selectedDrone.maxRange} km
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Mobile overlay for controls */}
            {showControls && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={() => setShowControls(false)}
                />
            )}
        </div>
    );
};
