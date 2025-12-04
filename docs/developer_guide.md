# SilverWall Developer Guide

> **Implementation guide for Mercedes-AMG F1 telemetry replay system**

---

## Quick Start

### Prerequisites

- **Backend**: Python 3.10+, pip
- **Frontend**: Node.js 18+, npm
- **Data**: OpenF1 API access (public, no auth required)

### Project Structure

```
silverwall/
├── backend/
│   ├── main.py
│   ├── ws.py
│   ├── models.py
│   ├── requirements.txt
│   └── pipeline/
│       ├── __init__.py
│       ├── fetch_openf1.py
│       ├── build_timeline.py
│       └── fake_monza_timeline.py
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── components/
    │   └── hooks/
    ├── package.json
    ├── vite.config.ts
    └── tailwind.config.js
```

---

## Backend Implementation

### 1. Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install fastapi uvicorn websockets pydantic requests numpy
```

**requirements.txt**:
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
websockets==12.0
pydantic==2.5.0
requests==2.31.0
numpy==1.26.2
```

### 2. Data Models (`models.py`)

```python
from pydantic import BaseModel
from typing import List

class CarData(BaseModel):
    """Single car telemetry snapshot"""
    num: int              # Car number (e.g., 44)
    code: str             # Driver trigram (e.g., "HAM")
    team: str             # Team name (e.g., "Mercedes")
    x: float              # Normalized track X (0.0–1.0)
    y: float              # Normalized track Y (0.0–1.0)
    speed: int            # Speed in km/h
    gear: int             # Current gear (1-8)
    drs: bool             # DRS active flag
    throttle: int         # Throttle % (0–100)
    brake: int            # Brake % (0–100)

class FramePacket(BaseModel):
    """Complete telemetry frame for all cars"""
    t: float              # Absolute session time (seconds)
    cars: List[CarData]   # All active cars in this frame
```

### 3. OpenF1 API Client (`pipeline/fetch_openf1.py`)

```python
import requests
from typing import List, Dict

BASE_URL = "https://api.openf1.org/v1"

def fetch_sessions(year: int, circuit: str = None) -> List[Dict]:
    """Fetch sessions for a given year"""
    params = {"year": year}
    if circuit:
        params["circuit_short_name"] = circuit
    response = requests.get(f"{BASE_URL}/sessions", params=params)
    response.raise_for_status()
    return response.json()

def fetch_car_data(session_key: int, driver_number: int) -> List[Dict]:
    """Fetch car telemetry for a specific driver in a session"""
    params = {
        "session_key": session_key,
        "driver_number": driver_number
    }
    response = requests.get(f"{BASE_URL}/car_data", params=params)
    response.raise_for_status()
    return response.json()

def fetch_position_data(session_key: int, driver_number: int) -> List[Dict]:
    """Fetch position data for track visualization"""
    params = {
        "session_key": session_key,
        "driver_number": driver_number
    }
    response = requests.get(f"{BASE_URL}/position", params=params)
    response.raise_for_status()
    return response.json()

def fetch_drivers(session_key: int) -> List[Dict]:
    """Fetch all drivers in a session"""
    response = requests.get(f"{BASE_URL}/drivers", params={"session_key": session_key})
    response.raise_for_status()
    return response.json()
```

### 4. Timeline Builder (`pipeline/build_timeline.py`)

**Core Algorithm**: Forward-fill gaps to create gapless timeline

