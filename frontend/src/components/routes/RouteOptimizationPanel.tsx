// Route Optimization Panel Component
// Displays AI-optimized routes vs direct routes with metrics comparison

import { useState, useEffect } from 'react';
import { TrendingUp, Zap, Battery, Shield, Brain, RefreshCw } from 'lucide-react';
import { API_CONFIG } from '../../config/api';
import type { Position } from '../../types';

interface OptimizedRoute {
    waypoints: Position[];
    distance: number;
    estimatedTime: number;
    batteryUsage: number;
    safetyScore: number;
    confidence: number;
}

interface RouteComparison {
    optimizedRoute: OptimizedRoute;
    directRoute: OptimizedRoute;
    distanceSaved: number;
    timeSaved: number;
    batterySaved: number;
    improvementPercentage: number;
}

interface RouteOptimizationPanelProps {
    start: Position | null;
    end: Position | null;
    droneId?: string;
    onRouteUpdate?: (route: OptimizedRoute) => void;
}

export default function RouteOptimizationPanel({
    start,
    end,
    droneId,
    onRouteUpdate
}: RouteOptimizationPanelProps) {
    const [comparison, setComparison] = useState<RouteComparison | null>(null);
    const [loading, setLoading] = useState(false);
    const [modelStatus, setModelStatus] = useState<any>(null);
    const [training, setTraining] = useState(false);

    // Fetch model status
    useEffect(() => {
        fetchModelStatus();
        const interval = setInterval(fetchModelStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    // Optimize route when start/end changes
    useEffect(() => {
        if (start && end) {
            optimizeRoute();
        }
    }, [start, end, droneId]);

    const fetchModelStatus = async () => {
        try {
            const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/routes/model/status`);
            const status = await response.json();
            setModelStatus(status);
        } catch (error) {
            console.error('Failed to fetch model status:', error);
        }
    };

    const optimizeRoute = async () => {
        if (!start || !end) return;

        setLoading(true);
        try {
            const params = new URLSearchParams({
                fromLat: start.lat.toString(),
                fromLng: start.lng.toString(),
                toLat: end.lat.toString(),
                toLng: end.lng.toString(),
                ...(droneId && { droneId })
            });

            const response = await fetch(
                `${API_CONFIG.BACKEND_URL}/api/routes/compare?${params}`
            );
            const data = await response.json();
            setComparison(data);

            if (onRouteUpdate) {
                onRouteUpdate(data.optimizedRoute);
            }
        } catch (error) {
            console.error('Route optimization failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const trainModel = async () => {
        setTraining(true);
        try {
            await fetch(`${API_CONFIG.BACKEND_URL}/api/routes/train`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ epochs: 50 })
            });
        } catch (error) {
            console.error('Training failed:', error);
        } finally {
            setTraining(false);
        }
    };

    if (!start || !end) {
        return (
            <div className="bg-gray-800 rounded-lg p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-5 h-5 text-purple-400" />
                    <h3 className="font-semibold">AI Route Optimization</h3>
                </div>
                <p className="text-sm text-gray-400">
                    Select start and end points to optimize route
                </p>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 rounded-lg p-4 text-white space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-400" />
                    <h3 className="font-semibold">AI Route Optimization</h3>
                </div>
                <button
                    onClick={optimizeRoute}
                    disabled={loading}
                    className="p-2 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Model Status */}
            {modelStatus && (
                <div className="bg-gray-700 rounded p-3 text-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300">Model Status</span>
                        <span className={`px-2 py-1 rounded text-xs ${modelStatus.modelTrained
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                            {modelStatus.modelTrained ? 'Trained' : 'Not Trained'}
                        </span>
                    </div>

                    {modelStatus.isTraining && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>Training Progress</span>
                                <span>{modelStatus.trainingProgress.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-2">
                                <div
                                    className="bg-purple-500 h-2 rounded-full transition-all"
                                    style={{ width: `${modelStatus.trainingProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {!modelStatus.modelTrained && !modelStatus.isTraining && (
                        <button
                            onClick={trainModel}
                            disabled={training}
                            className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm transition-colors disabled:opacity-50"
                        >
                            {training ? 'Starting Training...' : 'Train AI Model'}
                        </button>
                    )}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
            )}

            {/* Route Comparison */}
            {comparison && !loading && (
                <div className="space-y-3">
                    {/* Improvement Summary */}
                    <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-3 border border-purple-500/30">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-purple-400" />
                            <span className="text-sm font-semibold">Route Improvement</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-400">
                            {comparison.improvementPercentage > 0 ? '+' : ''}
                            {comparison.improvementPercentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                            AI Confidence: {(comparison.optimizedRoute.confidence * 100).toFixed(0)}%
                        </div>
                    </div>

                    {/* Metrics Comparison */}
                    <div className="grid grid-cols-2 gap-2">
                        {/* Distance */}
                        <div className="bg-gray-700 rounded p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Zap className="w-4 h-4 text-blue-400" />
                                <span className="text-xs text-gray-400">Distance</span>
                            </div>
                            <div className="text-lg font-semibold">
                                {comparison.optimizedRoute.distance.toFixed(2)} km
                            </div>
                            <div className="text-xs text-green-400">
                                Saved: {comparison.distanceSaved.toFixed(2)} km
                            </div>
                        </div>

                        {/* Time */}
                        <div className="bg-gray-700 rounded p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <RefreshCw className="w-4 h-4 text-yellow-400" />
                                <span className="text-xs text-gray-400">Time</span>
                            </div>
                            <div className="text-lg font-semibold">
                                {comparison.optimizedRoute.estimatedTime.toFixed(1)} min
                            </div>
                            <div className="text-xs text-green-400">
                                Saved: {comparison.timeSaved.toFixed(1)} min
                            </div>
                        </div>

                        {/* Battery */}
                        <div className="bg-gray-700 rounded p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Battery className="w-4 h-4 text-green-400" />
                                <span className="text-xs text-gray-400">Battery</span>
                            </div>
                            <div className="text-lg font-semibold">
                                {comparison.optimizedRoute.batteryUsage.toFixed(1)}%
                            </div>
                            <div className="text-xs text-green-400">
                                Saved: {comparison.batterySaved.toFixed(1)}%
                            </div>
                        </div>

                        {/* Safety */}
                        <div className="bg-gray-700 rounded p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Shield className="w-4 h-4 text-purple-400" />
                                <span className="text-xs text-gray-400">Safety</span>
                            </div>
                            <div className="text-lg font-semibold">
                                {comparison.optimizedRoute.safetyScore}/100
                            </div>
                            <div className={`text-xs ${comparison.optimizedRoute.safetyScore >= 80
                                    ? 'text-green-400'
                                    : 'text-yellow-400'
                                }`}>
                                {comparison.optimizedRoute.safetyScore >= 80 ? 'Excellent' : 'Good'}
                            </div>
                        </div>
                    </div>

                    {/* Route Details */}
                    <div className="text-xs text-gray-400 space-y-1">
                        <div className="flex justify-between">
                            <span>Waypoints:</span>
                            <span className="text-white">{comparison.optimizedRoute.waypoints.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Direct Distance:</span>
                            <span className="text-white">{comparison.directRoute.distance.toFixed(2)} km</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
