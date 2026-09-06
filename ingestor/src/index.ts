// @ts-nocheck
import { WebSocket } from 'undici';
if (typeof globalThis.WebSocket === 'undefined') {
    globalThis.WebSocket = WebSocket as any;
}
import axios from 'axios';
import express from 'express';
import { DbConnection } from './sdk';

const OPENF1_BASE_URL = 'https://api.openf1.org/v1';
const SPACETIME_URI = 'wss://maincloud.spacetimedb.com';
const DBNAME = 'spacetimedb-uorks';

// Configuration
const POLL_INTERVAL_MS = 3000;
const TIME_WINDOW_STEP_MS = 5000; // Small chunks for 422 fix

let lastSyncedTimestamp: Date | null = null;
let currentSessionKey = -1; // Dynamic live session key
let isIngesting = false;

process.on('uncaughtException', (err) => {
    console.error('⚠️ Ingestor Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
    console.error('⚠️ Ingestor Unhandled Rejection:', reason);
});

const conn = DbConnection.builder()
    .withUri(SPACETIME_URI)
    .withDatabaseName(DBNAME)
    .onConnect(() => {
        console.log('Ingestor connected to SpacetimeDB. Subscribing to tables...');
        conn.subscriptionBuilder()
            .onApplied(() => {
                console.log('Ingestor subscription applied. Starting live ingestion & background timers...');
                setupLiveIngestion();
                
                // Adaptive sync: 2-min burst when a race just ended with no results, else 10-min normal
                const NORMAL_SYNC_MS = 10 * 60 * 1000;  // 10 minutes
                const BURST_SYNC_MS = 2 * 60 * 1000;    // 2 minutes
                const BURST_WINDOW_MS = 3 * 60 * 60 * 1000; // 3 hours after race end

                const runPeriodicSync = async () => {
                    console.log(">>> Running periodic sync task...");
                    try {
                        await syncYearRaces(2026);
                        await syncYearDrivers(2026);
                        await syncStandings(2026);
                        await syncPodiums(2026);
                    } catch (e: any) {
                        console.error("Periodic sync task failed:", e.message || e);
                    }

                    // Determine next interval: burst if a recently-ended race has no results
                    const now = Date.now();
                    const dbRaces = Array.from(conn.db.race.iter()).filter((r: any) => r.seasonYear === 2026 && r.name === 'Race');
                    const dbResults = Array.from(conn.db.race_result.iter());
                    const needsBurst = dbRaces.some((r: any) => {
                        const raceDate = new Date(r.date).getTime();
                        const timeSinceRace = now - raceDate;
                        const isRecentlyEnded = timeSinceRace > 0 && timeSinceRace < BURST_WINDOW_MS;
                        const resultCount = dbResults.filter((res: any) => res.raceKey === r.raceKey).length;
                        return isRecentlyEnded && resultCount < 10;
                    });

                    const nextInterval = needsBurst ? BURST_SYNC_MS : NORMAL_SYNC_MS;
                    if (needsBurst) {
                        console.log(`🔥 BURST MODE: Race recently ended with incomplete results. Next sync in ${nextInterval / 1000}s`);
                    }
                    setTimeout(runPeriodicSync, nextInterval);
                };
                setTimeout(runPeriodicSync, NORMAL_SYNC_MS);

                startIngestion().catch(err => console.error("Background initial seed failed:", err.message || err));
            })
            .subscribe(["SELECT * FROM race", "SELECT * FROM race_result", "SELECT * FROM track_point"]);
    })
    .onConnectError((ctx, err) => {
        console.error('SpacetimeDB Connection Error:', err);
    })
    .build();

// Koyeb/Cloud Healthcheck Server
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.status(200).send({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'silverwall-ingestor'
    });
});

app.listen(PORT, () => {
    console.log(`Healthcheck server running on port ${PORT}`);
});