```python
import numpy as np
from typing import List, Dict
from models import CarData, FramePacket

def build_timeline(
    raw_data: Dict[int, List[Dict]],
    tick_interval: float = 0.2
) -> List[FramePacket]:
    """
    Build gapless timeline from raw telemetry data.
    
    Args:
        raw_data: { driver_num: [ { "date": "...", "x": float, ... }, ... ] }
        tick_interval: Time between frames (seconds)
    
    Returns:
        List of FramePacket with fixed intervals
    """
    
    # 1. Find time bounds
    all_times = []
    for driver_samples in raw_data.values():
        for sample in driver_samples:
            all_times.append(parse_timestamp(sample["date"]))
    
    t_min = min(all_times)
    t_max = max(all_times)
    
    # 2. Create master clock
    master_clock = np.arange(0, t_max - t_min, tick_interval)
    
    # 3. Build frames with forward-fill
    last_known: Dict[int, Dict] = {}
    frames: List[FramePacket] = []
    
    for t in master_clock:
        cars: List[CarData] = []
        
        for driver_num, samples in raw_data.items():
            # Find nearest sample at or before current time
            sample = find_nearest_or_prev(samples, t, t_min)
            
            if sample is not None:
                last_known[driver_num] = sample
            
            # Use last known value (forward-fill)
            if driver_num in last_known:
                cars.append(CarData(
                    num=driver_num,
                    code=last_known[driver_num]["driver_code"],
                    team=last_known[driver_num]["team"],
                    x=normalize_x(last_known[driver_num]["x"]),
                    y=normalize_y(last_known[driver_num]["y"]),
                    speed=last_known[driver_num].get("speed", 0),
                    gear=last_known[driver_num].get("n_gear", 1),
                    drs=last_known[driver_num].get("drs", 0) > 10,
                    throttle=last_known[driver_num].get("throttle", 0),
                    brake=last_known[driver_num].get("brake", 0),
                ))
        
        frames.append(FramePacket(t=float(t), cars=cars))
    
    return frames

def parse_timestamp(iso_string: str) -> float:
    """Convert ISO timestamp to seconds since epoch"""
    from datetime import datetime
    dt = datetime.fromisoformat(iso_string.replace('Z', '+00:00'))
    return dt.timestamp()

def find_nearest_or_prev(samples: List[Dict], target_t: float, t_min: float) -> Dict | None:
    """Find sample at or before target time"""
    best = None
    for sample in samples:
        sample_t = parse_timestamp(sample["date"]) - t_min
        if sample_t <= target_t:
            best = sample
        else:
            break
    return best

def normalize_x(x: float) -> float:
    """Normalize X coordinate to 0.0–1.0 range"""
    # Implement based on circuit bounds
    return (x - X_MIN) / (X_MAX - X_MIN)

def normalize_y(y: float) -> float:
    """Normalize Y coordinate to 0.0–1.0 range"""
    return (y - Y_MIN) / (Y_MAX - Y_MIN)
```

### 5. WebSocket Endpoint (`ws.py`)

```python
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import asyncio
import json
from models import FramePacket

router = APIRouter()

# Global timeline (loaded at startup)
TIMELINE: List[FramePacket] = []

@router.websocket("/ws/monza")
async def ws_monza(websocket: WebSocket):
    await websocket.accept()
    
    # Playback state
    t_index = 0
    speed = 1.0
    playing = True
    
    try:
        while True:
            # Non-blocking command check
            try:
                msg = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=0.01
                )
                data = json.loads(msg)
                cmd = data.get("cmd")
                
                if cmd == "pause":
                    playing = False
                elif cmd == "play":
                    playing = True
                    speed = float(data.get("speed", 1.0))
                elif cmd == "seek":
                    t_index = int(data.get("time", 0) / 0.2)  # Convert seconds to frame index
                    
            except asyncio.TimeoutError:
                pass  # No command received, continue playback
            
            # Stream frames
            if playing and 0 <= t_index < len(TIMELINE):
                await websocket.send_json(TIMELINE[t_index].dict())
                t_index += max(1, int(speed))
                await asyncio.sleep(0.2)  # 5 fps
            else:
                await asyncio.sleep(0.05)  # Idle wait
                
    except WebSocketDisconnect:
        print("Client disconnected")
```

### 6. FastAPI App (`main.py`)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ws import router as ws_router, TIMELINE
from pipeline.build_timeline import build_timeline
from pipeline.fetch_openf1 import fetch_sessions, fetch_drivers, fetch_car_data

