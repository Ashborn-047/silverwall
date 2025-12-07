"""
SilverWall WebSocket - Abu Dhabi Live Telemetry
Streams simulated F1 telemetry data at 5 FPS (0.2s intervals)
Cars move smoothly around the track using the same points as the track visualization
"""

import asyncio
import math
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from routes.track import get_track_points

router = APIRouter()

# Simulated driver data with individual speed factors
# Simulated driver data with individual speed factors (2025 Season Finale Order)
DRIVERS = [
    {"code": "NOR", "team": "MCL", "base_offset": 0.00, "speed_factor": 1.00},  # Norris P1 (Leader)
    {"code": "VER", "team": "RBR", "base_offset": 0.02, "speed_factor": 0.998}, # Verstappen P2 (Close behind)
    {"code": "PIA", "team": "MCL", "base_offset": 0.10, "speed_factor": 0.995}, # Piastri P3
    {"code": "LEC", "team": "FER", "base_offset": 0.15, "speed_factor": 0.992},
    {"code": "RUS", "team": "MER", "base_offset": 0.20, "speed_factor": 0.990},
    {"code": "HAM", "team": "FER", "base_offset": 0.25, "speed_factor": 0.988}, # Hamilton in Ferrari
    {"code": "SAI", "team": "WIL", "base_offset": 0.30, "speed_factor": 0.985}, # Sainz in Williams
    {"code": "ALO", "team": "AMR", "base_offset": 0.35, "speed_factor": 0.982},
]


def compute_track_length(points: list) -> tuple[list, float]:
    """Compute cumulative distances along the track polyline"""
    cumulative = [0.0]
    total = 0.0
    for i in range(1, len(points)):
        dx = points[i]["x"] - points[i-1]["x"]
        dy = points[i]["y"] - points[i-1]["y"]
        total += math.sqrt(dx*dx + dy*dy)
        cumulative.append(total)
    return cumulative, total


def interpolate_on_track(s: float, points: list, cumulative: list, total_length: float) -> tuple[float, float]:
    """
    Interpolate position on the track polyline.
    s is a value from 0 to 1 representing progress along the track.
    Returns (x, y) coordinates in the same 0-1 normalized space as the track points.
    """
    # Wrap s to 0-1 range
    s = s % 1.0
    target_dist = s * total_length
    
    # Find the segment containing target_dist
    for i in range(1, len(cumulative)):
        if cumulative[i] >= target_dist:
            # Interpolate within this segment
            segment_start = cumulative[i-1]
            segment_end = cumulative[i]
            segment_length = segment_end - segment_start
            
            if segment_length == 0:
                return points[i-1]["x"], points[i-1]["y"]
            
            t = (target_dist - segment_start) / segment_length
            x = points[i-1]["x"] + t * (points[i]["x"] - points[i-1]["x"])
            y = points[i-1]["y"] + t * (points[i]["y"] - points[i-1]["y"])
            return x, y
    
    # If we're past the end, return the last point
    return points[-1]["x"], points[-1]["y"]


def generate_frame(t: float, track_points: list, cumulative: list, total_length: float) -> dict:
    """Generate a telemetry frame at time t with cars moving along the track"""
    cars = []
    
    # Base lap time: complete a lap every 60 seconds
    base_speed = 1.0 / 60.0  # Progress per second
    
    for driver in DRIVERS:
        # Calculate progress: base offset + time * individual speed factor
        s = (driver["base_offset"] + t * base_speed * driver["speed_factor"]) % 1.0
        
        # Get interpolated position (in 0-1 normalized coordinates)
        x, y = interpolate_on_track(s, track_points, cumulative, total_length)
        
        # Calculate speed based on track section (slower in corners)
        s_ahead = (s + 0.01) % 1.0
        x_ahead, y_ahead = interpolate_on_track(s_ahead, track_points, cumulative, total_length)
        
        # Direction change indicates corner
        dx = abs(x_ahead - x)
        dy = abs(y_ahead - y)
        direction_change = math.sqrt(dx*dx + dy*dy)
        
        # In a corner if direction is changing a lot
        in_corner = direction_change < 0.005
        
        # Base speeds
        straight_speed = 320
        corner_speed = 180
        base_speed_kph = corner_speed if in_corner else straight_speed
        
        # DRS zones (main straight and back straight)
        in_drs_zone = (s < 0.08) or (0.55 < s < 0.70)
        
        # Braking before corners
        is_braking = in_corner and direction_change < 0.003
        
        cars.append({
            "code": driver["code"],
            "team": driver["team"],
            "x": round(x, 4),
            "y": round(y, 4),
            "speed": base_speed_kph if not is_braking else int(base_speed_kph * 0.6),
            "gear": 3 if is_braking else (8 if in_drs_zone else 5),
            "drs": in_drs_zone and not is_braking,
            "throttle": 0 if is_braking else (100 if in_drs_zone else 80),
            "brake": 85 if is_braking else 0,
        })
    
    return {
        "t": int(t),
        "cars": cars
    }


@router.websocket("/ws/abu_dhabi")
async def websocket_abu_dhabi(websocket: WebSocket):
    """
    DEMO MODE WebSocket - Simulated car movements for testing UI.
    Uses /ws/abu_dhabi endpoint with pre-defined driver positions.
    """
    await websocket.accept()
    print("🎮 DEMO: Client connected to /ws/abu_dhabi (simulation)")
    
    # Get track points from the shared source
    track_points = get_track_points()
    cumulative, total_length = compute_track_length(track_points)
    
    print(f"📍 Track loaded: {len(track_points)} points, total length: {total_length:.3f}")
    
    t = 0.0
    try:
        while True:
            frame = generate_frame(t, track_points, cumulative, total_length)
            await websocket.send_json(frame)
            t += 0.33  # 3 FPS for smoother remote animation
            await asyncio.sleep(0.33)
    except WebSocketDisconnect:
        print("🎮 DEMO: Client disconnected from /ws/abu_dhabi")
    except Exception as e:
        print(f"❌ DEMO WebSocket error: {e}")


@router.websocket("/ws/live")
async def websocket_live(websocket: WebSocket):
    """
    LIVE MODE WebSocket - Fetches real car positions from OpenF1 API using openf1_fetcher.
    Falls back to 'waiting' status when no live session is available.
    """
    await websocket.accept()
    print("🏎️ LIVE: Client connected to /ws/live (OpenF1)")
    
    try:
        from openf1_fetcher import fetch_live_telemetry
        
        while True:
            try:
                # Use shared fetcher logic to get full telemetry state
                data = await fetch_live_telemetry()
                
                # Forward the data directly to the client
                await websocket.send_json(data)
                
                # If waiting or offline, poll slower
                if data.get("status") != "live":
                    await asyncio.sleep(5)
                else:
                    await asyncio.sleep(0.5)  # 2 FPS poll rate for live data
                    
            except Exception as e:
                print(f"⚠️ LIVE fetch error: {e}")
                await websocket.send_json({"status": "error", "message": str(e), "cars": []})
                await asyncio.sleep(5)
            
    except WebSocketDisconnect:
        print("🏎️ LIVE: Client disconnected from /ws/live")
    except Exception as e:
        print(f"❌ LIVE WebSocket error: {e}")
