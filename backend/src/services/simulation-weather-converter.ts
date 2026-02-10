// Simulation Weather Converter
// Converts simulation weather conditions to WeatherData format for the widget

import { WeatherCondition } from '../types/entities.js';
import type { WeatherData, FlightRestrictions, WeatherImpact } from '../types/weather.js';
import { dataStore } from '../data/store.js';

/**
 * Convert simulation weather condition to WeatherData
 */
export function convertSimulationWeatherToData(
    weatherCondition: WeatherCondition,
    weatherImpact: number, // 0-100 slider value
    lat: number,
    lon: number
): WeatherData {
    const baseData = getWeatherDataForCondition(weatherCondition, weatherImpact);

    return {
        ...baseData,
        timestamp: Date.now(),
        location: {
            lat,
            lon,
            city: 'Delhi NCR'
        }
    };
}

/**
 * Get weather data based on simulation condition
 */
function getWeatherDataForCondition(
    condition: WeatherCondition,
    impact: number // 0-100
): Omit<WeatherData, 'timestamp' | 'location'> {
    switch (condition) {
        case WeatherCondition.CLEAR:
            return {
                temperature: 25,
                feelsLike: 24,
                humidity: 45,
                pressure: 1013,
                windSpeed: 3 + (impact / 100) * 2, // 3-5 m/s
                windDirection: 180,
                windGust: 5 + (impact / 100) * 3,
                visibility: 10000,
                cloudCoverage: 10,
                precipitation: 0,
                weatherCondition: 'clear',
                weatherDescription: 'clear sky',
                icon: '01d'
            };

        case WeatherCondition.LIGHT_RAIN:
            return {
                temperature: 20,
                feelsLike: 18,
                humidity: 75,
                pressure: 1010,
                windSpeed: 5 + (impact / 100) * 3, // 5-8 m/s
                windDirection: 220,
                windGust: 8 + (impact / 100) * 4,
                visibility: 8000,
                cloudCoverage: 70,
                precipitation: 2 + (impact / 100) * 3, // 2-5 mm
                weatherCondition: 'rain',
                weatherDescription: 'light rain',
                icon: '10d'
            };

        case WeatherCondition.HEAVY_RAIN:
            return {
                temperature: 18,
                feelsLike: 16,
                humidity: 85,
                pressure: 1005,
                windSpeed: 8 + (impact / 100) * 4, // 8-12 m/s
                windDirection: 240,
                windGust: 12 + (impact / 100) * 6,
                visibility: 5000,
                cloudCoverage: 95,
                precipitation: 8 + (impact / 100) * 7, // 8-15 mm
                weatherCondition: 'rain',
                weatherDescription: 'heavy rain',
                icon: '10d'
            };

        case WeatherCondition.STRONG_WIND:
            return {
                temperature: 22,
                feelsLike: 19,
                humidity: 55,
                pressure: 1008,
                windSpeed: 12 + (impact / 100) * 6, // 12-18 m/s
                windDirection: 270,
                windGust: 18 + (impact / 100) * 10,
                visibility: 9000,
                cloudCoverage: 40,
                precipitation: 0,
                weatherCondition: 'clouds',
                weatherDescription: 'strong wind',
                icon: '03d'
            };

        case WeatherCondition.STORM:
            return {
                temperature: 16,
                feelsLike: 13,
                humidity: 90,
                pressure: 998,
                windSpeed: 15 + (impact / 100) * 10, // 15-25 m/s
                windDirection: 260,
                windGust: 25 + (impact / 100) * 15,
                visibility: 3000,
                cloudCoverage: 100,
                precipitation: 15 + (impact / 100) * 20, // 15-35 mm
                weatherCondition: 'thunderstorm',
                weatherDescription: 'thunderstorm',
                icon: '11d'
            };

        default:
            return getWeatherDataForCondition(WeatherCondition.CLEAR, 0);
    }
}

/**
 * Get current simulation weather as WeatherData
 */
