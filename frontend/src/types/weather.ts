// Weather types for frontend

export interface WeatherData {
    temperature: number;
    feelsLike: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
    windGust?: number;
    visibility: number;
    cloudCoverage: number;
    precipitation: number;
    weatherCondition: 'clear' | 'clouds' | 'rain' | 'snow' | 'thunderstorm' | 'fog';
    weatherDescription: string;
    icon: string;
    timestamp: number;
    location: {
        lat: number;
        lon: number;
        city: string;
    };
}

export interface FlightRestrictions {
    canFly: boolean;
    reason?: string;
    speedMultiplier: number;
    batteryMultiplier: number;
    maxAltitude?: number;
    warnings: string[];
}

export interface WeatherImpact {
    wind: {
        severity: 'low' | 'medium' | 'high' | 'extreme';
        speedReduction: number;
        batteryIncrease: number;
    };
    precipitation: {
        severity: 'none' | 'light' | 'moderate' | 'heavy';
        visibilityReduction: number;
        safeToFly: boolean;
    };
    temperature: {
        batteryEfficiency: number;
        warnings: string[];
    };
}
