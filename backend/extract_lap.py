import httpx
import json
from datetime import datetime, timedelta

def extract_clean_lap():
    # Lap 11 from Abu Dhabi 2024 Race (Session 9662, Max Verstappen)
    session_key = 9662
    driver_number = 1
    start_str = '2024-12-08T13:19:16.288000+00:00'
    duration = 90.395
    
    start_dt = datetime.fromisoformat(start_str)
    end_dt = start_dt + timedelta(seconds=duration)
    
    print(f"Fetching location data for lap {start_str} to {end_dt.isoformat()}...")
    
    r = httpx.get('https://api.openf1.org/v1/location', params={
        'session_key': session_key, 
        'driver_number': driver_number, 
        'date>': start_str, 
        'date<': end_dt.isoformat()
    })
    
    if r.status_code != 200:
        print(f"Error fetching data: {r.status_code}")
        return
        
    data = r.json()
    raw_points = [{'x': item['x'], 'y': item['y']} for item in data if 'x' in item and 'y' in item]
    print(f"Total raw points: {len(raw_points)}")
    
    # Filter for moving points to avoid cluster during pit or slow zones
    # But since it's a race lap 11, we mostly want to filter out tiny jitters
    clean_points = []
    last_p = None
    for p in raw_points:
        if last_p is None:
            clean_points.append(p)
            last_p = p
            continue
            
        # Distance squared
        dist_sq = (p['x'] - last_p['x'])**2 + (p['y'] - last_p['y'])**2
        # Only keep if moved significantly (adjust threshold as needed)
        if dist_sq > 2500: # dist > 50 units
            clean_points.append(p)
            last_p = p
            
    print(f"Filtered points: {len(clean_points)}")
    
    if not clean_points:
        print("No points found!")
        return
        
    # Normalize
    xs = [p['x'] for p in clean_points]
    ys = [p['y'] for p in clean_points]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    
    range_x = max_x - min_x
    range_y = max_y - min_y
    max_range = max(range_x, range_y)
    
    normalized = []
    for p in clean_points:
        normalized.append({
            "x": round((p['x'] - min_x) / max_range, 4),
            "y": round((p['y'] - min_y) / max_range, 4)
        })
        
    with open('yas_marina_clean_lap.json', 'w', encoding='utf-8') as f:
        json.dump(normalized, f)
        
    print(f"Successfully saved {len(normalized)} points to yas_marina_clean_lap.json")

if __name__ == "__main__":
    extract_clean_lap()
