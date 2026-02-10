// Restaurants Management Page

import React, { useEffect, useState } from 'react';
import { Utensils, Search, Filter, AlertCircle, Star, Clock, Package, MapPin, XCircle } from 'lucide-react';
import { useRestaurantStore } from '../stores/restaurant-store';
import { API_CONFIG } from '../config/api';
import type { Restaurant } from '../types';

export const Restaurants: React.FC = () => {
    const { restaurants, setRestaurants } = useRestaurantStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('all');
    const [filterCuisine, setFilterCuisine] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'name' | 'rating' | 'orders'>('name');
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

    useEffect(() => {
        // Fetch restaurants data
        const fetchRestaurants = async () => {
            try {
                const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/restaurants`);
                if (response.ok) {
                    const data = await response.json();
                    setRestaurants(data);
                }
            } catch (error) {
                console.error('Failed to fetch restaurants:', error);
            }
        };

        // Initial fetch
        fetchRestaurants();

        // Set up 5-second interval for auto-refresh
        const intervalId = setInterval(fetchRestaurants, 5000);

        // Cleanup on unmount
        return () => {
            clearInterval(intervalId);
        };
    }, [setRestaurants]);

    // Get unique cuisines
    const cuisines = Array.from(new Set(restaurants.map(r => r.cuisine))).sort();

    // Filter and sort restaurants
    const filteredRestaurants = restaurants
        .filter(restaurant => {
            const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus =
                filterStatus === 'all' ||
                (filterStatus === 'open' && restaurant.isOpen) ||
                (filterStatus === 'closed' && !restaurant.isOpen);
            const matchesCuisine = filterCuisine === 'all' || restaurant.cuisine === filterCuisine;
            return matchesSearch && matchesStatus && matchesCuisine;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'rating':
                    return b.rating - a.rating;
                case 'orders':
                    return b.currentOrders.length - a.currentOrders.length;
                default:
                    return 0;
            }
        });

    // Calculate summary stats
    const stats = {
        total: restaurants.length,
        open: restaurants.filter(r => r.isOpen).length,
        closed: restaurants.filter(r => !r.isOpen).length,
        totalOrders: restaurants.reduce((sum, r) => sum + r.currentOrders.length, 0),
        avgRating: restaurants.length > 0
            ? restaurants.reduce((sum, r) => sum + r.rating, 0) / restaurants.length
            : 0,
        cuisines: cuisines.length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Restaurant Network</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Manage and monitor restaurant partners
                </p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Restaurants</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                        </div>
                        <Utensils className="w-8 h-8 text-primary-600" />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Open Now</p>
                            <p className="text-2xl font-bold text-success-600">{stats.open}</p>
                        </div>
                        <Utensils className="w-8 h-8 text-success-600" />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Active Orders</p>
                            <p className="text-2xl font-bold text-warning-600">{stats.totalOrders}</p>
                        </div>
                        <Package className="w-8 h-8 text-warning-600" />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats.avgRating.toFixed(1)} ⭐
                            </p>
                        </div>
                        <Star className="w-8 h-8 text-warning-500" />
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
                            placeholder="Search restaurants..."
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
                            <option value="open">Open</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>

                    {/* Cuisine Filter */}
                    <select
                        value={filterCuisine}
                        onChange={(e) => setFilterCuisine(e.target.value)}
                        className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="all">All Cuisines</option>
                        {cuisines.map(cuisine => (
                            <option key={cuisine} value={cuisine}>{cuisine}</option>
                        ))}
                    </select>

                    {/* Sort */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="name">Sort by Name</option>
                        <option value="rating">Sort by Rating</option>
                        <option value="orders">Sort by Orders</option>
                    </select>
                </div>
            </div>

            {/* Restaurant Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredRestaurants.map((restaurant) => (
                    <div
                        key={restaurant.id}
                        onClick={() => setSelectedRestaurant(restaurant)}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${restaurant.isOpen ? 'bg-success-100 dark:bg-success-900/30' : 'bg-gray-100 dark:bg-gray-900/30'}`}>
                                    <Utensils className={`w-6 h-6 ${restaurant.isOpen ? 'text-success-600' : 'text-gray-600'}`} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{restaurant.name}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{restaurant.cuisine}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${restaurant.isOpen
                                ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                                }`}>
                                {restaurant.isOpen ? 'Open' : 'Closed'}
                            </span>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-4 h-4 ${i < Math.floor(restaurant.rating)
                                            ? 'text-warning-500 fill-warning-500'
                                            : 'text-gray-300 dark:text-gray-600'
                                            }`}
                                    />
                                ))}
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {restaurant.rating.toFixed(1)}
                            </span>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Prep Time</p>
                                </div>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    {restaurant.averagePrepTime} min
                                </p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <Package className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Active Orders</p>
                                </div>
                                <p className={`text-lg font-bold ${restaurant.currentOrders.length > 0 ? 'text-warning-600' : 'text-gray-900 dark:text-white'
                                    }`}>
                                    {restaurant.currentOrders.length}
                                </p>
                            </div>
                        </div>

                        {/* Active Orders Indicator */}
                        {restaurant.currentOrders.length > 0 && (
                            <div className="mt-4 p-2 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800">
                                <p className="text-xs text-warning-800 dark:text-warning-400 text-center font-medium">
                                    🔥 {restaurant.currentOrders.length} order{restaurant.currentOrders.length > 1 ? 's' : ''} in progress
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredRestaurants.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No restaurants found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        Try adjusting your search or filter criteria
                    </p>
                </div>
            )}

            {/* Detail Modal */}
            {selectedRestaurant && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedRestaurant(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedRestaurant.name}</h2>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">Restaurant ID: {selectedRestaurant.id}</p>
                                    <p className="text-lg text-gray-700 dark:text-gray-300 mt-2">{selectedRestaurant.cuisine}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedRestaurant(null)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    <XCircle className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Rating Display */}
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Rating</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-6 h-6 ${i < Math.floor(selectedRestaurant.rating)
                                                        ? 'text-warning-500 fill-warning-500'
                                                        : 'text-gray-300 dark:text-gray-600'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {selectedRestaurant.rating.toFixed(1)}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
                                        <p className={`text-lg font-semibold ${selectedRestaurant.isOpen ? 'text-success-600' : 'text-gray-600'}`}>
                                            {selectedRestaurant.isOpen ? 'Open' : 'Closed'}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Prep Time</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {selectedRestaurant.averagePrepTime} minutes
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                                    </div>
                                    <p className="text-gray-900 dark:text-white font-mono">
                                        {selectedRestaurant.position.lat.toFixed(6)}, {selectedRestaurant.position.lng.toFixed(6)}
                                    </p>
                                </div>

                                {selectedRestaurant.currentOrders.length > 0 && (
                                    <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800">
                                        <p className="text-sm font-semibold text-warning-800 dark:text-warning-400 mb-2">
                                            Active Orders ({selectedRestaurant.currentOrders.length})
                                        </p>
                                        <div className="space-y-1">
                                            {selectedRestaurant.currentOrders.map((orderId, index) => (
                                                <p key={orderId} className="text-sm text-warning-700 dark:text-warning-500 font-mono">
                                                    {index + 1}. {orderId}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedRestaurant.currentOrders.length === 0 && (
                                    <div className="p-4 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success-200 dark:border-success-800">
                                        <p className="text-sm text-success-800 dark:text-success-400 text-center">
                                            ✓ No active orders - Ready for new orders
                                        </p>
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
