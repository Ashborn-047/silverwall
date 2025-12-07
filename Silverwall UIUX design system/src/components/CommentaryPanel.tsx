/**
 * CommentaryPanel - Live race commentary and event feed
 * Shows real-time events: overtakes, pit stops, radio, fastest laps
 */

import { useState, useEffect, useRef } from 'react';
import { Radio, Zap, Flag, Clock, Gauge, Swords, Volume2 } from 'lucide-react';

interface CommentaryEvent {
    id: string;
    type: 'overtake' | 'pit' | 'fastest_lap' | 'radio' | 'drs' | 'battle' | 'start';
    icon: string;
    message: string;
    driver?: string;
    timestamp: string;
    color: string;
}

interface CommentaryPanelProps {
    isConnected: boolean;
}

// Event type icons
const eventIcons: Record<string, React.ReactNode> = {
    overtake: <Zap size={14} className="text-[#00D2BE]" />,
    pit: <Flag size={14} className="text-[#FF3B30]" />,
    fastest_lap: <Clock size={14} className="text-[#BF5AF2]" />,
    radio: <Volume2 size={14} className="text-[#FFD60A]" />,
    drs: <Gauge size={14} className="text-[#30D158]" />,
    battle: <Swords size={14} className="text-[#FF9F0A]" />,
    start: <Flag size={14} className="text-white" />,
};

export default function CommentaryPanel({ isConnected }: CommentaryPanelProps) {
    const [events, setEvents] = useState<CommentaryEvent[]>([]);
    const feedRef = useRef<HTMLDivElement>(null);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // Fetch initial commentary history
    useEffect(() => {
        // Start with empty events - will fill when race starts
        setEvents([]);
    }, []);

    // Poll for new events
    useEffect(() => {
        if (!isConnected) return;

        const interval = setInterval(() => {
            // Poll API for new events
            fetch(`${apiUrl}/api/commentary?demo=false`)
                .then(res => res.json())
                .then(data => {
                    if (data.events?.length > 0) {
                        setEvents(prev => [...data.events, ...prev.slice(0, 19)]);
                    }
                })
                .catch(console.error);
        }, 3000); // Check every 3 seconds

        return () => clearInterval(interval);
    }, [isConnected, apiUrl]);

    // Auto-scroll to top when new event
    useEffect(() => {
        if (feedRef.current) {
            feedRef.current.scrollTop = 0;
        }
    }, [events]);

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    return (
        <div className="flex flex-col h-full bg-[#0A0C10] border-t border-[#00D2BE]/10">
            {/* Header */}
            <div className="sticky top-0 bg-[#00D2BE]/5 border-b border-[#00D2BE]/10 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Radio size={12} className="text-[#00D2BE]" />
                    <span className="text-[#00D2BE] font-mono text-[10px] font-bold tracking-widest uppercase">
                        Live Commentary
                    </span>
                </div>
                <div className={`flex items-center gap-2 text-[10px] font-mono ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    {isConnected ? 'LIVE' : 'OFFLINE'}
                </div>
            </div>

            {/* Event Feed */}
            <div
                ref={feedRef}
                className="flex-1 overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent"
            >
                {events.length === 0 ? (
                    <div className="p-6 text-center text-[#555] font-mono text-xs">
                        Waiting for race events...
                    </div>
                ) : (
                    <div className="divide-y divide-[#333]/30">
                        {events.map((event, index) => (
                            <div
                                key={event.id}
                                className={`px-4 py-3 flex items-start gap-3 transition-all duration-300 ${index === 0 ? 'bg-[#00D2BE]/5 animate-pulse' : ''
                                    } hover:bg-[#00D2BE]/5`}
                            >
                                {/* Icon */}
                                <div
                                    className="flex-shrink-0 w-6 h-6 rounded-sm flex items-center justify-center"
                                    style={{ backgroundColor: `${event.color}20` }}
                                >
                                    {eventIcons[event.type] || <Flag size={14} />}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-[#E0E0E0] leading-tight">
                                        {event.message}
                                    </p>
                                    <span className="text-[10px] text-[#555] font-mono">
                                        {formatTime(event.timestamp)}
                                    </span>
                                </div>

                                {/* Driver Badge */}
                                {event.driver && (
                                    <span
                                        className="flex-shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded-sm"
                                        style={{
                                            backgroundColor: `${event.color}20`,
                                            color: event.color
                                        }}
                                    >
                                        {event.driver}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-[#333]/30 px-4 py-2 flex items-center justify-between">
                <span className="text-[10px] text-[#555] font-mono">
                    {events.length} events
                </span>
                <span className="text-[10px] text-[#555] font-mono">
                    Auto-updating
                </span>
            </div>
        </div>
    );
}
