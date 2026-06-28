# QA Evidence Report

Generated: 2026-06-19T10:41:19.638Z

Total cases: 32
Passed: 29
Failed: 3

## Local URLs

- Admin UI: http://localhost:3100
- Backend API: http://localhost:8081/api/v1
- Edge Gateway: http://localhost:3000

## Positive Cases

| ID | Area | Role | Title | Expected | Actual | Result | Screenshot |
|---|---|---|---|---|---|---|---|
| ENV-HEALTH-001 | Environment | System | Backend readiness endpoint is UP | HTTP 200 with UP status | HTTP 200 | PASS | screenshots/ENV-HEALTH-001.png |
| ENV-HEALTH-002 | Environment | System | Edge readiness endpoint is UP | HTTP 200 with UP status | HTTP 200 | PASS | screenshots/ENV-HEALTH-002.png |
| UI-ADMIN-001 | Admin UI | Store Manager | Admin store manager dashboard shows authenticated live gateway | Visible text includes: Gateway Status:, LIVE, Live Active Jobs, Hardware Inventory | HTTP 200 | PASS | screenshots/UI-ADMIN-001.png |
| UI-ADMIN-002 | Admin UI | Admin | Admin analytics page renders KPI and inventory panels | Visible text includes: Platform Analytics, Total Revenue, Active Plumbers, Store Inventory Alerts | HTTP 200 | FAIL | screenshots/UI-ADMIN-002.png |
| UI-CUSTOMER-001 | Customer UI | Customer | Customer simulator renders authenticated service workflow | Visible text includes: Connected to dispatch edge, Quick Assign, Pick a Store, Direct Plumber | HTTP 200 | PASS | screenshots/UI-CUSTOMER-001.png |
| UI-PLUMBER-001 | Plumber UI | Plumber | Plumber simulator renders authenticated availability screen | Visible text includes: Connected to dispatch edge, AVAILABILITY STATUS, OFFLINE | HTTP 200 | PASS | screenshots/UI-PLUMBER-001.png |
| POS-AUTH-ADMIN | Authentication | admin | admin seeded user can login | HTTP 200 with JWT token | HTTP 200 | PASS | screenshots/POS-AUTH-ADMIN.png |
| POS-AUTH-MANAGER | Authentication | manager | manager seeded user can login | HTTP 200 with JWT token | HTTP 200 | PASS | screenshots/POS-AUTH-MANAGER.png |
| POS-AUTH-CUSTOMER | Authentication | customer | customer seeded user can login | HTTP 200 with JWT token | HTTP 200 | PASS | screenshots/POS-AUTH-CUSTOMER.png |
| POS-AUTH-PLUMBER1 | Authentication | plumber1 | plumber1 seeded user can login | HTTP 200 with JWT token | HTTP 200 | PASS | screenshots/POS-AUTH-PLUMBER1.png |
| POS-AUTH-PLUMBER2 | Authentication | plumber2 | plumber2 seeded user can login | HTTP 200 with JWT token | HTTP 200 | PASS | screenshots/POS-AUTH-PLUMBER2.png |
| POS-STORE-001 | Store | Store Manager | Store manager can create a store | HTTP 200 with store id | HTTP 200 | PASS | screenshots/POS-STORE-001.png |
| POS-STORE-002 | Store | Customer | Authenticated customer can read store list | HTTP 200 with stores array | HTTP 200 | PASS | screenshots/POS-STORE-002.png |
| POS-ORDER-001 | Customer Flow | Customer | Customer can create a plumbing service order | HTTP 200 with PENDING order | HTTP 200 | PASS | screenshots/POS-ORDER-001.png |
| POS-ORDER-002 | Plumber Flow | Plumber | Plumber can accept a pending order | HTTP 200 with ACCEPTED order | HTTP 200 | PASS | screenshots/POS-ORDER-002.png |
| POS-ORDER-003 | Plumber Flow | Plumber | Assigned plumber can start accepted order | HTTP 200 with IN_PROGRESS order | HTTP 200 | PASS | screenshots/POS-ORDER-003.png |
| POS-ORDER-004 | Plumber Flow | Plumber | Assigned plumber can complete in-progress order with parts charge | HTTP 200 with COMPLETED order and total amount | HTTP 200 | PASS | screenshots/POS-ORDER-004.png |
| POS-LOG-001 | Service Log | Plumber | Assigned plumber can create service log with parts used | HTTP 200 with saved service log | HTTP 404 | FAIL | screenshots/POS-LOG-001.png |
| POS-LOG-002 | Service Log | Admin | Admin can read service logs by order | HTTP 200 with service logs | HTTP 404 | FAIL | screenshots/POS-LOG-002.png |
| POS-ADMIN-001 | Admin | Admin | Admin can read platform metrics | HTTP 200 with metrics payload | HTTP 200 | PASS | screenshots/POS-ADMIN-001.png |
| POS-EDGE-001 | Edge Gateway | Plumber | Authenticated plumber socket can publish valid location | Socket ack ok=true | {"ok":true} | PASS | screenshots/POS-EDGE-001.png |
| POS-EDGE-002 | Edge Gateway | Customer | Authenticated customer can request nearby plumbers | HTTP 200 with notified plumber list | HTTP 200 | PASS | screenshots/POS-EDGE-002.png |