async function startIngestion() {
    if (isIngesting) {
        console.log("Ingestion already in progress, skipping...");
        return;
    }
    isIngesting = true;
    console.log(`Starting prioritized telemetry ingestion...`);

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    console.log("Waiting 10s for API rate limits to clear...");
    await sleep(10000);

    // PRIORITY 1: Seed 2026 data & Standings immediately for UI responsiveness
    console.log(">>> PRIORITY: Syncing 2026 Races, Standings, and Podiums...");
    try { await syncYearRaces(2026); } catch (e: any) { console.error("Sync 2026 races error:", e.message || e); }
    await sleep(2000);
    try { await syncYearDrivers(2026); } catch (e: any) { console.error("Sync 2026 drivers error:", e.message || e); }
    await sleep(2000);
    try { await syncStandings(2025); } catch (e: any) { console.error("Sync 2025 standings error:", e.message || e); }
    await sleep(2000);
    try { await syncStandings(2026); } catch (e: any) { console.error("Sync 2026 standings error:", e.message || e); }
    await sleep(2000);
    try { await syncPodiums(2026); } catch (e: any) { console.error("Sync 2026 podiums error:", e.message || e); }
    await sleep(2000);

    // PRIORITY 2: Seed Shanghai Track Geometry (Circuit 49) 
    console.log("Syncing Circuit 49 (Shanghai) track geometry...");
    try {
        await syncTrack(9673); 
    } catch (e) {
        console.error("Failed priority seed for Shanghai, retrying with fallback session 9663...");
        try { await syncTrack(9663); } catch (err: any) { console.error("Fallback Shanghai sync error:", err.message); }
    }
    await sleep(5000);

    // PRIORITY 3: Seed Bahrain Track Geometry (Circuit 63)
    console.log("Seeding Circuit 63 (Bahrain) track geometry...");
    try { await syncTrack(9472); } catch (e: any) { console.error("Bahrain track sync error:", e.message); }
    await sleep(2000);

    // PRIORITY 4: Seed Canada Track Geometry (Circuit 23)
    console.log("Seeding Circuit 23 (Canada) track geometry...");
    try { await syncTrack(9524); } catch (e: any) { console.error("Canada track sync error:", e.message); }
    await sleep(2000);

    console.log("Background: Syncing historical metadata (throttled)...");
    const otherYears = [2024, 2025];
    for (const year of otherYears) {
        try { await syncYearRaces(year); } catch (e: any) { console.error(`Sync ${year} races error:`, e.message); }
        await sleep(2000);
        try { await syncPodiums(year); } catch (e: any) { console.error(`Sync ${year} podiums error:`, e.message); }
        await sleep(2000);
        try { await syncYearDrivers(year); } catch (e: any) { console.error(`Sync ${year} drivers error:`, e.message); }
        await sleep(5000);
    }
}

function formatDriverName(fullName: string): string {
    if (!fullName) return 'Unknown';
    const cleaned = fullName.trim();
    if (cleaned.toUpperCase().includes('ANTONELLI')) return 'Andrea Kimi Antonelli';
    if (cleaned.toUpperCase().includes('RUSSELL')) return 'George Russell';
    if (cleaned.toUpperCase().includes('VERSTAPPEN')) return 'Max Verstappen';
    if (cleaned.toUpperCase().includes('NORRIS')) return 'Lando Norris';
    if (cleaned.toUpperCase().includes('PIASTRI')) return 'Oscar Piastri';
    if (cleaned.toUpperCase().includes('HAMILTON')) return 'Lewis Hamilton';
    if (cleaned.toUpperCase().includes('LECLERC')) return 'Charles Leclerc';
    if (cleaned.toUpperCase().includes('GASLY')) return 'Pierre Gasly';
    if (cleaned.toUpperCase().includes('LINDBLAD')) return 'Arvid Lindblad';
    if (cleaned.toUpperCase().includes('COLAPINTO')) return 'Franco Colapinto';
    if (cleaned.toUpperCase().includes('TSUNODA')) return 'Yuki Tsunoda';
    if (cleaned.toUpperCase().includes('BORTOLETO')) return 'Gabriel Bortoleto';
    if (cleaned.toUpperCase().includes('HULKENBERG') || cleaned.toUpperCase().includes('HÜLKENBERG')) return 'Nico Hülkenberg';
    if (cleaned.toUpperCase().includes('SAINZ')) return 'Carlos Sainz';
    if (cleaned.toUpperCase().includes('LAWSON')) return 'Liam Lawson';
    if (cleaned.toUpperCase().includes('BEARMAN')) return 'Oliver Bearman';
    if (cleaned.toUpperCase().includes('OCON')) return 'Esteban Ocon';
    if (cleaned.toUpperCase().includes('ALBON')) return 'Alexander Albon';
    if (cleaned.toUpperCase().includes('PEREZ') || cleaned.toUpperCase().includes('PÉREZ')) return 'Sergio Pérez';
    if (cleaned.toUpperCase().includes('BOTTAS')) return 'Valtteri Bottas';
    if (cleaned.toUpperCase().includes('STROLL')) return 'Lance Stroll';
    if (cleaned.toUpperCase().includes('ALONSO')) return 'Fernando Alonso';
    if (cleaned.toUpperCase().includes('HADJAR')) return 'Isack Hadjar';
    
    return cleaned.split(' ')
        .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(' ');
}

