import httpx
import asyncio
import json

OPENF1_API = "https://api.openf1.org/v1"

async def fetch_single_lap(session_key, driver_number, start_time, end_time):
    print(f"Fetching Single Lap: Session {session_key}, Driver {driver_number}...")
    print(f"Time Range: {start_time} to {end_time}")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"{OPENF1_API}/location"
        params = {
            "session_key": session_key, 
            "driver_number": driver_number,
            "date>": start_time,
            "date<": end_time
        }
        
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        if not data:
            return []
        
        # 1. Basic Extraction and Deduplication
        raw_points = []
        for item in data:
            x, y = item.get("x"), item.get("y")
            if x is not None and y is not None:
                # Only add if it's different from the last point (avoid jitter stalls)
                if not raw_points or (abs(x - raw_points[-1]["x"]) > 1 or abs(y - raw_points[-1]["y"]) > 1):
                    raw_points.append({"x": x, "y": y})
        
        if len(raw_points) < 20:
            return []

        # 2. Normalization (Pixel Perfect for 0-1 range)
        xs = [p["x"] for p in raw_points]
        ys = [p["y"] for p in raw_points]
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)
        
        width = max_x - min_x
        height = max_y - min_y
        max_range = max(width, height) or 1
        
        # Normalize first to make distance-based filtering easier
        normalized_raw = []
        for p in raw_points:
            normalized_raw.append({
                "x": (p["x"] - min_x) / max_range,
                "y": (p["y"] - min_y) / max_range
            })

        # 3. Distance-based Downsampling (Ensure smooth distribution)
        # Instead of fixed step, only add points if they moved a certain distance
        refined = [normalized_raw[0]]
        min_distance = 0.005 # At least 0.5% of max dimension movement
        
        for p in normalized_raw[1:]:
            last = refined[-1]
            dist = ((p["x"] - last["x"])**2 + (p["y"] - last["y"])**2)**0.5
            if dist > min_distance:
                refined.append(p)
        
        # Close the loop if needed (if start and end are close)
        first, last = refined[0], refined[-1]
        dist_loop = ((first["x"] - last["x"])**2 + (first["y"] - last["y"])**2)**0.5
        if dist_loop > 0.02: # If not closed, add one more point to bridge gap
             refined.append(first)

        # 4. Center and Round
        x_offset = (1.0 - (width / max_range)) / 2
        y_offset = (1.0 - (height / max_range)) / 2
        
        final = []
        for p in refined:
            final.append({
                "x": round(p["x"] + x_offset, 4),
                "y": round(p["y"] + y_offset, 4)
            })
        
        return final

async def main():
    # Lap 5 Times identified from Laps endpoint
    start = "2024-03-22T01:40:53.989"
    end = "2024-03-22T01:42:13.545"
    
    points = await fetch_single_lap("9481", "1", start, end)
    if points:
        print("---GEOMETRY_START---")
        print(json.dumps(points))
        print("---GEOMETRY_END---")
    else:
        print("Failed.")

if __name__ == "__main__":
    asyncio.unrun = False # prevent issue if any
    asyncio.run(main())
