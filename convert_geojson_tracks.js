const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, 'track_geometries');
const outputDir = path.join(__dirname, 'Silverwall UIUX design system', 'src', 'data', 'tracks');

const circuitMeta = {
  bahrain: { id: 63, name: 'Bahrain International Circuit', location: 'Sakhir, Bahrain', country: 'Bahrain', length_km: 5.412, corners: 15, first_gp: 2004, lap_record: { time: '1:31.447', driver: 'Pedro de la Rosa', year: 2005 } },
  jeddah: { id: 76, name: 'Jeddah Street Circuit', location: 'Jeddah, Saudi Arabia', country: 'Saudi Arabia', length_km: 6.174, corners: 27, first_gp: 2021, lap_record: { time: '1:30.734', driver: 'Lewis Hamilton', year: 2021 } },
  melbourne: { id: 10, name: 'Albert Park Circuit', location: 'Melbourne, Australia', country: 'Australia', length_km: 5.278, corners: 14, first_gp: 1996, lap_record: { time: '1:20.260', driver: 'Sergio Perez', year: 2023 } },
  suzuka: { id: 77, name: 'Suzuka International Racing Course', location: 'Suzuka, Japan', country: 'Japan', length_km: 5.807, corners: 18, first_gp: 1987, lap_record: { time: '1:30.983', driver: 'Lewis Hamilton', year: 2019 } },
  shanghai: { id: 49, name: 'Shanghai International Circuit', location: 'Shanghai, China', country: 'China', length_km: 5.451, corners: 16, first_gp: 2004, lap_record: { time: '1:32.238', driver: 'Michael Schumacher', year: 2004 } },
  miami: { id: 79, name: 'Miami International Autodrome', location: 'Miami, USA', country: 'USA', length_km: 5.412, corners: 19, first_gp: 2022, lap_record: { time: '1:29.708', driver: 'Max Verstappen', year: 2023 } },
  imola: { id: 21, name: 'Autodromo Enzo e Dino Ferrari', location: 'Imola, Italy', country: 'Italy', length_km: 4.909, corners: 19, first_gp: 1980, lap_record: { time: '1:15.484', driver: 'Lewis Hamilton', year: 2020 } },
  monaco: { id: 6, name: 'Circuit de Monaco', location: 'Monte Carlo, Monaco', country: 'Monaco', length_km: 3.337, corners: 19, first_gp: 1929, lap_record: { time: '1:12.909', driver: 'Lewis Hamilton', year: 2021 } },
  montreal: { id: 23, name: 'Circuit Gilles Villeneuve', location: 'Montreal, Canada', country: 'Canada', length_km: 4.361, corners: 14, first_gp: 1978, lap_record: { time: '1:13.078', driver: 'Valtteri Bottas', year: 2019 } },
  catalunya: { id: 15, name: 'Circuit de Barcelona-Catalunya', location: 'Montmelo, Spain', country: 'Spain', length_km: 4.675, corners: 14, first_gp: 1991, lap_record: { time: '1:16.330', driver: 'Max Verstappen', year: 2023 } },
  red_bull_ring: { id: 70, name: 'Red Bull Ring', location: 'Spielberg, Austria', country: 'Austria', length_km: 4.318, corners: 10, first_gp: 1970, lap_record: { time: '1:05.619', driver: 'Carlos Sainz', year: 2020 } },
  silverstone: { id: 9, name: 'Silverstone Circuit', location: 'Silverstone, UK', country: 'UK', length_km: 5.891, corners: 18, first_gp: 1950, lap_record: { time: '1:27.097', driver: 'Max Verstappen', year: 2020 } },
  hungaroring: { id: 4, name: 'Hungaroring', location: 'Budapest, Hungary', country: 'Hungary', length_km: 4.381, corners: 14, first_gp: 1986, lap_record: { time: '1:16.627', driver: 'Lewis Hamilton', year: 2020 } },
  spa: { id: 7, name: 'Circuit de Spa-Francorchamps', location: 'Stavelot, Belgium', country: 'Belgium', length_km: 7.004, corners: 20, first_gp: 1922, lap_record: { time: '1:46.331', driver: 'Valtteri Bottas', year: 2018 } },
  zandvoort: { id: 55, name: 'Circuit Zandvoort', location: 'Zandvoort, Netherlands', country: 'Netherlands', length_km: 4.259, corners: 14, first_gp: 1952, lap_record: { time: '1:11.097', driver: 'Lewis Hamilton', year: 2021 } },
  monza: { id: 14, name: 'Autodromo Nazionale Monza', location: 'Monza, Italy', country: 'Italy', length_km: 5.793, corners: 11, first_gp: 1950, lap_record: { time: '1:21.046', driver: 'Rubens Barrichello', year: 2004 } },
  baku: { id: 73, name: 'Baku City Circuit', location: 'Baku, Azerbaijan', country: 'Azerbaijan', length_km: 6.003, corners: 20, first_gp: 2016, lap_record: { time: '1:43.009', driver: 'Charles Leclerc', year: 2019 } },
  singapore: { id: 61, name: 'Marina Bay Street Circuit', location: 'Singapore', country: 'Singapore', length_km: 4.940, corners: 19, first_gp: 2008, lap_record: { time: '1:41.905', driver: 'Kevin Magnussen', year: 2018 } },
  austin: { id: 69, name: 'Circuit of the Americas', location: 'Austin, USA', country: 'USA', length_km: 5.513, corners: 20, first_gp: 2012, lap_record: { time: '1:36.169', driver: 'Charles Leclerc', year: 2019 } },
  mexico_city: { id: 32, name: 'Autodromo Hermanos Rodriguez', location: 'Mexico City, Mexico', country: 'Mexico', length_km: 4.304, corners: 17, first_gp: 1963, lap_record: { time: '1:17.774', driver: 'Valtteri Bottas', year: 2021 } },
  interlagos: { id: 18, name: 'Autodromo Jose Carlos Pace', location: 'Sao Paulo, Brazil', country: 'Brazil', length_km: 4.309, corners: 15, first_gp: 1973, lap_record: { time: '1:10.540', driver: 'Valtteri Bottas', year: 2018 } },
  vegas: { id: 80, name: 'Las Vegas Strip Circuit', location: 'Las Vegas, USA', country: 'USA', length_km: 6.201, corners: 17, first_gp: 2023, lap_record: { time: '1:35.490', driver: 'Oscar Piastri', year: 2024 } },
  qatar: { id: 78, name: 'Losail International Circuit', location: 'Lusail, Qatar', country: 'Qatar', length_km: 5.419, corners: 16, first_gp: 2021, lap_record: { time: '1:24.319', driver: 'Max Verstappen', year: 2023 } },
  yas_marina: { id: 24, name: 'Yas Marina Circuit', location: 'Abu Dhabi, UAE', country: 'UAE', length_km: 5.281, corners: 16, first_gp: 2009, lap_record: { time: '1:26.103', driver: 'Max Verstappen', year: 2021 } }
};

