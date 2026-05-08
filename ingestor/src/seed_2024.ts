import axios from 'axios';
import { DbConnection } from './sdk';

const OPENF1 = 'https://api.openf1.org/v1';
const SPACETIME_URI = 'wss://maincloud.spacetimedb.com';
const DBNAME = 'spacetimedb-uorks';
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchAllJolpiResults(year: number): Promise<any[]> {
    const allRaces: any[] = [];
    let offset = 0;
    while (true) {
        console.log(`    Jolpi offset=${offset}...`);
        const resp = await axios.get(`https://api.jolpi.ca/ergast/f1/${year}/results.json?limit=100&offset=${offset}`);
        const data = resp.data.MRData;
        const races = data.RaceTable.Races;
        if (races.length === 0) break;
        allRaces.push(...races);
        offset += 100;
        if (offset >= parseInt(data.total)) break;
        await sleep(500);
    }
    const unique = new Map<string, any>();
    for (const r of allRaces) {
        if (!unique.has(r.round)) unique.set(r.round, r);
    }
    return Array.from(unique.values());
}

async function main() {
    console.log('Waiting 30s for OpenF1 rate limit cooldown...');
    await sleep(30000);
    
    const conn = DbConnection.builder()
        .withUri(SPACETIME_URI)
        .withDatabaseName(DBNAME)
        .onConnect(async () => {
            console.log('Connected');
            conn.subscriptionBuilder()
                .onApplied(async () => {
                    console.log('Subscribed, seeding 2024...\n');
                    await seed2024(conn);
                })
                .subscribe(['SELECT * FROM race', 'SELECT * FROM race_result', 'SELECT * FROM driver']);
        })
        .onConnectError((_, err) => { console.error(err); process.exit(1); })
        .build();
}

async function seed2024(conn: any) {
    const year = 2024;

    // Step 1: Meetings
    console.log('[1] Fetching 2024 meetings...');
    const meetingsMap = new Map<number, any>();
    try {
        const resp = await axios.get(`${OPENF1}/meetings`, { params: { year } });
        for (const m of resp.data) meetingsMap.set(m.meeting_key, m);
        console.log(`    ✅ ${meetingsMap.size} meetings`);
    } catch (err: any) {
        console.error(`    ❌ ${err.message}`);
        if (err.response?.status === 429) {
            console.log('    Still rate limited. Waiting another 60s...');
            await sleep(60000);
            try {
                const resp = await axios.get(`${OPENF1}/meetings`, { params: { year } });
                for (const m of resp.data) meetingsMap.set(m.meeting_key, m);
                console.log(`    ✅ Retry: ${meetingsMap.size} meetings`);
            } catch (e: any) { console.error(`    ❌ ${e.message}`); process.exit(1); }
        }
    }
    await sleep(3000);

    // Step 2: Sessions
    console.log('\n[2] Fetching 2024 sessions...');
    let sessions: any[] = [];
    try {
        const resp = await axios.get(`${OPENF1}/sessions`, { params: { year } });
        sessions = resp.data;
        console.log(`    ${sessions.length} sessions found`);
        for (const s of sessions) {
            const meeting = meetingsMap.get(s.meeting_key);
            const meetingName = meeting?.meeting_name || `${s.country_name || 'Unknown'} Grand Prix`;
            const location = `${s.circuit_short_name || s.location || 'Unknown'}, ${s.country_name || ''}`.trim();
            conn.reducers.seedRace({
                raceKey: s.session_key, name: s.session_name || 'Race',
                meetingName, location, date: s.date_start,
                circuitKey: s.circuit_key, status: 'ended', year
            });
        }
        console.log(`    ✅ Seeded ${sessions.length} sessions`);
    } catch (err: any) {
        console.error(`    ❌ ${err.message}`);
        process.exit(1);
    }
    await sleep(3000);

    // Step 3: Podiums
    console.log('\n[3] Seeding 2024 podiums...');
    const raceSessions = sessions.filter((s: any) => s.session_name === 'Race');
    const lookup = new Map<string, number>();
    for (const s of raceSessions) {
        const meeting = meetingsMap.get(s.meeting_key);
        const meetingName = (meeting?.meeting_name || '').toLowerCase().trim();
        const location = (s.location || '').toLowerCase().trim();
        const circuit = (s.circuit_short_name || '').toLowerCase().trim();
        if (meetingName) lookup.set(meetingName, s.session_key);
        if (location) lookup.set(location, s.session_key);
        if (circuit) lookup.set(circuit, s.session_key);
    }
    console.log(`    Lookup: ${raceSessions.length} races, ${lookup.size} keys`);
    console.log(`    Keys:`, Array.from(lookup.keys()));

    const jolpiRaces = await fetchAllJolpiResults(year);
    console.log(`    Jolpi: ${jolpiRaces.length} races`);

    let matched = 0, unmatched = 0;
    for (const race of jolpiRaces) {
        const jolpiName = race.raceName.toLowerCase().trim();
        let raceKey = lookup.get(jolpiName);
        if (!raceKey) {
            const jolpiShort = jolpiName.replace(/grand prix/gi, '').trim();
            for (const [key, val] of lookup.entries()) {
                const keyShort = key.replace(/grand prix/gi, '').trim();
                if (keyShort === jolpiShort || key.includes(jolpiShort) || jolpiShort.includes(key)) {
                    raceKey = val;
                    break;
                }
            }
        }
        if (!raceKey && race.Circuit?.Location) {
            raceKey = lookup.get((race.Circuit.Location.locality || '').toLowerCase());
        }
        if (raceKey) {
            matched++;
            for (const res of race.Results.slice(0, 3)) {
                conn.reducers.seedRaceResult({
                    raceKey, position: parseInt(res.position),
                    driverNumber: parseInt(res.Driver.permanentNumber || '0'),
                    driverName: `${res.Driver.givenName} ${res.Driver.familyName}`,
                    team: res.Constructor.name,
                    timeStatus: res.Time?.time || res.status
                });
            }
        } else {
            unmatched++;
            console.log(`    ⚠️  No match: "${race.raceName}"`);
        }
    }
    console.log(`    ✅ Podiums: ${matched}/${jolpiRaces.length} matched`);

    await sleep(3000);
    const results = Array.from(conn.db.race_result.iter());
    const allRaces = Array.from(conn.db.race.iter());
    const r2024 = allRaces.filter((r: any) => r.seasonYear === 2024 && r.name === 'Race');
    console.log(`\n📊 Final: ${r2024.length} race sessions, ${results.length} total results`);
    process.exit(0);
}

main();
