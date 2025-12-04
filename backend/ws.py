"""
SilverWall WebSocket Endpoint
Streams telemetry frames to React client
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pipeline.fake_monza_timeline import TIMELINE
import asyncio
import json

router = APIRouter()

@router.websocket("/ws/monza")
async def ws_monza(websocket: WebSocket):
    await websocket.accept()
    print(f"✓ WebSocket client connected. Timeline size: {len(TIMELINE)}")
    
    if not TIMELINE:
        print("⚠ ERROR: Timeline is empty!")
    
    # Playback state
    current_frame_idx = 0
    playback_speed = 1.0
    is_playing = True
    
    try:
        while True:
            # Handle control messages
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=0.01)
                command = json.loads(data)
                
                cmd_type = command.get("type")
                if cmd_type == "seek":
                    current_frame_idx = int(float(command.get("value", 0)) / 0.1)
                    print(f"⏩ Seeked to frame {current_frame_idx}")
                elif cmd_type == "pause":
                    is_playing = False
                    print("⏸ Playback paused")
                elif cmd_type == "play":
                    is_playing = True
                    print("▶ Playback resumed")
                elif cmd_type == "speed":
                    playback_speed = float(command.get("value", 1.0))
                    print(f"⏩ Speed set to {playback_speed}x")
                    
            except asyncio.TimeoutError:
                pass
            except Exception as e:
                print(f"⚠ Command error: {e}")

            if is_playing:
                if current_frame_idx < len(TIMELINE):
                    frame = TIMELINE[current_frame_idx]
                    await websocket.send_json(frame.dict())
                    current_frame_idx += 1
                    await asyncio.sleep(0.1 / playback_speed)
                else:
                    current_frame_idx = 0
            else:
                await asyncio.sleep(0.1)
                
    except WebSocketDisconnect:
        print("✗ WebSocket client disconnected")
    except Exception as e:
        print(f"✗ WebSocket error: {e}")
