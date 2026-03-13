import axios from 'axios';
import { DbConnection } from './sdk';

const OPENF1_BASE_URL = 'https://api.openf1.org/v1';
const SPACETIME_URI = 'wss://maincloud.spacetimedb.com';
const DBNAME = 'spacetimedb-uorks';

const conn = DbConnection.builder()
    .withUri(SPACETIME_URI)
    .withDatabaseName(DBNAME)
    .onConnect(() => {
        console.log('Race SeedScript connected to SpacetimeDB');
        runSeeding();
    })
    .onConnectError((ctx, err) => {
        console.error('SpacetimeDB Connection Error:', err);
    })
    .build();

async function syncYearRaces(year: number) {
    console.log(`Syncing races for ${year}...`);
    try {
        const resp = await axios.get(`${OPENF1_BASE_URL}/sessions`, {
            params: { year: year }
        });
        const sessions = resp.data;
        for (const s of sessions) {
            let status = 'upcoming';
            const now = new Date().getTime();
            const start = new Date(s.date_start).getTime();
            const end = s.date_end ? new Date(s.date_end).getTime() : start + (2 * 60 * 60 * 1000);

            if (now > end) {
                status = 'ended';
            } else if (now >= start && now <= end) {
                status = 'live';
            }

            conn.reducers.seedRace({
                raceKey: s.session_key,
                name: s.session_name || s.meeting_name || 'Race',
                date: s.date_start,
                circuitKey: s.circuit_key,
                status: status,
                year: year
            });
        }
        console.log(`Successfully synced ${sessions.length} races for ${year}`);
    } catch (err) {
        console.error(`Failed to sync races for ${year}:`, err);
    }
}

async function runSeeding() {
    await new Promise(r => setTimeout(r, 2000));

    console.log("Seeding 2024 Races...");
    await syncYearRaces(2024);
    await new Promise(r => setTimeout(r, 2000));

    console.log("Seeding 2025 Races...");
    await syncYearRaces(2025);
    await new Promise(r => setTimeout(r, 2000));

    console.log("Seeding 2026 Races...");
    await syncYearRaces(2026);
    await new Promise(r => setTimeout(r, 2000));

    console.log('Seeding complete. Exiting...');
    process.exit(0);
}