## Negative Cases

| ID | Area | Role | Title | Expected | Actual | Result | Screenshot |
|---|---|---|---|---|---|---|---|
| NEG-AUTH-001 | Authentication | Guest | Login fails with wrong password | HTTP 401 | HTTP 401 | PASS | screenshots/NEG-AUTH-001.png |
| NEG-SEC-001 | Security | Guest | Unauthenticated user cannot read stores | HTTP 401 | HTTP 401 | PASS | screenshots/NEG-SEC-001.png |
| NEG-SEC-002 | Store | Customer | Customer cannot create store | HTTP 403 | HTTP 403 | PASS | screenshots/NEG-SEC-002.png |
| NEG-ORDER-001 | Customer Flow | Customer | Customer cannot create order with invalid latitude | HTTP 400 | HTTP 400 | PASS | screenshots/NEG-ORDER-001.png |
| NEG-ORDER-002 | Plumber Flow | Customer | Customer cannot accept an order | HTTP 403 | HTTP 403 | PASS | screenshots/NEG-ORDER-002.png |
| NEG-ORDER-003 | Plumber Flow | Plumber | Plumber cannot complete before accepting and starting | HTTP 403 or 409 | HTTP 403 | PASS | screenshots/NEG-ORDER-003.png |
| NEG-ADMIN-001 | Admin | Store Manager | Store manager cannot read admin metrics | HTTP 403 | HTTP 403 | PASS | screenshots/NEG-ADMIN-001.png |
| NEG-EDGE-001 | Edge Gateway | Guest | Unauthenticated nearby dispatch is rejected | HTTP 401 | HTTP 401 | PASS | screenshots/NEG-EDGE-001.png |
| NEG-EDGE-002 | Edge Gateway | Customer | Customer cannot emit plumber location ping | Socket ack error | {"error":"OPERATION_ERROR"} | PASS | screenshots/NEG-EDGE-002.png |
| NEG-EDGE-003 | Edge Gateway | Customer | Nearby dispatch rejects invalid coordinates | HTTP 400 | HTTP 400 | PASS | screenshots/NEG-EDGE-003.png |

## Failed Cases

| ID | Area | Role | Title | Expected | Actual | Result | Screenshot |
|---|---|---|---|---|---|---|---|
| UI-ADMIN-002 | Admin UI | Admin | Admin analytics page renders KPI and inventory panels | Visible text includes: Platform Analytics, Total Revenue, Active Plumbers, Store Inventory Alerts | HTTP 200 | FAIL | screenshots/UI-ADMIN-002.png |
| POS-LOG-001 | Service Log | Plumber | Assigned plumber can create service log with parts used | HTTP 200 with saved service log | HTTP 404 | FAIL | screenshots/POS-LOG-001.png |
| POS-LOG-002 | Service Log | Admin | Admin can read service logs by order | HTTP 200 with service logs | HTTP 404 | FAIL | screenshots/POS-LOG-002.png |
