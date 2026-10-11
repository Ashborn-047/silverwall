import { useState, useEffect, useRef, useCallback } from 'react';
import { TelemetryFrame } from './useSpacetimeTelemetry';
import { getCachedReplay } from '../utils/replayStorage';

export interface ReplayEngineState {
    isPlaying: boolean;
    currentTime: number;        // Elapsed time in seconds
    duration: number;           // Total race time in seconds
    playbackRate: number;       // 1, 2, 5, 10
    currentLap: number;
    totalLaps: number;
    progressPercent: number;    // 0 to 100
    frame: TelemetryFrame | null;
    isLoading: boolean;
    activeSessionKey: number | null;
}

const DEFAULT_DRIVERS = [
    { code: 'VER', team: 'RBR', color: '#3671C6', number: 1 },
    { code: 'NOR', team: 'MCL', color: '#FF8700', number: 4 },
    { code: 'LEC', team: 'FER', color: '#DC0000', number: 16 },
    { code: 'HAM', team: 'FER', color: '#DC0000', number: 44 },
    { code: 'PIA', team: 'MCL', color: '#FF8700', number: 81 },
    { code: 'RUS', team: 'MER', color: '#00D2BE', number: 63 },
    { code: 'ANT', team: 'MER', color: '#00D2BE', number: 12 },
    { code: 'SAI', team: 'WIL', color: '#005AFF', number: 55 },
    { code: 'ALB', team: 'WIL', color: '#005AFF', number: 23 },
    { code: 'ALO', team: 'AMR', color: '#006F62', number: 14 },
    { code: 'STR', team: 'AMR', color: '#006F62', number: 18 },
    { code: 'TSU', team: 'RBR', color: '#3671C6', number: 22 },
    { code: 'LAW', team: 'ALT', color: '#2B4562', number: 30 },
    { code: 'HAD', team: 'ALT', color: '#2B4562', number: 6 },
    { code: 'GAS', team: 'ALP', color: '#0090FF', number: 10 },
    { code: 'OCO', team: 'HAA', color: '#FFFFFF', number: 31 },
    { code: 'BEA', team: 'HAA', color: '#FFFFFF', number: 87 },
    { code: 'HUL', team: 'ALF', color: '#900000', number: 27 },
    { code: 'BOR', team: 'ALF', color: '#900000', number: 5 },
    { code: 'COL', team: 'ALP', color: '#0090FF', number: 43 },
];

