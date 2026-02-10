// Scenario definitions for different simulation modes

import type { Scenario } from '../types/entities.js';
import { ScenarioType, WeatherCondition } from '../types/entities.js';

export const scenarios: Record<ScenarioType, Scenario> = {
    [ScenarioType.NORMAL]: {
        type: ScenarioType.NORMAL,
        name: 'Normal Day',
        description: 'Standard operating conditions with regular order flow',
        parameters: {
            orderFrequency: 0.5, // 0.5 orders per minute (1 every 2 minutes)
            activeDrones: 15,
            weatherCondition: WeatherCondition.CLEAR,
            speedMultiplier: 1.0,
            batteryDrainMultiplier: 1.0,
            failureRate: 0.05, // 5% failure rate
        },
    },
    [ScenarioType.PEAK_HOUR]: {
        type: ScenarioType.PEAK_HOUR,
        name: 'Peak Hour Rush',
        description: 'High demand period with increased order volume',
        parameters: {
            orderFrequency: 2.0, // 2 orders per minute
            activeDrones: 20,
            weatherCondition: WeatherCondition.CLEAR,
            speedMultiplier: 1.0,
            batteryDrainMultiplier: 1.2, // More intensive operations
            failureRate: 0.15, // 15% failure rate due to stress
        },
    },
    [ScenarioType.BAD_WEATHER]: {
        type: ScenarioType.BAD_WEATHER,
        name: 'Adverse Weather',
        description: 'Challenging weather conditions affecting operations',
        parameters: {
            orderFrequency: 0.3, // Reduced orders
            activeDrones: 12, // Some drones grounded
            weatherCondition: WeatherCondition.HEAVY_RAIN,
            speedMultiplier: 0.5, // 50% speed reduction
            batteryDrainMultiplier: 2.0, // Double battery consumption
            failureRate: 0.30, // 30% failure rate
        },
    },
};

export function getScenario(type: ScenarioType): Scenario {
    return scenarios[type];
}
