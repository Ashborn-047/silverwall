import axios from 'axios';
import fs from 'fs';
import path from 'path';

const cacheDir = path.join(process.cwd(), 'cache');
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

async function fetchGeometry(circuitKey: number, sessionKey: number) {
    console.log(`Fetching geometry for circuit ${circuitKey} using session ${sessionKey}...`);
    try {
        const response = await axios.get(`https://api.openf1.org/v1/location?session_key=${sessionKey}`, { timeout: 10000 });
        if (response.data && response.data.length > 0) {
            // Sample points to reduce DB size but keep shape (e.g. every 5th point)
            const sampled = response.data.filter((_: any, i: number) => i % 5 === 0);
            fs.writeFileSync(path.join(cacheDir, `geometry_${circuitKey}.json`), JSON.stringify(sampled, null, 2));
            console.log(`✅ Cached ${sampled.length} points for circuit ${circuitKey}.`);
        } else {
            console.error(`❌ No geometry data found for session ${sessionKey}.`);
        }
    } catch (error: any) {
        console.error(`❌ Error fetching geometry for session ${sessionKey}: ${error.message}`);
    }
}

async function run() {
    await fetchGeometry(63, 9472); // Sakhir
    await fetchGeometry(49, 9508); // Shanghai
}

run();
