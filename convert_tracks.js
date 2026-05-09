const fs = require('fs');
const path = require('path');

const tracksDir = path.join(__dirname, 'track_geometries');
const outputDir = path.join(__dirname, 'Silverwall UIUX design system', 'src', 'data', 'tracks');

// Circuit metadata
const circuitInfo = {
  bahrain: { id: 63, name: "Bahrain International Circuit", location: "Sakhir, Bahrain", country: "Bahrain", length_km: 5.412, corners: 15, first_gp: 2004, lap_record: { time: "1:31.447", driver: "Pedro de la Rosa", year: 2005 } },
  catalunya: { id: 15, name: "Circuit de Barcelona-Catalunya", location: "Montmeló, Spain", country: "Spain", length_km: 4.675, corners: 14, first_gp: 1991, lap_record: { time: "1:16.330", driver: "Max Verstappen", year: 2023 } },
  losail: { id: 32, name: "Losail International Circuit", location: "Lusail, Qatar", country: "Qatar", length_km: 5.419, corners: 16, first_gp: 2021, lap_record: { time: "1:24.319", driver: "Max Verstappen", year: 2023 } },
  marina_bay: { id: 61, name: "Marina Bay Street Circuit", location: "Singapore, Singapore", country: "Singapore", length_km: 4.940, corners: 19, first_gp: 2008, lap_record: { time: "1:35.867", driver: "Lewis Hamilton", year: 2023 } },
  melbourne: { id: 10, name: "Albert Park Circuit", location: "Melbourne, Australia", country: "Australia", length_km: 5.278, corners: 14, first_gp: 1996, lap_record: { time: "1:20.235", driver: "Sergio Pérez", year: 2023 } },
  mexico_city: { id: 65, name: "Autódromo Hermanos Rodríguez", location: "Mexico City, Mexico", country: "Mexico", length_km: 4.304, corners: 17, first_gp: 1963, lap_record: { time: "1:17.774", driver: "Valtteri Bottas", year: 2021 } },
  monaco: { id: 6, name: "Circuit de Monaco", location: "Monte Carlo, Monaco", country: "Monaco", length_km: 3.337, corners: 19, first_gp: 1929, lap_record: { time: "1:12.909", driver: "Lewis Hamilton", year: 2021 } },
  monza: { id: 14, name: "Autodromo Nazionale Monza", location: "Monza, Italy", country: "Italy", length_km: 5.793, corners: 11, first_gp: 1950, lap_record: { time: "1:21.046", driver: "Rubens Barrichello", year: 2004 } },
  shanghai: { id: 49, name: "Shanghai International Circuit", location: "Shanghai, China", country: "China", length_km: 5.451, corners: 16, first_gp: 2004, lap_record: { time: "1:32.238", driver: "Michael Schumacher", year: 2004 } },
  silverstone: { id: 9, name: "Silverstone Circuit", location: "Silverstone, UK", country: "UK", length_km: 5.891, corners: 18, first_gp: 1950, lap_record: { time: "1:27.097", driver: "Max Verstappen", year: 2020 } },
  zandvoort: { id: 55, name: "Circuit Zandvoort", location: "Zandvoort, Netherlands", country: "Netherlands", length_km: 4.259, corners: 14, first_gp: 1952, lap_record: { time: "1:11.097", driver: "Lewis Hamilton", year: 2021 } },
  montreal: { id: 23, name: "Circuit Gilles Villeneuve", location: "Montreal, Canada", country: "Canada", length_km: 4.361, corners: 14, first_gp: 1978, lap_record: { time: "1:13.078", driver: "Valtteri Bottas", year: 2019 } },
};

// Downsample points to ~60 for cleaner SVG
function downsample(points, target = 60) {
  if (points.length <= target) return points;
  const step = Math.ceil(points.length / target);
  return points.filter((_, i) => i % step === 0);
}

// Convert to TypeScript format
function toTypeScript(name, info, points) {
  const sampled = downsample(points);
  const pointsStr = sampled.map(p => `    { x: ${p.x}, y: ${p.y} }`).join(',\n');
  
  return `import { CircuitMetadata } from './types';

export const ${name}: CircuitMetadata = {
  id: ${info.id},
  name: "${info.name}",
  location: "${info.location}",
  country: "${info.country}",
  length_km: ${info.length_km},
  corners: ${info.corners},
  first_gp: ${info.first_gp},
  lap_record: {
    time: "${info.lap_record.time}",
    driver: "${info.lap_record.driver}",
    year: ${info.lap_record.year}
  },
  points: [
${pointsStr}
  ],
  svg_transform: "scale(1, -1) rotate(-90deg)"
};
`;
}

// Process each track
const files = fs.readdirSync(tracksDir).filter(f => f.endsWith('.json'));

console.log(`Converting ${files.length} tracks...\n`);

for (const file of files) {
  const name = file.replace('.json', '');
  const info = circuitInfo[name];
  
  if (!info) {
    console.log(`⚠️  Skipping ${name} - no metadata`);
    continue;
  }
  
  const points = JSON.parse(fs.readFileSync(path.join(tracksDir, file), 'utf8'));
  const tsContent = toTypeScript(name, info, points);
  
  fs.writeFileSync(path.join(outputDir, `${name}.ts`), tsContent);
  console.log(`✅ ${name}: ${points.length} points → ${downsample(points).length} points`);
}

console.log('\n✅ Done! Updated track files with real OpenF1 data.');
