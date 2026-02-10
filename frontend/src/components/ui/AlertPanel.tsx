// Alert Panel Component

import React from 'react';
import { AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useKPIStore } from '../../stores/kpi-store';
import { StatusBadge } from './StatusBadge';

export const AlertPanel: React.FC = () => {
    const { alerts } = useKPIStore();
    const recentAlerts = alerts.slice(0, 5);

    const getAlertIcon = (severity: string) => {
        switch (severity) {
            case 'CRITICAL':
                return <XCircle className="w-5 h-5 text-danger-500" />;
            case 'WARNING':
                return <AlertTriangle className="w-5 h-5 text-warning-500" />;
            default:
                return <Info className="w-5 h-5 text-primary-500" />;
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Alerts</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {alerts.length} total
                </span>
            </div>

            <div className="space-y-3">
                {recentAlerts.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        No alerts
                    </p>
                ) : (
                    recentAlerts.map((alert) => (
                        <div
                            key={alert.id}
                            className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            {getAlertIcon(alert.severity)}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <StatusBadge status={alert.severity} type="alert" />
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(alert.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-900 dark:text-white">{alert.message}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
