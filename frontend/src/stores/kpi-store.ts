// Zustand store for KPI metrics

import { create } from 'zustand';
import type { KPIMetrics, Alert } from '../types';

interface KPIStore {
    metrics: KPIMetrics;
    alerts: Alert[];
    setMetrics: (metrics: KPIMetrics) => void;
    addAlert: (alert: Alert) => void;
    setAlerts: (alerts: Alert[]) => void;
}

export const useKPIStore = create<KPIStore>((set) => ({
    metrics: {
        totalDrones: 0,
        activeDrones: 0,
        idleDrones: 0,
        chargingDrones: 0,
        ordersToday: 0,
        ordersInProgress: 0,
        ordersCompleted: 0,
        ordersCancelled: 0,
        onTimeDeliveryRate: 100,
        averageDeliveryTime: 0,
        totalAlerts: 0,
        criticalAlerts: 0,
        totalRevenue: 0,
        averageBatteryLevel: 100,
    },
    alerts: [],

    setMetrics: (metrics) => set({ metrics }),
    addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts].slice(0, 50) })),
    setAlerts: (alerts) => set({ alerts }),
}));
