import { useState, useEffect } from 'react';
import { useSpacetime } from '../contexts/SpacetimeContext';
import { Telemetry } from '../sdk/types';

interface Car {
    code: string;
    team: string;
    x: number;
    y: number;
    speed: number;
    gear: number;
    drs: boolean;
    throttle: number;
    brake: number;
    position: number;
    color: string;
    tyre?: string;
    tyre_age?: number;
}

export interface TelemetryFrame {
    t: number;
    cars: Car[];
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'waiting';

export function useSpacetimeTelemetry() {
    const { conn, isReady } = useSpacetime();
    const [frame, setFrame] = useState<TelemetryFrame | null>(null);
    const [status, setStatus] = useState<ConnectionStatus>('connecting');

    useEffect(() => {
        if (!isReady || !conn) {
            setStatus('connecting');
            return;
        }

        setStatus('connected');

        const updateTelemetry = () => {
            const races = Array.from(conn.db.race.iter());
            const liveRace = races.find(r => r.status === 'live');

            if (!liveRace) {
                setStatus('waiting');
                setFrame(null);
                return;
            }

            setStatus('connected');

            const allTelemetry = Array.from(conn.db.telemetry.iter())
                .filter(t => t.sessionKey === liveRace.raceKey);

            const latestByDriver = new Map<number, Telemetry>();
            allTelemetry.forEach(t => {
                const existing = latestByDriver.get(t.driverNumber);
                if (!existing || new Date(t.timestamp).getTime() > new Date(existing.timestamp).getTime()) {
                    latestByDriver.set(t.driverNumber, t);
                }
            });

            const drivers = Array.from(conn.db.driver.iter());

            const cars: Car[] = Array.from(latestByDriver.values()).map((t, index) => {
                const driverInfo = drivers.find(d => d.driverNumber === t.driverNumber);
                return {
                    code: driverInfo?.name || t.driverNumber.toString(),
                    team: driverInfo?.team || 'Unknown',
                    color: driverInfo?.teamColor || '#00D2BE',
                    x: t.x,
                    y: t.y,
                    speed: t.speed,
                    gear: t.gear,
                    drs: t.drs === 1,
                    throttle: t.throttle,
                    brake: t.brake,
                    position: index + 1,
                };
            });

            setFrame({
                t: Date.now(),
                cars: cars.sort((a, b) => a.position - b.position)
            });
        };

        conn.subscriptionBuilder()
            .onApplied(() => updateTelemetry())
            .subscribe([
                "SELECT * FROM telemetry",
                "SELECT * FROM race",
                "SELECT * FROM driver"
            ]);

        conn.db.telemetry.onInsert((_) => updateTelemetry());
        conn.db.race.onInsert((_) => updateTelemetry());
        conn.db.driver.onInsert((_) => updateTelemetry());

        return () => {
            // sub.unsubscribe();
        };
    }, [isReady, conn]);

    return { frame, status };
}

export default useSpacetimeTelemetry;
