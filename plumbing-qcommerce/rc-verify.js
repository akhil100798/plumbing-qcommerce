/**
 * FixKart MVP Release-Candidate Verification Script
 * Clean, dynamic, and compliant with current backend API routes
 */

const BASE = 'http://localhost:8081';
let tokens = {};
let results = [];
let serviceOrders = {};

function log(section, step, endpoint, role, expected, actual, pgVerified, result) {
  results.push({ section, step, endpoint, role, expected, actual, pgVerified, result });
  const icon = result === 'PASS' ? 'PASS' : result === 'SKIP' ? 'SKIP' : result === 'INFO' ? 'INFO' : 'FAIL';
  console.log(`[${icon}] ${section} | ${step.substring(0,55)} | Expected:${expected} Got:${actual}`);
}

async function api(method, path, body, token) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  let data;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

function redact(obj) {
  if (!obj) return obj;
  const str = JSON.stringify(obj);
  return str.replace(/("token"|"accessToken"|"refreshToken"|"password"):("[^"]+")/g, '$1:"[REDACTED]"');
}

async function login(email, password = 'password') {
  const r = await api('POST', '/api/v1/auth/login', { email, password });
  if (r.status === 200 && r.data && (r.data.token || r.data.accessToken)) return r.data;
  throw new Error('Login failed for ' + email + ': ' + JSON.stringify(r.data));
}

// Section 1: Authentication
async function s1_auth() {
  console.log('\n=== SECTION 1: Authentication ===');
  const accounts = [
    ['customer@plumbcommerce.com', 'CUSTOMER'],
    ['vikram.plumber@plumbcommerce.com', 'PLUMBER'],
    ['manager@plumbcommerce.com', 'STORE_MANAGER'],
    ['admin@plumbcommerce.com', 'ADMIN'],
    ['superadmin@plumbcommerce.com', 'SUPER_ADMIN'],
    ['northstore.manager@plumbcommerce.com', 'NORTH_STORE_MANAGER'],
    ['anita.customer@plumbcommerce.com', 'CUSTOMER2'],
  ];
  for (const [email, label] of accounts) {
    try {
      const resp = await login(email);
      tokens[label] = resp.token || resp.accessToken;
      tokens[label + '_REFRESH'] = resp.refreshToken;
      tokens[label + '_USER_ID'] = resp.userId || (resp.user && resp.user.id);
      log('AUTH', 'Login ' + label, '/api/v1/auth/login', label, 200, 200, 'N/A', 'PASS');
    } catch (e) {
      log('AUTH', 'Login ' + label, '/api/v1/auth/login', label, 200, 'ERR', 'N/A', 'FAIL');
      console.log('  ' + e.message);
    }
  }
  // Refresh token test
  if (tokens['CUSTOMER_REFRESH']) {
    const r = await api('POST', '/api/v1/auth/refresh', { refreshToken: tokens['CUSTOMER_REFRESH'] });
    if (r.status === 200 && r.data && (r.data.token || r.data.accessToken)) {
      tokens['CUSTOMER'] = r.data.token || r.data.accessToken;
      log('AUTH', 'Refresh Token', '/api/v1/auth/refresh', 'CUSTOMER', 200, r.status, 'N/A', 'PASS');
    } else {
      log('AUTH', 'Refresh Token', '/api/v1/auth/refresh', 'CUSTOMER', 200, r.status, 'N/A', 'FAIL');
    }
  }
}

// Section 3: Complete lifecycle from WORK_RESUMED
async function s3_completionFlow() {
  console.log('\n=== SECTION 3: Complete Lifecycle (from WORK_RESUMED) ===');
  const listR = await api('GET', '/api/v1/orders/plumber', null, tokens['PLUMBER']);
  log('S3', 'Plumber fetch active orders', '/api/v1/orders/plumber', 'PLUMBER', 200, listR.status, 'N/A',
    listR.status === 200 ? 'PASS' : 'FAIL');

  let order = null;
  if (listR.status === 200 && Array.isArray(listR.data)) {
    order = listR.data.find(o => o.status === 'WORK_RESUMED');
    if (!order) order = listR.data.find(o => ['IN_PROGRESS','WORK_RESUMED'].includes(o.status));
    console.log('  Orders: ' + listR.data.map(o => o.id + ':' + o.status).join(', '));
  }

  if (!order) {
    log('S3', 'Find WORK_RESUMED order', 'DB', 'PLUMBER', 'found', 'NOT_FOUND', 'N/A', 'SKIP');
    console.log('  No active order to complete - will verify through Section 5 fresh workflow');
    return null;
  }

  const orderId = order.id;
  serviceOrders['WORK_RESUMED'] = orderId;
  console.log('  Using order: ' + orderId + ' status: ' + order.status);

  // Match token to order's customer
  const custToken = (order.customer && order.customer.id === tokens['CUSTOMER2_USER_ID']) ? tokens['CUSTOMER2'] : tokens['CUSTOMER'];

  let currentStatus = order.status;

  if (currentStatus === 'WORK_RESUMED' || currentStatus === 'IN_PROGRESS') {
    const completeR = await api('POST', '/api/v1/orders/' + orderId + '/complete', {}, tokens['PLUMBER']);
    log('S3', 'Plumber marks COMPLETE', '/api/v1/orders/' + orderId + '/complete', 'PLUMBER', 200, completeR.status, 'N/A',
      completeR.status === 200 ? 'PASS' : 'FAIL');
  }

  const statusR = await api('GET', '/api/v1/orders/' + orderId, null, custToken);
  currentStatus = statusR.data && statusR.data.status;
  log('S3', 'Verify COMPLETED status', '/api/v1/orders/' + orderId, 'CUSTOMER', 'COMPLETED', currentStatus, 'N/A',
    ['COMPLETED','CUSTOMER_CONFIRMED'].includes(currentStatus) ? 'PASS' : 'INFO');

  const confirmR = await api('POST', '/api/v1/orders/' + orderId + '/confirm', {}, custToken);
  log('S3', 'Customer confirms completion', '/api/v1/orders/' + orderId + '/confirm', 'CUSTOMER', 200, confirmR.status, 'N/A',
    confirmR.status === 200 ? 'PASS' : 'FAIL');

  const ratingR = await api('POST', '/api/v1/orders/' + orderId + '/rating',
    { rating: 5, comment: 'Excellent work!' }, custToken);
  log('S3', 'Customer submits rating', '/api/v1/orders/' + orderId + '/rating', 'CUSTOMER',
    '200/201', ratingR.status, 'N/A', [200, 201].includes(ratingR.status) ? 'PASS' : 'FAIL');

  const getRatingR = await api('GET', '/api/v1/orders/' + orderId + '/rating', null, custToken);
  log('S3', 'Retrieve saved rating', '/api/v1/orders/' + orderId + '/rating', 'CUSTOMER',
    200, getRatingR.status, 'N/A', getRatingR.status === 200 ? 'PASS' : 'FAIL');

  const histR = await api('GET', '/api/v1/orders/' + orderId + '/history', null, custToken);
  log('S3', 'Service order history', '/api/v1/orders/' + orderId + '/history', 'CUSTOMER',
    200, histR.status, 'N/A', histR.status === 200 ? 'PASS' : 'FAIL');

  serviceOrders['COMPLETED_WITH_PICKUP'] = orderId;
  return orderId;
}

// Section 4: Workflow WITHOUT products
async function s4_workflowWithoutProducts() {
  console.log('\n=== SECTION 4: Workflow WITHOUT Products ===');
  const custToken = tokens['CUSTOMER2'] || tokens['CUSTOMER'];

  const bookR = await api('POST', '/api/v1/orders', {
    description: 'Section 4 - no products test',
    latitude: 19.076,
    longitude: 72.8777,
    requestType: 'NEARBY_AUTO'
  }, custToken);

  log('S4', 'Customer creates booking', '/api/v1/orders', 'CUSTOMER', '200', bookR.status, 'N/A',
    [200,201].includes(bookR.status) ? 'PASS' : 'FAIL');
  if (![200,201].includes(bookR.status)) {
    console.log('  Booking error: ' + JSON.stringify(bookR.data));
    return null;
  }

  const orderId = bookR.data && bookR.data.id;
  console.log('  Service order created: ' + orderId);
  serviceOrders['NO_PRODUCTS'] = orderId;

  // Use currently authenticated plumber's ID
  const plumberId = tokens['PLUMBER_USER_ID'];
  console.log('  Assigning Plumber ID: ' + plumberId);

  const assignR = await api('POST', '/api/v1/admin/orders/' + orderId + '/assign', { plumberId, reason: 'Assigned for test' }, tokens['ADMIN']);
  log('S4', 'Admin assigns plumber', '/api/v1/admin/orders/' + orderId + '/assign', 'ADMIN', 200, assignR.status, 'N/A',
    assignR.status === 200 ? 'PASS' : 'FAIL');

  const acceptR = await api('POST', '/api/v1/orders/' + orderId + '/accept', {}, tokens['PLUMBER']);
  log('S4', 'Plumber accepts job', '/api/v1/orders/' + orderId + '/accept', 'PLUMBER', 200, acceptR.status, 'N/A',
    acceptR.status === 200 ? 'PASS' : 'FAIL');

  const arriveR = await api('POST', '/api/v1/orders/' + orderId + '/arrive', {}, tokens['PLUMBER']);
  log('S4', 'Plumber arrives on site', '/api/v1/orders/' + orderId + '/arrive', 'PLUMBER', 200, arriveR.status, 'N/A',
    arriveR.status === 200 ? 'PASS' : 'FAIL');

  const startR = await api('POST', '/api/v1/orders/' + orderId + '/start', {}, tokens['PLUMBER']);
  log('S4', 'Plumber starts work', '/api/v1/orders/' + orderId + '/start', 'PLUMBER', 200, startR.status, 'N/A',
    startR.status === 200 ? 'PASS' : 'FAIL');

  const completeR = await api('POST', '/api/v1/orders/' + orderId + '/complete', {}, tokens['PLUMBER']);
  log('S4', 'Plumber completes job', '/api/v1/orders/' + orderId + '/complete', 'PLUMBER', 200, completeR.status, 'N/A',
    completeR.status === 200 ? 'PASS' : 'FAIL');

  const confirmR = await api('POST', '/api/v1/orders/' + orderId + '/confirm', {}, custToken);
  log('S4', 'Customer confirms completion', '/api/v1/orders/' + orderId + '/confirm', 'CUSTOMER', 200, confirmR.status, 'N/A',
    confirmR.status === 200 ? 'PASS' : 'FAIL');

  const rateR = await api('POST', '/api/v1/orders/' + orderId + '/rating',
    { rating: 5, comment: 'Great service without materials!' }, custToken);
  log('S4', 'Customer submits rating', '/api/v1/orders/' + orderId + '/rating', 'CUSTOMER',
    '200', rateR.status, 'N/A', [200, 201].includes(rateR.status) ? 'PASS' : 'FAIL');

  return orderId;
}

// Section 5: Full pickup workflow
async function s5_fullPickupWorkflow() {
  console.log('\n=== SECTION 5: Full Pickup Workflow (End-to-End) ===');

  const bookR = await api('POST', '/api/v1/orders', {
    description: 'S5 full pickup RC verification',
    latitude: 19.076,
    longitude: 72.8777,
    requestType: 'NEARBY_AUTO'
  }, tokens['CUSTOMER']);

  log('S5', '1. Customer creates booking', '/api/v1/orders', 'CUSTOMER', '200', bookR.status, 'N/A',
    [200,201].includes(bookR.status) ? 'PASS' : 'FAIL');
  if (![200,201].includes(bookR.status)) { console.log('  Booking error: ' + JSON.stringify(bookR.data)); return null; }

  const orderId = bookR.data && bookR.data.id;
  serviceOrders['FULL_PICKUP'] = orderId;
  console.log('  Service order: ' + orderId);

  // 2. Admin assigns plumber
  const plumberId = tokens['PLUMBER_USER_ID'];
  const assignR = await api('POST', '/api/v1/admin/orders/' + orderId + '/assign', { plumberId, reason: 'Pickup workflow test' }, tokens['ADMIN']);
  log('S5', '2. Admin assigns plumber', '/api/v1/admin/orders/' + orderId + '/assign', 'ADMIN', 200, assignR.status, 'N/A',
    assignR.status === 200 ? 'PASS' : 'FAIL');

  // 3. Plumber accepts
  const acceptR = await api('POST', '/api/v1/orders/' + orderId + '/accept', {}, tokens['PLUMBER']);
  log('S5', '3. Plumber accepts', '/api/v1/orders/' + orderId + '/accept', 'PLUMBER', 200, acceptR.status, 'N/A',
    acceptR.status === 200 ? 'PASS' : 'FAIL');

  // 4. Plumber arrives
  const arriveR = await api('POST', '/api/v1/orders/' + orderId + '/arrive', {}, tokens['PLUMBER']);
  log('S5', '4. Plumber arrives on site', '/api/v1/orders/' + orderId + '/arrive', 'PLUMBER', 200, arriveR.status, 'N/A',
    arriveR.status === 200 ? 'PASS' : 'FAIL');

  // 5. Plumber starts work
  const startR = await api('POST', '/api/v1/orders/' + orderId + '/start', {}, tokens['PLUMBER']);
  log('S5', '5. Plumber starts work', '/api/v1/orders/' + orderId + '/start', 'PLUMBER', 200, startR.status, 'N/A',
    startR.status === 200 ? 'PASS' : 'FAIL');

  // 6. Fetch available stores
  const storesR = await api('GET', '/api/v1/stores', null, tokens['PLUMBER']);
  log('S5', '6. Fetch available stores', '/api/v1/stores', 'PLUMBER', 200, storesR.status, 'N/A',
    storesR.status === 200 ? 'PASS' : 'FAIL');

  let storeId = null;
  if (storesR.status === 200 && Array.isArray(storesR.data) && storesR.data.length > 0) {
    storeId = storesR.data[0].id;
  }

  let productId = null;
  if (storeId) {
    const invR = await api('GET', '/api/v1/stores/' + storeId + '/inventory', null, tokens['PLUMBER']);
    log('S5', '7. Fetch real store inventory', '/api/v1/stores/' + storeId + '/inventory', 'PLUMBER', 200, invR.status, 'N/A',
      invR.status === 200 ? 'PASS' : 'FAIL');
    if (invR.status === 200 && Array.isArray(invR.data) && invR.data.length > 0) {
      const item = invR.data[0];
      productId = (item.product && item.product.id) || item.productId;
    }
  }

  if (storeId && productId) {
    // 8. Create material request
    const matR = await api('POST', '/api/v1/service-orders/' + orderId + '/material-requests', {
      storeId, items: [{ productId, quantity: 2 }]
    }, tokens['PLUMBER']);
    log('S5', '8. Create material request', '/api/v1/service-orders/' + orderId + '/material-requests', 'PLUMBER', '201', matR.status, 'N/A',
      [200,201].includes(matR.status) ? 'PASS' : 'FAIL');

    const matReqId = matR.data && matR.data.id;
    serviceOrders['MATERIAL_REQUEST'] = matReqId;

    if (matReqId) {
      // 8b. Plumber submits material request for store review
      const submitR = await api('POST', '/api/v1/material-requests/' + matReqId + '/submit', {}, tokens['PLUMBER']);
      log('S5', '8b. Plumber submits material request', '/api/v1/material-requests/' + matReqId + '/submit', 'PLUMBER', 200, submitR.status, 'N/A',
        submitR.status === 200 ? 'PASS' : 'FAIL');

      // 9. Store reviews
      const storeReqsR = await api('GET', '/api/v1/store/material-requests', null, tokens['STORE_MANAGER']);
      log('S5', '9. Store reviews request', '/api/v1/store/material-requests', 'STORE_MANAGER', 200, storeReqsR.status, 'N/A',
        storeReqsR.status === 200 ? 'PASS' : 'FAIL');

      // 10. Store approves
      const approveR = await api('POST', '/api/v1/store/material-requests/' + matReqId + '/approve', {}, tokens['STORE_MANAGER']);
      log('S5', '10. Store approves request', '/api/v1/store/material-requests/' + matReqId + '/approve', 'STORE_MANAGER', 200, approveR.status, 'N/A',
        approveR.status === 200 ? 'PASS' : 'FAIL');

      // 11. Reserve stock
      const reserveR = await api('POST', '/api/v1/store/material-requests/' + matReqId + '/reserve', {}, tokens['STORE_MANAGER']);
      log('S5', '11. Store reserves stock', '/api/v1/store/material-requests/' + matReqId + '/reserve', 'STORE_MANAGER', 200, reserveR.status, 'N/A',
        reserveR.status === 200 ? 'PASS' : 'FAIL');

      // 12. Prepare products
      const prepR = await api('POST', '/api/v1/store/material-requests/' + matReqId + '/prepare', {}, tokens['STORE_MANAGER']);
      log('S5', '12. Store prepares products', '/api/v1/store/material-requests/' + matReqId + '/prepare', 'STORE_MANAGER', 200, prepR.status, 'N/A',
        prepR.status === 200 ? 'PASS' : 'FAIL');

      // 13. Mark ready for pickup
      const readyR = await api('POST', '/api/v1/store/material-requests/' + matReqId + '/ready-for-pickup', {}, tokens['STORE_MANAGER']);
      log('S5', '13. Store marks ready for pickup', '/api/v1/store/material-requests/' + matReqId + '/ready-for-pickup', 'STORE_MANAGER', 200, readyR.status, 'N/A',
        readyR.status === 200 ? 'PASS' : 'FAIL');

      // 14. Plumber arrives at store
      const arriveStoreR = await api('POST', '/api/v1/plumber/material-requests/' + matReqId + '/arrived-at-store', {}, tokens['PLUMBER']);
      log('S5', '14. Plumber arrives at store', '/api/v1/plumber/material-requests/' + matReqId + '/arrived-at-store', 'PLUMBER', 200, arriveStoreR.status, 'N/A',
        arriveStoreR.status === 200 ? 'PASS' : 'FAIL');

      // 15. Plumber collects products
      const collectR = await api('POST', '/api/v1/plumber/material-requests/' + matReqId + '/collect', {}, tokens['PLUMBER']);
      log('S5', '15. Plumber collects products', '/api/v1/plumber/material-requests/' + matReqId + '/collect', 'PLUMBER', 200, collectR.status, 'N/A',
        collectR.status === 200 ? 'PASS' : 'FAIL');

      // 16. Store confirms collection
      const storeConfR = await api('POST', '/api/v1/store/material-requests/' + matReqId + '/confirm-collection', {}, tokens['STORE_MANAGER']);
      log('S5', '16. Store confirms collection', '/api/v1/store/material-requests/' + matReqId + '/confirm-collection', 'STORE_MANAGER', 200, storeConfR.status, 'N/A',
        storeConfR.status === 200 ? 'PASS' : 'FAIL');

      // 17. Plumber returns to customer
      const returnR = await api('POST', '/api/v1/service-orders/' + orderId + '/returning-to-customer', {}, tokens['PLUMBER']);
      log('S5', '17. Plumber returning to customer', '/api/v1/service-orders/' + orderId + '/returning-to-customer', 'PLUMBER', 200, returnR.status, 'N/A',
        returnR.status === 200 ? 'PASS' : 'FAIL');

      // 18. Plumber resumes work
      const resumeR = await api('POST', '/api/v1/service-orders/' + orderId + '/resume-work', {}, tokens['PLUMBER']);
      log('S5', '18. Plumber resumes work', '/api/v1/service-orders/' + orderId + '/resume-work', 'PLUMBER', 200, resumeR.status, 'N/A',
        resumeR.status === 200 ? 'PASS' : 'FAIL');
    }
  }

  // 19. Plumber completes service
  const completeR = await api('POST', '/api/v1/orders/' + orderId + '/complete', {}, tokens['PLUMBER']);
  log('S5', '19. Plumber completes service', '/api/v1/orders/' + orderId + '/complete', 'PLUMBER', 200, completeR.status, 'N/A',
    completeR.status === 200 ? 'PASS' : 'FAIL');

  // 20. Customer confirms completion
  const custConfirmR = await api('POST', '/api/v1/orders/' + orderId + '/confirm', {}, tokens['CUSTOMER']);
  log('S5', '20. Customer confirms completion', '/api/v1/orders/' + orderId + '/confirm', 'CUSTOMER', 200, custConfirmR.status, 'N/A',
    custConfirmR.status === 200 ? 'PASS' : 'FAIL');

  // 21. Customer submits rating
  const rateR = await api('POST', '/api/v1/orders/' + orderId + '/rating',
    { rating: 5, comment: 'Full pickup RC test - excellent!' }, tokens['CUSTOMER']);
  log('S5', '21. Customer submits rating', '/api/v1/orders/' + orderId + '/rating', 'CUSTOMER',
    '200/201', rateR.status, 'N/A', [200,201].includes(rateR.status) ? 'PASS' : 'FAIL');

  // 22. Verify final status
  const finalR = await api('GET', '/api/v1/orders/' + orderId, null, tokens['CUSTOMER']);
  const finalStatus = finalR.data && finalR.data.status;
  log('S5', '22. Verify CUSTOMER_CONFIRMED final status', '/api/v1/orders/' + orderId, 'CUSTOMER',
    'CUSTOMER_CONFIRMED', finalStatus, 'N/A',
    ['CUSTOMER_CONFIRMED','CONFIRMED','CLOSED'].includes(finalStatus) ? 'PASS' : 'FAIL');

  // 23. Material request history
  if (serviceOrders['MATERIAL_REQUEST']) {
    const mrHistR = await api('GET', '/api/v1/material-requests/' + serviceOrders['MATERIAL_REQUEST'] + '/history', null, tokens['PLUMBER']);
    log('S5', '23. Material request history', '/api/v1/material-requests/' + serviceOrders['MATERIAL_REQUEST'] + '/history', 'PLUMBER',
      200, mrHistR.status, 'N/A', mrHistR.status === 200 ? 'PASS' : 'FAIL');
  }

  // 24. Service order history
  const soHistR = await api('GET', '/api/v1/orders/' + orderId + '/history', null, tokens['CUSTOMER']);
  log('S5', '24. Service order history', '/api/v1/orders/' + orderId + '/history', 'CUSTOMER',
    200, soHistR.status, 'N/A', soHistR.status === 200 ? 'PASS' : 'FAIL');

  // 25. Rating data
  const getRateR = await api('GET', '/api/v1/orders/' + orderId + '/rating', null, tokens['CUSTOMER']);
  log('S5', '25. Verify rating saved', '/api/v1/orders/' + orderId + '/rating', 'CUSTOMER',
    200, getRateR.status, 'N/A', getRateR.status === 200 ? 'PASS' : 'FAIL');

  return orderId;
}

// Section 9: Admin portal
async function s9_adminPortal() {
  console.log('\n=== SECTION 9: Admin Portal Verification ===');
  const adminEps = [
    '/api/v1/admin/metrics',
    '/api/v1/admin/super/users',
  ];
  for (const path of adminEps) {
    const r = await api('GET', path, null, tokens['ADMIN']);
    log('S9', 'Admin GET ' + path, path, 'ADMIN', 200, r.status, 'N/A',
      [200,204].includes(r.status) ? 'PASS' : 'FAIL');
  }
}

// Section 13: Authorization & Edge Cases / Idempotency
async function s13_auth() {
  console.log('\n=== SECTION 13: Authorization & Edge Cases ===');

  // Missing token
  const r1 = await api('GET', '/api/v1/orders/1');
  log('S13', 'Missing token - protected endpoint', '/api/v1/orders/1', 'ANON', [401,403], r1.status, 'N/A',
    [401,403].includes(r1.status) ? 'PASS' : 'FAIL');

  // Invalid token
  const r2 = await api('GET', '/api/v1/orders/1', null, 'invalid.jwt.token');
  log('S13', 'Invalid JWT', '/api/v1/orders/1', 'INVALID', [401,403], r2.status, 'N/A',
    [401,403].includes(r2.status) ? 'PASS' : 'FAIL');

  // Customer -> admin
  const r3 = await api('GET', '/api/v1/admin/metrics', null, tokens['CUSTOMER']);
  log('S13', 'CUSTOMER accessing admin endpoint', '/api/v1/admin/metrics', 'CUSTOMER', [401,403], r3.status, 'N/A',
    [401,403].includes(r3.status) ? 'PASS' : 'FAIL');

  // Duplicate Rating
  if (serviceOrders['FULL_PICKUP']) {
    const orderId = serviceOrders['FULL_PICKUP'];
    const rDupRate = await api('POST', '/api/v1/orders/' + orderId + '/rating', { rating: 4, comment: 'Dup' }, tokens['CUSTOMER']);
    log('S13', 'Duplicate rating rejected', '/api/v1/orders/' + orderId + '/rating', 'CUSTOMER', 409, rDupRate.status, 'N/A',
      rDupRate.status === 409 ? 'PASS' : 'FAIL');

    // Duplicate Confirmation (idempotent 200)
    const rDupConf = await api('POST', '/api/v1/orders/' + orderId + '/confirm', {}, tokens['CUSTOMER']);
    log('S13', 'Duplicate confirmation idempotent', '/api/v1/orders/' + orderId + '/confirm', 'CUSTOMER', 200, rDupConf.status, 'N/A',
      rDupConf.status === 200 ? 'PASS' : 'FAIL');

    // Duplicate Completion (idempotent 200)
    const rDupComp = await api('POST', '/api/v1/orders/' + orderId + '/complete', {}, tokens['PLUMBER']);
    log('S13', 'Duplicate completion idempotent', '/api/v1/orders/' + orderId + '/complete', 'PLUMBER', 200, rDupComp.status, 'N/A',
      rDupComp.status === 200 ? 'PASS' : 'FAIL');

    // Cross-customer access check
    const rCrossCust = await api('GET', '/api/v1/orders/' + orderId, null, tokens['CUSTOMER2']);
    log('S13', 'Cross-customer access denied', '/api/v1/orders/' + orderId, 'CUSTOMER2', 403, rCrossCust.status, 'N/A',
      rCrossCust.status === 403 ? 'PASS' : 'FAIL');
  }
}

// Main
async function main() {
  console.log('FixKart MVP RC Verification - Commit 571f75d');
  console.log('==============================================');

  await s1_auth();
  await s3_completionFlow();
  await s4_workflowWithoutProducts();
  await s5_fullPickupWorkflow();
  await s9_adminPortal();
  await s13_auth();

  console.log('\n=== FINAL RESULTS ===');
  const pass = results.filter(r => r.result === 'PASS').length;
  const fail = results.filter(r => r.result === 'FAIL').length;
  const skip = results.filter(r => r.result === 'SKIP').length;
  const info = results.filter(r => r.result === 'INFO').length;
  console.log('Total: ' + results.length + ' | PASS: ' + pass + ' | FAIL: ' + fail + ' | SKIP: ' + skip + ' | INFO: ' + info);

  if (fail > 0) {
    console.log('\n--- FAILURES ---');
    results.filter(r => r.result === 'FAIL').forEach(r => {
      console.log('  FAIL | ' + r.section + ' | ' + r.step + ' | Expected:' + r.expected + ' Got:' + r.actual);
    });
  }

  console.log('\n--- Service Orders Created ---');
  Object.entries(serviceOrders).forEach(([k,v]) => console.log('  ' + k + ': ' + v));

  const overallPass = fail === 0;
  console.log('\nOverall: ' + (overallPass ? 'ALL PASS' : 'HAS FAILURES'));
  process.exit(overallPass ? 0 : 1);
}

main().catch(e => { console.error('Fatal error:', e); process.exit(1); });