async function fetchOpenF1Results(raceKey: number) {
    console.log(`Fallback: Fetching results for session ${raceKey} from OpenF1...`);
    try {
        const [driversResp, posResp, lapsResp] = await Promise.all([
            axios.get(`${OPENF1_BASE_URL}/drivers`, { params: { session_key: raceKey } }).catch(() => ({ data: [] })),
            axios.get(`${OPENF1_BASE_URL}/position`, { params: { session_key: raceKey } }).catch(() => ({ data: [] })),
            axios.get(`${OPENF1_BASE_URL}/laps`, { params: { session_key: raceKey } }).catch(() => ({ data: [] }))
        ]);

        const drivers = driversResp.data || [];
        const positions = posResp.data || [];
        const laps = lapsResp.data || [];

        if (!Array.isArray(positions) || positions.length === 0) {
            console.warn(`No OpenF1 positions found for session ${raceKey}`);
            return [];
        }

        const latestByDriver = new Map<number, any>();
        for (const p of positions) {
            const existing = latestByDriver.get(p.driver_number);
            if (!existing || new Date(p.date).getTime() > new Date(existing.date).getTime()) {
                latestByDriver.set(p.driver_number, p);
            }
        }

        let fastestLapDriver = -1;
        let minLapDuration = Infinity;
        if (Array.isArray(laps)) {
            for (const l of laps) {
                if (l.lap_duration && l.lap_duration < minLapDuration && l.is_pit_out_lap === false) {
                    minLapDuration = l.lap_duration;
                    fastestLapDriver = l.driver_number;
                }
            }
        }

        const pointsTable = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
        const sortedDrivers = Array.from(latestByDriver.values()).sort((a, b) => a.position - b.position);

        return sortedDrivers.map(p => {
            const d = Array.isArray(drivers) ? drivers.find((drv: any) => drv.driver_number === p.driver_number) : null;
            const rawName = d?.full_name || d?.broadcast_name || `Driver ${p.driver_number}`;
            const driverName = formatDriverName(rawName);
            const isFastest = p.driver_number === fastestLapDriver;
            let pts = pointsTable[p.position - 1] || 0;
            if (isFastest && p.position <= 10) {
                pts += 1;
            }

            return {
                raceKey: raceKey,
                position: p.position,
                driverNumber: p.driver_number,
                driverName: driverName,
                team: d?.team_name || 'Unknown',
                timeStatus: p.position === 1 ? 'Finished' : (p.position <= 10 ? 'Finished' : '+1 Lap'),
                fastestLap: isFastest,
                dnf: false,
                points: pts
            };
        });
    } catch (err: any) {
        console.error(`Failed to fetch OpenF1 results for session ${raceKey}:`, err.message);
        return [];
    }
}

async function syncPodiums(year: number) {
    console.log(`Syncing race results (podiums) for ${year}...`);
    try {
        // 1. Get all races for this year from SpacetimeDB
        const dbRaces = Array.from(conn.db.race.iter()).filter((r: any) => r.seasonYear === year && r.name === 'Race');
        if (dbRaces.length === 0) {
            console.log(`No races found in DB for year ${year}, skipping podium sync.`);
            return;
        }

        // 2. Fetch the season calendar from Jolpi (if available)
        let jolpiRaces: any[] = [];
        try {
            const calResp = await axios.get(`https://api.jolpi.ca/ergast/f1/${year}.json`);
            jolpiRaces = calResp.data?.MRData?.RaceTable?.Races || [];
        } catch (e: any) {
            console.warn(`Jolpi calendar unavailable for ${year}:`, e.message);
        }

        const dbResults = Array.from(conn.db.race_result.iter());
        const now = new Date().getTime();

        for (const targetRace of dbRaces as any[]) {
            const raceKey = targetRace.raceKey;
            const raceDate = new Date(targetRace.date).getTime();

            const markEnded = () => {
                if (targetRace && targetRace.status !== 'ended') {
                    conn.reducers.seedRace({
                        raceKey: targetRace.raceKey,
                        name: targetRace.name,
                        meetingName: targetRace.meetingName,
                        location: targetRace.location,
                        date: targetRace.date,
                        circuitKey: targetRace.circuitKey,
                        status: 'ended',
                        year: year
                    });
                    console.log(`🏁 Marked raceKey ${raceKey} (${targetRace.meetingName}) as ended.`);
                }
            };

            // Check if we already have FULL results for this raceKey (>= 10 drivers = complete classification)
            const existingResultCount = dbResults.filter(res => res.raceKey === raceKey).length;
            if (existingResultCount >= 10) {
                // Full results already seeded, just ensure status is correct
                if (raceDate <= now) markEnded();
                continue;
            }
            // If we have partial results (1-9, e.g. old podium-only seed), we'll re-fetch to backfill
            if (existingResultCount > 0) {
                console.log(`⚠️ Race ${targetRace.meetingName} (raceKey: ${raceKey}) has only ${existingResultCount} results — will attempt backfill.`);
            }

            // If race is in the future, skip
            if (raceDate > now) {
                continue;
            }

            // Race is in the past or has finished - ensure ended
            markEnded();

            // Find matching Jolpi race by closest date within 4 days
            let matchingJolpiRace: any = null;
            let minDist = Infinity;
            for (const jr of jolpiRaces) {
                const jolpiDate = new Date(jr.date + 'T' + (jr.time || '00:00:00Z')).getTime();
                const dist = Math.abs(raceDate - jolpiDate);
                if (dist < 4 * 24 * 3600 * 1000 && dist < minDist) {
                    minDist = dist;
                    matchingJolpiRace = jr;
                }
            }

            let resultsToSeed: any[] = [];

            // 1. Try Jolpi
            if (matchingJolpiRace) {
                try {
                    const round = matchingJolpiRace.round;
                    console.log(`Fetching Jolpi results for ${matchingJolpiRace.raceName} (Round ${round}, raceKey: ${raceKey})...`);
                    const resResp = await axios.get(`https://api.jolpi.ca/ergast/f1/${year}/${round}/results.json`);
                    const resultsData = resResp.data?.MRData?.RaceTable?.Races?.[0]?.Results || [];
                    if (resultsData.length > 0) {
                        for (const res of resultsData as any[]) {
                            resultsToSeed.push({
                                raceKey: raceKey,
                                position: parseInt(res.position, 10),
                                driverNumber: parseInt(res.Driver.permanentNumber || '0', 10),
                                driverName: formatDriverName(`${res.Driver.givenName} ${res.Driver.familyName}`),
                                team: res.Constructor.name,
                                timeStatus: res.Time?.time || res.status,
                                fastestLap: res?.FastestLap?.rank === "1",
                                dnf: !res.status.match(/Finished|\+\d+ Lap/),
                                points: parseFloat(res.points || "0")
                            });
                        }
                    }
                } catch (err: any) {
                    console.warn(`Jolpi fetch failed for raceKey ${raceKey}:`, err.message);
                }
            }

            // 2. Fallback to OpenF1 if Jolpi returned no results
            if (resultsToSeed.length === 0) {
                console.log(`Jolpi had no results for ${targetRace.meetingName} (raceKey: ${raceKey}). Falling back to OpenF1...`);
                resultsToSeed = await fetchOpenF1Results(raceKey);
            }

            // 3. Seed results if found
            if (resultsToSeed.length > 0) {
                const payloadResults = [];
                for (const res of resultsToSeed) {
                    conn.reducers.seedRaceResult(res);
                    payloadResults.push({
                        driver_name: res.driverName,
                        team: res.team,
                        position: res.position,
                        points: res.points,
                        fastest_lap: res.fastestLap,
                        dnf: res.dnf
                    });
                }
                console.log(`Successfully seeded ${resultsToSeed.length} results for ${targetRace.meetingName} (raceKey: ${raceKey})`);

                // Fire Webhook to Apex
                try {
                    const webhookUrl = process.env.APEX_WEBHOOK_URL || 'http://localhost:3000/api/webhooks/silverwall';
                    const webhookSecret = process.env.SILVERWALL_WEBHOOK_SECRET || '';
                    await axios.post(webhookUrl, {
                        event: 'race_result_updated',
                        season_year: year,
                        race_key: raceKey,
                        results: payloadResults
                    }, {
                        headers: {
                            'x-api-key': webhookSecret
                        }
                    });
                    console.log(`Successfully fired webhook to Apex F1 for ${targetRace.meetingName}`);
                } catch (err: any) {
                    console.error(`Failed to fire webhook to Apex F1:`, err.message);
                }
            } else {
                console.log(`No results available yet for ${targetRace.meetingName} (raceKey: ${raceKey}).`);
            }

            await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit buffer
        }
    } catch (err) {
        console.error(`Failed to sync podiums for ${year}:`, err);
    }
}

