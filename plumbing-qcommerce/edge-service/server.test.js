process.env.MOCK_EDGE = 'true';
const request = require('supertest');

vi.mock('./services/kafkaService', () => ({
  connectKafka: vi.fn(),
}));

const EventEmitter = require('events');

vi.mock('ioredis', () => {
  class MockRedis extends EventEmitter {
    constructor() {
      super();
      this.status = 'ready';
    }
    duplicate() {
      return new MockRedis();
    }
    disconnect() {
      this.status = 'end';
    }
    call() {
      return Promise.resolve([]);
    }
    psubscribe() { return Promise.resolve(); }
    punsubscribe() { return Promise.resolve(); }
    subscribe() { return Promise.resolve(); }
    unsubscribe() { return Promise.resolve(); }
    publish() { return Promise.resolve(); }
  }
  return MockRedis;
});

vi.mock('@socket.io/redis-adapter', () => ({
  createAdapter: vi.fn().mockReturnValue(vi.fn()),
}));

describe('edge service', () => {
  it('exports a testable app factory and returns no nearby plumbers', async () => {
    const { createEdgeApp } = require('./server');
    const { app } = createEdgeApp({
      startKafka: false,
      enableRateLimit: false,
      dependencies: {
        redis: { call: vi.fn() },
        findNearbyPlumbers: vi.fn().mockResolvedValue([]),
        updatePlumberLocation: vi.fn(),
        verifyToken: (req, res, next) => next(),
        socketAuth: (socket, next) => next(),
      },
    });

    const response = await request(app)
      .post('/api/v1/edge/requests/nearby')
      .send({ customerId: 'cust_1', longitude: 77.59, latitude: 12.97 });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('No plumbers available nearby.');
  });

  it('configures Redis adapter when enabled', () => {
    process.env.REDIS_ADAPTER_ENABLED = 'true';
    process.env.MOCK_EDGE = 'false';
    
    const { createEdgeApp } = require('./server');
    const { io } = createEdgeApp({
      startKafka: false,
      enableRateLimit: false,
      dependencies: {
        redis: { call: vi.fn() },
        findNearbyPlumbers: vi.fn(),
        updatePlumberLocation: vi.fn(),
        verifyToken: (req, res, next) => next(),
        socketAuth: (socket, next) => next(),
      },
    });

    expect(io.redisPubClient).toBeDefined();
    expect(io.redisSubClient).toBeDefined();

    // Clean up
    delete process.env.REDIS_ADAPTER_ENABLED;
    io.close();
  });

  it('returns healthy status on /api/v1/edge/health', async () => {
    const { createEdgeApp } = require('./server');
    const { app } = createEdgeApp({
      startKafka: false,
      enableRateLimit: false,
      dependencies: {
        redis: { call: vi.fn(), status: 'ready' },
        findNearbyPlumbers: vi.fn(),
        updatePlumberLocation: vi.fn(),
        verifyToken: (req, res, next) => next(),
        socketAuth: (socket, next) => next(),
      },
    });

    const response = await request(app)
      .get('/api/v1/edge/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('UP');
    expect(response.body.redis).toBe('CONNECTED');
  });
});
