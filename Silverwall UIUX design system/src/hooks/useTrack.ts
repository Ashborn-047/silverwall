/**
 * useTrack - REST API hook for track geometry
 *
 * MODES:
 * - Demo mode: Fetches static track from /api/track/{circuit}
 * - Live mode: Fetches current race track from /api/track/current (auto-detects circuit)
 */

import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiClient';

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

export function useTrack(circuit: string = 'latest', isLiveMode: boolean = false): UseTrackResult {
    const [track, setTrack] = useState<TrackData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTrack = async () => {
            setLoading(true);
            setError(null);

            // Use different endpoints for demo vs live mode
            const endpoint = isLiveMode
                ? '/api/track/current'  // Live: auto-detect current race
                : `/api/track/${circuit}`;  // Demo: use specified circuit

            console.log(`📍 Fetching track: ${endpoint} (${isLiveMode ? 'LIVE' : 'DEMO'} mode)`);

            const { data, error: fetchError } = await apiFetch<TrackData>(endpoint);

            if (fetchError) {
                console.error('Failed to fetch track data:', fetchError);
                setError(fetchError);
                setLoading(false);
                return;
            }

            if (data) {
                console.log(`✅ Track loaded: ${data.name} (${data.points?.length || 0} points, source: ${data.source || 'static'})`);
                setTrack(data);
            }

            setLoading(false);
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
