/**
 * useStandings - Hook to fetch driver/constructor standings from backend
 * Fetches from /api/standings/drivers and /api/standings/constructors
 */

import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiClient';

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
        const controller = new AbortController();

        const fetchStandings = async () => {
            // Build endpoint based on year parameter
            const endpoint = year
                ? `/api/standings/drivers/${year}`
                : '/api/standings/drivers';

            const { data: result, error } = await apiFetch<any>(endpoint);

            if (error) {
                console.error('Failed to fetch standings:', error);
                setData(prev => ({
                    ...prev,
                    loading: false,
                    error: 'Unable to fetch standings'
                }));
                return;
            }

            // If empty standings (e.g., 2026), try previous year
            if (!result?.standings || result.standings.length === 0) {
                const prevYear = (year || new Date().getFullYear()) - 1;
                const { data: prevResult, error: prevError } = await apiFetch<any>(
                    `/api/standings/drivers/${prevYear}`
                );

                if (prevError) {
                    console.error('Failed to fetch previous year standings:', prevError);
                    setData(prev => ({
                        ...prev,
                        loading: false,
                        error: 'Unable to fetch standings'
                    }));
                    return;
                }

                setData({
                    season: prevResult?.season || prevYear,
                    standings: prevResult?.standings || [],
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
        };

        fetchStandings();
        return () => controller.abort();
    }, [year]);

    return data;
}

export default useStandings;
