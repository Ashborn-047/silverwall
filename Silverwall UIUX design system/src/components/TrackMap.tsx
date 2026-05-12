import { getCircuitById } from '../data/tracks';

interface TrackMapProps {
  circuitId: number;
  width?: string;
  height?: string;
  showInfo?: boolean;
  className?: string;
}

export function TrackMap({
  circuitId,
  width = "100%",
  height = "auto",
  showInfo = false,
  className = ""
}: TrackMapProps) {
  const circuit = getCircuitById(circuitId);

  if (!circuit) {
    return (
      <div
        className={`flex items-center justify-center bg-[#0A0C10] border border-[#333] rounded ${className}`}
        style={{ width, height: height === "auto" ? "200px" : height }}
      >
        <span className="text-[#555] font-mono text-xs">NO TRACK DATA</span>
      </div>
    );
  }

  const { points, name, location } = circuit;

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
                {location} • {circuit.length_km} km • {circuit.corners} corners
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackMap;