async function syncStandings(year: number) {
    console.log(`Syncing Championship Standings for ${year}...`);
    try {
        let seeded = false;
        if (year <= 2025) {
            try {
                // Fetch Driver Standings from Jolpi (Ergast continuation)
                const driverResp = await axios.get(`https://api.jolpi.ca/ergast/f1/${year}/driverStandings.json`);
                const driverStandings = driverResp.data.MRData.StandingsTable.StandingsLists[0].DriverStandings;

                for (const ds of driverStandings) {
                    conn.reducers.seedDriverStandings({
                        seasonYear: year,
                        position: parseInt(ds.position, 10),
                        driverNumber: parseInt(ds.Driver.permanentNumber || '0', 10),
                        driverName: formatDriverName(`${ds.Driver.givenName} ${ds.Driver.familyName}`),
                        team: ds.Constructors[0]?.name || 'Unknown',
                        points: parseFloat(ds.points),
                        wins: parseInt(ds.wins, 10)
                    });
                }

                // Fetch Constructor Standings
                const constResp = await axios.get(`https://api.jolpi.ca/ergast/f1/${year}/constructorStandings.json`);
                const constStandings = constResp.data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;

                for (const cs of constStandings) {
                    conn.reducers.seedConstructorStandings({
                        seasonYear: year,
                        position: parseInt(cs.position, 10),
                        team: cs.Constructor.name,
                        points: parseFloat(cs.points),
                        wins: parseInt(cs.wins, 10)
                    });
                }

                console.log(`Seeded ${driverStandings.length} drivers and ${constStandings.length} constructors for ${year}`);
                seeded = true;
            } catch (e: any) {
                console.warn(`Jolpi standings failed for ${year}: ${e.message}. Falling back to DB calculation.`);
            }
        }

        // For 2026 or fallback: Calculate standings directly from all completed race results in SpacetimeDB
        if (!seeded || year === 2026) {
            // F1 points table: position -> points (no `points` column in race_result, so we compute from position)
            const F1_POINTS_TABLE: Record<number, number> = { 1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1 };

            const dbRaces = Array.from(conn.db.race.iter()).filter((r: any) => r.seasonYear === year && r.name === 'Race');
            const raceKeys = new Set(dbRaces.map((r: any) => r.raceKey));
            const allResults = Array.from(conn.db.race_result.iter()).filter((res: any) => raceKeys.has(res.raceKey));

            if (allResults.length > 0) {
                const driverMap = new Map<string, { driverNumber: number, name: string, team: string, points: number, wins: number }>();
                const constMap = new Map<string, { team: string, points: number, wins: number }>();

                for (const res of allResults as any[]) {
                    const normName = formatDriverName(res.driverName);
                    // Compute points from finishing position (race_result has no points column)
                    let pts = F1_POINTS_TABLE[res.position] || 0;
                    // +1 point for fastest lap if finished in top 10
                    if (res.fastestLap && res.position <= 10) {
                        pts += 1;
                    }
                    const isWin = res.position === 1 ? 1 : 0;

                    // Driver
                    const d = driverMap.get(normName) || { driverNumber: res.driverNumber, name: normName, team: res.team, points: 0, wins: 0 };
                    d.points += pts;
                    d.wins += isWin;
                    if (res.driverNumber > 0) d.driverNumber = res.driverNumber;
                    if (res.team && res.team !== 'Unknown') d.team = res.team;
                    driverMap.set(normName, d);

                    // Constructor
                    if (res.team && res.team !== 'Unknown') {
                        const c = constMap.get(res.team) || { team: res.team, points: 0, wins: 0 };
                        c.points += pts;
                        c.wins += isWin;
                        constMap.set(res.team, c);
                    }
                }

                const sortedDrivers = Array.from(driverMap.values()).sort((a, b) => b.points - a.points || b.wins - a.wins);
                sortedDrivers.forEach((d, idx) => {
                    conn.reducers.seedDriverStandings({
                        seasonYear: year,
                        position: idx + 1,
                        driverNumber: d.driverNumber,
                        driverName: d.name,
                        team: d.team,
                        points: d.points,
                        wins: d.wins
                    });
                });

                const sortedConstructors = Array.from(constMap.values()).sort((a, b) => b.points - a.points || b.wins - a.wins);
                sortedConstructors.forEach((c, idx) => {
                    conn.reducers.seedConstructorStandings({
                        seasonYear: year,
                        position: idx + 1,
                        team: c.team,
                        points: c.points,
                        wins: c.wins
                    });
                });

                console.log(`Calculated & updated standings for ${year}: ${sortedDrivers.length} drivers, ${sortedConstructors.length} constructors`);
            }
        }
    } catch (err) {
        console.error(`Failed to sync standings for ${year}:`, err);
    }
}

