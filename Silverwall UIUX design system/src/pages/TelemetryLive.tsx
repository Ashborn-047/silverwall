import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Activity, Radio, Trophy, ZoomIn, ZoomOut, RotateCcw, Tag } from 'lucide-react';
import useBackendTelemetry from '../hooks/useBackendTelemetry';
import useSpacetimeTelemetry from '../hooks/useSpacetimeTelemetry';
import { useTrack, FrontendTrackPoint as TrackPoint } from '../hooks/useTrack';
import useSpacetimeStatus from '../hooks/useSpacetimeStatus';
import CountdownOverlay from '../components/CountdownOverlay';
import CommentaryPanel from '../components/CommentaryPanel';
import ResultsModal from '../components/ResultsModal';
import ReplayControls from '../components/ReplayControls';
import SessionSelector, { SelectedSession } from '../components/SessionSelector';
import useReplayEngine from '../hooks/useReplayEngine';
import { getCircuitById } from '../data/tracks';
import { OPENF1_TO_STATIC_ID } from '../components/TrackMap';

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
  speed?: number;
  gear?: number;
  tyre?: string;
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
  switch (compound?.toUpperCase()) {
    case 'SOFT':
      return '#FF1801';
    case 'MEDIUM':
      return '#FFD700';
    case 'HARD':
      return '#FFFFFF';
    case 'INTERMEDIATE':
      return '#39B54A';
    case 'WET':
      return '#00AEEF';
    default:
      return '#9CA3AF';
  }
}

function getTyreLetter(compound: string | undefined): string {
  switch (compound?.toUpperCase()) {
    case 'SOFT':
      return 'S';
    case 'MEDIUM':
      return 'M';
    case 'HARD':
      return 'H';
    case 'INTERMEDIATE':
      return 'I';
    case 'WET':
      return 'W';
    default:
      return '?';
  }
}

