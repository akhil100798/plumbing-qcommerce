# Full Real UI E2E UAT Bugs

## BUG-001
App: Plumber app / Backend
Role: Plumber
Screen: Reached Customer
Flow step: Plumber confirms arrival
Steps to reproduce: Login as plumber through UI, open active job, click Start Navigation, click I Have Arrived.
Expected result: Backend updates service order arrival/on-the-way status and UI proceeds to Start Work.
Actual result: UI remains on arrival screen; backend returns 500.
Backend request observed: PATCH https://plumbing-qcommerce.onrender.com/api/v1/orders/1/arrive
Response status: 500
Screenshot path: docs/evidence/full-real-ui-e2e-uat/plumber-app/031-retry-I-Have-Arrived.png
Severity: High
Blocking E2E: YES
Suggested fix: Implement or fix /api/v1/orders/{id}/arrive for assigned plumber orders, or remove the UI action until supported.

## BUG-002
App: Plumber app
Role: Plumber
Screen: Start Work / Material Request
Flow step: Material request path
Steps to reproduce: Open customer-created job through plumber UI and attempt to progress after arrival.
Expected result: Start Work becomes reachable and material request screen can submit a real backend request.
Actual result: Arrival failure blocks Start Work; customer tracking also states material request simulation is disabled in staging.
Backend request observed: PATCH /api/v1/orders/1/arrive returns 500 before material request can proceed.
Response status: 500 upstream blocker
Screenshot path: docs/evidence/full-real-ui-e2e-uat/plumber-app/011-material-request-screen.png
Severity: High
Blocking E2E: YES
Suggested fix: Restore real job status progression, then enable material request endpoint in staging UI without mock success.

## BUG-003
App: Store app / E2E data
Role: Store Manager
Screen: Material requests / Orders
Flow step: Store fulfillment
Steps to reproduce: Complete customer booking and plumber retry, then login store manager and open dashboard/orders/materials.
Expected result: Customer-approved material request/order appears for store fulfillment.
Actual result: Store login succeeds and dashboard loads, but no material request from the E2E job appears because material request flow is blocked before creation.
Backend request observed: GET /api/v1/checkout/orders/status/* returns 200; no E2E material order appears.
Response status: 200 for order list calls, but no linked material order data.
Screenshot path: docs/evidence/full-real-ui-e2e-uat/store-app/015-retry-login-result.png
Severity: High
Blocking E2E: YES
Suggested fix: Fix plumber material request creation and seed/route store-linked material orders.

## BUG-004
App: Mobile apps
Role: QA
Screen: Pre-test validation
Flow step: Static validation
Steps to reproduce: Run npm run typecheck and npm test in customer-app, plumber-app, store-app.
Expected result: Typecheck/tests pass before UAT.
Actual result: typecheck exits 2 and test exits 1 for all three apps; builds pass.
Backend request observed: N/A
Response status: N/A
Screenshot path: docs/evidence/full-real-ui-e2e-uat/network/*-typecheck.log and *-test.log
Severity: Medium
Blocking E2E: NO
Suggested fix: Fix TypeScript errors and test environment mocks, especially React Native/Animated test setup and current UI typing errors.
