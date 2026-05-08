import axios from 'axios';
import { DbConnection } from './sdk';

const OPENF1 = 'https://api.openf1.org/v1';
const SPACETIME_URI = 'wss://maincloud.spacetimedb.com';
const DBNAME = 'spacetimedb-uorks';
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ========== JOLPI HELPERS ==========

async function fetchJolpiPaginated(url: string): Promise<any[]> {
    const allRaces: any[] = [];
    let offset = 0;
    while (true) {
        const resp = await axios.get(`${url}?limit=100&offset=${offset}`);
        const data = resp.data.MRData;
        const races = data.RaceTable.Races;
        if (races.length === 0) break;
        allRaces.push(...races);
        offset += 100;
        if (offset >= parseInt(data.total)) break;
        await sleep(500);
    }
    // Deduplicate by round
    const unique = new Map<string, any>();
    for (const r of allRaces) {
        if (!unique.has(r.round)) unique.set(r.round, r);
    }
    return Array.from(unique.values());
}

// ========== MAIN ==========

async function main() {
    const conn = DbConnection.builder()
        .withUri(SPACETIME_URI)
        .withDatabaseName(DBNAME)
        .onConnect(async () => {
            console.log('Connected to SpacetimeDB');
            conn.subscriptionBuilder()
                .onApplied(async () => {
                    console.log('Subscribed, starting full seed...\n');
                    await seedAll(conn);
                })
                .subscribe([
                    'SELECT * FROM race',
                    'SELECT * FROM race_result',
                    'SELECT * FROM driver_standings',
                    'SELECT * FROM constructor_standings',
                    'SELECT * FROM driver'
                ]);
        })
        .onConnectError((_, err) => { console.error(err); process.exit(1); })
        .build();
}

