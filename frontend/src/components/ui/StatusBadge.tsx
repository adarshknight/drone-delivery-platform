// Status Badge Component

import React from 'react';
import type { DroneStatus, OrderStatus, AlertSeverity } from '../../types';

interface StatusBadgeProps {
    status: DroneStatus | OrderStatus | AlertSeverity | string;
    type?: 'drone' | 'order' | 'alert';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'drone' }) => {
    const getStatusColor = () => {
        if (type === 'drone') {
            const droneColors: Record<string, string> = {
                IDLE: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                CHARGING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
                FLYING_TO_RESTAURANT: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
                WAITING_FOR_PICKUP: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
                FLYING_TO_CUSTOMER: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
                DELIVERING: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
                RETURNING_TO_KIOSK: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
                EMERGENCY_LANDING: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
                MAINTENANCE: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
            };
            return droneColors[status] || 'bg-gray-100 text-gray-800';
        }

        if (type === 'order') {
            const orderColors: Record<string, string> = {
                PENDING: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                ASSIGNED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
                PICKED_UP: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
                IN_TRANSIT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
                DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
                CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
                FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
            };
            return orderColors[status] || 'bg-gray-100 text-gray-800';
        }

        if (type === 'alert') {
            const alertColors: Record<string, string> = {
                INFO: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
                WARNING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
                CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
            };
            return alertColors[status] || 'bg-gray-100 text-gray-800';
        }

        return 'bg-gray-100 text-gray-800';
    };

    const formatStatus = (status: string) => {
        return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {formatStatus(status)}
        </span>
    );
};
