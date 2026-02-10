// Mobile Navigation Component with Hamburger Menu

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Home,
    Map,
    Package,
    Plane,
    MapPin,
    Users,
    Menu,
    X
} from 'lucide-react';

const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/live-map', icon: Map, label: 'Live Map' },
    { path: '/drones', icon: Plane, label: 'Drones' },
    { path: '/orders', icon: Package, label: 'Orders' },
    { path: '/kiosks', icon: MapPin, label: 'Kiosks' },
    { path: '/restaurants', icon: Users, label: 'Restaurants' },
];

export default function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    return (
        <>
            {/* Mobile Header */}
            <div className="mobile-header md:hidden flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                    <Plane className="w-6 h-6 text-blue-600" />
                    <span className="font-bold text-lg">Drone Delivery</span>
                </div>
                <button
                    onClick={toggleMenu}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    aria-label="Toggle menu"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="mobile-overlay active md:hidden"
                    onClick={closeMenu}
                    aria-hidden="true"
                />
            )}

            {/* Slide-out Menu */}
            <div
                className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-xl z-50 md:hidden ${isOpen ? 'slide-in' : 'slide-out'
                    }`}
                style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}
            >
                {/* Menu Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Plane className="w-6 h-6 text-blue-600" />
                            <span className="font-bold text-lg">Menu</span>
                        </div>
                        <button
                            onClick={closeMenu}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                            aria-label="Close menu"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Navigation Items */}
                <nav className="p-4">
                    <ul className="space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;

                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        onClick={closeMenu}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Menu Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Drone Delivery Platform v1.0
                    </div>
                </div>
            </div>
        </>
    );
}
