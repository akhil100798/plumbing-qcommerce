/**
 * PlumbCommerce 2.0 - Programmatic QA Integration Test
 * 
 * Verifies backend Spring Boot APIs (port 8081) and edge-service WebSockets (port 3000)
 * to ensure that Plumber App flows are completely integrated.
 */
const axios = require('axios');
const io = require('socket.io-client');

const BACKEND_URL = 'http://localhost:8081/api/v1';
const EDGE_URL = 'http://localhost:3000';

async function runQaSuite() {
    console.log("====================================================");
    console.log("  PLUMBCOMMERCE PLUMBER INTEGRATION QA SUITE");
    console.log("====================================================\n");

    // ----------------------------------------------------
    // PHASE 0: SERVICE HEALTH CHECK
    // ----------------------------------------------------
    console.log("--- PHASE 0: Checking service health ---");
    try {
        await axios.get(`${BACKEND_URL}/catalog/products`);
        console.log("✅ Spring Boot Backend is UP (port 8081).");
    } catch (err) {
        console.error("❌ Spring Boot Backend is DOWN or unreachable at port 8081.");
        console.log("TEST BLOCKED — BACKEND NOT READY.");
        return;
    }

    try {
        // Simple socket handshake test to verify edge service is up
        const testSocket = io(EDGE_URL, { transports: ['websocket'], autoConnect: false });
        testSocket.connect();
        await new Promise((resolve, reject) => {
            testSocket.on('connect', () => {
                testSocket.disconnect();
                resolve();
            });
            setTimeout(() => {
                testSocket.disconnect();
                reject(new Error("Timeout"));
            }, 3000);
        });
        console.log("✅ Edge Service WebSocket Gateway is UP (port 3000).");
    } catch (err) {
        console.error("❌ Edge Service WebSocket is DOWN or unreachable at port 3000.");
        console.log("TEST BLOCKED — EDGE SERVICE NOT READY.");
        return;
    }

    // ----------------------------------------------------
    // PHASE 1: USER REGISTRATION & AUTH ROTATION
    // ----------------------------------------------------
    console.log("\n--- PHASE 1: Authentication & Token Rotation ---");
    const unique = Date.now().toString().substring(8);
    const plumberPhone = `+91 98765${unique}`;
    
    let plumberToken = null;
    let plumberRefreshToken = null;
    let plumberId = null;

    try {
        // Send OTP
        await axios.post(`${BACKEND_URL}/auth/send-otp`, { phone: plumberPhone });
        console.log(`✅ OTP sent to plumber mobile: ${plumberPhone}`);

        // Verify OTP (sends back role CUSTOMER by default on new registers, so we login static test accounts for UAT)
        console.log("Logging in using bootstrap test plumber phone '+91 9876543210' with OTP '123456'...");
        const loginRes = await axios.post(`${BACKEND_URL}/auth/verify-otp`, {
            phone: "+91 9876543210",
            code: "123456"
        });

        plumberToken = loginRes.data.token;
        plumberRefreshToken = loginRes.data.refreshToken;
        plumberId = loginRes.data.userId;

        console.log(`✅ Authentication verified. JTI token received.`);
        console.log(`   Plumber ID: ${plumberId} | Role: ${loginRes.data.role}`);
    } catch (err) {
        console.error("❌ Authentication test FAILED:", err.response ? err.response.data : err.message);
        return;
    }

    // ----------------------------------------------------
    // PHASE 2: WEBSOCKET LOCATION CHANNEL VERIFICATION
    // ----------------------------------------------------
    console.log("\n--- PHASE 2: WebSocket location pings ---");
    const socket = io(EDGE_URL, {
        transports: ['websocket'],
        extraHeaders: {
            Authorization: `Bearer ${plumberToken}`
        }
    });

    try {
        await new Promise((resolve) => {
            socket.on('connect', () => {
                console.log("✅ WebSocket connection handshaked with JWT.");
                
                // Register plumber room
                socket.emit('register_plumber', { plumberId });
                console.log(`✅ Emitted register_plumber for ID: ${plumberId}`);
                
                // Ping live coordinates
                socket.emit('location_ping', {
                    plumberId,
                    latitude: 17.4933,
                    longitude: 78.3489
                });
                console.log("✅ Emitted location_ping (GPS coordinates updated).");
                resolve();
            });
        });
    } catch (err) {
        console.error("❌ WebSocket event test FAILED:", err.message);
        socket.disconnect();
        return;
    }

    // ----------------------------------------------------
    // PHASE 3: CUSTOMER ORDER & DISPATCH DISCOVERY FLOW
    // ----------------------------------------------------
    console.log("\n--- PHASE 3: Service Order dispatch simulation ---");
    let testOrderId = null;

    try {
        // 1. Create a customer auth token
        const custLogin = await axios.post(`${BACKEND_URL}/auth/verify-otp`, {
            phone: "+91 9999999999",
            code: "123456"
        });
        const customerToken = custLogin.data.token;

        // 2. Create customer service order
        const orderRes = await axios.post(`${BACKEND_URL}/orders`, {
            description: "Pipe leakage under washbasin in bathroom",
            latitude: 17.4930,
            longitude: 78.3480,
            requestType: "NEARBY_AUTO"
        }, {
            headers: { Authorization: `Bearer ${customerToken}` }
        });

        testOrderId = orderRes.data.id;
        console.log(`✅ Customer service order created. Order ID: ${testOrderId} | Status: ${orderRes.data.status}`);

        // 3. Set up listener for job broadcast
        const offerReceived = new Promise((resolve) => {
            socket.on('JOB_OFFER', (offer) => {
                console.log(`✅ WebSocket event received: JOB_OFFER!`);
                console.log(`   Job ID: ${offer.jobId} | Distance: ${offer.distance}`);
                resolve(offer);
            });
        });

        // 4. Trigger nearby routing metrics via Edge API
        console.log("Triggering dispatcher algorithm on Node.js Edge service...");
        await axios.post(`${EDGE_URL}/api/v1/edge/requests/nearby`, {
            customerId: custLogin.data.userId,
            latitude: 17.4930,
            longitude: 78.3480
        }, {
            headers: { Authorization: `Bearer ${customerToken}` }
        });

        await offerReceived;

    } catch (err) {
        console.error("❌ Order dispatch test FAILED:", err.response ? err.response.data : err.message);
        socket.disconnect();
        return;
    }

    // ----------------------------------------------------
    // PHASE 4: ACTIVE JOB WORKFLOW VERIFICATION
    // ----------------------------------------------------
    console.log("\n--- PHASE 4: Active Job State Machine transitions ---");
    try {
        // Plumber accepts job
        const acceptRes = await axios.patch(`${BACKEND_URL}/orders/${testOrderId}/accept`, {}, {
            headers: { Authorization: `Bearer ${plumberToken}` }
        });
        console.log(`✅ State transition: ACCEPTED. Order status is now ${acceptRes.data.status}`);

        // Plumber starts work
        const startRes = await axios.patch(`${BACKEND_URL}/orders/${testOrderId}/start`, {}, {
            headers: { Authorization: `Bearer ${plumberToken}` }
        });
        console.log(`✅ State transition: STARTED. Order status is now ${startRes.data.status}`);

    } catch (err) {
        console.error("❌ Job state machine transitions FAILED:", err.response ? err.response.data : err.message);
        socket.disconnect();
        return;
    }

    // ----------------------------------------------------
    // PHASE 5: MID-JOB MATERIAL REQUEST FLOW
    // ----------------------------------------------------
    console.log("\n--- PHASE 5: Mid-job parts request & approval ---");
    try {
        // Plumber posts material order
        const partsRes = await axios.post(`${BACKEND_URL}/delivery/material-request`, {
            serviceOrderId: testOrderId,
            storeId: 1,
            items: [
                { productId: 1, quantity: 2 },
                { productId: 2, quantity: 1 }
            ]
        }, {
            headers: { Authorization: `Bearer ${plumberToken}` }
        });

        const materialOrderId = partsRes.data.id;
        console.log(`✅ Plumber material request created. Material Order ID: ${materialOrderId} | Status: ${partsRes.data.status}`);

        // Check wallet transaction
        const walletRes = await axios.get(`${BACKEND_URL}/wallet`, {
            headers: { Authorization: `Bearer ${plumberToken}` }
        });
        console.log(`✅ Wallet balance queried. Balance: ₹${walletRes.data.balance}`);

    } catch (err) {
        console.error("❌ Material request flow FAILED:", err.response ? err.response.data : err.message);
    }

    socket.disconnect();
    console.log("\n🏆 ALL program verification tests complete.");
    console.log("====================================================");
}

runQaSuite();
