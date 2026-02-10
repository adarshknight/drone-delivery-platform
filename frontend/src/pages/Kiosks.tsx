// Kiosks Management Page

import React, { useEffect, useState } from 'react';
import { MapPin, Plug, Search, Filter, AlertCircle, CheckCircle, XCircle, Battery, Zap } from 'lucide-react';
import { useKioskStore } from '../stores/kiosk-store';
import { API_CONFIG } from '../config/api';
import type { Kiosk } from '../types';

export const Kiosks: React.FC = () => {
    const { kiosks, setKiosks } = useKioskStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'operational' | 'offline'>('all');
    const [sortBy, setSortBy] = useState<'name' | 'utilization' | 'queue'>('name');
    const [selectedKiosk, setSelectedKiosk] = useState<Kiosk | null>(null);

    useEffect(() => {
        // Fetch kiosks data
        const fetchKiosks = async () => {
            try {
                const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/kiosks`);
                if (response.ok) {
                    const data = await response.json();
                    setKiosks(data);
                }
            } catch (error) {
                console.error('Failed to fetch kiosks:', error);
            }
        };

        // Initial fetch
        fetchKiosks();

        // Set up 5-second interval for auto-refresh
        const intervalId = setInterval(fetchKiosks, 5000);

        // Cleanup on unmount
        return () => {
            clearInterval(intervalId);
        };
    }, [setKiosks]);

    // Filter and sort kiosks
    const filteredKiosks = kiosks
        .filter(kiosk => {
            const matchesSearch = kiosk.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter =
                filterStatus === 'all' ||
                (filterStatus === 'operational' && kiosk.isOperational) ||
                (filterStatus === 'offline' && !kiosk.isOperational);
            return matchesSearch && matchesFilter;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'utilization':
                    const aUtil = ((a.chargingSlots - a.availableChargingSlots) / a.chargingSlots) * 100;
                    const bUtil = ((b.chargingSlots - b.availableChargingSlots) / b.chargingSlots) * 100;
                    return bUtil - aUtil;
                case 'queue':
                    return b.chargingQueue.length - a.chargingQueue.length;
                default:
                    return 0;
            }
        });

    // Calculate summary stats
    const stats = {
        total: kiosks.length,
        operational: kiosks.filter(k => k.isOperational).length,
        offline: kiosks.filter(k => !k.isOperational).length,
        totalCharging: kiosks.reduce((sum, k) => sum + (k.chargingSlots - k.availableChargingSlots), 0),
        totalQueue: kiosks.reduce((sum, k) => sum + k.chargingQueue.length, 0),
        avgUtilization: kiosks.length > 0
            ? kiosks.reduce((sum, k) => sum + ((k.chargingSlots - k.availableChargingSlots) / k.chargingSlots) * 100, 0) / kiosks.length
            : 0,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Charging Stations</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Manage and monitor drone charging infrastructure
                </p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Stations</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                        </div>
                        <MapPin className="w-8 h-8 text-primary-600" />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Operational</p>
                            <p className="text-2xl font-bold text-success-600">{stats.operational}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-success-600" />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Charging Now</p>
                            <p className="text-2xl font-bold text-warning-600">{stats.totalCharging}</p>
                        </div>
                        <Battery className="w-8 h-8 text-warning-600" />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Utilization</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats.avgUtilization.toFixed(0)}%
                            </p>
                        </div>
                        <Zap className="w-8 h-8 text-primary-600" />
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search kiosks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="operational">Operational</option>
                            <option value="offline">Offline</option>
                        </select>
                    </div>

                    {/* Sort */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="name">Sort by Name</option>
                        <option value="utilization">Sort by Utilization</option>
                        <option value="queue">Sort by Queue</option>
                    </select>
                </div>
            </div>

            {/* Kiosk Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredKiosks.map((kiosk) => {
                    const utilizationPercent = ((kiosk.chargingSlots - kiosk.availableChargingSlots) / kiosk.chargingSlots) * 100;

                    return (
                        <div
                            key={kiosk.id}
                            onClick={() => setSelectedKiosk(kiosk)}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${kiosk.isOperational ? 'bg-success-100 dark:bg-success-900/30' : 'bg-danger-100 dark:bg-danger-900/30'}`}>
                                        <Plug className={`w-6 h-6 ${kiosk.isOperational ? 'text-success-600' : 'text-danger-600'}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{kiosk.name}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {kiosk.position.lat.toFixed(4)}, {kiosk.position.lng.toFixed(4)}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${kiosk.isOperational
                                    ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                                    : 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400'
                                    }`}>
                                    {kiosk.isOperational ? 'Operational' : 'Offline'}
                                </span>
                            </div>

                            {/* Utilization Bar */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Utilization</span>
                                    <span className={`text-sm font-semibold ${utilizationPercent > 80 ? 'text-danger-600' :
                                        utilizationPercent > 50 ? 'text-warning-600' :
                                            'text-success-600'
                                        }`}>
                                        {utilizationPercent.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all ${utilizationPercent > 80 ? 'bg-danger-600' :
                                            utilizationPercent > 50 ? 'bg-warning-600' :
                                                'bg-success-600'
                                            }`}
                                        style={{ width: `${utilizationPercent}%` }}
                                    />
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Charging</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                        {kiosk.chargingSlots - kiosk.availableChargingSlots}/{kiosk.chargingSlots}
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Queue</p>
                                    <p className="text-lg font-bold text-warning-600">
                                        {kiosk.chargingQueue.length}
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Drones</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                        {kiosk.currentDrones.length}/{kiosk.capacity}
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Coverage</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                        {kiosk.coverageRadius} km
                                    </p>
                                </div>
                            </div>

                            {/* Charging Slots Visual */}
                            <div className="flex gap-1">
                                {Array.from({ length: kiosk.chargingSlots }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-2 flex-1 rounded ${i < (kiosk.chargingSlots - kiosk.availableChargingSlots)
                                            ? 'bg-warning-500'
                                            : 'bg-gray-300 dark:bg-gray-600'
                                            }`}
                                        title={i < (kiosk.chargingSlots - kiosk.availableChargingSlots) ? 'Occupied' : 'Available'}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {filteredKiosks.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No kiosks found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        Try adjusting your search or filter criteria
                    </p>
                </div>
            )}

            {/* Detail Modal */}
            {selectedKiosk && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedKiosk(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedKiosk.name}</h2>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">Kiosk ID: {selectedKiosk.id}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedKiosk(null)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    <XCircle className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
                                        <p className={`text-lg font-semibold ${selectedKiosk.isOperational ? 'text-success-600' : 'text-danger-600'}`}>
                                            {selectedKiosk.isOperational ? 'Operational' : 'Offline'}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Coverage Radius</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedKiosk.coverageRadius} km</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Capacity</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {selectedKiosk.currentDrones.length}/{selectedKiosk.capacity} drones
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Charging Slots</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {selectedKiosk.chargingSlots - selectedKiosk.availableChargingSlots}/{selectedKiosk.chargingSlots} in use
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Location</p>
                                    <p className="text-gray-900 dark:text-white font-mono">
                                        {selectedKiosk.position.lat.toFixed(6)}, {selectedKiosk.position.lng.toFixed(6)}
                                    </p>
                                </div>

                                {selectedKiosk.chargingQueue.length > 0 && (
                                    <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800">
                                        <p className="text-sm font-semibold text-warning-800 dark:text-warning-400 mb-2">
                                            Charging Queue ({selectedKiosk.chargingQueue.length})
                                        </p>
                                        <div className="space-y-1">
                                            {selectedKiosk.chargingQueue.map((droneId, index) => (
                                                <p key={droneId} className="text-sm text-warning-700 dark:text-warning-500 font-mono">
                                                    {index + 1}. {droneId}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedKiosk.currentDrones.length > 0 && (
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                            Current Drones ({selectedKiosk.currentDrones.length})
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {selectedKiosk.currentDrones.map((droneId) => (
                                                <p key={droneId} className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-white dark:bg-gray-800 p-2 rounded">
                                                    {droneId}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
