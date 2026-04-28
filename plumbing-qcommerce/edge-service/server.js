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

const app = express();
app.use(cors());
app.use(express.json());

// Configure Rate Limiting (Redis-backed)
const nearbyLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args) => redis.call(...args),
    }),
    message: { error: "Too many requests. Please try again later." }
});

const server = http.createServer(app);

// Configure Socket.io Gateway with Authentication
const io = new Server(server, {
    cors: { origin: '*' }
});

// Middleware for Socket.io
io.use(socketAuth);

// Start Kafka listener to forward Spring Boot events to WebSockets
connectKafka(io);

// REST Endpoint: Auto-assign nearby plumber (Workflow 1)
app.post('/api/v1/edge/requests/nearby', verifyToken, nearbyLimiter, async (req, res) => {
    const { customerId, longitude, latitude } = req.body;
    
    try {
        const availablePlumbers = await findNearbyPlumbers(longitude, latitude, 5);
        
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

    // Plumbers join their own room to receive direct jobs
    socket.on('register_plumber', ({ plumberId }) => {
        socket.join(`plumber_${plumberId}`);
        console.log(`Plumber ${plumberId} registered socket connection.`);
    });

    // Customers join their own room to receive updates about their orders
    socket.on('register_customer', ({ customerId }) => {
        socket.join(`customer_${customerId}`);
        console.log(`Customer ${customerId} waiting for plumber assignment.`);
    });

    // Receive GPS ping every 5 seconds from Plumber App
    socket.on('location_ping', async (data) => {
        const { plumberId, longitude, latitude } = data;
        await updatePlumberLocation(plumberId, longitude, latitude);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Node.js Edge Service & WebSocket Gateway running on port ${PORT}`);
});
