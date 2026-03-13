/**
 * useStandings - Hook to fetch driver standings from SpacetimeDB
 */

import { useState, useEffect } from 'react';
import { useSpacetime } from '../contexts/SpacetimeContext';

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
    const { conn, isReady } = useSpacetime();
    const [data, setData] = useState<StandingsData>({
        season: year || new Date().getFullYear(),
        standings: [],
        loading: true,
        error: null
    });

    useEffect(() => {
        if (!isReady || !conn) return;

        const updateStandings = () => {
            try {
                let drivers = Array.from(conn.db.driver_standings.iter());
                if (drivers.length === 0) {
                    setData(prev => ({ ...prev, loading: false }));
                    return;
                }

                const targetYear = year || Math.max(...drivers.map(d => d.seasonYear));
                let filteredDrivers = drivers.filter(d => d.seasonYear === targetYear);

                // If the target year has no standings (like 2026 early season), fallback to the previous year
                let finalYear = targetYear;
                if (filteredDrivers.length === 0) {
                    finalYear = targetYear - 1;
                    filteredDrivers = drivers.filter(d => d.seasonYear === finalYear);
                }

                const sortedDrivers = filteredDrivers.sort((a, b) => a.position - b.position);

                const mappedStandings: DriverStanding[] = sortedDrivers.map(d => {
                    // Try to find the driver color from the driver table
                    let color = '#FFFFFF';
                    const driverMeta = Array.from(conn.db.driver.iter()).find(dm => dm.driverNumber === d.driverNumber);
                    if (driverMeta && driverMeta.teamColor) {
                        color = driverMeta.teamColor.startsWith('#') ? driverMeta.teamColor : `#${driverMeta.teamColor}`;
                    }

                    // Extract last name for code fallback
                    const names = d.driverName.split(' ');
                    const lastName = names.length > 1 ? names[names.length - 1] : d.driverName;

                    return {
                        position: d.position,
                        code: lastName.substring(0, 3).toUpperCase(),
                        name: d.driverName,
                        team: d.team,
                        color,
                        points: d.points,
                        wins: d.wins
                    };
                });

                setData({
                    season: finalYear,
                    standings: mappedStandings,
                    loading: false,
                    error: null
                });
            } catch (err: any) {
                console.error("Failed to fetch standings from SpacetimeDB", err);
                setData(prev => ({ ...prev, loading: false, error: err.message }));
            }
        };

        conn.subscriptionBuilder()
            .onApplied(() => updateStandings())
            .subscribe([
                "SELECT * FROM driver_standings",
                "SELECT * FROM driver"
            ]);

        updateStandings();

    }, [conn, isReady, year]);

    return data;
}

export default useStandings;
