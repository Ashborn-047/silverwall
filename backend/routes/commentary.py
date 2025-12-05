"""
SilverWall - Live Commentary System
Generates real-time commentary from telemetry events
"""

from fastapi import APIRouter
from datetime import datetime, timezone
from typing import List, Dict, Optional
from pydantic import BaseModel
import random

router = APIRouter()


class CommentaryEvent(BaseModel):
    """Single commentary event"""
    id: str
    type: str  # overtake, pit, fastest_lap, radio, drs, battle
    icon: str
    message: str
    driver: Optional[str] = None
    timestamp: str
    color: str


# Event templates for AI-generated commentary
OVERTAKE_TEMPLATES = [
    "{driver1} overtakes {driver2} into Turn {turn}!",
    "Brilliant move! {driver1} passes {driver2}",
    "{driver1} makes the pass on {driver2}! What a move!",
    "{driver1} dives down the inside past {driver2}",
]

PIT_TEMPLATES = [
    "{driver} pits - {tyres} compound",
    "{driver} coming in for a pit stop",
    "Box box for {driver}! Fitting {tyres}",
    "{driver} in the pit lane - {time}s stop",
]

FASTEST_LAP_TEMPLATES = [
    "{driver} sets the fastest lap! {time}",
    "Purple sector for {driver} - {time}",
    "New fastest lap: {driver} with a {time}",
]

BATTLE_TEMPLATES = [
    "{driver1} and {driver2} wheel to wheel! Gap: {gap}s",
    "Intense battle! {driver1} defending from {driver2}",
    "{driver1} under pressure from {driver2} - {gap}s behind",
]

DRS_TEMPLATES = [
    "{driver} opens DRS on the main straight",
    "DRS enabled for {driver}",
    "{driver} activates DRS, closing on {driver2}",
]

RADIO_TEMPLATES = [
    '"{message}" - {driver}',
]

# Sample radio messages for demo
DEMO_RADIO_MESSAGES = [
    ("HAM", "These tyres are completely gone!"),
    ("VER", "He pushed me off the track!"),
    ("LEC", "We are looking good, keep pushing"),
    ("SAI", "Box box, box box"),
    ("NOR", "This is mega pace!"),
    ("RUS", "Copy, understood"),
    ("PER", "Track limits? What happened there?"),
    ("ALO", "GP2 engine! GP2!"),
]

# Icon and color mapping
EVENT_ICONS = {
    "overtake": ("⚡", "#00D2BE"),
    "pit": ("🔴", "#FF3B30"),
    "fastest_lap": ("⏱️", "#BF5AF2"),
    "radio": ("📻", "#FFD60A"),
    "drs": ("🟢", "#30D158"),
    "battle": ("⚔️", "#FF9F0A"),
    "start": ("🏁", "#FFFFFF"),
}

# Track previous state for event detection
_previous_positions: Dict[str, int] = {}
_previous_lap_times: Dict[str, float] = {}
_fastest_lap: float = 999.0
_fastest_lap_driver: str = ""
_event_counter = 0


def generate_event_id() -> str:
    """Generate unique event ID"""
    global _event_counter
    _event_counter += 1
    return f"evt_{_event_counter}_{int(datetime.now().timestamp())}"