async function seedAll(conn: any) {
    for (const year of [2024, 2025, 2026]) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`  SEEDING ${year} — COMPLETE WITH SPRINT RESULTS`);
        console.log(`${'='.repeat(60)}`);

        // ===== STEP 1: Meetings (for proper names + locations) =====
        const meetingsMap = new Map<number, any>();
        console.log(`\n[1] Fetching meetings for ${year}...`);
        try {
            const resp = await axios.get(`${OPENF1}/meetings`, { params: { year } });
            for (const m of resp.data) meetingsMap.set(m.meeting_key, m);
            console.log(`    ✅ ${meetingsMap.size} meetings`);
        } catch (err: any) {
            console.error(`    ❌ ${err.message}`);
            if (err.response?.status === 429) {
                console.log('    Rate limited, waiting 90s...');
                await sleep(90000);
                try {
                    const resp = await axios.get(`${OPENF1}/meetings`, { params: { year } });
                    for (const m of resp.data) meetingsMap.set(m.meeting_key, m);
                    console.log(`    ✅ Retry: ${meetingsMap.size} meetings`);
                } catch (e: any) {
                    console.error(`    ❌ Retry failed: ${e.message}. Skipping ${year}.`);
                    continue;
                }
            }
        }
        await sleep(3000);

        // ===== STEP 2: Sessions (seed with PROPER location from meetings) =====
        let sessions: any[] = [];
        console.log(`\n[2] Fetching sessions for ${year}...`);
        try {
            const resp = await axios.get(`${OPENF1}/sessions`, { params: { year } });
            sessions = resp.data;
            console.log(`    Found ${sessions.length} sessions`);

            for (const s of sessions) {
                const meeting = meetingsMap.get(s.meeting_key);
                // Use the MEETING's proper name and location
                const meetingName = meeting?.meeting_name || `${s.country_name || 'Unknown'} Grand Prix`;
                // Use meeting.location + country_name for clean location
                // e.g. "Sakhir, Bahrain", "Monte Carlo, Monaco", "Miami, United States"
                const location = meeting
                    ? `${meeting.location}, ${meeting.country_name}`
                    : `${s.circuit_short_name || s.location || 'Unknown'}, ${s.country_name || ''}`.trim();

                conn.reducers.seedRace({
                    raceKey: s.session_key,
                    name: s.session_name || 'Race',
                    meetingName,
                    location,
                    date: s.date_start,
                    circuitKey: s.circuit_key,
                    status: year <= 2025 ? 'ended' : 'upcoming',
                    year
                });
            }
            console.log(`    ✅ Seeded ${sessions.length} sessions`);
        } catch (err: any) {
            console.error(`    ❌ ${err.message}`);
            if (err.response?.status === 429) {
                console.log('    Waiting 90s for rate limit...');
                await sleep(90000);
                try {
                    const resp = await axios.get(`${OPENF1}/sessions`, { params: { year } });
                    sessions = resp.data;
                    for (const s of sessions) {
                        const meeting = meetingsMap.get(s.meeting_key);
                        const meetingName = meeting?.meeting_name || `${s.country_name || 'Unknown'} Grand Prix`;
                        const location = meeting
                            ? `${meeting.location}, ${meeting.country_name}`
                            : `${s.circuit_short_name || '?'}, ${s.country_name || ''}`.trim();
                        conn.reducers.seedRace({
                            raceKey: s.session_key, name: s.session_name || 'Race',
                            meetingName, location, date: s.date_start,
                            circuitKey: s.circuit_key, status: 'ended', year
                        });
                    }
                    console.log(`    ✅ Retry seeded ${sessions.length}`);
                } catch (e: any) {
                    console.error(`    ❌ Retry failed. Skipping ${year} sessions.`);
                }
            }
        }
        await sleep(3000);

        // ===== STEP 3: Standings =====
        if (year <= 2025) {
            console.log(`\n[3] Fetching standings for ${year}...`);
            try {
                const dr = await axios.get(`https://api.jolpi.ca/ergast/f1/${year}/driverStandings.json`);
                const ds = dr.data.MRData.StandingsTable.StandingsLists[0].DriverStandings;
                for (const d of ds) {
                    conn.reducers.seedDriverStandings({
                        seasonYear: year, position: parseInt(d.position),
                        driverNumber: parseInt(d.Driver.permanentNumber || '0'),
                        driverName: `${d.Driver.givenName} ${d.Driver.familyName}`,
                        team: d.Constructors[0]?.name || 'Unknown',
                        points: parseFloat(d.points), wins: parseInt(d.wins)
                    });
                }
                console.log(`    ✅ ${ds.length} driver standings`);
                await sleep(1000);
                const cr = await axios.get(`https://api.jolpi.ca/ergast/f1/${year}/constructorStandings.json`);
                const cs = cr.data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;
                for (const c of cs) {
                    conn.reducers.seedConstructorStandings({
                        seasonYear: year, position: parseInt(c.position),
                        team: c.Constructor.name, points: parseFloat(c.points), wins: parseInt(c.wins)
                    });
                }
                console.log(`    ✅ ${cs.length} constructor standings`);
            } catch (err: any) {
                console.error(`    ❌ ${err.message}`);
            }
            await sleep(2000);
        }

        // ===== STEP 4: RACE Podiums =====
        if (year <= 2025 && sessions.length > 0) {
            console.log(`\n[4] Seeding RACE podiums for ${year}...`);
            
            // Build lookup: meeting_name -> session_key for RACE sessions only
            const raceSessions = sessions.filter((s: any) => s.session_name === 'Race');
            const raceLookup = new Map<string, number>();
            for (const s of raceSessions) {
                const meeting = meetingsMap.get(s.meeting_key);
                const mName = (meeting?.meeting_name || '').toLowerCase().trim();
                const loc = (meeting?.location || s.location || '').toLowerCase().trim();
                const circuit = (s.circuit_short_name || '').toLowerCase().trim();
                if (mName) raceLookup.set(mName, s.session_key);
                if (loc) raceLookup.set(loc, s.session_key);
                if (circuit) raceLookup.set(circuit, s.session_key);
            }

            const jolpiRaces = await fetchJolpiPaginated(`https://api.jolpi.ca/ergast/f1/${year}/results.json`);
            console.log(`    Jolpi: ${jolpiRaces.length} races`);

            let matched = 0;
            for (const race of jolpiRaces) {
                const raceKey = matchRace(race, raceLookup);
                if (raceKey) {
                    matched++;
                    seedPodium(conn, raceKey, race.Results);
                } else {
                    console.log(`    ⚠️ No Race match: "${race.raceName}"`);
                }
            }
            console.log(`    ✅ Race podiums: ${matched}/${jolpiRaces.length}`);
            await sleep(2000);

            // ===== STEP 5: SPRINT Podiums =====
            console.log(`\n[5] Seeding SPRINT podiums for ${year}...`);
            
            const sprintSessions = sessions.filter((s: any) => s.session_name === 'Sprint');
            const sprintLookup = new Map<string, number>();
            for (const s of sprintSessions) {
                const meeting = meetingsMap.get(s.meeting_key);
                const mName = (meeting?.meeting_name || '').toLowerCase().trim();
                const loc = (meeting?.location || s.location || '').toLowerCase().trim();
                const circuit = (s.circuit_short_name || '').toLowerCase().trim();
                if (mName) sprintLookup.set(mName, s.session_key);
                if (loc) sprintLookup.set(loc, s.session_key);
                if (circuit) sprintLookup.set(circuit, s.session_key);
            }
            console.log(`    Sprint sessions: ${sprintSessions.length}, lookup keys: ${sprintLookup.size}`);

            try {
                const jolpiSprints = await fetchJolpiPaginated(`https://api.jolpi.ca/ergast/f1/${year}/sprint.json`);
                console.log(`    Jolpi Sprint: ${jolpiSprints.length} sprints`);

                let sprintMatched = 0;
                for (const race of jolpiSprints) {
                    const raceKey = matchRace(race, sprintLookup);
                    if (raceKey) {
                        sprintMatched++;
                        // Sprint results are in SprintResults
                        seedPodium(conn, raceKey, race.SprintResults);
                    } else {
                        console.log(`    ⚠️ No Sprint match: "${race.raceName}"`);
                    }
                }
                console.log(`    ✅ Sprint podiums: ${sprintMatched}/${jolpiSprints.length}`);
            } catch (err: any) {
                console.error(`    ❌ Sprint: ${err.message}`);
            }
            await sleep(2000);
        }
    }

    // ===== FINAL REPORT =====
    await sleep(5000);
    const allRaces = Array.from(conn.db.race.iter());
    const allResults = Array.from(conn.db.race_result.iter());
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  FINAL REPORT`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Total sessions: ${allRaces.length}`);
    console.log(`Total race results: ${allResults.length}`);
    for (const year of [2024, 2025, 2026]) {
        const races = allRaces.filter((r: any) => r.seasonYear === year && r.name === 'Race');
        const sprints = allRaces.filter((r: any) => r.seasonYear === year && r.name === 'Sprint');
        const raceKeys = new Set(races.map((r: any) => r.raceKey));
        const sprintKeys = new Set(sprints.map((r: any) => r.raceKey));
        const raceResults = allResults.filter((r: any) => raceKeys.has(r.raceKey));
        const sprintResults = allResults.filter((r: any) => sprintKeys.has(r.raceKey));
        console.log(`  ${year}: ${races.length} races (${raceResults.length} results), ${sprints.length} sprints (${sprintResults.length} results)`);
    }
    process.exit(0);
}

// ========== MATCHING ==========
function matchRace(jolpiRace: any, lookup: Map<string, number>): number | undefined {
    const jolpiName = jolpiRace.raceName.toLowerCase().trim();
    
    // Exact match
    let key = lookup.get(jolpiName);
    if (key) return key;

    // Fuzzy: strip "grand prix" and match
    const jolpiShort = jolpiName.replace(/grand prix/gi, '').trim();
    for (const [k, v] of lookup.entries()) {
        const kShort = k.replace(/grand prix/gi, '').trim();
        if (kShort === jolpiShort || k.includes(jolpiShort) || jolpiShort.includes(k)) return v;
    }

    // Circuit locality fallback
    if (jolpiRace.Circuit?.Location) {
        const locality = (jolpiRace.Circuit.Location.locality || '').toLowerCase();
        key = lookup.get(locality);
        if (key) return key;
    }

    return undefined;
}

// ========== SEED PODIUM ==========
function seedPodium(conn: any, raceKey: number, results: any[]) {
    if (!results || results.length === 0) return;
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

main();
