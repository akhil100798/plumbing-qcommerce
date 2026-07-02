const http = require('http');
const { io: Client } = require('socket.io-client');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { createEdgeApp } = require('./server');
const { EFFECTIVE_SECRET } = require('./middleware/authMiddleware');

describe('Edge WebSocket Security', () => {
  let io, httpServer, port, requestSpy;

  beforeAll(() => {
    // Intercept all Axios requests at the prototype level
    requestSpy = vi.spyOn(axios.Axios.prototype, 'request').mockImplementation((config) => {
      const url = config.url || '';
      
      // Return mock user profile details
      if (url.includes('/users/me')) {
        const authHeader = config.headers && (config.headers.Authorization || config.headers.authorization);
        const token = authHeader ? authHeader.split(' ')[1] : null;
        const decoded = token ? jwt.decode(token) : null;
        
        let id = 101;
        let email = 'cust1@pqc.com';
        let role = 'CUSTOMER';

        if (decoded && decoded.sub && decoded.sub.includes('plumber1')) {
          id = 202;
          email = 'plumber1@pqc.com';
          role = 'PLUMBER';
        }

        return Promise.resolve({
          data: { id, email, role, status: 'ACTIVE' }
        });
      }

      // Return mock stores list
      if (url.includes('/stores')) {
        return Promise.resolve({
          data: [
            { id: 303, name: 'Test Store', manager: { id: 202 } }
          ]
        });
      }

      return Promise.reject(new Error('Not found: ' + url));
    });

    // Set up app with mock dependencies
    const { app, io: socketServer, server: rawServer } = createEdgeApp({
      startKafka: false,
      enableRateLimit: false,
      dependencies: {
        redis: { call: vi.fn(), zcard: vi.fn().mockResolvedValue(0) },
        findNearbyPlumbers: vi.fn().mockResolvedValue([]),
        updatePlumberLocation: vi.fn(),
        updateDeliveryPartnerLocation: vi.fn(),
      }
    });

    io = socketServer;
    httpServer = rawServer;

    return new Promise((resolve) => {
      httpServer.listen(0, () => {
        port = httpServer.address().port;
        resolve();
      });
    });
  });

  afterAll(() => {
    if (requestSpy) {
      requestSpy.mockRestore();
    }
    return new Promise((resolve) => {
      io.close();
      httpServer.close(() => resolve());
    });
  });

  const generateTestToken = (email, role) => {
    return jwt.sign({ sub: email, role }, EFFECTIVE_SECRET, { expiresIn: '1h' });
  };

  const connectClient = (token) => {
    return new Promise((resolve, reject) => {
      const client = Client(`http://localhost:${port}`, {
        auth: { token: token ? `Bearer ${token}` : undefined },
        reconnection: false,
      });
      client.on('connect', () => resolve(client));
      client.on('connect_error', (err) => reject(err));
    });
  };

  it('1. Missing JWT token during handshake is rejected', () => {
    return new Promise((resolve) => {
      const client = Client(`http://localhost:${port}`, {
        auth: {},
        reconnection: false,
      });

      client.on('connect_error', (err) => {
        expect(err.message).toContain('Authentication error');
        client.close();
        resolve();
      });
    });
  });

  it('2. Invalid JWT token during handshake is rejected', () => {
    return new Promise((resolve) => {
      const client = Client(`http://localhost:${port}`, {
        auth: { token: 'Bearer invalid-token-sig' },
        reconnection: false,
      });

      client.on('connect_error', (err) => {
        expect(err.message).toContain('Authentication error');
        client.close();
        resolve();
      });
    });
  });

  it('3. Valid customer can join only own customer room', async () => {
    const token = generateTestToken('cust1@pqc.com', 'CUSTOMER');
    const client = await connectClient(token);
    
    client.emit('register_customer', { customerId: 101 });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const socketId = client.id;
    const serverSocket = io.sockets.sockets.get(socketId);
    expect(serverSocket.rooms.has('customer_101')).toBe(true);
    client.close();
  });

  it('4. Customer cannot join another customer room', async () => {
    const token = generateTestToken('cust1@pqc.com', 'CUSTOMER');
    const client = await connectClient(token);
    
    return new Promise((resolve) => {
      client.emit('register_customer', { customerId: 999 });

      client.on('error', (err) => {
        expect(err.message).toContain('ID mismatch');
        
        setTimeout(() => {
          const socketId = client.id;
          const serverSocket = io.sockets.sockets.get(socketId);
          expect(serverSocket.rooms.has('customer_999')).toBe(false);
          client.close();
          resolve();
        }, 50);
      });
    });
  });

  it('5. Valid plumber can join only own plumber room', async () => {
    const token = generateTestToken('plumber1@pqc.com', 'PLUMBER');
    const client = await connectClient(token);
    
    client.emit('register_plumber', { plumberId: 202 });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const socketId = client.id;
    const serverSocket = io.sockets.sockets.get(socketId);
    expect(serverSocket.rooms.has('plumber_202')).toBe(true);
    client.close();
  });

  it('6. Plumber cannot register another plumberId', async () => {
    const token = generateTestToken('plumber1@pqc.com', 'PLUMBER');
    const client = await connectClient(token);

    return new Promise((resolve) => {
      client.emit('register_plumber', { plumberId: 999 });

      client.on('error', (err) => {
        expect(err.message).toContain('ID mismatch');
        
        setTimeout(() => {
          const socketId = client.id;
          const serverSocket = io.sockets.sockets.get(socketId);
          expect(serverSocket.rooms.has('plumber_999')).toBe(false);
          client.close();
          resolve();
        }, 50);
      });
    });
  });

  it('7. Customer cannot register as plumber', async () => {
    const token = generateTestToken('cust1@pqc.com', 'CUSTOMER');
    const client = await connectClient(token);

    return new Promise((resolve) => {
      client.emit('register_plumber', { plumberId: 101 });

      client.on('error', (err) => {
        expect(err.message).toContain('Invalid role for plumber registration');
        
        setTimeout(() => {
          const socketId = client.id;
          const serverSocket = io.sockets.sockets.get(socketId);
          expect(serverSocket.rooms.has('plumber_101')).toBe(false);
          client.close();
          resolve();
        }, 50);
      });
    });
  });

  it('8. Plumber location update uses socket.user identity, not payload identity', async () => {
    const token = generateTestToken('plumber1@pqc.com', 'PLUMBER');
    const client = await connectClient(token);

    return new Promise((resolve) => {
      client.emit('location_ping', { plumberId: 999, latitude: 12.97, longitude: 77.59 });

      client.on('error', (err) => {
        expect(err.message).toContain('Invalid plumber location update ownership');
        client.close();
        resolve();
      });
    });
  });

  it('9. Invalid coordinates are rejected', async () => {
    const token = generateTestToken('plumber1@pqc.com', 'PLUMBER');
    const client = await connectClient(token);

    return new Promise((resolve) => {
      client.emit('location_ping', { plumberId: 202, latitude: 120.0, longitude: 200.0 });

      client.on('error', (err) => {
        expect(err.message).toContain('Coordinates out of bounds');
        client.close();
        resolve();
      });
    });
  });
});

