import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Activity, Cpu, ShieldAlert, Terminal, Clock, MapPin, Flag, Trophy } from 'lucide-react';
import useRaceStatus from '../hooks/useRaceStatus';
import useTrack from '../hooks/useTrack';

// ============================================================================
// 🏎️ TELEMETRY LIVE VIEWER
// Engineering-grade F1 telemetry display matching AMG pit-wall aesthetics
// ============================================================================

export default function Landing() {
    const [isHovered, setIsHovered] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const raceStatus = useRaceStatus();

    // Simulating a pit-wall clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const isLive = raceStatus.status === 'live';
    const isOffSeason = raceStatus.status === 'off_season';

    // High-precision countdown timer (seconds)
    const [secondsRemaining, setSecondsRemaining] = useState(0);

    useEffect(() => {
        let timer: any;
        if (raceStatus.status === 'off_season' && raceStatus.nextSeason) {
            setSecondsRemaining(raceStatus.nextSeason.countdown_seconds);
            timer = setInterval(() => {
                setSecondsRemaining(prev => Math.max(0, prev - 1));
            }, 1000);
        } else if (raceStatus.status === 'waiting' && raceStatus.countdown) {
            const c = raceStatus.countdown;
            const total = (c.days * 86400) + (c.hours * 3600) + (c.minutes * 60) + c.seconds;
            setSecondsRemaining(total);
            timer = setInterval(() => {
                setSecondsRemaining(prev => Math.max(0, prev - 1));
            }, 1000);
        }

        return () => clearInterval(timer);
    }, [raceStatus]);

    const formatCountdown = () => {
        const d = Math.floor(secondsRemaining / 86400);
        const h = Math.floor((secondsRemaining % 86400) / 3600);
        const m = Math.floor((secondsRemaining % 3600) / 60);
        const s = secondsRemaining % 60;
        return `${d}D ${h}H ${m}M ${s}S`;
    };

    return (
        <div className="min-h-screen bg-[#050608] text-[#E0E0E0] font-sans selection:bg-[#00D2BE] selection:text-[#050608] flex flex-col overflow-hidden relative">

            {/* Background Grid Mesh (Subtle Engineering Texture) */}
            <div
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                    backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), 
          linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* ========================================================================
          HEADER
      ======================================================================== */}
            <header className="w-full max-w-[1400px] mx-auto px-6 py-6 flex items-center justify-between relative z-10 border-b border-[#00D2BE]/10">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-[#00D2BE]" /> {/* AMG Style Accent Bar */}
                    <h1 className="text-xl font-bold tracking-widest uppercase">
                        SILVER<span className="text-[#00D2BE]">WALL</span>
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-sm border border-[#00D2BE]/20 bg-[#00D2BE]/5">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-mono tracking-wider text-[#00D2BE] uppercase">System Operational</span>
                    </div>
                    <span className="text-[10px] text-[#9CA3AF] font-mono border border-[#333] px-2 py-1 rounded">
                        OPEN SOURCE | OpenF1
                    </span>
                </div>
            </header>

            {/* ========================================================================
          MAIN CONTENT AREA
      ======================================================================== */}
            <main className="flex-grow flex items-center justify-center relative z-10 w-full max-w-[1400px] mx-auto px-6 py-12">
                <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">

                    {/* LEFT COL: Value Prop & CTA */}
                    <div className="lg:col-span-7 flex flex-col gap-8">

                        {/* Context Label */}
                        <div className="flex items-center gap-2 text-[#00D2BE] font-mono text-xs tracking-[0.2em] uppercase mb-[-1rem]">
                            <Terminal size={14} />
                            <span>Telemetry Extraction Unit</span>
                        </div>

                        {/* Headline */}
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">
                            ENGINEERING-GRADE<br />
                            <span className="text-white">RACE TELEMETRY.</span>
                        </h2>

                        {/* Countdown Timer */}
                        <div className="flex items-center gap-3 font-mono text-sm">
                            {isLive ? (
                                <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-sm animate-pulse">
                                    <span className="w-2 h-2 rounded-full bg-red-500" />
                                    <span className="text-red-500 font-bold tracking-wider">RACE LIVE</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 px-4 py-2 bg-[#00D2BE]/5 border border-[#00D2BE]/20 rounded-sm">
                                    <span className="text-[#555] text-xs uppercase tracking-wider">{isOffSeason ? 'Season Starts In:' : 'Race In:'}</span>
                                    <span className="text-[#00D2BE] font-bold tabular-nums w-[140px]">
                                        {formatCountdown()}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Value Statement */}
                        <p className="text-[#9CA3AF] text-lg md:text-xl max-w-2xl font-light border-l-2 border-[#333] pl-6 py-1">
                            Speed, gear changes, throttle, braking, and DRS — visualized in real-time.
                            A precise tactical toolkit for analysts, mirroring the pit wall environment.
                        </p>

                        {/* Metric Preview Pills */}
                        <div className="flex flex-wrap gap-3 font-mono text-xs text-[#00D2BE]">
                            {['SPEED_KPH', 'RPM', 'DRS_STATUS', 'THROTTLE_%', 'BRAKE_PSI', 'GEAR'].map((metric) => (
                                <span key={metric} className="px-2 py-1 bg-[#00D2BE]/10 border border-[#00D2BE]/20 rounded-sm">
                                    {metric}
                                </span>
                            ))}
                        </div>

                        {/* PRIMARY CTA */}
                        <div className="mt-4">
                            <Link
                                to="/telemetry/live"
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                                className={`
                  group relative flex items-center justify-between px-8 py-5 
                  bg-[#00D2BE] text-[#050608] 
                  text-lg font-bold tracking-wider uppercase
                  rounded-[4px] transition-all duration-300
                  ${isHovered ? 'shadow-[0_0_20px_rgba(0,210,190,0.4)] translate-y-[-1px]' : 'shadow-none'}
                `}
                                style={{ minWidth: '300px' }}
                            >
                                <span>Open Live Pit-Wall</span>
                                <ChevronRight
                                    className={`transition-transform duration-300 ${isHovered ? 'translate-x-2' : ''}`}
                                    size={24}
                                    strokeWidth={3}
                                />
                            </Link>

                            <div className="mt-3 flex items-center gap-2 text-[#555] text-xs font-mono">
                                <ShieldAlert size={12} />
                                <span>RESTRICTED ACCESS: ENGINEERING PERSONNEL ONLY</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COL: Next Race Card */}
                    <div className="lg:col-span-5 w-full flex flex-col gap-6">
                        <RaceCard currentTime={currentTime} raceStatus={raceStatus} />

                        {/* 2024 Champions & 2025 Leaders Banner */}
                        <div className="p-4 rounded-sm border border-[#FFD700]/20 bg-[#FFD700]/5 flex flex-col gap-3 overflow-hidden relative group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#FFD700] opacity-50" />

                            <div className="flex justify-between items-start relative z-10">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-[#FFD700] font-mono font-bold tracking-[0.2em] uppercase mb-1">2024 WORLD CHAMPIONS</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-lg font-black text-[#E0E0E0] italic">MAX VERSTAPPEN</span>
                                        <span className="text-xs text-[#9CA3AF]">/ RED BULL</span>
                                    </div>
                                    <div className="flex items-baseline gap-2 mt-0.5">
                                        <span className="text-sm font-bold text-[#E0E0E0] uppercase tracking-wide">McLAREN F1 TEAM</span>
                                        <span className="text-[10px] text-[#9CA3AF]">/ CONSTRUCTORS</span>
                                    </div>
                                </div>
                                <div className="opacity-10 group-hover:opacity-25 transition-opacity">
                                    <Trophy size={48} className="text-[#FFD700]" strokeWidth={1} />
                                </div>
                            </div>

                            <div className="pt-3 border-t border-[#FFD700]/10 flex flex-col h-full bg-[#00D2BE]/5 relative z-10 p-2 rounded-sm">
                                <span className="text-[9px] text-[#00D2BE] font-mono font-bold tracking-[0.1em] uppercase mb-1">Current 2025 Standings Leader</span>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-black text-white italic">LANDO NORRIS</span>
                                        <span className="text-[10px] text-[#9CA3AF]">/ 408 PTS</span>
                                    </div>
                                    <div className="px-2 py-0.5 bg-[#FF8000]/20 border border-[#FF8000]/40 rounded-full">
                                        <span className="text-[8px] text-[#FF8000] font-bold">+12 GAP</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            {/* ========================================================================
          FOOTER
      ======================================================================== */}
            <footer className="w-full max-w-[1400px] mx-auto px-6 py-8 border-t border-[#00D2BE]/10 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-center text-[#555] text-xs gap-4">
                    <div className="flex items-center gap-4">
                        <p className="font-mono">
                            SILVERWALL V2.4.0 <span className="mx-2">|</span> SESSION ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                        </p>
                        <Link
                            to="/design-system"
                            className="font-mono text-[10px] text-[#555] hover:text-[#00D2BE] transition-colors uppercase tracking-wider border border-[#333] hover:border-[#00D2BE]/30 px-2 py-1 rounded"
                        >
                            Design System
                        </Link>
                    </div>
                    <p className="text-center md:text-right opacity-60">
                        Data provided by OpenF1 — SilverWall is an Independent Project.<br />
                        Not affiliated with Formula 1® or Liberty Media.
                    </p>
                </div>
            </footer>

        </div>
    );
}

// ============================================================================
// 🧩 COMPONENT: Race Card
// ============================================================================
const RaceCard = ({ currentTime, raceStatus }: { currentTime: Date, raceStatus: any }) => {
    const isOffSeason = raceStatus.status === 'off_season';
    const nextSeason = raceStatus.nextSeason;

    const circuitId = isOffSeason ? 'albert_park' : 'abu_dhabi';
    const { points, loading } = useTrack(circuitId);

    const eventName = isOffSeason ? nextSeason?.first_race : (raceStatus.meetingName || "Abu Dhabi Grand Prix");
    const circuitName = isOffSeason ? nextSeason?.circuit : (raceStatus.circuit || "Yas Marina Circuit");
    const location = isOffSeason ? nextSeason?.location : "ABU DHABI";
    const country = isOffSeason ? nextSeason?.country : "UAE";

    // Parse date for next season if applicable
    let dateStr = "DEC 07, 2025";
    let subDate = "18:30 IST";

    if (isOffSeason && nextSeason?.race_date) {
        const d = new Date(nextSeason.race_date);
        dateStr = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();
        subDate = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) + " UTC";
    }

    return (
        <div className="relative w-full bg-[#0A0C10] border border-[#00D2BE]/20 rounded-sm overflow-hidden">
            {/* Decorative Corner Markers */}
            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-[#00D2BE]" />
            <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-[#00D2BE]" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-[#00D2BE]" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-[#00D2BE]" />

            {/* Card Header */}
            <div className="bg-[#00D2BE]/5 border-b border-[#00D2BE]/10 p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Activity size={16} className="text-[#00D2BE]" />
                    <span className="text-[#00D2BE] font-mono text-xs font-bold tracking-widest uppercase">
                        {isOffSeason ? 'NEXT SEASON opener' : 'NEXT EVENT'}
                    </span>
                </div>
                <div className="font-mono text-xs text-[#9CA3AF]">
                    UTC: {currentTime.toISOString().split('T')[1].split('.')[0]}
                </div>
            </div>

            {/* Card Body */}
            <div className="p-6 md:p-8">
                <div className="flex flex-col gap-1 mb-6">
                    <h3 className="text-2xl font-bold text-white tracking-wide uppercase">{eventName}</h3>
                    <span className="text-[#9CA3AF] text-sm font-light">{circuitName}</span>
                </div>

                {/* Data Grid */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-8 border-t border-b border-[#333] py-4">
                    <DataPoint icon={<Clock size={14} />} label="DATE" value={dateStr} sub={subDate} />
                    <DataPoint icon={<Flag size={14} />} label="LAPS" value={isOffSeason ? String(nextSeason?.laps || 58) : "58"} sub={isOffSeason ? `${nextSeason?.circuit_length_km || 5.278} KM` : "5.281 KM"} />
                    <DataPoint icon={<MapPin size={14} />} label="LOCATION" value={location} sub={country} />
                    <DataPoint icon={<Cpu size={14} />} label="DATA SOURCE" value="OPENF1" sub={isOffSeason ? "PLANNING" : "LIVE STREAM"} />
                </div>

                {/* Dynamic Track Map Visualization */}
                <div className="relative w-full h-full flex items-center justify-center p-4">
                    {loading ? (
                        <div className="animate-pulse text-[#00D2BE] font-mono text-[10px]">LOADING_GEOMETRY...</div>
                    ) : points.length > 0 ? (
                        <svg
                            viewBox="0 0 1.1 1.1"
                            className="w-full h-full drop-shadow-[0_0_8px_rgba(0,210,190,0.3)] z-10"
                            preserveAspectRatio="xMidYMid meet"
                        >
                            {/* Main track outline */}
                            <path
                                d={`M ${points[0].x} ${points[0].y} ${points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')} Z`}
                                fill="none"
                                stroke="#00D2BE"
                                strokeWidth="0.015"
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                className="transition-all duration-1000"
                            />

                            {/* Inner glow / detail path */}
                            <path
                                d={`M ${points[0].x} ${points[0].y} ${points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')} Z`}
                                fill="none"
                                stroke="white"
                                strokeWidth="0.002"
                                opacity="0.3"
                            />

                            {/* Start/Finish Line Indicator */}
                            <circle cx={points[0].x} cy={points[0].y} r="0.01" fill="white" />
                            <text x={points[0].x + 0.02} y={points[0].y} fill="white" fontSize="0.03" className="font-mono">S/F</text>
                        </svg>
                    ) : (
                        <div className="text-red-500/50 font-mono text-[10px]">GEOMETRY_ERROR</div>
                    )}
                </div>

                <div className="absolute bottom-2 right-2 text-[10px] font-mono text-[#00D2BE] opacity-50">
                    SECTOR 1 | SECTOR 2 | SECTOR 3
                </div>
            </div>

            {/* 2026 Regulation Highlight */}
            {isOffSeason && (
                <div className="px-6 md:px-8 pb-8">
                    <div className="p-3 bg-[#00D2BE]/5 border border-[#00D2BE]/10 rounded-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldAlert size={14} className="text-[#00D2BE]" />
                            <span className="text-[10px] font-mono text-[#00D2BE] uppercase tracking-[0.2em] font-bold">2026 REGULATION OVERHAUL</span>
                        </div>
                        <p className="text-[11px] text-[#9CA3AF] leading-relaxed font-mono">
                            NEW POWER UNITS: 50% ELECTRICAL SUSTAINABILITY. ACTIVE AERODYNAMICS. COMPLETELY NEW CHASSIS DESIGN.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

const DataPoint = ({ icon, label, value, sub }: { icon: React.ReactNode, label: string, value: string, sub: string }) => (
    <div className="flex flex-col">
        <div className="flex items-center gap-2 text-[#555] mb-1">
            {icon}
            <span className="text-[10px] font-bold tracking-wider">{label}</span>
        </div>
        <span className="font-mono text-[#E0E0E0] text-sm">{value}</span>
        <span className="font-mono text-[#00D2BE] text-[10px]">{sub}</span>
    </div>
);
