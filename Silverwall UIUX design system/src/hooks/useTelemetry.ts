/**
 * useTelemetry - WebSocket hook for live F1 telemetry
 * 
 * Connected strictly to real race data (/ws/live).
 * Shows empty/waiting state if no live session is active.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

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
}

export interface TelemetryFrame {
    t: number;
    cars: Car[];
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'waiting';

interface TelemetryState {
    frame: TelemetryFrame | null;
    status: ConnectionStatus;
}

export function useTelemetry(): TelemetryState {
    const [frame, setFrame] = useState<TelemetryFrame | null>(null);
    const [status, setStatus] = useState<ConnectionStatus>('connecting');
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);

    const connect = useCallback(() => {
        const baseUrl = import.meta.env.VITE_WS_URL?.replace('/ws/abu_dhabi', '') || 'ws://localhost:8000';
        const wsEndpoint = '/ws/live';
        const wsUrl = `${baseUrl}${wsEndpoint}`;

        console.log(`📡 Connecting to LIVE telemetry at ${wsUrl}`);

        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('✅ Live WebSocket connected');
                setStatus('connected');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Handle different response types from live endpoint
                    if (data.status === 'waiting') {
                        setStatus('waiting');
                        setFrame(null);
                    } else if (data.status === 'error') {
                        console.error('WebSocket error:', data.message);
                        setStatus('error');
                    } else {
                        // Valid frame data
                        setFrame(data as TelemetryFrame);
                        setStatus('connected');
                    }
                } catch (e) {
                    console.error('Failed to parse telemetry data:', e);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setStatus('error');
            };

            ws.onclose = () => {
                console.log('🔌 Live WebSocket disconnected');
                setStatus('disconnected');

                // Attempt to reconnect after 2 seconds
                reconnectTimeoutRef.current = window.setTimeout(() => {
                    if (wsRef.current?.readyState === WebSocket.CLOSED) {
                        console.log('🔄 Attempting to reconnect...');
                        setStatus('connecting');
                        connect();
                    }
                }, 2000);
            };
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            setStatus('error');
        }
    }, []);

    useEffect(() => {
        connect();

        return () => {
            // Cleanup on unmount
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [connect]);

    return { frame, status };
}

export default useTelemetry;
