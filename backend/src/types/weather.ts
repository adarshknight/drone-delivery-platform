// Weather data types

export interface WeatherData {
    temperature: number; // Celsius
    feelsLike: number;
    humidity: number; // percentage
    pressure: number; // hPa
    windSpeed: number; // m/s
    windDirection: number; // degrees
    windGust?: number; // m/s
    visibility: number; // meters
    cloudCoverage: number; // percentage
    precipitation: number; // mm
    weatherCondition: 'clear' | 'clouds' | 'rain' | 'snow' | 'thunderstorm' | 'fog';
    weatherDescription: string;
    icon: string; // OpenWeatherMap icon code
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
    speedMultiplier: number; // 0.5 = 50% speed
    batteryMultiplier: number; // 2.0 = 2x drain
    maxAltitude?: number; // meters
    warnings: string[];
}

export interface WeatherImpact {
    wind: {
        severity: 'low' | 'medium' | 'high' | 'extreme';
        speedReduction: number; // percentage
        batteryIncrease: number; // percentage
    };
    precipitation: {
        severity: 'none' | 'light' | 'moderate' | 'heavy';
        visibilityReduction: number;
        safeToFly: boolean;
    };
    temperature: {
        batteryEfficiency: number; // multiplier
        warnings: string[];
    };
}
