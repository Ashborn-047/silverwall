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

  const { points, svg_transform, name, location } = circuit;

  // Generate SVG path from points
  const pathD = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ${points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')} Z`
    : '';

  return (
    <div className={`relative ${className}`} style={{ width }}>
      <div 
        className="relative w-full bg-[#0A0C10] border border-[#00D2BE]/20 rounded overflow-hidden"
        style={{ aspectRatio: '16/10' }}
      >
        {/* Decorative Corner Markers */}
        <div className="absolute top-2 left-2 w-3 h-3 border-l border-t border-[#00D2BE]/50" />
        <div className="absolute top-2 right-2 w-3 h-3 border-r border-t border-[#00D2BE]/50" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-l border-b border-[#00D2BE]/50" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-r border-b border-[#00D2BE]/50" />

        <div className="absolute inset-0 flex items-center justify-center p-4">
          {points.length > 0 ? (
            <svg
              viewBox="0 0 1.1 1.1"
              className="max-w-full max-h-full drop-shadow-[0_0_8px_rgba(0,210,190,0.3)]"
              style={{ 
                transform: svg_transform,
                width: 'auto',
                height: '85%'
              }}
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Main Track Path */}
              <path
                d={pathD}
                fill="none"
                stroke="#00D2BE"
                strokeWidth="0.015"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Secondary Track Line */}
              <path
                d={pathD}
                fill="none"
                stroke="white"
                strokeWidth="0.002"
                opacity="0.3"
              />

              {/* Start/Finish Point */}
              <circle 
                cx={points[0].x} 
                cy={points[0].y} 
                r="0.012" 
                fill="white"
                className="drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]"
              />

              {/* S/F Label */}
              <text 
                x={points[0].x + 0.025} 
                y={points[0].y} 
                fill="white" 
                fontSize="0.035"
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
          <div className="absolute bottom-3 left-3 right-3">
            <div className="bg-[#050608]/80 backdrop-blur-sm border border-[#00D2BE]/20 rounded px-3 py-2">
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