app = FastAPI(title="SilverWall F1 Telemetry")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ws_router)

@app.on_event("startup")
async def load_timeline():
    """Load timeline data on startup"""
    print("Loading Monza 2024 timeline...")
    
    # Fetch session
    sessions = fetch_sessions(year=2024, circuit="Monza")
    race_session = [s for s in sessions if s["session_type"] == "Race"][0]
    session_key = race_session["session_key"]
    
    # Fetch drivers
    drivers = fetch_drivers(session_key)
    
    # Fetch telemetry for all drivers
    raw_data = {}
    for driver in drivers[:10]:  # Limit to top 10 for demo
        driver_num = driver["driver_number"]
        print(f"Fetching data for driver {driver_num}...")
        raw_data[driver_num] = fetch_car_data(session_key, driver_num)
    
    # Build timeline
    global TIMELINE
    TIMELINE = build_timeline(raw_data)
    print(f"Timeline ready: {len(TIMELINE)} frames")

@app.get("/")
def root():
    return {"status": "SilverWall backend running", "frames": len(TIMELINE)}
```

---

## Frontend Implementation

### 1. Setup

```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Install dependencies**:
```bash
npm install
```

### 2. Tailwind Configuration (`tailwind.config.js`)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        silverwall: {
          'surface-0': '#050608',
          'surface-1': '#121418',
          'surface-2': '#1A1D23',
          'surface-3': '#242831',
          'border': '#2A2E35',
          'teal': '#00D2BE',
          'teal-dim': '#008B7E',
          'text': '#E0E0E0',
          'text-mid': '#9CA3AF',
          'text-low': '#6B7280',
          'alert': '#FF3B30',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
```

### 3. WebSocket Hook (`hooks/useWebSocket.ts`)

```typescript
import { useState, useEffect, useRef } from 'react';

interface CarData {
  num: number;
  code: string;
  team: string;
  x: number;
  y: number;
  speed: number;
  gear: number;
  drs: boolean;
  throttle: number;
  brake: number;
}

interface FramePacket {
  t: number;
  cars: CarData[];
}

type ConnectionStatus = 'connecting' | 'open' | 'closed' | 'error';

export function useWebSocket(url: string) {
  const [currentFrame, setCurrentFrame] = useState<FramePacket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('open');
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const frame: FramePacket = JSON.parse(event.data);
      setCurrentFrame(frame);
    };

    ws.onerror = () => {
      setStatus('error');
    };

    ws.onclose = () => {
      setStatus('closed');
    };

    return () => {
      ws.close();
    };
  }, [url]);

  const sendCommand = (cmd: { cmd: string; [key: string]: any }) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(cmd));
    }
  };

  return { currentFrame, status, sendCommand };
}
```

### 4. Interpolation Hook (`hooks/useInterpolation.ts`)

```typescript
import { useState, useEffect, useRef } from 'react';

interface CarData {
  num: number;
  code: string;
  team: string;
  x: number;
  y: number;
  speed: number;
  gear: number;
  drs: boolean;
  throttle: number;
  brake: number;
}

interface FramePacket {
  t: number;
  cars: CarData[];
}

export function useInterpolation(currentFrame: FramePacket | null) {
  const [renderCars, setRenderCars] = useState<CarData[]>([]);
  const prevFrameRef = useRef<FramePacket | null>(null);
  const frameStartTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!currentFrame) return;

    // Store previous frame
    if (prevFrameRef.current?.t !== currentFrame.t) {
      prevFrameRef.current = currentFrame;
      frameStartTimeRef.current = Date.now();
    }

    // Interpolation loop
    let animationId: number;

    const interpolate = () => {
      const now = Date.now();
      const elapsed = (now - frameStartTimeRef.current) / 1000; // seconds
      const frameDuration = 0.2; // 5 fps
      const progress = Math.min(elapsed / frameDuration, 1.0);

      if (prevFrameRef.current && currentFrame) {
        const interpolatedCars = currentFrame.cars.map((nextCar) => {
          const prevCar = prevFrameRef.current!.cars.find(c => c.num === nextCar.num);
          
          if (!prevCar) return nextCar;

          // Linear interpolation
          return {
            ...nextCar,
            x: lerp(prevCar.x, nextCar.x, progress),
            y: lerp(prevCar.y, nextCar.y, progress),
            speed: Math.round(lerp(prevCar.speed, nextCar.speed, progress)),
          };
        });

        setRenderCars(interpolatedCars);
      }

      animationId = requestAnimationFrame(interpolate);
    };

    animationId = requestAnimationFrame(interpolate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [currentFrame]);

  return renderCars;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
