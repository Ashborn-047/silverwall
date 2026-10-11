import React, { useState, useMemo } from 'react';
import { ChevronDown, Calendar, MapPin, Search, X, Check } from 'lucide-react';
import { useSpacetime } from '../contexts/SpacetimeContext';

export interface SelectedSession {
    sessionKey: number;
    circuitKey: number;
    meetingName: string;
    sessionName: string;
    location: string;
    year: number;
    status: 'live' | 'ended' | 'upcoming';
}

interface SessionSelectorProps {
    currentSessionKey?: number | null;
    currentMeetingName?: string;
    onSelectSession: (session: SelectedSession) => void;
}

export const SessionSelector: React.FC<SessionSelectorProps> = ({
    currentSessionKey,
    currentMeetingName = 'Singapore Grand Prix',
    onSelectSession,
}) => {
    const { conn, isReady } = useSpacetime();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSeason, setSelectedSeason] = useState<number>(2026);

    // Fetch races from SpacetimeDB
    const races = useMemo(() => {
        if (!conn || !isReady) return [];
        return Array.from(conn.db.race.iter())
            .filter((r: any) => r.name === 'Race' || !r.name)
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [conn, isReady]);

    // Available seasons
    const availableSeasons = [2026, 2025, 2024];

    // Filtered races for active season and search query
    const filteredRaces = useMemo(() => {
        return races.filter((r: any) => {
            const matchesSeason = (r.seasonYear || 2026) === selectedSeason;
            if (!matchesSeason) return false;

            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                (r.meetingName && r.meetingName.toLowerCase().includes(q)) ||
                (r.location && r.location.toLowerCase().includes(q)) ||
                (r.name && r.name.toLowerCase().includes(q))
            );
        });
    }, [races, selectedSeason, searchQuery]);

    const handleSelect = (r: any) => {
        onSelectSession({
            sessionKey: r.raceKey,
            circuitKey: r.circuitKey || 61,
            meetingName: r.meetingName || 'Grand Prix',
            sessionName: r.name || 'Race',
            location: r.location || '',
            year: r.seasonYear || 2026,
            status: r.status as any
        });
        setIsOpen(false);
    };

    return (
        <div className="relative select-none">
            {/* Header Trigger Pill */}
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-sm border border-[#00D2BE]/30 bg-[#00D2BE]/10 hover:bg-[#00D2BE]/20 transition-all text-left"
                aria-expanded={isOpen}
                aria-haspopup="dialog"
                aria-label="Select F1 Grand Prix or Replay session"
            >
                <div className="flex flex-col">
                    <span className="text-[9px] font-mono tracking-widest text-[#9CA3AF] uppercase">
                        SESSION ARCHIVE
                    </span>
                    <span className="font-mono text-xs font-bold text-[#E0E0E0] truncate max-w-[200px] md:max-w-[260px]">
                        {currentMeetingName}
                    </span>
                </div>
                <ChevronDown
                    size={14}
                    className={`text-[#00D2BE] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown / Modal Menu */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Popover Card */}
                    <div className="absolute left-0 mt-2 w-[340px] md:w-[420px] bg-[#0A0C10] border border-[#00D2BE]/30 rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50 flex flex-col max-h-[500px] overflow-hidden">
                        {/* Header & Search */}
                        <div className="p-3 border-b border-[#1F2937] bg-[#111827]/80 flex flex-col gap-2.5">
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold text-[#00D2BE] uppercase tracking-wider">
                                    Grand Prix Replay Selector
                                </span>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-[#9CA3AF] hover:text-white"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            {/* Search bar */}
                            <div className="relative flex items-center">
                                <Search size={13} className="absolute left-2.5 text-[#6B7280]" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by Grand Prix, circuit, or city..."
                                    className="w-full bg-[#050608] border border-[#374151] rounded-sm pl-8 pr-3 py-1 text-xs text-white placeholder-[#6B7280] focus:outline-none focus:border-[#00D2BE]"
                                />
                            </div>

                            {/* Season Tabs */}
                            <div className="flex items-center gap-1 bg-[#050608] p-0.5 rounded-sm border border-[#1F2937]">
                                {availableSeasons.map(yr => (
                                    <button
                                        key={yr}
                                        onClick={() => setSelectedSeason(yr)}
                                        className={`flex-1 py-1 font-mono text-[11px] rounded-sm transition-colors ${
                                            selectedSeason === yr
                                                ? 'bg-[#00D2BE] text-[#050608] font-bold'
                                                : 'text-[#9CA3AF] hover:text-white'
                                        }`}
                                    >
                                        {yr}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Race Items List */}
                        <div className="overflow-y-auto flex-1 divide-y divide-[#1F2937]/50 max-h-[350px]">
                            {filteredRaces.length === 0 ? (
                                <div className="p-6 text-center text-xs font-mono text-[#6B7280]">
                                    No races found matching "{searchQuery}"
                                </div>
                            ) : (
                                filteredRaces.map((r: any) => {
                                    const isSelected = r.raceKey === currentSessionKey;
                                    const raceDate = new Date(r.date).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric'
                                    });

                                    return (
                                        <button
                                            key={r.raceKey}
                                            onClick={() => handleSelect(r)}
                                            className={`
                                                w-full px-3 py-2.5 flex items-center justify-between text-left transition-colors
                                                hover:bg-[#00D2BE]/10
                                                ${isSelected ? 'bg-[#00D2BE]/15 border-l-2 border-l-[#00D2BE]' : 'border-l-2 border-l-transparent'}
                                            `}
                                        >
                                            <div className="flex flex-col min-w-0 pr-2">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-xs font-bold text-white truncate">
                                                        {r.meetingName || `${r.location} GP`}
                                                    </span>
                                                    {isSelected && <Check size={12} className="text-[#00D2BE] shrink-0" />}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-[#9CA3AF] font-mono mt-0.5">
                                                    <span className="flex items-center gap-0.5">
                                                        <MapPin size={9} />
                                                        {r.location || `Circuit ${r.circuitKey}`}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-0.5">
                                                        <Calendar size={9} />
                                                        {raceDate}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="shrink-0">
                                                {r.status === 'live' ? (
                                                    <span className="px-1.5 py-0.5 bg-red-500/20 border border-red-500/40 text-red-400 font-mono text-[9px] font-bold rounded-sm animate-pulse">
                                                        LIVE
                                                    </span>
                                                ) : r.status === 'ended' ? (
                                                    <span className="px-1.5 py-0.5 bg-[#00D2BE]/10 border border-[#00D2BE]/30 text-[#00D2BE] font-mono text-[9px] rounded-sm">
                                                        REPLAY
                                                    </span>
                                                ) : (
                                                    <span className="px-1.5 py-0.5 bg-gray-800 text-gray-400 font-mono text-[9px] rounded-sm">
                                                        UPCOMING
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default SessionSelector;
