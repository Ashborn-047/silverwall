import { useState, useEffect } from 'react';
import { useSpacetime } from '../contexts/SpacetimeContext';

interface RaceStatus {
    status: 'live' | 'waiting' | 'off_season' | 'ended' | 'loading' | 'error';
    sessionName?: string;
    meetingName?: string;
    circuit?: string;
    circuitName?: string;
    location?: string;
    country?: string;
    race_date?: string;
    round?: number;
    countdown?: {
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
        text: string;
    };
    message?: string;
    nextSession?: string;
    nextSeason?: {
        year: number;
        first_race: string;
        location: string;
        country: string;
        circuit: string;
        countdown_seconds: number;
        laps?: number;
        circuit_length_km?: number;
        race_date?: string;
    };
}

export const CIRCUIT_METADATA: Record<number, { name: string, location: string, country: string }> = {
    49: { name: "Shanghai International Circuit", location: "Shanghai", country: "China" },
    63: { name: "Bahrain International Circuit", location: "Sakhir", country: "Bahrain" },
    22: { name: "Suzuka International Racing Course", location: "Suzuka", country: "Japan" },
    144: { name: "Jeddah Corniche Circuit", location: "Jeddah", country: "Saudi Arabia" },
    70: { name: "Red Bull Ring", location: "Spielberg", country: "Austria" },
    4: { name: "Circuit de Barcelona-Catalunya", location: "Barcelona", country: "Spain" },
    14: { name: "Monza Circuit", location: "Monza", country: "Italy" },
    9: { name: "Silverstone Circuit", location: "Silverstone", country: "UK" },
    7: { name: "Circuit de Spa-Francorchamps", location: "Spa", country: "Belgium" },
    15: { name: "Marina Bay Street Circuit", location: "Marina Bay", country: "Singapore" },
    155: { name: "Las Vegas Strip Circuit", location: "Las Vegas", country: "USA" }
};

export function useSpacetimeStatus(): RaceStatus {
    const { conn, isReady } = useSpacetime();
    const [status, setStatus] = useState<RaceStatus>({ status: 'loading' });

    useEffect(() => {
        if (!isReady || !conn) return;

        // Subscribe to races and config
        conn.subscriptionBuilder()
            .onApplied(() => {
                updateStatus();
            })
            .subscribe(["SELECT * FROM race", "SELECT * FROM config", "SELECT * FROM race_result", "SELECT * FROM constructor_standings"]);

        // Listen for table updates
        conn.db.race.onInsert((_) => updateStatus());
        conn.db.race.onDelete((_) => updateStatus());
        conn.db.config.onInsert((_) => updateStatus());

        const updateStatus = () => {
            const races = Array.from(conn.db.race.iter());
            const config = Array.from(conn.db.config.iter());

            const currentSeason = config.find(c => c.key === 'current_season')?.value || '2026';

            // Find live race
            const liveRace = races.find(r => r.status === 'live');
            if (liveRace) {
                setStatus({
                    status: 'live',
                    sessionName: liveRace.name,
                    meetingName: liveRace.meetingName || 'FORMULA 1 GRAND PRIX',
                    circuit: liveRace.circuitKey.toString(),
                    circuitName: liveRace.meetingName || `Circuit ${liveRace.circuitKey}`,
                    location: liveRace.location || `Circuit ${liveRace.circuitKey}`,
                    country: liveRace.location?.split(',').pop()?.trim(),
                    race_date: liveRace.date
                });
                return;
            }

            // Find next upcoming race (filter out past ones that might be mislabeled as upcoming)
            const now = Date.now();
            const upcomingRaces = races
                .filter(r => r.status === 'upcoming' && new Date(r.date).getTime() > now)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            if (upcomingRaces.length > 0) {
                const next = upcomingRaces[0];
                const diff = new Date(next.date).getTime() - now;
                const seconds = Math.max(0, Math.floor(diff / 1000));

                const days = Math.floor(seconds / 86400);
                const hours = Math.floor((seconds % 86400) / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                const secs = seconds % 60;

                setStatus({
                    status: 'waiting',
                    meetingName: next.meetingName || 'FORMULA 1 GRAND PRIX', 
                    nextSession: next.name.toUpperCase(), 
                    circuit: next.circuitKey.toString(),
                    circuitName: next.meetingName || `Circuit ${next.circuitKey}`,
                    location: next.location || `Circuit ${next.circuitKey}`,
                    country: next.location?.split(',').pop()?.trim() || 'Unknown',
                    race_date: next.date,
                    countdown: {
                        days,
                        hours,
                        minutes,
                        seconds: secs,
                        text: days > 0
                            ? `${days}D ${hours}H ${minutes}M`
                            : `${hours}H ${minutes}M ${secs}S`
                    }
                });
                return;
            }

            // Otherwise off-season or ended
            setStatus({
                status: 'off_season',
                message: `${currentSeason} Season Mode`,
                nextSeason: {
                    year: 2026,
                    first_race: 'Chinese Grand Prix',
                    location: 'Shanghai, China',
                    country: 'China',
                    circuit: '49',
                    countdown_seconds: 0,
                    race_date: '2026-03-15T07:00:00Z'
                }
            });
        };

        // Set up a timer to update countdown every second
        const interval = setInterval(updateStatus, 1000);

        return () => {
            clearInterval(interval);
            // Handle sub unsubscribe if needed
        };
    }, [isReady, conn]);

    return status;
}

export default useSpacetimeStatus;
