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
        // Different behavior for demo vs live mode
        if (!isDemo) {
            // LIVE MODE: In real production, this would connect to OpenF1 live stream
            // For now, we show "waiting" state since there's no real race
            console.log('📡 Live mode: Waiting for real race data...');
            setStatus('waiting');
            setFrame(null); // No fake data in live mode
            return;
        }

        // DEMO MODE: Connect to fake simulated stream
        const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/abu_dhabi';
        console.log(`🎮 Demo mode: Connecting to simulated stream at ${wsUrl}`);

        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('✅ Demo WebSocket connected');
                setStatus('connected');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data) as TelemetryFrame;
                    setFrame(data);
                } catch (e) {
                    console.error('Failed to parse telemetry data:', e);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setStatus('error');
            };

            ws.onclose = () => {
                console.log('🔌 Demo WebSocket disconnected');
                setStatus('disconnected');

                // Attempt to reconnect after 2 seconds (demo mode only)
                reconnectTimeoutRef.current = window.setTimeout(() => {
                    if (wsRef.current?.readyState === WebSocket.CLOSED) {
                        console.log('🔄 Attempting to reconnect demo stream...');
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
