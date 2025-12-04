import React, { useState, useEffect } from 'react';
import { ArrowLeft, Radio, Wifi, Circle, Activity } from 'lucide-react';

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

export default function TelemetryLive({ onBack }: { onBack: () => void }) {
  const [sessionTime, setSessionTime] = useState('00:05:10');
  const [currentLap, setCurrentLap] = useState(3);
  const [totalLaps] = useState(58);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  // Mock leaderboard data (replace with WebSocket data)
  const [leaderboard, setLeaderboard] = useState<Driver[]>([
    { position: 1, code: 'HAM', gap: '--', team: 'Mercedes', teamColor: '#00D2BE' },
    { position: 2, code: 'VER', gap: '+0.5s', team: 'Red Bull Racing', teamColor: '#3671C6' },
    { position: 3, code: 'LEC', gap: '+1.2s', team: 'Ferrari', teamColor: '#DC0000' },
    { position: 4, code: 'SAI', gap: '+8.2s', team: 'Ferrari', teamColor: '#DC0000' },
    { position: 5, code: 'NOR', gap: '+8.5s', team: 'McLaren', teamColor: '#FF8700' },
    { position: 6, code: 'PER', gap: '+8.7s', team: 'Red Bull Racing', teamColor: '#3671C6' },
    { position: 7, code: 'RUS', gap: '+9.0s', team: 'Mercedes', teamColor: '#00D2BE' },
    { position: 8, code: 'ALO', gap: '+9.2s', team: 'Aston Martin', teamColor: '#006F62' },
  ]);

  // Mock telemetry data (replace with WebSocket data)
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    throttle: 98,
    brake: 0,
    speed: 310,
    gear: 8,
    drs: true,
    rpm: 11200,
  });

  // Mock bottom telemetry bar
  const [driverTelemetry, setDriverTelemetry] = useState<DriverTelemetry[]>([
    { code: 'HAM', throttle: 98 },
    { code: 'VER', throttle: 98 },
    { code: 'LEC', throttle: 98 },
    { code: 'SAI', throttle: 60 },
  ]);

  // Get driver color by code
  const getDriverColor = (code: string): string => {
    const driver = leaderboard.find(d => d.code === code);
    return driver?.teamColor || '#00D2BE';
  };

  // Session timer simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime((prev) => {
        const [min, sec] = prev.split(':').map(Number);
        const totalSec = min * 60 + sec + 1;
        const newMin = Math.floor(totalSec / 60);
        const newSec = totalSec % 60;
        return `${String(newMin).padStart(2, '0')}:${String(newSec).padStart(2, '0')}`;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Select first driver by default
  useEffect(() => {
    if (!selectedDriver && leaderboard.length > 0) {
      setSelectedDriver(leaderboard[0]);
    }
  }, [leaderboard]);

  // Simulate telemetry updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        throttle: Math.floor(Math.random() * 100),
        brake: Math.random() > 0.8 ? Math.floor(Math.random() * 100) : 0,
        speed: 250 + Math.floor(Math.random() * 80),
        gear: Math.floor(Math.random() * 8) + 1,
      }));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleBack = () => {
    onBack();
  };

  return (
    <div className="h-screen bg-[#050608] text-[#E0E0E0] font-sans flex flex-col overflow-hidden">
      
      {/* ========================================================================
          TOP HEADER BAR
      ======================================================================== */}
      <header className="w-full border-b border-[#00D2BE]/10 px-6 py-3 flex items-center justify-between bg-[#0A0C10]">
        <div className="flex items-center gap-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#00D2BE] transition-colors text-xs uppercase tracking-wider font-mono"
          >
            <ArrowLeft size={14} />
            <span className="hidden md:inline">Exit</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 bg-[#00D2BE]" />
            <h1 className="font-bold tracking-widest uppercase text-sm">
              SILVER<span className="text-[#00D2BE]">WALL</span>
            </h1>
          </div>

          {/* Session Context */}
          <div className="hidden md:flex items-center gap-3 font-mono text-xs">
            <span className="text-[#E0E0E0] uppercase tracking-wider">RACE</span>
            <span className="text-[#333]">·</span>
            <span className="text-[#9CA3AF] uppercase">Abu Dhabi GP</span>
            <span className="text-[#333] mx-2">|</span>
            <span className="text-[#9CA3AF]">LAP</span>
            <span className="text-[#00D2BE] font-bold">{currentLap}</span>
            <span className="text-[#555]">/</span>
            <span className="text-[#9CA3AF]">{totalLaps}</span>
            <span className="text-[#333] mx-2">|</span>
            <span className="text-[#9CA3AF]">TIME</span>
            <span className="text-[#00D2BE] font-bold">{sessionTime}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-sm border border-[#00D2BE]/20 bg-[#00D2BE]/5">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <Radio size={12} className="text-[#00D2BE]" />
            <span className="text-[10px] font-mono tracking-wider text-[#00D2BE] uppercase">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </header>

      {/* ========================================================================
          MAIN GRID LAYOUT
      ======================================================================== */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-0 overflow-hidden">
        
        {/* LEFT PANEL: LEADERBOARD */}
        <aside className="border-r border-[#00D2BE]/10 bg-[#0A0C10] overflow-y-auto">
          <div className="sticky top-0 bg-[#00D2BE]/5 border-b border-[#00D2BE]/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <Activity size={12} className="text-[#00D2BE]" />
              <span className="text-[#00D2BE] font-mono text-[10px] font-bold tracking-widest uppercase">
                Leaderboard
              </span>
            </div>
          </div>

          <div>
            {leaderboard.map((driver) => {
              // Parse gap to check if ≤ 0.6 seconds
              const gapValue = driver.gap === '--' ? 999 : parseFloat(driver.gap.replace('+', '').replace('s', ''));
              const isCloseGap = gapValue <= 0.6;
              
              return (
                <button
                  key={driver.position}
                  onClick={() => setSelectedDriver(driver)}
                  className={`
                    w-full px-4 py-2 flex items-center justify-between 
                    hover:bg-[#00D2BE]/5 transition-colors text-left border-b border-[#333]/20
                    ${selectedDriver?.code === driver.code ? 'bg-[#00D2BE]/10 border-l-2 border-l-[#00D2BE]' : 'border-l-2 border-l-transparent'}
                    ${isCloseGap && driver.position > 1 ? 'ring-1 ring-inset ring-[#00D2BE]/30' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-[#555] w-3">{driver.position}</span>
                    <div
                      className="w-[3px] h-5"
                      style={{ backgroundColor: driver.teamColor }}
                    />
                    <span className="font-mono font-bold text-[13px] tracking-wide text-[#E0E0E0]">{driver.code}</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#9CA3AF] tabular-nums">{driver.gap}</span>
                </button>
              );
            })}
          </div>
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
            {/* Yas Marina Circuit */}
            <svg viewBox="0 0 400 300" className="w-full h-full drop-shadow-[0_0_12px_rgba(0,210,190,0.4)]">
              {/* Main Track */}
              <path 
                d="M 80 220 L 260 220 L 270 210 L 280 160 L 270 150 L 200 150 L 180 130 L 80 130 L 60 150 L 60 200 Z 
                   M 80 220 L 60 200 L 50 200 L 40 160 L 60 150
                   M 260 220 L 300 220 L 320 200 L 320 100 L 300 80 L 240 80 L 230 90 L 230 110 L 200 150"
                fill="none" 
                stroke="#00D2BE" 
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              
              {/* DRS Zone 1 - Main Straight */}
              <line 
                x1="260" y1="220" 
                x2="280" y2="180" 
                stroke="#9CA3AF" 
                strokeWidth="2" 
                strokeDasharray="4 3"
                opacity="0.3"
              />
              
              {/* DRS Zone 2 - Back Straight */}
              <line 
                x1="300" y1="80" 
                x2="320" y2="120" 
                stroke="#9CA3AF" 
                strokeWidth="2" 
                strokeDasharray="4 3"
                opacity="0.3"
              />
              
              {/* Start/Finish Line */}
              <line x1="280" y1="210" x2="280" y2="230" stroke="white" strokeWidth="4" />
              
              {/* Car 1 (HAM) - Trail + Marker */}
              <line 
                x1="280" y1="160" 
                x2="272" y2="168" 
                stroke="#00D2BE" 
                strokeWidth="1.5" 
                opacity="0.4"
                strokeLinecap="round"
              />
              <circle cx="280" cy="160" r="6" fill="#00D2BE" className="animate-pulse" />
              
              {/* Car 2 (VER) - Trail + Marker */}
              <line 
                x1="200" y1="150" 
                x2="192" y2="154" 
                stroke="#3671C6" 
                strokeWidth="1.5" 
                opacity="0.4"
                strokeLinecap="round"
              />
              <circle cx="200" cy="150" r="5" fill="#3671C6" opacity="0.8" />
              
              {/* Car 3 (LEC) - Trail + Marker */}
              <line 
                x1="180" y1="130" 
                x2="172" y2="133" 
                stroke="#DC0000" 
                strokeWidth="1.5" 
                opacity="0.4"
                strokeLinecap="round"
              />
              <circle cx="180" cy="130" r="5" fill="#DC0000" opacity="0.8" />
            </svg>

            {/* Track Label */}
            <div className="absolute bottom-4 right-4 text-right">
              <div className="text-[10px] font-mono text-[#555] uppercase tracking-wider">
                Yas Marina Circuit
              </div>
              <div className="text-xs font-bold text-[#00D2BE] tracking-wide">
                ABU DHABI
              </div>
            </div>

            {/* Corner Labels */}
            <div className="absolute top-4 left-4 text-[8px] font-mono text-[#00D2BE] opacity-50 space-y-1">
              <div>SECTOR 1 | SECTOR 2 | SECTOR 3</div>
            </div>
            
            {/* DRS Zone Labels */}
            <div className="absolute top-1/2 right-8 text-[8px] font-mono text-[#9CA3AF] opacity-40">
              DRS
            </div>
          </div>
        </section>

        {/* RIGHT PANEL: DRIVER TELEMETRY */}
        <aside className="border-l border-[#00D2BE]/10 bg-[#0A0C10] overflow-y-auto">
          {selectedDriver && (
            <>
              {/* Driver Header */}
              <div className="sticky top-0 bg-[#00D2BE]/5 border-b border-[#00D2BE]/10 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-1 h-8"
                      style={{ backgroundColor: selectedDriver.teamColor }}
                    />
                    <div>
                      <h3 className="font-bold text-lg tracking-wide">{selectedDriver.code}</h3>
                      <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">
                        {selectedDriver.team}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-2xl font-bold">P{selectedDriver.position}</div>
                    <div className="text-[10px] text-[#00D2BE] font-mono">{selectedDriver.gap}</div>
                  </div>
                </div>
              </div>

              {/* Telemetry Data */}
              <div className="p-4 space-y-6">
                {/* Status Badge */}
                <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-sm">
                  <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                  <span className="text-xs font-mono tracking-wider text-green-500 uppercase">
                    Active
                  </span>
                </div>

                {/* DRS Status */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#555] uppercase tracking-wider font-bold">DRS</span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-sm ${
                      telemetry.drs 
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                        : 'bg-[#333]/30 text-[#555] border border-[#333]'
                    }`}>
                      {telemetry.drs ? 'OPEN' : 'CLOSED'}
                    </span>
                  </div>
                </div>

                {/* Speed */}
                <TelemetryDisplay 
                  label="Speed"
                  value={telemetry.speed.toString()}
                  unit="km/h"
                  max={340}
                  current={telemetry.speed}
                />

                {/* Gear */}
                <div className="space-y-2">
                  <div className="text-[10px] text-[#555] uppercase tracking-wider font-bold">Gear</div>
                  <div className="font-mono text-4xl font-bold text-[#00D2BE]">{telemetry.gear}</div>
                </div>

                {/* RPM */}
                <TelemetryDisplay 
                  label="RPM"
                  value={telemetry.rpm.toLocaleString()}
                  unit=""
                  max={12000}
                  current={telemetry.rpm}
                />

                {/* Throttle */}
                <TelemetryDisplay 
                  label="Throttle"
                  value={telemetry.throttle.toString()}
                  unit="%"
                  max={100}
                  current={telemetry.throttle}
                  color="#00D2BE"
                />

                {/* Brake */}
                <TelemetryDisplay 
                  label="Brake"
                  value={telemetry.brake.toString()}
                  unit="%"
                  max={100}
                  current={telemetry.brake}
                  color="#FF3B30"
                />
              </div>
            </>
          )}
        </aside>
      </main>

      {/* ========================================================================
          BOTTOM TELEMETRY BAR
      ======================================================================== */}
      <footer className="w-full border-t border-[#00D2BE]/10 bg-[#0A0C10] px-6 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi size={12} className="text-[#00D2BE]" />
            <span className="text-[10px] font-mono text-[#555] uppercase tracking-wider">
              Live Telemetry
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            {driverTelemetry.map((driver) => {
              const driverColor = getDriverColor(driver.code);
              // Calculate number of filled bars (out of 10)
              const filledBars = Math.round((driver.throttle / 100) * 10);
              
              return (
                <div key={driver.code} className="flex items-center gap-2">
                  {/* Driver colored dot */}
                  <div 
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: driverColor }}
                  />
                  
                  {/* Driver code */}
                  <span className="font-mono text-[11px] text-[#9CA3AF] w-8">{driver.code}</span>
                  
                  {/* Separator */}
                  <span className="text-[#333]">|</span>
                  
                  {/* Engineering-style bar graph */}
                  <div className="flex items-center gap-[2px]">
                    {Array.from({ length: 10 }).map((_, index) => (
                      <div
                        key={index}
                        className={`w-[3px] h-2.5 ${
                          index < filledBars ? 'bg-[#00D2BE]' : 'bg-[#333]/50'
                        }`}
                      />
                    ))}
                  </div>
                  
                  {/* Percentage */}
                  <span className="font-mono text-[10px] text-[#00D2BE] w-8 text-right tabular-nums">
                    {driver.throttle}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// 🧩 TELEMETRY DISPLAY COMPONENT
// ============================================================================
const TelemetryDisplay = ({ 
  label, 
  value, 
  unit, 
  max, 
  current, 
  color = '#00D2BE' 
}: { 
  label: string; 
  value: string; 
  unit: string; 
  max: number; 
  current: number; 
  color?: string;
}) => {
  const percentage = (current / max) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#555] uppercase tracking-wider font-bold">{label}</span>
        <span className="font-mono text-sm text-[#E0E0E0]">
          {value}<span className="text-[10px] text-[#9CA3AF] ml-1">{unit}</span>
        </span>
      </div>
      <div className="w-full h-1.5 bg-[#333]/30 rounded-full overflow-hidden">
        <div 
          className="h-full transition-all duration-300"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: color 
          }}
        />
      </div>
    </div>
  );
};