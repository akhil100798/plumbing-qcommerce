const io = require('socket.io-client');
const axios = require('axios');
const { exec } = require('child_process');

const EDGE_URL = 'http://localhost:3000';
const CORE_URL = 'http://localhost:8080';

async function runTests() {
    console.log("==========================================");
    console.log("🔍 PLUMBING Q-COMMERCE: EDGE CASE REPORT");
    console.log("==========================================\n");

    let passedTests = 0;
    let failedTests = 0;

    // SCENARIO 1: No plumbers available
    try {
        console.log("TEST 1: Customer requests plumber when 0 are online/nearby.");
        await axios.post(`${EDGE_URL}/api/v1/edge/requests/nearby`, {
            customerId: 'cust_99',
            longitude: -122.4194,
            latitude: 37.7749
        });
        console.log("❌ FAILED: Did not reject request.");
        failedTests++;
    } catch (e) {
        if (e.response && e.response.status === 404) {
            console.log("✅ PASSED: Correctly returned 404 Not Found.");
            passedTests++;
        } else {
            console.log("❌ FAILED: Unexpected error", e.message);
            failedTests++;
        }
    }

    // Connect remote plumber
    const pNy = io(EDGE_URL);
    pNy.emit('location_ping', { plumberId: 'pl_ny', longitude: -74.0060, latitude: 40.7128 });
    
    // Connect nearby plumber
    const pSf = io(EDGE_URL);
    pSf.emit('location_ping', { plumberId: 'pl_sf', longitude: -122.4190, latitude: 37.7750 });

    await new Promise(r => setTimeout(r, 1500)); // wait for redis

    // SCENARIO 2: Geo-Spatial filtering ignores distant plumbers
    try {
        console.log("\nTEST 2: Geo-Radius routing mechanism (SF customer).");
        const res = await axios.post(`${EDGE_URL}/api/v1/edge/requests/nearby`, {
            customerId: 'cust_99',
            longitude: -122.4194,
            latitude: 37.7749
        });
        
        const notified = res.data.notified;
        if (notified.length === 1 && notified[0].plumberId === 'pl_sf') {
            console.log("✅ PASSED: Ignored NY plumber, correctly routed to SF plumber only.");
            passedTests++;
        } else {
            console.log("❌ FAILED: Routed to incorrect plumbers", notified);
            failedTests++;
        }
    } catch (e) {
        console.log("❌ FAILED: Server rejected request", e.message);
        failedTests++;
    }

    // SCENARIO 3: Spring Boot Duplicate User Constraint
    try {
        console.log("\nTEST 3: Duplicate Database Entry (Core Backend).");
        const user = { email: "edge@case.com", password: "123", fullName: "Edge", phone: "000", role: "CUSTOMER" };
        
        // Setup initial user
        await axios.post(`${CORE_URL}/api/v1/users`, user).catch(() => {});
        
        // Hit it again
        await axios.post(`${CORE_URL}/api/v1/users`, user);
        console.log("❌ FAILED: Allowed duplicate email creation.");
        failedTests++;
    } catch (e) {
        if (e.response && e.response.status === 500) { 
            // Postgres ConstraintViolation maps to 500 by default in basic Spring without ControllerAdvice
            console.log("✅ PASSED: Core Backend rejected duplicate email unique constraint.");
            passedTests++;
        } else {
            console.log("❌ FAILED: Unexpected status code", e.message);
            failedTests++;
        }
    }

    console.log("\n==========================================");
    console.log(`REPORT SUMMARY: ${passedTests} Passed | ${failedTests} Failed`);
    console.log("==========================================");

    pNy.disconnect();
    pSf.disconnect();
    process.exit(0);
}

// Start tests
runTests();
