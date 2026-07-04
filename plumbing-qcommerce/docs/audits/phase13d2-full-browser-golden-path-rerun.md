# Phase 13D.2 Full Browser Golden Path Rerun

Date: 2026-07-04

Branch: `phase13a-local-staging-sms`

Previous commit: `9963ccf`

Production deployment: **NO**

Cloud staging deployment: **NO**

Final verdict: **BLOCKED — CRITICAL SECURITY REGRESSION**

## Executive Summary

Phase 13D.2 restarted the local backend and Edge gateway, verified infrastructure, reran backend and Edge gates, loaded the local UI entry points with headless browser automation, and executed sanitized API/browser-assisted golden path probes.

The run is **not releasable**. Backend and Edge are up, customer OTP/address, catalog/search, checkout reserve/confirm, store list/accept, service booking, plumber job completion, socket spoof rejection, and admin APIs passed. However, the product fulfillment path is blocked at store packing, the required admin URL on port `3101` returns `500`, and backend DEBUG logging exposes request body fields containing passwords during login requests.

Because password-bearing request bodies appear in backend runtime logs, the release is classified as **BLOCKED — CRITICAL SECURITY REGRESSION**.

## Environment Status

| Component | Result | Evidence |
| --- | --- | --- |
| Git branch | PASS | `phase13a-local-staging-sms` |
| Previous HEAD | PASS | `9963ccf` |
| Working tree before docs | PASS | Clean |
| PostgreSQL | PASS | `select 1` succeeded |
| Redis | PASS | `PING` returned `PONG` |
| MongoDB | PASS | `adminCommand('ping')` returned `ok: 1` |
| Kafka | PASS | Local topics listed |
| Zookeeper | PARTIAL | Container running and Kafka usable; direct `zkServer.sh status` unavailable in image |

## Backend And Edge Restart Result

| Check | Result | Evidence |
| --- | --- | --- |
| Backend tests | PASS | Surefire aggregate: 208 run, 0 failures, 0 errors, 0 skipped |
| Backend package | PASS | `mvnw.cmd -DskipTests package` succeeded after stopping stale backend |
| Backend startup | PASS | Fresh jar started on `8081` |
| Backend health | PASS | `/actuator/health` returned `UP` |
| API docs | PASS | `/api-docs` returned `200` |
| Edge `npm ci` | PASS | 0 vulnerabilities |
| Edge tests | PASS | 15/15 tests passed |
| Edge build | PASS | `node --check server.js` passed |
| Edge startup | PASS | Fresh gateway started on `3000` |
| Edge health | PASS | `status=UP`, Redis connected |
| Redis adapter | PASS | `socketRedisAdapter=CONNECTED` |

## UI Browser Load Result

| App | URL | Result | Notes |
| --- | --- | --- | --- |
| Admin required URL | `http://localhost:3101` | FAIL | Browser load returned `500 Internal Server Error` |
| Admin alternate URL | `http://localhost:3100` | PASS | Browser load returned `200`; admin login reached `/dashboard` |
| Customer app | `http://localhost:19007` | PASS | Browser load returned `200` |
| Plumber app | `http://localhost:19008` | PARTIAL | Browser load returned `200`, but emitted a React navigation direct-child warning |
| Store app | `http://localhost:19009` | PASS | Browser load returned `200` |

The in-app Codex browser automation runtime failed in this session with a Windows sandbox helper error. Headless Chrome through local Playwright was used as the real-browser fallback.

## Customer OTP And Address Result

| Check | Result | Evidence |
| --- | --- | --- |
| OTP send | PASS | `/api/v1/auth/send-otp` succeeded for local test phone |
| Redis OTP capture | PASS | Local capture key was present in Redis |
| OTP verify | PASS | `/api/v1/auth/verify-otp` returned an authenticated local customer |
| `/users/me` | PASS | Authenticated customer self-profile returned `200` |
| Address create | PASS | `/api/v1/users/me/addresses` created a new local test address |
| Address persistence | PASS | Address was returned by follow-up address list |
| Log safety | FAIL | Backend DEBUG logs include request body fields containing passwords during login |

No real customer data was used.

## Catalog, Cart, And Checkout Result

| Check | Result | Evidence |
| --- | --- | --- |
| Home/browser app load | PASS | Customer app loaded in browser at `19007` |
| Categories | PASS | Catalog categories endpoint returned data |
| Search | PASS | Catalog search endpoint returned data |
| Product detail | PASS | Product detail endpoint returned data |
| Add to cart / reserve | PASS | Checkout reserve created product order `17` |
| Confirm checkout | PASS | Checkout confirm moved product order to `CONFIRMED` |
| Order ID | PASS | Product order `17` persisted |

## Store Fulfillment Result

| Check | Result | Evidence |
| --- | --- | --- |
| Store app browser load | PASS | Store app loaded in browser at `19009` |
| Store login/API auth | PASS | Store manager API authentication succeeded |
| Product order list | PASS | `/checkout/orders/status/CONFIRMED` returned the new product order |
| Order detail | PASS | Product order detail returned data |
| Accept | PASS | Product order `17` moved to `PACKING` |
| Pack | FAIL | `/checkout/orders/17/pack` returned duplicate constraint `409` |
| Handover/ready | NOT RUN | Blocked by pack failure |
| Status progression | FAIL | Expected `CONFIRMED -> PACKING -> READY_FOR_PICKUP`; blocked at `PACKING` |

The pack failure is caused by a schema/application mismatch: Java writes `READY_FOR_PICKUP`, while the local PostgreSQL check constraint for `product_orders.status` still allows `READY` but not `READY_FOR_PICKUP`.

