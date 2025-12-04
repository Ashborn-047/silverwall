"""
Fake Monza Timeline for Development
Generates synthetic telemetry data for testing
"""

import math
from typing import List, Tuple, Literal
from models import CarData, FramePacket


class TrackSegment:
    def __init__(self, type: Literal['line', 'quad'], start: Tuple[float, float], end: Tuple[float, float], control: Tuple[float, float] = None):
        self.type = type
        self.start = start
        self.end = end
        self.control = control
        self.length = self._calculate_length()

    def _calculate_length(self) -> float:
        if self.type == 'line':
            return math.sqrt((self.end[0] - self.start[0])**2 + (self.end[1] - self.start[1])**2)
        else:
            # Approximate quad length
            chord = math.sqrt((self.end[0] - self.start[0])**2 + (self.end[1] - self.start[1])**2)
            return chord * 1.1

    def get_point(self, t: float) -> Tuple[float, float]:
        if self.type == 'line':
            x = self.start[0] + (self.end[0] - self.start[0]) * t
            y = self.start[1] + (self.end[1] - self.start[1]) * t
            return x, y
        else:
            # Quadratic Bezier
            u = 1 - t
            x = u**2 * self.start[0] + 2 * u * t * self.control[0] + t**2 * self.end[0]
            y = u**2 * self.start[1] + 2 * u * t * self.control[1] + t**2 * self.end[1]
            return x, y


class TrackPath:
    def __init__(self):
        self.segments: List[TrackSegment] = []
        self._build_path()
        self.total_length = sum(s.length for s in self.segments)

    def _build_path(self):
        # 1. Top Straight
        self.segments.append(TrackSegment('line', (0.15, 0.25), (0.85, 0.25)))
        # 2. Turn 1
        self.segments.append(TrackSegment('quad', (0.85, 0.25), (0.9, 0.3), (0.9, 0.25)))
        # 3. Right Straight 1
        self.segments.append(TrackSegment('line', (0.9, 0.3), (0.9, 0.45)))
        # 4. Turn 2
        self.segments.append(TrackSegment('quad', (0.9, 0.45), (0.85, 0.5), (0.9, 0.5)))
        # 5. Middle Straight 1
        self.segments.append(TrackSegment('line', (0.85, 0.5), (0.7, 0.5)))
        # 6. Turn 3
        self.segments.append(TrackSegment('quad', (0.7, 0.5), (0.65, 0.55), (0.65, 0.5)))
        # 7. Vertical Straight
        self.segments.append(TrackSegment('line', (0.65, 0.55), (0.65, 0.7)))
        # 8. Turn 4
        self.segments.append(TrackSegment('quad', (0.65, 0.7), (0.6, 0.75), (0.65, 0.75)))
        # 9. Bottom Straight
        self.segments.append(TrackSegment('line', (0.6, 0.75), (0.4, 0.75)))
        # 10. Turn 5
        self.segments.append(TrackSegment('quad', (0.4, 0.75), (0.35, 0.7), (0.35, 0.75)))
        # 11. Vertical Straight 2
        self.segments.append(TrackSegment('line', (0.35, 0.7), (0.35, 0.55)))
        # 12. Turn 6
        self.segments.append(TrackSegment('quad', (0.35, 0.55), (0.3, 0.5), (0.35, 0.5)))
        # 13. Middle Straight 2
        self.segments.append(TrackSegment('line', (0.3, 0.5), (0.15, 0.5)))
        # 14. Turn 7
        self.segments.append(TrackSegment('quad', (0.15, 0.5), (0.1, 0.45), (0.1, 0.5)))
        # 15. Left Straight
        self.segments.append(TrackSegment('line', (0.1, 0.45), (0.1, 0.3)))
        # 16. Turn 8
        self.segments.append(TrackSegment('quad', (0.1, 0.3), (0.15, 0.25), (0.1, 0.25)))

    def get_position(self, progress: float) -> Tuple[float, float]:
        progress = progress % 1.0
        target_distance = progress * self.total_length
        
        current_distance = 0.0
        for segment in self.segments:
            if current_distance + segment.length >= target_distance:
                segment_progress = (target_distance - current_distance) / segment.length
                return segment.get_point(segment_progress)
            current_distance += segment.length
            
        return self.segments[-1].end


def generate_fake_timeline(duration: float = 60.0, tick_interval: float = 0.1) -> List[FramePacket]:
    print(f"DEBUG: Generating timeline... Duration={duration}, Tick={tick_interval}")
    
    drivers = [
        {"num": 44, "code": "HAM", "team": "Mercedes", "offset": 0.0, "speed_base": 280},
        {"num": 1, "code": "VER", "team": "Red Bull Racing", "offset": 0.05, "speed_base": 275},
        {"num": 16, "code": "LEC", "team": "Ferrari", "offset": 0.10, "speed_base": 270},
        {"num": 55, "code": "SAI", "team": "Ferrari", "offset": 0.15, "speed_base": 268},
        {"num": 4, "code": "NOR", "team": "McLaren", "offset": 0.20, "speed_base": 265},
        {"num": 11, "code": "PER", "team": "Red Bull Racing", "offset": 0.25, "speed_base": 263},
        {"num": 63, "code": "RUS", "team": "Mercedes", "offset": 0.30, "speed_base": 260},
        {"num": 14, "code": "ALO", "team": "Aston Martin", "offset": 0.35, "speed_base": 258},
    ]
    
    track = TrackPath()
    frames: List[FramePacket] = []
    num_frames = int(duration / tick_interval)
    
    for frame_idx in range(num_frames):
        t = frame_idx * tick_interval
        cars: List[CarData] = []
        
        for driver in drivers:
            progress = (t / 90.0 + driver["offset"]) % 1.0
            x, y = track.get_position(progress)
            
            is_straight = (0.0 < progress < 0.25) or (0.5 < progress < 0.6)
            
            if is_straight:
                speed = driver["speed_base"] + 30
                throttle = 98
                brake = 0
                gear = 8
                drs = True if (0.0 < progress < 0.2) else False
            else:
                speed = driver["speed_base"] - 40
                throttle = 60
                brake = 10
                gear = 4
                drs = False
            
            cars.append(CarData(
                num=driver["num"],
                code=driver["code"],
                team=driver["team"],
                x=x,
                y=y,
                speed=speed,
                gear=gear,
                drs=drs,
                throttle=throttle,
                brake=brake,
            ))
        
        frames.append(FramePacket(t=t, cars=cars))
    
    print(f"DEBUG: Generated {len(frames)} frames. First frame cars: {len(frames[0].cars)}")
    return frames


# Generate timeline on module import
TIMELINE = generate_fake_timeline(duration=180.0)
print(f"✓ Fake Monza timeline loaded: {len(TIMELINE)} frames")
