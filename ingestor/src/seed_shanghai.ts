import axios from 'axios';
import { DbConnection } from './sdk';

const OPENF1_BASE_URL = 'https://api.openf1.org/v1';
const SPACETIME_URI = 'wss://maincloud.spacetimedb.com';
const DBNAME = 'spacetimedb-uorks';

async function seed() {
    const conn = DbConnection.builder().withUri(SPACETIME_URI).withDatabaseName(DBNAME).build();
    await new Promise(r => setTimeout(r, 2000));

    console.log("Fetching track locations for session 9673, circuit 49, driver 1...");
    try {
        const locResp = await axios.get(`${OPENF1_BASE_URL}/location?session_key=9673&driver_number=1`);
        const locations = locResp.data;
        if (locations && locations.length > 0) {
            console.log(`Success! Fetched ${locations.length} points.`);
            let order = 0;
            for (let i = 0; i < locations.length; i += 10) {
                const loc = locations[i];
                if (loc.x !== undefined && loc.y !== undefined) {
                    conn.reducers.seedTrack({ circuitKey: 49, x: loc.x, y: loc.y, order: order++ });
                }
            }
            console.log(`Done seeding ${order} points. Process closing in 2s.`);
            setTimeout(() => process.exit(0), 2000);
        } else {
            console.log("No locations returned.");
            process.exit(1);
        }
    } catch (e: any) {
        console.error("Error:", e.message);
        if (e.response?.status === 429) {
            console.error("RATE LIMITED! Wait 60s.");
        }
        process.exit(1);
    }
}
seed();
