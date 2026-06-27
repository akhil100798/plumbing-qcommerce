require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "PlumbCommerceLocalSecretKeyFallbackForDeveloperModeOnlyChangeThisInProduction";

/**
 * Middleware for Express REST Endpoints
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Access Denied: No Token Provided" });

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(403).json({ error: "Invalid Token" });
    }
};

/**
 * Middleware for Socket.io Handshake
 */
const socketAuth = (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];

    if (!token) {
        console.error("Socket Auth Failed: No token provided");
        return next(new Error("Authentication error"));
    }

    // Handle 'Bearer <token>' format
    const cleanToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

    try {
        const verified = jwt.verify(cleanToken, JWT_SECRET);
        socket.user = verified;
        next();
    } catch (err) {
        console.error("Socket Auth Failed: Invalid token");
        next(new Error("Authentication error"));
    }
};

module.exports = { verifyToken, socketAuth };