const attemptedCircuits = new Set<number>();

async function syncYearRaces(year: number) {
    console.log(`Syncing races for ${year}...`);
    try {
        const resp = await axios.get(`${OPENF1_BASE_URL}/sessions`, {
            params: { year: year }
        });
        const sessions = resp.data;
        // Pre-fetch results to know which races already have data (prevents status overwrite)
        const dbResults = Array.from(conn.db.race_result.iter());

        for (const s of sessions) {
            let status = 'upcoming';
            const now = new Date().getTime();
            const start = new Date(s.date_start).getTime();
            const end = s.date_end ? new Date(s.date_end).getTime() : start + (2 * 60 * 60 * 1000); // Guess 2 hours if no end date
            
            if (now > end) {
                status = 'ended';
            } else if (now >= start && now <= end) {
                status = 'live';
            }

            // FIX: If this race already has results in DB, ALWAYS keep status as 'ended'
            // This prevents syncYearRaces from overwriting a correctly-ended race back to 'upcoming'/'live'
            const hasResultsInDb = dbResults.some((res: any) => res.raceKey === s.session_key);
            if (hasResultsInDb) {
                status = 'ended';
            }

            const meetingName = s.meeting_name || `${s.country_name || 'Unknown'} Grand Prix`;
            const location = `${s.circuit_short_name || s.location || 'Unknown'}, ${s.country_name || ''}`.trim();

            conn.reducers.seedRace({
                raceKey: s.session_key,
                name: s.session_name || 'Race',
                meetingName: meetingName,
                location: location,
                date: s.date_start,
                circuitKey: s.circuit_key,
                status: status,
                year: year
            });

            // Check if track geometry for this circuit is already seeded in SpacetimeDB
            if (s.circuit_key) {
                const hasGeometry = Array.from(conn.db.track_point.iter()).some((p: any) => p.circuitKey === s.circuit_key);
                if (!hasGeometry && !attemptedCircuits.has(s.circuit_key)) {
                    attemptedCircuits.add(s.circuit_key);
                    console.log(`Track geometry for circuit ${s.circuit_key} not found in SpacetimeDB. Syncing from Apex in background...`);
                    syncTrack(s.session_key).catch(err => {
                        console.error(`Background track sync failed for circuit ${s.circuit_key}:`, err.message);
                    });
                }
            }
        }
    } catch (err) {
        console.error(`Failed to sync races for ${year}:`, err);
    }
}



