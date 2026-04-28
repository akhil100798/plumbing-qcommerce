const http = require('http');

const API_BASE = 'http://localhost:8081/api/v1';

const testUsers = {
    admin: { email: `admin_${Date.now()}@test.com`, password: 'password123', role: 'ADMIN', token: '', id: null },
    manager: { email: `manager_${Date.now()}@test.com`, password: 'password123', role: 'STORE_MANAGER', token: '', id: null },
    plumber: { email: `plumber_${Date.now()}@test.com`, password: 'password123', role: 'PLUMBER', token: '', id: null },
    customer: { email: `customer_${Date.now()}@test.com`, password: 'password123', role: 'CUSTOMER', token: '', id: null },
};

let storeId = null;
let orderId = null;

const report = [];

function logResult(step, endpoint, method, role, status, expected, passed, notes = "") {
    const passIndicator = passed ? "✅ PASS" : "❌ FAIL";
    console.log(`${passIndicator} | [${role}] ${method} ${endpoint} | Status: ${status} (Exp: ${expected}) | ${notes}`);
    report.push(`| ${step} | ${role} | \`${method} ${endpoint}\` | ${expected} | ${status} | ${passIndicator} | ${notes} |`);
}

function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = data;
                try { parsed = JSON.parse(data); } catch(e){}
                resolve({ status: res.statusCode, body: parsed });
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runQaTests() {
    console.log("🚀 Starting Comprehensive Senior QA Test Suite...");
    
    // 1. REGISTRATION PHASE (Public Endpoints)
    for (const [key, user] of Object.entries(testUsers)) {
        const res = await request('POST', '/users', { name: `Test ${user.role}`, email: user.email, password: user.password, phone: '9999999999', role: user.role });
        const passed = res.status === 200 || res.status === 201;
        logResult('01. Reg', '/users', 'POST', 'GUEST', res.status, '200', passed, `Created ${user.role}`);
        if(passed) testUsers[key].id = res.body.id;
    }

    // 2. LOGIN & JWT ISSUANCE PHASE
    for (const [key, user] of Object.entries(testUsers)) {
        const res = await request('POST', '/auth/login', { email: user.email, password: user.password });
        const passed = res.status === 200 && res.body.token !== undefined;
        logResult('02. Auth', '/auth/login', 'POST', user.role, res.status, '200', passed, `JWT Issued`);
        if(passed) testUsers[key].token = res.body.token;
    }

    // 3. UNAUTHORIZED / SECURE ENDPOINT CHECK
    const unauthRes = await request('GET', '/stores'); // No token
    logResult('03. Sec', '/stores', 'GET', 'GUEST', unauthRes.status, '403', unauthRes.status === 403, 'Blocked without JWT');

    // 4. STORE MANAGEMENT (Manager creates store)
    const storeRes = await request('POST', `/stores?managerId=${testUsers.manager.id}`, { name: "QA Hardware Store", location: "QA City" }, testUsers.manager.token);
    let storePassed = storeRes.status === 200;
    logResult('04. Store', '/stores', 'POST', 'STORE_MANAGER', storeRes.status, '200', storePassed, 'Store Created');
    if(storePassed) storeId = storeRes.body.id;

    // 5. SERVICE ORDER WORKFLOW (Customer Flow)
    const orderRes = await request('POST', '/orders', {
        customerId: testUsers.customer.id,
        description: "Pipe bursting in basement",
        latitude: 12.9716,
        longitude: 77.5946,
        requestType: "NEARBY_AUTO"
    }, testUsers.customer.token);
    
    let orderPassed = orderRes.status === 200;
    logResult('05. Order', '/orders', 'POST', 'CUSTOMER', orderRes.status, '200', orderPassed, 'Order Initialized (PENDING)');
    if(orderPassed) orderId = orderRes.body.id;

    // 6. ORDER WORKFLOW (Plumber Flow - Accept)
    if (orderId) {
        const acceptRes = await request('PATCH', `/orders/${orderId}/accept?plumberId=${testUsers.plumber.id}`, null, testUsers.plumber.token);
        logResult('06. Accept', `/orders/*/accept`, 'PATCH', 'PLUMBER', acceptRes.status, '200', acceptRes.status === 200, 'State -> ACCEPTED');

        // 7. ORDER WORKFLOW (Plumber Flow - Start)
        const startRes = await request('PATCH', `/orders/${orderId}/start`, null, testUsers.plumber.token);
        logResult('07. Start', `/orders/*/start`, 'PATCH', 'PLUMBER', startRes.status, '200', startRes.status === 200, 'State -> IN_PROGRESS');

        // 8. ORDER WORKFLOW (Plumber Flow - Complete with billing)
        const compRes = await request('PATCH', `/orders/${orderId}/complete?partsCharge=500.00`, null, testUsers.plumber.token);
        logResult('08. Comp', `/orders/*/complete`, 'PATCH', 'PLUMBER', compRes.status, '200', compRes.status === 200, 'State -> COMPLETED');
    }

    // 9. SERVICE LOG CREATION (Plumber logs the job)
    if (orderId) {
        const logRes = await request('POST', '/logs', {
            orderId: orderId,
            plumberId: testUsers.plumber.id,
            diagnosis: "Broken PVC pipe",
            workDone: "Replaced 3ft of pipe",
            partsUsed: [
                { partName: "PVC Pipe 3ft", quantity: 1, unitPrice: 150.00 },
                { partName: "PVC Adhesive", quantity: 1, unitPrice: 50.00 }
            ],
            notes: "QA Testing with Part Mapping"
        }, testUsers.plumber.token);
        logResult('09. Log', '/logs', 'POST', 'PLUMBER', logRes.status, '200', logRes.status === 200, 'Job info + Parts stored in Mongo');
    }

    // 10. FETCH DATA (Admin fetching logs)
    if (orderId) {
        const fetchRes = await request('GET', `/logs/order/${orderId}`, null, testUsers.admin.token);
        const hasParts = fetchRes.body[0].partsUsed && fetchRes.body[0].partsUsed.length > 0;
        logResult('10. Audit', `/logs/order/*`, 'GET', 'ADMIN', fetchRes.status, '200', fetchRes.status === 200 && hasParts, 'Admin can view logs with parts');
    }

    // 11. EDGE SECURITY CHECK (REST)
    const EDGE_BASE = 'http://localhost:3000/api/v1/edge';
    const edgeRequest = (method, path, body = null, token = null) => {
        return new Promise((resolve, reject) => {
            const url = new URL(EDGE_BASE + path);
            const options = { hostname: url.hostname, port: url.port, path: url.pathname, method: method, headers: { 'Content-Type': 'application/json' } };
            if (token) options.headers['Authorization'] = `Bearer ${token}`;
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({ status: res.statusCode }));
            });
            if (body) req.write(JSON.stringify(body));
            req.end();
        });
    };

    const edgeUnauth = await edgeRequest('POST', '/requests/nearby', { customerId: 1, lat: 0, lon: 0 });
    logResult('11. Edge Sec', '/edge/nearby', 'POST', 'GUEST', edgeUnauth.status, '401', edgeUnauth.status === 401, 'Blocked without JWT');

    const edgeAuth = await edgeRequest('POST', '/requests/nearby', { customerId: 1, lat: 0, lon: 0 }, testUsers.customer.token);
    logResult('12. Edge Sec', '/edge/nearby', 'POST', 'CUSTOMER', edgeAuth.status, '200', edgeAuth.status === 200, 'Accepted with JWT');

    // Output formatted Markdown
    console.log("\n\n=== FOR MARKDOWN REPORT ===");
    console.log(`| Step | Simulated Role | API Endpoint | Expected | Actual | Result | Notes |`);
    console.log(`|---|---|---|---|---|---|---|`);
    console.log(report.join('\n'));
}

runQaTests();
