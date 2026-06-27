const { redis } = require('./redisService');

const DELIVERY_PARTNER_GEO_KEY = 'delivery_partners_location';

/**
 * Updates a delivery partner's live location using Redis Geo-indexing
 */
async function updateDeliveryPartnerLocation(partnerId, longitude, latitude) {
    await redis.geoadd(DELIVERY_PARTNER_GEO_KEY, longitude, latitude, String(partnerId));
    console.log(`Updated live location for Delivery Partner ${partnerId} at [${longitude}, ${latitude}]`);
}

/**
 * Finds all active delivery partners within a certain radius
 */
async function findNearbyDeliveryPartners(longitude, latitude, radiusKm = 10) {
    const nearby = await redis.georadius(
        DELIVERY_PARTNER_GEO_KEY,
        longitude,
        latitude,
        radiusKm,
        'km',
        'WITHDIST',
        'ASC'
    );
    
    return nearby.map(res => ({
        partnerId: res[0],
        distance: parseFloat(res[1])
    }));
}

/**
 * Generates and stores a 4-digit OTP in Redis with a 15-minute TTL
 */
async function generateOtp(orderId) {
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    await redis.set(`otp:${orderId}`, otp, 'EX', 900);
    console.log(`Generated OTP ${otp} for Order ${orderId} in Redis`);
    return otp;
}

/**
 * Verifies the OTP in Redis and deletes it on success
 */
async function verifyOtp(orderId, inputOtp) {
    const key = `otp:${orderId}`;
    const storedOtp = await redis.get(key);
    if (storedOtp && storedOtp === String(inputOtp)) {
        await redis.del(key);
        return true;
    }
    return false;
}

module.exports = {
    updateDeliveryPartnerLocation,
    findNearbyDeliveryPartners,
    generateOtp,
    verifyOtp
};