async function syncYearDrivers(year: number) {
    console.log(`Syncing drivers for ${year}...`);
    try {
        const resp = await axios.get(`${OPENF1_BASE_URL}/drivers`, {
            params: { year: year }
        });
        const drivers = resp.data;
        // Group by driver number to avoid duplicates
        const uniqueDrivers = new Map();
        for (const d of drivers) {
            uniqueDrivers.set(d.driver_number, d);
        }

        for (const d of uniqueDrivers.values()) {
            conn.reducers.upsertDriver({
                driverNumber: d.driver_number,
                name: d.broadcast_name || d.full_name || d.last_name,
                team: d.team_name,
                color: d.team_colour ? `#${d.team_colour}` : '#00D2BE'
            });
        }
    } catch (err) {
        console.error(`Failed to sync drivers for ${year}:`, err);
    }
}

const CIRCUIT_KEY_TO_APEX_ID: Record<number, string> = {
    63: 'bahrain',
    49: 'shanghai',
    23: 'villeneuve', // Montreal / Canada
    10: 'albert_park', // Melbourne (Albert Park)
    144: 'baku', // Baku
    15: 'catalunya', // Catalunya / Barcelona
    2: 'silverstone', // Silverstone
    4: 'hungaroring', // Hungaroring
    7: 'spa', // Spa-Francorchamps
    39: 'monza', // Monza
    61: 'marina_bay', // Marina Bay / Singapore
    9: 'americas', // Austin / COTA
    14: 'interlagos', // Interlagos / Sao Paulo
    70: 'yas_marina', // Yas Marina / Abu Dhabi
    150: 'losail', // Lusail / Qatar
    152: 'vegas', // Las Vegas Strip
    149: 'jeddah', // Jeddah Corniche
    151: 'miami', // Miami International Autodrome
    6: 'imola', // Imola
    22: 'monaco', // Monaco
    19: 'red_bull_ring', // Spielberg
    55: 'zandvoort', // Zandvoort
    65: 'rodriguez', // Mexico City
    46: 'suzuka', // Suzuka
};

function getApexCircuitId(circuitKey: number, circuitShortName?: string, location?: string): string | null {
    if (CIRCUIT_KEY_TO_APEX_ID[circuitKey]) {
        return CIRCUIT_KEY_TO_APEX_ID[circuitKey];
    }
    
    // Fuzzy matching based on short name or location
    const searchStr = `${circuitShortName || ''} ${location || ''}`.toLowerCase();
    
    if (searchStr.includes('bahrain') || searchStr.includes('sakhir')) return 'bahrain';
    if (searchStr.includes('shanghai')) return 'shanghai';
    if (searchStr.includes('montreal') || searchStr.includes('villeneuve')) return 'villeneuve';
    if (searchStr.includes('melbourne') || searchStr.includes('albert park')) return 'albert_park';
    if (searchStr.includes('baku')) return 'baku';
    if (searchStr.includes('catalunya') || searchStr.includes('barcelona')) return 'catalunya';
    if (searchStr.includes('silverstone')) return 'silverstone';
    if (searchStr.includes('hungaroring') || searchStr.includes('budapest')) return 'hungaroring';
    if (searchStr.includes('spa')) return 'spa';
    if (searchStr.includes('monza')) return 'monza';
    if (searchStr.includes('singapore') || searchStr.includes('marina bay')) return 'marina_bay';
    if (searchStr.includes('americas') || searchStr.includes('austin')) return 'americas';
    if (searchStr.includes('interlagos') || searchStr.includes('jose carlos pace') || searchStr.includes('sao paulo')) return 'interlagos';
    if (searchStr.includes('yas marina') || searchStr.includes('abu dhabi')) return 'yas_marina';
    if (searchStr.includes('losail') || searchStr.includes('qatar')) return 'losail';
    if (searchStr.includes('vegas')) return 'vegas';
    if (searchStr.includes('jeddah')) return 'jeddah';
    if (searchStr.includes('miami')) return 'miami';
    if (searchStr.includes('imola')) return 'imola';
    if (searchStr.includes('monaco') || searchStr.includes('monte carlo')) return 'monaco';
    if (searchStr.includes('red bull') || searchStr.includes('spielberg')) return 'red_bull_ring';
    if (searchStr.includes('zandvoort')) return 'zandvoort';
    if (searchStr.includes('rodriguez') || searchStr.includes('mexico')) return 'rodriguez';
    if (searchStr.includes('suzuka')) return 'suzuka';
    
    return null;
}

