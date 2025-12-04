/**
 * useTrack - REST API hook for track geometry
 * 
 * MODES:
 * - Demo mode: Fetches static track from /api/track/{circuit}
 * - Live mode: Fetches current race track from /api/track/current (auto-detects circuit)
 */

import { useState, useEffect } from 'react';

export interface TrackPoint {
    x: number;
    y: number;
}

interface TrackData {
    name: string;
    location: string;
    points: TrackPoint[];
    circuit_key?: string;
    session_name?: string;
    source?: string;
    drs_zones?: { start: number; end: number }[];
    sectors?: { name: string; start: number; end: number }[];
}

interface UseTrackResult {
    track: TrackData | null;
    points: TrackPoint[];
    loading: boolean;
    error: string | null;
}

export function useTrack(circuit: string = 'abu_dhabi', isLiveMode: boolean = false): UseTrackResult {
    const [track, setTrack] = useState<TrackData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTrack = async () => {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

            try {
                setLoading(true);
                setError(null);

                // Use different endpoints for demo vs live mode
                const endpoint = isLiveMode
                    ? `${apiUrl}/api/track/current`  // Live: auto-detect current race
                    : `${apiUrl}/api/track/${circuit}`;  // Demo: use specified circuit

                console.log(`📍 Fetching track: ${endpoint} (${isLiveMode ? 'LIVE' : 'DEMO'} mode)`);
                const response = await fetch(endpoint);

                if (!response.ok) {
                    throw new Error(`Failed to fetch track: ${response.status}`);
                }

                const data = await response.json();
                console.log(`✅ Track loaded: ${data.name} (${data.points?.length || 0} points, source: ${data.source || 'static'})`);
                setTrack(data);
            } catch (e) {
                const message = e instanceof Error ? e.message : 'Unknown error';
                console.error('Failed to fetch track data:', message);
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        fetchTrack();
    }, [circuit, isLiveMode]);

    return {
        track,
        points: track?.points ?? [],
        loading,
        error
    };
}

export default useTrack;
