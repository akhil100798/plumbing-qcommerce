require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
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
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const axios = require('axios');

const { redis, updatePlumberLocation, findNearbyPlumbers } = require('./services/redisService');
const { connectKafka } = require('./services/kafkaService');
const { verifyToken, socketAuth } = require('./middleware/authMiddleware');
const { updateDeliveryPartnerLocation, findNearbyDeliveryPartners, generateOtp, verifyOtp } = require('./services/deliveryService');

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";
const DELIVERY_ENABLED = process.env.FEATURE_DELIVERY_ENABLED === 'true';
const ALLOWED_ORIGINS_ENV = process.env.ALLOWED_ORIGINS;
let allowedOrigins = [];

if (ALLOWED_ORIGINS_ENV) {
    allowedOrigins = ALLOWED_ORIGINS_ENV.split(',').map(o => o.trim());
}

const isProduction = process.env.NODE_ENV === 'production';

// In local/dev, if ALLOWED_ORIGINS is empty, default to localhost origins
if (!isProduction && allowedOrigins.length === 0) {
    allowedOrigins = ['http://localhost:3000', 'http://localhost:19006', 'http://localhost:8080'];
}

// Fail startup in production if ALLOWED_ORIGINS is missing or contains wildcard
if (isProduction) {
    if (allowedOrigins.length === 0) {
        console.error("CRITICAL CONFIG ERROR: ALLOWED_ORIGINS is missing in production environment!");
        process.exit(1);
    }
    if (allowedOrigins.includes('*') || (ALLOWED_ORIGINS_ENV && ALLOWED_ORIGINS_ENV.includes('*'))) {
        console.error("CRITICAL CONFIG ERROR: Wildcard '*' is not allowed in ALLOWED_ORIGINS in production environment!");
        process.exit(1);
    }
}

function isOriginAllowed(origin) {
    if (!origin) {
        return true;
    }
    if (allowedOrigins.includes(origin)) {
        return true;
    }
    return !isProduction && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'));
}
// Express CORS Configuration
const corsOptions = {
    origin: (origin, callback) => callback(null, isOriginAllowed(origin)),

    credentials: true
};

// Socket.io CORS Configuration
const socketCorsOptions = {
    origin: (origin, callback) => callback(null, isOriginAllowed(origin)),

    credentials: true
};

