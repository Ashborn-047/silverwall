#!/usr/bin/env node
// fix_track_orientations.js
// Run: node fix_track_orientations.js
// This re-bakes all circuit points with correct Y-flip + per-circuit rotation.
// Output goes to src/data/tracks/ as individual TS files.

const { writeFileSync, readFileSync } = require('fs');
const path = require('path');

function processTrack(points, rotateDeg = 0) {
  // Step 1: Flip Y — GeoJSON lat increases upward, SVG Y increases downward
  let pts = points.map(p => ({ x: p.x, y: 1 - p.y }));

  // Step 2: Rotate if needed
  if (rotateDeg !== 0) {
    const rad = (rotateDeg * Math.PI) / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    pts = pts.map(p => ({
      x: p.x * cos - p.y * sin,
      y: p.x * sin + p.y * cos,
    }));
  }

  // Step 3: Normalize to [0,1] preserving aspect ratio
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const range = Math.max(maxX - minX, maxY - minY);

  return pts.map(p => ({
    x: +((p.x - minX) / range).toFixed(4),
    y: +((p.y - minY) / range).toFixed(4),
  }));
}

// Per-circuit rotation in degrees (CCW).
const ROTATIONS = {
  jeddah:     -90,
  montreal:   -90,
  interlagos: -90,
  yas_marina: -90,
};

// Circuit metadata
const META = {
  bahrain:       { id: 63,  name: "Bahrain International Circuit",        location: "Sakhir, Bahrain",          country: "BH", first_gp: 2004, length_km: 5.412, corners: 15 },
  jeddah:        { id: 76,  name: "Jeddah Street Circuit",                location: "Jeddah, Saudi Arabia",     country: "SA", first_gp: 2021, length_km: 6.174, corners: 27 },
  melbourne:     { id: 10,  name: "Albert Park Circuit",                  location: "Melbourne, Australia",     country: "AU", first_gp: 1996, length_km: 5.278, corners: 14 },
  suzuka:        { id: 77,  name: "Suzuka International Racing Course",   location: "Suzuka, Japan",            country: "JP", first_gp: 1987, length_km: 5.807, corners: 18 },
  shanghai:      { id: 49,  name: "Shanghai International Circuit",       location: "Shanghai, China",          country: "CN", first_gp: 2004, length_km: 5.451, corners: 16 },
  miami:         { id: 79,  name: "Miami International Autodrome",        location: "Miami, USA",               country: "US", first_gp: 2022, length_km: 5.412, corners: 19 },
  imola:         { id: 21,  name: "Autodromo Enzo e Dino Ferrari",        location: "Imola, Italy",             country: "IT", first_gp: 1980, length_km: 4.909, corners: 19 },
  monaco:        { id: 6,   name: "Circuit de Monaco",                    location: "Monte Carlo, Monaco",      country: "MC", first_gp: 1929, length_km: 3.337, corners: 19 },
  montreal:      { id: 23,  name: "Circuit Gilles Villeneuve",            location: "Montreal, Canada",         country: "CA", first_gp: 1978, length_km: 4.361, corners: 14 },
  catalunya:     { id: 15,  name: "Circuit de Barcelona-Catalunya",       location: "Montmelo, Spain",          country: "ES", first_gp: 1991, length_km: 4.675, corners: 14 },
  silverstone:   { id: 9,   name: "Silverstone Circuit",                  location: "Silverstone, UK",          country: "GB", first_gp: 1950, length_km: 5.891, corners: 18 },
  monza:         { id: 14,  name: "Autodromo Nazionale Monza",            location: "Monza, Italy",             country: "IT", first_gp: 1950, length_km: 5.793, corners: 11 },
  red_bull_ring: { id: 70,  name: "Red Bull Ring",                        location: "Spielberg, Austria",       country: "AT", first_gp: 1970, length_km: 4.318, corners: 10 },
  hungaroring:   { id: 4,   name: "Hungaroring",                          location: "Budapest, Hungary",        country: "HU", first_gp: 1986, length_km: 4.381, corners: 14 },
  zandvoort:     { id: 55,  name: "Circuit Zandvoort",                    location: "Zandvoort, Netherlands",   country: "NL", first_gp: 1952, length_km: 4.259, corners: 14 },
  baku:          { id: 73,  name: "Baku City Circuit",                    location: "Baku, Azerbaijan",         country: "AZ", first_gp: 2016, length_km: 6.003, corners: 20 },
  singapore:     { id: 61,  name: "Marina Bay Street Circuit",            location: "Singapore",                country: "SG", first_gp: 2008, length_km: 4.940, corners: 19 },
  austin:        { id: 69,  name: "Circuit of the Americas",              location: "Austin, USA",              country: "US", first_gp: 2012, length_km: 5.513, corners: 20 },
  mexico_city:   { id: 32,  name: "Autodromo Hermanos Rodriguez",         location: "Mexico City, Mexico",      country: "MX", first_gp: 1963, length_km: 4.304, corners: 17 },
  interlagos:    { id: 18,  name: "Autodromo Jose Carlos Pace",           location: "Sao Paulo, Brazil",        country: "BR", first_gp: 1973, length_km: 4.309, corners: 15 },
  vegas:         { id: 80,  name: "Las Vegas Strip Circuit",              location: "Las Vegas, USA",           country: "US", first_gp: 2023, length_km: 6.201, corners: 17 },
  qatar:         { id: 78,  name: "Losail International Circuit",         location: "Lusail, Qatar",            country: "QA", first_gp: 2021, length_km: 5.419, corners: 16 },
  yas_marina:    { id: 24,  name: "Yas Marina Circuit",                   location: "Abu Dhabi, UAE",           country: "AE", first_gp: 2009, length_km: 5.281, corners: 16 },
};

// Load points from ALL_TRACKS_TEMP.json
const allTracksPath = path.join(__dirname, 'ALL_TRACKS_TEMP.json');
const allTracksContent = readFileSync(allTracksPath, 'utf8');
const allTracksData = JSON.parse(allTracksContent);

const RAW = {};
for (const key of Object.keys(META)) {
  if (allTracksData[key]) {
    RAW[key] = {
      id: META[key].id,
      rot: ROTATIONS[key] || 0,
      pts: allTracksData[key].points
    };
  } else {
    console.error(`Track ${key} not found in ALL_TRACKS_TEMP.json`);
  }
}

// ─── GENERATE OUTPUT ───────────────────────────────────────────────────────────
const outputDir = path.join(__dirname, 'Silverwall UIUX design system', 'src', 'data', 'tracks');

for (const [key, { id, rot, pts }] of Object.entries(RAW)) {
  const processed = processTrack(pts, rot);
  const meta = META[key];
  const ts = `import { CircuitMetadata } from './types';

export const ${key}: CircuitMetadata = {
  id: ${id},
  name: "${meta.name}",
  location: "${meta.location}",
  country: "${meta.country}",
  first_gp: ${meta.first_gp},
  length_km: ${meta.length_km},
  corners: ${meta.corners},
  points: ${JSON.stringify(processed, null, 2)},
};
`;
  const outputPath = path.join(outputDir, `${key}.ts`);
  writeFileSync(outputPath, ts);
  const xs = processed.map(p=>p.x), ys = processed.map(p=>p.y);
  const w = (Math.max(...xs)-Math.min(...xs)).toFixed(2);
  const h = (Math.max(...ys)-Math.min(...ys)).toFixed(2);
  console.log(`✓ ${key.padEnd(16)} rot=${String(rot).padStart(4)}°  aspect=${(w/h).toFixed(2)}  pts=${processed.length}`);
}
console.log('\nDone. Files written to: ' + outputDir);
