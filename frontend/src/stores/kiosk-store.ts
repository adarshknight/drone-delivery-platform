// Zustand store for kiosk state

import { create } from 'zustand';
import type { Kiosk } from '../types';

interface KioskStore {
    kiosks: Kiosk[];
    setKiosks: (kiosks: Kiosk[]) => void;
    updateKiosk: (kiosk: Kiosk) => void;
}

export const useKioskStore = create<KioskStore>((set) => ({
    kiosks: [],

    setKiosks: (kiosks) => set({ kiosks }),

    updateKiosk: (updatedKiosk) => set((state) => ({
        kiosks: state.kiosks.map(k => k.id === updatedKiosk.id ? updatedKiosk : k)
    })),
}));