## Delivery OTP Result

| Check | Result | Evidence |
| --- | --- | --- |
| Delivery accept | NOT RUN | Blocked by store pack failure |
| Wrong OTP rejection | NOT RUN | Blocked by store pack failure |
| Correct OTP acceptance | NOT RUN | Blocked by store pack failure |
| Delivered status | NOT RUN | Blocked by store pack failure |
| Replay rejection | NOT RUN | Blocked by store pack failure |

## Plumber Booking Result

| Check | Result | Evidence |
| --- | --- | --- |
| Service booking API | PASS | Local service order `97` created |
| Job ID | PASS | Service order `97` persisted |
| Backend persistence | PASS | Follow-up fetch returned the service order |
| Plumber visibility | PASS | Pending service-order list included the job |

## Plumber Realtime And Completion Result

| Check | Result | Evidence |
| --- | --- | --- |
| Plumber login/API auth | PASS | Local plumber API authentication succeeded |
| Socket connect | PASS | Edge WebSocket connected with authenticated plumber token |
| Accept job | PASS | Service order moved to `ACCEPTED` |
| Start job | PASS | Service order moved to `IN_PROGRESS` |
| Authorized location | PARTIAL | Socket connection verified; full customer/admin live map visibility not proven |
| Spoof rejection | PASS | Mismatched plumber room registration was rejected |
| Complete job | PASS | Service order moved to `COMPLETED` |
| Backend status | PASS | Follow-up fetch returned `COMPLETED` |
| Customer/admin visibility | PARTIAL | Backend status visible; full browser UI visibility not proven |

## Admin Portal Result

| Check | Result | Evidence |
| --- | --- | --- |
| Required admin URL | FAIL | `http://localhost:3101` returned `500` |
| Alternate admin URL | PASS | `http://localhost:3100` loaded in browser |
| Browser login | PASS | Login reached `/dashboard` on port `3100` |
| Dashboard/API metrics | PASS | Admin metrics endpoint returned `200` |
| Users/RBAC | PASS | RBAC self endpoint returned `SUPER_ADMIN` |
| System health | PASS | Super admin system-health endpoint returned `200` |
| Logout | NOT RUN | Not reached in this rerun |

## Data Consistency Result

| Data | Result | Evidence |
| --- | --- | --- |
| Customer | PASS | Local OTP-created customers persisted |
| Address | PASS | Local address persisted |
| Product order | PARTIAL | Product order persisted but blocked at `PACKING` |
| Order item | PASS | Checkout reserve persisted order item data |
| Store status | FAIL | Store flow blocked before `READY_FOR_PICKUP` |
| Delivery status | NOT RUN | Blocked by pack failure |
| Service order | PASS | Service order persisted |
| Plumber status | PASS | Service order completed |
| Payment/mock | PARTIAL | Checkout confirmation path exercised; real payment not in scope |
| Consistency | PARTIAL | Service path consistent; product path inconsistent due enum/check constraint mismatch |

## Log And URL Safety Result

| Scan | Result | Notes |
| --- | --- | --- |
| Backend log safety | FAIL | DEBUG request logging includes login request bodies with password fields |
| Edge log safety | PASS | No token, OTP, phone, password, or secret hits found in Edge runtime logs |
| Admin log safety | PARTIAL | Existing local Playwright trace script prints auth response bodies; not committed, but unsafe for future reuse |
| Customer log safety | NOT RUN | No customer app runtime log scan completed |
| Plumber log safety | NOT RUN | No plumber app runtime log scan completed |
| Store log safety | NOT RUN | No store app runtime log scan completed |
| URL safety | PARTIAL | `customer-app/.env.example` documents `10.0.2.2`; backend local-staging allows `127.0.0.1:*` |
| CORS safety | PARTIAL | Edge rejects wildcard in production; backend local-staging wildcard-style loopback allowance needs review |

## PASS / PARTIAL / FAIL / NOT RUN Table

| Area | Result |
| --- | --- |
| Local infrastructure | PASS |
| Backend tests/package/startup | PASS |
| Edge install/tests/build/startup | PASS |
| UI browser loads | PARTIAL |
| Customer OTP/address | PASS |
| Catalog/search/product detail | PASS |
| Checkout reserve/confirm | PASS |
| Store product-order list/accept | PASS |
| Store pack/handover | FAIL |
| Delivery OTP | NOT RUN |
| Plumber booking | PASS |
| Plumber realtime/security | PARTIAL |
| Plumber completion | PASS |
| Admin portal | PARTIAL |
| Data consistency | PARTIAL |
| Log safety | FAIL |
| URL/CORS safety | PARTIAL |

## Remaining Blockers

1. Fix product order status schema mismatch: PostgreSQL check constraint must allow the enum value used by the application, or the application must write a schema-valid status.
2. Stop backend DEBUG logging from recording request bodies that include password fields.
3. Restore required admin portal URL `http://localhost:3101` or update the documented local-staging port contract.
4. Resolve plumber app browser warning about invalid navigator direct children.
5. Rerun delivery OTP wrong/correct/replay flow after store pack/handover succeeds.
6. Rerun full browser UI visibility checks for customer, store, plumber, and admin.
7. Re-scan logs after reducing request logging and removing unsafe trace output patterns.

## Recommendation For Cloud Staging

Cloud staging setup must **not** proceed yet.

The local golden path is blocked by a product fulfillment database constraint failure and a critical backend log-safety regression. Fix these blockers, rerun Phase 13D.2, and only then reassess cloud staging readiness.

Production deployment remains **NO**.