export function useReplayEngine(
    initialSessionKey?: number | null,
    trackPoints?: { x: number; y: number }[],
    totalLapsCount: number = 62
) {
    const [sessionKey, setSessionKey] = useState<number | null>(initialSessionKey || null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [frame, setFrame] = useState<TelemetryFrame | null>(null);

    // Standard F1 race duration ~ 5400 seconds (90 minutes)
    const duration = 5400;
    const totalLaps = totalLapsCount || 62;
    const lapDuration = duration / totalLaps;

    const animFrameRef = useRef<number | null>(null);
    const lastTimestampRef = useRef<number | null>(null);

    // Keep sessionKey updated when prop changes
    useEffect(() => {
        if (initialSessionKey) {
            setSessionKey(initialSessionKey);
        }
    }, [initialSessionKey]);

    // Check IndexedDB cache on session switch
    useEffect(() => {
        if (!sessionKey) return;
        let isMounted = true;

        const checkCache = async () => {
            setIsLoading(true);
            const cached = await getCachedReplay(sessionKey);
            if (isMounted) {
                if (cached) {
                    console.log(`Loaded cached replay for session ${sessionKey}`);
                }
                setIsLoading(false);
            }
        };

        checkCache();
        return () => { isMounted = false; };
    }, [sessionKey]);

    // Generate interpolated 60 FPS frame based on current time & track points
    const generateFrame = useCallback((timeSec: number): TelemetryFrame => {
        const lapProgress = (timeSec % lapDuration) / lapDuration;
        const pts = trackPoints && trackPoints.length > 2 ? trackPoints : null;
        const ptCount = pts ? pts.length : 100;

        const cars = DEFAULT_DRIVERS.map((d, index) => {
            // Slight position stagger between drivers (gaps)
            const gapStagger = (index * 0.035);
            let carProgress = (lapProgress - gapStagger + 1.0) % 1.0;

            let x = 0.5;
            let y = 0.5;

            if (pts) {
                // Interpolate along actual SVG track points
                const rawIdx = carProgress * (ptCount - 1);
                const i0 = Math.floor(rawIdx);
                const i1 = (i0 + 1) % ptCount;
                const frac = rawIdx - i0;

                const p0 = pts[i0];
                const p1 = pts[i1];
                x = p0.x + (p1.x - p0.x) * frac;
                y = p0.y + (p1.y - p0.y) * frac;
            } else {
                // Generic parametric track loop fallback
                const angle = carProgress * Math.PI * 2;
                x = 0.5 + 0.35 * Math.cos(angle);
                y = 0.5 + 0.25 * Math.sin(angle);
            }

            // Dynamics: Speed, Gear, Throttle, DRS based on track sector
            const isStraight = (carProgress > 0.1 && carProgress < 0.3) || (carProgress > 0.6 && carProgress < 0.8);
            const speed = isStraight ? Math.floor(290 + (index % 4) * 8) : Math.floor(120 + (index % 5) * 12);
            const gear = isStraight ? 7 : 3;
            const drs = isStraight && index < 8;
            const throttle = isStraight ? 100 : Math.floor(65 + Math.random() * 20);
            const brake = isStraight ? 0 : Math.floor(30 + Math.random() * 30);

            return {
                code: d.code,
                team: d.team,
                x,
                y,
                speed,
                gear,
                drs,
                throttle,
                brake,
                position: index + 1,
                color: d.color,
                driver_number: d.number,
                gap: index === 0 ? 'LEADER' : `+${(index * 1.4).toFixed(1)}s`,
                tyre: index % 2 === 0 ? 'HARD' : 'MEDIUM',
                tyre_age: Math.min(25, Math.floor((timeSec / lapDuration) * 1.2) + 1)
            };
        });

        return {
            t: timeSec,
            cars: cars.sort((a, b) => a.position - b.position)
        };
    }, [trackPoints, lapDuration]);

    // Animation Loop
    useEffect(() => {
        if (!isPlaying) {
            lastTimestampRef.current = null;
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            return;
        }

        const loop = (timestamp: number) => {
            if (lastTimestampRef.current === null) {
                lastTimestampRef.current = timestamp;
            }

            const deltaSec = (timestamp - lastTimestampRef.current) / 1000;
            lastTimestampRef.current = timestamp;

            setCurrentTime((prevTime) => {
                const nextTime = prevTime + (deltaSec * playbackRate);
                if (nextTime >= duration) {
                    setIsPlaying(false);
                    return duration;
                }
                return nextTime;
            });

            animFrameRef.current = requestAnimationFrame(loop);
        };

        animFrameRef.current = requestAnimationFrame(loop);

        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [isPlaying, playbackRate, duration]);

    // Update frame whenever currentTime changes
    useEffect(() => {
        const nextFrame = generateFrame(currentTime);
        setFrame(nextFrame);
    }, [currentTime, generateFrame]);

    // Playback Controls
    const play = useCallback(() => setIsPlaying(true), []);
    const pause = useCallback(() => setIsPlaying(false), []);
    const togglePlay = useCallback(() => setIsPlaying(prev => !prev), []);
    const seekTo = useCallback((sec: number) => {
        const clamped = Math.max(0, Math.min(duration, sec));
        setCurrentTime(clamped);
    }, [duration]);

    const setSpeed = useCallback((rate: number) => {
        setPlaybackRate(rate);
    }, []);

    const restart = useCallback(() => {
        setCurrentTime(0);
        setIsPlaying(true);
    }, []);

    const loadSession = useCallback((newSessionKey: number) => {
        setSessionKey(newSessionKey);
        setCurrentTime(0);
        setIsPlaying(false);
    }, []);

    const currentLap = Math.min(totalLaps, Math.floor(currentTime / lapDuration) + 1);
    const progressPercent = Math.min(100, (currentTime / duration) * 100);

    return {
        isPlaying,
        currentTime,
        duration,
        playbackRate,
        currentLap,
        totalLaps,
        progressPercent,
        frame,
        isLoading,
        activeSessionKey: sessionKey,
        play,
        pause,
        togglePlay,
        seekTo,
        setSpeed,
        restart,
        loadSession
    };
}

export default useReplayEngine;
