const axios = require('axios');
const { redis } = require('./redisService');

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";
const DELIVERY_PARTNER_GEO_KEY = 'delivery_partners_location';

/**
 * Updates a delivery partner's live location using Redis Geo-indexing
 */
async function updateDeliveryPartnerLocation(partnerId, longitude, latitude) {
    await redis.geoadd(DELIVERY_PARTNER_GEO_KEY, longitude, latitude, String(partnerId));
    console.log(`Updated live location for Delivery Partner ${partnerId}`);
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
 * Generates OTP by requesting it from the backend
 */
async function generateOtp(orderId, authHeader) {
    try {
        const response = await axios.post(`${BACKEND_URL}/api/v1/delivery/${orderId}/otp/generate`, {}, {
            headers: {
                Authorization: authHeader || ''
            }
        });
        return response.data.otp || response.data;
    } catch (error) {
        console.error(`Failed to generate OTP via backend: ${error.message}`);
        // Secure random generator fallback for local testing if explicitly configured
        if (process.env.MOCK_EDGE === 'true') {
            const crypto = require('crypto');
            return String(crypto.randomInt(1000, 10000));
        }
        throw new Error(error.response?.data?.message || error.message);
    }
}

/**
 * Verifies OTP by requesting it from the backend
 */
async function verifyOtp(orderId, inputOtp, authHeader) {
    try {
        const response = await axios.post(`${BACKEND_URL}/api/v1/delivery/${orderId}/verify-otp`, {
            otp: String(inputOtp)
        }, {
            headers: {
                Authorization: authHeader || ''
            }
        });
        return response.data === true;
    } catch (error) {
        console.error(`Failed to verify OTP via backend: ${error.message}`);
        if (process.env.MOCK_EDGE === 'true') {
            return String(inputOtp) === '1234';
        }
        return false;
    }
}

module.exports = {
    updateDeliveryPartnerLocation,
    findNearbyDeliveryPartners,
    generateOtp,
    verifyOtp
};
