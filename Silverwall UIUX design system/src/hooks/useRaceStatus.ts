/**
 * useRaceStatus - Hook to fetch race status from backend
 * Returns: status (live/waiting/ended), countdown, session info
 */

import { useState, useEffect } from 'react';

interface RaceStatus {
    status: 'live' | 'waiting' | 'ended' | 'loading' | 'error';
    sessionName?: string;
    meetingName?: string;
    circuit?: string;
    nextSession?: string;
    countdown?: {
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
        text: string;
    };
    message?: string;
}

export function useRaceStatus(isDemo: boolean): RaceStatus {
    const [raceStatus, setRaceStatus] = useState<RaceStatus>({ status: 'loading' });

    useEffect(() => {
        // In demo mode, show simulated "live" status
        if (isDemo) {
            setRaceStatus({
                status: 'live',
                sessionName: 'Demo Race',
                meetingName: 'Abu Dhabi Grand Prix',
                circuit: 'Yas Marina',
            });
            return;
        }

        const fetchStatus = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const response = await fetch(`${apiUrl}/api/status`);

                if (!response.ok) {
                    throw new Error('Failed to fetch status');
                }

                const data = await response.json();

                if (data.status === 'live') {
                    setRaceStatus({
                        status: 'live',
                        sessionName: data.session_name,
                        meetingName: data.meeting_name,
                        circuit: data.circuit,
                    });
                } else if (data.status === 'waiting') {
                    // Calculate countdown from countdown_seconds
                    const seconds = data.countdown_seconds;
                    const days = Math.floor(seconds / 86400);
                    const hours = Math.floor((seconds % 86400) / 3600);
                    const minutes = Math.floor((seconds % 3600) / 60);
                    const secs = seconds % 60;

                    setRaceStatus({
                        status: 'waiting',
                        nextSession: data.next_session?.toUpperCase() || 'NEXT SESSION',
                        meetingName: data.meeting || 'Abu Dhabi Grand Prix',
                        countdown: {
                            days,
                            hours,
                            minutes,
                            seconds: secs,
                            text: days > 0
                                ? `${days}D ${hours}H ${minutes}M`
                                : hours > 0
                                    ? `${hours}H ${minutes}M ${secs}S`
                                    : `${minutes}M ${secs}S`,
                        },
                    });
                } else {
                    setRaceStatus({
                        status: 'ended',
                        message: data.message || 'Season ended',
                    });
                }
            } catch (error) {
                console.error('Failed to fetch race status:', error);
                setRaceStatus({
                    status: 'error',
                    message: 'Unable to fetch race status',
                });
            }
        };

        // Initial fetch
        fetchStatus();

        // Poll every 30 seconds for live updates
        const interval = setInterval(fetchStatus, 30000);

        return () => clearInterval(interval);
    }, [isDemo]);

    return raceStatus;
}

export default useRaceStatus;
