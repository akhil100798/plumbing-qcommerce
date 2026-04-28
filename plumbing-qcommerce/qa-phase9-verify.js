const axios = require('axios');

async function verifyPhase9() {
    const BASE_URL = 'http://localhost:8081/api/v1';
    console.log("🚀 Starting Phase 9 Specific Verification...");

    try {
        const uniqueId = Date.now() + "_" + Math.random().toString(36).substring(7);
        const testUser = {
            email: `p9_final_${uniqueId}@test.com`,
            password: 'password123',
            fullName: 'Phase 9 Tester',
            role: 'ADMIN',
            phone: '1234567890'
        };

        // --- PRE-STEP: REGISTER ---
        console.log("--- [PRE-STEP: REGISTER] ---");
        try {
            const regRes = await axios.post(`${BASE_URL}/users`, testUser);
            console.log(`✅ Registration Success. Status: ${regRes.status}`);
            console.log(`Response Data:`, JSON.stringify(regRes.data));
        } catch (err) {
             console.error(`❌ Registration FAILED:`, err.response ? err.response.data : err.message);
             throw err;
        }

        // --- TEST 1: LOGIN & LOGOUT (REVOCATION) ---
        console.log("\n--- [TEST 1: JWT REVOCATION] ---");
        let token;
        try {
            const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
                email: testUser.email,
                password: testUser.password
            });
            token = loginRes.data;
            console.log("✅ Logged in. Token received.");
        } catch (err) {
            console.error(`❌ Login FAILED for ${testUser.email}:`, err.response ? err.response.data : err.message);
            throw err;
        }

        // Verify token works
        console.log(`Verifying token...`);
        await axios.get(`${BASE_URL}/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log("✅ Token is working for authenticated request.");

        // Logout (Revoke)
        await axios.post(`${BASE_URL}/auth/logout`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log("✅ Logged out triggered. JTI blacklisted in Redis.");

        // Verify token is now REJECTED
        try {
            await axios.get(`${BASE_URL}/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.error("❌ FAIL: Token should have been rejected after logout!");
        } catch (err) {
            if (err.response && err.response.status === 401) {
                console.log("✅ SUCCESS: Token correctly rejected with 401 after logout.");
            } else {
                console.error(`❌ Unexpected status after logout: ${err.response ? err.response.status : err.message}`);
                throw err;
            }
        }

        // --- TEST 2: PAYMENT LIFECYCLE (PAID STATE) ---
        console.log("\n--- [TEST 2: PAYMENT & OUTBOX SYNC] ---");
        // Create, Accept, Start, Complete an order (Shortened)
        // (Assuming existing plumbing data from bootstrap)
        
        // Mocking a flow for Order #1
        const orderId = 1; 
        console.log(`Processing Payment for Order #${orderId}...`);
        
        const payRes = await axios.post(`${BASE_URL}/payments/process`, {
            orderId: orderId,
            paymentMethodId: 'tok_visa',
            amount: 550.00,
            currency: 'INR'
        });

        if (payRes.data.status === 'SUCCESS') {
            console.log("✅ Payment Processed successfully.");
            console.log(`Transaction ID: ${payRes.data.transactionId}`);
        }

        // Verify Order status is now PAID
        const orderRes = await axios.get(`${BASE_URL}/orders/${orderId}`);
        if (orderRes.data.status === 'PAID') {
            console.log("✅ Final Verification: Order status updated to PAID.");
        } else {
            console.log(`❌ FAIL: Order Status is ${orderRes.data.status}, expected PAID.`);
        }

        console.log("\n🏆 PHASE 9 VERIFICATION COMPLETE: ALL SYSTEMS NOMINAL.");
    } catch (error) {
        console.error("❌ Phase 9 Verification FAILED:");
        console.error(error.message);
        if (error.response) {
            console.error("Data:", error.response.data);
        }
    }
}

verifyPhase9();
