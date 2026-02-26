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
        const controller = new AbortController();

        const fetchChampions = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

                // Try /champions endpoint first
                let response = await fetch(`${apiUrl}/api/champions`, { signal: controller.signal });
                if (!response.ok) {
                    throw new Error(`Failed to fetch champions: ${response.status} ${response.statusText}`);
                }
                let data = await response.json();

                // If no driver from champions, fallback to standings leader
                if (!data.driver && !data.error) {
                    // Fetch current year's standings (2025 season is completed)
                    const currentYear = new Date().getFullYear();

                    // Fetch from current year's standings which has the champion
                    const [driversRes, constructorsRes] = await Promise.all([
                        fetch(`${apiUrl}/api/standings/drivers/${currentYear}`, { signal: controller.signal }),
                        fetch(`${apiUrl}/api/standings/constructors/${currentYear}`, { signal: controller.signal })
                    ]);

                    if (!driversRes.ok) {
                        throw new Error(`Failed to fetch driver standings: ${driversRes.status} ${driversRes.statusText}`);
                    }
                    if (!constructorsRes.ok) {
                        throw new Error(`Failed to fetch constructor standings: ${constructorsRes.status} ${constructorsRes.statusText}`);
                    }

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
                if (error instanceof Error && error.name === 'AbortError') {
                    return; // Request was cancelled, ignore
                }
                console.error('Failed to fetch champions:', error);
                setChampions(prev => ({
                    ...prev,
                    loading: false,
                    error: 'Unable to fetch champions'
                }));
            }
        };

        fetchChampions();
        return () => controller.abort();
    }, []);

    return champions;
}

export default useChampions;
