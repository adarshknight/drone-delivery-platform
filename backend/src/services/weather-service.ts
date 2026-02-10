// Weather Service - OpenWeatherMap API Integration

import axios from 'axios';
import type { WeatherData, FlightRestrictions, WeatherImpact } from '../types/weather.js';

class WeatherService {
    private apiKey: string;
    private baseUrl = 'https://api.openweathermap.org/data/2.5';
    private cache: Map<string, { data: WeatherData; timestamp: number }> = new Map();
    private cacheDuration = 10 * 60 * 1000; // 10 minutes

    constructor() {
        // Use environment variable or demo key
        this.apiKey = process.env.OPENWEATHER_API_KEY || 'demo';

        if (this.apiKey === 'demo') {
            console.warn('⚠️  Using demo weather data. Set OPENWEATHER_API_KEY for real data.');
        }
    }

    /**
     * Get current weather for a location
     */
    async getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
        const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;

        // Check cache
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
            return cached.data;
        }

        // If demo mode, return simulated data
        if (this.apiKey === 'demo') {
            const demoData = this.generateDemoWeather(lat, lon);
            this.cache.set(cacheKey, { data: demoData, timestamp: Date.now() });
            return demoData;
        }

        try {
            // Fetch from OpenWeatherMap
            const response = await axios.get(`${this.baseUrl}/weather`, {
                params: {
                    lat,
                    lon,
                    appid: this.apiKey,
                    units: 'metric'
                }
            });

            const data = this.parseWeatherResponse(response.data, lat, lon);
            this.cache.set(cacheKey, { data, timestamp: Date.now() });
            return data;
        } catch (error) {
            console.error('Failed to fetch weather:', error);
            // Return demo data as fallback
            return this.generateDemoWeather(lat, lon);
        }
    }

    /**
     * Parse OpenWeatherMap API response
     */
    private parseWeatherResponse(apiData: any, lat: number, lon: number): WeatherData {
        const main = apiData.main;
        const wind = apiData.wind;
        const weather = apiData.weather[0];

        return {
            temperature: main.temp,
            feelsLike: main.feels_like,
            humidity: main.humidity,
            pressure: main.pressure,
            windSpeed: wind.speed,
            windDirection: wind.deg,
            windGust: wind.gust,
            visibility: apiData.visibility,
            cloudCoverage: apiData.clouds.all,
            precipitation: apiData.rain?.['1h'] || apiData.snow?.['1h'] || 0,
            weatherCondition: this.mapWeatherCondition(weather.main),
            weatherDescription: weather.description,
            icon: weather.icon,
            timestamp: Date.now(),
            location: {
                lat,
                lon,
                city: apiData.name
            }
        };
    }

    /**
     * Map OpenWeatherMap condition to our enum
     */
    private mapWeatherCondition(condition: string): WeatherData['weatherCondition'] {
        const lower = condition.toLowerCase();
        if (lower.includes('clear')) return 'clear';
        if (lower.includes('cloud')) return 'clouds';
        if (lower.includes('rain') || lower.includes('drizzle')) return 'rain';
        if (lower.includes('snow')) return 'snow';
        if (lower.includes('thunder')) return 'thunderstorm';
        if (lower.includes('fog') || lower.includes('mist')) return 'fog';
        return 'clear';
    }

    /**
     * Generate demo weather data for testing
     */
    private generateDemoWeather(lat: number, lon: number): WeatherData {
        const hour = new Date().getHours();
        const conditions: WeatherData['weatherCondition'][] = ['clear', 'clouds', 'rain'];
        const condition = conditions[hour % 3];

        return {
            temperature: 20 + Math.sin(hour / 24 * Math.PI * 2) * 10,
            feelsLike: 18 + Math.sin(hour / 24 * Math.PI * 2) * 10,
            humidity: 60 + Math.random() * 20,
            pressure: 1013 + Math.random() * 10,
            windSpeed: 3 + Math.random() * 7,
            windDirection: Math.random() * 360,
            windGust: 5 + Math.random() * 10,
            visibility: 10000,
            cloudCoverage: condition === 'clear' ? 10 : condition === 'clouds' ? 60 : 90,
            precipitation: condition === 'rain' ? 2 : 0,
            weatherCondition: condition,
            weatherDescription: condition === 'clear' ? 'clear sky' : condition === 'clouds' ? 'scattered clouds' : 'light rain',
            icon: condition === 'clear' ? '01d' : condition === 'clouds' ? '03d' : '10d',
            timestamp: Date.now(),
            location: { lat, lon, city: 'Demo City' }
        };
    }

    /**
     * Calculate flight restrictions based on weather
     */
    getFlightRestrictions(weather: WeatherData): FlightRestrictions {
        const restrictions: FlightRestrictions = {
            canFly: true,
            speedMultiplier: 1.0,
            batteryMultiplier: 1.0,
            warnings: []
        };

        // Wind restrictions
        if (weather.windSpeed > 15) {
            restrictions.canFly = false;
            restrictions.reason = 'Wind speed too high (>15 m/s)';
        } else if (weather.windSpeed > 10) {
            restrictions.speedMultiplier = 0.7;
            restrictions.batteryMultiplier = 1.5;
            restrictions.warnings.push('High wind - reduced speed');
        } else if (weather.windSpeed > 7) {
            restrictions.speedMultiplier = 0.85;
            restrictions.batteryMultiplier = 1.2;
            restrictions.warnings.push('Moderate wind');
        }

        // Precipitation restrictions
        if (weather.precipitation > 10) {
            restrictions.canFly = false;
            restrictions.reason = 'Heavy precipitation';
        } else if (weather.precipitation > 5) {
            restrictions.speedMultiplier *= 0.8;
            restrictions.batteryMultiplier *= 1.3;
            restrictions.warnings.push('Moderate rain');
        }

        // Visibility restrictions
        if (weather.visibility < 1000) {
            restrictions.canFly = false;
            restrictions.reason = 'Low visibility (<1km)';
        } else if (weather.visibility < 3000) {
            restrictions.speedMultiplier *= 0.9;
            restrictions.warnings.push('Reduced visibility');
        }

        // Temperature restrictions
        if (weather.temperature < -10 || weather.temperature > 45) {
            restrictions.canFly = false;
            restrictions.reason = 'Extreme temperature';
        } else if (weather.temperature < 0) {
            restrictions.batteryMultiplier *= 1.3;
            restrictions.warnings.push('Cold weather - increased battery drain');
        }

        // Thunderstorm
        if (weather.weatherCondition === 'thunderstorm') {
            restrictions.canFly = false;
            restrictions.reason = 'Thunderstorm';
        }

        return restrictions;
    }

    /**
     * Get detailed weather impact analysis
     */
    getWeatherImpact(weather: WeatherData): WeatherImpact {
        return {
            wind: {
                severity: weather.windSpeed > 10 ? 'high' : weather.windSpeed > 7 ? 'medium' : 'low',
                speedReduction: Math.min(weather.windSpeed * 2, 50),
                batteryIncrease: Math.min(weather.windSpeed * 3, 100)
            },
            precipitation: {
                severity: weather.precipitation > 10 ? 'heavy' : weather.precipitation > 5 ? 'moderate' : weather.precipitation > 0 ? 'light' : 'none',
                visibilityReduction: weather.precipitation * 10,
                safeToFly: weather.precipitation < 10
            },
            temperature: {
                batteryEfficiency: weather.temperature < 0 ? 0.7 : weather.temperature > 35 ? 0.85 : 1.0,
                warnings: weather.temperature < 0 ? ['Cold reduces battery efficiency'] : weather.temperature > 35 ? ['Heat may affect battery'] : []
            }
        };
    }

    /**
     * Clear cache (useful for testing)
     */
    clearCache(): void {
        this.cache.clear();
    }
}

// Export singleton instance
export const weatherService = new WeatherService();
