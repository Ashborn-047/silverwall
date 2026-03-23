import { DbConnection } from './sdk';

const SPACETIME_URI = 'wss://maincloud.spacetimedb.com';
const DBNAME = 'spacetimedb-uorks';

const conn = DbConnection.builder()
    .withUri(SPACETIME_URI)
    .withDatabaseName(DBNAME)
    .onConnect(() => {
        console.log('Connected to SpacetimeDB. Subscribing to races...');
        
        conn.subscriptionBuilder()
            .onApplied(() => {
                const races = Array.from(conn.db.race.iter());
                console.log(`Found ${races.length} races in DB.`);
                
                for (const r of races) {
                    let status = 'upcoming';
                    const now = new Date().getTime();
                    const start = new Date(r.date).getTime();
                    const end = start + (2 * 60 * 60 * 1000);
                    
                    if (now > end) {
                        status = 'ended';
                    } else if (now >= start && now <= end) {
                        status = 'live';
                    }

                    if (r.status !== status) {
                        console.log(`Updating ${r.name} (${r.seasonYear}) from ${r.status} to ${status}`);
                        conn.reducers.seedRace({
                            raceKey: r.raceKey,
                            name: r.name,
                            date: r.date,
                            circuitKey: r.circuitKey,
                            status: status,
                            year: r.seasonYear
                        });
                    }
                }
                console.log('Update commands sent. Waiting 3s to flush...');
                setTimeout(() => process.exit(0), 3000);
            })
            .subscribe(["SELECT * FROM race"]);
    })
    .onConnectError((ctx, err) => {
        console.error('Connection error:', err);
    })
    .build();
