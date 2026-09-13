import { useState, useEffect, useRef } from 'react';

interface Car {
    code: string;
    team: string;
    x: number;
    y: number;
    speed: number;
    position: number;
    color: string;
    driver_number: number;
    gap: string;
    tyre?: string;
    tyre_age?: number;
    throttle: number;
    brake: number;
    gear: number;
    drs: boolean;
}

export interface LiveFrame {
    status: 'live' | 'waiting' | 'offline' | 'error';
    cars: Car[];
    timestamp: string;
    session_key?: number;
    message?: string;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export function useBackendTelemetry(wsUrl?: string) {
    const [frame, setFrame] = useState<LiveFrame | null>(null);
    const [status, setStatus] = useState<ConnectionStatus>('connecting');
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Use environment variable or fallback to local backend in development
        const backendWsUrl = wsUrl ||
            import.meta.env.VITE_WS_LIVE_URL ||
            (import.meta.env.DEV ? 'ws://localhost:8000/ws/live' : undefined);

        if (!backendWsUrl) {
            setStatus('disconnected');
            return;
        }

        console.log(`🔌 Connecting to backend: ${backendWsUrl}`);
        let reconnectTimer: NodeJS.Timeout;
        let retryCount = 0;
        const MAX_RETRIES = 5;

        const connect = () => {
            try {
                const ws = new WebSocket(backendWsUrl);
                wsRef.current = ws;
                setStatus('connecting');

                ws.onopen = () => {
                    console.log('✅ Connected to backend /ws/live');
                    setStatus('connected');
                };

                ws.onmessage = (event) => {
                    try {
                        const data: LiveFrame = JSON.parse(event.data);
                        setFrame(data);

                        // Update connection status based on session status
                        if (data.status === 'live' || data.status === 'waiting') {
                            setStatus('connected');
                        } else if (data.status === 'offline') {
                            setStatus('disconnected');
                        } else if (data.status === 'error') {
                            setStatus('error');
                        }
                    } catch (e) {
                        console.error('❌ Failed to parse WebSocket message:', e);
                        setStatus('error');
                    }
                };

                ws.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                    setStatus('error');
                };

                ws.onclose = () => {
                    wsRef.current = null;
                    if (retryCount < MAX_RETRIES) {
                        retryCount++;
                        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
                        console.log(`⚠️ Disconnected from backend, retry ${retryCount}/${MAX_RETRIES} in ${delay / 1000}s...`);
                        setStatus('disconnected');
                        reconnectTimer = setTimeout(connect, delay);
                    } else {
                        console.log('ℹ️ Backend WebSocket unavailable. Falling back to SpacetimeDB telemetry stream.');
                        setStatus('disconnected');
                    }
                };
            } catch (err) {
                console.error('❌ Connection failed:', err);
                setStatus('error');
                if (retryCount < MAX_RETRIES) {
                    retryCount++;
                    reconnectTimer = setTimeout(connect, 5000);
                }
            }
        };

        connect();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            clearTimeout(reconnectTimer);
        };
    }, [wsUrl]);

    return { frame, status };
}

export default useBackendTelemetry;