describe('CORS and Startup configuration guards', () => {
  it('10. Production CORS does not allow wildcard', () => {
    const originalEnv = { ...process.env };
    const exitMock = vi.spyOn(process, 'exit').mockImplementation(() => {});
    const logErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    process.env.NODE_ENV = 'production';
    process.env.ALLOWED_ORIGINS = '*';
    process.env.JWT_SECRET = 'a-very-long-and-secure-random-secret-key-32-chars';

    try {
      delete require.cache[require.resolve('./server')];
      delete require.cache[require.resolve('./middleware/authMiddleware')];
      require('./server');

      expect(exitMock).toHaveBeenCalledWith(1);
      expect(logErrorMock).toHaveBeenCalledWith(expect.stringContaining("Wildcard '*' is not allowed"));
    } finally {
      exitMock.mockRestore();
      logErrorMock.mockRestore();
      process.env = originalEnv;
      delete require.cache[require.resolve('./server')];
      delete require.cache[require.resolve('./middleware/authMiddleware')];
    }
  });

  it('11. Production startup fails if ALLOWED_ORIGINS is missing', () => {
    const originalEnv = { ...process.env };
    const exitMock = vi.spyOn(process, 'exit').mockImplementation(() => {});
    const logErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    process.env.NODE_ENV = 'production';
    delete process.env.ALLOWED_ORIGINS;
    process.env.JWT_SECRET = 'a-very-long-and-secure-random-secret-key-32-chars';

    try {
      delete require.cache[require.resolve('./server')];
      delete require.cache[require.resolve('./middleware/authMiddleware')];
      require('./server');

      expect(exitMock).toHaveBeenCalledWith(1);
      expect(logErrorMock).toHaveBeenCalledWith(expect.stringContaining('ALLOWED_ORIGINS is missing'));
    } finally {
      exitMock.mockRestore();
      logErrorMock.mockRestore();
      process.env = originalEnv;
      delete require.cache[require.resolve('./server')];
      delete require.cache[require.resolve('./middleware/authMiddleware')];
    }
  });

  it('12. Production startup fails if JWT_SECRET is missing or unsafe', () => {
    const originalEnv = { ...process.env };
    const exitMock = vi.spyOn(process, 'exit').mockImplementation(() => {});
    const logErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    process.env.NODE_ENV = 'production';
    process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
    delete process.env.JWT_SECRET;

    try {
      delete require.cache[require.resolve('./server')];
      delete require.cache[require.resolve('./middleware/authMiddleware')];
      require('./middleware/authMiddleware');

      expect(exitMock).toHaveBeenCalledWith(1);
      expect(logErrorMock).toHaveBeenCalledWith(expect.stringContaining('JWT_SECRET is missing or unsafe'));
    } finally {
      exitMock.mockRestore();
      logErrorMock.mockRestore();
      process.env = originalEnv;
      delete require.cache[require.resolve('./server')];
      delete require.cache[require.resolve('./middleware/authMiddleware')];
    }
  });
});
