// Placeholder pages for Kiosks, Restaurants, and Analytics

import React from 'react';

export const Kiosks: React.FC = () => {
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Kiosks</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Kiosk management coming soon...</p>
        </div>
    );
};

export const Restaurants: React.FC = () => {
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Restaurants</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Restaurant management coming soon...</p>
        </div>
    );
};

export const Analytics: React.FC = () => {
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Analytics dashboard coming soon...</p>
        </div>
    );
};
