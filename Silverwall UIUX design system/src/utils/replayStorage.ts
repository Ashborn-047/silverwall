// ============================================================================
// 💾 CLIENT-SIDE REPLAY STORAGE (IndexedDB Cache)
// Enables zero-bandwidth, zero-cost offline telemetry replay storage
// ============================================================================

const DB_NAME = 'silverwall_replays_db';
const DB_VERSION = 1;
const STORE_NAME = 'telemetry_sessions';

function openDb(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !window.indexedDB) {
        return Promise.resolve(null);
    }

    return new Promise((resolve) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: any) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'sessionKey' });
            }
        };

        request.onsuccess = (event: any) => {
            resolve(event.target.result);
        };

        request.onerror = () => {
            console.warn('IndexedDB unavailable, falling back to memory cache.');
            resolve(null);
        };
    });
}

// In-memory fallback if IndexedDB is disabled/blocked in private mode
const memoryCache = new Map<number, any>();

export async function getCachedReplay(sessionKey: number): Promise<any | null> {
    if (memoryCache.has(sessionKey)) {
        return memoryCache.get(sessionKey);
    }

    try {
        const db = await openDb();
        if (!db) return null;

        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(sessionKey);

            req.onsuccess = () => {
                const data = req.result?.data || null;
                if (data) memoryCache.set(sessionKey, data);
                resolve(data);
            };

            req.onerror = () => resolve(null);
        });
    } catch {
        return null;
    }
}

export async function saveCachedReplay(sessionKey: number, data: any): Promise<void> {
    memoryCache.set(sessionKey, data);

    try {
        const db = await openDb();
        if (!db) return;

        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put({ sessionKey, data, savedAt: Date.now() });
    } catch (err) {
        console.warn('Failed to save to IndexedDB cache:', err);
    }
}
