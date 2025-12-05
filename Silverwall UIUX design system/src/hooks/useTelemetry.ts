/**
 * useTelemetry - WebSocket hook for live F1 telemetry
 * 
 * MODES:
 * - Live mode (/telemetry/live): Connects to real race data - shows empty state if no race
 * - Demo mode (/telemetry/live?demo=true): Connects to fake simulated stream
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
    isDemo: boolean;
}

export function useTelemetry(): TelemetryState {
    const [frame, setFrame] = useState<TelemetryFrame | null>(null);
    const [status, setStatus] = useState<ConnectionStatus>('connecting');
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);

    // Check if in demo mode
    const isDemo = typeof window !== 'undefined' && window.location.search.includes('demo=true');

    const connect = useCallback(() => {
        // Different WebSocket endpoints for demo vs live mode
        const baseUrl = import.meta.env.VITE_WS_URL?.replace('/ws/abu_dhabi', '') || 'ws://localhost:8000';

        // DEMO MODE: Connect to simulated stream at /ws/abu_dhabi
        // LIVE MODE: Connect to real OpenF1 data at /ws/live
        const wsEndpoint = isDemo ? '/ws/abu_dhabi' : '/ws/live';
        const wsUrl = `${baseUrl}${wsEndpoint}`;

        console.log(`📡 ${isDemo ? 'DEMO' : 'LIVE'} mode: Connecting to ${wsUrl}`);

        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log(`✅ ${isDemo ? 'Demo' : 'Live'} WebSocket connected`);
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
                console.log(`🔌 ${isDemo ? 'Demo' : 'Live'} WebSocket disconnected`);
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
    }, [isDemo]);

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

    return { frame, status, isDemo };
}

export default useTelemetry;
