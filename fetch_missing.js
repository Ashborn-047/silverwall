const fs = require('fs');
const https = require('https');

const circuits = [
  { key: 23, session: 9524, name: 'montreal' },
  { key: 76, session: 9477, name: 'jeddah' },
  { key: 77, session: 9493, name: 'suzuka' },
  { key: 7, session: 9536, name: 'spa' },
];

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

async function fetchTrack(circuit) {
  try {
    const url = `https://api.openf1.org/v1/location?session_key=${circuit.session}&driver_number=1`;
    const data = await fetchJSON(url);
    if (!Array.isArray(data) || data.length === 0) {
      console.log(`❌ ${circuit.name}: No data`);
      return;
    }
    const valid = data.filter(p => p.x !== null && p.y !== null && Math.abs(p.x) > 0.1);
    const normalized = normalizePoints(valid);
    fs.writeFileSync(`track_geometries/${circuit.name}.json`, JSON.stringify(normalized, null, 2));
    console.log(`✅ ${circuit.name}: ${normalized.length} points`);
  } catch (e) {
    console.log(`❌ ${circuit.name}: ${e.message}`);
  }
}

(async () => {
  for (const c of circuits) {
    await fetchTrack(c);
    await new Promise(r => setTimeout(r, 2000));
  }
})();
