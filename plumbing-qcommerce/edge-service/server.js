require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');

const { redis, updatePlumberLocation, findNearbyPlumbers } = require('./services/redisService');
const { connectKafka } = require('./services/kafkaService');
const { verifyToken, socketAuth } = require('./middleware/authMiddleware');
const { updateDeliveryPartnerLocation, findNearbyDeliveryPartners, generateOtp, verifyOtp } = require('./services/deliveryService');

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
    app.use(cors());
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
        cors: { origin: '*' }
    });

    io.use(edgeSocketAuth);

    if (startKafka) {
        connectKafka(io);
    }

    app.post('/api/v1/edge/requests/nearby', edgeVerifyToken, nearbyLimiter, async (req, res) => {
        const { customerId, longitude, latitude } = req.body;

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

    app.post('/api/v1/edge/delivery/otp/generate', async (req, res) => {
        const { orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({ error: "orderId is required" });
        }
        try {
            const otp = await edgeGenerateOtp(orderId);
            res.json({ orderId, otp });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/v1/edge/delivery/otp/verify', async (req, res) => {
        const { orderId, otp } = req.body;
        if (!orderId || !otp) {
            return res.status(400).json({ error: "orderId and otp are required" });
        }
        try {
            const isValid = await edgeVerifyOtp(orderId, otp);
            res.json({ orderId, valid: isValid });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * GET /api/v1/edge/metrics/surge
     * Returns real-time demand signal: active plumber + delivery partner counts
     * from Redis geo-index. Consumed by DynamicPricingService (backend).
     * BUG-13 fix: Added verifyToken middleware — returns 401 without valid JWT.
     */
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

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('register_plumber', ({ plumberId }) => {
            socket.join(`plumber_${plumberId}`);
            console.log(`Plumber ${plumberId} registered socket connection.`);
        });

        socket.on('register_customer', ({ customerId }) => {
            socket.join(`customer_${customerId}`);
            console.log(`Customer ${customerId} waiting for plumber assignment.`);
        });

        socket.on('register_delivery_partner', ({ partnerId }) => {
            socket.join(`delivery_${partnerId}`);
            console.log(`Delivery Partner ${partnerId} registered socket connection.`);
        });

        socket.on('location_ping', async (data) => {
            const { plumberId, longitude, latitude } = data;
            await edgeUpdatePlumberLocation(plumberId, longitude, latitude);
        });

        socket.on('delivery_location_ping', async (data) => {
            const { partnerId, longitude, latitude } = data;
            await edgeUpdateDeliveryPartnerLocation(partnerId, longitude, latitude);
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

