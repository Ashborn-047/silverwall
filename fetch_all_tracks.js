const fs = require('fs');
const path = require('path');
const https = require('https');

// Circuit mapping: circuit_key -> session_key (from recent races)
const circuits = {
  6: { name: 'monaco', session: 9553 },           // Monaco 2024
  7: { name: 'spa', session: 9536 },              // Belgium 2024
  9: { name: 'silverstone', session: 9515 },      // British 2024
  10: { name: 'melbourne', session: 9475 },      // Australia 2024
  14: { name: 'monza', session: 9560 },         // Italy 2024
  15: { name: 'catalunya', session: 9524 },      // Spain 2024
  23: { name: 'montreal', session: 9522 },      // Canada 2024
  24: { name: 'yas_marina', session: 9573 },     // Abu Dhabi 2024
  32: { name: 'losail', session: 9481 },         // Qatar 2024
  49: { name: 'shanghai', session: 9506 },       // China 2024
  55: { name: 'zandvoort', session: 9570 },      // Netherlands 2024
  61: { name: 'marina_bay', session: 9545 },     // Singapore 2024
  63: { name: 'bahrain', session: 9472 },        // Bahrain 2024
  65: { name: 'mexico_city', session: 9568 },    // Mexico 2024
  69: { name: 'austin', session: 9563 },         // USA 2024
  70: { name: 'red_bull_ring', session: 9500 },  // Austria 2024
  76: { name: 'jeddah', session: 9477 },         // Saudi Arabia 2024
  77: { name: 'suzuka', session: 9493 },         // Japan 2024
  80: { name: 'miami', session: 9486 },           // Miami 2024
};

const outputDir = path.join(__dirname, 'track_geometries');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function normalizePoints(points) {
  if (!points || points.length === 0) return [];
  
  // Extract x, y coordinates
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  const rangeX = maxX - minX;
  const rangeY = maxY - minY;
  const maxRange = Math.max(rangeX, rangeY) || 1;
  
  // Normalize to 0-1 and sample every 10th point for efficiency
  return points
    .filter((_, i) => i % 10 === 0)
    .map(p => ({
      x: Number(((p.x - minX) / maxRange).toFixed(4)),
      y: Number(((p.y - minY) / maxRange).toFixed(4))
    }));
}

async function fetchTrack(circuitKey, sessionKey, name) {
  try {
    console.log(`Fetching ${name} (circuit ${circuitKey}, session ${sessionKey})...`);
    
    const url = `https://api.openf1.org/v1/location?session_key=${sessionKey}&driver_number=1`;
    const data = await fetchJSON(url);
    
    if (!data || data.length === 0) {
      console.log(`  ❌ No data for ${name}`);
      return;
    }
    
    // Filter out invalid points
    const validPoints = data.filter(p => 
      p.x !== null && p.y !== null && 
      Math.abs(p.x) > 0.1 && Math.abs(p.y) > 0.1
    );
    
    if (validPoints.length === 0) {
      console.log(`  ❌ No valid points for ${name}`);
      return;
    }
    
    const normalized = normalizePoints(validPoints);
    
    fs.writeFileSync(
      path.join(outputDir, `${name}.json`),
      JSON.stringify(normalized, null, 2)
    );
    
    console.log(`  ✅ Saved ${normalized.length} points for ${name}`);
  } catch (error) {
    console.error(`  ❌ Error fetching ${name}: ${error.message}`);
  }
}

async function run() {
  console.log('Fetching track geometries from OpenF1...\n');
  
  const entries = Object.entries(circuits);
  
  for (const [circuitKey, { name, session }] of entries) {
    await fetchTrack(circuitKey, session, name);
    // Rate limiting - wait 2 seconds between requests
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('\n✅ Done! Check track_geometries/ folder');
}

run();
