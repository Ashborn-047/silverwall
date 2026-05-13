# SilverWall Telemetry Live Viewer — Integration Guide

## 📋 Overview
The live telemetry viewer is an engineering-grade F1 data visualization interface that displays real-time race data in a pit-wall style layout. It features a three-panel design: leaderboard, track map, and driver telemetry.

---

## 🎨 UI Architecture

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ TOP HEADER: Session info, connection status, navigation    │
├──────────┬────────────────────────────────┬─────────────────┤
│          │                                │                 │
│ LEFT:    │ CENTER:                        │ RIGHT:          │
│ Leader-  │ Track Map                      │ Driver          │
│ board    │ + Position Markers             │ Telemetry       │
│ (280px)  │ (Fluid)                        │ (320px)         │
│          │                                │                 │
├──────────┴────────────────────────────────┴─────────────────┤
│ BOTTOM BAR: Live telemetry comparison (throttle bars)      │
└─────────────────────────────────────────────────────────────┘
```

### Responsive Behavior
- **Desktop (≥1024px)**: Three-column layout as shown above
- **Tablet/Mobile (<1024px)**: Stacked layout (leaderboard → map → telemetry)

---

## 🔌 WebSocket Integration

### Current Implementation
The page currently uses **mock data** with simulated updates. Replace these with your OpenF1 WebSocket streams.

### Data Sources to Connect

#### 1. **Leaderboard Data**
```tsx
interface Driver {
  position: number;
  code: string;        // "HAM", "VER", etc.
  gap: string;         // "+1.5s" or "--" for leader
  team: string;        // "Mercedes"
  teamColor: string;   // Hex color: "#00D2BE"
}

// Replace this mock data:
const [leaderboard, setLeaderboard] = useState<Driver[]>([...]);

// With WebSocket updates:
websocket.on('position', (data) => {
  setLeaderboard(data.positions);
});
```

#### 2. **Driver Telemetry Data**
```tsx
interface TelemetryData {
  throttle: number;    // 0-100
  brake: number;       // 0-100
  speed: number;       // km/h
  gear: number;        // 1-8
  drs: boolean;        // true/false
  rpm: number;         // 0-12000
}

// Replace mock simulation:
websocket.on('telemetry', (driverCode: string, data: TelemetryData) => {
  if (selectedDriver?.code === driverCode) {
    setTelemetry(data);
  }
});
```

#### 3. **Bottom Telemetry Bar**
```tsx
interface DriverTelemetry {
  code: string;
  throttle: number;
}

// Update for all drivers:
websocket.on('throttle_update', (data: DriverTelemetry[]) => {
  setDriverTelemetry(data);
});
```

#### 4. **Session Timer**
```tsx
// Replace the simulated timer with real session time:
websocket.on('session_time', (time: string) => {
  setSessionTime(time); // Format: "00:15:23"
});
```

---

## 🎯 Key Features

### 1. **Live Connection Status**
```tsx
const [isConnected, setIsConnected] = useState(true);

// Update based on WebSocket state:
websocket.on('connect', () => setIsConnected(true));
websocket.on('disconnect', () => setIsConnected(false));
```

The header shows:
- 🟢 Green pulse + "Live Stream" when connected
- 🔴 Red dot + "Disconnected" when offline

### 2. **Driver Selection**
Click any driver in the leaderboard to view their telemetry in the right panel.

```tsx
const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

// Auto-select leader on load:
useEffect(() => {
  if (!selectedDriver && leaderboard.length > 0) {
    setSelectedDriver(leaderboard[0]);
  }
}, [leaderboard]);
```

### 3. **Real-Time Telemetry Displays**
Each telemetry metric includes:
- **Label** (uppercase, 10px, gray)
- **Value** (monospace font, large)
- **Progress bar** (visual percentage representation)

Custom component: `<TelemetryDisplay />`

### 4. **Track Map with Position Markers**
Animated SVG showing:
- Circuit outline (Yas Marina in example)
- Driver position markers (colored dots)
- Start/finish line
- Sector labels

Update positions:
```tsx
// Add position data to driver object:
interface Driver {
  // ... existing fields
  trackPosition?: { x: number; y: number }; // SVG coordinates
}

// Render markers:
{leaderboard.map(driver => (
  driver.trackPosition && (
    <circle 
      cx={driver.trackPosition.x} 
      cy={driver.trackPosition.y} 
      r="6" 
      fill={driver.teamColor} 
    />
  )
))}
```

---

## 🎨 Design Tokens

All styling uses the same AMG theme from the landing page:

```css
Background: #050608
Panel Background: #0A0C10
Accent: #00D2BE
Text Primary: #E0E0E0
Text Secondary: #9CA3AF
Borders: rgba(0, 210, 190, 0.1)
Alert Red: #FF3B30
Success Green: #00FF00 (for DRS open, active status)
```

---

## 🧩 Component Breakdown

### Main Component: `TelemetryLive()`
- Handles state management
- WebSocket connection (to be implemented)
- Layout orchestration

### `TelemetryDisplay()` Component
Reusable telemetry bar with:
- Label
- Value with unit
- Progress bar (percentage-based)
- Custom color support

```tsx
<TelemetryDisplay 
  label="Throttle"
  value="98"
  unit="%"
  max={100}
  current={98}
  color="#00D2BE"
/>
```

---

## 📐 Grid Layout Configuration

```tsx
// Main grid (desktop):
grid-cols-1 lg:grid-cols-[280px_1fr_320px]

