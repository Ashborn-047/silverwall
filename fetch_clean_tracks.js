const fs = require('fs');
const https = require('https');
const path = require('path');

const outputDir = path.join(__dirname, 'track_geometries');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// Circuits with session keys from 2024 races
const circuits = {
  montreal: { id: 23, session: 9523 }, // Canada 2024 Race
  bahrain: { id: 63, session: 9472 },  // Bahrain 2024 Race
  jeddah: { id: 76, session: 9479 },   // Saudi Arabia 2024 Race
  melbourne: { id: 10, session: 9475 }, // Australia 2024 Race
  suzuka: { id: 77, session: 9493 },   // Japan 2024 Race
  shanghai: { id: 49, session: 9506 },  // China 2024 Race
  silverstone: { id: 9, session: 9515 }, // British 2024 Race
  monza: { id: 14, session: 9560 },    // Italy 2024 Race
  monaco: { id: 6, session: 9553 },     // Monaco 2024 Race
  spa: { id: 7, session: 9538 },        // Belgium 2024 Race
  catalunya: { id: 15, session: 9524 }, // Spain 2024 Race
  marina_bay: { id: 61, session: 9545 }, // Singapore 2024 Race
};

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

// Apply backend filtering logic with date sorting
function cleanTrackData(rawPoints) {
  if (!rawPoints || rawPoints.length === 0) return [];
  
  // Step 1: SORT BY DATE FIRST (critical for lap order)
  const sorted = rawPoints.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Step 2: Remove invalid GPS locks (0,0 points)
  let points = sorted.filter(p => {
    return p.x !== null && p.y !== null && (Math.abs(p.x) > 0.1 || Math.abs(p.y) > 0.1);
  });
  
  if (points.length < 100) return [];
  
  // Step 3: Remove outliers (points too far from center)
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const avgX = xs.reduce((a, b) => a + b, 0) / xs.length;
  const avgY = ys.reduce((a, b) => a + b, 0) / ys.length;
  
  points = points.filter(p => {
    return Math.abs(p.x - avgX) < 20000 && Math.abs(p.y - avgY) < 20000;
  });
  
  if (points.length < 100) return [];
  
  // Step 4: Find a clean lap by detecting loop closure
  const startX = points[0].x;
  const startY = points[0].y;
  const threshold = 300; // Distance to consider "back at start"
  
  const minLapPoints = Math.floor(points.length * 0.2);
  let lapEnd = points.length - 1;
  
  for (let i = minLapPoints; i < points.length; i++) {
    const dx = points[i].x - startX;
    const dy = points[i].y - startY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < threshold) {
      lapEnd = i;
      break;
    }
  }
  
  // Extract just one lap
  const lapPoints = points.slice(0, lapEnd + 1);
  
  // Step 5: Normalize to 0-1 coordinates
  const finalXs = lapPoints.map(p => p.x);
  const finalYs = lapPoints.map(p => p.y);
  const minX = Math.min(...finalXs), maxX = Math.max(...finalXs);
  const minY = Math.min(...finalYs), maxY = Math.max(...finalYs);
  const maxRange = Math.max(maxX - minX, maxY - minY) || 1;
  
  const normalized = lapPoints.map(p => ({
    x: +((p.x - minX) / maxRange).toFixed(4),
    y: +((p.y - minY) / maxRange).toFixed(4)
  }));
  
  // Step 6: Dedupe points that are too close together
  const deduped = normalized.filter((p, i) => {
    if (i === 0) return true;
    const prev = normalized[i - 1];
    return Math.abs(p.x - prev.x) + Math.abs(p.y - prev.y) > 0.004;
  });
  
  // Step 7: Downsample to ~70 points for clean SVG
  const target = 70;
  const step = Math.ceil(deduped.length / target);
  return deduped.filter((_, i) => i % step === 0);
}

async function fetchTrack(name, circuit) {
  try {
    console.log(`Fetching ${name}...`);
    
    const url = `https://api.openf1.org/v1/location?session_key=${circuit.session}&driver_number=1`;
    const data = await fetchJSON(url);
    
    if (!Array.isArray(data) || data.length === 0) {
      console.log(`  ❌ No data`);
      return;
    }
    
    console.log(`  Raw: ${data.length} points`);
    
    const cleaned = cleanTrackData(data);
    
    if (cleaned.length === 0) {
      console.log(`  ❌ Cleaning failed`);
      return;
    }
    
    fs.writeFileSync(
      path.join(outputDir, `${name}.json`),
      JSON.stringify(cleaned, null, 2)
    );
    
    console.log(`  ✅ Saved: ${cleaned.length} clean points\n`);
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}\n`);
  }
}

async function run() {
  console.log('Fetching clean track data from OpenF1...\n');
  
  const entries = Object.entries(circuits);
  
  for (const [name, circuit] of entries) {
    await fetchTrack(name, circuit);
    await new Promise(r => setTimeout(r, 2000)); // Rate limit
  }
  
  console.log('\n✅ Done!');
}

run();
