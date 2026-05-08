import axios from 'axios';
import { DbConnection } from './sdk';

const OPENF1 = 'https://api.openf1.org/v1';
const SPACETIME_URI = 'wss://maincloud.spacetimedb.com';
const DBNAME = 'spacetimedb-uorks';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Fetch all Jolpi results with pagination (API caps at 100 per page)
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
    // Deduplicate by round
    const unique = new Map<string, any>();
    for (const r of allRaces) {
        const key = r.round;
        if (!unique.has(key)) unique.set(key, r);
        else {
            // merge results
            const existing = unique.get(key)!;
            const positions = new Set(existing.Results.map((x: any) => x.position));
            for (const res of r.Results) {
                if (!positions.has(res.position)) existing.Results.push(res);
            }
        }
    }
    return Array.from(unique.values());
}

async function main() {
    const conn = DbConnection.builder()
        .withUri(SPACETIME_URI)
        .withDatabaseName(DBNAME)
        .onConnect(async () => {
            console.log('Connected to SpacetimeDB');
            conn.subscriptionBuilder()
                .onApplied(async () => {
                    console.log('Subscription applied, starting complete seed...\n');
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
        .onConnectError((_, err) => { console.error('Connection error:', err); process.exit(1); })
        .build();
}

async function seedAll(conn: any) {
    for (const year of [2024, 2025, 2026]) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`  SEEDING ${year}`);
        console.log(`${'='.repeat(50)}`);

        // Step 1: Fetch meetings (has proper race names!)
        let meetingsMap = new Map<number, any>();
        try {
            console.log(`\n[1] Fetching meetings for ${year}...`);
            const resp = await axios.get(`${OPENF1}/meetings`, { params: { year } });
            for (const m of resp.data) {
                meetingsMap.set(m.meeting_key, m);
            }
            console.log(`    ✅ ${meetingsMap.size} meetings`);
        } catch (err: any) {
            console.error(`    ❌ Meetings: ${err.message}`);
        }
        await sleep(2000);

        // Step 2: Fetch sessions and seed races using meeting names
        let sessions: any[] = [];
        try {
            console.log(`\n[2] Fetching sessions for ${year}...`);
            const resp = await axios.get(`${OPENF1}/sessions`, { params: { year } });
            sessions = resp.data;
            console.log(`    Found ${sessions.length} sessions`);

            for (const s of sessions) {
                const meeting = meetingsMap.get(s.meeting_key);
                // Use PROPER meeting_name from meetings endpoint
                const meetingName = meeting?.meeting_name || `${s.country_name || 'Unknown'} Grand Prix`;
                const location = `${s.circuit_short_name || s.location || 'Unknown'}, ${s.country_name || ''}`.trim();

                let status = 'upcoming';
                const now = Date.now();
                const start = new Date(s.date_start).getTime();
                const end = s.date_end ? new Date(s.date_end).getTime() : start + 7200000;
                if (now > end) status = 'ended';
                else if (now >= start && now <= end) status = 'live';

                conn.reducers.seedRace({
                    raceKey: s.session_key,
                    name: s.session_name || 'Race',
                    meetingName,
                    location,
                    date: s.date_start,
                    circuitKey: s.circuit_key,
                    status,
                    year
                });
            }
            console.log(`    ✅ Seeded ${sessions.length} sessions with proper meeting names`);
        } catch (err: any) {
            console.error(`    ❌ Sessions: ${err.message}`);
            if (err.response?.status === 429) {
                console.log('    Rate limited, waiting 60s...');
                await sleep(60000);
                try {
                    const resp = await axios.get(`${OPENF1}/sessions`, { params: { year } });
                    sessions = resp.data;
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
                    console.log(`    ✅ Retry seeded ${sessions.length}`);
                } catch (e2: any) { console.error(`    ❌ Retry failed: ${e2.message}`); }
            }
        }
        await sleep(3000);

        // Step 3: Seed standings (2024, 2025 only)
        if (year <= 2025) {
            try {
                console.log(`\n[3] Fetching standings for ${year}...`);
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
                console.error(`    ❌ Standings: ${err.message}`);
            }
            await sleep(2000);
        }

        // Step 4: Seed podiums using MEETING NAME matching (2024, 2025 only)
        if (year <= 2025 && sessions.length > 0) {
            console.log(`\n[4] Seeding podiums for ${year}...`);
            try {
                // Build lookup: meeting_name (lowercase) -> session_key for "Race" sessions
                const raceSessions = sessions.filter((s: any) => s.session_name === 'Race');
                const lookup = new Map<string, number>();

                for (const s of raceSessions) {
                    const meeting = meetingsMap.get(s.meeting_key);
                    const meetingName = (meeting?.meeting_name || '').toLowerCase().trim();
                    const location = (s.location || '').toLowerCase().trim();
                    const circuit = (s.circuit_short_name || '').toLowerCase().trim();
                    const country = (s.country_name || '').toLowerCase().trim();

                    // Primary key: exact meeting name (e.g., "miami grand prix")
                    if (meetingName) lookup.set(meetingName, s.session_key);
                    // Secondary keys for fallback
                    if (location) lookup.set(location, s.session_key);
                    if (circuit) lookup.set(circuit, s.session_key);
                    // Don't use country as key — causes collisions for multi-race countries!
                }
                console.log(`    Race lookup: ${raceSessions.length} sessions, ${lookup.size} keys`);
                console.log(`    Sample keys:`, Array.from(lookup.keys()).slice(0, 8));

                // Fetch ALL results from Jolpi with pagination
                const jolpiRaces = await fetchAllJolpiResults(year);
                console.log(`    Jolpi: ${jolpiRaces.length} races`);

                let matched = 0, unmatched = 0;
                for (const race of jolpiRaces) {
                    const jolpiName = race.raceName.toLowerCase().trim();
                    let raceKey = lookup.get(jolpiName);

                    // Fuzzy match by removing "grand prix" and trying substrings
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

                    // Circuit locality fallback
                    if (!raceKey && race.Circuit?.Location) {
                        const locality = (race.Circuit.Location.locality || '').toLowerCase();
                        raceKey = lookup.get(locality);
                    }

                    if (raceKey) {
                        matched++;
                        for (const res of race.Results.slice(0, 3)) {
                            conn.reducers.seedRaceResult({
                                raceKey,
                                position: parseInt(res.position),
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
                console.log(`    ✅ Podiums: ${matched}/${jolpiRaces.length} matched, ${unmatched} unmatched`);
            } catch (err: any) {
                console.error(`    ❌ Podiums: ${err.message}`);
            }
            await sleep(2000);
        }
    }

    // Final report
    await sleep(3000);
    const races = Array.from(conn.db.race.iter());
    const results = Array.from(conn.db.race_result.iter());
    console.log(`\n${'='.repeat(50)}`);
    console.log(`  FINAL REPORT`);
    console.log(`${'='.repeat(50)}`);
    console.log(`Total Races: ${races.length}`);
    console.log(`Total Race Results: ${results.length}`);
    for (const year of [2024, 2025, 2026]) {
        const raceOnly = races.filter((r: any) => r.seasonYear === year && r.name === 'Race');
        const yearResults = results.filter((r: any) => raceOnly.some((rc: any) => rc.raceKey === r.raceKey));
        console.log(`  ${year}: ${raceOnly.length} race sessions, ${yearResults.length} podium entries`);
    }
    process.exit(0);
}

main();