export default function TelemetryLive() {
  // Telemetry hooks: SpacetimeDB (primary cloud subscription) + backend WebSocket (optional/local)
  const { frame: wsFrame, status: wsStatus } = useBackendTelemetry();
  const { frame: stFrame, status: stStatus } = useSpacetimeTelemetry();

  const [selectedSession, setSelectedSession] = useState<SelectedSession | null>(null);
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showAllDriverTags, setShowAllDriverTags] = useState(true);

  // Race status from SpacetimeDB
  const raceStatus = useSpacetimeStatus();
  // Provide circuitId from selected session, active race, or default to Singapore (61)
  const circuitId = selectedSession?.circuitKey || (raceStatus.circuit ? parseInt(String(raceStatus.circuit), 10) :
    (raceStatus.nextSeason?.circuit ? parseInt(String(raceStatus.nextSeason.circuit), 10) : 61));

  // Resolve static circuit metadata for authentic circuit branding & geometry
  const staticId = OPENF1_TO_STATIC_ID[circuitId] || circuitId;
  const staticCircuit = getCircuitById(staticId);

  // Track hook - fetches directly from SpacetimeDB track_point table
  const { track, points: trackPoints } = useTrack(circuitId);

  // Active track points - prioritize live DB points, fall back to static circuit geometry
  const activeTrackPoints = useMemo(() => {
    return trackPoints.length > 0 ? trackPoints : (staticCircuit?.points || []);
  }, [trackPoints, staticCircuit]);

  // Replay Engine hook (60 FPS timeline playback clock with IndexedDB caching)
  const replayEngine = useReplayEngine(
    selectedSession?.sessionKey || 11388,
    activeTrackPoints,
    62
  );

  // Dynamically compute the optimal viewBox to eliminate all dead space
  // and expand the circuit to fill the maximum possible screen area
  const { viewBoxStr } = useMemo(() => {
    if (!activeTrackPoints || activeTrackPoints.length === 0) {
      return {
        viewBoxStr: `0 0 ${SVG_VIEWBOX} ${SVG_VIEWBOX}`
      };
    }

    const coords = activeTrackPoints.map(p => toSvgCoords(p.x, p.y));
    const minX = Math.min(...coords.map(c => c.cx));
    const maxX = Math.max(...coords.map(c => c.cx));
    const minY = Math.min(...coords.map(c => c.cy));
    const maxY = Math.max(...coords.map(c => c.cy));

    const w = maxX - minX;
    const h = maxY - minY;

    // Generous padding so car markers and driver tags don't clip at boundaries
    const padX = Math.max(w * 0.08, 45);
    const padY = Math.max(h * 0.12, 45);

    const baseVbW = w + 2 * padX;
    const baseVbH = h + 2 * padY;

    // Center of circuit bounding box
    const cX = minX + w / 2;
    const cY = minY + h / 2;

    // Apply interactive zoom if user zooms in
    const finalVbW = baseVbW / zoomLevel;
    const finalVbH = baseVbH / zoomLevel;
    const finalVbX = cX - finalVbW / 2;
    const finalVbY = cY - finalVbH / 2;

    return {
      viewBoxStr: `${Math.round(finalVbX)} ${Math.round(finalVbY)} ${Math.round(finalVbW)} ${Math.round(finalVbH)}`
    };
  }, [activeTrackPoints, zoomLevel]);

  // Telemetry frame resolution:
  // If user is playing/scrubbing replay, or viewing an ended past race, use replayEngine.frame
  const isReplaying = isReplayMode || replayEngine.isPlaying || replayEngine.currentTime > 0 || selectedSession?.status === 'ended';
  const liveWsFrame = wsFrame?.cars && wsFrame.cars.length > 0 ? wsFrame : null;
  const liveStFrame = stFrame?.cars && stFrame.cars.length > 0 ? stFrame : null;
  const liveFrame = liveWsFrame || liveStFrame;
  const frame = (isReplaying && replayEngine.frame) ? replayEngine.frame : (liveFrame || replayEngine.frame);

  const sessionTime = '--:--:--';
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Connection status
  const isConnected = wsStatus === 'connected' || stStatus === 'connected';
  const isWaiting = !isConnected && raceStatus.status !== 'live';

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
        speed: car.speed || 0,
        gear: car.gear || 0,
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

  return (
    <div className="flex flex-col h-screen bg-[#050608] text-[#E0E0E0] select-none overflow-hidden font-inter">
      {/* Countdown Overlay (Off-Season Fullscreen) */}
      {raceStatus.status === 'off_season' && <CountdownOverlay raceStatus={raceStatus} isFullScreen={true} />}

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

          {/* Session Selector Pill */}
          <SessionSelector
            currentSessionKey={selectedSession?.sessionKey || 11388}
            currentMeetingName={selectedSession?.meetingName || raceStatus.meetingName || 'Singapore Grand Prix'}
            onSelectSession={(sess) => {
              setSelectedSession(sess);
              setIsReplayMode(sess.status === 'ended');
              replayEngine.loadSession(sess.sessionKey);
            }}
          />

          {/* Session Context */}
          <div className="hidden lg:flex items-center gap-3 font-mono text-xs">
            <span className="text-[#E0E0E0] uppercase tracking-wider">
              {selectedSession?.sessionName || raceStatus.sessionName || 'RACE'}
            </span>
            <span className="text-[#333]">·</span>
            <span className="text-[#9CA3AF] uppercase">
              {raceStatus.meetingName || '—'}
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
                <span className="text-[#9CA3AF]">{raceStatus.nextSeason?.year || 'NEXT'} SEASON</span>
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
        <section className="relative bg-[#050608] flex items-center justify-center p-4 md:p-6 overflow-hidden">
          {/* Active Session Countdown Overlay */}
          {raceStatus.status === 'waiting' && <CountdownOverlay raceStatus={raceStatus} isFullScreen={false} />}

          {/* Background Grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle, #00D2BE 1px, transparent 1px)`,
              backgroundSize: '30px 30px'
            }}
          />

          {/* HUD Top Left: Track Technical Specs */}
          <div className="absolute top-4 left-4 z-10 hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#0A0C10]/85 backdrop-blur-md border border-[#00D2BE]/20 shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D2BE] animate-ping" />
              <span className="font-mono text-[11px] text-[#00D2BE] font-bold tracking-wider uppercase">
                {staticCircuit?.name || track?.name || `Circuit ${circuitId}`}
              </span>
              {staticCircuit?.length_km && (
                <span className="font-mono text-[10px] text-[#9CA3AF] pl-2 border-l border-white/10">
                  {staticCircuit.length_km} KM • {staticCircuit.corners} CORNERS
                </span>
              )}
            </div>
          </div>

          {/* HUD Top Right: Interactive Map Controls (Tags & Zoom) */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-[#0A0C10]/85 backdrop-blur-md border border-[#00D2BE]/20 rounded p-1 shadow-lg">
            <button
              onClick={() => setShowAllDriverTags(prev => !prev)}
              title={showAllDriverTags ? "Show Leaders Only" : "Show All Driver Tags"}
              className={`px-2.5 py-1 font-mono text-[10px] rounded transition-colors flex items-center gap-1.5 ${
                showAllDriverTags 
                  ? 'bg-[#00D2BE]/20 text-[#00D2BE] border border-[#00D2BE]/40' 
                  : 'text-[#9CA3AF] hover:text-[#E0E0E0] hover:bg-white/5'
              }`}
            >
              <Tag size={11} />
              <span>{showAllDriverTags ? 'ALL TAGS' : 'TOP 3'}</span>
            </button>

            <div className="h-4 w-[1px] bg-white/10 mx-0.5" />

            <button
              onClick={() => setZoomLevel(z => Math.max(1, Math.round((z - 0.25) * 100) / 100))}
              disabled={zoomLevel <= 1}
              title="Zoom Out"
              className="p-1.5 text-[#9CA3AF] hover:text-[#00D2BE] disabled:opacity-30 disabled:hover:text-[#9CA3AF] transition-colors rounded hover:bg-white/5"
            >
              <ZoomOut size={13} />
            </button>

            <span className="font-mono text-[10px] text-[#00D2BE] w-10 text-center font-bold">
              {zoomLevel.toFixed(1)}x
            </span>

            <button
              onClick={() => setZoomLevel(z => Math.min(2.5, Math.round((z + 0.25) * 100) / 100))}
              disabled={zoomLevel >= 2.5}
              title="Zoom In"
              className="p-1.5 text-[#9CA3AF] hover:text-[#00D2BE] disabled:opacity-30 disabled:hover:text-[#9CA3AF] transition-colors rounded hover:bg-white/5"
            >
              <ZoomIn size={13} />
            </button>

            {zoomLevel > 1 && (
              <button
                onClick={() => setZoomLevel(1)}
                title="Reset Zoom / Fit to Screen"
                className="p-1.5 text-[#00D2BE] hover:text-white transition-colors rounded hover:bg-white/5 ml-0.5"
              >
                <RotateCcw size={12} />
              </button>
            )}
          </div>

          {/* Track Map Container — Expands to fill available viewport space */}
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Dynamic Track from Backend + Real Car Positions */}
            <svg
              viewBox={viewBoxStr}
              className="w-full h-full max-h-[calc(100vh-210px)] object-contain drop-shadow-[0_0_18px_rgba(0,210,190,0.35)] transition-all duration-300"
            >
              {/* Track Path - from backend or fallback */}
              {activeTrackPoints.length > 0 ? (
                <>
                  {/* Track Border (Inner Glow/Outline) */}
                  <path
                    d={trackPointsToSvgPath(activeTrackPoints)}
                    fill="none"
                    stroke="#00D2BE"
                    strokeWidth="8"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    opacity="0.22"
                  />
                  {/* Main Track Line */}
                  <path
                    d={trackPointsToSvgPath(activeTrackPoints)}
                    fill="none"
                    stroke="#00D2BE"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    opacity="0.95"
                  />
                </>
              ) : (
                /* Fallback static track */
                <g>
                  <text x="500" y="480" textAnchor="middle" fill="#555" fontSize="14" fontFamily="monospace">NO TRACK DATA</text>
                  <text x="500" y="505" textAnchor="middle" fill="#333" fontSize="10" fontFamily="monospace">Waiting for geometry...</text>
                </g>
              )}

              {/* Start/Finish Line */}
              {activeTrackPoints.length > 0 && (() => {
                const startCoords = toSvgCoords(activeTrackPoints[0].x, activeTrackPoints[0].y);
                return (
                  <g>
                    <line
                      x1={startCoords.cx}
                      y1={startCoords.cy - 12}
                      x2={startCoords.cx}
                      y2={startCoords.cy + 12}
                      stroke="#FFFFFF"
                      strokeWidth="3"
                      strokeDasharray="4 2"
                    />
                    <text
                      x={startCoords.cx}
                      y={startCoords.cy - 16}
                      textAnchor="middle"
                      fill="#00D2BE"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      S/F
                    </text>
                  </g>
                );
              })()}

              {/* LIVE CARS */}
              {frame?.cars?.map((car, i) => {
                if (car.x === 0 && car.y === 0) return null;
                const coords = toSvgCoords(car.x, car.y);
                const isSelected = selectedDriver?.code === car.code;
                const teamColor = getDriverColor(car.code);
                const showBadge = showAllDriverTags || isSelected || i < 3;

                return (
                  <g
                    key={car.code}
                    className="cursor-pointer transition-all duration-300 ease-linear hover:opacity-100"
                    style={{ transform: `translate(${coords.cx}px, ${coords.cy}px)` }}
                    onClick={() => {
                      const d = leaderboard.find(l => l.code === car.code);
                      if (d) setSelectedDriver(d);
                    }}
                  >
                    {/* Driver Label */}
                    {showBadge && (
                      <g transform="translate(10, -10)">
                        <rect
                          x="-4"
                          y="-12"
                          width="30"
                          height="16"
                          rx="2"
                          fill="#0A0C10"
                          fillOpacity="0.85"
                          stroke={teamColor}
                          strokeWidth="1.2"
                        />
                        <text
                          x="11"
                          y="0"
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="9.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {car.code}
                        </text>
                      </g>
                    )}

                    {/* Car Dot */}
                    <circle
                      r={isSelected ? 7 : 5}
                      fill={teamColor}
                      stroke="#FFFFFF"
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      className="transition-all duration-300"
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="absolute bottom-6 right-6 text-right pointer-events-none">
            <h2 className="text-[#555] text-[11px] font-mono tracking-[0.25em] uppercase mb-0.5">
              {staticCircuit?.name || track?.name || `CIRCUIT ${circuitId}`}
            </h2>
            <h1 className="text-[#00D2BE] text-xl font-bold uppercase tracking-wider">
              {staticCircuit?.location || track?.location || '—'}
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
          REPLAY PLAYBACK CONTROLS
      ======================================================================== */}
      <ReplayControls
        isPlaying={replayEngine.isPlaying}
        currentTime={replayEngine.currentTime}
        duration={replayEngine.duration}
        playbackRate={replayEngine.playbackRate}
        currentLap={replayEngine.currentLap}
        totalLaps={replayEngine.totalLaps}
        progressPercent={replayEngine.progressPercent}
        onTogglePlay={() => {
          setIsReplayMode(true);
          replayEngine.togglePlay();
        }}
        onSeek={(time) => {
          setIsReplayMode(true);
          replayEngine.seekTo(time);
        }}
        onSetSpeed={replayEngine.setSpeed}
        onRestart={() => {
          setIsReplayMode(true);
          replayEngine.restart();
        }}
        isLiveMode={raceStatus.status === 'live'}
        onSwitchToLive={() => {
          setIsReplayMode(false);
          replayEngine.pause();
        }}
      />

      {/* Results Modal */}
      {showResults && <ResultsModal isOpen={true} onClose={() => setShowResults(false)} />}
    </div >
  );
}
