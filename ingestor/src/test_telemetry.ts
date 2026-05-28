import axios from 'axios';
import { DbConnection } from './sdk';

const OPENF1_BASE_URL = 'https://api.openf1.org/v1';
const SPACETIME_URI = 'wss://maincloud.spacetimedb.com';
const DBNAME = 'spacetimedb-uorks';
const TEST_SESSION_KEY = 9673; // Shanghai 2026 GP / Session

const conn = DbConnection.builder()
    .withUri(SPACETIME_URI)
    .withDatabaseName(DBNAME)
    .onConnect(() => {
        console.log('Connected to SpacetimeDB');
        conn.subscriptionBuilder()
            .onApplied(async () => {
                console.log('Subscription applied. Starting test telemetry ingestion...');
                await runTestIngestion();
            })
            .subscribe([
                "SELECT * FROM telemetry"
            ]);
    })
    .onConnectError((ctx, err) => {
        console.error('SpacetimeDB Connection Error:', err);
    })
    .build();

async function runTestIngestion() {
    try {
        console.log(`Fetching session details for key: ${TEST_SESSION_KEY}...`);
        const sessionResp = await axios.get(`${OPENF1_BASE_URL}/sessions`, {
            params: { session_key: TEST_SESSION_KEY }
        });
        const session = sessionResp.data[0];
        if (!session || !session.date_start) {
            console.error('No session or start date found.');
            process.exit(1);
        }

        const start = new Date(new Date(session.date_start).getTime() + 10 * 60 * 1000);
        // Fetch 30 seconds of telemetry from session start + 10 mins
        const end = new Date(start.getTime() + 30000); 

        console.log(`Session Start: ${start.toISOString()} -> Target End: ${end.toISOString()}`);
        console.log('Polling OpenF1 for car_data & location...');

        const [carData, locationData] = await Promise.all([
            axios.get(`${OPENF1_BASE_URL}/car_data`, {
                params: { 
                    session_key: TEST_SESSION_KEY, 
                    'date>': start.toISOString(), 
                    'date<': end.toISOString() 
                }
            }).catch(() => ({ data: [] })),
            axios.get(`${OPENF1_BASE_URL}/location`, {
                params: { 
                    session_key: TEST_SESSION_KEY, 
                    'date>': start.toISOString(), 
                    'date<': end.toISOString() 
                }
            }).catch(() => ({ data: [] }))
        ]);

        console.log(`Fetched ${carData.data.length} car_data points and ${locationData.data.length} location points.`);

        if (carData.data && carData.data.length > 0) {
            let written = 0;
            for (const p of carData.data) {
                // Find matching location point close to timestamp
                const loc = locationData.data?.find((l: any) =>
                    l.driver_number === p.driver_number &&
                    Math.abs(new Date(l.date).getTime() - new Date(p.date).getTime()) < 1000
                );

                conn.reducers.insertTelemetry({
                    driverNumber: p.driver_number,
                    sessionKey: p.session_key,
                    timestamp: p.date,
                    speed: p.speed || 0,
                    rpm: p.rpm || 0,
                    gear: p.n_gear || 0,
                    throttle: p.throttle || 0,
                    brake: p.brake || 0,
                    drs: p.drs || 0,
                    x: loc?.x || 0,
                    y: loc?.y || 0
                });
                written++;
            }
            console.log(`Successfully pushed ${written} telemetry records to SpacetimeDB!`);
        } else {
            console.log('No telemetry data found in this slice.');
        }

        console.log('Waiting 3s for reducers to flush...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('Test completed successfully.');
        process.exit(0);

    } catch (err: any) {
        console.error('Error during test ingestion:', err.message);
        process.exit(1);
    }
}
