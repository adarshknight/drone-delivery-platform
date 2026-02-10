// Analytics Dashboard Page

import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Package, Plane, DollarSign, Clock, Battery, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { useKPIStore } from '../stores/kpi-store';
import { useDroneStore } from '../stores/drone-store';
import { useOrderStore } from '../stores/order-store';
import { useKioskStore } from '../stores/kiosk-store';
import { useRestaurantStore } from '../stores/restaurant-store';
import { DroneStatus, OrderStatus } from '../types';

interface TimeSeriesData {
    timestamp: string;
    value: number;
}

export const Analytics: React.FC = () => {
    const { metrics } = useKPIStore();
    const { drones } = useDroneStore();
    const { orders } = useOrderStore();
    const { kiosks } = useKioskStore();
    const { restaurants } = useRestaurantStore();

    // Calculate advanced metrics
    const totalDrones = drones.length;
    const activeDrones = drones.filter(d => d.status !== DroneStatus.IDLE && d.status !== DroneStatus.CHARGING).length;
    const droneUtilization = totalDrones > 0 ? (activeDrones / totalDrones) * 100 : 0;

    const completedOrders = orders.filter(o => o.status === OrderStatus.DELIVERED).length;
    const failedOrders = orders.filter(o => o.status === OrderStatus.FAILED).length;
    const successRate = (completedOrders + failedOrders) > 0
        ? (completedOrders / (completedOrders + failedOrders)) * 100
        : 100;

    const avgBattery = drones.length > 0
        ? drones.reduce((sum, d) => sum + d.battery, 0) / drones.length
        : 0;

    const totalChargingSlots = kiosks.reduce((sum, k) => sum + k.chargingSlots, 0);
    const usedChargingSlots = kiosks.reduce((sum, k) => sum + (k.chargingSlots - k.availableChargingSlots), 0);
    const chargingUtilization = totalChargingSlots > 0 ? (usedChargingSlots / totalChargingSlots) * 100 : 0;

    const openRestaurants = restaurants.filter(r => r.isOpen).length;
    const restaurantUtilization = restaurants.length > 0 ? (openRestaurants / restaurants.length) * 100 : 0;

    // Drone status breakdown
    const dronesByStatus = {
        idle: drones.filter(d => d.status === DroneStatus.IDLE).length,
        charging: drones.filter(d => d.status === DroneStatus.CHARGING).length,
        flying: drones.filter(d => d.status === DroneStatus.FLYING_TO_RESTAURANT || d.status === DroneStatus.FLYING_TO_CUSTOMER || d.status === DroneStatus.RETURNING_TO_KIOSK).length,
    };

    const statusPercentages = {
        idle: totalDrones > 0 ? (dronesByStatus.idle / totalDrones) * 100 : 0,
        charging: totalDrones > 0 ? (dronesByStatus.charging / totalDrones) * 100 : 0,
        flying: totalDrones > 0 ? (dronesByStatus.flying / totalDrones) * 100 : 0,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Performance insights and operational metrics
                </p>
            </div>

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Delivery Success Rate */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-success-100 dark:bg-success-900/30 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-success-600" />
                        </div>
                        {successRate >= 90 ? (
                            <TrendingUp className="w-5 h-5 text-success-600" />
                        ) : (
                            <TrendingDown className="w-5 h-5 text-danger-600" />
                        )}
                    </div>
                    <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-1">Success Rate</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{successRate.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {completedOrders} delivered, {failedOrders} failed
                    </p>
                </div>

                {/* Drone Utilization */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                            <Plane className="w-6 h-6 text-primary-600" />
                        </div>
                        {droneUtilization >= 50 ? (
                            <TrendingUp className="w-5 h-5 text-success-600" />
                        ) : (
                            <TrendingDown className="w-5 h-5 text-warning-600" />
                        )}
                    </div>
                    <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-1">Drone Utilization</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{droneUtilization.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {activeDrones} of {totalDrones} active
                    </p>
                </div>

                {/* Average Battery */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-warning-100 dark:bg-warning-900/30 rounded-lg">
                            <Battery className="w-6 h-6 text-warning-600" />
                        </div>
                        {avgBattery >= 60 ? (
                            <TrendingUp className="w-5 h-5 text-success-600" />
                        ) : (
                            <TrendingDown className="w-5 h-5 text-danger-600" />
                        )}
                    </div>
                    <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Fleet Battery</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{avgBattery.toFixed(0)}%</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Across {totalDrones} drones
                    </p>
                </div>

                {/* Revenue */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-success-100 dark:bg-success-900/30 rounded-lg">
                            <DollarSign className="w-6 h-6 text-success-600" />
                        </div>
                        <TrendingUp className="w-5 h-5 text-success-600" />
                    </div>
                    <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">${metrics.totalRevenue}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        From {completedOrders} deliveries
                    </p>
                </div>
            </div>

            {/* Drone Status Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Drone Fleet Status</h3>

                <div className="space-y-4">
                    {/* Idle */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">Idle</span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {dronesByStatus.idle} ({statusPercentages.idle.toFixed(0)}%)
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-gray-400 h-2 rounded-full transition-all"
                                style={{ width: `${statusPercentages.idle}%` }}
                            />
                        </div>
                    </div>

                    {/* Charging */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-warning-500"></div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">Charging</span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {dronesByStatus.charging} ({statusPercentages.charging.toFixed(0)}%)
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-warning-500 h-2 rounded-full transition-all"
                                style={{ width: `${statusPercentages.charging}%` }}
                            />
                        </div>
                    </div>

                    {/* Flying */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-primary-600"></div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">Flying</span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {dronesByStatus.flying} ({statusPercentages.flying.toFixed(0)}%)
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-primary-600 h-2 rounded-full transition-all"
                                style={{ width: `${statusPercentages.flying}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Operational Efficiency */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Delivery Performance */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Delivery Performance</h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-primary-600" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Avg Delivery Time</span>
                            </div>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                {metrics.averageDeliveryTime.toFixed(0)} min
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Package className="w-5 h-5 text-success-600" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Completed Orders</span>
                            </div>
                            <span className="text-lg font-bold text-success-600">
                                {metrics.ordersCompleted}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Zap className="w-5 h-5 text-warning-600" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">In Progress</span>
                            </div>
                            <span className="text-lg font-bold text-warning-600">
                                {metrics.ordersInProgress}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-danger-600" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Failed Orders</span>
                            </div>
                            <span className="text-lg font-bold text-danger-600">
                                {failedOrders}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Infrastructure Utilization */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Infrastructure Utilization</h3>

                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-700 dark:text-gray-300">Charging Stations</span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {chargingUtilization.toFixed(0)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all ${chargingUtilization > 80 ? 'bg-danger-600' :
                                        chargingUtilization > 50 ? 'bg-warning-500' :
                                            'bg-success-600'
                                        }`}
                                    style={{ width: `${chargingUtilization}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {usedChargingSlots} of {totalChargingSlots} slots in use
                            </p>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-700 dark:text-gray-300">Restaurant Network</span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {restaurantUtilization.toFixed(0)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-success-600 h-2 rounded-full transition-all"
                                    style={{ width: `${restaurantUtilization}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {openRestaurants} of {restaurants.length} restaurants open
                            </p>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-700 dark:text-gray-300">Drone Fleet</span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {droneUtilization.toFixed(0)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all ${droneUtilization > 80 ? 'bg-success-600' :
                                        droneUtilization > 50 ? 'bg-primary-600' :
                                            'bg-warning-500'
                                        }`}
                                    style={{ width: `${droneUtilization}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {activeDrones} of {totalDrones} drones active
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Drones</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalDrones}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Kiosks</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{kiosks.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Restaurants</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{restaurants.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{orders.length}</p>
                </div>
            </div>
        </div>
    );
};
