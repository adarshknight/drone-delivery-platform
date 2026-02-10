// Sidebar Navigation Component

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Map,
    Package,
    Plane,
    Building2,
    UtensilsCrossed,
    BarChart3,
    Settings,
    LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth-store';

export const Sidebar: React.FC = () => {
    const location = useLocation();
    const { user, logout } = useAuthStore();

    const navItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN'] },
        { path: '/live-map', icon: Map, label: 'Live Map', roles: ['ADMIN', 'KIOSK_OPERATOR'] },
        { path: '/orders', icon: Package, label: 'Orders', roles: ['ADMIN', 'RESTAURANT_OPERATOR'] },
        { path: '/drones', icon: Plane, label: 'Drones', roles: ['ADMIN', 'KIOSK_OPERATOR'] },
        { path: '/kiosks', icon: Building2, label: 'Kiosks', roles: ['ADMIN', 'KIOSK_OPERATOR'] },
        { path: '/restaurants', icon: UtensilsCrossed, label: 'Restaurants', roles: ['ADMIN', 'RESTAURANT_OPERATOR'] },
        { path: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['ADMIN'] },
    ];

    const filteredNavItems = navItems.filter(item =>
        !user || item.roles.includes(user.role)
    );

    return (
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    🚁 DroneDelivery
                </h1>
                {user && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {user.username}
                    </p>
                )}
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => logout()}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};
