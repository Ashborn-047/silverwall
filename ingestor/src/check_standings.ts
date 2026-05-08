import { DbConnection } from './sdk';

const SPACETIME_URI = 'wss://maincloud.spacetimedb.com';
const DBNAME = 'spacetimedb-uorks';

const conn = DbConnection.builder()
    .withUri(SPACETIME_URI)
    .withDatabaseName(DBNAME)
    .onConnect(() => {
        conn.subscriptionBuilder()
            .onApplied(() => {
                const driverStandings = Array.from(conn.db.driver_standings.iter());
                const constructorStandings = Array.from(conn.db.constructor_standings.iter());
                
                const years = [2024, 2025, 2026];
                
                console.log('--- Database Verification ---');
                for (const year of years) {
                    const dsCount = driverStandings.filter(s => s.seasonYear === year).length;
                    const csCount = constructorStandings.filter(s => s.seasonYear === year).length;
                    console.log(`Year ${year}: Driver Standings: ${dsCount}, Constructor Standings: ${csCount}`);
                }
                
                setTimeout(() => process.exit(0), 1000);
            })
            .subscribe([
                "SELECT * FROM driver_standings",
                "SELECT * FROM constructor_standings"
            ]);
    })
    .build();
