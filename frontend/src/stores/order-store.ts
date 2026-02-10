// Zustand store for order state management

import { create } from 'zustand';
import type { Order } from '../types';

interface OrderStore {
    orders: Order[];
    setOrders: (orders: Order[]) => void;
    updateOrder: (order: Order) => void;
    addOrder: (order: Order) => void;
    getPendingOrders: () => Order[];
    getActiveOrders: () => Order[];
    getCompletedOrders: () => Order[];
}

export const useOrderStore = create<OrderStore>((set, get) => ({
    orders: [],

    setOrders: (orders) => set({ orders }),

    updateOrder: (updatedOrder) => set((state) => ({
        orders: state.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o),
    })),

    addOrder: (order) => set((state) => ({
        orders: [...state.orders, order],
    })),

    getPendingOrders: () => get().orders.filter(o => o.status === 'PENDING'),

    getActiveOrders: () => get().orders.filter(o =>
        o.status === 'ASSIGNED' || o.status === 'PICKED_UP' || o.status === 'IN_TRANSIT'
    ),

    getCompletedOrders: () => get().orders.filter(o => o.status === 'DELIVERED'),
}));
