import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Wifi, ChevronRight, Activity, MapPin, Calendar, Clock } from 'lucide-react';
import useTelemetry from '../hooks/useTelemetry';
import { useTrack, TrackPoint } from '../hooks/useTrack';
import useRaceStatus from '../hooks/useRaceStatus';
import CountdownOverlay from '../components/CountdownOverlay';
import CommentaryPanel from '../components/CommentaryPanel';
import ResultsModal from '../components/ResultsModal';

// ============================================================================
// 🏎️ TELEMETRY LIVE VIEWER
// Engineering-grade F1 telemetry display matching AMG pit-wall aesthetics
// ============================================================================

interface Driver {
  position: number;
  code: string;
  gap: string;
  team: string;
  teamColor: string;
  tyre?: string; // 'SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'
  tyreAge?: number;
}

interface TelemetryData {
  throttle: number;
  brake: number;
  speed: number;
  gear: number;
  drs: boolean;
  rpm: number;
}

interface DriverTelemetry {
  code: string;
  throttle: number;
}

// SVG viewBox constants - MUST be consistent between track and cars
const SVG_VIEWBOX = 1000;
const SVG_MARGIN = 100;
const SVG_SCALE = SVG_VIEWBOX - 2 * SVG_MARGIN; // 800

// Convert normalized (0-1) coordinates to SVG coordinates
function toSvgCoords(x: number, y: number): { cx: number; cy: number } {
  return {
    cx: SVG_MARGIN + x * SVG_SCALE,
    cy: SVG_MARGIN + (1 - y) * SVG_SCALE  // Flip Y for SVG coordinate system
  };
}

// Convert track points to SVG path with proper scaling
function trackPointsToSvgPath(points: TrackPoint[]): string {
  if (!points || points.length < 2) return '';

  const scaledPoints = points.map(p => toSvgCoords(p.x, p.y));

  let d = `M ${scaledPoints[0].cx} ${scaledPoints[0].cy}`;
  for (let i = 1; i < scaledPoints.length; i++) {
    d += ` L ${scaledPoints[i].cx} ${scaledPoints[i].cy}`;
  }
  d += ' Z'; // Close the path

  return d;
}

// Helper for tyre colors
function getTyreColor(compound: string | undefined): string {
  if (!compound) return '#555'; // Unknown
  const c = compound.toUpperCase();
  if (c.includes('SOFT')) return '#FF3B3B'; // Red
  if (c.includes('MEDIUM')) return '#FFD700'; // Yellow
  if (c.includes('HARD')) return '#F0F0F0'; // White
  if (c.includes('INTER')) return '#00D2BE'; // Green/Teal
  if (c.includes('WET')) return '#0090FF'; // Blue
  return '#555';
}

function getTyreLetter(compound: string | undefined): string {
  if (!compound) return '?';
  const c = compound.toUpperCase();
  if (c.includes('SOFT')) return 'S';
  if (c.includes('MEDIUM')) return 'M';
  if (c.includes('HARD')) return 'H';
  if (c.includes('INTER')) return 'I';
  if (c.includes('WET')) return 'W';
  return '?';
}

