// Zustand store for simulation state with persistence

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ScenarioType, WeatherCondition } from '../types';

interface SimulationStore {
    isRunning: boolean;
    speed: number;
    scenario: ScenarioType;
    weather: WeatherCondition;
    weatherImpact: number;
    setRunning: (isRunning: boolean) => void;
    setSpeed: (speed: number) => void;
    setScenario: (scenario: ScenarioType) => void;
    setWeather: (weather: WeatherCondition) => void;
    setWeatherImpact: (impact: number) => void;
    updateState: (state: Partial<SimulationStore>) => void;
}

export const useSimulationStore = create<SimulationStore>()(
    persist(
        (set) => ({
            isRunning: false,
            speed: 1,
            scenario: 'NORMAL' as ScenarioType,
            weather: 'CLEAR' as WeatherCondition,
            weatherImpact: 0,

            setRunning: (isRunning) => set({ isRunning }),
            setSpeed: (speed) => set({ speed }),
            setScenario: (scenario) => set({ scenario }),
            setWeather: (weather) => set({ weather }),
            setWeatherImpact: (impact) => set({ weatherImpact: impact }),
            updateState: (state) => set(state),
        }),
        {
            name: 'drone-delivery-simulation', // localStorage key
            partialize: (state) => ({
                // Only persist these fields
                isRunning: state.isRunning,
                speed: state.speed,
                scenario: state.scenario,
                weatherImpact: state.weatherImpact,
            }),
        }
    )
);
