import axios from 'axios';
import { DbConnection } from './sdk';

const OPENF1_BASE_URL = 'https://api.openf1.org/v1';
const SPACETIME_URI = 'wss://maincloud.spacetimedb.com';
const DBNAME = 'spacetimedb-uorks';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    const conn = DbConnection.builder()
        .withUri(SPACETIME_URI)
        .withDatabaseName(DBNAME)
        .onConnect(async () => {
            console.log('Connected to SpacetimeDB');
            conn.subscriptionBuilder()
                .onApplied(async () => {
                    console.log('Subscription applied, starting seed...');
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
        .onConnectError((ctx, err) => {
            console.error('Connection error:', err);
            process.exit(1);
        })
        .build();
}

async function seedAll(conn: any) {
    const years = [2024, 2025, 2026];

    for (const year of years) {
        console.log(`\n========== SEEDING ${year} ==========`);

        // 1. Fetch ALL sessions from OpenF1 and seed races with proper metadata
        const sessions = await fetchAndSeedRaces(conn, year);
        await sleep(3000);

        // 2. Seed drivers from OpenF1
        await seedDrivers(conn, year);
        await sleep(3000);

        // 3. Seed standings from Jolpi (2024, 2025 only)
        if (year <= 2025) {
            await seedStandings(conn, year);
            await sleep(3000);
        }

        // 4. Seed podiums using the sessions we fetched (match by country_name)
        if (year <= 2025 && sessions) {
            await seedPodiums(conn, year, sessions);
            await sleep(3000);
        }
    }

    // Final report
    await sleep(3000);
    const races = Array.from(conn.db.race.iter());
    const results = Array.from(conn.db.race_result.iter());
    console.log(`\n📊 FINAL COUNTS:`);
    console.log(`  Total Races: ${races.length}`);
    console.log(`  Total Race Results: ${results.length}`);
    for (const year of years) {
        const raceCount = races.filter((r: any) => r.seasonYear === year && r.name === 'Race').length;
        const resultCount = results.filter((r: any) => {
            const race = races.find((rc: any) => rc.raceKey === r.raceKey && rc.seasonYear === year);
            return !!race;
        }).length;
        console.log(`  ${year}: ${raceCount} race sessions, ${resultCount} podium results`);
    }
    process.exit(0);
}

async function fetchAndSeedRaces(conn: any, year: number): Promise<any[] | null> {
    console.log(`Seeding races for ${year}...`);
    try {
        const resp = await axios.get(`${OPENF1_BASE_URL}/sessions`, { params: { year } });
        const sessions = resp.data;
        console.log(`  Found ${sessions.length} sessions`);

        for (const s of sessions) {
            let status = 'upcoming';
            const now = Date.now();
            const start = new Date(s.date_start).getTime();
            const end = s.date_end ? new Date(s.date_end).getTime() : start + 7200000;
            if (now > end) status = 'ended';
            else if (now >= start && now <= end) status = 'live';

            // Build proper meeting name from OpenF1 fields
            // OpenF1 has: country_name, circuit_short_name, location — NOT meeting_name
            const meetingName = `${s.country_name || 'Unknown'} Grand Prix`;
            const location = `${s.circuit_short_name || s.location || 'Unknown'}, ${s.country_name || ''}`.trim();

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
        console.log(`  ✅ Seeded ${sessions.length} sessions for ${year}`);
        return sessions;
    } catch (err: any) {
        console.error(`  ❌ Failed: ${err.message}`);
        return null;
    }
}

async function seedDrivers(conn: any, year: number) {
    console.log(`Seeding drivers for ${year}...`);
    try {
        const resp = await axios.get(`${OPENF1_BASE_URL}/drivers`, { params: { year } });
        const drivers = resp.data;
        const unique = new Map();
        for (const d of drivers) unique.set(d.driver_number, d);
        for (const d of unique.values()) {
            conn.reducers.upsertDriver({
                driverNumber: d.driver_number,
                name: d.broadcast_name || d.full_name || d.last_name,
                team: d.team_name,
                color: d.team_colour ? `#${d.team_colour}` : '#00D2BE'
            });
        }
        console.log(`  ✅ Seeded ${unique.size} drivers`);
    } catch (err: any) {
        console.error(`  ❌ Failed: ${err.message}`);
    }
}

async function seedStandings(conn: any, year: number) {
    console.log(`Seeding standings for ${year}...`);
    try {
        const dr = await axios.get(`https://api.jolpi.ca/ergast/f1/${year}/driverStandings.json`);
        const ds = dr.data.MRData.StandingsTable.StandingsLists[0].DriverStandings;
        for (const d of ds) {
            conn.reducers.seedDriverStandings({
                seasonYear: year,
                position: parseInt(d.position),
                driverNumber: parseInt(d.Driver.permanentNumber || '0'),
                driverName: `${d.Driver.givenName} ${d.Driver.familyName}`,
                team: d.Constructors[0]?.name || 'Unknown',
                points: parseFloat(d.points),
                wins: parseInt(d.wins)
            });
        }
        console.log(`  ✅ ${ds.length} driver standings`);

        await sleep(1000);

        const cr = await axios.get(`https://api.jolpi.ca/ergast/f1/${year}/constructorStandings.json`);
        const cs = cr.data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;
        for (const c of cs) {
            conn.reducers.seedConstructorStandings({
                seasonYear: year,
                position: parseInt(c.position),
                team: c.Constructor.name,
                points: parseFloat(c.points),
                wins: parseInt(c.wins)
            });
        }
        console.log(`  ✅ ${cs.length} constructor standings`);
    } catch (err: any) {
        console.error(`  ❌ Failed: ${err.message}`);
    }
}

async function seedPodiums(conn: any, year: number, openF1Sessions: any[]) {
    console.log(`Seeding podiums for ${year}...`);
    try {
        // Build lookup: country_name (lowercase) -> session_key for "Race" sessions
        const raceSessions = openF1Sessions.filter(s => s.session_name === 'Race');
        const lookup = new Map<string, number>();

        for (const s of raceSessions) {
            const country = (s.country_name || '').toLowerCase().trim();
            const circuit = (s.circuit_short_name || '').toLowerCase().trim();
            const location = (s.location || '').toLowerCase().trim();

            // Store multiple keys for better matching
            if (country) lookup.set(country, s.session_key);
            if (circuit) lookup.set(circuit, s.session_key);
            if (location) lookup.set(location, s.session_key);
        }

        console.log(`  Race lookup: ${raceSessions.length} race sessions`);

        // Fetch results from Jolpi
        const resp = await axios.get(`https://api.jolpi.ca/ergast/f1/${year}/results.json?limit=1000`);
        const races = resp.data.MRData.RaceTable.Races;

        let matched = 0, unmatched = 0;

        for (const race of races) {
            const jolpiName = race.raceName.toLowerCase().trim();
            // Extract the country/location from the Jolpi race name (e.g., "Bahrain Grand Prix" -> "bahrain")
            const jolpiCountry = jolpiName.replace(/grand prix/gi, '').trim();

            let raceKey = lookup.get(jolpiCountry);

            // Fuzzy fallback: check if any lookup key contains the country word
            if (!raceKey) {
                for (const [key, val] of lookup.entries()) {
                    if (key.includes(jolpiCountry) || jolpiCountry.includes(key)) {
                        raceKey = val;
                        break;
                    }
                }
            }

            // Extra fuzzy: try matching by Circuit.Location from Jolpi
            if (!raceKey && race.Circuit?.Location?.country) {
                const circuitCountry = race.Circuit.Location.country.toLowerCase().trim();
                raceKey = lookup.get(circuitCountry);
                if (!raceKey) {
                    const circuitLocality = (race.Circuit.Location.locality || '').toLowerCase().trim();
                    raceKey = lookup.get(circuitLocality);
                }
            }

            if (raceKey) {
                matched++;
                const top3 = race.Results.slice(0, 3);
                for (const res of top3) {
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
                console.log(`  ⚠️  No match: "${race.raceName}" (country: "${jolpiCountry}")`);
            }
        }
        console.log(`  ✅ Podiums: ${matched} matched, ${unmatched} unmatched out of ${races.length}`);
    } catch (err: any) {
        console.error(`  ❌ Failed: ${err.message}`);
    }
}

main();
