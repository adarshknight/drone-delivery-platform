// Battery drain model for realistic drone simulation

import type { Drone, WeatherCondition } from '../types/entities.js';

export interface BatteryDrainFactors {
    baseConsumption: number; // % per km at cruise speed
    payloadFactor: number; // additional % per kg
    altitudeFactor: number; // additional % per 100m altitude
    weatherFactor: number; // multiplier based on weather
    speedFactor: number; // multiplier based on speed vs cruise speed
}

const BASE_DRAIN_FACTORS: BatteryDrainFactors = {
    baseConsumption: 1, // 1% per km (reduced from 2% for better range)
    payloadFactor: 0.3, // 0.3% per kg (reduced from 0.5%)
    altitudeFactor: 0.2, // 0.2% per 100m (reduced from 0.3%)
    weatherFactor: 1.0,
    speedFactor: 1.0,
};

export function getWeatherMultiplier(weather: WeatherCondition): number {
    switch (weather) {
        case 'CLEAR':
            return 1.0;
        case 'LIGHT_RAIN':
            return 1.2;
        case 'HEAVY_RAIN':
            return 1.5;
        case 'STRONG_WIND':
            return 1.4;
        case 'STORM':
            return 2.0;
        default:
            return 1.0;
    }
}

export function calculateBatteryDrain(
    drone: Drone,
    distanceTraveled: number, // km
    weather: WeatherCondition,
    weatherImpact: number // 0-100 slider value
): number {
    const factors = { ...BASE_DRAIN_FACTORS };

    // Apply weather multiplier
    const baseWeatherMultiplier = getWeatherMultiplier(weather);
    const adjustedWeatherMultiplier = 1 + (baseWeatherMultiplier - 1) * (weatherImpact / 100);
    factors.weatherFactor = adjustedWeatherMultiplier;

    // Apply speed factor (faster = more drain)
    const cruiseSpeed = drone.maxSpeed * 0.7;
    factors.speedFactor = drone.speed > cruiseSpeed ? 1 + (drone.speed - cruiseSpeed) / cruiseSpeed : 1.0;

    // Calculate total drain
    let drain = factors.baseConsumption * distanceTraveled;
    drain += factors.payloadFactor * drone.currentPayload * distanceTraveled;
    drain += factors.altitudeFactor * (drone.position.altitude / 100) * distanceTraveled;
    drain *= factors.weatherFactor;
    drain *= factors.speedFactor;

    return drain;
}

export function calculateIdleDrain(timeSeconds: number): number {
    // Idle drain: 0.5% per hour = 0.000139% per second
    return 0.000139 * timeSeconds;
}

export function calculateChargingRate(timeSeconds: number): number {
    // Charging rate: 150% per hour = 0.04167% per second (3x faster to match 3x battery capacity)
    return 0.04167 * timeSeconds;
}

export function estimateRemainingRange(drone: Drone, weather: WeatherCondition, weatherImpact: number): number {
    // Estimate how many km the drone can fly with current battery
    const factors = { ...BASE_DRAIN_FACTORS };
    const baseWeatherMultiplier = getWeatherMultiplier(weather);
    const adjustedWeatherMultiplier = 1 + (baseWeatherMultiplier - 1) * (weatherImpact / 100);
    factors.weatherFactor = adjustedWeatherMultiplier;

    const drainPerKm =
        factors.baseConsumption +
        factors.payloadFactor * drone.currentPayload +
        factors.altitudeFactor * (drone.position.altitude / 100);

    const totalDrainPerKm = drainPerKm * factors.weatherFactor;

    return (drone.battery / totalDrainPerKm) * 0.8; // 80% safety margin
}

export function shouldReturnToKiosk(drone: Drone, distanceToKiosk: number, weather: WeatherCondition, weatherImpact: number): boolean {
    const remainingRange = estimateRemainingRange(drone, weather, weatherImpact);
    const safetyMargin = 1.2; // 20% extra range needed (reduced from 1.5 for more deliveries)

    return remainingRange < distanceToKiosk * safetyMargin || drone.battery < 15;
}
