// KPI Card Component

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    color?: 'primary' | 'success' | 'warning' | 'danger';
}

export const KPICard: React.FC<KPICardProps> = ({
    title,
    value,
    icon,
    trend,
    trendValue,
    color = 'primary',
}) => {
    const colorClasses = {
        primary: 'bg-primary-500 text-white',
        success: 'bg-success-500 text-white',
        warning: 'bg-warning-500 text-white',
        danger: 'bg-danger-500 text-white',
    };

    const trendIcons = {
        up: <TrendingUp className="w-4 h-4" />,
        down: <TrendingDown className="w-4 h-4" />,
        neutral: <Minus className="w-4 h-4" />,
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    {icon}
                </div>
                {trend && trendValue && (
                    <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-success-600' : trend === 'down' ? 'text-danger-600' : 'text-gray-600'
                        }`}>
                        {trendIcons[trend]}
                        <span>{trendValue}</span>
                    </div>
                )}
            </div>
            <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white animate-counter">{value}</p>
            </div>
        </div>
    );
};
