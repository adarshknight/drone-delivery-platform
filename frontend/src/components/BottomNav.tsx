// Bottom Navigation for Mobile

import { Link, useLocation } from 'react-router-dom';
import { Home, Map, Package, Plane } from 'lucide-react';

const bottomNavItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/live-map', icon: Map, label: 'Map' },
    { path: '/orders', icon: Package, label: 'Orders' },
    { path: '/drones', icon: Plane, label: 'Drones' },
];

export default function BottomNav() {
    const location = useLocation();

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 md:hidden z-40 safe-bottom">
            <nav className="flex justify-around items-center h-16">
                {bottomNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${isActive
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''}`} />
                            <span className="text-xs mt-1 font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
