require('dotenv').config();
const Redis = process.env.NODE_ENV === 'test' ? class MockRedis extends require('events') {
    constructor() {
        super();
        this.status = 'ready';
    }
    duplicate() { return new MockRedis(); }
    disconnect() { this.status = 'end'; }
    call() { return Promise.resolve([]); }
    psubscribe() { return Promise.resolve(); }
    punsubscribe() { return Promise.resolve(); }
    subscribe() { return Promise.resolve(); }
    unsubscribe() { return Promise.resolve(); }
    publish() { return Promise.resolve(); }
} : require('ioredis');

const PLUMBER_GEO_KEY = 'plumbers_location';
const PLUMBER_HEARTBEAT_PREFIX = 'plumber:heartbeat:';
const PLUMBER_TTL_SECONDS = 300; // 5 minutes TTL to prevent phantom dispatch

// Connect to the Redis container initialized in Phase 1
let redis;
if (process.env.MOCK_EDGE === 'true') {
    const mockStore = new Map();
    redis = {
        geoadd: async (key, lon, lat, member) => {
            console.log(`[MOCK REDIS] GEOADD ${key} [MASKED] member=${member}`);
            return 1;
        },
        geosearch: async (key, from, lon, lat, by, radius, unit, ...args) => {
            console.log(`[MOCK REDIS] GEOSEARCH ${key} [MASKED] ${radius} ${unit}`);
            return [['1', '1.2'], ['2', '2.5']];
        },
        georadius: async (key, lon, lat, radius, unit, ...args) => {
            console.log(`[MOCK REDIS] GEORADIUS ${key} [MASKED] ${radius} ${unit}`);
            return [['1', '0.8'], ['2', '1.9']];
        },
        set: async (key, val, ex, ttl) => {
            console.log(`[MOCK REDIS] SET ${key} = ${key.startsWith('otp:') ? '[MASKED]' : val} (TTL: ${ttl})`);
            mockStore.set(key, val);
            return 'OK';
        },
        get: async (key) => {
            const val = mockStore.get(key) || (key.startsWith('otp:') ? '1234' : null);
            console.log(`[MOCK REDIS] GET ${key} => ${key.startsWith('otp:') ? '[MASKED]' : val}`);
            return val;
        },
        del: async (key) => {
            console.log(`[MOCK REDIS] DEL ${key}`);
            mockStore.delete(key);
            return 1;
        },
        zcard: async (key) => {
            console.log(`[MOCK REDIS] ZCARD ${key}`);
            return 0;
        },
        zrem: async (key, member) => {
            console.log(`[MOCK REDIS] ZREM ${key} member=${member}`);
            return 1;
        },
        exists: async (key) => {
            return mockStore.has(key) ? 1 : 0;
        },
        call: async (...args) => {
            console.log(`[MOCK REDIS] CALL ${args.join(' ')}`);
            return [];
        }
    };
} else {
    // Real Redis Client using environment configurations
    redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        tls: process.env.REDIS_USE_TLS === 'true' ? {} : undefined
    });
}

/**
 * Updates a plumber's live location using Redis Geo-indexing and companion TTL key
 */
async function updatePlumberLocation(plumberId, longitude, latitude) {
    await redis.geoadd(PLUMBER_GEO_KEY, longitude, latitude, String(plumberId));
    // Set companion heartbeat key with 300s TTL to prevent phantom dispatch of offline plumbers
    await redis.set(`${PLUMBER_HEARTBEAT_PREFIX}${plumberId}`, Date.now().toString(), 'EX', PLUMBER_TTL_SECONDS);
    console.log(`Updated live location for Plumber ${plumberId} (TTL: ${PLUMBER_TTL_SECONDS}s)`);
}

/**
 * Finds all active plumbers within a certain radius, evicting offline plumbers
 */
async function findNearbyPlumbers(longitude, latitude, radiusKm = 5) {
    if (process.env.MOCK_EDGE === 'true') {
        return [
            { plumberId: '1', distance: 1.2 },
            { plumberId: '2', distance: 2.5 }
        ];
    }
    let nearby = [];
    try {
        // High-throughput GEOSEARCH bounded by radiusKm
        nearby = await redis.geosearch(
            PLUMBER_GEO_KEY,
            'FROMLONLAT',
            longitude,
            latitude,
            'BYRADIUS',
            radiusKm,
            'km',
            'WITHDIST',
            'ASC'
        );
    } catch (err) {
        // Fallback to legacy GEORADIUS if server does not support GEOSEARCH
        try {
            nearby = await redis.georadius(
                PLUMBER_GEO_KEY,
                longitude,
                latitude,
                radiusKm,
                'km',
                'WITHDIST',
                'ASC'
            );
        } catch (innerErr) {
            console.error('Redis GEO query failed:', innerErr.message);
            return [];
        }
    }

    if (!Array.isArray(nearby) || nearby.length === 0) {
        return [];
    }

    // TTL Verification: Evict expired offline plumbers from geo index
    const activePlumbers = [];
    for (const res of nearby) {
        const plumberId = res[0];
        const distance = parseFloat(res[1]);
        const heartbeatKey = `${PLUMBER_HEARTBEAT_PREFIX}${plumberId}`;
        const isAlive = await redis.exists(heartbeatKey);
        if (isAlive) {
            activePlumbers.push({ plumberId, distance });
        } else {
            // Evict stale offline plumber
            await redis.zrem(PLUMBER_GEO_KEY, String(plumberId)).catch(() => {});
            console.log(`[GEO-EVICT] Evicted offline plumber ${plumberId} from ${PLUMBER_GEO_KEY}`);
        }
    }

    return activePlumbers;
}

module.exports = {
    redis,
    PLUMBER_GEO_KEY,
    PLUMBER_HEARTBEAT_PREFIX,
    PLUMBER_TTL_SECONDS,
    updatePlumberLocation,
    findNearbyPlumbers
};
