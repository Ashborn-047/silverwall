import axios from 'axios';
import { DbConnection } from './sdk';

const OPENF1 = 'https://api.openf1.org/v1';
const SPACETIME_URI = 'wss://maincloud.spacetimedb.com';
const DBNAME = 'spacetimedb-uorks';
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
    const conn = DbConnection.builder()
        .withUri(SPACETIME_URI)
        .withDatabaseName(DBNAME)
        .onConnect(async () => {
            console.log('Connected to SpacetimeDB');
            conn.subscriptionBuilder()
                .onApplied(async () => {
                    console.log('Subscribed. Starting DEFINITIVE SEED...\n');
                    
                    // 1. Geometry (Critical for Landing Page)
                    console.log('>>> Seeding Track Geometry...');
                    await syncTrack(conn, 9506, 49); // Shanghai 2024 Race
                    await sleep(5000);
                    await syncTrack(conn, 9472, 63); // Bahrain 2024 Race
                    await sleep(5000);

                    // 2. Seasons 2024, 2025, 2026
                    for (const year of [2024, 2025, 2026]) {
                        await seedYear(conn, year);
                        console.log(`Waiting 15s before next year...`);
                        await sleep(15000);
                    }
                    
                    console.log('\n✅ Definitive seed complete!');
                    process.exit(0);
                })
                .subscribe([
                    'SELECT * FROM race',
                    'SELECT * FROM track_point'
                ]);
        })
        .onConnectError((_, err) => { console.error(err); process.exit(1); })
        .build();
}

async function syncTrack(conn: any, sessionKey: number, circuitKey: number) {
    try {
        const resp = await axios.get(`${OPENF1}/location`, { params: { session_key: sessionKey } });
        const points = resp.data;
        if (points.length > 0) {
            console.log(`    Syncing ${points.length} points for Circuit ${circuitKey}...`);
            // Every 5th point is enough for the UI and saves bandwidth/db pressure
            for (let i = 0; i < points.length; i += 5) { 
                const p = points[i];
                conn.reducers.seedTrack({
                    circuit_key: circuitKey,
                    order: i,
                    x: p.x,
                    y: p.y
                });
                if (i % 500 === 0) await sleep(50);
            }
            console.log(`    ✅ Circuit ${circuitKey} complete.`);
        }
    } catch (e: any) {
        console.error(`    ❌ Geometry for ${sessionKey} failed: ${e.message}`);
    }
}

async function seedYear(conn: any, year: number) {
    console.log(`\n--- Seeding ${year} ---`);
    
    // 1. Get Meetings and Sessions
    const mResp = await axios.get(`${OPENF1}/meetings`, { params: { year } });
    const sResp = await axios.get(`${OPENF1}/sessions`, { params: { year } });
    const meetings = mResp.data;
    const sessions = sResp.data.filter((s: any) => s.session_name === 'Race' || s.session_name === 'Sprint');
    
    const meetingsMap = new Map<number, any>();
    for (const m of meetings) meetingsMap.set(m.meeting_key, m);

    // 2. Get Jolpi Data
    let jolpiRaces: any[] = [];
    let jolpiSprints: any[] = [];
    if (year <= 2025) {
        jolpiRaces = await fetchJolpiPaginated(`https://api.jolpi.ca/ergast/f1/${year}/results.json`);
        jolpiSprints = await fetchJolpiPaginated(`https://api.jolpi.ca/ergast/f1/${year}/sprint.json`);
        
        // Seed Standings
        await seedStandings(conn, year);
    }

    // 3. Seed Races and Podiums
    for (const s of sessions) {
        const meeting = meetingsMap.get(s.meeting_key);
        if (!meeting) continue;

        const location = `${meeting.location}, ${meeting.country_name}`;
        conn.reducers.seedRace({
            raceKey: s.session_key,
            name: s.session_name,
            meetingName: meeting.meeting_name,
            location: location,
            date: s.date_start,
            circuitKey: s.circuit_key,
            status: year <= 2025 ? 'ended' : 'upcoming',
            year
        });

        // Match Podium
        const sDate = new Date(s.date_start).getTime();
        if (s.session_name === 'Race') {
            const match = jolpiRaces.find(r => Math.abs(new Date(r.date).getTime() - sDate) < 4 * 24 * 3600 * 1000);
            if (match) seedPodium(conn, s.session_key, match.Results);
        } else if (s.session_name === 'Sprint') {
            const match = jolpiSprints.find(r => Math.abs(new Date(r.date).getTime() - sDate) < 4 * 24 * 3600 * 1000);
            if (match) seedPodium(conn, s.session_key, match.SprintResults);
        }
    }
    console.log(`    ✅ ${year} complete.`);
}

async function seedStandings(conn: any, year: number) {
    try {
        const dr = await axios.get(`https://api.jolpi.ca/ergast/f1/${year}/driverStandings.json`);
        const ds = dr.data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];
        for (const d of ds) {
            conn.reducers.seedDriverStandings({
                seasonYear: year, position: parseInt(d.position),
                driverNumber: parseInt(d.Driver.permanentNumber || '0'),
                driverName: `${d.Driver.givenName} ${d.Driver.familyName}`,
                team: d.Constructors[0]?.name || 'Unknown',
                points: parseFloat(d.points), wins: parseInt(d.wins)
            });
        }
        const cr = await axios.get(`https://api.jolpi.ca/ergast/f1/${year}/constructorStandings.json`);
        const cs = cr.data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings || [];
        for (const c of cs) {
            conn.reducers.seedConstructorStandings({
                seasonYear: year, position: parseInt(c.position),
                team: c.Constructor.name, points: parseFloat(c.points), wins: parseInt(c.wins)
            });
        }
    } catch (e) {}
}

function seedPodium(conn: any, raceKey: number, results: any[]) {
    if (!results) return;
    for (const res of results.slice(0, 3)) {
        conn.reducers.seedRaceResult({
            race_key: raceKey,
            position: parseInt(res.position),
            driver_number: parseInt(res.Driver.permanentNumber || '0'),
            driver_name: `${res.Driver.givenName} ${res.Driver.familyName}`,
            team: res.Constructor.name,
            time_status: res.Time?.time || res.status
        });
    }
}

async function fetchJolpiPaginated(url: string): Promise<any[]> {
    try {
        const resp = await axios.get(`${url}?limit=100`);
        const data = resp.data.MRData;
        const items = data.RaceTable.Races;
        if (parseInt(data.total) > 100) {
            await sleep(1000);
            const resp2 = await axios.get(`${url}?limit=100&offset=100`);
            items.push(...resp2.data.MRData.RaceTable.Races);
        }
        return items;
    } catch (e) { return []; }
}

main();
