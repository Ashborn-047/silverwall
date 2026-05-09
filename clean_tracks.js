const fs = require('fs');
const path = require('path');

const tracksDir = path.join(__dirname, 'track_geometries');

// Apply the same filtering as backend/routes/track.py
function cleanTrackData(rawPoints) {
  if (!rawPoints || rawPoints.length === 0) return [];
  
  // Step 1: Basic filtering - remove (0,0) and invalid GPS locks
  let points = rawPoints.filter(p => {
    const x = p.x;
    const y = p.y;
    return x !== null && y !== null && (Math.abs(x) > 0.1 || Math.abs(y) > 0.1);
  });
  
  if (points.length < 50) return [];
  
  // Step 2: Outlier removal using Z-score approximation
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const avgX = xs.reduce((a, b) => a + b, 0) / xs.length;
  const avgY = ys.reduce((a, b) => a + b, 0) / ys.length;
  
  // Remove points too far from average (F1 tracks within 5000-10000 units)
  const filteredPoints = points.filter(p => {
    return Math.abs(p.x - avgX) < 20000 && Math.abs(p.y - avgY) < 20000;
  });
  
  if (filteredPoints.length < 50) {
    return points; // Fallback if filtering too aggressive
  }
  
  // Step 3: Detect continuous lap by finding loop closure
  // Find where driver returns near start point
  const start = filteredPoints[0];
  const threshold = 500; // Distance threshold to detect lap completion
  
  let lapEnd = filteredPoints.length - 1;
  let foundLoop = false;
  
  // Look for point that comes back near start (after some minimum distance)
  for (let i = Math.floor(filteredPoints.length * 0.3); i < filteredPoints.length; i++) {
    const p = filteredPoints[i];
    const distToStart = Math.sqrt(Math.pow(p.x - start.x, 2) + Math.pow(p.y - start.y, 2));
    if (distToStart < threshold) {
      lapEnd = i;
      foundLoop = true;
      break;
    }
  }
  
  // Take only the first lap (or best continuous segment)
  const lapPoints = filteredPoints.slice(0, lapEnd + 1);
  
  // Step 4: Normalize to 0-1 range
  const finalXs = lapPoints.map(p => p.x);
  const finalYs = lapPoints.map(p => p.y);
  const minX = Math.min(...finalXs), maxX = Math.max(...finalXs);
  const minY = Math.min(...finalYs), maxY = Math.max(...finalYs);
  const maxRange = Math.max(maxX - minX, maxY - minY) || 1;
  
  const normalized = lapPoints.map(p => ({
    x: Number(((p.x - minX) / maxRange).toFixed(4)),
    y: Number(((p.y - minY) / maxRange).toFixed(4))
  }));
  
  // Step 5: Downsample to ~80 points for SVG
  const targetPoints = 80;
  const step = Math.ceil(normalized.length / targetPoints);
  return normalized.filter((_, i) => i % step === 0);
}

// Process each track
const files = fs.readdirSync(tracksDir).filter(f => f.endsWith('.json'));

console.log(`Cleaning ${files.length} tracks...\n`);

for (const file of files) {
  const name = file.replace('.json', '');
  const rawData = JSON.parse(fs.readFileSync(path.join(tracksDir, file), 'utf8'));
  
  // Check if already cleaned (has x,y format)
  if (rawData.length > 0 && rawData[0].x !== undefined && rawData[0].x < 1) {
    console.log(`⚠️  ${name}: Already normalized, skipping`);
    continue;
  }
  
  // Re-fetch raw data from original file if needed
  const rawPath = path.join(tracksDir, file);
  const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  
  // Filter to only x,y pairs (not normalized yet)
  const points = raw.filter(p => p.x !== undefined && p.y !== undefined);
  
  console.log(`${name}: ${points.length} raw points`);
  
  const cleaned = cleanTrackData(points);
  
  if (cleaned.length > 0) {
    fs.writeFileSync(rawPath, JSON.stringify(cleaned, null, 2));
    console.log(`  ✅ Cleaned to ${cleaned.length} points\n`);
  } else {
    console.log(`  ❌ Failed to clean\n`);
  }
}

console.log('✅ Done! Tracks cleaned with backend filtering logic.');