export function getCurrentSimulationWeather(lat: number, lon: number): WeatherData {
    const { weatherCondition, weatherImpact } = dataStore.simulationState;
    return convertSimulationWeatherToData(weatherCondition, weatherImpact, lat, lon);
}

/**
 * Calculate flight restrictions based on simulation weather
 */
export function getSimulationFlightRestrictions(weather: WeatherData): FlightRestrictions {
    const restrictions: FlightRestrictions = {
        canFly: true,
        speedMultiplier: 1.0,
        batteryMultiplier: 1.0,
        warnings: []
    };

    const impact = dataStore.simulationState.weatherImpact / 100; // 0-1

    // Wind restrictions
    if (weather.windSpeed > 15) {
        restrictions.canFly = false;
        restrictions.reason = 'Wind speed too high (>15 m/s)';
    } else if (weather.windSpeed > 10) {
        restrictions.speedMultiplier = 0.7 - (impact * 0.2); // 50-70%
        restrictions.batteryMultiplier = 1.5 + (impact * 0.5); // 150-200%
        restrictions.warnings.push('High wind - reduced speed');
    } else if (weather.windSpeed > 7) {
        restrictions.speedMultiplier = 0.85 - (impact * 0.15); // 70-85%
        restrictions.batteryMultiplier = 1.2 + (impact * 0.3); // 120-150%
        restrictions.warnings.push('Moderate wind');
    }

    // Precipitation restrictions
    if (weather.precipitation > 15) {
        restrictions.canFly = false;
        restrictions.reason = 'Heavy precipitation - unsafe to fly';
    } else if (weather.precipitation > 8) {
        restrictions.speedMultiplier *= 0.7;
        restrictions.batteryMultiplier *= 1.4;
        restrictions.warnings.push('Heavy rain - significantly reduced performance');
    } else if (weather.precipitation > 2) {
        restrictions.speedMultiplier *= 0.85;
        restrictions.batteryMultiplier *= 1.2;
        restrictions.warnings.push('Light rain - reduced performance');
    }

    // Visibility restrictions
    if (weather.visibility < 1000) {
        restrictions.canFly = false;
        restrictions.reason = 'Low visibility (<1km)';
    } else if (weather.visibility < 3000) {
        restrictions.speedMultiplier *= 0.9;
        restrictions.warnings.push('Reduced visibility');
    }

    // Thunderstorm
    if (weather.weatherCondition === 'thunderstorm') {
        restrictions.canFly = false;
        restrictions.reason = 'Thunderstorm - all flights grounded';
    }

    // Add simulation-specific warning
    if (dataStore.simulationState.weatherImpact > 70) {
        restrictions.warnings.push(`Severe weather conditions (${dataStore.simulationState.weatherImpact}% impact)`);
    } else if (dataStore.simulationState.weatherImpact > 40) {
        restrictions.warnings.push(`Moderate weather impact (${dataStore.simulationState.weatherImpact}%)`);
    }

    return restrictions;
}

/**
 * Get detailed weather impact analysis
 */
export function getSimulationWeatherImpact(weather: WeatherData): WeatherImpact {
    const impactValue = dataStore.simulationState.weatherImpact;

    return {
        wind: {
            severity: weather.windSpeed > 15 ? 'extreme' : weather.windSpeed > 10 ? 'high' : weather.windSpeed > 7 ? 'medium' : 'low',
            speedReduction: Math.min(weather.windSpeed * 2 + impactValue * 0.5, 70),
            batteryIncrease: Math.min(weather.windSpeed * 3 + impactValue, 150)
        },
        precipitation: {
            severity: weather.precipitation > 15 ? 'heavy' : weather.precipitation > 8 ? 'moderate' : weather.precipitation > 2 ? 'light' : 'none',
            visibilityReduction: weather.precipitation * 10,
            safeToFly: weather.precipitation < 15
        },
        temperature: {
            batteryEfficiency: weather.temperature < 0 ? 0.7 : weather.temperature > 35 ? 0.85 : 1.0,
            warnings: weather.temperature < 0 ? ['Cold reduces battery efficiency'] : weather.temperature > 35 ? ['Heat may affect battery'] : []
        }
    };
}