export default function TelemetryLive() {
  // WebSocket telemetry hook
  const { frame, status } = useTelemetry();
  // Track hook - fetches from /track/current explicitly live
  const { track, points: trackPoints } = useTrack('abu_dhabi', true);
  // Race status from backend API
  const raceStatus = useRaceStatus();

  const sessionTime = '--:--:--';
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Connection status from hook
  const isConnected = status === 'connected';
  const isWaiting = status === 'waiting';

  // Get driver team colors map
  const teamColors: Record<string, string> = {
    'MER': '#00D2BE',
    'RBR': '#3671C6',
    'FER': '#DC0000',
    'MCL': '#FF8700',
    'AMR': '#006F62',
    'ALP': '#0090FF',
    'WIL': '#005AFF',
    'ALT': '#2B4562',
    'ALF': '#900000',
    'HAA': '#FFFFFF',
  };

  const teamNames: Record<string, string> = {
    'MER': 'Mercedes',
    'RBR': 'Red Bull Racing',
    'FER': 'Ferrari',
    'MCL': 'McLaren',
    'AMR': 'Aston Martin',
    'ALP': 'Alpine',
    'WIL': 'Williams',
    'ALT': 'AlphaTauri',
    'ALF': 'Alfa Romeo',
    'HAA': 'Haas',
  };

  // Transform WebSocket frame to leaderboard format
  const leaderboard = useMemo<Driver[]>(() => {
    // If we have real frame data, use it
    if (frame?.cars && frame.cars.length > 0) {
      return frame.cars.map((car: any, index: number) => ({
        position: car.position || index + 1,
        code: car.code,
        // Use real gap if available, otherwise fallback
        gap: car.gap || (index === 0 ? 'LEADER' : '--'),
        team: teamNames[car.team] || car.team || 'Unknown',
        teamColor: car.color || teamColors[car.team] || '#00D2BE',
        tyre: car.tyre,
        tyreAge: car.tyre_age
      }));
    }

    // Return empty if no data (waiting state)
    return [];
  }, [frame]);

  // Get selected car telemetry from frame
  const selectedCar = useMemo(() => {
    if (frame?.cars && selectedDriver) {
      return frame.cars.find(c => c.code === selectedDriver.code);
    }
    return null;
  }, [frame, selectedDriver]);

  // Telemetry data from selected car
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    throttle: 0,
    brake: 0,
    speed: 0,
    gear: 0,
    drs: false,
    rpm: 0,
  });

  // Update telemetry when frame changes
  useEffect(() => {
    if (selectedCar) {
      setTelemetry({
        throttle: selectedCar.throttle,
        brake: selectedCar.brake,
        speed: selectedCar.speed,
        gear: selectedCar.gear,
        drs: selectedCar.drs,
        rpm: Math.floor(selectedCar.speed * 35), // Approximation
      });
    }
  }, [selectedCar]);

  // Bottom bar telemetry from frame
  const driverTelemetry = useMemo<DriverTelemetry[]>(() => {
    if (frame?.cars && frame.cars.length > 0) {
      return frame.cars.slice(0, 4).map(car => ({
        code: car.code,
        throttle: car.throttle,
      }));
    }
    return [];
  }, [frame]);

  // Get driver color by code
  const getDriverColor = (code: string): string => {
    const driver = leaderboard.find(d => d.code === code);
    return driver?.teamColor || '#00D2BE';
  };

  // Select first driver by default
  useEffect(() => {
    if (!selectedDriver && leaderboard.length > 0) {
      setSelectedDriver(leaderboard[0]);
    }
  }, [leaderboard]);

  const isLive = raceStatus.status === 'live';
  const showCountdown = raceStatus.status === 'waiting' || raceStatus.status === 'off_season';

  return (
    <div className="flex flex-col h-screen bg-[#050608] text-[#E0E0E0] select-none overflow-hidden font-inter">
      {/* Countdown Overlay */}
      {showCountdown && <CountdownOverlay raceStatus={raceStatus} />}

      {/* ========================================================================
          TOP HEADER BAR
      ======================================================================== */}
      <header className="w-full border-b border-[#00D2BE]/10 px-3 sm:px-6 py-2 sm:py-3 flex flex-wrap items-center justify-between gap-2 bg-[#0A0C10]">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#00D2BE] transition-colors text-xs uppercase tracking-wider font-mono"
          >
            <ArrowLeft size={14} />
            <span className="hidden md:inline">Exit</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-1 h-5 bg-[#00D2BE]" />
            <h1 className="font-bold tracking-widest uppercase text-sm">
              SILVER<span className="text-[#00D2BE]">WALL</span>
            </h1>
          </div>

          {/* Session Context */}
          <div className="hidden md:flex items-center gap-3 font-mono text-xs">
            <span className="text-[#E0E0E0] uppercase tracking-wider">
              {raceStatus.sessionName || 'RACE'}
            </span>
            <span className="text-[#333]">·</span>
            <span className="text-[#9CA3AF] uppercase">
              {raceStatus.meetingName || 'Abu Dhabi GP'}
            </span>
            <span className="text-[#333] mx-2">|</span>

            {/* Show countdown or live status */}
            {isConnected && raceStatus.status === 'live' ? (
              <>
                <span className="text-[#9CA3AF]">SESSION</span>
                <span className="text-[#00D2BE] font-bold">{sessionTime}</span>
                <span className="text-[#333] mx-2">|</span>
                <span className="text-[#00D2BE] font-bold animate-pulse">LIVE</span>
              </>
            ) : raceStatus.status === 'waiting' ? (
              <>
                <span className="text-[#555]">WAITING</span>
                {raceStatus.countdown && (
                  <span className="text-[#00D2BE] font-bold ml-2">{raceStatus.countdown.text}</span>
                )}
              </>
            ) : raceStatus.status === 'off_season' ? (
              <>
                <span className="text-[#9CA3AF]">2026 SEASON</span>
                <span className="text-[#00D2BE] font-bold ml-2">
                  {raceStatus.nextSeason ? `${Math.floor(raceStatus.nextSeason.countdown_seconds / 86400)}D` : 'SOON'}
                </span>
              </>
            ) : raceStatus.status === 'ended' ? (
              <span className="text-[#555]">SEASON ENDED</span>
            ) : (
              <span className="text-[#555]">WAITING...</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1 rounded-sm border border-[#00D2BE]/20 bg-[#00D2BE]/5">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' :
              isWaiting ? 'bg-yellow-500' :
                'bg-red-500'
              }`} />
            <Radio size={12} className="text-[#00D2BE]" />
            <span className="text-[10px] font-mono tracking-wider text-[#00D2BE] uppercase">
              {isConnected ? 'Live' : isWaiting ? 'Waiting' : 'Offline'}
            </span>
          </div>

          {/* Results Button */}
          <button
            onClick={() => setShowResults(true)}
            className="flex items-center gap-2 px-3 py-1 rounded-sm border border-[#FFD700]/30 bg-[#FFD700]/10 hover:bg-[#FFD700]/20 transition-colors"
          >
            <Trophy size={12} className="text-[#FFD700]" />
            <span className="text-[10px] font-mono tracking-wider text-[#FFD700] uppercase">
              Results
            </span>
          </button>
        </div>
      </header>

      {/* ========================================================================
          MAIN GRID LAYOUT
      ======================================================================== */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr_320px] gap-0 overflow-hidden">

        {/* LEFT PANEL: LEADERBOARD */}
        <aside className="hidden md:block border-r border-[#00D2BE]/10 bg-[#0A0C10] overflow-y-auto">
          <div className="sticky top-0 bg-[#00D2BE]/5 border-b border-[#00D2BE]/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <Activity size={12} className="text-[#00D2BE]" />
              <span className="text-[#00D2BE] font-mono text-[10px] font-bold tracking-widest uppercase">
                Leaderboard
              </span>
            </div>
          </div>

          <div>
            {/* Show waiting message in live mode when no race data */}
            {leaderboard.length === 0 && (
              <div className="p-6 text-center">
                <div className="text-[#555] font-mono text-xs uppercase tracking-wider mb-2">
                  No Active Session
                </div>
                <div className="text-[#9CA3AF] text-sm">
                  Waiting for live race data...
                </div>
              </div>
            )}

            {leaderboard.map((driver) => {
              // Parse gap to check if ≤ 0.6 seconds
              const gapValue = driver.gap === '--' || driver.gap === 'LEADER' ? 999 : parseFloat(driver.gap.replace('+', '').replace('s', ''));
              const isCloseGap = gapValue <= 0.6;
              const tyreColor = getTyreColor(driver.tyre);
              const tyreLetter = getTyreLetter(driver.tyre);

              return (
                <button
                  key={driver.position}
                  onClick={() => setSelectedDriver(driver)}
                  className={`
                    w-full px-3 py-2 flex items-center justify-between 
                    hover:bg-[#00D2BE]/5 transition-colors text-left border-b border-[#333]/20
                    ${selectedDriver?.code === driver.code ? 'bg-[#00D2BE]/10 border-l-2 border-l-[#00D2BE]' : 'border-l-2 border-l-transparent'}
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-[11px] text-[#555] w-4 text-right">{driver.position}</span>
                    <div
                      className="w-[3px] h-5 shrink-0"
                      style={{ backgroundColor: driver.teamColor }}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono font-bold text-[13px] tracking-wide text-[#E0E0E0] truncate">{driver.code}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Tyre Indicator */}
                    {driver.tyre && (
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white/10" style={{ borderColor: tyreColor }}>
                        <span className="font-mono text-[10px] font-bold" style={{ color: tyreColor }}>{tyreLetter}</span>
                      </div>
                    )}

                    <span className={`font-mono text-[11px] tabular-nums w-12 text-right ${isCloseGap ? 'text-[#00D2BE]' : 'text-[#9CA3AF]'}`}>
                      {driver.gap}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Commentary Panel */}
          <CommentaryPanel isConnected={isConnected} />
        </aside>

        {/* CENTER PANEL: TRACK MAP */}
        <section className="relative bg-[#050608] flex items-center justify-center p-8">
          {/* Background Grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle, #00D2BE 1px, transparent 1px)`,
              backgroundSize: '30px 30px'
            }}
          />

          {/* Track Map Container */}
          <div className="relative w-full max-w-2xl aspect-[16/10] flex items-center justify-center">
            {/* Dynamic Track from Backend + Real Car Positions */}
            <svg viewBox={`0 0 ${SVG_VIEWBOX} ${SVG_VIEWBOX}`} className="w-full h-full drop-shadow-[0_0_12px_rgba(0,210,190,0.4)]">
              {/* Track Path - from backend or fallback */}
              {trackPoints.length > 0 ? (
                <>
                  {/* Track Border (Inner Glow/Outline) */}
                  <path
                    d={trackPointsToSvgPath(trackPoints)}
                    fill="none"
                    stroke="#00D2BE"
                    strokeWidth="8"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    opacity="0.2"
                  />
                  {/* Main Track Line */}
                  <path
                    d={trackPointsToSvgPath(trackPoints)}
                    fill="none"
                    stroke="#00D2BE"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                </>
              ) : (
                /* Fallback static track */
                <path
                  d="M 200 550 L 650 550 L 675 525 L 700 400 L 675 375 L 500 375 L 450 325 L 200 325 L 150 375 L 150 500 Z"
                  fill="none"
                  stroke="#00D2BE"
                  strokeWidth="4"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  opacity="0.8"
                />
              )}

              {/* Start/Finish Line */}
              {trackPoints.length > 0 && (() => {
                const startCoords = toSvgCoords(trackPoints[0].x, trackPoints[0].y);
                return (
                  <line
                    x1={startCoords.cx}
                    y1={startCoords.cy - 10}
                    x2={startCoords.cx}
                    y2={startCoords.cy + 10}
                    stroke="#FFFFFF"
                    strokeWidth="3"
                  />
                );
              })()}

              {/* LIVE CARS */}
              {frame?.cars?.map((car, i) => {
                const coords = toSvgCoords(car.x, car.y);
                const isSelected = selectedDriver?.code === car.code;
                const teamColor = getDriverColor(car.code);

                return (
                  <g key={car.code} className="transition-all duration-300 ease-linear" style={{ transform: `translate(${coords.cx}px, ${coords.cy}px)` }}>
                    {/* Driver Label (only for selected or top 3) */}
                    {(isSelected || i < 3) && (
                      <g transform="translate(10, -10)">
                        <rect x="-4" y="-12" width="30" height="16" rx="2" fill="#0A0C10" fillOpacity="0.8" stroke={teamColor} strokeWidth="1" />
                        <text x="11" y="0" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontFamily="monospace" fontWeight="bold">
                          {car.code}
                        </text>
                      </g>
                    )}

                    {/* Car Dot */}
                    <circle
                      r={isSelected ? 6 : 4}
                      fill={teamColor}
                      stroke="#FFFFFF"
                      strokeWidth={isSelected ? 2 : 1}
                      className="transition-all duration-300"
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="absolute bottom-8 right-8 text-right">
            <h2 className="text-[#555] text-xs font-mono tracking-[0.2em] uppercase mb-1">
              {track?.name || 'Yas Marina Circuit'}
            </h2>
            <h1 className="text-[#00D2BE] text-2xl font-bold uppercase tracking-wider">
              {track?.location || 'Abu Dhabi'}
            </h1>
          </div>
        </section>

        {/* RIGHT PANEL: SELECTED DRIVER TELEMETRY */}
        <aside className="hidden lg:flex border-l border-[#00D2BE]/10 bg-[#0A0C10] flex-col p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-[#E0E0E0]">{selectedDriver?.code || '---'}</h2>
              <p className="text-[#9CA3AF] text-xs uppercase tracking-wider">{selectedDriver?.team || 'SELECT DRIVER'}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-[#E0E0E0]">P{selectedDriver?.position || '-'}</div>
              {selectedDriver && selectedDriver.tyre && (
                <div className="mt-1 flex items-center justify-end gap-1">
                  <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: getTyreColor(selectedDriver.tyre) }} />
                  <span className="text-[10px] text-[#9CA3AF]">{selectedDriver.tyre}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[#00D2BE] text-xs uppercase tracking-widest">Active</span>
            </div>

            {/* DRS Status */}
            <div className="p-4 rounded border border-[#00D2BE]/20 bg-[#00D2BE]/5 flex items-center justify-between">
              <span className="text-[#9CA3AF] text-xs uppercase tracking-wider">DRS</span>
              <span className={`font-mono font-bold ${telemetry.drs ? 'text-[#00FF88]' : 'text-[#555]'}`}>
                {telemetry.drs ? 'OPEN' : 'CLOSED'}
              </span>
            </div>

            {/* Speed Gauge */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[#555] text-xs uppercase tracking-wider">Speed</span>
                <span className="text-[#E0E0E0] font-mono">{telemetry.speed} <span className="text-[#555] text-[10px]">km/h</span></span>
              </div>
              <div className="h-1 bg-[#333] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00D2BE] transition-all duration-300 ease-out"
                  style={{ width: `${(telemetry.speed / 360) * 100}%` }}
                />
              </div>
            </div>

            {/* Gear & RPM */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[#555] text-xs uppercase tracking-wider block mb-1">Gear</span>
                <div className="text-4xl font-mono font-bold text-[#00D2BE]">{telemetry.gear}</div>
              </div>
              <div className="text-right">
                <span className="text-[#555] text-xs uppercase tracking-wider block mb-1">RPM</span>
                <div className="text-xl font-mono text-[#E0E0E0]">{telemetry.rpm.toLocaleString()}</div>
              </div>
            </div>

            {/* Throttle & Brake */}
            <div className="space-y-4 pt-4 border-t border-[#333]/30">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#555] text-[10px] uppercase">Throttle</span>
                  <span className="text-[#E0E0E0] text-[10px] font-mono">{telemetry.throttle}%</span>
                </div>
                <div className="h-2 bg-[#333] rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-[#00D2BE] transition-all duration-100 ease-linear"
                    style={{ width: `${telemetry.throttle}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#555] text-[10px] uppercase">Brake</span>
                  <span className="text-[#E0E0E0] text-[10px] font-mono">{telemetry.brake}%</span>
                </div>
                <div className="h-2 bg-[#333] rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-100 ease-linear"
                    style={{ width: `${telemetry.brake}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>

      </main>

      {/* ========================================================================
          BOTTOM TELEMETRY BAR
      ======================================================================== */}
      <footer className="h-12 border-t border-[#00D2BE]/10 bg-[#050608] flex items-center px-6 gap-6 overflow-hidden">
        <div className="flex items-center gap-2 min-w-[120px]">
          <Wifi size={14} className="text-[#00D2BE]" />
          <span className="text-[#00D2BE] text-[10px] uppercase tracking-widest font-mono">Live Telemetry</span>
        </div>

        <div className="flex-1 flex items-center gap-8 overflow-x-auto no-scrollbar">
          {driverTelemetry.map((d) => (
            <div key={d.code} className="flex items-center gap-3 min-w-[140px]">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3" style={{ backgroundColor: getDriverColor(d.code) }} />
                <span className="text-[#9CA3AF] font-mono text-xs font-bold">{d.code}</span>
              </div>
              {/* Mini Throttle Bar */}
              <div className="flex-1 h-1.5 bg-[#333] rounded-full overflow-hidden w-24">
                <div
                  className="h-full bg-[#00D2BE]"
                  style={{ width: `${d.throttle}%` }}
                />
              </div>
              <span className="text-[#555] font-mono text-[10px] w-8 text-right">{d.throttle}%</span>
            </div>
          ))}
        </div>
      </footer>

      {/* Results Modal */}
      {showResults && <ResultsModal isOpen={true} onClose={() => setShowResults(false)} />}
    </div >
  );
}