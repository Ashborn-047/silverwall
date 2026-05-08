import { DbConnection } from './sdk';

const SPACETIME_URI = 'wss://maincloud.spacetimedb.com';
const DBNAME = 'spacetimedb-uorks';

const conn = DbConnection.builder()
    .withUri(SPACETIME_URI)
    .withDatabaseName(DBNAME)
    .onConnect(() => {
        conn.subscriptionBuilder()
            .onApplied(() => {
                const races = Array.from(conn.db.race.iter());
                
                const years = [2024, 2025, 2026];
                
                console.log('--- Race Database Verification ---');
                for (const year of years) {
                    const yearRaces = races.filter(r => r.seasonYear === year);
                    const finishedRaces = yearRaces.filter(r => r.status === 'ended');
                    console.log(`Year ${year}: Total Sessions: ${yearRaces.length}, Finished Sessions: ${finishedRaces.length}`);
                }
                
                setTimeout(() => process.exit(0), 1000);
            })
            .subscribe([
                "SELECT * FROM race"
            ]);
    })
    .build();
