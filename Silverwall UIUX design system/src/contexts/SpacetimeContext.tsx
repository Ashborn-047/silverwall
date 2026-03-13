import React, { createContext, useContext, useEffect, useState } from 'react';
import { DbConnection } from '../sdk';

const SPACETIME_URI = 'wss://maincloud.spacetimedb.com';
const DBNAME = 'spacetimedb-uorks';

interface SpacetimeContextType {
    conn: DbConnection | null;
    isReady: boolean;
}

const SpacetimeContext = createContext<SpacetimeContextType>({ conn: null, isReady: false });

export const SpacetimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [conn, setConn] = useState<DbConnection | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const newConn = DbConnection.builder()
            .withUri(SPACETIME_URI)
            .withDatabaseName(DBNAME)
            .onConnect(() => {
                console.log('Frontend connected to SpacetimeDB');
                setIsReady(true);
            })
            .onDisconnect(() => {
                setIsReady(false);
            })
            .onConnectError((_ctx, err) => {
                console.error('SpacetimeDB Connection Error:', err);
            })
            .build();

        setConn(newConn);

        return () => {
            // Cleanup if the SDK supports it, though SpacetimeDB connections are usually long-lived
        };
    }, []);

    return (
        <SpacetimeContext.Provider value={{ conn, isReady }}>
            {children}
        </SpacetimeContext.Provider>
    );
};

export const useSpacetime = () => useContext(SpacetimeContext);
