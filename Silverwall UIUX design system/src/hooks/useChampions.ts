/**
 * useChampions - Hook to fetch current World Champions from backend
 * Returns driver and constructor champions from Supabase
 * Falls back to /standings endpoints if /champions doesn't have complete data
 */

import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiClient';

interface Champions {
    year: number;
    driver: {
        name: string;
        team: string;
    } | null;
    constructor: {
        name: string;
    } | null;
    loading: boolean;
    error: string | null;
}

export function useChampions(): Champions {
    const [champions, setChampions] = useState<Champions>({
        year: new Date().getFullYear(),
        driver: null,
        constructor: null,
        loading: true,
        error: null
    });

    useEffect(() => {
        const fetchChampions = async () => {
            // Try /champions endpoint first
            const { data, error } = await apiFetch<any>('/api/champions');

            if (error) {
                console.error('Failed to fetch champions:', error);
                setChampions(prev => ({
                    ...prev,
                    loading: false,
                    error: 'Unable to fetch champions'
                }));
                return;
            }

            let championsData = data;

            // If no driver from champions, fallback to standings leader
            if (!championsData?.driver && !championsData?.error) {
                // Fetch current year's standings (2025 season is completed)
                const currentYear = new Date().getFullYear();

                // Fetch from current year's standings which has the champion
                const [driversResult, constructorsResult] = await Promise.all([
                    apiFetch<any>(`/api/standings/drivers/${currentYear}`),
                    apiFetch<any>(`/api/standings/constructors/${currentYear}`)
                ]);

                const driversData = driversResult.data;
                const constructorsData = constructorsResult.data;

                // Use P1 from previous year standings as "champion"
                if (driversData?.leader) {
                    championsData = {
                        ...championsData,
                        year: driversData.season,
                        driver: {
                            name: driversData.leader.name,
                            team: driversData.leader.team
                        }
                    };
                }

                if (constructorsData?.standings?.[0]) {
                    championsData = {
                        ...championsData,
                        constructor: {
                            name: constructorsData.standings[0].team
                        }
                    };
                }
            }

            setChampions({
                year: championsData?.year || new Date().getFullYear(),
                driver: championsData?.driver,
                constructor: championsData?.constructor,
                loading: false,
                error: null
            });
        };

        fetchChampions();
    }, []);

    return champions;
}

export default useChampions;