function createEdgeApp(options = {}) {
    const { startKafka = true, enableRateLimit = true, dependencies = {} } = options;
    const edgeRedis = dependencies.redis || redis;
    const edgeFindNearbyPlumbers = dependencies.findNearbyPlumbers || findNearbyPlumbers;
    const edgeUpdatePlumberLocation = dependencies.updatePlumberLocation || updatePlumberLocation;
    const edgeVerifyToken = dependencies.verifyToken || verifyToken;
    const edgeSocketAuth = dependencies.socketAuth || socketAuth;
    const edgeFindNearbyDeliveryPartners = dependencies.findNearbyDeliveryPartners || findNearbyDeliveryPartners;
    const edgeUpdateDeliveryPartnerLocation = dependencies.updateDeliveryPartnerLocation || updateDeliveryPartnerLocation;
    const edgeGenerateOtp = dependencies.generateOtp || generateOtp;
    const edgeVerifyOtp = dependencies.verifyOtp || verifyOtp;

    const app = express();
    app.use((req, res, next) => {
        const origin = req.headers.origin;
        if (origin && !isOriginAllowed(origin)) {
            return res.status(403).json({ error: 'CORS origin not allowed' });
        }
        return next();
    });
    app.use(cors(corsOptions));
    app.use(express.json());

    const nearbyLimiter = enableRateLimit
        ? rateLimit({
            windowMs: 1 * 60 * 1000,
            max: 10,
            standardHeaders: true,
            legacyHeaders: false,
            store: new RedisStore({
                sendCommand: (...args) => edgeRedis.call(...args),
            }),
            message: { error: "Too many requests. Please try again later." }
        })
        : (req, res, next) => next();

    const server = http.createServer(app);
    const io = new Server(server, {
        cors: socketCorsOptions
    });

    const isMock = process.env.MOCK_EDGE === 'true';
    const enableRedisAdapter = process.env.REDIS_ADAPTER_ENABLED === 'true' || isProduction;

    if (enableRedisAdapter && !isMock) {
        const redisConfig = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD || undefined,
            tls: process.env.REDIS_USE_TLS === 'true' ? {} : undefined
        };
        const pubClient = new Redis(redisConfig);
        const subClient = pubClient.duplicate();
        
        io.adapter(createAdapter(pubClient, subClient));
        
        io.redisPubClient = pubClient;
        io.redisSubClient = subClient;

        const originalClose = io.close.bind(io);
        io.close = (callback) => {
            if (io.redisPubClient) {
                io.redisPubClient.disconnect();
            }
            if (io.redisSubClient) {
                io.redisSubClient.disconnect();
            }
            return originalClose(callback);
        };
    }

    io.use(edgeSocketAuth);

    if (startKafka) {
        connectKafka(io);
    }

    app.post('/api/v1/edge/requests/nearby', edgeVerifyToken, nearbyLimiter, async (req, res) => {
        const { customerId, longitude, latitude } = req.body;

        // Harden endpoint: Verify customer identity if authenticated as CUSTOMER
        if (req.user && req.user.role === 'ROLE_CUSTOMER') {
            try {
                const authHeader = req.headers['authorization'];
                const userResponse = await axios.get(`${BACKEND_URL}/api/v1/users/me`, {
                    headers: { Authorization: authHeader }
                });
                if (userResponse.data.id.toString() !== customerId.toString()) {
                    return res.status(403).json({ error: "Access Denied: Customer ID mismatch" });
                }
            } catch (err) {
                return res.status(403).json({ error: "Access Denied: Identity verification failed" });
            }
        }

        try {
            const availablePlumbers = await edgeFindNearbyPlumbers(longitude, latitude, 5);

            if (availablePlumbers.length === 0) {
                return res.status(404).json({ message: "No plumbers available nearby." });
            }

            const nearestPlumbers = availablePlumbers.slice(0, 5);
            nearestPlumbers.forEach(p => {
                io.to(`plumber_${p.plumberId}`).emit('JOB_OFFER', {
                    jobId: `job_${Date.now()}`,
                    customerId,
                    distance: p.distance
                });
            });

            res.json({ message: "Job broadcasted to nearby plumbers", notified: nearestPlumbers });
        } catch (error) {
            res.status(500).json({ error: "Internal Server Error" });
        }
    });

    app.post('/api/v1/edge/delivery/otp/generate', edgeVerifyToken, async (req, res) => {
        if (!DELIVERY_ENABLED) return res.status(404).json({ error: 'Delivery is disabled for the current MVP' });
        const { orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({ error: "orderId is required" });
        }
        try {
            const otp = await edgeGenerateOtp(orderId, req.headers.authorization);
            res.json({ orderId, otp });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/v1/edge/delivery/otp/verify', edgeVerifyToken, async (req, res) => {
        if (!DELIVERY_ENABLED) return res.status(404).json({ error: 'Delivery is disabled for the current MVP' });
        const { orderId, otp } = req.body;
        if (!orderId || !otp) {
            return res.status(400).json({ error: "orderId and otp are required" });
        }
        try {
            const isValid = await edgeVerifyOtp(orderId, otp, req.headers.authorization);
            res.json({ orderId, valid: isValid });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.get('/api/v1/edge/metrics/surge', edgeVerifyToken, async (req, res) => {
        try {
            const [plumbers, partners] = await Promise.all([
                edgeRedis.zcard('plumbers:locations'),
                edgeRedis.zcard('delivery:locations')
            ]);

            const total = plumbers + partners;
            let surgeSignal = 'NORMAL';
            if (total >= 15) surgeSignal = 'HIGH';
            else if (total >= 6) surgeSignal = 'MODERATE';

            res.json({
                activePlumbers: plumbers,
                activeDeliveryPartners: partners,
                totalActiveAgents: total,
                surgeSignal,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Surge metrics error:', error.message);
            res.status(500).json({ error: 'Unable to fetch surge metrics' });
        }
    });

    const healthHandler = async (req, res) => {
        let redisState = 'DISCONNECTED';
        try {
            if (edgeRedis && (edgeRedis.status === 'ready' || edgeRedis.status === 'connect' || process.env.MOCK_EDGE === 'true')) {
                redisState = 'CONNECTED';
            }
        } catch (e) {
            redisState = 'ERROR';
        }

        let adapterState = 'NOT_CONFIGURED';
        if (enableRedisAdapter && !isMock) {
            try {
                if (io.redisPubClient && io.redisSubClient && 
                    io.redisPubClient.status === 'ready' && io.redisSubClient.status === 'ready') {
                    adapterState = 'CONNECTED';
                } else {
                    adapterState = 'DISCONNECTED';
                }
            } catch (e) {
                adapterState = 'ERROR';
            }
        } else if (isMock) {
            adapterState = 'MOCKED';
        }

        const isHealthy = redisState === 'CONNECTED' && (adapterState === 'CONNECTED' || adapterState === 'MOCKED' || adapterState === 'NOT_CONFIGURED');

        res.status(isHealthy ? 200 : 500).json({
            status: isHealthy ? 'UP' : 'DOWN',
            redis: redisState,
            socketRedisAdapter: adapterState,
            timestamp: new Date().toISOString()
        });
    };

    app.get('/api/v1/edge/health', healthHandler);
    app.get('/health', healthHandler);
    app.get('/health/live', healthHandler);
    app.get('/health/ready', healthHandler);

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Simple local rate limiter metrics stored on socket object
        let lastLocationPing = 0;
        let lastDeliveryLocationPing = 0;
        let registrationAttempts = 0;
        let lastRegistrationTime = 0;

        const checkRegistrationRateLimit = () => {
            const now = Date.now();
            if (now - lastRegistrationTime < 1000) {
                registrationAttempts++;
            } else {
                registrationAttempts = 1;
            }
            lastRegistrationTime = now;
            if (registrationAttempts > 5) {
                socket.emit('error', { message: 'Rate limit exceeded: registration attempts throttled.' });
                return false;
            }
            return true;
        };

        // 1. PLUMBER room registration
        socket.on('register_plumber', ({ plumberId }) => {
            if (!checkRegistrationRateLimit()) return;

            // Reject spoofing: Derive ID and check role from socket.user
            if (socket.user.role !== 'PLUMBER') {
                console.warn(`[SECURITY] Room spoofing attempt: User ID ${socket.user.userId} with role ${socket.user.role} tried to register as plumber.`);
                return socket.emit('error', { message: 'Authorization Denied: Invalid role for plumber registration.' });
            }

            if (socket.user.plumberId.toString() !== plumberId.toString()) {
                console.warn(`[SECURITY] ID mismatch: Plumber user ID ${socket.user.userId} tried to register as plumber ID ${plumberId}.`);
                return socket.emit('error', { message: 'Authorization Denied: ID mismatch.' });
            }

            const roomName = `plumber_${socket.user.plumberId}`;
            socket.join(roomName);
            console.log(`Plumber room registered securely: ${roomName}`);
        });

        // 2. CUSTOMER room registration
        socket.on('register_customer', ({ customerId }) => {
            if (!checkRegistrationRateLimit()) return;

            // Reject spoofing: Derive ID and check role from socket.user
            if (socket.user.role !== 'CUSTOMER') {
                console.warn(`[SECURITY] Room spoofing attempt: User ID ${socket.user.userId} with role ${socket.user.role} tried to register as customer.`);
                return socket.emit('error', { message: 'Authorization Denied: Invalid role for customer registration.' });
            }

            if (socket.user.customerId.toString() !== customerId.toString()) {
                console.warn(`[SECURITY] ID mismatch: Customer user ID ${socket.user.userId} tried to register as customer ID ${customerId}.`);
                return socket.emit('error', { message: 'Authorization Denied: ID mismatch.' });
            }

            const roomName = `customer_${socket.user.customerId}`;
            socket.join(roomName);
            console.log(`Customer room registered securely: ${roomName}`);
        });

        // 3. DELIVERY PARTNER room registration
        socket.on('register_delivery_partner', ({ partnerId }) => {
            if (!checkRegistrationRateLimit()) return;

            // Reject spoofing: Derive ID and check role from socket.user
            if (socket.user.role !== 'DELIVERY_PARTNER') {
                console.warn(`[SECURITY] Room spoofing attempt: User ID ${socket.user.userId} with role ${socket.user.role} tried to register as delivery partner.`);
                return socket.emit('error', { message: 'Authorization Denied: Invalid role for delivery partner registration.' });
            }

            if (socket.user.partnerId.toString() !== partnerId.toString()) {
                console.warn(`[SECURITY] ID mismatch: Delivery partner user ID ${socket.user.userId} tried to register as partner ID ${partnerId}.`);
                return socket.emit('error', { message: 'Authorization Denied: ID mismatch.' });
            }

            const roomName = `delivery_${socket.user.partnerId}`;
            socket.join(roomName);
            console.log(`Delivery Partner room registered securely: ${roomName}`);
        });

        // 4. STORE MANAGER room registration
        socket.on('register_store', ({ storeId }) => {
            if (!checkRegistrationRateLimit()) return;

            if (socket.user.role !== 'STORE_MANAGER') {
                console.warn(`[SECURITY] Room spoofing attempt: User ID ${socket.user.userId} with role ${socket.user.role} tried to register as store.`);
                return socket.emit('error', { message: 'Authorization Denied: Invalid role for store registration.' });
            }

            if (!socket.user.storeId || socket.user.storeId.toString() !== storeId.toString()) {
                console.warn(`[SECURITY] ID mismatch: Store manager user ID ${socket.user.userId} tried to register store ID ${storeId} (Expected: ${socket.user.storeId}).`);
                return socket.emit('error', { message: 'Authorization Denied: Store ID mismatch or unauthorized.' });
            }

            const roomName = `store_${socket.user.storeId}`;
            socket.join(roomName);
            console.log(`Store room registered securely: ${roomName}`);
        });

        // 5. Plumber location ping
        socket.on('location_ping', async (data) => {
            const { plumberId, longitude, latitude } = data;

            // Throttling: Max 1 ping per 2 seconds
            const now = Date.now();
            if (now - lastLocationPing < 2000) {
                return socket.emit('error', { message: 'Rate limit exceeded: location updates throttled.' });
            }
            lastLocationPing = now;

            // Reject spoofing: Verify sender is PLUMBER
            if (socket.user.role !== 'PLUMBER' || socket.user.plumberId.toString() !== plumberId.toString()) {
                return socket.emit('error', { message: 'Authorization Denied: Invalid plumber location update ownership.' });
            }

            // Validate coordinates range
            if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                return socket.emit('error', { message: 'Invalid payload: Coordinates out of bounds.' });
            }

            await edgeUpdatePlumberLocation(socket.user.plumberId, longitude, latitude);
        });

        // 6. Delivery partner location ping
        socket.on('delivery_location_ping', async (data) => {
            const { partnerId, longitude, latitude } = data;

            // Throttling
            const now = Date.now();
            if (now - lastDeliveryLocationPing < 2000) {
                return socket.emit('error', { message: 'Rate limit exceeded: location updates throttled.' });
            }
            lastDeliveryLocationPing = now;

            // Reject spoofing: Verify sender is DELIVERY_PARTNER
            if (socket.user.role !== 'DELIVERY_PARTNER' || socket.user.partnerId.toString() !== partnerId.toString()) {
                return socket.emit('error', { message: 'Authorization Denied: Invalid delivery location update ownership.' });
            }

            // Validate coordinates range
            if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                return socket.emit('error', { message: 'Invalid payload: Coordinates out of bounds.' });
            }

            await edgeUpdateDeliveryPartnerLocation(socket.user.partnerId, longitude, latitude);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return { app, io, server };
}

function startServer() {
    const isMock = process.env.MOCK_EDGE === 'true';
    const { server } = createEdgeApp({
        startKafka: !isMock,
        enableRateLimit: !isMock
    });
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`Node.js Edge Service & WebSocket Gateway running on port ${PORT} (MOCK_EDGE=${isMock})`);
    });
    return server;
}

if (require.main === module) {
    startServer();
}

module.exports = { createEdgeApp, startServer };
