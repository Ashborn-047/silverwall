import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Activity, Cpu, ShieldAlert, Terminal, Clock, MapPin, Flag } from 'lucide-react';
import useRaceStatus from '../hooks/useRaceStatus';

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
    const isWaiting = raceStatus.status === 'waiting';
    const isOffSeason = raceStatus.status === 'off_season';

    let countdownData = { days: 0, hours: 0, minutes: 0, isLive: isLive };

    if (isWaiting && raceStatus.countdown) {
        countdownData = {
            days: raceStatus.countdown.days,
            hours: raceStatus.countdown.hours,
            minutes: raceStatus.countdown.minutes,
            isLive: false
        };
    } else if (isOffSeason && raceStatus.nextSeason) {
        const seconds = raceStatus.nextSeason.countdown_seconds;
        countdownData = {
            days: Math.floor(seconds / 86400),
            hours: Math.floor((seconds % 86400) / 3600),
            minutes: Math.floor((seconds % 3600) / 60),
            isLive: false
        };
    }

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
                            {countdownData.isLive ? (
                                <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-sm animate-pulse">
                                    <span className="w-2 h-2 rounded-full bg-red-500" />
                                    <span className="text-red-500 font-bold tracking-wider">RACE LIVE</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 px-4 py-2 bg-[#00D2BE]/5 border border-[#00D2BE]/20 rounded-sm">
                                    <span className="text-[#555] text-xs uppercase tracking-wider">{isOffSeason ? 'Season Starts In:' : 'Race In:'}</span>
                                    <span className="text-[#00D2BE] font-bold">
                                        {countdownData.days}D {countdownData.hours}H {countdownData.minutes}M
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
                    <div className="lg:col-span-5 w-full">
                        <RaceCard currentTime={currentTime} raceStatus={raceStatus} />
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

                {/* Track Map Visualization (Yas Marina Circuit) */}
                <div className="relative w-full h-48 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity duration-500">
                    {/* Grid Behind Map */}
                    <div
                        className="absolute inset-0 z-0"
                        style={{
                            backgroundImage: `radial-gradient(circle, #333 1px, transparent 1px)`,
                            backgroundSize: '20px 20px',
                            opacity: 0.3
                        }}
                    />

                    {/* Yas Marina Realistic SVG Path */}
                    <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-[0_0_8px_rgba(0,210,190,0.3)] z-10 transform scale-90">
                        {/* Main track outline - realistic Yas Marina shape */}
                        <path
                            d="M 30 80 
                               C 25 80, 20 75, 20 70 
                               L 20 45 
                               C 20 35, 30 30, 40 30 
                               L 70 30 
                               C 80 30, 85 35, 90 40 
                               L 100 50 
                               C 105 55, 115 55, 120 50 
                               L 130 40 
                               C 135 35, 145 30, 155 30 
                               L 170 30 
                               C 180 30, 185 40, 185 50 
                               L 185 60 
                               C 185 70, 175 80, 165 80 
                               L 150 80 
                               C 140 80, 135 75, 130 70 
                               L 125 65 
                               C 120 60, 110 60, 105 65 
                               L 95 75 
                               C 90 80, 80 85, 70 85 
                               L 45 85 
                               C 35 85, 30 82, 30 80 Z"
                            fill="none"
                            stroke="#00D2BE"
                            strokeWidth="2"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                        />
                        {/* Start/Finish Line */}
                        <line x1="40" y1="78" x2="40" y2="88" stroke="white" strokeWidth="2" />
                        {/* Pit lane entrance indicator */}
                        <circle cx="50" cy="82" r="2" fill="#FF9F0A" opacity="0.6" />
                    </svg>

                    <div className="absolute bottom-2 right-2 text-[10px] font-mono text-[#00D2BE] opacity-50">
                        SECTOR 1 | SECTOR 2 | SECTOR 3
                    </div>
                </div>
            </div>
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
