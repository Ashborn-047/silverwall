/**
 * useTrack - SpacetimeDB hook for track geometry
 *
 * Fetches the ordered track points for a given circuit directly from
 * the SpacetimeDB `track_point` table.
 */

import { useState, useEffect } from 'react';
import { TrackPoint } from '../sdk/types';
import { useSpacetime } from '../contexts/SpacetimeContext';

export interface FrontendTrackPoint {
    x: number;
    y: number;
}

interface TrackData {
    name: string;
    location: string;
    points: FrontendTrackPoint[];
    circuit_key?: number;
}

interface UseTrackResult {
    track: TrackData | null;
    points: FrontendTrackPoint[];
    loading: boolean;
    error: string | null;
}

export function useTrack(circuitKey: number): UseTrackResult {
    const { conn, isReady } = useSpacetime();
    const [points, setPoints] = useState<FrontendTrackPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isReady || !conn) return;

        setLoading(true);
        try {
            const updatePoints = () => {
                const dbPoints = Array.from(conn.db.track_point.iter())
                    .filter(p => p.circuitKey === circuitKey);

                if (dbPoints.length > 0) {
                    const sortedPoints = dbPoints.sort((a, b) => a.order - b.order);
                    
                    // Normalize points to fit between 0 and 1
                    const minX = Math.min(...sortedPoints.map(p => p.x));
                    const maxX = Math.max(...sortedPoints.map(p => p.x));
                    const minY = Math.min(...sortedPoints.map(p => p.y));
                    const maxY = Math.max(...sortedPoints.map(p => p.y));
                    
                    const rangeX = maxX - minX;
                    const rangeY = maxY - minY;
                    const maxRange = Math.max(rangeX, rangeY) || 1;

                    // Pad slightly and scale to 1x1 box
                    const frontendPoints = sortedPoints.map(p => ({
                        x: (p.x - minX) / maxRange,
                        y: (p.y - minY) / maxRange
                    }));
                    
                    setPoints(frontendPoints);
                    // Clear loading once we have data
                    setLoading(false);
                }
            };

            // Initial immediate update if we already have it cached
            updatePoints();

            // Subscribe to track_point table if not already globally fetched
            conn.subscriptionBuilder()
                .onApplied(() => {
                    updatePoints();
                    setLoading(false); // Clear loading when subscription finishes, even if empty
                })
                .subscribe(["SELECT * FROM track_point"]);

            // Watch for new points arriving
            const onInsert = (_ctx: any, p: TrackPoint) => {
                if (p.circuitKey === circuitKey) {
                    updatePoints();
                }
            };

            conn.db.track_point.onInsert(onInsert);

        } catch (err: any) {
            console.error('Failed to query track points from SpacetimeDB:', err);
            setError(err.message);
            setLoading(false);
        }

    }, [circuitKey, isReady, conn]);

    // Create a mock TrackData object to satisfy the existing UI components
    const trackData: TrackData | null = points.length > 0 ? {
        name: `Circuit ${circuitKey}`,
        location: 'SpacetimeDB',
        points: points,
        circuit_key: circuitKey
    } : null;

    return {
        track: trackData,
        points: points,
        loading: loading && points.length === 0,
        error
    };
}

export default useTrack;

