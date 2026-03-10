/**
 * useChampions - Hook to fetch current World Champions from backend
 * Returns driver and constructor champions from SpacetimeDB
 */

import { useState, useEffect } from 'react';
import { useSpacetime } from '../contexts/SpacetimeContext';

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
    const { conn, isReady } = useSpacetime();
    const [champions, setChampions] = useState<Champions>({
        year: new Date().getFullYear(),
        driver: null,
        constructor: null,
        loading: true,
        error: null
    });

    useEffect(() => {
        if (!isReady || !conn) return;

        const updateChampions = () => {
            try {
                // Find all driver and constructor standings
                const drivers = Array.from(conn.db.driver_standings.iter());
                const constructors = Array.from(conn.db.constructor_standings.iter());

                if (drivers.length === 0) {
                    setChampions(prev => ({ ...prev, loading: false }));
                    return;
                }

                // Find the latest season year available
                const maxYear = Math.max(...drivers.map(d => d.seasonYear));

                // Find the P1 driver and P1 constructor for that year
                const driverChamp = drivers.find(d => d.seasonYear === maxYear && d.position === 1);
                const constChamp = constructors.find(c => c.seasonYear === maxYear && c.position === 1);

                setChampions({
                    year: maxYear,
                    driver: driverChamp ? {
                        name: driverChamp.driverName,
                        team: driverChamp.team
                    } : null,
                    constructor: constChamp ? {
                        name: constChamp.team
                    } : null,
                    loading: false,
                    error: null
                });
            } catch (err: any) {
                console.error("Failed to parse champions from SpacetimeDB", err);
                setChampions(prev => ({ ...prev, error: err.message, loading: false }));
            }
        };

        // Subscribe to the standings tables
        conn.subscriptionBuilder()
            .onApplied(() => updateChampions())
            .subscribe([
                "SELECT * FROM driver_standings",
                "SELECT * FROM constructor_standings"
            ]);

        // Initial check in case data is already synced
        updateChampions();

    }, [conn, isReady]);

    return champions;
}

export default useChampions;
