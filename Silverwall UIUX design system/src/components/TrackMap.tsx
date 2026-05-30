import { useTrack } from '../hooks/useTrack';
import { getCircuitById } from '../data/tracks';

interface TrackMapProps {
  circuitId: number;
  width?: string;
  height?: string;
  showInfo?: boolean;
  className?: string;
}

const OPENF1_TO_STATIC_ID: Record<number, number> = {
  63: 63, // bahrain
  49: 49, // shanghai
  23: 23, // montreal
  2: 10,  // melbourne
  22: 73, // baku
  7: 15,  // catalunya
  39: 9,  // silverstone
  4: 4,   // hungaroring
  14: 14, // monza
  27: 61, // singapore
  29: 69, // austin
  21: 18, // interlagos
  9: 24,  // yas_marina
  24: 78, // qatar
  10: 80, // vegas
  12: 76, // jeddah
  11: 79, // miami
  13: 21, // imola
  18: 6,  // monaco
  15: 70, // red_bull_ring
  17: 55, // zandvoort
  26: 32, // mexico_city
  8: 77,  // suzuka
};

export function TrackMap({
  circuitId,
  width = "100%",
  height = "auto",
  showInfo = false,
  className = ""
}: TrackMapProps) {
  const { track, points: dbPoints, loading } = useTrack(circuitId);

  // Resolve static metadata if available
  const staticId = OPENF1_TO_STATIC_ID[circuitId] || circuitId;
  const staticCircuit = getCircuitById(staticId);

  // Use SpacetimeDB points if available, otherwise fall back to static local files
  const points = dbPoints.length > 0 ? dbPoints : (staticCircuit?.points || []);

  if (loading && points.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-[#0A0C10] border border-[#00D2BE]/20 rounded ${className}`}
        style={{ width, height: height === "auto" ? "200px" : height }}
      >
        <span className="text-[#00D2BE] font-mono text-xs animate-pulse">LOADING GEOMETRY...</span>
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-[#0A0C10] border border-[#333] rounded ${className}`}
        style={{ width, height: height === "auto" ? "200px" : height }}
      >
        <span className="text-[#555] font-mono text-xs">NO TRACK DATA</span>
      </div>
    );
  }

  const name = staticCircuit?.name || track?.name || `Circuit ${circuitId}`;
  const location = staticCircuit?.location || track?.location || '';
  const length_km = staticCircuit?.length_km || '';
  const corners = staticCircuit?.corners || '';

  // Generate SVG path from points
  const pathD = points.length > 0
    ? `M ${points[0].x} ${points[0].y} ${points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')} Z`
    : '';

  // Calculate dynamic viewBox with padding
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const trackWidth = maxX - minX;
  const trackHeight = maxY - minY;
  const padding = 0.05; // 5% padding
  const viewBoxX = minX - padding * trackWidth;
  const viewBoxY = minY - padding * trackHeight;
  const viewBoxW = trackWidth * (1 + 2 * padding);
  const viewBoxH = trackHeight * (1 + 2 * padding);

  // Calculate aspect ratio and clamp it
  const aspectRatio = trackWidth / trackHeight;
  const clampedAspectRatio = Math.max(0.5, Math.min(3.5, aspectRatio));

  // Scale stroke width based on track size
  const strokeWidth = 0.015 / Math.sqrt(trackWidth * trackHeight);

  return (
    <div className={`relative ${className}`} style={{ width }}>
      <div
        className="relative w-full bg-[#0A0C10] border border-[#00D2BE]/20 rounded overflow-hidden"
        style={{ aspectRatio: `${clampedAspectRatio}` }}
      >
        {/* Decorative Corner Markers */}
        <div className="absolute top-2 left-2 w-3 h-3 border-l border-t border-[#00D2BE]/50" />
        <div className="absolute top-2 right-2 w-3 h-3 border-r border-t border-[#00D2BE]/50" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-l border-b border-[#00D2BE]/50" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-r border-b border-[#00D2BE]/50" />

        <div className="absolute inset-0 flex items-center justify-center p-3 pb-16">
          {points.length > 0 ? (
            <svg
              viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxW} ${viewBoxH}`}
              className="max-w-full max-h-full drop-shadow-[0_0_8px_rgba(0,210,190,0.3)]"
              style={{ width: '100%', height: '100%' }}
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Main Track Path */}
              <path
                d={pathD}
                fill="none"
                stroke="#00D2BE"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Secondary Track Line */}
              <path
                d={pathD}
                fill="none"
                stroke="white"
                strokeWidth={strokeWidth * 0.15}
                opacity="0.3"
              />

              {/* Start/Finish Point */}
              <circle
                cx={points[0].x}
                cy={points[0].y}
                r={strokeWidth * 0.8}
                fill="white"
                className="drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]"
              />

              {/* S/F Label */}
              <text
                x={points[0].x + strokeWidth * 1.5}
                y={points[0].y}
                fill="white"
                fontSize={strokeWidth * 2.5}
                className="font-mono"
                style={{ fontFamily: 'monospace' }}
              >
                S/F
              </text>
            </svg>
          ) : (
            <div className="text-red-500/50 font-mono text-xs">GEOMETRY_ERROR</div>
          )}
        </div>

        {/* Circuit Info Overlay */}
        {showInfo && (
          <div className="absolute bottom-0 left-0 right-0">
            <div className="bg-[#050608]/90 backdrop-blur-sm border-t border-[#00D2BE]/20 px-3 py-2">
              <div className="text-[#E0E0E0] font-semibold text-xs uppercase tracking-wider">
                {name}
              </div>
              <div className="text-[#9CA3AF] font-mono text-[10px]">
                {location} {length_km ? `• ${length_km} km` : ''} {corners ? `• ${corners} corners` : ''}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackMap;
