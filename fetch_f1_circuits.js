const fs = require('fs');
const https = require('https');
const path = require('path');

const outputDir = path.join(__dirname, 'track_geometries');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// Map circuit names to bacinger/f1-circuits repo file codes (country-year format)
const circuits = {
  bahrain: 'bh-2004',           // Bahrain International Circuit
  jeddah: 'sa-2021',            // Jeddah Street Circuit  
  melbourne: 'au-1953',         // Albert Park
  suzuka: 'jp-1962',            // Suzuka Circuit
  shanghai: 'cn-2004',          // Shanghai International Circuit
  miami: 'us-2022',             // Miami International Autodrome
  imola: 'it-1953',             // Autodromo Enzo e Dino Ferrari
  monaco: 'mc-1929',            // Circuit de Monaco
  montreal: 'ca-1978',          // Circuit Gilles Villeneuve
  catalunya: 'es-1991',         // Circuit de Barcelona-Catalunya
  red_bull_ring: 'at-1969',     // Red Bull Ring
  silverstone: 'gb-1948',       // Silverstone Circuit
  hungaroring: 'hu-1986',       // Hungaroring
  spa: 'be-1921',               // Circuit de Spa-Francorchamps
  zandvoort: 'nl-1948',         // Circuit Zandvoort
  monza: 'it-1922',             // Autodromo Nazionale Monza
  baku: 'az-2016',              // Baku City Circuit
  singapore: 'sg-2008',         // Marina Bay Street Circuit
  austin: 'us-2012',            // Circuit of the Americas
  mexico_city: 'mx-1962',       // Autodromo Hermanos Rodriguez
  interlagos: 'br-1940',        // Interlagos
  vegas: 'us-2023',             // Las Vegas Street Circuit
  qatar: 'qa-2004',             // Losail International Circuit
  yas_marina: 'ae-2009'         // Yas Marina Circuit
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

// Douglas-Peucker path simplification
function perpendicularDistance(point, lineStart, lineEnd) {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag === 0) return Math.sqrt((point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2);
  return Math.abs(dx * (lineStart.y - point.y) - (lineStart.x - point.x) * dy) / mag;
}

function douglasPeucker(points, epsilon) {
  if (points.length < 3) return points;
  let maxDist = 0, maxIdx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }
  if (maxDist > epsilon) {
    const left = douglasPeucker(points.slice(0, maxIdx + 1), epsilon);
    const right = douglasPeucker(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [points[0], points[points.length - 1]];
}

async function fetchCircuit(name, fileName) {
  try {
    console.log(`Fetching ${name}...`);
    
    // Fetch from bacinger/f1-circuits repo (country-year format like bh-2004, ca-1978)
    const url = `https://raw.githubusercontent.com/bacinger/f1-circuits/refs/heads/master/circuits/${fileName}.geojson`;
    const geojson = await fetchJSON(url);
    
    if (!geojson.features || geojson.features.length === 0) {
      console.log(`  ❌ No features in GeoJSON`);
      return;
    }
    
    // Extract coordinates from GeoJSON
    // GeoJSON uses [lng, lat] format
    let coords;
    const geometry = geojson.features[0].geometry;
    
    if (geometry.type === 'Polygon') {
      coords = geometry.coordinates[0]; // Outer ring
    } else if (geometry.type === 'LineString') {
      coords = geometry.coordinates;
    } else if (geometry.type === 'MultiPolygon') {
      coords = geometry.coordinates[0][0]; // First polygon, outer ring
    } else {
      console.log(`  ❌ Unsupported geometry type: ${geometry.type}`);
      return;
    }
    
    console.log(`  Raw: ${coords.length} points`);
    
    // Convert [lng, lat] to {x, y}
    const points = coords.map(([lng, lat]) => ({ x: lng, y: lat }));
    
    // Normalize to 0-1
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));
    const range = Math.max(maxX - minX, maxY - minY) || 1;
    
    const normalized = points.map(p => ({
      x: +((p.x - minX) / range).toFixed(4),
      y: +((p.y - minY) / range).toFixed(4)
    }));
    
    // Apply Douglas-Peucker simplification (epsilon ~0.003 gives ~100-200 points)
    const simplified = douglasPeucker(normalized, 0.003);
    
    fs.writeFileSync(
      path.join(outputDir, `${name}.json`),
      JSON.stringify(simplified, null, 2)
    );
    
    console.log(`  ✅ Saved: ${simplified.length} clean points\n`);
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}\n`);
  }
}

async function run() {
  console.log('Fetching accurate F1 circuit data from bacinger/f1-circuits...\n');
  
  const entries = Object.entries(circuits);
  
  for (const [name, fileName] of entries) {
    await fetchCircuit(name, fileName);
    await new Promise(r => setTimeout(r, 500)); // Rate limit
  }
  
  console.log('\n✅ Done! Accurate track geometries saved to track_geometries/');
}

run();
