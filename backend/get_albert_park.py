import httpx
import json
from datetime import datetime, timedelta

def get_albert_park():
    session_key = 9488 # 2024 Australian GP Race
    driver_number = 4 # Lando Norris (finished 3rd)
    r = httpx.get('https://api.openf1.org/v1/location', params={
        'session_key': session_key, 
        'driver_number': driver_number, 
        'date>': '2024-03-24T04:20:00', # Deeper into race
        'date<': '2024-03-24T04:21:40'  # ~100 seconds
    })
    data = r.json()
    points = [{'x': p['x'], 'y': p['y']} for p in data if 'x' in p and 'y' in p]
    
    if not points:
        print("[]")
        return

    # Normalize
    xs = [p['x'] for p in points]
    ys = [p['y'] for p in points]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    range_x = max_x - min_x
    range_y = max_y - min_y
    max_range = max(range_x, range_y)
    
    if max_range == 0:
        print("[]")
        return
        
    normalized = []
    last = None
    for p in points:
        nx = round((p['x'] - min_x) / max_range, 4)
        ny = round((p['y'] - min_y) / max_range, 4)
        if last is None or (nx - last['x'])**2 + (ny - last['y'])**2 > 0.0001:
            last = {'x': nx, 'y': ny}
            normalized.append(last)
            
    print(json.dumps(normalized))

if __name__ == "__main__":
    get_albert_park()
