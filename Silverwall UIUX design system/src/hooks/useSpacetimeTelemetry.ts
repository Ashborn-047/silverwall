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
    gap?: string;
    driver_number?: number;
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
            const now = Date.now();
            const SESSION_DURATION_MS = 2.5 * 60 * 60 * 1000;

            const results = Array.from(conn.db.race_result.iter());
            const liveRace = races.find(r => r.status === 'live') ||
                races.find(r => {
                    const hasFullResults = results.filter((res: any) => res.raceKey === r.raceKey).length >= 10;
                    if (hasFullResults) return false;
                    const startTime = new Date(r.date).getTime();
                    return now >= startTime && now <= startTime + SESSION_DURATION_MS;
                });

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

            // Check if coordinates are raw OpenF1 units (> 1) and need normalization to 0-1
            const allCoords = Array.from(latestByDriver.values());
            const hasRawCoords = allCoords.some(c => Math.abs(c.x) > 1 || Math.abs(c.y) > 1);

            // Circuit bounding boxes for exact alignment with track SVG
            const CIRCUIT_BOUNDS: Record<number, { minX: number; maxX: number; minY: number; maxY: number }> = {
                61: { minX: -13225, maxX: 1170, minY: -4906, maxY: 4089 }, // Singapore Marina Bay
                49: { minX: -12000, maxX: 4000, minY: -3000, maxY: 6000 },  // Shanghai
                63: { minX: -3000, maxX: 3000, minY: -3000, maxY: 3000 },   // Bahrain
            };

            let bounds = liveRace?.circuitKey ? CIRCUIT_BOUNDS[liveRace.circuitKey] : undefined;
            if (!bounds && hasRawCoords) {
                const xs = allTelemetry.map(c => c.x).filter(x => x !== 0);
                const ys = allTelemetry.map(c => c.y).filter(y => y !== 0);
                if (xs.length > 0 && ys.length > 0) {
                    bounds = {
                        minX: Math.min(...xs),
                        maxX: Math.max(...xs),
                        minY: Math.min(...ys),
                        maxY: Math.max(...ys)
                    };
                }
            }

            const cars: Car[] = Array.from(latestByDriver.values()).map((t, index) => {
                const driverInfo = drivers.find(d => d.driverNumber === t.driverNumber);
                let carX = t.x;
                let carY = t.y;

                if (hasRawCoords && bounds && (t.x !== 0 || t.y !== 0)) {
                    const width = bounds.maxX - bounds.minX;
                    const height = bounds.maxY - bounds.minY;
                    const maxRange = Math.max(width, height) || 1;
                    const xOffset = (1.0 - (width / maxRange)) / 2;
                    const yOffset = (1.0 - (height / maxRange)) / 2;
                    carX = (t.x - bounds.minX) / maxRange + xOffset;
                    carY = (t.y - bounds.minY) / maxRange + yOffset;
                }

                return {
                    code: driverInfo?.name || t.driverNumber.toString(),
                    team: driverInfo?.team || 'Unknown',
                    color: driverInfo?.teamColor || '#00D2BE',
                    x: carX,
                    y: carY,
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
        (conn.db.race as any).onUpdate?.((_: any) => updateTelemetry());
        conn.db.driver.onInsert((_) => updateTelemetry());

        return () => {
            // sub.unsubscribe();
        };
    }, [isReady, conn]);

    return { frame, status };
}

export default useSpacetimeTelemetry;