```

### 5. Track Canvas Component (`components/TrackCanvas.tsx`)

```typescript
import { CarDot } from './CarDot';

interface CarData {
  num: number;
  code: string;
  team: string;
  x: number;
  y: number;
  speed: number;
  gear: number;
  drs: boolean;
  throttle: number;
  brake: number;
}

interface TrackCanvasProps {
  cars: CarData[];
}

export function TrackCanvas({ cars }: TrackCanvasProps) {
  // Simplified Monza circuit path
  const monzaPath = `
    M 150 200
    L 850 200
    Q 900 200 900 250
    L 900 400
    Q 900 450 850 450
    L 700 450
    Q 650 450 650 500
    L 650 700
    Q 650 750 600 750
    L 400 750
    Q 350 750 350 700
    L 350 500
    Q 350 450 300 450
    L 150 450
    Q 100 450 100 400
    L 100 250
    Q 100 200 150 200
  `;

  return (
    <div className="relative bg-silverwall-surface-0 border border-silverwall-teal/25 rounded-lg p-4">
      <div className="mb-2">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-silverwall-text-mid">
          Monza Circuit
        </h2>
      </div>
      
      <svg viewBox="0 0 1000 1000" className="w-full h-[60vh]">
        {/* Track outline */}
        <path
          d={monzaPath}
          fill="none"
          stroke="#00D2BE"
          strokeWidth={12}
          opacity={0.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Car dots */}
        {cars.map((car) => (
          <CarDot key={car.num} car={car} />
        ))}
      </svg>
    </div>
  );
}
```

### 6. Car Dot Component (`components/CarDot.tsx`)

```typescript
interface CarData {
  num: number;
  code: string;
  team: string;
  x: number;
  y: number;
  speed: number;
  gear: number;
  drs: boolean;
  throttle: number;
  brake: number;
}

const TEAM_COLORS: Record<string, string> = {
  'Mercedes': '#00D2BE',
  'Red Bull Racing': '#1E41FF',
  'Ferrari': '#DC0000',
  'McLaren': '#FF8700',
  'Alpine': '#0090FF',
  'Aston Martin': '#006F62',
  'Williams': '#005AFF',
  'Alfa Romeo': '#900000',
  'Haas F1 Team': '#FFFFFF',
  'AlphaTauri': '#2B4562',
};

export function CarDot({ car }: { car: CarData }) {
  const cx = car.x * 1000;
  const cy = car.y * 1000;
  const teamColor = TEAM_COLORS[car.team] || '#6B7280';

  return (
    <g>
      {/* Outer ring (team color) */}
      <circle
        cx={cx}
        cy={cy}
        r={16}
        fill="#0A1416"
        stroke={teamColor}
        strokeWidth={3}
      />
      
      {/* Driver code */}
      <text
        x={cx}
        y={cy + 1}
        fill="#E5E7EB"
        fontSize={14}
        fontWeight={600}
        textAnchor="middle"
        alignmentBaseline="middle"
        fontFamily="'Inter', system-ui, sans-serif"
      >
        {car.code}
      </text>
    </g>
  );
}
```

### 7. Main App (`App.tsx`)

```typescript
import { useWebSocket } from './hooks/useWebSocket';
import { useInterpolation } from './hooks/useInterpolation';
import { TrackCanvas } from './components/TrackCanvas';
import { Leaderboard } from './components/Leaderboard';
import { DriverPanel } from './components/DriverPanel';
import { TelemetryBars } from './components/TelemetryBars';
import { ReplayControls } from './components/ReplayControls';

