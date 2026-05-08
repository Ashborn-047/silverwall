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
                    console.log('Subscribed. Starting Resilient Fix Strategy...\n');
                    
                    // 1. Sync Track Geometry (for the Landing Page)
                    console.log('>>> Fixing Geometry: Syncing track points for Shanghai (9673)...');
                    await syncTrack(conn, 9673); 
                    await sleep(10000); 
                    
                    console.log('>>> Fixing Geometry: Syncing track points for Bahrain (9472)...');
                    await syncTrack(conn, 9472);
                    await sleep(10000);

                    // 2. Fix Locations and Podiums for 2024 and 2025
                    for (const year of [2024, 2025]) {
                        await fixYear(conn, year);
                        console.log(`Waiting 30s before next year to avoid rate limits...`);
                        await sleep(30000);
                    }
                    
                    console.log('\n✅ All fixes applied!');
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

async function syncTrack(conn: any, sessionKey: number) {
    try {
        const resp = await axios.get(`${OPENF1}/location`, { params: { session_key: sessionKey } });
        const points = resp.data;
        if (points.length > 0) {
            const circuitKey = points[0].circuit_key;
            console.log(`    Syncing ${points.length} points for Circuit ${circuitKey}...`);
            // Reducing granularity to avoid overwhelming DB or API
            for (let i = 0; i < points.length; i += 2) { 
                const p = points[i];
                conn.reducers.seedTrackPoint({
                    circuitKey,
                    order: i,
                    x: p.x,
                    y: p.y,
                    z: p.z || 0
                });
                if (i % 200 === 0) await sleep(100);
            }
            console.log(`    ✅ Circuit ${circuitKey} complete.`);
        }
    } catch (e: any) {
        console.error(`    ❌ Failed to sync track for session ${sessionKey}: ${e.message}`);
        if (e.response?.status === 429) {
            console.log('    Wait 60s for rate limit...');
            await sleep(60000);
            return syncTrack(conn, sessionKey);
        }
    }
}

async function fixYear(conn: any, year: number) {
    console.log(`\n--- Fixing ${year} Locations and Podiums ---`);
    
    let meetings: any[] = [];
    try {
        const meetingsResp = await axios.get(`${OPENF1}/meetings`, { params: { year } });
        meetings = meetingsResp.data;
    } catch (e: any) {
         if (e.response?.status === 429) {
            console.log('    Wait 60s for rate limit...');
            await sleep(60000);
            return fixYear(conn, year);
        }
    }

    const meetingsMap = new Map<number, any>();
    for (const m of meetings) meetingsMap.set(m.meeting_key, m);
    
    await sleep(5000);
    const sessionsResp = await axios.get(`${OPENF1}/sessions`, { params: { year } });
    const sessions = sessionsResp.data;
    
    await sleep(5000);
    const jolpiRaces = await fetchJolpiPaginated(`https://api.jolpi.ca/ergast/f1/${year}/results.json`);
    const jolpiSprints = await fetchJolpiPaginated(`https://api.jolpi.ca/ergast/f1/${year}/sprint.json`);
    
    const jolpiRaceMap = new Map(jolpiRaces.map(r => [r.round, r]));
    const jolpiSprintMap = new Map(jolpiSprints.map(r => [r.round, r]));

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
            status: 'ended',
            year
        });

        const round = sessionToRound(s, jolpiRaces);
        if (round) {
            if (s.session_name === 'Race' && jolpiRaceMap.has(round)) {
                seedPodium(conn, s.session_key, jolpiRaceMap.get(round).Results);
            } else if (s.session_name === 'Sprint' && jolpiSprintMap.has(round)) {
                seedPodium(conn, s.session_key, jolpiSprintMap.get(round).SprintResults);
            }
        }
    }
    console.log(`✅ Done for ${year}`);
}

function sessionToRound(s: any, jolpiRaces: any[]): string | undefined {
    const sDate = new Date(s.date_start).getTime();
    let bestRound = undefined;
    let minDist = Infinity;
    for (const r of jolpiRaces) {
        const rDate = new Date(r.date).getTime();
        const dist = Math.abs(sDate - rDate);
        if (dist < 4 * 24 * 3600 * 1000 && dist < minDist) {
            minDist = dist;
            bestRound = r.round;
        }
    }
    return bestRound;
}

function seedPodium(conn: any, raceKey: number, results: any[]) {
    if (!results) return;
    for (const res of results.slice(0, 3)) {
        conn.reducers.seedRaceResult({
            raceKey,
            position: parseInt(res.position),
            driverNumber: parseInt(res.Driver.permanentNumber || '0'),
            driverName: `${res.Driver.givenName} ${res.Driver.familyName}`,
            team: res.Constructor.name,
            timeStatus: res.Time?.time || res.status
        });
    }
}

async function fetchJolpiPaginated(url: string): Promise<any[]> {
    const resp = await axios.get(`${url}?limit=100`);
    const data = resp.data.MRData;
    const items = data.RaceTable.Races;
    if (parseInt(data.total) > 100) {
        await sleep(2000);
        const resp2 = await axios.get(`${url}?limit=100&offset=100`);
        items.push(...resp2.data.MRData.RaceTable.Races);
    }
    return items;
}

main();
