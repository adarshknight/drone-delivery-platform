// Zustand store for restaurant state

import { create } from 'zustand';
import type { Restaurant } from '../types';

interface RestaurantStore {
    restaurants: Restaurant[];
    setRestaurants: (restaurants: Restaurant[]) => void;
    updateRestaurant: (restaurant: Restaurant) => void;
}

export const useRestaurantStore = create<RestaurantStore>((set) => ({
    restaurants: [],

    setRestaurants: (restaurants) => set({ restaurants }),

    updateRestaurant: (updatedRestaurant) => set((state) => ({
        restaurants: state.restaurants.map(r => r.id === updatedRestaurant.id ? updatedRestaurant : r)
    })),
}));
