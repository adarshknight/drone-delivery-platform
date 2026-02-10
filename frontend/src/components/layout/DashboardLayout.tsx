// Dashboard Layout Component

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from '../ui/ThemeToggle';
import MobileNav from '../MobileNav';
import BottomNav from '../BottomNav';

export const DashboardLayout: React.FC = () => {
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            {/* Mobile Navigation */}
            <MobileNav />

            {/* Desktop Sidebar - Hidden on mobile */}
            <div className="hidden md:block">
                <Sidebar />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header - Hidden on mobile, shown on tablet+ */}
                <header className="hidden md:flex bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 rounded-full text-sm font-medium">
                            LIVE
                        </span>
                    </div>
                    <ThemeToggle />
                </header>

                {/* Main Content - Adjusted padding for mobile */}
                <main
                    className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6"
                    style={{ height: 'calc(100vh - 73px)' }}
                >
                    <div className="h-full">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Bottom Navigation - Mobile only */}
            <BottomNav />
        </div>
    );
};
