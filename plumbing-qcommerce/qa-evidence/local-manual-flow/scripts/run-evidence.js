const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const evidenceRoot = path.resolve(__dirname, '..');
const screenshotsDir = path.join(evidenceRoot, 'screenshots');
const reportsDir = path.join(evidenceRoot, 'reports');
const API_BASE = process.env.QA_API_BASE || 'http://localhost:8081/api/v1';
const EDGE_BASE = process.env.QA_EDGE_BASE || 'http://localhost:3000';
const ADMIN_URL = process.env.QA_ADMIN_URL || 'http://localhost:3100';
const CHROME_PATH = process.env.QA_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const playwright = require(path.join(repoRoot, 'admin-portal', 'node_modules', 'playwright'));
const { io } = require(path.join(repoRoot, 'admin-portal', 'node_modules', 'socket.io-client'));

const seededUsers = {
  admin: { email: 'admin@plumb.local', password: 'LocalPass123!' },
  manager: { email: 'manager@plumb.local', password: 'LocalPass123!' },
  customer: { email: 'customer@plumb.local', password: 'LocalPass123!' },
  plumber1: { email: 'plumber1@plumb.local', password: 'LocalPass123!' },
  plumber2: { email: 'plumber2@plumb.local', password: 'LocalPass123!' },
};

const results = [];
const context = { users: {}, storeId: null, orderId: null, unstartedOrderId: null };

