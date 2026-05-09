const https = require('https');
const fs = require('fs');

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function normalizePoints(points) {
  if (!points || points.length === 0) return [];
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const maxRange = Math.max(maxX - minX, maxY - minY) || 1;
  return points.map(p => ({
    x: Number(((p.x - minX) / maxRange).toFixed(4)),
    y: Number(((p.y - minY) / maxRange).toFixed(4))
  }));
}

// Remove duplicate consecutive points
function dedupe(points) {
  return points.filter((p, i) => {
    if (i === 0) return true;
    const prev = points[i-1];
    const dist = Math.sqrt(Math.pow(p.x - prev.x, 2) + Math.pow(p.y - prev.y, 2));
    return dist > 0.001;
  });
}

(async () => {
  try {
    console.log('Fetching clean lap data for Montreal...');
    
    // Get all location data
    const url = 'https://api.openf1.org/v1/location?session_key=9523&driver_number=1';
    const data = await fetchJSON(url);
    console.log('Total points:', data.length);
    
    // Filter valid points
    const valid = data.filter(p => p.x !== null && p.y !== null && Math.abs(p.x) > 0.1);
    console.log('Valid points:', valid.length);
    
    if (valid.length === 0) return;
    
    // Try to detect lap by finding continuous movement
    // Group points by continuous motion
    let laps = [];
    let currentLap = [];
    let lastDist = 0;
    
    for (let i = 0; i < valid.length; i++) {
      const p = valid[i];
      if (i === 0) {
        currentLap.push(p);
        continue;
      }
      
      const prev = valid[i-1];
      const dist = Math.sqrt(Math.pow(p.x - prev.x, 2) + Math.pow(p.y - prev.y, 2));
      
      // If jumped too far, likely new lap or pit stop
      if (dist > 1000 && currentLap.length > 100) {
        laps.push(currentLap);
        currentLap = [p];
      } else {
        currentLap.push(p);
      }
      lastDist = dist;
    }
    
    if (currentLap.length > 100) laps.push(currentLap);
    
    console.log('Detected laps:', laps.length);
    
    // Find the lap with most points (likely the full race lap)
    const bestLap = laps.sort((a, b) => b.length - a.length)[0];
    console.log('Best lap points:', bestLap?.length);
    
    if (!bestLap) return;
    
    // Sample to get ~60 clean points
    const step = Math.ceil(bestLap.length / 60);
    const sampled = bestLap.filter((_, i) => i % step === 0);
    
    const normalized = normalizePoints(sampled);
    const deduped = dedupe(normalized);
    
    console.log('Final clean points:', deduped.length);
    fs.writeFileSync('track_geometries/montreal.json', JSON.stringify(deduped, null, 2));
    console.log('✅ Saved clean Montreal track');
    
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
