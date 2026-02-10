// Weather Widget Component

import React, { useEffect, useState } from 'react';
import { Cloud, CloudRain, CloudSnow, CloudDrizzle, Sun, Wind, Droplets, Eye, AlertTriangle } from 'lucide-react';
import { API_CONFIG } from '../../config/api';
import type { WeatherData, FlightRestrictions, WeatherImpact } from '../../types/weather';

interface WeatherWidgetProps {
    lat?: number;
    lon?: number;
    compact?: boolean;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
    lat = 40.7128,
    lon = -74.0060,
    compact = false
}) => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [restrictions, setRestrictions] = useState<FlightRestrictions | null>(null);
    const [impact, setImpact] = useState<WeatherImpact | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWeather();
        const interval = setInterval(fetchWeather, 10 * 60 * 1000); // Update every 10 minutes
        return () => clearInterval(interval);
    }, [lat, lon]);

    const fetchWeather = async () => {
        try {
            const response = await fetch(
                `${API_CONFIG.BACKEND_URL}/api/weather/restrictions?lat=${lat}&lon=${lon}`
            );
            const data = await response.json();
            setWeather(data.weather);
            setRestrictions(data.restrictions);
            setImpact(data.impact);
        } catch (error) {
            console.error('Failed to fetch weather:', error);
        } finally {
            setLoading(false);
        }
    };

    const getWeatherIcon = () => {
        if (!weather) return <Cloud className="w-8 h-8" />;

        switch (weather.weatherCondition) {
            case 'clear':
                return <Sun className="w-8 h-8 text-yellow-500" />;
            case 'clouds':
                return <Cloud className="w-8 h-8 text-gray-400" />;
            case 'rain':
                return <CloudRain className="w-8 h-8 text-blue-500" />;
            case 'snow':
                return <CloudSnow className="w-8 h-8 text-blue-300" />;
            case 'thunderstorm':
                return <CloudDrizzle className="w-8 h-8 text-purple-500" />;
            case 'fog':
                return <Cloud className="w-8 h-8 text-gray-500" />;
            default:
                return <Cloud className="w-8 h-8" />;
        }
    };

    const getWindDirection = (degrees: number): string => {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(degrees / 45) % 8;
        return directions[index];
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    if (!weather || !restrictions || !impact) {
        return null;
    }

    if (compact) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 flex items-center gap-3">
                {getWeatherIcon()}
                <div>
                    <div className="text-2xl font-bold">{Math.round(weather.temperature)}°C</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {weather.weatherDescription}
                    </div>
                </div>
                {!restrictions.canFly && (
                    <div className="ml-auto">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    {getWeatherIcon()}
                    <div>
                        <div className="text-3xl font-bold">{Math.round(weather.temperature)}°C</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Feels like {Math.round(weather.feelsLike)}°C
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm font-medium capitalize">{weather.weatherDescription}</div>
                    <div className="text-xs text-gray-500">{weather.location.city}</div>
                </div>
            </div>

            {/* Weather Details */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-gray-500" />
                    <div className="text-sm">
                        <div className="font-medium">{weather.windSpeed.toFixed(1)} m/s</div>
                        <div className="text-xs text-gray-500">{getWindDirection(weather.windDirection)}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-gray-500" />
                    <div className="text-sm">
                        <div className="font-medium">{weather.humidity}%</div>
                        <div className="text-xs text-gray-500">Humidity</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <div className="text-sm">
                        <div className="font-medium">{(weather.visibility / 1000).toFixed(1)} km</div>
                        <div className="text-xs text-gray-500">Visibility</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-gray-500" />
                    <div className="text-sm">
                        <div className="font-medium">{weather.cloudCoverage}%</div>
                        <div className="text-xs text-gray-500">Clouds</div>
                    </div>
                </div>
            </div>

            {/* Flight Status */}
            <div className={`p-3 rounded-lg ${restrictions.canFly
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                <div className="flex items-center gap-2 mb-2">
                    {restrictions.canFly ? (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    ) : (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                    <div className="font-medium text-sm">
                        {restrictions.canFly ? 'Flight Conditions: Good' : 'Flight Restricted'}
                    </div>
                </div>

                {restrictions.reason && (
                    <div className="text-xs text-red-600 dark:text-red-400 mb-2">
                        {restrictions.reason}
                    </div>
                )}

                {restrictions.warnings.length > 0 && (
                    <div className="space-y-1">
                        {restrictions.warnings.map((warning: string, index: number) => (
                            <div key={index} className="text-xs text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
                                <div className="w-1 h-1 bg-yellow-500 rounded-full"></div>
                                {warning}
                            </div>
                        ))}
                    </div>
                )}

                {restrictions.canFly && (
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Speed: </span>
                            <span className="font-medium">{Math.round(restrictions.speedMultiplier * 100)}%</span>
                        </div>
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Battery: </span>
                            <span className="font-medium">{Math.round(restrictions.batteryMultiplier * 100)}%</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Impact Summary */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div>Wind Impact: <span className="font-medium capitalize">{impact.wind.severity}</span></div>
                    <div>Precipitation: <span className="font-medium capitalize">{impact.precipitation.severity}</span></div>
                    {impact.temperature.warnings.length > 0 && (
                        <div className="text-yellow-600 dark:text-yellow-400">
                            {impact.temperature.warnings[0]}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