async function main() {
  await fs.mkdir(screenshotsDir, { recursive: true });
  await fs.mkdir(reportsDir, { recursive: true });

  const browser = await playwright.chromium.launch({
    headless: true,
    executablePath: CHROME_PATH,
  });

  try {
    await verifyHealth(browser);
    await captureUiScreens(browser);
    await authSetup(browser);
    await runNegativeCases(browser);
    await runPositiveCases(browser);
    await writeReports();
  } finally {
    await browser.close();
  }

  const failed = results.filter((result) => !result.passed);
  console.log(`QA evidence complete. Passed: ${results.length - failed.length}, Failed: ${failed.length}`);
  console.log(`Report: ${path.join(reportsDir, 'qa-evidence-report.md')}`);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

async function verifyHealth(browser) {
  const checks = [
    ['ENV-HEALTH-001', 'Environment', 'Backend readiness endpoint is UP', () => request('GET', `${API_BASE.replace('/api/v1', '')}/health/ready`)],
    ['ENV-HEALTH-002', 'Environment', 'Edge readiness endpoint is UP', () => request('GET', `${EDGE_BASE}/health/ready`)],
  ];

  for (const [id, area, title, fn] of checks) {
    const response = await fn();
    await record(browser, {
      id,
      polarity: 'positive',
      area,
      role: 'System',
      title,
      expected: 'HTTP 200 with UP status',
      actual: `HTTP ${response.status}`,
      passed: response.status === 200 && JSON.stringify(response.body).includes('UP'),
      payload: response.body,
    });
  }
}

async function captureUiScreens(browser) {
  const customerServer = await startStaticServer(path.join(repoRoot, 'customer-app', 'dist'), 19401);
  const plumberServer = await startStaticServer(path.join(repoRoot, 'plumber-app', 'dist'), 19402);

  try {
    await screenshotPage(browser, {
      id: 'UI-ADMIN-001',
      area: 'Admin UI',
      role: 'Store Manager',
      title: 'Admin store manager dashboard shows authenticated live gateway',
      url: ADMIN_URL,
      viewport: { width: 1366, height: 768 },
      expectedText: ['Gateway Status:', 'LIVE', 'Live Active Jobs', 'Hardware Inventory'],
    });

    await screenshotPage(browser, {
      id: 'UI-ADMIN-002',
      area: 'Admin UI',
      role: 'Admin',
      title: 'Admin analytics page renders KPI and inventory panels',
      url: `${ADMIN_URL}/analytics`,
      viewport: { width: 1366, height: 900 },
      expectedText: ['Platform Analytics', 'Total Revenue', 'Active Plumbers', 'Store Inventory Alerts'],
      beforeGoto: async (page) => {
        const adminLogin = await request('POST', `${API_BASE}/auth/login`, {
          email: seededUsers.admin.email,
          password: seededUsers.admin.password,
        });
        await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.evaluate((token) => localStorage.setItem('admin_token', token), adminLogin.body.token);
      },
    });

    await screenshotPage(browser, {
      id: 'UI-CUSTOMER-001',
      area: 'Customer UI',
      role: 'Customer',
      title: 'Customer simulator renders authenticated service workflow',
      url: 'http://127.0.0.1:19401',
      viewport: { width: 390, height: 844 },
      expectedText: ['Connected to dispatch edge', 'Quick Assign', 'Pick a Store', 'Direct Plumber'],
    });

    await screenshotPage(browser, {
      id: 'UI-PLUMBER-001',
      area: 'Plumber UI',
      role: 'Plumber',
      title: 'Plumber simulator renders authenticated availability screen',
      url: 'http://127.0.0.1:19402',
      viewport: { width: 390, height: 844 },
      expectedText: ['Connected to dispatch edge', 'AVAILABILITY STATUS', 'OFFLINE'],
    });
  } finally {
    await closeServer(customerServer);
    await closeServer(plumberServer);
  }
}

async function authSetup(browser) {
  for (const [key, user] of Object.entries(seededUsers)) {
    const response = await request('POST', `${API_BASE}/auth/login`, {
      email: user.email,
      password: user.password,
    });
    const passed = response.status === 200 && Boolean(response.body.token);
    context.users[key] = { ...user, ...response.body };
    await record(browser, {
      id: `POS-AUTH-${key.toUpperCase()}`,
      polarity: 'positive',
      area: 'Authentication',
      role: key,
      title: `${key} seeded user can login`,
      expected: 'HTTP 200 with JWT token',
      actual: `HTTP ${response.status}`,
      passed,
      payload: redactToken(response.body),
    });
  }
}

async function runNegativeCases(browser) {
  const badLogin = await request('POST', `${API_BASE}/auth/login`, {
    email: seededUsers.customer.email,
    password: 'WrongPassword123!',
  });
  await record(browser, {
    id: 'NEG-AUTH-001',
    polarity: 'negative',
    area: 'Authentication',
    role: 'Guest',
    title: 'Login fails with wrong password',
    expected: 'HTTP 401',
    actual: `HTTP ${badLogin.status}`,
    passed: badLogin.status === 401,
    payload: badLogin.body,
  });

  const noStoreToken = await request('GET', `${API_BASE}/stores`);
  await record(browser, {
    id: 'NEG-SEC-001',
    polarity: 'negative',
    area: 'Security',
    role: 'Guest',
    title: 'Unauthenticated user cannot read stores',
    expected: 'HTTP 401',
    actual: `HTTP ${noStoreToken.status}`,
    passed: noStoreToken.status === 401,
    payload: noStoreToken.body,
  });

  const customerStore = await request('POST', `${API_BASE}/stores?managerEmail=${encodeURIComponent(seededUsers.manager.email)}`, {
    name: `Customer Forbidden Store ${Date.now()}`,
    address: 'Blocked Address',
    latitude: 12.91,
    longitude: 77.61,
  }, context.users.customer.token);
  await record(browser, {
    id: 'NEG-SEC-002',
    polarity: 'negative',
    area: 'Store',
    role: 'Customer',
    title: 'Customer cannot create store',
    expected: 'HTTP 403',
    actual: `HTTP ${customerStore.status}`,
    passed: customerStore.status === 403,
    payload: customerStore.body,
  });

  const invalidOrder = await request('POST', `${API_BASE}/orders`, {
    description: 'Invalid coordinates test',
    latitude: 120,
    longitude: 77.59,
    requestType: 'NEARBY_AUTO',
  }, context.users.customer.token);
  await record(browser, {
    id: 'NEG-ORDER-001',
    polarity: 'negative',
    area: 'Customer Flow',
    role: 'Customer',
    title: 'Customer cannot create order with invalid latitude',
    expected: 'HTTP 400',
    actual: `HTTP ${invalidOrder.status}`,
    passed: invalidOrder.status === 400,
    payload: invalidOrder.body,
  });

  const tempOrder = await createOrder('Negative complete-before-start setup order');
  context.unstartedOrderId = tempOrder.body.id;

  const customerAccept = await request('PATCH', `${API_BASE}/orders/${context.unstartedOrderId}/accept`, null, context.users.customer.token);
  await record(browser, {
    id: 'NEG-ORDER-002',
    polarity: 'negative',
    area: 'Plumber Flow',
    role: 'Customer',
    title: 'Customer cannot accept an order',
    expected: 'HTTP 403',
    actual: `HTTP ${customerAccept.status}`,
    passed: customerAccept.status === 403,
    payload: customerAccept.body,
  });

  const completeBeforeStart = await request('PATCH', `${API_BASE}/orders/${context.unstartedOrderId}/complete`, { partsCharge: 10 }, context.users.plumber2.token);
  await record(browser, {
    id: 'NEG-ORDER-003',
    polarity: 'negative',
    area: 'Plumber Flow',
    role: 'Plumber',
    title: 'Plumber cannot complete before accepting and starting',
    expected: 'HTTP 403 or 409',
    actual: `HTTP ${completeBeforeStart.status}`,
    passed: [403, 409].includes(completeBeforeStart.status),
    payload: completeBeforeStart.body,
  });

  const managerMetrics = await request('GET', `${API_BASE}/admin/metrics`, null, context.users.manager.token);
  await record(browser, {
    id: 'NEG-ADMIN-001',
    polarity: 'negative',
    area: 'Admin',
    role: 'Store Manager',
    title: 'Store manager cannot read admin metrics',
    expected: 'HTTP 403',
    actual: `HTTP ${managerMetrics.status}`,
    passed: managerMetrics.status === 403,
    payload: managerMetrics.body,
  });

  const edgeGuest = await request('POST', `${EDGE_BASE}/api/v1/edge/requests/nearby`, {
    latitude: 37.7749,
    longitude: -122.4194,
  });
  await record(browser, {
    id: 'NEG-EDGE-001',
    polarity: 'negative',
    area: 'Edge Gateway',
    role: 'Guest',
    title: 'Unauthenticated nearby dispatch is rejected',
    expected: 'HTTP 401',
    actual: `HTTP ${edgeGuest.status}`,
    passed: edgeGuest.status === 401,
    payload: edgeGuest.body,
  });

  const customerPing = await socketLocationPing(context.users.customer.token, {
    latitude: 37.7749,
    longitude: -122.4194,
  });
  await record(browser, {
    id: 'NEG-EDGE-002',
    polarity: 'negative',
    area: 'Edge Gateway',
    role: 'Customer',
    title: 'Customer cannot emit plumber location ping',
    expected: 'Socket ack error',
    actual: JSON.stringify(customerPing),
    passed: Boolean(customerPing.error),
    payload: customerPing,
  });

  const edgeBadCoords = await request('POST', `${EDGE_BASE}/api/v1/edge/requests/nearby`, {
    latitude: 99,
    longitude: -122.4194,
  }, context.users.customer.token);
  await record(browser, {
    id: 'NEG-EDGE-003',
    polarity: 'negative',
    area: 'Edge Gateway',
    role: 'Customer',
    title: 'Nearby dispatch rejects invalid coordinates',
    expected: 'HTTP 400',
    actual: `HTTP ${edgeBadCoords.status}`,
    passed: edgeBadCoords.status === 400,
    payload: edgeBadCoords.body,
  });
}

async function runPositiveCases(browser) {
  const store = await request('POST', `${API_BASE}/stores?managerEmail=${encodeURIComponent(seededUsers.manager.email)}`, {
    name: `QA Evidence Hardware ${Date.now()}`,
    address: 'QA Evidence Street',
    latitude: 12.9716,
    longitude: 77.5946,
  }, context.users.manager.token);
  context.storeId = store.body.id;
  await record(browser, {
    id: 'POS-STORE-001',
    polarity: 'positive',
    area: 'Store',
    role: 'Store Manager',
    title: 'Store manager can create a store',
    expected: 'HTTP 200 with store id',
    actual: `HTTP ${store.status}`,
    passed: store.status === 200 && Boolean(store.body.id),
    payload: store.body,
  });

  const stores = await request('GET', `${API_BASE}/stores`, null, context.users.customer.token);
  await record(browser, {
    id: 'POS-STORE-002',
    polarity: 'positive',
    area: 'Store',
    role: 'Customer',
    title: 'Authenticated customer can read store list',
    expected: 'HTTP 200 with stores array',
    actual: `HTTP ${stores.status}`,
    passed: stores.status === 200 && Array.isArray(stores.body),
    payload: { count: Array.isArray(stores.body) ? stores.body.length : 0, first: stores.body?.[0] },
  });

  const order = await createOrder('Kitchen sink leak from QA evidence suite');
  context.orderId = order.body.id;
  await record(browser, {
    id: 'POS-ORDER-001',
    polarity: 'positive',
    area: 'Customer Flow',
    role: 'Customer',
    title: 'Customer can create a plumbing service order',
    expected: 'HTTP 200 with PENDING order',
    actual: `HTTP ${order.status}`,
    passed: order.status === 200 && order.body.status === 'PENDING',
    payload: order.body,
  });

  const accept = await request('PATCH', `${API_BASE}/orders/${context.orderId}/accept`, null, context.users.plumber1.token);
  await record(browser, {
    id: 'POS-ORDER-002',
    polarity: 'positive',
    area: 'Plumber Flow',
    role: 'Plumber',
    title: 'Plumber can accept a pending order',
    expected: 'HTTP 200 with ACCEPTED order',
    actual: `HTTP ${accept.status}`,
    passed: accept.status === 200 && accept.body.status === 'ACCEPTED',
    payload: accept.body,
  });

  const start = await request('PATCH', `${API_BASE}/orders/${context.orderId}/start`, null, context.users.plumber1.token);
  await record(browser, {
    id: 'POS-ORDER-003',
    polarity: 'positive',
    area: 'Plumber Flow',
    role: 'Plumber',
    title: 'Assigned plumber can start accepted order',
    expected: 'HTTP 200 with IN_PROGRESS order',
    actual: `HTTP ${start.status}`,
    passed: start.status === 200 && start.body.status === 'IN_PROGRESS',
    payload: start.body,
  });

  const complete = await request('PATCH', `${API_BASE}/orders/${context.orderId}/complete`, { partsCharge: 125.5 }, context.users.plumber1.token);
  await record(browser, {
    id: 'POS-ORDER-004',
    polarity: 'positive',
    area: 'Plumber Flow',
    role: 'Plumber',
    title: 'Assigned plumber can complete in-progress order with parts charge',
    expected: 'HTTP 200 with COMPLETED order and total amount',
    actual: `HTTP ${complete.status}`,
    passed: complete.status === 200 && complete.body.status === 'COMPLETED' && Number(complete.body.totalAmount) > 0,
    payload: complete.body,
  });

  const serviceLog = await request('POST', `${API_BASE}/logs`, {
    orderId: context.orderId,
    diagnosis: 'Leaking sink trap',
    workDone: 'Replaced trap and resealed drain line',
    notes: 'QA evidence service log',
    photoUrl: 'https://example.test/evidence-photo.jpg',
    partsUsed: [
      { partName: 'PVC Trap', quantity: 1, unitPrice: 75 },
      { partName: 'Sealant', quantity: 1, unitPrice: 50.5 },
    ],
  }, context.users.plumber1.token);
  await record(browser, {
    id: 'POS-LOG-001',
    polarity: 'positive',
    area: 'Service Log',
    role: 'Plumber',
    title: 'Assigned plumber can create service log with parts used',
    expected: 'HTTP 200 with saved service log',
    actual: `HTTP ${serviceLog.status}`,
    passed: serviceLog.status === 200 && serviceLog.body.orderId === context.orderId,
    payload: serviceLog.body,
  });

  const logsByOrder = await request('GET', `${API_BASE}/logs/order/${context.orderId}`, null, context.users.admin.token);
  await record(browser, {
    id: 'POS-LOG-002',
    polarity: 'positive',
    area: 'Service Log',
    role: 'Admin',
    title: 'Admin can read service logs by order',
    expected: 'HTTP 200 with service logs',
    actual: `HTTP ${logsByOrder.status}`,
    passed: logsByOrder.status === 200 && Array.isArray(logsByOrder.body) && logsByOrder.body.length > 0,
    payload: { count: Array.isArray(logsByOrder.body) ? logsByOrder.body.length : 0, first: logsByOrder.body?.[0] },
  });

  const metrics = await request('GET', `${API_BASE}/admin/metrics`, null, context.users.admin.token);
  await record(browser, {
    id: 'POS-ADMIN-001',
    polarity: 'positive',
    area: 'Admin',
    role: 'Admin',
    title: 'Admin can read platform metrics',
    expected: 'HTTP 200 with metrics payload',
    actual: `HTTP ${metrics.status}`,
    passed: metrics.status === 200 && typeof metrics.body === 'object',
    payload: metrics.body,
  });

  const plumberPing = await socketLocationPing(context.users.plumber1.token, {
    latitude: 37.7749,
    longitude: -122.4194,
  });
  await record(browser, {
    id: 'POS-EDGE-001',
    polarity: 'positive',
    area: 'Edge Gateway',
    role: 'Plumber',
    title: 'Authenticated plumber socket can publish valid location',
    expected: 'Socket ack ok=true',
    actual: JSON.stringify(plumberPing),
    passed: plumberPing.ok === true,
    payload: plumberPing,
  });

  const nearby = await request('POST', `${EDGE_BASE}/api/v1/edge/requests/nearby`, {
    latitude: 37.7749,
    longitude: -122.4194,
  }, context.users.customer.token);
  await record(browser, {
    id: 'POS-EDGE-002',
    polarity: 'positive',
    area: 'Edge Gateway',
    role: 'Customer',
    title: 'Authenticated customer can request nearby plumbers',
    expected: 'HTTP 200 with notified plumber list',
    actual: `HTTP ${nearby.status}`,
    passed: nearby.status === 200 && Array.isArray(nearby.body.notified) && nearby.body.notified.length > 0,
    payload: nearby.body,
  });
}

async function createOrder(description) {
  return request('POST', `${API_BASE}/orders`, {
    description,
    latitude: 37.7749,
    longitude: -122.4194,
    requestType: 'NEARBY_AUTO',
  }, context.users.customer.token);
}

async function socketLocationPing(token, coords) {
  return new Promise((resolve) => {
    const socket = io(EDGE_BASE, {
      auth: { token },
      transports: ['websocket'],
      timeout: 5000,
    });

    const done = (value) => {
      socket.disconnect();
      resolve(value);
    };

    socket.on('connect', () => {
      socket.emit('location_ping', coords, (ack) => done(ack || {}));
    });
    socket.on('connect_error', (error) => done({ error: error.message }));
    setTimeout(() => done({ error: 'socket timeout' }), 8000);
  });
}

async function screenshotPage(browser, testCase) {
  const page = await browser.newPage({ viewport: testCase.viewport });
  const messages = [];
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) {
      messages.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`));

  if (testCase.beforeGoto) {
    await testCase.beforeGoto(page);
  }
  const response = await page.goto(testCase.url, { waitUntil: 'networkidle', timeout: 30000 });
  const text = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
  const screenshot = path.join(screenshotsDir, `${testCase.id}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });
  await page.close();

  const missing = testCase.expectedText.filter((item) => !text.includes(item));
  results.push({
    ...testCase,
    polarity: 'positive',
    expected: `Visible text includes: ${testCase.expectedText.join(', ')}`,
    actual: `HTTP ${response?.status()}${missing.length ? `; missing: ${missing.join(', ')}` : ''}`,
    passed: response?.status() === 200 && missing.length === 0 && messages.length === 0,
    screenshot: relative(screenshot),
    payload: { text: text.slice(0, 800), messages },
  });
}

