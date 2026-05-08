import axios from 'axios';
import fs from 'fs';
import path from 'path';

const OPENF1 = 'https://api.openf1.org/v1';

async function sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms));
}

async function fetchWithRetry(url: string, params: any): Promise<any> {
    try {
        const resp = await axios.get(url, { params });
        return resp.data;
    } catch (e: any) {
        if (e.response?.status === 429) {
            console.log(`    Rate limited on ${url}. Waiting 65s...`);
            await sleep(65000);
            return fetchWithRetry(url, params);
        }
        throw e;
    }
}

async function main() {
    const years = [2024, 2025, 2026];
    const cacheDir = path.join(process.cwd(), 'cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    for (const year of years) {
        console.log(`\n--- Fetching ${year} ---`);
        
        console.log(`  Fetching meetings...`);
        const meetings = await fetchWithRetry(`${OPENF1}/meetings`, { year });
        fs.writeFileSync(path.join(cacheDir, `meetings_${year}.json`), JSON.stringify(meetings, null, 2));
        console.log(`  ✅ Saved meetings_${year}.json`);
        await sleep(5000);

        console.log(`  Fetching sessions...`);
        const sessions = await fetchWithRetry(`${OPENF1}/sessions`, { year });
        fs.writeFileSync(path.join(cacheDir, `sessions_${year}.json`), JSON.stringify(sessions, null, 2));
        console.log(`  ✅ Saved sessions_${year}.json`);
        await sleep(5000);
    }

    console.log('\n✅ Data cached! Now run the seed script.');
}

main();
