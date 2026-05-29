import axios from 'axios';

const CIRCUIT_KEY_TO_APEX_ID: Record<number, string> = {
    63: 'bahrain',
    49: 'shanghai',
    23: 'villeneuve', // Montreal / Canada
};

const apiKey = 'f1_apex_super_secret_dev_key';

async function testFetch(baseUrl: string, label: string) {
    console.log(`\n--- Testing ${label} API (${baseUrl}) ---`);
    for (const [circuitKey, apexId] of Object.entries(CIRCUIT_KEY_TO_APEX_ID)) {
        const url = `${baseUrl}/api/circuits/${apexId}/geometry`;
        console.log(`Fetching geometry for circuit key ${circuitKey} -> '${apexId}' from ${url}...`);
        try {
            const start = Date.now();
            const resp = await axios.get(url, {
                headers: { 'x-api-key': apiKey },
                timeout: 8000
            });
            const duration = Date.now() - start;
            if (resp.status === 200 && resp.data?.geometry) {
                console.log(`✅ Success! Received ${resp.data.geometry.length} points for ${apexId} in ${duration}ms.`);
                console.log(`   Sample point: ${JSON.stringify(resp.data.geometry[0])}`);
            } else {
                console.error(`❌ Unexpected response: Status ${resp.status}`, resp.data);
            }
        } catch (e: any) {
            console.error(`❌ Error fetching from ${url}: ${e.message}`);
        }
    }
}

async function run() {
    // 1. Test Cloud Deployment (Fly.io)
    await testFetch('https://apex-api.fly.dev', 'Fly.io Cloud');

    // 2. Test Local Deployment (Localhost)
    // Note: Make sure the local dev server is running on port 3000!
    await testFetch('http://localhost:3000', 'Local Dev Server');
}

run();