async function syncTrack(sessionKey: number) {
    console.log(`Syncing track geometry for session ${sessionKey}...`);
    try {
        // 1. Fetch session details to get circuit_key and details
        const sessionResp = await axios.get(`${OPENF1_BASE_URL}/sessions`, {
            params: { session_key: sessionKey }
        });
        const session = sessionResp.data[0];
        if (!session || !session.circuit_key) {
            console.warn(`No session or circuit_key found for session ${sessionKey}`);
            return;
        }
        const circuitKey = session.circuit_key;
        const circuitShortName = session.circuit_short_name;
        const location = session.location;

        // 2. Map to Apex Circuit ID
        const apexCircuitId = getApexCircuitId(circuitKey, circuitShortName, location);
        if (!apexCircuitId) {
            console.warn(`Could not map circuitKey ${circuitKey} (${circuitShortName}) to an Apex circuit ID. Falling back to OpenF1 location API...`);
            await syncTrackLegacy(sessionKey, session);
            return;
        }

        // 3. Query Apex API for geometry
        const APEX_API_URL = process.env.APEX_API_URL || 'https://apex-f1-api.fly.dev';
        const apiKey = process.env.APEX_API_KEY || 'f1_apex_super_secret_dev_key';

        console.log(`Fetching high-fidelity geometry for '${apexCircuitId}' from Apex API (${APEX_API_URL})...`);
        const apexResp = await axios.get(`${APEX_API_URL}/api/circuits/${apexCircuitId}/geometry`, {
            headers: { 'x-api-key': apiKey },
            timeout: 8000
        });

        const geometry = apexResp.data?.geometry || [];
        if (geometry.length === 0) {
            console.warn(`No geometry returned from Apex API for ${apexCircuitId}. Falling back to OpenF1 location API...`);
            await syncTrackLegacy(sessionKey, session);
            return;
        }

        console.log(`Successfully fetched ${geometry.length} points for ${apexCircuitId}. Seeding into SpacetimeDB...`);

        // 4. Seed into SpacetimeDB
        let order = 0;
        for (const pt of geometry) {
            conn.reducers.seedTrack({
                circuitKey: circuitKey,
                x: pt.x,
                y: pt.y,
                order: order++
            });
        }
        console.log(`Seeded ${order} track points for circuit ${circuitKey} to SpacetimeDB.`);

    } catch (err: any) {
        console.error(`Failed to sync track from Apex API for session ${sessionKey}: ${err.message}. Trying legacy fallback...`);
        try {
            const sessionResp = await axios.get(`${OPENF1_BASE_URL}/sessions`, {
                params: { session_key: sessionKey }
            });
            const session = sessionResp.data[0];
            if (session) {
                await syncTrackLegacy(sessionKey, session);
            }
        } catch (fallbackErr: any) {
            console.error(`Legacy fallback failed for session ${sessionKey}:`, fallbackErr.message);
        }
    }
}

async function syncTrackLegacy(sessionKey: number, session: any) {
    const circuitKey = session.circuit_key;
    console.log(`Running legacy OpenF1 location fetch for circuit ${circuitKey}...`);
    try {
        const driversToTry = [1, 44, 16, 4, 63];
        let locations = [];
        let successDriver = -1;

        for (const drv of driversToTry) {
            console.log(`Attempting to fetch track points for circuit ${circuitKey} using driver ${drv}...`);
            try {
                const locationResp = await axios.get(`${OPENF1_BASE_URL}/location`, {
                    params: {
                        session_key: sessionKey,
                        driver_number: drv
                    }
                });
                if (locationResp.data && locationResp.data.length > 0) {
                    locations = locationResp.data;
                    successDriver = drv;
                    break;
                }
            } catch (e: any) {
                if (e.response?.status === 429) {
                    console.warn("Rate limited during track sync, waiting 10s...");
                    await new Promise(r => setTimeout(r, 10000));
                }
                console.warn(`Driver ${drv} failed or no data: ${e.message}`);
            }
        }
        if (!locations || locations.length === 0) {
            console.warn(`No location data found to build track for session ${sessionKey}`);
            return;
        }

        const DOWNSAMPLE_FACTOR = 10;
        let order = 0;
        console.log(`Processing ${locations.length} raw location points for circuit ${circuitKey}...`);

        for (let i = 0; i < locations.length; i += DOWNSAMPLE_FACTOR) {
            const loc = locations[i];
            if (loc.x !== undefined && loc.y !== undefined) {
                conn.reducers.seedTrack({
                    circuitKey: circuitKey,
                    x: loc.x,
                    y: loc.y,
                    order: order++
                });
            }
        }
        console.log(`Seeded ${order} track points for circuit ${circuitKey} to SpacetimeDB.`);
    } catch (err: any) {
        console.error(`Legacy syncTrack failed for session ${sessionKey}:`, err.message);
    }
}

async function backfillYear(year: number) {
    console.log(`Searching for sessions in ${year}...`);
    try {
        const resp = await axios.get(`${OPENF1_BASE_URL}/sessions`, {
            params: { year: year }
        });
        const sessions = resp.data;
        if (sessions && sessions.length > 0) {
            console.log(`Found ${sessions.length} sessions for ${year}. Starting backfill...`);
            for (const session of sessions) {
                // To avoid overloading, we'll only sync a few points or specific races
                // For this demo, let's just log and move on, or sync the first 5 mins
                await syncSessionBriefly(session.session_key);
            }
        }
    } catch (err) {
        console.error(`Failed to backfill year ${year}:`, err);
    }
}

