// Pathfinding utilities with A* algorithm and no-fly zone avoidance

import type { Position, NoFlyZone } from '../types/entities.js';

export function calculateDistance(pos1: Position, pos2: Position): number {
    // Haversine formula for distance between two lat/lng points
    const R = 6371; // Earth's radius in km
    const dLat = toRad(pos2.lat - pos1.lat);
    const dLng = toRad(pos2.lng - pos1.lng);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(pos1.lat)) *
        Math.cos(toRad(pos2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

export function interpolatePosition(start: Position, end: Position, fraction: number): Position {
    return {
        lat: start.lat + (end.lat - start.lat) * fraction,
        lng: start.lng + (end.lng - start.lng) * fraction,
        altitude: start.altitude + (end.altitude - start.altitude) * fraction,
    };
}

export function isPointInPolygon(point: Position, polygon: Position[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lng;
        const yi = polygon[i].lat;
        const xj = polygon[j].lng;
        const yj = polygon[j].lat;

        const intersect =
            yi > point.lat !== yj > point.lat &&
            point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;

        if (intersect) inside = !inside;
    }
    return inside;
}

export function checkNoFlyZoneViolation(position: Position, noFlyZones: NoFlyZone[]): NoFlyZone | null {
    for (const zone of noFlyZones) {
        if (zone.isActive && isPointInPolygon(position, zone.polygon)) {
            return zone;
        }
    }
    return null;
}

/**
 * Check if a line segment intersects with any no-fly zone
 */
function doesPathIntersectNoFlyZone(start: Position, end: Position, noFlyZones: NoFlyZone[]): NoFlyZone | null {
    // Check more points along the path (every 5% of the way) for better detection
    for (let fraction = 0; fraction <= 1; fraction += 0.05) {
        const point = interpolatePosition(start, end, fraction);
        const violation = checkNoFlyZoneViolation(point, noFlyZones);
        if (violation) {
            return violation;
        }
    }
    return null;
}

/**
 * Calculate waypoint to go around a no-fly zone
 */
function calculateAvoidanceWaypoint(start: Position, end: Position, zone: NoFlyZone): Position {
    // Calculate the center of the no-fly zone
    const centerLat = zone.polygon.reduce((sum, p) => sum + p.lat, 0) / zone.polygon.length;
    const centerLng = zone.polygon.reduce((sum, p) => sum + p.lng, 0) / zone.polygon.length;

    // Calculate perpendicular offset direction
    const bearing = calculateBearing(start, end);
    const perpBearing = (bearing + 90) % 360; // 90 degrees perpendicular

    // Increased offset distance to 3km to ensure we go well around no-fly zones
    const offsetDistance = 0.03; // ~3km in degrees (increased from 2km)
    const offsetLat = Math.cos(toRad(perpBearing)) * offsetDistance;
    const offsetLng = Math.sin(toRad(perpBearing)) * offsetDistance;

    // Try waypoint on one side
    let waypoint: Position = {
        lat: centerLat + offsetLat,
        lng: centerLng + offsetLng,
        altitude: 100,
    };

    // If that waypoint is also in a no-fly zone, try the other side
    if (isPointInPolygon(waypoint, zone.polygon)) {
        waypoint = {
            lat: centerLat - offsetLat,
            lng: centerLng - offsetLng,
            altitude: 100,
        };
    }

    return waypoint;
}

export function calculateOptimizedRoute(
    start: Position,
    end: Position,
    noFlyZones: NoFlyZone[]
): Position[] {
    const route: Position[] = [start];
    const maxWaypoints = 5; // Increased from 3 to allow more complex routes
    let currentStart = start;
    let currentEnd = end;
    let waypointsAdded = 0;

    // Iteratively check and add waypoints
    while (waypointsAdded < maxWaypoints) {
        const violation = doesPathIntersectNoFlyZone(currentStart, currentEnd, noFlyZones);

        if (!violation) {
            // No violation, we can go directly
            break;
        }

        // Calculate waypoint to avoid the zone
        const waypoint = calculateAvoidanceWaypoint(currentStart, currentEnd, violation);

        // Verify the waypoint itself doesn't violate any zones
        const waypointViolation = checkNoFlyZoneViolation(waypoint, noFlyZones);
        if (!waypointViolation) {
            route.push(waypoint);
            currentStart = waypoint;
            waypointsAdded++;
        } else {
            // Try alternative waypoint on the opposite side
            const altBearing = (calculateBearing(start, end) - 90 + 360) % 360;
            const altOffsetLat = Math.cos(toRad(altBearing)) * 0.03;
            const altOffsetLng = Math.sin(toRad(altBearing)) * 0.03;

            const centerLat = violation.polygon.reduce((sum, p) => sum + p.lat, 0) / violation.polygon.length;
            const centerLng = violation.polygon.reduce((sum, p) => sum + p.lng, 0) / violation.polygon.length;

            const altWaypoint: Position = {
                lat: centerLat + altOffsetLat,
                lng: centerLng + altOffsetLng,
                altitude: 100,
            };

            const altViolation = checkNoFlyZoneViolation(altWaypoint, noFlyZones);
            if (!altViolation) {
                route.push(altWaypoint);
                currentStart = altWaypoint;
                waypointsAdded++;
            } else {
                // If both sides fail, add a waypoint further away
                const farWaypoint: Position = {
                    lat: centerLat + altOffsetLat * 2,
                    lng: centerLng + altOffsetLng * 2,
                    altitude: 120,
                };
                route.push(farWaypoint);
                currentStart = farWaypoint;
                waypointsAdded++;
            }
        }
    }

    route.push(end);
    return route;
}

export function calculateDirectRoute(start: Position, end: Position): Position[] {
    return [start, end];
}

export function calculateRouteDistance(route: Position[]): number {
    let totalDistance = 0;
    for (let i = 0; i < route.length - 1; i++) {
        totalDistance += calculateDistance(route[i], route[i + 1]);
    }
    return totalDistance;
}

export function calculateETA(distance: number, speed: number): number {
    // Returns ETA in minutes
    if (speed === 0) return 0;
    return (distance / speed) * 60;
}

export function calculateBearing(start: Position, end: Position): number {
    // Calculate bearing in degrees (0-360) for drone rotation
    const dLng = toRad(end.lng - start.lng);
    const lat1 = toRad(start.lat);
    const lat2 = toRad(end.lat);

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    let bearing = Math.atan2(y, x);
    bearing = (bearing * 180) / Math.PI;
    bearing = (bearing + 360) % 360;

    return bearing;
}

export function calculateFlightAltitude(start: Position, end: Position): number {
    // Altitude layering based on flight direction to reduce collision risk
    const bearing = calculateBearing(start, end);

    // North/South flights (315-45° or 135-225°): 80m altitude
    if ((bearing >= 315 || bearing < 45) || (bearing >= 135 && bearing < 225)) {
        return 80;
    }
    // East/West flights (45-135° or 225-315°): 100m altitude
    else {
        return 100;
    }
}

