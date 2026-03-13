import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { DbConnection } from './sdk';

const SPACETIME_URI = 'wss://maincloud.spacetimedb.com';
const DBNAME = 'spacetimedb-uorks';
const cacheDir = path.join(process.cwd(), 'cache');

async function sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms));
}

async function main() {
    const conn = DbConnection.builder()
        .withUri(SPACETIME_URI)
        .withDatabaseName(DBNAME)
        .onConnect(async () => {
            console.log('Connected to SpacetimeDB');
            conn.subscriptionBuilder()
                .onApplied(async () => {
                    console.log('Starting FAST SEED FROM CACHE...');
                    
                    // 1. Mock Geometry
                    const seedMockGeometry = (conn: DbConnection) => {
                        console.log('  Seeding high-fidelity geometry for Shanghai (49)...');
                        const shanghai: {x: number, y: number}[] = [];
                        const addSegment = (p1: any, p2: any, steps: number) => {
                            for(let i=0; i<steps; i++) shanghai.push({ x: p1.x + (i/steps)*(p2.x-p1.x), y: p1.y + (i/steps)*(p2.y-p1.y) });
                        };
                        const addArc = (cx: number, cy: number, r: number, start: number, end: number, steps: number) => {
                            for(let i=0; i<steps; i++) {
                                const a = start + (i/steps) * (end - start);
                                shanghai.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
                            }
                        };

                        // Shanghai (上)
                        // 1. Snail T1-4
                        addArc(0.3, 0.4, 0.25, 0, Math.PI * 2.5, 40);
                        // 2. T5-6
                        addSegment({x:0.3, y:0.65}, {x:0.5, y:0.8}, 10);
                        // 3. T7-10
                        addSegment({x:0.5, y:0.8}, {x:0.75, y:0.7}, 10);
                        // 4. Back Straight T14
                        addSegment({x:0.75, y:0.7}, {x:0.75, y:0.1}, 20);
                        // 5. Hairpin T14-15
                        addArc(0.65, 0.1, 0.1, 0, Math.PI, 10);
                        // 6. Return
                        addSegment({x:0.55, y:0.1}, {x:0.3, y:0.4}, 10);
                        
                        shanghai.forEach((p, i) => conn.reducers.seedTrack({ circuitKey: 49, order: i, x: p.x, y: p.y }));
                    
                        console.log('  Seeding high-fidelity geometry for Bahrain (63)...');
                        const bahrain: {x: number, y: number}[] = [];
                        const addBahrain = (p1: any, p2: any, steps: number) => {
                            for(let i=0; i<steps; i++) bahrain.push({ x: p1.x + (i/steps)*(p2.x-p1.x), y: p1.y + (i/steps)*(p2.y-p1.y) });
                        };
                        // Simplified Arrowhead
                        addBahrain({x:0.5, y:0.1}, {x:0.8, y:0.4}, 15);
                        addBahrain({x:0.8, y:0.4}, {x:0.5, y:0.9}, 20);
                        addBahrain({x:0.5, y:0.9}, {x:0.2, y:0.4}, 20);
                        addBahrain({x:0.2, y:0.4}, {x:0.5, y:0.1}, 15);
                        bahrain.forEach((p, i) => conn.reducers.seedTrack({ circuitKey: 63, order: i, x: p.x, y: p.y }));
                    };
                    seedMockGeometry(conn);
                    
                    // 2. Clear then Seed each year
                    for (const year of [2024, 2025, 2026]) {
                        await seedYearFromCache(conn, year);
                        await sleep(3000); // 🏁 Give time for reducers to flush
                    }
                    
                    console.log('\n✅ FINAL SEED COMPLETE!');
                    await sleep(5000); // FINAL FLUSH
                    process.exit(0);
                })
                .subscribe(['SELECT * FROM race']);
        })
        .build();
}

async function seedMockGeometry(conn: any, circuitKey: number) {
    console.log(`  Seeding mock geometry for circuit ${circuitKey}...`);
    const points = [{x:0,y:100},{x:70,y:70},{x:100,y:0},{x:70,y:-70},{x:0,y:-100},{x:-70,y:-70},{x:-100,y:0},{x:-70,y:70}];
    for(let i=0; i<points.length; i++) {
        conn.reducers.seedTrack({ circuitKey, order: i, x: points[i].x, y: points[i].y });
    }
}

async function seedYearFromCache(conn: any, year: number) {
    console.log(`\n--- Seeding ${year} ---`);
    const meetings = JSON.parse(fs.readFileSync(path.join(cacheDir, `meetings_${year}.json`), 'utf8'));
    const sessions = JSON.parse(fs.readFileSync(path.join(cacheDir, `sessions_${year}.json`), 'utf8'))
        .filter((s: any) => s.session_name === 'Race' || s.session_name === 'Sprint');
    
    const meetingsMap = new Map();
    for(const m of meetings) meetingsMap.set(m.meeting_key, m);

    let jolpiRaces: any[] = [];
    let jolpiSprints: any[] = [];
    if (year <= 2025) {
        jolpiRaces = await fetchJolpi(`https://api.jolpi.ca/ergast/f1/${year}/results.json`);
        jolpiSprints = await fetchJolpi(`https://api.jolpi.ca/ergast/f1/${year}/sprint.json`);
        await seedStandings(conn, year);
    }

    for (const s of sessions) {
        const meeting = meetingsMap.get(s.meeting_key);
        if (!meeting) continue;

        conn.reducers.seedRace({
            raceKey: s.session_key,
            name: s.session_name,
            meetingName: meeting.meeting_name,
            location: `${meeting.location}, ${meeting.country_name}`,
            date: s.date_start,
            circuitKey: s.circuit_key,
            status: year <= 2025 ? 'ended' : 'upcoming',
            year
        });

        const sDate = new Date(s.date_start).getTime();
        const resultsSource = s.session_name === 'Race' ? jolpiRaces : jolpiSprints;
        const match = resultsSource.find(r => Math.abs(new Date(r.date).getTime() - sDate) < 4 * 24 * 3600 * 1000);
        
        if (match) {
            const podium = s.session_name === 'Race' ? match.Results : match.SprintResults;
            if (podium) {
                podium.slice(0, 3).forEach((res: any) => {
                    conn.reducers.seedRaceResult({
                        raceKey: s.session_key,
                        position: parseInt(res.position),
                        driverNumber: parseInt(res.Driver.permanentNumber || '0'),
                        driverName: `${res.Driver.givenName} ${res.Driver.familyName}`,
                        team: res.Constructor.name,
                        timeStatus: res.Time?.time || res.status
                    });
                });
            }
        }
    }
    console.log(`  ✅ ${year} done.`);
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

async function fetchJolpi(url: string) {
    try {
        const r = await axios.get(url + '?limit=100');
        const items = r.data.MRData.RaceTable.Races;
        if (parseInt(r.data.MRData.total) > 100) {
            await sleep(500);
            const r2 = await axios.get(url + '?limit=100&offset=100');
            items.push(...r2.data.MRData.RaceTable.Races);
        }
        return items;
    } catch (e) { return []; }
}

main();
