require('dotenv').config();
const jwt = require('jsonwebtoken');
const axios = require('axios');

const JWT_SECRET = process.env.JWT_SECRET;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";
const isProduction = process.env.NODE_ENV === 'production';

// Production safety checks for JWT_SECRET
if (isProduction) {
    if (!JWT_SECRET || JWT_SECRET === "PlumbCommerceLocalSecretKeyFallbackForDeveloperModeOnlyChangeThisInProduction") {
        console.error("CRITICAL CONFIG ERROR: JWT_SECRET is missing or unsafe in production environment!");
        process.exit(1);
    }
}

const EFFECTIVE_SECRET = JWT_SECRET || "PlumbCommerceLocalSecretKeyFallbackForDeveloperModeOnlyChangeThisInProduction";

/**
 * Middleware for Express REST Endpoints
 */
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Access Denied: No Token Provided" });

    try {
        const verified = jwt.verify(token, EFFECTIVE_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(403).json({ error: "Invalid Token" });
    }
};

/**
 * Middleware for Socket.io Handshake
 */
const socketAuth = async (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];

    if (!token) {
        console.error("Socket Auth Failed: No token provided");
        return next(new Error("Authentication error: No token provided"));
    }

    // Handle 'Bearer <token>' format
    const cleanToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

    try {
        // 1. Verify signature, expiry, and secret validity
        const verified = jwt.verify(cleanToken, EFFECTIVE_SECRET);

        // 2. Query backend to fetch user profile details using the token
        const userResponse = await axios.get(`${BACKEND_URL}/api/v1/users/me`, {
            headers: { Authorization: `Bearer ${cleanToken}` },
            timeout: 5000 // 5 seconds timeout
        });

        const user = userResponse.data;
        if (!user || user.status === 'INACTIVE') {
            console.error(`Socket Auth Failed: User is inactive or not found for email ${verified.sub}`);
            return next(new Error("Authentication error: User inactive or not found"));
        }

        // 3. Populate base user info (socket.user model)
        const socketUser = {
            userId: user.id,
            role: user.role, // e.g. "CUSTOMER", "PLUMBER", "DELIVERY_PARTNER", "STORE_MANAGER"
            email: user.email,
            phone: user.phone
        };

        // 4. Populate role-specific IDs
        if (user.role === 'CUSTOMER') {
            socketUser.customerId = user.id;
        } else if (user.role === 'PLUMBER') {
            socketUser.plumberId = user.id;
        } else if (user.role === 'DELIVERY_PARTNER') {
            socketUser.partnerId = user.id;
        } else if (user.role === 'STORE_MANAGER') {
            // Fetch all stores to find the one managed by this user
            try {
                const storesResponse = await axios.get(`${BACKEND_URL}/api/v1/stores`, {
                    headers: { Authorization: `Bearer ${cleanToken}` },
                    timeout: 5000
                });
                const stores = storesResponse.data || [];
                const managedStore = stores.find(s => s.manager && s.manager.id === user.id);
                if (managedStore) {
                    socketUser.storeId = managedStore.id;
                } else {
                    console.warn(`Socket Auth Warning: Store manager ${user.email} (ID: ${user.id}) does not manage any store.`);
                    socketUser.storeId = null;
                }
            } catch (storeErr) {
                console.error("Socket Auth Error: Failed to resolve storeId for manager:", storeErr.message);
                socketUser.storeId = null;
            }
        }

        socket.user = socketUser;
        
        // Log minimal info without sensitive token data
        console.log(`Socket Auth Succeeded: Connection established for user ID ${socketUser.userId} (Role: ${socketUser.role})`);
        next();
    } catch (err) {
        // Redact any tokens or raw config in error logging
        console.error("Socket Auth Failed:", err.message);
        next(new Error("Authentication error: " + err.message));
    }
};

module.exports = { verifyToken, socketAuth, EFFECTIVE_SECRET };
