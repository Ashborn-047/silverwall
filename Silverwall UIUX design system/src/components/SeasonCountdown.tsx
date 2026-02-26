/**
 * SeasonCountdown - Season Waiting Display
 * Shows countdown to the next F1 season dynamically
 */

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Flag, Timer, Trophy } from 'lucide-react';

interface NextSeason {
    year: number;
    first_race?: string;
    location?: string;
    country?: string;
    circuit?: string;
    circuit_name?: string;
    circuit_length_km?: number;
    laps?: number;
    race_date?: string;
    countdown_seconds: number;
}

interface SeasonCountdownProps {
    nextSeason: NextSeason;
}

export default function SeasonCountdown({ nextSeason }: SeasonCountdownProps) {
    const [countdown, setCountdown] = useState(nextSeason.countdown_seconds);

    // Live countdown timer
    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown(prev => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Format countdown into days, hours, minutes, seconds
    const days = Math.floor(countdown / 86400);
    const hours = Math.floor((countdown % 86400) / 3600);
    const minutes = Math.floor((countdown % 3600) / 60);
    const seconds = countdown % 60;

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
            {/* Season Complete Banner */}
            <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-[#00D2BE]/10 border border-[#00D2BE]/30 mb-4">
                    <Trophy size={16} className="text-[#00D2BE]" />
                    <span className="text-[#00D2BE] font-mono text-sm tracking-wider uppercase">
                        {nextSeason.year - 1} Season Complete
                    </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-wide mb-2">
                    SEE YOU IN <span className="text-[#00D2BE]">{nextSeason.year}</span>
                </h1>
                <p className="text-[#9CA3AF] text-lg">
                    The next F1 season begins soon
                </p>
            </div>

            {/* Countdown Timer */}
            <div className="mb-12">
                <div className="flex gap-4 md:gap-8">
                    {[
                        { value: days, label: 'DAYS' },
                        { value: hours, label: 'HOURS' },
                        { value: minutes, label: 'MINS' },
                        { value: seconds, label: 'SECS' },
                    ].map(({ value, label }) => (
                        <div key={label} className="flex flex-col items-center">
                            <div className="bg-[#0A0C10] border border-[#00D2BE]/20 rounded-sm px-4 py-3 min-w-[70px] md:min-w-[90px]">
                                <span className="text-3xl md:text-5xl font-mono font-bold text-[#00D2BE] tabular-nums">
                                    {String(value).padStart(2, '0')}
                                </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#555] mt-2 tracking-wider">
                                {label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* First Race Info Card */}
            <div className="w-full max-w-md bg-[#0A0C10] border border-[#00D2BE]/20 rounded-sm overflow-hidden">
                {/* Card Header */}
                <div className="bg-[#00D2BE]/5 border-b border-[#00D2BE]/10 px-6 py-4 flex items-center gap-2">
                    <Flag size={14} className="text-[#00D2BE]" />
                    <span className="text-[#00D2BE] font-mono text-xs font-bold tracking-widest uppercase">
                        First Race of {nextSeason.year}
                    </span>
                </div>

                {/* Card Body */}
                <div className="p-6">
                    <h3 className="text-2xl font-bold text-white tracking-wide uppercase mb-1">
                        {nextSeason.first_race}
                    </h3>
                    <p className="text-[#9CA3AF] text-sm mb-6">
                        {nextSeason.circuit}
                    </p>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-[#555] mb-1">
                                <MapPin size={12} />
                                <span className="text-[10px] font-bold tracking-wider">LOCATION</span>
                            </div>
                            <span className="font-mono text-sm text-[#E0E0E0]">{nextSeason.location}</span>
                            <span className="font-mono text-[10px] text-[#00D2BE]">{nextSeason.country}</span>
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-[#555] mb-1">
                                <Calendar size={12} />
                                <span className="text-[10px] font-bold tracking-wider">DATE</span>
                            </div>
                            <span className="font-mono text-sm text-[#E0E0E0]">{nextSeason.race_date ? new Date(nextSeason.race_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase() : 'TBD'}</span>
                            <span className="font-mono text-[10px] text-[#00D2BE]">{nextSeason.race_date ? new Date(nextSeason.race_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' LOCAL' : 'TBD'}</span>
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-[#555] mb-1">
                                <Timer size={12} />
                                <span className="text-[10px] font-bold tracking-wider">CIRCUIT</span>
                            </div>
                            <span className="font-mono text-sm text-[#E0E0E0]">{nextSeason.circuit_length_km ? `${nextSeason.circuit_length_km} KM` : 'TBD'}</span>
                            <span className="font-mono text-[10px] text-[#00D2BE]">{nextSeason.laps ? `${nextSeason.laps} LAPS` : 'TBD'}</span>
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-[#555] mb-1">
                                <Trophy size={12} />
                                <span className="text-[10px] font-bold tracking-wider">DEFENDING</span>
                            </div>
                            <span className="font-mono text-sm text-[#E0E0E0]">TBD</span>
                            <span className="font-mono text-[10px] text-[#00D2BE]">DEFENDING</span>
                        </div>
                    </div>
                </div>

                {/* Albert Park Track SVG */}
                <div className="border-t border-[#333] p-4 flex items-center justify-center">
                    <svg viewBox="0 0 200 100" className="w-48 h-24 opacity-50 hover:opacity-100 transition-opacity">
                        {/* Albert Park Circuit simplified shape */}
                        <path
                            d="M 40 50 
                               Q 40 30, 60 30 
                               L 120 30 
                               Q 140 30, 150 45 
                               L 160 60 
                               Q 165 75, 150 80 
                               L 80 80 
                               Q 60 80, 50 70 
                               Q 40 60, 40 50 Z"
                            fill="none"
                            stroke="#00D2BE"
                            strokeWidth="2"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                        />
                        <line x1="50" y1="48" x2="50" y2="58" stroke="white" strokeWidth="2" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
