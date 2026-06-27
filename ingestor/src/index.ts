// @ts-nocheck
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

const conn = DbConnection.builder()
    .withUri(SPACETIME_URI)
    .withDatabaseName(DBNAME)
    .onConnect(() => {
        console.log('Ingestor connected to SpacetimeDB. Subscribing to tables...');
        conn.subscriptionBuilder()
            .onApplied(() => {
                console.log('Ingestor subscription applied. Starting ingestion...');
                startIngestion();
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
    await syncYearRaces(2026);
    await sleep(2000);
    await syncYearDrivers(2026);
    await sleep(2000);
    await syncStandings(2025);
    await sleep(2000);

    // Clear 2026 standings before seeding to prevent duplicates
    try {
        const { execSync } = require('child_process');
        execSync(`spacetime sql spacetimedb-uorks "DELETE FROM driver_standings WHERE season_year = 2026"`, { stdio: 'ignore' });
        execSync(`spacetime sql spacetimedb-uorks "DELETE FROM constructor_standings WHERE season_year = 2026"`, { stdio: 'ignore' });
    } catch (e) {
        console.error("Failed to clear 2026 standings on startup:", e);
    }
    await sleep(2000);

    await syncStandings(2026);
    await sleep(2000);
    await syncPodiums(2026);
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

    // PRIORITY 4: Seed Canada Track Geometry (Circuit 23)
    console.log("Seeding Circuit 23 (Canada) track geometry...");
    await syncTrack(9524);
    await sleep(2000);

    console.log("Background: Syncing historical metadata (throttled)...");
    // Move heavy metadata syncs to follow-up to avoid blocking priorities
    const otherYears = [2024, 2025];
    for (const year of otherYears) {
        await syncYearRaces(year);
        await sleep(2000);
        await syncPodiums(year);
        await sleep(2000);
        await syncYearDrivers(year);
        await sleep(5000);
    }

    // Start live ingestion loop (dynamically checks for live session in SpacetimeDB)
    setupLiveIngestion();

    // Run periodic sync of races, standings, and podiums every 10 minutes to auto-update statuses and fetch new data
    setInterval(async () => {
        console.log(">>> Running periodic sync task...");
        try {
            await syncYearRaces(2026);
            await syncYearDrivers(2026);

            // Clear and update standings to avoid duplication and get latest updates
            try {
                const { execSync } = require('child_process');
                execSync(`spacetime sql spacetimedb-uorks "DELETE FROM driver_standings WHERE season_year = 2026"`, { stdio: 'ignore' });
                execSync(`spacetime sql spacetimedb-uorks "DELETE FROM constructor_standings WHERE season_year = 2026"`, { stdio: 'ignore' });
            } catch (e) {
                console.error("Failed to clear standings via CLI, continuing...", e);
            }

            await syncStandings(2026);
            await syncPodiums(2026);
        } catch (e) {
            console.error("Periodic sync task failed:", e);
        }
    }, 10 * 60 * 1000); // 10 minutes
}

async function syncPodiums(year: number) {
    console.log(`Syncing race results (podiums) for ${year}...`);
    try {
        // 1. Get all races for this year from SpacetimeDB to create a lookup
        const dbRaces = Array.from(conn.db.race.iter()).filter((r: any) => r.seasonYear === year && r.name === 'Race');
        if (dbRaces.length === 0) {
            console.log(`No races found in DB for year ${year}, skipping podium sync.`);
            return;
        }

        const lookup = new Map<string, number>();
        for (const r of dbRaces as any[]) {
            const country = r.meetingName.replace(/Grand Prix/gi, '').trim().toLowerCase();
            const locParts = r.location.split(',').map((p: string) => p.trim().toLowerCase());
            
            if (country) lookup.set(country, r.raceKey);
            for (const p of locParts) {
                if (p) lookup.set(p, r.raceKey);
            }
        }

        // 2. Fetch the season calendar from Jolpi
        console.log(`Fetching F1 calendar for ${year} from Jolpi...`);
        const calResp = await axios.get(`https://api.jolpi.ca/ergast/f1/${year}.json`);
        const jolpiRaces = calResp.data?.MRData?.RaceTable?.Races || [];

        const dbResults = Array.from(conn.db.race_result.iter());

        for (const race of jolpiRaces) {
            const round = race.round;
            const jolpiCountry = race.raceName.replace(/Grand Prix/gi, '').trim().toLowerCase();
            let raceKey = lookup.get(jolpiCountry);

            if (!raceKey && race.Circuit?.Location) {
                const locality = (race.Circuit.Location.locality || '').toLowerCase();
                const country = (race.Circuit.Location.country || '').toLowerCase();
                raceKey = lookup.get(locality) || lookup.get(country);
            }

            if (!raceKey) {
                for (const [key, val] of lookup.entries()) {
                    if (key.includes(jolpiCountry) || jolpiCountry.includes(key)) {
                        raceKey = val;
                        break;
                    }
                }
            }

            if (raceKey) {
                // Check if we already have results for this raceKey
                const hasResults = dbResults.some(res => res.raceKey === raceKey);
                if (hasResults) {
                    console.log(`Podium results for raceKey ${raceKey} (${race.raceName}) already exist in SpacetimeDB. Skipping.`);
                    continue;
                }

                // Check if the race date is in the past
                const raceDate = new Date(race.date + 'T' + (race.time || '00:00:00Z'));
                if (raceDate.getTime() > new Date().getTime()) {
                    // Race is in the future
                    continue;
                }

                console.log(`Fetching results for ${race.raceName} (Round ${round}, raceKey: ${raceKey})...`);
                try {
                    const resResp = await axios.get(`https://api.jolpi.ca/ergast/f1/${year}/${round}/results.json`);
                    const resultsData = resResp.data?.MRData?.RaceTable?.Races?.[0]?.Results || [];
                    
                    if (resultsData.length > 0) {
                        const payloadResults = [];
                        for (const res of resultsData as any[]) {
                            const resultData = {
                                raceKey: raceKey,
                                position: parseInt(res.position, 10),
                                driverNumber: parseInt(res.Driver.permanentNumber || '0', 10),
                                driverName: `${res.Driver.givenName} ${res.Driver.familyName}`,
                                team: res.Constructor.name,
                                timeStatus: res.Time?.time || res.status,
                                fastestLap: res?.FastestLap?.rank === "1",
                                dnf: !res.status.match(/Finished|\+\d+ Lap/),
                                points: parseFloat(res.points || "0")
                            };
                            
                            conn.reducers.seedRaceResult(resultData as any);
                            
                            payloadResults.push({
                                driver_name: resultData.driverName,
                                team: resultData.team,
                                position: resultData.position,
                                points: resultData.points,
                                fastest_lap: resultData.fastestLap,
                                dnf: resultData.dnf
                            });
                        }
                        
                        console.log(`Successfully seeded full results for ${race.raceName} (raceKey: ${raceKey})`);
                        
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
                            console.log(`Successfully fired webhook to Apex F1 for ${race.raceName}`);
                        } catch (err: any) {
                            console.error(`Failed to fire webhook to Apex F1:`, err.message);
                        }

                    } else {
                        console.log(`No results returned for ${race.raceName} yet.`);
                    }
                } catch (err: any) {
                    console.error(`Failed to fetch results for ${race.raceName}:`, err.message);
                }
                await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit buffer
            } else {
                console.warn(`Could not find raceKey for Jolpi race: ${race.raceName} (${year})`);
            }
        }
    } catch (err) {
        console.error(`Failed to sync podiums for ${year}:`, err);
    }
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
                if (!hasGeometry) {
                    console.log(`Track geometry for circuit ${s.circuit_key} not found in SpacetimeDB. Syncing from Apex...`);
                    await syncTrack(s.session_key);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Throttle requests
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