function convertTrack(name) {
  const jsonPath = path.join(inputDir, name + ".json");
  if (!fs.existsSync(jsonPath)) {
    console.log("Missing: " + name);
    return;
  }
  const points = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const meta = circuitMeta[name];
  if (!meta) {
    console.log("No meta: " + name);
    return;
  }
  let pts = points.map(p => "    { x: " + p.x + ", y: " + p.y + " }").join(",\n");
  let content = "import { CircuitMetadata } from \"./types\";\n\n" +
    "export const " + name + ": CircuitMetadata = {\n" +
    "  id: " + meta.id + ",\n" +
    "  name: \"" + meta.name + "\",\n" +
    "  location: \"" + meta.location + "\",\n" +
    "  country: \"" + meta.country + "\",\n" +
    "  length_km: " + meta.length_km + ",\n" +
    "  corners: " + meta.corners + ",\n" +
    "  first_gp: " + meta.first_gp + ",\n" +
    "  lap_record: {\n" +
    "    time: \"" + meta.lap_record.time + "\",\n" +
    "    driver: \"" + meta.lap_record.driver + "\",\n" +
    "    year: " + meta.lap_record.year + "\n" +
    "  },\n" +
    "  points: [\n" + pts + "\n  ],\n" +
    "  svg_transform: \"scale(1,-1) translate(0,-1.1)\"\n};\n";
  fs.writeFileSync(path.join(outputDir, name + ".ts"), content);
  console.log("Done: " + name + " (" + points.length + " pts)");
}

console.log("Converting tracks...");
const files = fs.readdirSync(inputDir).filter(f => f.endsWith(".json"));
files.forEach(f => convertTrack(f.replace(".json", "")));
console.log("Finished!");
