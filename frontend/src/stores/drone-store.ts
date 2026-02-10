// Zustand store for drone state management

import { create } from 'zustand';
import type { Drone } from '../types';

interface DroneStore {
    drones: Drone[];
    selectedDrone: Drone | null;
    setDrones: (drones: Drone[]) => void;
    updateDrone: (drone: Drone) => void;
    selectDrone: (drone: Drone | null) => void;
    getActiveDrones: () => Drone[];
    getIdleDrones: () => Drone[];
}

export const useDroneStore = create<DroneStore>((set, get) => ({
    drones: [],
    selectedDrone: null,

    setDrones: (drones) => set({ drones }),

    updateDrone: (updatedDrone) => set((state) => ({
        drones: state.drones.map(d => d.id === updatedDrone.id ? updatedDrone : d),
        selectedDrone: state.selectedDrone?.id === updatedDrone.id ? updatedDrone : state.selectedDrone,
    })),

    selectDrone: (drone) => set({ selectedDrone: drone }),

    getActiveDrones: () => get().drones.filter(d =>
        d.status !== 'IDLE' && d.status !== 'CHARGING' && d.status !== 'MAINTENANCE'
    ),

    getIdleDrones: () => get().drones.filter(d => d.status === 'IDLE'),
}));