function App() {
  const { currentFrame, status, sendCommand } = useWebSocket('ws://localhost:8000/ws/monza');
  const cars = useInterpolation(currentFrame);

  return (
    <div className="min-h-screen bg-silverwall-surface-0 text-silverwall-text font-sans">
      {/* Header */}
      <header className="h-16 border-b border-silverwall-border flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <h1 className="text-[18px] font-semibold uppercase tracking-[0.08em] text-silverwall-teal">
            SilverWall
          </h1>
          <span className="text-[13px] text-silverwall-text-mid">
            Monza GP
          </span>
          <span className="text-[13px] font-mono text-silverwall-text">
            {currentFrame ? `${Math.floor(currentFrame.t / 60)}:${(currentFrame.t % 60).toFixed(0).padStart(2, '0')}` : '--:--'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status === 'open' ? 'bg-silverwall-teal' : 'bg-silverwall-alert'}`} />
          <span className="text-[11px] uppercase tracking-wide text-silverwall-text-mid">
            {status}
          </span>
        </div>
      </header>

      {/* Main grid */}
      <div className="grid grid-cols-[280px_minmax(0,1fr)_280px] gap-4 p-4 h-[calc(100vh-200px)]">
        <Leaderboard cars={cars} />
        <TrackCanvas cars={cars} />
        <DriverPanel cars={cars} />
      </div>

      {/* Bottom panels */}
      <div className="px-4 pb-4">
        <TelemetryBars cars={cars} />
      </div>

      <ReplayControls sendCommand={sendCommand} />
    </div>
  );
}

export default App;
```

---

## Development Workflow

### Step 1: Backend Development

```bash
# Terminal 1: Start backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 2: Frontend Development

```bash
# Terminal 2: Start frontend
cd frontend
npm run dev
```

### Step 3: Test WebSocket Connection

Open browser console and verify:
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/monza');
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

### Step 4: Implement Components

1. **Leaderboard**: Sort cars by position, display in table
2. **DriverPanel**: Show detailed telemetry for selected car
3. **TelemetryBars**: Horizontal bars for throttle/brake
4. **ReplayControls**: Play/pause/seek/speed controls

---

## Testing

### Backend Tests

```python
# test_timeline.py
def test_build_timeline():
    raw_data = {
        44: [
            {"date": "2024-09-01T14:00:00Z", "x": 100, "y": 200, "speed": 250},
            {"date": "2024-09-01T14:00:01Z", "x": 110, "y": 210, "speed": 260},
        ]
    }
    timeline = build_timeline(raw_data, tick_interval=0.5)
    assert len(timeline) > 0
    assert timeline[0].t == 0.0
```

### Frontend Tests

```typescript
// useInterpolation.test.ts
import { renderHook } from '@testing-library/react-hooks';
import { useInterpolation } from './useInterpolation';

test('interpolates between frames', () => {
  const frame1 = { t: 0, cars: [{ num: 44, x: 0.0, y: 0.0, ... }] };
  const frame2 = { t: 0.2, cars: [{ num: 44, x: 0.1, y: 0.1, ... }] };
  
  const { result } = renderHook(() => useInterpolation(frame1));
  // Assert interpolation logic
});
```

---

## Deployment

### Backend (Railway / Render)

```bash
# Procfile
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Frontend (Vercel / Netlify)

```bash
npm run build
# Deploy dist/ folder
```

---

## Performance Optimization

1. **Timeline Compression**: Use binary format instead of JSON
2. **Delta Encoding**: Send only changed values between frames
3. **Client-Side Caching**: Cache timeline chunks locally
4. **WebWorker Interpolation**: Offload lerp calculations to worker thread

---

**SilverWall** — *Precision engineering for the pit wall.*
