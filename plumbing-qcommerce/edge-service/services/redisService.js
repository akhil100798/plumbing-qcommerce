require('dotenv').config();
const Redis = require('ioredis');

// Connect to the Redis container initialized in Phase 1
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
});

const PLUMBER_GEO_KEY = 'plumbers_location';

/**
 * Updates a plumber's live location using Redis Geo-indexing
 */
async function updatePlumberLocation(plumberId, longitude, latitude) {
    // GEOADD key longitude latitude member
    await redis.geoadd(PLUMBER_GEO_KEY, longitude, latitude, String(plumberId));
    console.log(`Updated live location for Plumber ${plumberId} at [${longitude}, ${latitude}]`);
}

/**
 * Finds all active plumbers within a certain radius
 */
async function findNearbyPlumbers(longitude, latitude, radiusKm = 5) {
    // GEORADIUS returns the nearest plumbers
    const nearby = await redis.georadius(
        PLUMBER_GEO_KEY, 
        longitude, 
        latitude, 
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
