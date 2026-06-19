const request = require('supertest');
const { io: createClient } = require('socket.io-client');

vi.mock('./services/kafkaService', () => ({
  connectKafka: vi.fn(),
}));

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, () => resolve(server.address().port));
  });
}

function socketAuth(socket, next) {
  const token = socket.handshake.auth.token;
  socket.user = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
  next();
}

function token(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

describe('edge service identity binding', () => {
  it('uses the authenticated customer id when broadcasting nearby jobs', async () => {
    const { createEdgeApp } = require('./server');
    const findNearbyPlumbers = vi.fn().mockResolvedValue([{ plumberId: 'plumber-1', distance: 1.2 }]);
    const { app, io, server } = createEdgeApp({
      startKafka: false,
      enableRateLimit: false,
      dependencies: {
        redis: { call: vi.fn() },
        findNearbyPlumbers,
        updatePlumberLocation: vi.fn(),
        verifyToken: (req, res, next) => {
          req.user = { userId: 'customer-from-token', role: 'CUSTOMER' };
          next();
        },
        socketAuth,
      },
    });
    const port = await listen(server);
    const plumber = createClient(`http://localhost:${port}`, {
      auth: { token: token({ userId: 'plumber-1', role: 'PLUMBER' }) },
      reconnection: false,
    });
    await new Promise((resolve, reject) => {
      plumber.on('connect', resolve);
      plumber.on('connect_error', reject);
    });
    const offer = new Promise((resolve) => plumber.once('JOB_OFFER', resolve));

    const response = await request(app)
      .post('/api/v1/edge/requests/nearby')
      .send({ customerId: 'spoofed-customer', longitude: 77.59, latitude: 12.97 });

    expect(response.status).toBe(200);
    expect(response.body.notified).toHaveLength(1);
    await expect(offer).resolves.toMatchObject({ customerId: 'customer-from-token' });
    plumber.disconnect();
    io.close();
    server.close();
  });

  it('rejects customer location pings and ignores spoofed plumber ids', async () => {
    const { createEdgeApp } = require('./server');
    const updatePlumberLocation = vi.fn().mockResolvedValue();
    const { io, server } = createEdgeApp({
      startKafka: false,
      enableRateLimit: false,
      dependencies: {
        redis: { call: vi.fn() },
        findNearbyPlumbers: vi.fn(),
        updatePlumberLocation,
        verifyToken: (req, res, next) => next(),
        socketAuth,
      },
    });
    const port = await listen(server);

    const customer = createClient(`http://localhost:${port}`, {
      auth: { token: token({ userId: 'customer-1', role: 'CUSTOMER' }) },
      reconnection: false,
    });
    await new Promise((resolve, reject) => {
      customer.on('connect', resolve);
      customer.on('connect_error', reject);
    });

    const customerResult = await customer.emitWithAck('location_ping', {
      plumberId: 'victim-plumber',
      longitude: 77.59,
      latitude: 12.97,
    });

    expect(customerResult).toEqual({ error: 'OPERATION_ERROR' });
    expect(updatePlumberLocation).not.toHaveBeenCalled();
    expect(io.sockets.adapter.rooms.has('customer_customer-1')).toBe(true);
    expect(io.sockets.adapter.rooms.has('plumber_victim-plumber')).toBe(false);
    customer.disconnect();

    const plumber = createClient(`http://localhost:${port}`, {
      auth: { token: token({ userId: 'plumber-from-token', role: 'PLUMBER' }) },
      reconnection: false,
    });
    await new Promise((resolve, reject) => {
      plumber.on('connect', resolve);
      plumber.on('connect_error', reject);
    });

    const plumberResult = await plumber.emitWithAck('location_ping', {
      plumberId: 'spoofed-plumber',
      longitude: 77.60,
      latitude: 12.98,
    });

    expect(plumberResult).toEqual({ ok: true });
    expect(updatePlumberLocation).toHaveBeenCalledWith('plumber-from-token', 77.60, 12.98);
    expect(io.sockets.adapter.rooms.has('plumber_plumber-from-token')).toBe(true);
    expect(io.sockets.adapter.rooms.has('plumber_spoofed-plumber')).toBe(false);

    plumber.disconnect();
    io.close();
    server.close();
  });
});
