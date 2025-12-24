"""
SilverWall REST API - Track Geometry
Fetches real circuit coordinates from OpenF1 API location data
Supports dynamic circuit detection for live race days
"""

import httpx
from fastapi import APIRouter
import math

router = APIRouter()

# OpenF1 API base URL
OPENF1_API = "https://api.openf1.org/v1"

# Cache for track data
_track_cache = {}


async def fetch_current_session():
    """Fetch current/latest session info from OpenF1"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{OPENF1_API}/sessions", params={"session_key": "latest"})
            response.raise_for_status()
            data = response.json()
            
            if data and len(data) > 0:
                session = data[0]
                return {
                    "session_key": session.get("session_key"),
                    "circuit_key": session.get("circuit_key"),
                    "circuit_short_name": session.get("circuit_short_name"),
                    "session_name": session.get("session_name"),
                    "meeting_name": session.get("meeting_name"),
                    "country_name": session.get("country_name"),
                }
            return None
    except Exception as e:
        print(f"❌ Error fetching current session: {e}")
        return None


async def fetch_track_from_openf1(session_key: str = "latest") -> list:
    """Fetch track coordinates from OpenF1 location data."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            url = f"{OPENF1_API}/location"
            params = {"session_key": session_key, "driver_number": 1}
            
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if not data:
                return []
            
            # Fetch more points for higher fidelity (up to 2000)
            points = [{"x": item["x"], "y": item["y"]} for item in data[:2000] if "x" in item and "y" in item]
            
            if not points:
                return []
            
            xs = [p["x"] for p in points]
            ys = [p["y"] for p in points]
            min_x, max_x = min(xs), max(xs)
            min_y, max_y = min(ys), max(ys)
            range_x = max_x - min_x if max_x != min_x else 1
            range_y = max_y - min_y if max_y != min_y else 1
            
            # To prevent squashing, we need to maintain the aspect ratio.
            # We'll normalize both X and Y by the SAME larger range.
            max_range = max(range_x, range_y)
            
            # Use a step that gives us around 200 points for the final path
            # (balanced for performance and smoothness)
            step = max(1, len(points) // 200)
            normalized = []
            for i in range(0, len(points), step):
                p = points[i]
                normalized.append({
                    "x": round((p["x"] - min_x) / max_range, 4),
                    "y": round((p["y"] - min_y) / max_range, 4)
                })
            
            return normalized
            
    except Exception as e:
        print(f"❌ Error fetching from OpenF1: {e}")
        return []


def generate_curve(start, end, control, num_points=8):
    """Generate points along a quadratic bezier curve"""
    points = []
    for i in range(num_points + 1):
        t = i / num_points
        # Quadratic bezier formula
        x = (1-t)**2 * start[0] + 2*(1-t)*t * control[0] + t**2 * end[0]
        y = (1-t)**2 * start[1] + 2*(1-t)*t * control[1] + t**2 * end[1]
        points.append({"x": round(x, 4), "y": round(y, 4)})
    return points[:-1]  # Exclude last point to avoid duplicates


def generate_arc(cx, cy, radius, start_angle, end_angle, num_points=10):
    """Generate points along a circular arc"""
    points = []
    angle_step = (end_angle - start_angle) / num_points
    for i in range(num_points + 1):
        angle = start_angle + i * angle_step
        x = cx + radius * math.cos(math.radians(angle))
        y = cy + radius * math.sin(math.radians(angle))
        points.append({"x": round(x, 4), "y": round(y, 4)})
    return points[:-1]


# Yas Marina Circuit - High-detail coordinates with smooth curves
# Traced from official F1 track map with ~80 points for smooth rendering
YAS_MARINA_POINTS = [
    {"x": 0.1836, "y": 0.4364},
    {"x": 0.1943, "y": 0.4376},
    {"x": 0.2108, "y": 0.4395},
    {"x": 0.2188, "y": 0.4404},
    {"x": 0.2352, "y": 0.4423},
    {"x": 0.2475, "y": 0.4436},
    {"x": 0.256, "y": 0.4446},
    {"x": 0.2645, "y": 0.4456},
    {"x": 0.2801, "y": 0.4473},
    {"x": 0.2879, "y": 0.4483},
    {"x": 0.2976, "y": 0.4493},
    {"x": 0.3109, "y": 0.4508},
    {"x": 0.3144, "y": 0.4512},
    {"x": 0.3267, "y": 0.4526},
    {"x": 0.3341, "y": 0.4535},
    {"x": 0.3454, "y": 0.4543},
    {"x": 0.3514, "y": 0.4549},
    {"x": 0.3579, "y": 0.4558},
    {"x": 0.3624, "y": 0.4567},
    {"x": 0.3712, "y": 0.46},
    {"x": 0.3774, "y": 0.4646},
    {"x": 0.3801, "y": 0.468},
    {"x": 0.3821, "y": 0.4717},
    {"x": 0.3835, "y": 0.4753},
    {"x": 0.3845, "y": 0.4803},
    {"x": 0.385, "y": 0.484},
    {"x": 0.3853, "y": 0.4913},
    {"x": 0.3851, "y": 0.5005},
    {"x": 0.3845, "y": 0.507},
    {"x": 0.3837, "y": 0.5133},
    {"x": 0.3827, "y": 0.5197},
    {"x": 0.3819, "y": 0.5245},
    {"x": 0.381, "y": 0.5295},
    {"x": 0.3796, "y": 0.536},
    {"x": 0.3777, "y": 0.5447},
    {"x": 0.3755, "y": 0.5534},
    {"x": 0.3721, "y": 0.5659},
    {"x": 0.3703, "y": 0.5723},
    {"x": 0.3662, "y": 0.5852},
    {"x": 0.3431, "y": 0.6167},
    {"x": 0.3358, "y": 0.6203},
    {"x": 0.3295, "y": 0.6225},
    {"x": 0.3207, "y": 0.6252},
    {"x": 0.3074, "y": 0.6297},
    {"x": 0.2987, "y": 0.6328},
    {"x": 0.2877, "y": 0.6368},
    {"x": 0.2788, "y": 0.6421},
    {"x": 0.268, "y": 0.653},
    {"x": 0.2616, "y": 0.6622},
    {"x": 0.2558, "y": 0.6763},
    {"x": 0.2539, "y": 0.6863},
    {"x": 0.254, "y": 0.7043},
    {"x": 0.2564, "y": 0.7214},
    {"x": 0.2578, "y": 0.7299},
    {"x": 0.2594, "y": 0.7394},
    {"x": 0.2618, "y": 0.7532},
    {"x": 0.2645, "y": 0.7681},
    {"x": 0.2663, "y": 0.7788},
    {"x": 0.2671, "y": 0.7842},
    {"x": 0.2687, "y": 0.7978},
    {"x": 0.2696, "y": 0.8125},
    {"x": 0.2697, "y": 0.8245},
    {"x": 0.2697, "y": 0.8311},
    {"x": 0.2696, "y": 0.8404},
    {"x": 0.2694, "y": 0.8516},
    {"x": 0.2688, "y": 0.8679},
    {"x": 0.2681, "y": 0.8808},
    {"x": 0.2668, "y": 0.8986},
    {"x": 0.2654, "y": 0.9173},
    {"x": 0.2638, "y": 0.9364},
    {"x": 0.2621, "y": 0.9533},
    {"x": 0.2612, "y": 0.9604},
    {"x": 0.2585, "y": 0.9738},
    {"x": 0.2554, "y": 0.9827},
    {"x": 0.2523, "y": 0.9884},
    {"x": 0.2494, "y": 0.9923},
    {"x": 0.2468, "y": 0.995},
    {"x": 0.243, "y": 0.998},
    {"x": 0.2382, "y": 1.0},
    {"x": 0.2299, "y": 0.9999},
    {"x": 0.2258, "y": 0.9982},
    {"x": 0.2225, "y": 0.996},
    {"x": 0.2185, "y": 0.9925},
    {"x": 0.2162, "y": 0.9899},
    {"x": 0.2132, "y": 0.9855},
    {"x": 0.2107, "y": 0.9807},
    {"x": 0.2094, "y": 0.9778},
    {"x": 0.207, "y": 0.9716},
    {"x": 0.2052, "y": 0.9659},
    {"x": 0.2038, "y": 0.9616},
    {"x": 0.2024, "y": 0.9571},
    {"x": 0.2002, "y": 0.9502},
    {"x": 0.1987, "y": 0.9454},
    {"x": 0.1963, "y": 0.9379},
    {"x": 0.1946, "y": 0.9325},
    {"x": 0.1927, "y": 0.9262},
    {"x": 0.1902, "y": 0.9185},
    {"x": 0.1862, "y": 0.9056},
    {"x": 0.1838, "y": 0.898},
    {"x": 0.1797, "y": 0.8852},
    {"x": 0.1771, "y": 0.8772},
    {"x": 0.1737, "y": 0.8674},
    {"x": 0.1714, "y": 0.8606},
    {"x": 0.1687, "y": 0.8529},
    {"x": 0.1633, "y": 0.8376},
    {"x": 0.1574, "y": 0.8207},
    {"x": 0.1522, "y": 0.8059},
    {"x": 0.146, "y": 0.7883},
    {"x": 0.141, "y": 0.7737},
    {"x": 0.1355, "y": 0.7582},
    {"x": 0.1334, "y": 0.7521},
    {"x": 0.1282, "y": 0.7371},
    {"x": 0.1235, "y": 0.7238},
    {"x": 0.1179, "y": 0.7077},
    {"x": 0.1119, "y": 0.6905},
    {"x": 0.1094, "y": 0.6833},
    {"x": 0.1058, "y": 0.6732},
    {"x": 0.1027, "y": 0.6641},
    {"x": 0.0978, "y": 0.6502},
    {"x": 0.0913, "y": 0.6316},
    {"x": 0.0883, "y": 0.6232},
    {"x": 0.0825, "y": 0.6064},
    {"x": 0.0789, "y": 0.5961},
    {"x": 0.0755, "y": 0.5867},
    {"x": 0.0729, "y": 0.5791},
    {"x": 0.0673, "y": 0.563},
    {"x": 0.0593, "y": 0.5402},
    {"x": 0.0562, "y": 0.5316},
    {"x": 0.0531, "y": 0.523},
    {"x": 0.0476, "y": 0.5077},
    {"x": 0.0427, "y": 0.4943},
    {"x": 0.0382, "y": 0.4818},
    {"x": 0.034, "y": 0.4702},
    {"x": 0.0272, "y": 0.4519},
    {"x": 0.0212, "y": 0.4359},
    {"x": 0.0175, "y": 0.426},
    {"x": 0.0147, "y": 0.4184},
    {"x": 0.0105, "y": 0.4066},
    {"x": 0.0058, "y": 0.3924},
    {"x": 0.0023, "y": 0.3805},
    {"x": 0.0007, "y": 0.3725},
    {"x": 0.0002, "y": 0.3682},
    {"x": 0.0, "y": 0.3609},
    {"x": 0.0008, "y": 0.3547},
    {"x": 0.0027, "y": 0.3494},
    {"x": 0.0054, "y": 0.3466},
    {"x": 0.011, "y": 0.3455},
    {"x": 0.016, "y": 0.3462},
    {"x": 0.0189, "y": 0.3468},
    {"x": 0.0222, "y": 0.3475},
    {"x": 0.0299, "y": 0.3477},
    {"x": 0.0332, "y": 0.3468},
    {"x": 0.0364, "y": 0.3449},
    {"x": 0.0399, "y": 0.3409},
    {"x": 0.0416, "y": 0.3377},
    {"x": 0.0429, "y": 0.3343},
    {"x": 0.0439, "y": 0.3314},
    {"x": 0.0449, "y": 0.3281},
    {"x": 0.047, "y": 0.32},
    {"x": 0.048, "y": 0.3159},
    {"x": 0.0499, "y": 0.3084},
    {"x": 0.051, "y": 0.3037},
    {"x": 0.0536, "y": 0.294},
    {"x": 0.0564, "y": 0.2851},
    {"x": 0.0592, "y": 0.2775},
    {"x": 0.0624, "y": 0.2698},
    {"x": 0.0673, "y": 0.2595},
    {"x": 0.0714, "y": 0.2522},
    {"x": 0.0748, "y": 0.2467},
    {"x": 0.0776, "y": 0.2423},
    {"x": 0.0892, "y": 0.2264},
    {"x": 0.0997, "y": 0.2144},
    {"x": 0.1096, "y": 0.2045},
    {"x": 0.1152, "y": 0.1993},
    {"x": 0.1262, "y": 0.1898},
    {"x": 0.1334, "y": 0.1836},
    {"x": 0.1436, "y": 0.175},
    {"x": 0.1518, "y": 0.168},
    {"x": 0.1589, "y": 0.1621},
    {"x": 0.1729, "y": 0.1502},
    {"x": 0.1808, "y": 0.1435},
    {"x": 0.1946, "y": 0.1319},
    {"x": 0.2087, "y": 0.12},
    {"x": 0.2123, "y": 0.1169},
    {"x": 0.2184, "y": 0.1118},
    {"x": 0.235, "y": 0.0979},
    {"x": 0.2412, "y": 0.0929},
    {"x": 0.2483, "y": 0.0873},
    {"x": 0.2654, "y": 0.0747},
    {"x": 0.2755, "y": 0.0678},
    {"x": 0.2832, "y": 0.0628},
    {"x": 0.3008, "y": 0.0521},
    {"x": 0.3145, "y": 0.0447},
    {"x": 0.3286, "y": 0.0381},
    {"x": 0.341, "y": 0.0326},
    {"x": 0.3498, "y": 0.0286},
    {"x": 0.3671, "y": 0.0213},
    {"x": 0.3792, "y": 0.0165},
    {"x": 0.3924, "y": 0.0113},
    {"x": 0.4063, "y": 0.0058},
    {"x": 0.4137, "y": 0.003},
    {"x": 0.4244, "y": 0.0},
    {"x": 0.4341, "y": 0.0001},
    {"x": 0.4391, "y": 0.0012},
    {"x": 0.4444, "y": 0.0031},
    {"x": 0.4511, "y": 0.0067},
    {"x": 0.456, "y": 0.0106},
    {"x": 0.4641, "y": 0.0217},
    {"x": 0.4664, "y": 0.0291},
    {"x": 0.4671, "y": 0.0353},
    {"x": 0.4666, "y": 0.0423},
    {"x": 0.4653, "y": 0.0487},
    {"x": 0.4643, "y": 0.0522},
    {"x": 0.4611, "y": 0.0599},
    {"x": 0.4545, "y": 0.0706},
    {"x": 0.4512, "y": 0.0746},
    {"x": 0.4438, "y": 0.0819},
    {"x": 0.436, "y": 0.0863},
    {"x": 0.4311, "y": 0.0879},
    {"x": 0.4154, "y": 0.0904},
    {"x": 0.4034, "y": 0.0915},
    {"x": 0.3921, "y": 0.0937},
    {"x": 0.3863, "y": 0.0947},
    {"x": 0.3768, "y": 0.0959},
    {"x": 0.3669, "y": 0.0968},
    {"x": 0.3568, "y": 0.0976},
    {"x": 0.3473, "y": 0.0983},
    {"x": 0.3401, "y": 0.0989},
    {"x": 0.3328, "y": 0.0995},
    {"x": 0.3254, "y": 0.1},
    {"x": 0.317, "y": 0.1008},
    {"x": 0.3062, "y": 0.1023},
    {"x": 0.2981, "y": 0.1042},
    {"x": 0.2917, "y": 0.1065},
    {"x": 0.2839, "y": 0.1101},
    {"x": 0.2732, "y": 0.1161},
    {"x": 0.2694, "y": 0.1185},
    {"x": 0.2542, "y": 0.129},
    {"x": 0.2477, "y": 0.1342},
    {"x": 0.2396, "y": 0.1422},
    {"x": 0.2357, "y": 0.1472},
    {"x": 0.2312, "y": 0.1546},
    {"x": 0.2275, "y": 0.1632},
    {"x": 0.2253, "y": 0.1705},
    {"x": 0.2239, "y": 0.1761},
    {"x": 0.2222, "y": 0.1846},
    {"x": 0.2216, "y": 0.1883},
    {"x": 0.2204, "y": 0.1997},
    {"x": 0.2205, "y": 0.2094},
    {"x": 0.2212, "y": 0.2154},
    {"x": 0.2222, "y": 0.2194},
    {"x": 0.2232, "y": 0.2222},
    {"x": 0.226, "y": 0.226},
    {"x": 0.2306, "y": 0.2289},
    {"x": 0.236, "y": 0.2301},
    {"x": 0.2393, "y": 0.2304},
    {"x": 0.2453, "y": 0.2304},
    {"x": 0.2501, "y": 0.2299},
    {"x": 0.2546, "y": 0.2294},
    {"x": 0.2599, "y": 0.2293},
    {"x": 0.2654, "y": 0.2302},
    {"x": 0.2696, "y": 0.2318},
    {"x": 0.2743, "y": 0.2347},
    {"x": 0.2771, "y": 0.2368},
    {"x": 0.2802, "y": 0.2395},
    {"x": 0.283, "y": 0.2424},
    {"x": 0.2862, "y": 0.2468},
    {"x": 0.2879, "y": 0.2506},
    {"x": 0.289, "y": 0.2546},
    {"x": 0.2898, "y": 0.2596},
    {"x": 0.2905, "y": 0.2684},
    {"x": 0.2906, "y": 0.272},
    {"x": 0.2904, "y": 0.2795},
    {"x": 0.2897, "y": 0.2841},
    {"x": 0.2873, "y": 0.2914},
    {"x": 0.2843, "y": 0.2964},
    {"x": 0.2823, "y": 0.2988},
    {"x": 0.2791, "y": 0.3019},
    {"x": 0.2768, "y": 0.3038},
    {"x": 0.2691, "y": 0.3085},
    {"x": 0.2632, "y": 0.3106},
    {"x": 0.2563, "y": 0.3117},
    {"x": 0.2519, "y": 0.3118},
    {"x": 0.2467, "y": 0.3115},
    {"x": 0.2371, "y": 0.3105},
    {"x": 0.2299, "y": 0.3093},
    {"x": 0.2188, "y": 0.3077},
    {"x": 0.2106, "y": 0.3066},
    {"x": 0.2027, "y": 0.3055},
    {"x": 0.1918, "y": 0.3041},
    {"x": 0.1825, "y": 0.3027},
    {"x": 0.1724, "y": 0.3009},
    {"x": 0.1641, "y": 0.2994},
    {"x": 0.1489, "y": 0.2972},
    {"x": 0.1404, "y": 0.2969},
    {"x": 0.1306, "y": 0.2982},
    {"x": 0.1223, "y": 0.3009},
    {"x": 0.1143, "y": 0.3044},
    {"x": 0.1097, "y": 0.3073},
    {"x": 0.1037, "y": 0.3122},
    {"x": 0.0968, "y": 0.3207},
    {"x": 0.0893, "y": 0.3328},
    {"x": 0.0796, "y": 0.3489},
    {"x": 0.0737, "y": 0.3594},
    {"x": 0.0699, "y": 0.3675},
    {"x": 0.0664, "y": 0.3771},
    {"x": 0.0645, "y": 0.3849},
    {"x": 0.0634, "y": 0.391},
    {"x": 0.063, "y": 0.3952},
    {"x": 0.0627, "y": 0.4015},
    {"x": 0.0633, "y": 0.4096},
    {"x": 0.0647, "y": 0.416},
    {"x": 0.0659, "y": 0.4187},
    {"x": 0.0681, "y": 0.4216},
    {"x": 0.0733, "y": 0.4252},
    {"x": 0.0798, "y": 0.427},
    {"x": 0.0848, "y": 0.4276},
    {"x": 0.0895, "y": 0.4279},
    {"x": 0.0972, "y": 0.4287},
    {"x": 0.1035, "y": 0.4296},
    {"x": 0.1102, "y": 0.4303},
    {"x": 0.118, "y": 0.4307},
    {"x": 0.1313, "y": 0.4314},
    {"x": 0.1441, "y": 0.4321},
    {"x": 0.1556, "y": 0.4331},
    {"x": 0.1598, "y": 0.4336},
    {"x": 0.1662, "y": 0.4344}
]

CIRCUITS = {
    "abu_dhabi": {
        "name": "Yas Marina Circuit",
        "location": "Abu Dhabi, UAE",
        "points": YAS_MARINA_POINTS,
        "drs_zones": [
            {"start": 0.0, "end": 0.10},
            {"start": 0.50, "end": 0.70},
        ],
    },
}


@router.get("/track/current")
async def get_current_track():
    """Get track for current F1 session (LIVE mode)"""
    session_info = await fetch_current_session()
    
    if session_info:
        cache_key = f"current_{session_info.get('session_key')}"
        if cache_key in _track_cache:
            points = _track_cache[cache_key]
        else:
            points = await fetch_track_from_openf1(session_info.get("session_key"))
            if points:
                _track_cache[cache_key] = points
        
        if points:
            return {
                "name": session_info.get("meeting_name", "Current Circuit"),
                "location": session_info.get("country_name", "Unknown"),
                "circuit_key": session_info.get("circuit_short_name", "").lower().replace(" ", "_"),
                "session_name": session_info.get("session_name"),
                "points": points,
                "source": "openf1_live"
            }
    
    return {**CIRCUITS["abu_dhabi"], "circuit_key": "abu_dhabi", "source": "fallback"}


@router.get("/track/{circuit}")
async def get_track(circuit: str, use_openf1: bool = False, session_key: str = "latest"):
    """Return track geometry for a specific circuit (DEMO mode)"""
    if circuit not in CIRCUITS:
        return {"error": f"Unknown circuit: {circuit}", "available": list(CIRCUITS.keys())}
    
    track_data = CIRCUITS[circuit].copy()
    
    if use_openf1:
        cache_key = f"{circuit}_{session_key}"
        if cache_key in _track_cache:
            points = _track_cache[cache_key]
        else:
            points = await fetch_track_from_openf1(session_key)
            if points:
                _track_cache[cache_key] = points
        
        if points:
            track_data["points"] = points
            track_data["source"] = "openf1"
    
    return track_data


def get_track_points():
    """Get current track points for WebSocket car positioning"""
    return YAS_MARINA_POINTS