def detect_events_from_frame(frame: dict) -> List[CommentaryEvent]:
    """Analyze telemetry frame and detect notable events"""
    global _previous_positions, _fastest_lap, _fastest_lap_driver
    
    events = []
    cars = frame.get("cars", [])
    
    if not cars:
        return events
    
    current_positions = {car["code"]: i + 1 for i, car in enumerate(cars)}
    
    # Detect overtakes
    for code, new_pos in current_positions.items():
        old_pos = _previous_positions.get(code)
        if old_pos and new_pos < old_pos:
            # Driver gained position(s)
            overtaken = [c for c, p in _previous_positions.items() 
                        if p == new_pos and c != code]
            if overtaken:
                template = random.choice(OVERTAKE_TEMPLATES)
                icon, color = EVENT_ICONS["overtake"]
                events.append(CommentaryEvent(
                    id=generate_event_id(),
                    type="overtake",
                    icon=icon,
                    message=template.format(
                        driver1=code, 
                        driver2=overtaken[0],
                        turn=random.randint(1, 21)
                    ),
                    driver=code,
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    color=color,
                ))
    
    # Detect close battles (within 0.5s)
    for i, car in enumerate(cars[:-1]):
        gap = abs(car.get("x", 0) - cars[i + 1].get("x", 0))
        if gap < 0.02:  # Very close on track
            icon, color = EVENT_ICONS["battle"]
            template = random.choice(BATTLE_TEMPLATES)
            events.append(CommentaryEvent(
                id=generate_event_id(),
                type="battle",
                icon=icon,
                message=template.format(
                    driver1=car["code"],
                    driver2=cars[i + 1]["code"],
                    gap=round(random.uniform(0.1, 0.5), 1)
                ),
                driver=car["code"],
                timestamp=datetime.now(timezone.utc).isoformat(),
                color=color,
            ))
            break  # Only one battle event per frame
    
    # Detect DRS activation
    for car in cars:
        if car.get("drs", False):
            # 10% chance to generate DRS event (avoid spam)
            if random.random() < 0.1:
                icon, color = EVENT_ICONS["drs"]
                events.append(CommentaryEvent(
                    id=generate_event_id(),
                    type="drs",
                    icon=icon,
                    message=f"{car['code']} opens DRS on the main straight",
                    driver=car["code"],
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    color=color,
                ))
                break
    
    _previous_positions = current_positions
    return events


def generate_demo_events() -> List[CommentaryEvent]:
    """Generate random demo events for testing"""
    events = []
    
    # Random event type
    event_type = random.choice(["overtake", "pit", "fastest_lap", "radio", "drs", "battle"])
    icon, color = EVENT_ICONS[event_type]
    
    drivers = ["HAM", "VER", "LEC", "SAI", "NOR", "PER", "RUS", "ALO"]
    driver1 = random.choice(drivers)
    driver2 = random.choice([d for d in drivers if d != driver1])
    
    if event_type == "overtake":
        message = random.choice(OVERTAKE_TEMPLATES).format(
            driver1=driver1, driver2=driver2, turn=random.randint(1, 21)
        )
    elif event_type == "pit":
        tyres = random.choice(["Soft", "Medium", "Hard"])
        message = random.choice(PIT_TEMPLATES).format(
            driver=driver1, tyres=tyres, time=round(random.uniform(2.2, 3.5), 1)
        )
    elif event_type == "fastest_lap":
        lap_time = f"1:{random.randint(23, 26)}.{random.randint(100, 999)}"
        message = random.choice(FASTEST_LAP_TEMPLATES).format(
            driver=driver1, time=lap_time
        )
    elif event_type == "radio":
        driver, radio_msg = random.choice(DEMO_RADIO_MESSAGES)
        message = f'"{radio_msg}" - {driver}'
    elif event_type == "drs":
        message = random.choice(DRS_TEMPLATES).format(
            driver=driver1, driver2=driver2
        )
    else:  # battle
        message = random.choice(BATTLE_TEMPLATES).format(
            driver1=driver1, driver2=driver2, gap=round(random.uniform(0.1, 0.5), 1)
        )
    
    events.append(CommentaryEvent(
        id=generate_event_id(),
        type=event_type,
        icon=icon,
        message=message,
        driver=driver1,
        timestamp=datetime.now(timezone.utc).isoformat(),
        color=color,
    ))
    
    return events


@router.get("/commentary")
async def get_commentary(demo: bool = False):
    """
    Get latest commentary events.
    Use ?demo=true for simulated events.
    """
    if demo:
        events = generate_demo_events()
    else:
        # In live mode, return empty (events come via WebSocket)
        events = []
    
    return {
        "events": [e.dict() for e in events],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/commentary/history")
async def get_commentary_history(limit: int = 20):
    """Get recent commentary history"""
    # For demo, generate a batch of events
    events = []
    for _ in range(min(limit, 10)):
        events.extend(generate_demo_events())
    
    return {
        "events": [e.dict() for e in events],
        "count": len(events),
    }
