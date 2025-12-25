/**
 * useChampions - Hook to fetch current World Champions from backend
 * Returns driver and constructor champions from Supabase
 * Falls back to /standings endpoints if /champions doesn't have complete data
 */

import { useState, useEffect } from 'react';

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
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

                // Try /champions endpoint first
                let response = await fetch(`${apiUrl}/api/champions`);
                let data = await response.json();

                // If no driver from champions, fallback to standings leader
                if (!data.driver && !data.error) {
                    // Fetch current year's standings (2025 season is completed)
                    const currentYear = new Date().getFullYear();

                    // Fetch from current year's standings which has the champion
                    const [driversRes, constructorsRes] = await Promise.all([
                        fetch(`${apiUrl}/api/standings/drivers/${currentYear}`),
                        fetch(`${apiUrl}/api/standings/constructors/${currentYear}`)
                    ]);

                    const driversData = await driversRes.json();
                    const constructorsData = await constructorsRes.json();

                    // Use P1 from previous year standings as "champion"
                    if (driversData.leader) {
                        data = {
                            ...data,
                            year: driversData.season,
                            driver: {
                                name: driversData.leader.name,
                                team: driversData.leader.team
                            }
                        };
                    }

                    if (constructorsData.standings?.[0]) {
                        data = {
                            ...data,
                            constructor: {
                                name: constructorsData.standings[0].team
                            }
                        };
                    }
                }

                setChampions({
                    year: data.year || new Date().getFullYear(),
                    driver: data.driver,
                    constructor: data.constructor,
                    loading: false,
                    error: null
                });
            } catch (error) {
                console.error('Failed to fetch champions:', error);
                setChampions(prev => ({
                    ...prev,
                    loading: false,
                    error: 'Unable to fetch champions'
                }));
            }
        };

        fetchChampions();
    }, []);

    return champions;
}

export default useChampions;
