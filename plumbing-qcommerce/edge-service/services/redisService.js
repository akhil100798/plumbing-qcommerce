require('dotenv').config();
const Redis = require('ioredis');

// Connect to the Redis container initialized in Phase 1
let redis;
if (process.env.MOCK_EDGE === 'true') {
    const mockStore = new Map();
    redis = {
        geoadd: async (key, lon, lat, member) => {
            console.log(`[MOCK REDIS] GEOADD ${key} [${lon}, ${lat}] member=${member}`);
            return 1;
        },
        geosearch: async (key, from, lon, lat, by, radius, unit, ...args) => {
            console.log(`[MOCK REDIS] GEOSEARCH ${key} ${lon} ${lat} ${radius} ${unit}`);
            return [['1', '1.2'], ['2', '2.5']];
        },
        georadius: async (key, lon, lat, radius, unit, ...args) => {
            console.log(`[MOCK REDIS] GEORADIUS ${key} ${lon} ${lat} ${radius} ${unit}`);
            return [['1', '0.8'], ['2', '1.9']];
        },
        set: async (key, val, ex, ttl) => {
            console.log(`[MOCK REDIS] SET ${key} = ${val} (TTL: ${ttl})`);
            mockStore.set(key, val);
            return 'OK';
        },
        get: async (key) => {
            const val = mockStore.get(key) || '1234';
            console.log(`[MOCK REDIS] GET ${key} => ${val}`);
            return val;
        },
        del: async (key) => {
            console.log(`[MOCK REDIS] DEL ${key}`);
            mockStore.delete(key);
            return 1;
        },
        zcard: async (key) => {
            console.log(`[MOCK REDIS] ZCARD ${key}`);
            return 5;
        },
        call: async (...args) => {
            console.log(`[MOCK REDIS] CALL ${args.join(' ')}`);
            return 1;
        }
    };
} else {
    redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
    });
}

const PLUMBER_GEO_KEY = 'plumbers_location';

/**
 * Updates a plumber's live location using Redis Geo-indexing
 */
async function updatePlumberLocation(plumberId, longitude, latitude) {
    await redis.geoadd(PLUMBER_GEO_KEY, longitude, latitude, String(plumberId));
    console.log(`Updated live location for Plumber ${plumberId} at [${longitude}, ${latitude}]`);
}

/**
 * Finds all active plumbers within a certain radius
 */
async function findNearbyPlumbers(longitude, latitude, radiusKm = 5) {
    if (process.env.MOCK_EDGE === 'true') {
        return [
            { plumberId: '1', distance: 1.2 },
            { plumberId: '2', distance: 2.5 }
        ];
    }
    // GEOSEARCH returns the nearest plumbers
    const nearby = await redis.geosearch(
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
    
    return nearby.map(res => ({
        plumberId: res[0],
        distance: parseFloat(res[1])
    }));
}

module.exports = {
    redis,
    updatePlumberLocation,
    findNearbyPlumbers
};
