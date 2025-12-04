"""
SilverWall Data Models
Pydantic schemas for telemetry data
"""

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