async function record(browser, result) {
  const screenshot = path.join(screenshotsDir, `${result.id}.png`);
  await screenshotEvidenceCard(browser, result, screenshot);
  results.push({ ...result, screenshot: relative(screenshot) });
}

async function screenshotEvidenceCard(browser, result, screenshot) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.setContent(renderEvidenceHtml(result), { waitUntil: 'networkidle' });
  await page.screenshot({ path: screenshot, fullPage: true });
  await page.close();
}

function renderEvidenceHtml(result) {
  const statusColor = result.passed ? '#047857' : '#b91c1c';
  const polarityColor = result.polarity === 'negative' ? '#7c2d12' : '#1d4ed8';
  const payload = escapeHtml(JSON.stringify(result.payload ?? null, null, 2));
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(result.id)}</title>
  <style>
    body { margin: 0; background: #f8fafc; color: #0f172a; font-family: Arial, sans-serif; }
    main { max-width: 1100px; margin: 40px auto; background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 10px 25px rgba(15,23,42,0.08); overflow: hidden; }
    header { padding: 28px 32px; background: #0f172a; color: white; }
    h1 { margin: 0 0 8px; font-size: 30px; }
    .meta { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
    .pill { padding: 6px 10px; border-radius: 999px; font-weight: 700; font-size: 13px; background: rgba(255,255,255,0.14); }
    .polarity { background: ${polarityColor}; }
    .result { background: ${statusColor}; }
    section { padding: 26px 32px; border-top: 1px solid #e2e8f0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    h2 { margin: 0 0 10px; font-size: 15px; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; }
    p { margin: 0; line-height: 1.5; font-size: 18px; }
    pre { white-space: pre-wrap; word-break: break-word; background: #020617; color: #e2e8f0; padding: 18px; border-radius: 8px; font-size: 14px; line-height: 1.45; }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>${escapeHtml(result.title)}</h1>
      <div class="meta">
        <span class="pill">${escapeHtml(result.id)}</span>
        <span class="pill polarity">${escapeHtml(result.polarity || 'positive')}</span>
        <span class="pill">${escapeHtml(result.area)}</span>
        <span class="pill">${escapeHtml(result.role)}</span>
        <span class="pill result">${result.passed ? 'PASS' : 'FAIL'}</span>
      </div>
    </header>
    <section class="grid">
      <div class="box"><h2>Expected</h2><p>${escapeHtml(result.expected)}</p></div>
      <div class="box"><h2>Actual</h2><p>${escapeHtml(result.actual)}</p></div>
    </section>
    <section>
      <h2>Payload / Evidence</h2>
      <pre>${payload}</pre>
    </section>
  </main>
</body>
</html>`;
}

async function writeReports() {
  const positive = results.filter((result) => result.polarity !== 'negative');
  const negative = results.filter((result) => result.polarity === 'negative');
  const failed = results.filter((result) => !result.passed);
  const now = new Date().toISOString();

  const lines = [
    '# QA Evidence Report',
    '',
    `Generated: ${now}`,
    '',
    `Total cases: ${results.length}`,
    `Passed: ${results.length - failed.length}`,
    `Failed: ${failed.length}`,
    '',
    '## Local URLs',
    '',
    `- Admin UI: ${ADMIN_URL}`,
    `- Backend API: ${API_BASE}`,
    `- Edge Gateway: ${EDGE_BASE}`,
    '',
    '## Positive Cases',
    '',
    table(positive),
    '',
    '## Negative Cases',
    '',
    table(negative),
  ];

  if (failed.length) {
    lines.push('', '## Failed Cases', '', table(failed));
  }

  await fs.writeFile(path.join(reportsDir, 'qa-evidence-report.md'), `${lines.join('\n')}\n`, 'utf8');
  await fs.writeFile(path.join(reportsDir, 'qa-evidence-results.json'), JSON.stringify(results, null, 2), 'utf8');
}

function table(items) {
  const rows = [
    '| ID | Area | Role | Title | Expected | Actual | Result | Screenshot |',
    '|---|---|---|---|---|---|---|---|',
  ];
  for (const item of items) {
    rows.push(`| ${item.id} | ${item.area} | ${item.role} | ${escapeMd(item.title)} | ${escapeMd(item.expected)} | ${escapeMd(item.actual)} | ${item.passed ? 'PASS' : 'FAIL'} | ${item.screenshot} |`);
  }
  return rows.join('\n');
}

async function request(method, url, body = null, token = null) {
  const headers = { Accept: 'application/json' };
  if (body !== null) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body === null ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    let parsed = text;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch (_) {
      parsed = text;
    }
    return { status: response.status, body: parsed };
  } catch (error) {
    return { status: 0, body: { error: error.message } };
  }
}

async function startStaticServer(root, port) {
  const mime = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.ico': 'image/x-icon',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
  };

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', `http://localhost:${port}`);
      const relativePath = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
      const target = path.resolve(root, `.${relativePath}`);
      if (!target.startsWith(path.resolve(root))) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      const data = await fs.readFile(target);
      res.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream' });
      res.end(data);
    } catch (_) {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
  return server;
}

function closeServer(server) {
  return new Promise((resolve) => server.close(resolve));
}

function redactToken(value) {
  if (!value || typeof value !== 'object') return value;
  return { ...value, token: value.token ? `${String(value.token).slice(0, 24)}...redacted` : value.token };
}

function relative(target) {
  return path.relative(evidenceRoot, target).replaceAll(path.sep, '/');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeMd(value) {
  return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
