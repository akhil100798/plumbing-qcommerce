const fs = require('fs');
const jwt = require('jsonwebtoken');
const Redis = require('ioredis');
const { io } = require('socket.io-client');

const edgeUrl = process.env.EDGE_URL || 'http://localhost:3000';
const jwtSecret = process.env.JWT_SECRET;
const customer = {
  id: process.env.TEST_CUSTOMER_ID,
  email: process.env.TEST_CUSTOMER_EMAIL,
};
const plumber = {
  id: process.env.TEST_PLUMBER_ID,
  email: process.env.TEST_PLUMBER_EMAIL,
};

if (!jwtSecret || !customer.id || !customer.email || !plumber.id || !plumber.email) {
  throw new Error('JWT_SECRET and local test identity variables are required');
}

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
});

const results = [];
const record = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'}: ${name}${detail ? ` - ${detail}` : ''}`);
};

const tokenFor = (identity, role) => jwt.sign(
  { sub: identity.email, role, jti: `local-staging-${role.toLowerCase()}` },
  jwtSecret,
  { algorithm: 'HS256', expiresIn: '10m' },
);

const connect = (token) => new Promise((resolve, reject) => {
  const socket = io(edgeUrl, {
    auth: token === undefined ? {} : { token: `Bearer ${token}` },
    reconnection: false,
    timeout: 5000,
    transports: ['websocket'],
  });
  socket.once('connect', () => resolve(socket));
  socket.once('connect_error', reject);
});

const expectConnectError = (token) => new Promise((resolve) => {
  const socket = io(edgeUrl, {
    auth: token === undefined ? {} : { token },
    reconnection: false,
    timeout: 5000,
    transports: ['websocket'],
  });
  socket.once('connect', () => {
    socket.close();
    resolve(false);
  });
  socket.once('connect_error', () => {
    socket.close();
    resolve(true);
  });
});

const expectSocketError = (socket, event, payload, message) => new Promise((resolve) => {
  const timer = setTimeout(() => resolve(false), 5000);
  socket.once('error', (error) => {
    clearTimeout(timer);
    resolve(String(error.message).includes(message));
  });
  socket.emit(event, payload);
});

const waitForGeoPosition = async (key, member) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const position = await redis.geopos(key, member);
    if (position[0]) return true;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
};

async function run() {
  const customerToken = tokenFor(customer, 'CUSTOMER');
  const plumberToken = tokenFor(plumber, 'PLUMBER');
  let customerSocket;
  let plumberSocket;

  try {
    record('Missing JWT rejected', await expectConnectError(undefined));
    record('Invalid JWT rejected', await expectConnectError('Bearer invalid-token'));

    customerSocket = await connect(customerToken);
    record('Valid customer JWT connects', customerSocket.connected);

    plumberSocket = await connect(plumberToken);
    record('Valid plumber JWT connects', plumberSocket.connected);

    record(
      'Customer cannot join another customer room',
      await expectSocketError(customerSocket, 'register_customer', { customerId: 'not-the-customer' }, 'ID mismatch'),
    );

    record(
      'Plumber cannot publish location for another plumber',
      await expectSocketError(plumberSocket, 'location_ping', {
        plumberId: 'not-the-plumber', longitude: 77.59, latitude: 12.97,
      }, 'Invalid plumber location update ownership'),
    );

    await new Promise((resolve) => setTimeout(resolve, 2100));
    record(
      'Invalid coordinates are rejected',
      await expectSocketError(plumberSocket, 'location_ping', {
        plumberId: plumber.id, longitude: 200, latitude: 120,
      }, 'Coordinates out of bounds'),
    );

    await new Promise((resolve) => setTimeout(resolve, 2100));
    await redis.zrem('plumbers_location', plumber.id);
    plumberSocket.emit('location_ping', {
      plumberId: plumber.id, longitude: 77.5946, latitude: 12.9716,
    });
    record('Valid authorized location update succeeds', await waitForGeoPosition('plumbers_location', plumber.id));

    record(
      'Unauthorized room event is rejected',
      await expectSocketError(customerSocket, 'register_plumber', { plumberId: customer.id }, 'Invalid role'),
    );

    const logs = [process.env.EDGE_STDOUT_LOG, process.env.EDGE_STDERR_LOG]
      .filter(Boolean)
      .map((path) => fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : '')
      .join('\n');
    record('Connection logs do not expose tokens', !logs.includes(customerToken) && !logs.includes(plumberToken));
  } finally {
    if (customerSocket) customerSocket.close();
    if (plumberSocket) plumberSocket.close();
    await redis.zrem('plumbers_location', plumber.id);
    redis.disconnect();
  }

  if (results.some((result) => !result.passed)) process.exitCode = 1;
}

run().catch((error) => {
  console.error(`FAIL: Smoke harness error - ${error.message}`);
  process.exitCode = 1;
  redis.disconnect();
});

