import json
import os

def update_track():
    json_path = 'yas_marina_clean_lap.json'
    track_path = 'routes/track.py'
    
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found")
        return
        
    with open(json_path, 'r', encoding='utf-8') as f:
        new_points = json.load(f)
        
    with open(track_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    start_marker = 'YAS_MARINA_POINTS = ['
    end_marker = ']'
    
    start_idx = content.find(start_marker)
    if start_idx == -1:
        print("Error: Could not find start marker")
        return
        
    start_idx += len(start_marker)
    # Important: find the end marker *after* the start marker
    # And specifically for the YAS_MARINA_POINTS array
    # We look for the closing ] that is at the start of a line or after some points
    end_idx = content.find(']', start_idx)
    
    points_str = '\n    ' + ',\n    '.join([json.dumps(p) for p in new_points]) + '\n'
    
    new_content = content[:start_idx] + points_str + content[end_idx:]
    
    with open(track_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Successfully updated Yas Marina points with {len(new_points)} points!")

if __name__ == "__main__":
    update_track()
