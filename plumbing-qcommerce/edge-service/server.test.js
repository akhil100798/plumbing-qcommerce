const request = require('supertest');

vi.mock('./services/kafkaService', () => ({
  connectKafka: vi.fn(),
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
});
