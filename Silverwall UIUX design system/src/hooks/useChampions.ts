/**
 * useChampions - Hook to fetch current World Champions from backend
 * Returns driver and constructor champions from SpacetimeDB
 */

import { useState, useEffect } from 'react';
import { useSpacetime } from '../contexts/SpacetimeContext';

interface Champions {
    displayYear: number;
    isEarlySeason: boolean;
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
        displayYear: new Date().getFullYear(),
        isEarlySeason: false,
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

                // Get config and races to determine season progress
                const config = Array.from(conn.db.config?.iter() || []);
                const currentSeasonStr = config.find(c => c.key === 'current_season')?.value || new Date().getFullYear().toString();
                const currentSeason = parseInt(currentSeasonStr, 10);

                const races = Array.from(conn.db.race?.iter() || []);
                const completedRacesThisSeason = races.filter(r => 
                    new Date(r.date).getFullYear() === currentSeason && 
                    r.status === 'ended' && 
                    r.name === 'Race'
                );
                
                // Hide leaders if we are in the current season but have less than 5 completed races
                const isEarlySeason = completedRacesThisSeason.length < 5;

                // Find the P1 driver and P1 constructor for that year
                const maxYear = drivers.length > 0 ? Math.max(...drivers.map(d => d.seasonYear)) : currentSeason;
                const driverChamp = drivers.find(d => d.seasonYear === maxYear && d.position === 1);
                const constChamp = constructors.find(c => c.seasonYear === maxYear && c.position === 1);

                setChampions({
                    displayYear: currentSeason,
                    isEarlySeason,
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
                "SELECT * FROM constructor_standings",
                "SELECT * FROM race",
                "SELECT * FROM config"
            ]);

        // Initial check in case data is already synced
        updateChampions();

    }, [conn, isReady]);

    return champions;
}

export default useChampions;
