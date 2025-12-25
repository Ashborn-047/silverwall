/**
 * useStandings - Hook to fetch driver/constructor standings from backend
 * Fetches from /api/standings/drivers and /api/standings/constructors
 */

import { useState, useEffect } from 'react';

interface DriverStanding {
    position: number;
    code: string;
    name: string;
    team: string;
    color: string;
    points: number;
    wins: number;
}

interface StandingsData {
    season: number;
    standings: DriverStanding[];
    loading: boolean;
    error: string | null;
}

export function useStandings(year?: number): StandingsData {
    const [data, setData] = useState<StandingsData>({
        season: new Date().getFullYear(),
        standings: [],
        loading: true,
        error: null
    });

    useEffect(() => {
        const fetchStandings = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                // If no year specified, fetch current season standings
                const url = year
                    ? `${apiUrl}/api/standings/drivers/${year}`
                    : `${apiUrl}/api/standings/drivers`;

                const response = await fetch(url);
                const result = await response.json();

                // If empty standings (e.g., 2026), try previous year
                if (!result.standings || result.standings.length === 0) {
                    const prevYear = (year || new Date().getFullYear()) - 1;
                    const prevResponse = await fetch(`${apiUrl}/api/standings/drivers/${prevYear}`);
                    const prevResult = await prevResponse.json();

                    setData({
                        season: prevResult.season || prevYear,
                        standings: prevResult.standings || [],
                        loading: false,
                        error: null
                    });
                    return;
                }

                setData({
                    season: result.season,
                    standings: result.standings || [],
                    loading: false,
                    error: null
                });
            } catch (error) {
                console.error('Failed to fetch standings:', error);
                setData(prev => ({
                    ...prev,
                    loading: false,
                    error: 'Unable to fetch standings'
                }));
            }
        };

        fetchStandings();
    }, [year]);

    return data;
}

export default useStandings;
