import React from 'react';
import { Play, Pause, RotateCcw, FastForward, Rewind } from 'lucide-react';

interface ReplayControlsProps {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    playbackRate: number;
    currentLap: number;
    totalLaps: number;
    progressPercent: number;
    onTogglePlay: () => void;
    onSeek: (time: number) => void;
    onSetSpeed: (rate: number) => void;
    onRestart: () => void;
    isLiveMode?: boolean;
    onSwitchToLive?: () => void;
}

function formatTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hrs > 0) {
        return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
}

export const ReplayControls: React.FC<ReplayControlsProps> = ({
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    currentLap,
    totalLaps,
    progressPercent,
    onTogglePlay,
    onSeek,
    onSetSpeed,
    onRestart,
    isLiveMode = false,
    onSwitchToLive,
}) => {
    const speeds = [1, 2, 5, 10];

    return (
        <div className="w-full bg-[#0A0C10]/95 backdrop-blur-md border-t border-[#00D2BE]/20 px-4 py-2 flex flex-col gap-2 z-30 select-none">
            {/* Top row: Timeline Scrubber */}
            <div className="flex items-center gap-3 w-full">
                <span className="font-mono text-[11px] text-[#9CA3AF] tabular-nums shrink-0">
                    {formatTime(currentTime)}
                </span>

                <div className="relative flex-1 flex items-center group">
                    {/* Background track */}
                    <div className="w-full h-1.5 bg-[#1F2937] rounded-full overflow-hidden relative cursor-pointer">
                        {/* Progress Fill */}
                        <div
                            className="h-full bg-gradient-to-r from-[#00D2BE]/80 to-[#00D2BE] rounded-full"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>

                    {/* Range input overlay */}
                    <input
                        type="range"
                        min={0}
                        max={duration}
                        step={1}
                        value={currentTime}
                        onChange={(e) => onSeek(parseFloat(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        aria-label="Replay timeline scrubber"
                    />
                </div>

                <span className="font-mono text-[11px] text-[#6B7280] tabular-nums shrink-0">
                    {formatTime(duration)}
                </span>
            </div>

            {/* Bottom row: Control Buttons */}
            <div className="flex items-center justify-between gap-4">
                {/* Left: Mode & Playback Transport */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onRestart}
                        title="Restart Replay"
                        className="p-1.5 text-[#9CA3AF] hover:text-[#00D2BE] hover:bg-[#00D2BE]/10 rounded transition-colors"
                        aria-label="Restart replay"
                    >
                        <RotateCcw size={14} />
                    </button>

                    <button
                        onClick={() => onSeek(Math.max(0, currentTime - 30))}
                        title="Rewind 30s"
                        className="p-1.5 text-[#9CA3AF] hover:text-[#00D2BE] hover:bg-[#00D2BE]/10 rounded transition-colors"
                        aria-label="Rewind 30s"
                    >
                        <Rewind size={14} />
                    </button>

                    {/* Primary Play/Pause Button */}
                    <button
                        onClick={onTogglePlay}
                        className={`
                            px-3 py-1 flex items-center gap-1.5 rounded-sm font-mono text-xs font-bold transition-all
                            ${isPlaying
                                ? 'bg-[#00D2BE]/20 text-[#00D2BE] border border-[#00D2BE]/40 shadow-[0_0_10px_rgba(0,210,190,0.2)]'
                                : 'bg-[#00D2BE] text-[#050608] hover:bg-[#00D2BE]/90 shadow-[0_0_15px_rgba(0,210,190,0.4)]'
                            }
                        `}
                        aria-label={isPlaying ? "Pause replay" : "Play replay"}
                    >
                        {isPlaying ? <Pause size={13} /> : <Play size={13} fill="currentColor" />}
                        <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
                    </button>

                    <button
                        onClick={() => onSeek(Math.min(duration, currentTime + 30))}
                        title="Fast-forward 30s"
                        className="p-1.5 text-[#9CA3AF] hover:text-[#00D2BE] hover:bg-[#00D2BE]/10 rounded transition-colors"
                        aria-label="Fast-forward 30s"
                    >
                        <FastForward size={14} />
                    </button>

                    {/* Speed Selector */}
                    <div className="flex items-center gap-1 bg-[#111827] border border-[#374151] rounded-sm p-0.5 ml-2">
                        {speeds.map((s) => (
                            <button
                                key={s}
                                onClick={() => onSetSpeed(s)}
                                className={`
                                    px-1.5 py-0.5 text-[10px] font-mono rounded-sm transition-colors
                                    ${playbackRate === s
                                        ? 'bg-[#00D2BE] text-[#050608] font-bold'
                                        : 'text-[#9CA3AF] hover:text-white'
                                    }
                                `}
                            >
                                {s}x
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Lap Badge & Live/Replay Toggle */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-[#00D2BE]/10 border border-[#00D2BE]/30 px-2.5 py-1 rounded-sm">
                        <span className="text-[10px] text-[#9CA3AF] font-mono uppercase tracking-wider">LAP</span>
                        <span className="font-mono text-xs font-bold text-[#00D2BE] tabular-nums">
                            {currentLap} <span className="text-[#6B7280] font-normal">/ {totalLaps}</span>
                        </span>
                    </div>

                    {isLiveMode && onSwitchToLive && (
                        <button
                            onClick={onSwitchToLive}
                            className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-sm font-mono text-[11px] transition-colors"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span>JUMP TO LIVE</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReplayControls;
