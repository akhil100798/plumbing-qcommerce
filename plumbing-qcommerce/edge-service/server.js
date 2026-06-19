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

function createEdgeApp(options = {}) {
    const { startKafka = true, enableRateLimit = true, dependencies = {} } = options;
    const edgeRedis = dependencies.redis || redis;
    const edgeFindNearbyPlumbers = dependencies.findNearbyPlumbers || findNearbyPlumbers;
    const edgeUpdatePlumberLocation = dependencies.updatePlumberLocation || updatePlumberLocation;
    const edgeVerifyToken = dependencies.verifyToken || verifyToken;
    const edgeSocketAuth = dependencies.socketAuth || socketAuth;

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

    app.get('/health/live', (req, res) => {
        res.json({ status: 'UP' });
    });

    app.get('/health/ready', async (req, res) => {
        try {
            if (edgeRedis?.ping) {
                await edgeRedis.ping();
            }
            res.json({ status: 'UP' });
        } catch (error) {
            res.status(503).json({ status: 'DOWN' });
        }
    });

    app.post('/api/v1/edge/requests/nearby', edgeVerifyToken, nearbyLimiter, async (req, res) => {
        const { longitude, latitude } = req.body;
        const customerId = req.user?.userId || req.user?.id || req.user?.sub;

        if (req.user?.role !== 'CUSTOMER') {
            return res.status(403).json({ error: 'OPERATION_ERROR' });
        }
        if (!isValidCoordinate(longitude, latitude)) {
            return res.status(400).json({ error: 'VALIDATION_ERROR' });
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

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);
        const identity = normalizeIdentity(socket.user);

        if (identity?.role === 'PLUMBER') {
            socket.join(`plumber_${identity.userId}`);
        } else if (identity?.role === 'CUSTOMER') {
            socket.join(`customer_${identity.userId}`);
        }

        socket.on('register_plumber', ({ plumberId }) => {
            console.log(`Ignoring manual plumber room registration for ${plumberId}.`);
        });

        socket.on('register_customer', ({ customerId }) => {
            console.log(`Ignoring manual customer room registration for ${customerId}.`);
        });

        socket.on('location_ping', async (data, ack) => {
            const reply = typeof ack === 'function' ? ack : () => {};
            if (identity?.role !== 'PLUMBER') {
                return reply({ error: 'OPERATION_ERROR' });
            }

            const { longitude, latitude } = data || {};
            if (!isValidCoordinate(longitude, latitude)) {
                return reply({ error: 'VALIDATION_ERROR' });
            }

            try {
                await edgeUpdatePlumberLocation(identity.userId, longitude, latitude);
                return reply({ ok: true });
            } catch (error) {
                return reply({ error: 'OPERATION_ERROR' });
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return { app, io, server };
}

function startServer() {
    const { server } = createEdgeApp();
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`Node.js Edge Service & WebSocket Gateway running on port ${PORT}`);
    });
    return server;
}

if (require.main === module) {
    startServer();
}

module.exports = { createEdgeApp, startServer };

function normalizeIdentity(user) {
    if (!user) return null;
    const userId = user.userId || user.id || user.sub;
    const role = user.role;
    if (!userId || !role) return null;
    return { userId: String(userId), role };
}

function isValidCoordinate(longitude, latitude) {
    return Number.isFinite(longitude)
        && Number.isFinite(latitude)
        && longitude >= -180
        && longitude <= 180
        && latitude >= -90
        && latitude <= 90;
}
