import { useState, useEffect } from 'react';
import { X, Trophy, Flag, Users, ChevronDown, ChevronUp, Crown, Timer, Flame, Swords, Rocket, Clock } from 'lucide-react';

interface Driver {
    position: number;
    code: string;
    name: string;
    team: string;
    points: number;
    color: string;
}

interface Constructor {
    position: number;
    team: string;
    points: number;
    color: string;
    champion?: boolean;
}

interface RacePodium {
    pos: number;
    code: string;
    name: string;
}

interface Race {
    round: number;
    name: string;
    circuit: string;
    date: string;
    podium: RacePodium[] | null;
    status?: string;
}

interface ResultsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type TabType = 'today' | 'season' | 'drivers' | 'constructors';

export default function ResultsModal({ isOpen, onClose }: ResultsModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>('today');
    const [selectedYear, setSelectedYear] = useState<number>(2025);
    const [driverStandings, setDriverStandings] = useState<Driver[]>([]);
    const [constructorStandings, setConstructorStandings] = useState<Constructor[]>([]);
    const [seasonRaces, setSeasonRaces] = useState<Race[]>([]);
    const [todayResult, setTodayResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [expandedRace, setExpandedRace] = useState<number | null>(null);
    const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0, isLive: false, isPast: false });

    // Race time: 18:30 IST = 13:00 UTC on Dec 7, 2025
    const RACE_TIME = new Date('2025-12-07T13:00:00Z');
    const RACE_DURATION_MS = 2 * 60 * 60 * 1000; // ~2 hours for race

    // Live countdown effect
    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date();
            const diff = RACE_TIME.getTime() - now.getTime();
            const raceEndTime = RACE_TIME.getTime() + RACE_DURATION_MS;

            if (diff > 0) {
                // Race hasn't started
                setCountdown({
                    hours: Math.floor(diff / (1000 * 60 * 60)),
                    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((diff % (1000 * 60)) / 1000),
                    isLive: false,
                    isPast: false
                });
            } else if (now.getTime() < raceEndTime) {
                // Race is in progress
                setCountdown({ hours: 0, minutes: 0, seconds: 0, isLive: true, isPast: false });
            } else {
                // Race has ended
                setCountdown({ hours: 0, minutes: 0, seconds: 0, isLive: false, isPast: true });
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const fetchData = async () => {
            setLoading(true);
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

            try {
                // Fetch all data in parallel
                const [driversRes, constructorsRes, racesRes, resultsRes] = await Promise.all([
                    fetch(`${apiUrl}/api/standings/drivers/${selectedYear}`),
                    fetch(`${apiUrl}/api/standings/constructors/${selectedYear}`),
                    fetch(`${apiUrl}/api/season/races/${selectedYear}`),
                    fetch(`${apiUrl}/api/results`),
                ]);

                if (driversRes.ok) {
                    const data = await driversRes.json();
                    setDriverStandings(data.standings || []);
                }
                if (constructorsRes.ok) {
                    const data = await constructorsRes.json();
                    setConstructorStandings(data.standings || []);
                }
                if (racesRes.ok) {
                    const data = await racesRes.json();
                    setSeasonRaces(data.races || []);
                }
                if (resultsRes.ok) {
                    const data = await resultsRes.json();
                    setTodayResult(data);
                }
            } catch (error) {
                console.error('Failed to fetch standings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isOpen, selectedYear]);

    if (!isOpen) return null;

    // Dynamic tab label for Today's Race
    const getTodayTabLabel = () => {
        if (countdown.isLive) return 'Live Race';
        if (todayResult?.podium) return 'Last Race';
        return 'Next Race';
    };

    const tabs = [
        { id: 'today' as TabType, label: getTodayTabLabel(), icon: <Flag size={14} /> },
        { id: 'season' as TabType, label: 'Season Races', icon: <Trophy size={14} /> },
        { id: 'drivers' as TabType, label: 'Drivers', icon: <Crown size={14} /> },
        { id: 'constructors' as TabType, label: 'Constructors', icon: <Users size={14} /> },
    ];

    const renderSeasonSelector = () => (
        <div className="flex justify-center gap-2 mb-4">
            {[2024, 2025, 2026].map((year) => (
                <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-4 py-1.5 rounded-full text-xs font-mono transition-colors ${selectedYear === year
                        ? 'bg-[#00D2BE] text-black font-bold'
                        : 'bg-[#1A1A1A] text-[#9CA3AF] hover:bg-[#333] border border-[#333]'
                        }`}
                >
                    {year}
                </button>
            ))}
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] mx-2 sm:mx-4 bg-[#0A0C10] border border-[#00D2BE]/30 rounded-lg overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 bg-[#00D2BE]/10 border-b border-[#00D2BE]/20">
                    <div className="flex items-center gap-3">
                        <Trophy className="text-[#00D2BE]" size={20} />
                        <h2 className="text-sm sm:text-lg font-bold tracking-wider uppercase text-white">
                            This Season Results
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[#00D2BE]/20 rounded-sm transition-colors"
                    >
                        <X size={20} className="text-[#9CA3AF]" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto border-b border-[#333] scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 font-mono text-[10px] sm:text-xs uppercase tracking-wider transition-colors whitespace-nowrap
                                ${activeTab === tab.id
                                    ? 'text-[#00D2BE] border-b-2 border-[#00D2BE] bg-[#00D2BE]/5'
                                    : 'text-[#9CA3AF] hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {tab.icon}
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-140px)] p-3 sm:p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-pulse text-[#00D2BE] font-mono">Loading...</div>
                        </div>
                    ) : (
                        <>
                            {/* Today's Race Tab */}
                            {activeTab === 'today' && (
                                <div className="space-y-6">
                                    <div className="text-center mb-8">
                                        <h3 className="text-2xl font-bold text-white mb-2">Abu Dhabi Grand Prix</h3>
                                        <p className="text-[#9CA3AF] font-mono text-sm">Round 24 • Season Finale • TITLE DECIDER</p>
                                    </div>

                                    {/* Title Fight Banner */}
                                    <div className="bg-gradient-to-r from-[#FF8000]/20 via-[#3671C6]/20 to-[#FF8000]/20 border border-[#00D2BE]/30 rounded-lg p-4 mb-6">
                                        <div className="flex items-center justify-center gap-2 font-mono text-sm text-[#00D2BE] uppercase tracking-wider mb-2">
                                            <Trophy size={16} className="text-[#FFD700]" />
                                            <span>THREE-WAY TITLE FIGHT</span>
                                            <Trophy size={16} className="text-[#FFD700]" />
                                        </div>
                                        <div className="flex justify-center gap-8 text-sm">
                                            <div className="text-center">
                                                <span className="text-[#FF8000] font-bold">NOR</span>
                                                <span className="text-[#9CA3AF] ml-2">408 pts</span>
                                            </div>
                                            <div className="text-center">
                                                <span className="text-[#3671C6] font-bold">VER</span>
                                                <span className="text-[#9CA3AF] ml-2">396 pts</span>
                                            </div>
                                            <div className="text-center">
                                                <span className="text-[#FF8000] font-bold">PIA</span>
                                                <span className="text-[#9CA3AF] ml-2">392 pts</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Podium OR Countdown */}
                                    {todayResult?.podium ? (
                                        <div className="flex justify-center items-end gap-2 sm:gap-4 py-4 sm:py-8">
                                            {/* P2 */}
                                            <div className="text-center">
                                                <div className="w-16 sm:w-24 h-14 sm:h-20 bg-[#C0C0C0]/20 border border-[#C0C0C0]/50 rounded-t-lg flex items-center justify-center">
                                                    <span className="text-xl sm:text-3xl font-bold text-[#C0C0C0]">2</span>
                                                </div>
                                                <div className="bg-[#1A1A1A] p-2 sm:p-3 border border-[#333] rounded-b-lg">
                                                    <div className="text-sm sm:text-lg font-bold" style={{ color: todayResult.podium[1]?.color }}>
                                                        {todayResult.podium[1]?.code}
                                                    </div>
                                                    <div className="text-[8px] sm:text-[10px] text-[#9CA3AF] truncate max-w-[60px] sm:max-w-none">{todayResult.podium[1]?.name}</div>
                                                </div>
                                            </div>
                                            {/* P1 */}
                                            <div className="text-center">
                                                <div className="w-20 sm:w-28 h-20 sm:h-28 bg-[#FFD700]/20 border border-[#FFD700]/50 rounded-t-lg flex items-center justify-center">
                                                    <span className="text-2xl sm:text-4xl font-bold text-[#FFD700]">1</span>
                                                </div>
                                                <div className="bg-[#1A1A1A] p-2 sm:p-3 border border-[#FFD700]/30 rounded-b-lg">
                                                    <div className="text-base sm:text-xl font-bold" style={{ color: todayResult.podium[0]?.color }}>
                                                        {todayResult.podium[0]?.code}
                                                    </div>
                                                    <div className="text-[8px] sm:text-xs text-[#9CA3AF] truncate max-w-[70px] sm:max-w-none">{todayResult.podium[0]?.name}</div>
                                                </div>
                                            </div>
                                            {/* P3 */}
                                            <div className="text-center">
                                                <div className="w-16 sm:w-24 h-12 sm:h-16 bg-[#CD7F32]/20 border border-[#CD7F32]/50 rounded-t-lg flex items-center justify-center">
                                                    <span className="text-lg sm:text-2xl font-bold text-[#CD7F32]">3</span>
                                                </div>
                                                <div className="bg-[#1A1A1A] p-2 sm:p-3 border border-[#333] rounded-b-lg">
                                                    <div className="text-sm sm:text-lg font-bold" style={{ color: todayResult.podium[2]?.color }}>
                                                        {todayResult.podium[2]?.code}
                                                    </div>
                                                    <div className="text-[8px] sm:text-[10px] text-[#9CA3AF] truncate max-w-[60px] sm:max-w-none">{todayResult.podium[2]?.name}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : countdown.isLive ? (
                                        // Race is in progress
                                        <div className="text-center py-12">
                                            <div className="flex justify-center gap-2 mb-4">
                                                <Flag size={48} className="text-[#00D2BE] animate-pulse" />
                                            </div>
                                            <div className="flex items-center justify-center gap-2 text-[#FF4444] font-mono uppercase tracking-wider text-xl mb-2 animate-pulse">
                                                <div className="w-3 h-3 rounded-full bg-[#FF4444] animate-pulse" />
                                                <span>RACE IN PROGRESS</span>
                                                <div className="w-3 h-3 rounded-full bg-[#FF4444] animate-pulse" />
                                            </div>
                                            <div className="text-[#00D2BE] text-lg mb-4">
                                                History is being written at Yas Marina!
                                            </div>
                                            <div className="text-[#9CA3AF] text-sm">
                                                Who will be crowned 2025 World Champion?
                                            </div>
                                        </div>
                                    ) : (
                                        // Countdown to race
                                        <div className="text-center py-8">
                                            <div className="flex justify-center gap-3 mb-6">
                                                <Timer size={40} className="text-[#00D2BE]" />
                                                <Flag size={40} className="text-[#9CA3AF]" />
                                            </div>

                                            {/* Catchy tagline */}
                                            <div className="text-[#FF8000] font-bold text-sm sm:text-lg mb-3 sm:mb-4 tracking-wide">
                                                THE SHOWDOWN OF THE CENTURY
                                            </div>

                                            {/* Live Countdown */}
                                            <div className="flex justify-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                                                <div className="bg-[#1A1A1A] border border-[#00D2BE]/30 rounded-lg px-3 sm:px-6 py-2 sm:py-4">
                                                    <div className="text-2xl sm:text-4xl font-mono font-bold text-[#00D2BE]">{countdown.hours}</div>
                                                    <div className="text-[8px] sm:text-[10px] text-[#9CA3AF] uppercase tracking-wider">Hours</div>
                                                </div>
                                                <div className="text-xl sm:text-3xl text-[#00D2BE] self-center">:</div>
                                                <div className="bg-[#1A1A1A] border border-[#00D2BE]/30 rounded-lg px-3 sm:px-6 py-2 sm:py-4">
                                                    <div className="text-2xl sm:text-4xl font-mono font-bold text-[#00D2BE]">{String(countdown.minutes).padStart(2, '0')}</div>
                                                    <div className="text-[8px] sm:text-[10px] text-[#9CA3AF] uppercase tracking-wider">Minutes</div>
                                                </div>
                                                <div className="text-xl sm:text-3xl text-[#00D2BE] self-center">:</div>
                                                <div className="bg-[#1A1A1A] border border-[#00D2BE]/30 rounded-lg px-3 sm:px-6 py-2 sm:py-4">
                                                    <div className="text-2xl sm:text-4xl font-mono font-bold text-[#00D2BE]">{String(countdown.seconds).padStart(2, '0')}</div>
                                                    <div className="text-[8px] sm:text-[10px] text-[#9CA3AF] uppercase tracking-wider">Seconds</div>
                                                </div>
                                            </div>

                                            {/* Drama lines */}
                                            <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                                                <div className="flex items-center justify-center gap-2 text-white">
                                                    <Flame size={14} className="text-[#FF8000]" />
                                                    <span><span className="text-[#FF8000]">Norris</span> leads by just <span className="text-[#00D2BE] font-bold">12 points</span></span>
                                                </div>
                                                <div className="flex items-center justify-center gap-2 text-white">
                                                    <Swords size={14} className="text-[#3671C6]" />
                                                    <span><span className="text-[#3671C6]">Verstappen</span> hungry for his 5th title</span>
                                                </div>
                                                <div className="flex items-center justify-center gap-2 text-white">
                                                    <Rocket size={14} className="text-[#FF8000]" />
                                                    <span><span className="text-[#FF8000]">Piastri</span> just <span className="text-[#00D2BE] font-bold">4 points</span> behind Max</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-center gap-2 mt-6 text-[#9CA3AF] text-sm font-mono">
                                                <Clock size={14} />
                                                <span>LIGHTS OUT AT 18:30 IST</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Season Races Tab */}
                            {activeTab === 'season' && (
                                <div className="space-y-4">
                                    {renderSeasonSelector()}

                                    {selectedYear === 2026 && (
                                        <div className="text-center py-8 mb-4 border border-[#00D2BE]/30 rounded-lg bg-[#00D2BE]/5">
                                            <Trophy className="w-8 h-8 mx-auto mb-2 text-[#00D2BE]" />
                                            <div className="text-lg font-bold text-white mb-1">2026 Season Schedule</div>
                                            <div className="text-[#9CA3AF] text-sm">Season starts March 2026</div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        {seasonRaces.map((race) => (
                                            <div
                                                key={race.round}
                                                className={`border rounded-lg overflow-hidden ${race.status === 'live'
                                                    ? 'border-[#00D2BE] bg-[#00D2BE]/5'
                                                    : 'border-[#333] hover:border-[#555]'
                                                    }`}
                                            >
                                                <button
                                                    onClick={() => setExpandedRace(expandedRace === race.round ? null : race.round)}
                                                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <span className="font-mono text-[#555] text-sm w-8">R{race.round}</span>
                                                        <div>
                                                            <div className="font-medium text-white text-sm">{race.name}</div>
                                                            <div className="text-[10px] text-[#9CA3AF]">{race.circuit}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {race.status === 'live' && (
                                                            <span className="px-2 py-0.5 bg-[#FF4444]/20 text-[#FF4444] text-[10px] font-mono rounded uppercase flex items-center gap-1">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-[#FF4444] animate-pulse" />
                                                                Live
                                                            </span>
                                                        )}
                                                        {race.status === 'upcoming' && (
                                                            <span className="px-2 py-0.5 bg-[#FFD700]/20 text-[#FFD700] text-[10px] font-mono rounded uppercase">
                                                                Upcoming
                                                            </span>
                                                        )}
                                                        {race.podium && (
                                                            <div className="flex gap-2 text-xs font-mono">
                                                                <span className="flex items-center gap-1" style={{ color: '#FFD700' }}>
                                                                    <Crown size={12} /> {race.podium[0].code}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {expandedRace === race.round ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </div>
                                                </button>
                                                {expandedRace === race.round && race.podium && (
                                                    <div className="px-4 py-3 bg-[#0A0C10] border-t border-[#333]">
                                                        <div className="grid grid-cols-3 gap-4">
                                                            {race.podium.map((p, i) => (
                                                                <div key={i} className="text-center">
                                                                    <div className={`text-lg ${i === 0 ? 'text-[#FFD700]' : i === 1 ? 'text-[#C0C0C0]' : 'text-[#CD7F32]'}`}>
                                                                        P{p.pos}
                                                                    </div>
                                                                    <div className="font-bold text-white">{p.code}</div>
                                                                    <div className="text-[10px] text-[#9CA3AF] truncate">{p.name}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Drivers Championship Tab */}
                            {activeTab === 'drivers' && (
                                <div className="space-y-4">
                                    {renderSeasonSelector()}
                                    {selectedYear === 2026 ? (
                                        <div className="text-center py-12 text-[#9CA3AF]">
                                            <Timer className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <div className="text-xl font-bold text-white mb-2">2026 Season Coming Soon</div>
                                            <div>New regulations. New cars. New drama.</div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {driverStandings.map((driver, index) => (
                                                <div
                                                    key={driver.code}
                                                    className={`flex items-center justify-between px-4 py-3 rounded-lg border ${index < 3
                                                        ? 'border-[#00D2BE]/30 bg-[#00D2BE]/5'
                                                        : 'border-[#333] hover:border-[#555]'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <span className={`font-mono text-lg w-8 ${index === 0 ? 'text-[#FFD700]' :
                                                            index === 1 ? 'text-[#C0C0C0]' :
                                                                index === 2 ? 'text-[#CD7F32]' : 'text-[#555]'
                                                            }`}>
                                                            {driver.position}
                                                        </span>
                                                        <div
                                                            className="w-1 h-8 rounded-full"
                                                            style={{ backgroundColor: driver.color }}
                                                        />
                                                        <div>
                                                            <div className="font-bold text-white">{driver.code}</div>
                                                            <div className="text-[10px] text-[#9CA3AF]">{driver.team}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-mono font-bold text-[#00D2BE]">{driver.points}</div>
                                                        <div className="text-[10px] text-[#9CA3AF]">points</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Constructors Championship Tab */}
                            {activeTab === 'constructors' && (
                                <div className="space-y-4">
                                    {renderSeasonSelector()}
                                    {selectedYear === 2026 ? (
                                        <div className="text-center py-12 text-[#9CA3AF]">
                                            <Timer className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <div className="text-xl font-bold text-white mb-2">2026 Season Coming Soon</div>
                                            <div>New regulations. New cars. New drama.</div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {/* McLaren Champion Banner */}
                                            <div className="bg-gradient-to-r from-[#FF8000]/20 to-[#FF8000]/5 border border-[#FF8000]/50 rounded-lg p-4 mb-4 text-center">
                                                <div className="text-2xl mb-2">🏆</div>
                                                <div className="text-[#FF8000] font-bold text-lg">McLaren</div>
                                                <div className="text-[#9CA3AF] text-sm font-mono">{selectedYear} CONSTRUCTORS' WORLD CHAMPIONS</div>
                                            </div>

                                            {constructorStandings.map((team, index) => (
                                                <div
                                                    key={team.team}
                                                    className={`flex items-center justify-between px-4 py-3 rounded-lg border ${team.champion
                                                        ? 'border-[#FF8000]/50 bg-[#FF8000]/10'
                                                        : 'border-[#333] hover:border-[#555]'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <span className={`font-mono text-lg w-8 ${index === 0 ? 'text-[#FFD700]' :
                                                            index === 1 ? 'text-[#C0C0C0]' :
                                                                index === 2 ? 'text-[#CD7F32]' : 'text-[#555]'
                                                            }`}>
                                                            {team.position}
                                                        </span>
                                                        <div
                                                            className="w-1 h-8 rounded-full"
                                                            style={{ backgroundColor: team.color }}
                                                        />
                                                        <div className="font-bold text-white">{team.team}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-mono font-bold text-[#00D2BE]">{team.points}</div>
                                                        <div className="text-[10px] text-[#9CA3AF]">points</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
