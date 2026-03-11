import { useState, useEffect } from 'react';
import { X, Trophy, Flag, Users, ChevronDown, ChevronUp, Crown, Timer, Clock } from 'lucide-react';
import { useSpacetime } from '../contexts/SpacetimeContext';
import useSpacetimeStatus, { CIRCUIT_METADATA } from '../hooks/useSpacetimeStatus';

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
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [driverStandings, setDriverStandings] = useState<Driver[]>([]);
    const [constructorStandings, setConstructorStandings] = useState<Constructor[]>([]);
    const [seasonRaces, setSeasonRaces] = useState<Race[]>([]);
    const [todayResult, setTodayResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [expandedRace, setExpandedRace] = useState<number | null>(null);

    const raceStatus = useSpacetimeStatus();
    const { conn, isReady } = useSpacetime();

    // Removed hardcoded local countdown. Realtime countdown handled by raceStatus.

    useEffect(() => {
        if (!isOpen || !isReady || !conn) return;

        const fetchData = async () => {
            setLoading(true);
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

            try {
                // Fetch Standings from SpacetimeDB natively
                const drivers = Array.from(conn.db.driver_standings.iter()).filter(d => d.seasonYear === selectedYear);
                const sortedDrivers = drivers.sort((a, b) => a.position - b.position).map(d => {
                    let color = '#FFFFFF';
                    const driverMeta = Array.from(conn.db.driver.iter()).find(dm => dm.driverNumber === d.driverNumber);
                    if (driverMeta && driverMeta.teamColor) {
                        color = driverMeta.teamColor.startsWith('#') ? driverMeta.teamColor : `#${driverMeta.teamColor}`;
                    }

                    const names = d.driverName.split(' ');
                    const lastName = names.length > 1 ? names[names.length - 1] : d.driverName;

                    return {
                        position: d.position,
                        code: lastName.substring(0, 3).toUpperCase(),
                        name: d.driverName,
                        team: d.team,
                        points: d.points,
                        color,
                    };
                });
                setDriverStandings(sortedDrivers);

                const constructors = Array.from(conn.db.constructor_standings.iter()).filter(c => c.seasonYear === selectedYear);
                const sortedConstructors = constructors.sort((a, b) => a.position - b.position).map(c => {
                    let color = '#FFFFFF';
                    const driverMeta = Array.from(conn.db.driver.iter()).find(dm => dm.team === c.team);
                    if (driverMeta && driverMeta.teamColor) {
                        color = driverMeta.teamColor.startsWith('#') ? driverMeta.teamColor : `#${driverMeta.teamColor}`;
                    }

                    return {
                        position: c.position,
                        team: c.team,
                        points: c.points,
                        color,
                        champion: c.position === 1,
                    };
                });
                setConstructorStandings(sortedConstructors);

                // Read Races directly from SpacetimeDB Table (Filters for Races and Sprints)
                const dbRaces = Array.from(conn.db.race.iter()).filter(r => 
                    r.seasonYear === selectedYear && (r.name === 'Race' || r.name === 'Sprint')
                );
                const sortedRaces = dbRaces.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                
                const mappedRaces = sortedRaces.map((r, idx) => {
                    const meta = CIRCUIT_METADATA[r.circuitKey];
                    return {
                        round: idx + 1,
                        name: r.name,
                        circuit: meta ? meta.name : `Circuit ${r.circuitKey}`,
                        date: r.date,
                        status: r.status,
                        podium: null // We rely entirely on SpacetimeDB now, historical podiums will be added in a future update
                    };
                });
                
                setSeasonRaces(mappedRaces);

                // Fetch Today Result from Python API (Fallback for now)
                try {
                    const resultsRes = await fetch(`${apiUrl}/api/results`).catch(() => null);
                    if (resultsRes && resultsRes.ok) {
                        const data = await resultsRes.json();
                        setTodayResult(data);
                    } else {
                        setTodayResult(null);
                    }
                } catch (e) {
                    console.error("API error for results", e);
                }

            } catch (error) {
                console.error('Failed to process modal data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isOpen, selectedYear, conn, isReady]);

    if (!isOpen) return null;

    // Dynamic tab label for Today's Race
    const getTodayTabLabel = () => {
        if (raceStatus.status === 'live') return 'Live Race';
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
                                        <h3 className="text-2xl font-bold text-white mb-2">{raceStatus.meetingName || "Upcoming Grand Prix"}</h3>
                                        <p className="text-[#9CA3AF] font-mono text-sm">{raceStatus.circuitName || (raceStatus.circuit ? `Circuit ${raceStatus.circuit}` : "TBD Circuit")}</p>
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
                                    ) : raceStatus.status === 'live' ? (
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
                                                Real-time Telemetry Active
                                            </div>
                                            <div className="text-[#9CA3AF] text-sm">
                                                Watch the live pit-wall for current status.
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
                                            <div className="text-[#FF8000] font-bold text-sm sm:text-lg mb-3 sm:mb-4 tracking-wide uppercase">
                                                {raceStatus.nextSession || "Next Session Scheduled"}
                                            </div>

                                            {/* Live Countdown */}
                                            {raceStatus.countdown ? (
                                                <div className="flex justify-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                                                    <div className="bg-[#1A1A1A] border border-[#00D2BE]/30 rounded-lg px-3 sm:px-6 py-2 sm:py-4">
                                                        <div className="text-2xl sm:text-4xl font-mono font-bold text-[#00D2BE]">{raceStatus.countdown.days}</div>
                                                        <div className="text-[8px] sm:text-[10px] text-[#9CA3AF] uppercase tracking-wider">Days</div>
                                                    </div>
                                                    <div className="text-xl sm:text-3xl text-[#00D2BE] self-center">:</div>
                                                    <div className="bg-[#1A1A1A] border border-[#00D2BE]/30 rounded-lg px-3 sm:px-6 py-2 sm:py-4">
                                                        <div className="text-2xl sm:text-4xl font-mono font-bold text-[#00D2BE]">{String(raceStatus.countdown.hours).padStart(2, '0')}</div>
                                                        <div className="text-[8px] sm:text-[10px] text-[#9CA3AF] uppercase tracking-wider">Hours</div>
                                                    </div>
                                                    <div className="text-xl sm:text-3xl text-[#00D2BE] self-center">:</div>
                                                    <div className="bg-[#1A1A1A] border border-[#00D2BE]/30 rounded-lg px-3 sm:px-6 py-2 sm:py-4">
                                                        <div className="text-2xl sm:text-4xl font-mono font-bold text-[#00D2BE]">{String(raceStatus.countdown.minutes).padStart(2, '0')}</div>
                                                        <div className="text-[8px] sm:text-[10px] text-[#9CA3AF] uppercase tracking-wider">Minutes</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-[#00D2BE]/50 font-mono tracking-widest uppercase">Waiting for session...</div>
                                            )}

                                            <div className="flex items-center justify-center gap-2 mt-6 text-[#9CA3AF] text-sm font-mono uppercase">
                                                <Clock size={14} />
                                                <span>Data Sync Ready for {raceStatus.meetingName || "Upcoming Event"}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Season Races Tab */}
                            {activeTab === 'season' && (
                                <div className="space-y-4">
                                    {renderSeasonSelector()}

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
                                    </div>
                                )}

                            {/* Constructors Championship Tab */}
                            {activeTab === 'constructors' && (
                                <div className="space-y-4">
                                    {renderSeasonSelector()}
                                        <div className="space-y-2">
                                            {/* Dynamic Constructor Title */}
                                            {constructorStandings.length > 0 && selectedYear < new Date().getFullYear() && (
                                                <div className="bg-gradient-to-r from-[#FFD700]/20 to-[#FFD700]/5 border border-[#FFD700]/50 rounded-lg p-4 mb-4 text-center">
                                                    <div className="text-2xl mb-2">🏆</div>
                                                    <div className="text-[#FFD700] font-bold text-lg">{constructorStandings[0]?.team}</div>
                                                    <div className="text-[#9CA3AF] text-sm font-mono">{selectedYear} CONSTRUCTORS' WORLD CHAMPIONS</div>
                                                </div>
                                            )}

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
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
