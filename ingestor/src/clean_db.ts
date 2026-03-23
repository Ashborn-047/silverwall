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
                console.log(`Deleting ${races.length} duplicated races from DB...`);
                // There is no native client delete method exposed by default unless generated.
                // Oh wait, client SDK doesn't have `conn.db.race.delete()` because it's client readonly!
                console.log("We need to clear this via a backend deploy update or a SQL command.");
                process.exit(0);
            })
            .subscribe(["SELECT * FROM race"]);
    })
    .build();