// Left panel: 280px fixed
// Center panel: Fluid (fills remaining space)
// Right panel: 320px fixed
```

---

## 🔧 Customization Guide

### 1. Change Circuit Map
Replace the SVG path in the center panel:

```tsx
<svg viewBox="0 0 400 300">
  <path 
    d="M ... your circuit path ..."
    stroke="#00D2BE" 
    strokeWidth="3"
  />
</svg>
```

**Circuit Path Resources:**
- Use vector graphics software (Illustrator, Figma) to trace circuit layouts
- Simplify paths for performance
- Keep viewBox at 400×300 for consistency

### 2. Add New Telemetry Metrics
```tsx
// In the right panel telemetry section:
<TelemetryDisplay 
  label="Tyre Temp"
  value={tyreTempData.toString()}
  unit="°C"
  max={120}
  current={tyreTempData}
  color="#FF8700"
/>
```

### 3. Customize Team Colors
```tsx
const teamColors: Record<string, string> = {
  'Mercedes': '#00D2BE',
  'Red Bull Racing': '#3671C6',
  'Ferrari': '#DC0000',
  'McLaren': '#FF8700',
  'Aston Martin': '#006F62',
  // Add more teams...
};
```

---

## 🚀 Production Checklist

### Before Deploying:

- [ ] Replace all mock data with WebSocket connections
- [ ] Implement error handling for WebSocket disconnections
- [ ] Add reconnection logic with exponential backoff
- [ ] Test with real OpenF1 data streams
- [ ] Optimize telemetry update frequency (avoid UI jank)
- [ ] Add loading states for initial data fetch
- [ ] Implement data validation (handle missing/malformed data)
- [ ] Add race session state detection (qualifying, race, practice)
- [ ] Test performance with 20 drivers updating simultaneously
- [ ] Add fallback UI for when no race is active

---

## 🔗 WebSocket Integration Example

```tsx
import { useEffect } from 'react';

export default function TelemetryLive() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  
  useEffect(() => {
    // Connect to OpenF1 WebSocket
    const websocket = new WebSocket('wss://your-openf1-endpoint');
    
    websocket.onopen = () => {
      console.log('Connected to OpenF1');
      setIsConnected(true);
      
      // Subscribe to data streams
      websocket.send(JSON.stringify({
        type: 'subscribe',
        channels: ['position', 'telemetry', 'session']
      }));
    };
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'position':
          setLeaderboard(data.positions);
          break;
        case 'telemetry':
          if (selectedDriver?.code === data.driver) {
            setTelemetry(data.telemetry);
          }
          break;
        case 'session':
          setSessionTime(data.time);
          break;
      }
    };
    
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
    
    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      
      // Reconnect after 3 seconds
      setTimeout(() => {
        // Reinitialize connection
      }, 3000);
    };
    
    setWs(websocket);
    
    return () => {
      websocket.close();
    };
  }, []);
  
  // ... rest of component
}
```

---

## 🎮 User Interactions

### Navigation
- **Back to Landing**: Click "Exit" button in top-left
- **Select Driver**: Click any driver in leaderboard
- **View Different Driver**: Click another driver to switch telemetry view

### Visual Feedback
- Selected driver: Highlighted in leaderboard with left border
- Hover states: All interactive elements have hover transitions
- Live indicators: Pulsing green dot for active connection

---

## 📊 Performance Optimization

### Telemetry Update Strategy
```tsx
// Throttle updates to 10Hz (every 100ms)
const TELEMETRY_UPDATE_INTERVAL = 100;

let lastUpdate = 0;
websocket.onmessage = (event) => {
  const now = Date.now();
  if (now - lastUpdate < TELEMETRY_UPDATE_INTERVAL) return;
  
  lastUpdate = now;
  // Process telemetry update
};
```

### Memoization for Performance
```tsx
import { useMemo } from 'react';

const sortedLeaderboard = useMemo(() => {
  return leaderboard.sort((a, b) => a.position - b.position);
}, [leaderboard]);
```

---

## 🐛 Debugging Tips

### Check WebSocket Connection
Open browser console and look for:
```
Connected to OpenF1
```

### Verify Data Flow
Add logging to track updates:
```tsx
useEffect(() => {
  console.log('Telemetry updated:', telemetry);
}, [telemetry]);
```

### Test with Mock Data
Toggle between mock and live data for comparison:
```tsx
const USE_MOCK_DATA = process.env.NODE_ENV === 'development';
```

---

## 📱 Mobile Considerations

The layout automatically stacks on mobile:
1. Leaderboard (full width)
2. Track map (full width, reduced height)
3. Driver telemetry (full width)

Test on actual devices to ensure:
- Touch targets are at least 44×44px
- Text remains readable at smaller sizes
- Performance is acceptable on lower-end devices

---

## 🔐 Security Notes

- **Never expose API keys** in client-side code
- Use environment variables for WebSocket endpoints
- Implement rate limiting for WebSocket messages
- Validate all incoming data before rendering
- Sanitize driver names and team data (prevent XSS)

---

## 🏁 Next Steps

1. **Integrate OpenF1 WebSocket** in place of mock data
2. **Add more circuits** with SVG path library
3. **Implement session type detection** (race, qualifying, practice)
4. **Add telemetry history graphs** (speed traces, throttle/brake curves)
5. **Create driver comparison mode** (split-screen)
6. **Add lap time analysis** panel
7. **Implement pit stop tracking**
8. **Add weather conditions** display

---

**Questions?** Check the main integration docs in `/INTEGRATION_NOTES.md` for shared design system details.
