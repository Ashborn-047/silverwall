import json
import os

def update_track():
    json_path = 'yas_marina_high_res.json'
    track_path = 'routes/track.py'
    
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found")
        return
        
    # Force UTF-8 for reading the JSON
    with open(json_path, 'r', encoding='utf-8') as f:
        new_points = json.load(f)
        
    # Force UTF-8 for reading the track.py file
    with open(track_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    start_marker = 'YAS_MARINA_POINTS = ['
    end_marker = ']'
    
    start_idx = content.find(start_marker)
    if start_idx == -1:
        print("Error: Could not find start marker")
        return
        
    start_idx += len(start_marker)
    end_idx = content.find(end_marker, start_idx)
    
    # Format the points nicely
    points_str = '\n    ' + ',\n    '.join([json.dumps(p) for p in new_points]) + '\n'
    
    new_content = content[:start_idx] + points_str + content[end_idx:]
    
    # Force UTF-8 for writing the track.py file
    with open(track_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully updated Yas Marina points with UTF-8 encoding!")

if __name__ == "__main__":
    update_track()
