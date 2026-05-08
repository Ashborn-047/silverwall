import axios from 'axios';
import { DbConnection } from './sdk';

const SPACETIME_URI = 'wss://maincloud.spacetimedb.com';
const DBNAME = 'spacetimedb-uorks';
const OPENF1_BASE_URL = 'https://api.openf1.org/v1';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    const conn = DbConnection.builder()
        .withUri(SPACETIME_URI)
        .withDatabaseName(DBNAME)
        .onConnect(async () => {
            console.log('Connected to SpacetimeDB');

            conn.subscriptionBuilder()
                .onApplied(async () => {
                    console.log('Subscription applied, waiting 5s for full data sync...');
                    await sleep(5000);
                    
                    // Now seed 2026 races (was rate limited before)
                    console.log('\n========== SEEDING 2026 RACES ==========');
                    try {
                        const resp = await axios.get(`${OPENF1_BASE_URL}/sessions`, { params: { year: 2026 } });
                        const sessions = resp.data;
                        console.log(`  Found ${sessions.length} sessions for 2026`);
                        for (const s of sessions) {
                            let status = 'upcoming';
                            const now = Date.now();
                            const start = new Date(s.date_start).getTime();
                            const end = s.date_end ? new Date(s.date_end).getTime() : start + (2 * 60 * 60 * 1000);
                            if (now > end) status = 'ended';
                            else if (now >= start && now <= end) status = 'live';

                            conn.reducers.seedRace({
                                raceKey: s.session_key,
                                name: s.session_name || 'Race',
                                meetingName: s.meeting_name || 'Grand Prix',
                                location: s.location || 'Unknown',
                                date: s.date_start,
                                circuitKey: s.circuit_key,
                                status,
                                year: 2026
                            });
                        }
                        console.log(`  ✅ Seeded ${sessions.length} sessions for 2026`);
                    } catch (err: any) {
                        console.error(`  ❌ Failed: ${err.message}`);
                    }

                    await sleep(3000);

                    // Seed 2026 drivers
                    console.log('\n========== SEEDING 2026 DRIVERS ==========');
                    try {
                        const resp = await axios.get(`${OPENF1_BASE_URL}/drivers`, { params: { year: 2026 } });
                        const drivers = resp.data;
                        const uniqueDrivers = new Map();
                        for (const d of drivers) uniqueDrivers.set(d.driver_number, d);
                        for (const d of uniqueDrivers.values()) {
                            conn.reducers.upsertDriver({
                                driverNumber: d.driver_number,
                                name: d.broadcast_name || d.full_name || d.last_name,
                                team: d.team_name,
                                color: d.team_colour ? `#${d.team_colour}` : '#00D2BE'
                            });
                        }
                        console.log(`  ✅ Seeded ${uniqueDrivers.size} drivers for 2026`);
                    } catch (err: any) {
                        console.error(`  ❌ Failed: ${err.message}`);
                    }

                    await sleep(3000);

                    // Seed drivers for 2024 and 2025 (also failed previously with 404)
                    for (const year of [2024, 2025]) {
                        console.log(`\n========== SEEDING ${year} DRIVERS ==========`);
                        try {
                            const resp = await axios.get(`${OPENF1_BASE_URL}/drivers`, { params: { year } });
                            const drivers = resp.data;
                            const uniqueDrivers = new Map();
                            for (const d of drivers) uniqueDrivers.set(d.driver_number, d);
                            for (const d of uniqueDrivers.values()) {
                                conn.reducers.upsertDriver({
                                    driverNumber: d.driver_number,
                                    name: d.broadcast_name || d.full_name || d.last_name,
                                    team: d.team_name,
                                    color: d.team_colour ? `#${d.team_colour}` : '#00D2BE'
                                });
                            }
                            console.log(`  ✅ Seeded ${uniqueDrivers.size} drivers for ${year}`);
                        } catch (err: any) {
                            console.error(`  ❌ Failed: ${err.message}`);
                        }
                        await sleep(3000);
                    }

                    // Now re-seed podiums with the data already in SpacetimeDB
                    for (const year of [2024, 2025]) {
                        console.log(`\n========== RE-SEEDING PODIUMS ${year} ==========`);
                        try {
                            const dbRaces = Array.from(conn.db.race.iter()).filter((r: any) => r.seasonYear === year && r.name === 'Race');
                            const lookup = new Map<string, number>();
                            for (const r of dbRaces as any[]) {
                                const key = r.meetingName.toLowerCase().trim();
                                lookup.set(key, r.raceKey);
                            }
                            console.log(`  Race lookup: ${lookup.size} "Race" sessions for ${year}`);
                            console.log(`  Sample keys:`, Array.from(lookup.keys()).slice(0, 5));

                            const resp = await axios.get(`https://api.jolpi.ca/ergast/f1/${year}/results.json?limit=1000`);
                            const races = resp.data.MRData.RaceTable.Races;

                            let matched = 0;
                            let unmatched = 0;

                            for (const race of races) {
                                const jolpiName = race.raceName.toLowerCase().trim();
                                let raceKey = lookup.get(jolpiName);

                                // Fuzzy match if exact match fails
                                if (!raceKey) {
                                    for (const [meetingKey, key] of lookup.entries()) {
                                        // Extract country/city part from both names
                                        const jolpiWords = jolpiName.replace('grand prix', '').trim().split(' ').filter((w: string) => w.length > 2);
                                        const meetingWords = meetingKey.replace('grand prix', '').trim().split(' ').filter((w: string) => w.length > 2);
                                        const overlap = jolpiWords.filter((w: string) => meetingWords.some((mw: string) => mw.includes(w) || w.includes(mw)));
                                        if (overlap.length >= 1) {
                                            raceKey = key;
                                            break;
                                        }
                                    }
                                }

                                if (raceKey) {
                                    matched++;
                                    const top3 = race.Results.slice(0, 3);
                                    for (const res of top3) {
                                        conn.reducers.seedRaceResult({
                                            raceKey,
                                            position: parseInt(res.position, 10),
                                            driverNumber: parseInt(res.Driver.permanentNumber || '0', 10),
                                            driverName: `${res.Driver.givenName} ${res.Driver.familyName}`,
                                            team: res.Constructor.name,
                                            timeStatus: res.Time?.time || res.status
                                        });
                                    }
                                } else {
                                    unmatched++;
                                    console.log(`  ⚠️  No match: "${race.raceName}" — Jolpi: "${jolpiName}"`);
                                }
                            }
                            console.log(`  ✅ Podiums: ${matched} matched, ${unmatched} unmatched`);
                        } catch (err: any) {
                            console.error(`  ❌ Failed: ${err.message}`);
                        }
                        await sleep(2000);
                    }

                    // Final verification
                    await sleep(3000);
                    const finalRaces = Array.from(conn.db.race.iter());
                    const finalResults = Array.from(conn.db.race_result.iter());
                    console.log(`\n📊 Final counts:`);
                    console.log(`  Total Races: ${finalRaces.length}`);
                    console.log(`  Total Race Results: ${finalResults.length}`);
                    for (const year of [2024, 2025, 2026]) {
                        const r = finalRaces.filter((r: any) => r.seasonYear === year && r.name === 'Race');
                        console.log(`  ${year}: ${r.length} race sessions`);
                    }

                    process.exit(0);
                })
                .subscribe([
                    'SELECT * FROM race',
                    'SELECT * FROM race_result',
                    'SELECT * FROM driver_standings',
                    'SELECT * FROM constructor_standings',
                    'SELECT * FROM driver'
                ]);
        })
        .onConnectError((ctx, err) => {
            console.error('Connection error:', err);
            process.exit(1);
        })
        .build();
}

main();
