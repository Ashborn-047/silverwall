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
                const liveRaces = races.filter(r => r.status === 'live');
                console.log(`Live races:`, liveRaces);
                console.log(`Unique race names:`, [...new Set(races.map(r => r.name))]);
                setTimeout(() => process.exit(0), 1000);
            })
            .subscribe(["SELECT * FROM race"]);
    })
    .build();
