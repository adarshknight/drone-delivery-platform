// Orders Page

import React, { useEffect, useState } from 'react';
import { useOrderStore } from '../stores/order-store';
import { socketService } from '../services/socket';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Package, Clock, MapPin } from 'lucide-react';
import { API_CONFIG } from '../config/api';

export const Orders: React.FC = () => {
    const { orders, setOrders } = useOrderStore();
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        // Socket.IO real-time updates
        socketService.on('order:batch', setOrders);

        // Auto-refresh: Fetch fresh data every 5 seconds
        const fetchOrders = async () => {
            try {
                const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/orders`);
                if (response.ok) {
                    const data = await response.json();
                    setOrders(data);
                }
            } catch (error) {
                console.error('Failed to fetch orders:', error);
            }
        };

        // Initial fetch
        fetchOrders();

        // Set up 5-second interval
        const intervalId = setInterval(fetchOrders, 5000);

        // Cleanup on unmount
        return () => {
            socketService.off('order:batch', setOrders);
            clearInterval(intervalId);
        };
    }, [setOrders]);

    const handleCreateTestOrder = async () => {
        setIsCreating(true);
        try {
            // Fetch restaurants and customers
            const [restaurantsRes, customersRes] = await Promise.all([
                fetch(`${API_CONFIG.BACKEND_URL}/api/restaurants`),
                fetch(`${API_CONFIG.BACKEND_URL}/api/customers`)
            ]);

            if (!restaurantsRes.ok || !customersRes.ok) {
                throw new Error('Failed to fetch data');
            }

            const restaurants = await restaurantsRes.json();
            const customers = await customersRes.json();

            // Pick random restaurant and customer
            const randomRestaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
            const randomCustomer = customers[Math.floor(Math.random() * customers.length)];

            // Create sample menu items
            const sampleItems = [
                { name: 'Burger', quantity: 1, price: 12.99, weight: 0.5 },
                { name: 'Pizza', quantity: 1, price: 18.99, weight: 0.8 },
                { name: 'Pasta', quantity: 1, price: 14.99, weight: 0.6 },
                { name: 'Salad', quantity: 1, price: 9.99, weight: 0.3 },
                { name: 'Sandwich', quantity: 1, price: 8.99, weight: 0.4 }
            ];

            // Pick 1-3 random items
            const numItems = Math.floor(Math.random() * 3) + 1;
            const items = [];
            for (let i = 0; i < numItems; i++) {
                items.push(sampleItems[Math.floor(Math.random() * sampleItems.length)]);
            }

            // Random priority
            const priorities = ['STANDARD', 'EXPRESS', 'URGENT'];
            const priority = priorities[Math.floor(Math.random() * priorities.length)];

            // Create order
            const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    restaurantId: randomRestaurant.id,
                    customerId: randomCustomer.id,
                    items,
                    priority
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create order');
            }

            const newOrder = await response.json();
            console.log('Test order created:', newOrder);

            // Show success message (optional)
            alert(`✅ Test order created!\nRestaurant: ${randomRestaurant.name}\nPriority: ${priority}`);

        } catch (error) {
            console.error('Error creating test order:', error);
            alert('❌ Failed to create test order. Check console for details.');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header - Responsive */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Orders</h1>
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">Manage all delivery orders</p>
                </div>
                <button
                    onClick={handleCreateTestOrder}
                    disabled={isCreating}
                    className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 btn-touch disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isCreating ? 'Creating...' : 'Create Test Order'}
                </button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Order ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Priority
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Drone
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Price
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {orders.slice(0, 20).map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        {order.id.substring(0, 12)}...
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={order.status} type="order" />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={order.priority} type="order" />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                        {order.assignedDroneId || 'Unassigned'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                        {new Date(order.createdAt).toLocaleTimeString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        ${order.totalPrice}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {orders.slice(0, 20).map((order) => (
                    <div key={order.id} className="card-mobile">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Package className="w-4 h-4 text-primary-600" />
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {order.id.substring(0, 12)}...
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <StatusBadge status={order.status} type="order" />
                                    <StatusBadge status={order.priority} type="order" />
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold text-gray-900 dark:text-white">
                                    ${order.totalPrice}
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                <MapPin className="w-3 h-3" />
                                <span>{order.assignedDroneId ? order.assignedDroneId.substring(0, 8) : 'Unassigned'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
