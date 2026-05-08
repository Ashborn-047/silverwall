import axios from 'axios';
import { DbConnection } from './sdk';

const OPENF1_BASE_URL = 'https://api.openf1.org/v1';
const SPACETIME_URI = 'wss://maincloud.spacetimedb.com';
const DBNAME = 'spacetimedb-uorks';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch ALL results from Jolpi by paginating (API max per page is ~100)
async function fetchAllJolpiResults(year: number): Promise<any[]> {
    const allRaces: any[] = [];
    let offset = 0;
    const pageSize = 100;
    
    while (true) {
        const url = `https://api.jolpi.ca/ergast/f1/${year}/results.json?limit=${pageSize}&offset=${offset}`;
        console.log(`    Fetching Jolpi page offset=${offset}...`);
        const resp = await axios.get(url);
        const data = resp.data.MRData;
        const races = data.RaceTable.Races;
        
        if (races.length === 0) break;
        
        allRaces.push(...races);
        
        const total = parseInt(data.total);
        offset += pageSize;
        
        // Check if we have all results (each race has ~20 results, so 24 races = ~480 results)
        if (offset >= total) break;
        
        await sleep(500); // Rate limit courtesy   
    }
    
    // De-duplicate races (they may appear across pages)
    const uniqueRaces = new Map<string, any>();
    for (const race of allRaces) {
        const key = `${race.season}-${race.round}`;
        if (!uniqueRaces.has(key)) {
            uniqueRaces.set(key, race);
        } else {
            // Merge results
            const existing = uniqueRaces.get(key)!;
            const existingPositions = new Set(existing.Results.map((r: any) => r.position));
            for (const res of race.Results) {
                if (!existingPositions.has(res.position)) {
                    existing.Results.push(res);
                }
            }
        }
    }
    
    return Array.from(uniqueRaces.values());
}

async function main() {
    const conn = DbConnection.builder()
        .withUri(SPACETIME_URI)
        .withDatabaseName(DBNAME)
        .onConnect(async () => {
            console.log('Connected to SpacetimeDB');
            conn.subscriptionBuilder()
                .onApplied(async () => {
                    console.log('Subscription applied...');
                    await seedPodiums(conn);
                })
                .subscribe([
                    'SELECT * FROM race',
                    'SELECT * FROM race_result',
                    'SELECT * FROM driver'
                ]);
        })
        .onConnectError((ctx, err) => {
            console.error('Connection error:', err);
            process.exit(1);
        })
        .build();
}

async function seedPodiums(conn: any) {
    for (const year of [2024, 2025]) {
        console.log(`\n========== PODIUMS ${year} ==========`);
        
        // Build OpenF1 -> Jolpi matching lookup
        const dbRaces = Array.from(conn.db.race.iter()).filter((r: any) => r.seasonYear === year && r.name === 'Race');
        console.log(`  Found ${dbRaces.length} Race sessions in SpacetimeDB for ${year}`);
        
        const lookup = new Map<string, number>();
        for (const r of dbRaces as any[]) {
            // meetingName format: "Bahrain Grand Prix" -> extract country: "bahrain"
            const country = r.meetingName.replace(/Grand Prix/gi, '').trim().toLowerCase();
            // location format: "Sakhir, Bahrain" 
            const locParts = r.location.split(',').map((p: string) => p.trim().toLowerCase());
            
            if (country) lookup.set(country, r.raceKey);
            for (const p of locParts) {
                if (p) lookup.set(p, r.raceKey);
            }
        }
        console.log(`  Lookup keys: ${lookup.size}`);
        
        // Fetch all race results from Jolpi with pagination
        const jolpiRaces = await fetchAllJolpiResults(year);
        console.log(`  Jolpi returned ${jolpiRaces.length} races for ${year}`);
        
        let matched = 0, unmatched = 0;
        
        for (const race of jolpiRaces) {
            const jolpiCountry = race.raceName.replace(/Grand Prix/gi, '').trim().toLowerCase();
            let raceKey = lookup.get(jolpiCountry);
            
            // Fuzzy match by Circuit.Location
            if (!raceKey && race.Circuit?.Location) {
                const locality = (race.Circuit.Location.locality || '').toLowerCase();
                const country = (race.Circuit.Location.country || '').toLowerCase();
                raceKey = lookup.get(locality) || lookup.get(country);
            }
            
            // Even fuzzier: substring match
            if (!raceKey) {
                for (const [key, val] of lookup.entries()) {
                    if (key.includes(jolpiCountry) || jolpiCountry.includes(key)) {
                        raceKey = val;
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
                        position: parseInt(res.position),
                        driverNumber: parseInt(res.Driver.permanentNumber || '0'),
                        driverName: `${res.Driver.givenName} ${res.Driver.familyName}`,
                        team: res.Constructor.name,
                        timeStatus: res.Time?.time || res.status
                    });
                }
            } else {
                unmatched++;
                console.log(`  ⚠️  No match: "${race.raceName}"`);
            }
        }
        console.log(`  ✅ Podiums: ${matched}/${jolpiRaces.length} matched`);
    }
    
    await sleep(3000);
    const results = Array.from(conn.db.race_result.iter());
    console.log(`\n📊 Total race results in DB: ${results.length}`);
    process.exit(0);
}

main();
