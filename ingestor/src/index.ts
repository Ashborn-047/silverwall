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
let currentSessionKey = 9673; // Default or fetched
let isIngesting = false;

const conn = DbConnection.builder()
    .withUri(SPACETIME_URI)
    .withDatabaseName(DBNAME)
    .onConnect(() => {
        console.log('Ingestor connected to SpacetimeDB');
        startIngestion();
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
    console.log(">>> PRIORITY: Syncing 2026 Races and 2025 Standings baseline...");
    await syncYearRaces(2026);
    await sleep(2000);
    await syncYearDrivers(2026);
    await sleep(2000);
    await syncStandings(2025);
    await sleep(2000);

    // PRIORITY 2: Seed Shanghai Track Geometry (Circuit 49) 
    // This resolves the 'GEOMETRY_ERROR' on the Landing Page
    console.log("Syncing Circuit 49 (Shanghai) track geometry...");
    try {
        await syncTrack(9673); 
    } catch (e) {
        console.error("Failed priority seed for Shanghai, retrying with fallback session 9663...");
        await syncTrack(9663); // FP1
    }
    await sleep(5000);

    // PRIORITY 3: Seed Bahrain Track Geometry (Circuit 63)
    console.log("Seeding Circuit 63 (Bahrain) track geometry...");
    await syncTrack(9472);
    await sleep(2000);

    console.log("Background: Syncing historical metadata (throttled)...");
    // Move heavy metadata syncs to follow-up to avoid blocking priorities
    const otherYears = [2024, 2025];
    for (const year of otherYears) {
        await syncYearRaces(year);
        await sleep(5000); // Heavy throttle
        await syncYearDrivers(year);
        await sleep(5000);
    }

    // Start live ingestion for 2026
    setupLiveIngestion(9673);
}

async function syncStandings(year: number) {
    console.log(`Syncing Championship Standings for ${year}...`);
    try {
        // Fetch Driver Standings from Jolpi (Ergast continuation)
        const driverResp = await axios.get(`https://api.jolpi.ca/ergast/f1/${year}/driverStandings.json`);
        const driverStandings = driverResp.data.MRData.StandingsTable.StandingsLists[0].DriverStandings;

        for (const ds of driverStandings) {
            conn.reducers.seedDriverStandings({
                seasonYear: year,
                position: parseInt(ds.position, 10),
                driverNumber: parseInt(ds.Driver.permanentNumber || '0', 10),
                driverName: `${ds.Driver.givenName} ${ds.Driver.familyName}`,
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
    } catch (err) {
        console.error(`Failed to sync standings for ${year}:`, err);
    }
}

async function syncYearRaces(year: number) {
    console.log(`Syncing races for ${year}...`);
    try {
        const resp = await axios.get(`${OPENF1_BASE_URL}/sessions`, {
            params: { year: year }
        });
        const sessions = resp.data;
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

            conn.reducers.seedRace({
                raceKey: s.session_key,
                name: s.session_name || s.meeting_name || 'Race',
                date: s.date_start,
                circuitKey: s.circuit_key,
                status: status,
                year: year
            });
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

async function syncTrack(sessionKey: number) {
    console.log(`Syncing track geometry for session ${sessionKey}...`);
    try {
        // 1. Fetch session details to get circuit_key and start time
        const sessionResp = await axios.get(`${OPENF1_BASE_URL}/sessions`, {
            params: { session_key: sessionKey }
        });
        const session = sessionResp.data[0];
        if (!session || !session.circuit_key) {
            console.warn(`No session or circuit_key found for session ${sessionKey}`);
            return;
        }
        const circuitKey = session.circuit_key;

        // 2. Fetch location data for a single driver
        // We use a 45-minute offset to ensure cars are running laps.
        const start = new Date(session.date_start);
        const driversToTry = [1, 44, 16, 4, 63];
        let locations = [];
        let successDriver = -1;

        for (const drv of driversToTry) {
            console.log(`Attempting to fetch track points for circuit ${circuitKey} using driver ${drv}...`);
            try {
                // Fetch first ~10k location points without date constraints to guarantee data
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

        // 3. Simple downsampling (take every Nth point) to keep DB size reasonable
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

    } catch (err) {
        console.error(`Failed to sync track for session ${sessionKey}:`, err);
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
                params: { session_key: sessionKey, date: `>${start.toISOString()}`, date_to: `<${end.toISOString()}` }
            }).catch(() => ({ data: [] })),
            axios.get(`${OPENF1_BASE_URL}/location`, {
                params: { session_key: sessionKey, date: `>${start.toISOString()}`, date_to: `<${end.toISOString()}` }
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

function setupLiveIngestion(sessionKey: number) {
    currentSessionKey = sessionKey;
    lastSyncedTimestamp = new Date();
    lastSyncedTimestamp.setSeconds(lastSyncedTimestamp.getSeconds() - 60);

    setInterval(async () => {
        try {
            await syncTelemetry();
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
                params: { session_key: currentSessionKey, date: `>${start}`, date_to: `<${end}` }
            }).catch(() => ({ data: [] })),
            axios.get(`${OPENF1_BASE_URL}/location`, {
                params: { session_key: currentSessionKey, date: `>${start}`, date_to: `<${end}` }
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