async function syncSessionBriefly(sessionKey: number) {
    console.log(`Backfilling session ${sessionKey} (First 1 minute cumulative)...`);
    try {
        // Fetch session start time
        const sessionResp = await axios.get(`${OPENF1_BASE_URL}/sessions`, {
            params: { session_key: sessionKey }
        });
        const session = sessionResp.data[0];
        if (!session || !session.date_start) return;

        const start = new Date(session.date_start);
        const end = new Date(start.getTime() + 60000); // 1 minute of data

        const [carData, locationData] = await Promise.all([
            axios.get(`${OPENF1_BASE_URL}/car_data`, {
                params: { session_key: sessionKey, 'date>': start.toISOString(), 'date<': end.toISOString() }
            }).catch(() => ({ data: [] })),
            axios.get(`${OPENF1_BASE_URL}/location`, {
                params: { session_key: sessionKey, 'date>': start.toISOString(), 'date<': end.toISOString() }
            }).catch(() => ({ data: [] }))
        ]);

        if (carData.data && carData.data.length > 0) {
            console.log(`Syncing ${carData.data.length} points for historical session ${sessionKey}`);
            for (const p of carData.data) {
                const loc = locationData.data?.find((l: any) =>
                    l.driver_number === p.driver_number &&
                    Math.abs(new Date(l.date).getTime() - new Date(p.date).getTime()) < 500
                );

                conn.reducers.insertTelemetry({
                    driverNumber: p.driver_number,
                    sessionKey: p.session_key,
                    timestamp: p.date,
                    speed: p.speed || 0,
                    rpm: p.rpm || 0,
                    gear: p.n_gear || 0,
                    throttle: p.throttle || 0,
                    brake: p.brake || 0,
                    drs: p.drs || 0,
                    x: loc?.x || 0,
                    y: loc?.y || 0
                });
            }
        }
    } catch (err) {
        console.error(`Failed to sync session ${sessionKey}:`, err);
    }
}

function setupLiveIngestion() {
    lastSyncedTimestamp = new Date();
    lastSyncedTimestamp.setSeconds(lastSyncedTimestamp.getSeconds() - 60);

    setInterval(async () => {
        try {
            // Find active live session key from SpacetimeDB
            const liveRace = Array.from(conn.db.race.iter()).find((r: any) => r.status === 'live') as any;
            if (liveRace) {
                if (currentSessionKey !== liveRace.raceKey) {
                    console.log(`🏎️ Detected live race: ${liveRace.meetingName} - ${liveRace.name} (raceKey: ${liveRace.raceKey}). Switching live telemetry ingestion.`);
                    currentSessionKey = liveRace.raceKey;
                    // Reset sync timestamp
                    lastSyncedTimestamp = new Date();
                    lastSyncedTimestamp.setSeconds(lastSyncedTimestamp.getSeconds() - 30);
                }
                await syncTelemetry();
            } else {
                // No live race, do nothing (or reset currentSessionKey)
                if (currentSessionKey !== -1) {
                    console.log(`ℹ️ No live race active. Telemetry ingestion sleeping...`);
                    currentSessionKey = -1;
                }
            }
        } catch (err) {
            console.error('Ingestion Loop Error:', err);
        }
    }, POLL_INTERVAL_MS);
}

async function syncTelemetry() {
    if (!lastSyncedTimestamp) return;

    const start = lastSyncedTimestamp.toISOString();
    const end = new Date(lastSyncedTimestamp.getTime() + TIME_WINDOW_STEP_MS).toISOString();

    console.log(`Polling OpenF1: ${start} -> ${end}`);

    try {
        const [carData, locationData] = await Promise.all([
            axios.get(`${OPENF1_BASE_URL}/car_data`, {
                params: { session_key: currentSessionKey, 'date>': start, 'date<': end }
            }).catch(() => ({ data: [] })),
            axios.get(`${OPENF1_BASE_URL}/location`, {
                params: { session_key: currentSessionKey, 'date>': start, 'date<': end }
            }).catch(() => ({ data: [] }))
        ]);

        if (carData.data && carData.data.length > 0) {
            console.log(`Fetched ${carData.data.length} telemetry points for session ${currentSessionKey}`);

            for (const p of carData.data) {
                const loc = locationData.data?.find((l: any) =>
                    l.driver_number === p.driver_number &&
                    Math.abs(new Date(l.date).getTime() - new Date(p.date).getTime()) < 500
                );

                conn.reducers.insertTelemetry({
                    driverNumber: p.driver_number,
                    sessionKey: p.session_key,
                    timestamp: p.date,
                    speed: p.speed || 0,
                    rpm: p.rpm || 0,
                    gear: p.n_gear || 0,
                    throttle: p.throttle || 0,
                    brake: p.brake || 0,
                    drs: p.drs || 0,
                    x: loc?.x || 0,
                    y: loc?.y || 0
                });
            }

            lastSyncedTimestamp = new Date(end);
        } else {
            const now = new Date();
            if (new Date(end).getTime() < now.getTime()) {
                lastSyncedTimestamp = new Date(end);
            }
        }

    } catch (err: any) {
        if (err.response?.status === 404) {
            console.log('No data found in window (404). Sliding forward...');
            const now = new Date();
            if (new Date(end).getTime() < now.getTime()) {
                lastSyncedTimestamp = new Date(end);
            }
        } else if (err.response?.status === 429) {
            console.warn('Rate limit 429. Backing off...');
        } else if (err.response?.status === 422) {
            console.warn('OpenF1 422 Error - Window too large or invalid.');
        } else {
            throw err;
        }
    }
}

