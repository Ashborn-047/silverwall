import axios from 'axios';
import { DbConnection } from './sdk';

const OPENF1_BASE_URL = 'https://api.openf1.org/v1';
const SPACETIME_URI = 'wss://maincloud.spacetimedb.com';
const DBNAME = 'spacetimedb-uorks';

const conn = DbConnection.builder()
    .withUri(SPACETIME_URI)
    .withDatabaseName(DBNAME)
    .onConnect(() => {
        console.log('SeedScript connected to SpacetimeDB');
        runSeeding();
    })
    .onConnectError((ctx, err) => {
        console.error('SpacetimeDB Connection Error:', err);
    })
    .build();

async function syncStandings(year: number) {
    console.log(`Syncing Championship Standings for ${year}...`);
    try {
        const driverResp = await axios.get(`https://api.jolpi.ca/ergast/f1/${year}/driverStandings.json`);
        const driverStandings = driverResp.data.MRData.StandingsTable.StandingsLists[0].DriverStandings;

        for (const ds of driverStandings) {
            conn.reducers.seedDriverStandings({
                seasonYear: year,
                position: parseInt(ds.position, 10),
                driverNumber: parseInt(ds.Driver.permanentNumber || '0', 10),
                driverName: `${ds.Driver.givenName} ${ds.Driver.familyName}`,
                team: ds.Constructors[0]?.name || 'Unknown',
                points: parseFloat(ds.points),
                wins: parseInt(ds.wins, 10)
            });
        }

        const constResp = await axios.get(`https://api.jolpi.ca/ergast/f1/${year}/constructorStandings.json`);
        const constStandings = constResp.data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;

        for (const cs of constStandings) {
            conn.reducers.seedConstructorStandings({
                seasonYear: year,
                position: parseInt(cs.position, 10),
                team: cs.Constructor.name,
                points: parseFloat(cs.points),
                wins: parseInt(cs.wins, 10)
            });
        }

        console.log(`Seeded ${driverStandings.length} drivers and ${constStandings.length} constructors for ${year}`);
    } catch (err) {
        console.error(`Failed to sync standings for ${year}:`, err);
    }
}

async function runSeeding() {
    await new Promise(r => setTimeout(r, 2000)); // wait for connection to settle

    console.log("Seeding 2024 Standings...");
    await syncStandings(2024);
    await new Promise(r => setTimeout(r, 2000));

    console.log("Seeding 2025 Standings...");
    await syncStandings(2025);
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('Seeding complete. Exiting...');
    process.exit(0);
}
