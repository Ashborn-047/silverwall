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
                    console.log('Subscribed. Starting Surgical Fix...\n');
                    
                    // 1. Clear stale locations and names first (Fast)
                    console.log('>>> Fixing Locations and Names...');
                    for (const year of [2024, 2025]) {
                        await fixLocations(conn, year);
                        await sleep(5000);
                    }

                    // 2. Sync Track Geometry (Slow but precise)
                    // 9506 = 2024 Chinese Grand Prix Race
                    // 9472 = 2024 Bahrain Grand Prix Race
                    console.log('\n>>> Seeding Track Geometry (Shanghai and Bahrain)...');
                    await syncTrack(conn, 9506); // Shanghai (Circuit 49)
                    await sleep(10000);
                    await syncTrack(conn, 9472); // Bahrain (Circuit 63)
                    
                    console.log('\n✅ All surgical fixes applied!');
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

async function fixLocations(conn: any, year: number) {
    console.log(`    Fetching ${year} metadata...`);
    const mResp = await axios.get(`${OPENF1}/meetings`, { params: { year } });
    const sResp = await axios.get(`${OPENF1}/sessions`, { params: { year } });
    
    const meetingsMap = new Map<number, any>();
    for (const m of mResp.data) meetingsMap.set(m.meeting_key, m);

    for (const s of sResp.data) {
        const meeting = meetingsMap.get(s.meeting_key);
        if (meeting) {
            const properLocation = `${meeting.location}, ${meeting.country_name}`;
            conn.reducers.seedRace({
                raceKey: s.session_key,
                name: s.session_name,
                meetingName: meeting.meeting_name,
                location: properLocation,
                date: s.date_start,
                circuitKey: s.circuit_key,
                status: 'ended',
                year
            });
        }
    }
    console.log(`    ✅ Updated ${year} locations.`);
}

async function syncTrack(conn: any, sessionKey: number) {
    try {
        console.log(`    Fetching locations for session ${sessionKey}...`);
        const resp = await axios.get(`${OPENF1}/location`, { params: { session_key: sessionKey } });
        const points = resp.data;
        if (points.length > 0) {
            const circuitKey = points[0].circuit_key;
            console.log(`    Syncing ${points.length} points for Circuit ${circuitKey}...`);
            // Reducing density for SPEED (every 3rd point is enough for the UI)
            for (let i = 0; i < points.length; i += 3) { 
                const p = points[i];
                conn.reducers.seedTrackPoint({
                    circuitKey,
                    order: i,
                    x: p.x,
                    y: p.y,
                    z: p.z || 0
                });
                if (i % 300 === 0) await sleep(50);
            }
            console.log(`    ✅ Circuit ${circuitKey} complete.`);
        }
    } catch (e: any) {
        console.error(`    ❌ Error syncing session ${sessionKey}: ${e.message}`);
    }
}

main();
