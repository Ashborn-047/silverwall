import React from 'react';
import { Calendar, MapPin } from 'lucide-react';

interface CountdownOverlayProps {
    raceStatus: {
        status: string;
        message?: string;
        nextSeason?: {
            year: number;
            first_race: string;
            location: string;
            country: string;
            circuit: string;
            race_date: string;
            countdown_seconds: number;
        };
        countdown?: {
            days: number;
            hours: number;
            minutes: number;
            seconds: number;
            text: string;
        };
        meetingName?: string;
        nextSession?: string;
    }
}

const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ raceStatus }) => {
    const isOffSeason = raceStatus.status === 'off_season';

    // For off-season (2026)
    const nextSeason = raceStatus.nextSeason;
    const countdown = raceStatus.countdown;

    // Local countdown calculation if nextSeason is provided
    let localDays = countdown?.days ?? 0;
    let localHours = countdown?.hours ?? 0;
    let localMinutes = countdown?.minutes ?? 0;
    let localSeconds = countdown?.seconds ?? 0;

    if (isOffSeason && nextSeason) {
        const seconds = nextSeason.countdown_seconds;
        localDays = Math.floor(seconds / 86400);
        localHours = Math.floor((seconds % 86400) / 3600);
        localMinutes = Math.floor((seconds % 3600) / 60);
        localSeconds = seconds % 60;
    }

    const title = isOffSeason ? `PREPARING FOR ${nextSeason?.year} SEASON` : `COUNTDOWN TO ${raceStatus.nextSession}`;
    const subtitle = isOffSeason ? nextSeason?.first_race : raceStatus.meetingName;
    const location = isOffSeason ? `${nextSeason?.location}, ${nextSeason?.country}` : 'Yas Island, Abu Dhabi';

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#050608]/90 backdrop-blur-xl">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00D2BE]/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 text-center max-w-3xl px-6">
                {/* Status Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00D2BE]/30 bg-[#00D2BE]/10 mb-8">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00D2BE] animate-pulse" />
                    <span className="text-[#00D2BE] text-[10px] font-mono font-bold tracking-[0.2em] uppercase">{raceStatus.status.replace('_', ' ')}</span>
                </div>

                {/* Main Titles */}
                <h2 className="text-[#555] text-xs font-mono tracking-[0.4em] uppercase mb-4">{title}</h2>
                <h1 className="text-5xl md:text-7xl font-black text-[#E0E0E0] uppercase tracking-tighter mb-2 italic">
                    {subtitle}
                </h1>

                <div className="flex items-center justify-center gap-6 text-[#9CA3AF] mb-16">
                    <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-[#00D2BE]" />
                        <span className="text-sm font-medium tracking-wide">{location}</span>
                    </div>
                    {isOffSeason && (
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-[#00D2BE]" />
                            <span className="text-sm font-medium tracking-wide">MARCH 15, 2026</span>
                        </div>
                    )}
                </div>

                {/* Countdown Grid */}
                <div className="grid grid-cols-4 gap-4 md:gap-8 mb-16">
                    {[
                        { label: 'Days', value: localDays },
                        { label: 'Hours', value: localHours },
                        { label: 'Mins', value: localMinutes },
                        { label: 'Secs', value: localSeconds }
                    ].map((item) => (
                        <div key={item.label} className="relative group">
                            <div className="text-4xl md:text-6xl font-mono font-bold text-[#00D2BE] tabular-nums mb-1">
                                {String(item.value).padStart(2, '0')}
                            </div>
                            <div className="text-[10px] text-[#555] font-mono uppercase tracking-[0.2em]">
                                {item.label}
                            </div>
                            {/* Subtle divider */}
                            {item.label !== 'Secs' && (
                                <div className="absolute top-1/2 -right-2 md:-right-4 -translate-y-1/2 text-2xl text-[#333] font-mono">:</div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Action / Message */}
                <div className="p-8 rounded-2xl border border-[#00D2BE]/10 bg-[#0A0C10]/50 backdrop-blur-md">
                    <p className="text-[#9CA3AF] text-sm leading-relaxed mb-0">
                        {isOffSeason
                            ? "Regulation overhaul. New power units. Sustainable fuels. The next generation of Formula 1 begins here."
                            : "The next track session is approaching. Real-time data will resume automatically."}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CountdownOverlay;
