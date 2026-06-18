# Secure Local Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the local Docker system secure and reproducible, then deliver a fully working customer-to-plumber-to-payment workflow through the UIs.

**Architecture:** Spring Boot remains the authoritative state machine and identity service. The Node edge service performs authenticated geo-routing and realtime delivery. PostgreSQL, MongoDB, Redis, and Kafka run under Docker Compose, while the Expo and Next.js clients use typed authenticated APIs.

**Tech Stack:** Java 17, Spring Boot 4, Spring Security, PostgreSQL, MongoDB, Redis, Kafka, Node.js, Express, Socket.IO, Next.js, Expo, Vitest, Testcontainers, Playwright, Docker Compose.

---

## Task 1: Reproducible Baseline And Test Harness

**Files:**
- Modify: `backend/pom.xml`
- Preserve: `backend/src/test/resources/application-test.yml`
- Modify: `edge-service/package.json`
- Modify: `admin-portal/package.json`
- Modify: `customer-app/package.json`
- Modify: `plumber-app/package.json`
- Create: `scripts/verify-local.ps1`
- Create: `.env.example`

- [ ] **Step 1: Record user-owned test changes**

Run `git diff -- plumbing-qcommerce/backend/pom.xml plumbing-qcommerce/backend/src/test` from `D:/personal project`. Retain the existing H2 dependency, test profile, and test resource changes.

- [ ] **Step 2: Verify Docker before integration work**

Run `docker version` and `docker compose config`. Expected: Docker reports both Client and Server. If it still reports `Docker Desktop is unable to start`, repair the daemon before integration execution.

- [ ] **Step 3: Add test dependencies**

Add Spring Testcontainers modules for PostgreSQL, MongoDB, Kafka, and Redis-compatible generic containers. Add `vitest`, `supertest`, and `socket.io-client` to edge dev dependencies. Add Vitest/testing-library to the clients and Playwright to the admin workspace.

Replace the edge scripts with:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 4: Run baseline checks**

Run backend Maven tests, edge tests, admin lint/build, and both mobile TypeScript checks. Expected: existing passing checks remain green and edge reports zero tests rather than the placeholder failure.

- [ ] **Step 5: Create `scripts/verify-local.ps1`**

The script must set `$ErrorActionPreference = 'Stop'`, run every build/test command, assert `docker compose ps --format json` services are healthy, and exit non-zero on the first failure.

- [ ] **Step 6: Commit**

```powershell
git add plumbing-qcommerce/backend/pom.xml plumbing-qcommerce/backend/src/test plumbing-qcommerce/*/package*.json plumbing-qcommerce/scripts plumbing-qcommerce/.env.example
git commit -m "test: establish local verification harness"
```

## Task 2: Safe Registration And User Responses

**Files:**
- Create: `backend/src/main/java/com/pqc/core/api/auth/RegisterCustomerRequest.java`
- Create: `backend/src/main/java/com/pqc/core/api/user/UserResponse.java`
- Create: `backend/src/main/java/com/pqc/core/api/ApiError.java`
- Modify: `backend/src/main/java/com/pqc/core/controller/UserController.java`
- Modify: `backend/src/main/java/com/pqc/core/service/UserService.java`
- Modify: `backend/src/main/java/com/pqc/core/config/SecurityConfig.java`
- Create: `backend/src/test/java/com/pqc/core/security/UserEndpointSecurityTest.java`

- [ ] **Step 1: Write failing tests**

```java
@Test
void registrationForcesCustomerAndNeverReturnsPassword() throws Exception {
  mvc.perform(post("/api/v1/auth/register")
      .contentType(APPLICATION_JSON)
      .content("""{"email":"new@example.com","password":"Password123!","fullName":"New User","phone":"9999999999","role":"ADMIN"}"""))
    .andExpect(status().isCreated())
    .andExpect(jsonPath("$.role").value("CUSTOMER"))
    .andExpect(jsonPath("$.password").doesNotExist());
}

@Test
void anonymousUserEnumerationIsRejected() throws Exception {
  mvc.perform(get("/api/v1/users")).andExpect(status().isUnauthorized());
}
```

- [ ] **Step 2: Verify RED**

Run `backend\mvnw.cmd -Dtest=UserEndpointSecurityTest test`. Expected: registration currently accepts privileged roles and user listing is public.

- [ ] **Step 3: Implement safe contracts**

`RegisterCustomerRequest` contains validated email, 12-72 character password, full name, and 10-15 digit phone; it has no role field. Normalize email, force `Role.CUSTOMER`, hash once, and return `UserResponse` without password. Permit only `/api/v1/auth/register` and `/api/v1/auth/login`; require admin for `/api/v1/users/**`.

- [ ] **Step 4: Verify GREEN and commit**

Run focused and full backend tests, then commit as `fix: secure customer registration and user responses`.

## Task 3: Role And Ownership Authorization

**Files:**
- Modify: `backend/src/main/java/com/pqc/core/config/SecurityConfig.java`
- Create: `backend/src/main/java/com/pqc/core/security/CurrentUser.java`
- Create: `backend/src/main/java/com/pqc/core/security/OrderAuthorization.java`
- Modify: order, store, log, payment, and admin controllers/services
- Create: `backend/src/test/java/com/pqc/core/security/ResourceAuthorizationTest.java`

- [ ] **Step 1: Write failing authorization matrix tests**

Test anonymous, owner customer, other customer, assigned plumber, other plumber, store manager, and admin. Assertions include `403` for cross-customer reads, customer acceptance, unassigned plumber transitions, arbitrary manager store creation, and cross-plumber logs.

- [ ] **Step 2: Verify RED**

Expected: any authenticated user can currently perform several cross-resource operations.

- [ ] **Step 3: Enable method security**

Add `@EnableMethodSecurity`. Derive actor identity from `Authentication.getName()` through `CurrentUser`; remove caller-supplied actor IDs where identity is available. Add controller `@PreAuthorize` rules and repeat ownership checks in services.

- [ ] **Step 4: Return stable security errors**

Anonymous requests return `401 AUTHENTICATION_REQUIRED`; authenticated forbidden requests return `403 ACCESS_DENIED`. Both use `ApiError` with timestamp, path, stable code, message, field errors, and correlation ID.

- [ ] **Step 5: Verify GREEN and commit**

Run the matrix and full suite; commit as `fix: enforce role and resource authorization`.

## Task 4: Typed And Concurrently Safe Order State Machine

**Files:**
- Modify: `backend/src/main/java/com/pqc/core/entity/ServiceOrder.java`
- Modify: `backend/src/main/java/com/pqc/core/repository/ServiceOrderRepository.java`
- Modify: `backend/src/main/java/com/pqc/core/service/ServiceOrderService.java`
- Create: `backend/src/main/java/com/pqc/core/api/order/CreateOrderRequest.java`
- Create: `backend/src/main/java/com/pqc/core/api/order/CompleteOrderRequest.java`
- Create: `backend/src/main/java/com/pqc/core/api/order/OrderResponse.java`
- Create: `backend/src/test/java/com/pqc/core/order/OrderStateMachineTest.java`
- Create: `backend/src/test/java/com/pqc/core/order/ConcurrentOrderAcceptanceIT.java`

- [ ] **Step 1: Write failing tests**

Cover legal/illegal transitions, owner cancellation, negative parts charges, DTO validation, and two plumbers accepting concurrently. Assert exactly one accepted result and one `409 ORDER_ALREADY_ACCEPTED`.

- [ ] **Step 2: Verify RED against PostgreSQL Testcontainer**

- [ ] **Step 3: Implement minimal state safety**

Add `@Version private long version`, typed requests/responses, principal-derived actors, and one transition-validation function. Translate optimistic locking failures to the stable conflict code. Emit same-transaction outbox records for created, accepted, started, completed, cancelled, and paid transitions.

- [ ] **Step 4: Verify concurrency repeatedly**

Run `ConcurrentOrderAcceptanceIT` twenty times; all runs must have exactly one winner.

- [ ] **Step 5: Commit**

Commit as `fix: make order transitions atomic and typed`.

## Task 5: Reliable Transactional Outbox

**Files:**
- Modify: `backend/src/main/java/com/pqc/core/entity/OutboxEvent.java`
- Modify: `backend/src/main/java/com/pqc/core/repository/OutboxEventRepository.java`
- Replace behavior in: `backend/src/main/java/com/pqc/core/scheduler/OutboxPoller.java`
- Create: `backend/src/main/java/com/pqc/core/service/OutboxPublisher.java`
- Create: `backend/src/test/java/com/pqc/core/outbox/OutboxPublisherTest.java`
- Create: `backend/src/test/java/com/pqc/core/outbox/OutboxKafkaIT.java`

- [ ] **Step 1: Write failing acknowledgement test**

```java
@Test
void kafkaFailureLeavesEventRetryable() {
  sender.failWith(new TimeoutException("broker timeout"));
  publisher.publish(eventId);
  var event = repository.findById(eventId).orElseThrow();
  assertThat(event.getStatus()).isEqualTo(PENDING);
  assertThat(event.getAttempts()).isEqualTo(1);
  assertThat(event.getLastError()).contains("broker timeout");
}
```

- [ ] **Step 2: Verify RED**

Expected: current code marks processed before Kafka acknowledgement.

- [ ] **Step 3: Implement status, claiming, and retry**

Persist event ID, versioned JSON payload, status, attempts, next attempt, and last error. Claim rows with PostgreSQL locking/atomic status change. Mark `PUBLISHED` only after bounded Kafka acknowledgement; retry with bounded exponential backoff and move exhausted records to `DEAD_LETTER`.

- [ ] **Step 4: Verify GREEN**

Test timeout, success, two pollers, retry schedule, dead-letter, structured payload, correlation headers, and Kafka Testcontainer delivery.

- [ ] **Step 5: Commit**

Commit as `fix: acknowledge and retry outbox events safely`.

## Task 6: Authenticated Edge Routing

**Files:**
- Create: `edge-service/app.js`
- Refactor: `edge-service/server.js`
- Create: `edge-service/lib/identity.js`
- Create: `edge-service/lib/validation.js`
- Create: `edge-service/lib/orderEvents.js`
- Modify: edge middleware/services
- Create: `edge-service/test/auth.test.js`
- Create: `edge-service/test/rooms.test.js`
- Create: `edge-service/test/routing.test.js`

- [ ] **Step 1: Write failing spoofing tests**

Connect with a plumber JWT, emit a victim `plumberId`, and assert Redis uses the JWT user ID. Connect with a customer JWT, emit a location ping, and assert `OPERATION_ERROR`. Verify clients cannot join arbitrary customer/plumber rooms.

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Create injectable app factory**

`createApp({ redis, kafka, tokenVerifier, logger })` returns `{ app, httpServer, io, close }`. `server.js` validates environment variables, starts dependencies, handles signals, and contains no route logic.

- [ ] **Step 4: Bind identity and validate messages**

JWT claims include `userId` and `role`. Automatically join the correct role room after authentication. Remove registration identity events. Validate longitude `[-180,180]`, latitude `[-90,90]`, and durable order IDs.

- [ ] **Step 5: Add `/health/live` and `/health/ready`**

Readiness fails when Redis or Kafka is unavailable. Kafka events use structured versioned JSON and idempotent event IDs.

- [ ] **Step 6: Verify and commit**

Run `npm.cmd test`; commit as `fix: secure and test realtime edge routing`.

## Task 7: Healthy Docker Acceptance Stack

**Files:**
- Modify: `docker-compose.yml`
- Create: `backend/Dockerfile`
- Create: `edge-service/Dockerfile`
- Create: `admin-portal/Dockerfile`
- Create: `backend/src/main/java/com/pqc/core/config/LocalDataSeeder.java`
- Create: `docs/local-testing.md`

- [ ] **Step 1: Add a failing compose health assertion**

Require healthy PostgreSQL, MongoDB, Redis, Kafka, backend, edge, and admin services plus successful readiness HTTP responses.

- [ ] **Step 2: Verify RED**

Current compose lacks application containers and health checks.

- [ ] **Step 3: Add multi-stage app containers and health checks**

Remove obsolete compose `version`; use environment-only secrets, non-root runtime users where supported, persistent volumes, and health-conditioned dependencies.

- [ ] **Step 4: Seed local-only accounts idempotently**

Seed `admin@plumb.local`, `manager@plumb.local`, `customer@plumb.local`, `plumber1@plumb.local`, and `plumber2@plumb.local` with documented local passwords, one store, and simulator coordinates. Guard with `@Profile("local")`.

- [ ] **Step 5: Verify clean rebuild**

Run `docker compose down -v`, `docker compose up -d --build`, `docker compose ps`, and both readiness endpoints. Expected: all healthy and seeded login succeeds.

- [ ] **Step 6: Commit**

Commit as `feat: add healthy local acceptance stack`.

## Task 8: Shared Client Session And API Foundations

**Files:**
- Create: `customer-app/src/config.ts`, `src/api/client.ts`, `src/auth/AuthContext.tsx`
- Create: corresponding plumber files
- Create: `admin-portal/src/lib/config.ts`, `src/lib/api.ts`, `src/auth/AuthProvider.tsx`
- Create: adjacent tests

- [ ] **Step 1: Write failing tests**

Test login persistence, logout, `401` cleanup, role guard, environment URL selection, and Socket.IO handshake `{ auth: { token } }`.

- [ ] **Step 2: Verify RED**

Existing clients use hardcoded endpoints, fixed IDs, and unauthenticated sockets.

- [ ] **Step 3: Implement session/config modules**

Use Expo public variables and Next public variables, validate required URLs, centralize bearer headers and error decoding, persist sessions, and derive identity from login responses.

- [ ] **Step 4: Replace all direct fetch/io calls**

- [ ] **Step 5: Verify tests, types, lint, and builds; commit**

Commit as `feat: add authenticated client foundations`.

## Task 9: Customer And Plumber Workflow UIs

**Files:**
- Refactor: `customer-app/App.tsx`, `plumber-app/App.tsx`
- Create: `customer-app/src/features/orders/*`
- Create: `plumber-app/src/features/jobs/*`
- Create: feature component tests

- [ ] **Step 1: Write failing customer tests**

Cover login, create order, searching, assignment, cancellation, invoice, simulated payment, history, reconnect, validation, and retry. Every command button must call an API and disable while pending.

- [ ] **Step 2: Write failing plumber tests**

Cover login, online state, location permission, offer, accept conflict, decline, start, complete, service log, and earnings. Acceptance must persist before local navigation state changes.

- [ ] **Step 3: Verify RED**

- [ ] **Step 4: Implement explicit workflow reducers**

Use backend order state as source of truth. Remove WIP alerts, fixed coordinates, local-only cancellation, and local-only acceptance. Add accessible loading, empty, offline, forbidden, conflict, and retry states.

- [ ] **Step 5: Implement deterministic local map/payment simulators**

Show route, movement, distance, and ETA. Payment choices exercise success, decline, duplicate idempotency, refund, and delayed completion.

- [ ] **Step 6: Verify tests, TypeScript, and Expo web exports; commit**

Commit as `feat: complete customer and plumber local workflow`.

## Task 10: Real Admin Operations

**Files:**
- Refactor: `admin-portal/src/app/page.tsx`
- Refactor: `admin-portal/src/app/analytics/page.tsx`
- Create: `admin-portal/src/app/login/page.tsx`
- Create: `admin-portal/src/app/operations/page.tsx`
- Create: `admin-portal/src/components/*` and tests

- [ ] **Step 1: Write failing portal tests**

Test protected routes, role guard, real metrics, live jobs, user/store operations, dependency health, dead-letter display, retries, pagination, and accessible errors.

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Replace all hardcoded data and inert controls**

Use real APIs, connect supported actions, remove unsupported buttons, and run admin on port `3100` to avoid edge port `3000`.

- [ ] **Step 4: Verify component tests, lint, build; commit**

Commit as `feat: connect admin portal to live operations`.

## Task 11: Cross-Role Playwright Acceptance

**Files:**
- Create: `e2e/playwright.config.ts`
- Create: `e2e/tests/customer-plumber-flow.spec.ts`
- Create: `e2e/tests/admin-operations.spec.ts`
- Create: `e2e/tests/authorization.spec.ts`
- Replace obsolete root and edge E2E scripts

- [ ] **Step 1: Write failing vertical E2E**

Automate: customer login and order creation; plumber login, online location, offer and acceptance; customer assignment update; plumber completion and parts log; customer simulated payment; admin paid-order/revenue verification.

- [ ] **Step 2: Verify RED against healthy Docker stack**

- [ ] **Step 3: Add security/conflict E2E**

Verify cross-customer access is forbidden, customer GPS is rejected, second acceptance conflicts, declined payment remains unpaid, and revoked sockets cannot reconnect.

- [ ] **Step 4: Add desktop/mobile visual gates**

Fail on uncaught console errors, unexpected failed requests, horizontal overflow, overlap, clipping, or inaccessible primary controls. Save screenshots for major states.

- [ ] **Step 5: Run twice from clean volumes**

Run `docker compose down -v`, rebuild, and execute Playwright twice. Both clean runs must pass.

- [ ] **Step 6: Commit**

Commit as `test: verify complete cross-role browser workflow`.

## Task 12: Dependency And Local Release Gate

**Files:**
- Modify: package manifests/lockfiles and `backend/pom.xml`
- Modify: `README.md`, `docs/local-testing.md`
- Create: `docs/manual-acceptance-checklist.md`
- Update: `docs/final_enterprise_audit_2026-06-18.md`

- [ ] **Step 1: Run production dependency audits**

Run `npm audit --omit=dev` in all four Node workspaces and a Maven dependency/security scan. Record critical/high findings before upgrades.

- [ ] **Step 2: Upgrade patched compatible versions**

Upgrade direct dependencies first, including Next.js, Axios, Socket.IO/ws chains, and Expo patch releases. Run tests after each dependency group; do not force unrelated major migrations.

- [ ] **Step 3: Run full automated verification**

Run `.\scripts\verify-local.ps1`. Expected: zero failed commands, healthy services, passing E2E, and no unaccepted critical/high production advisories.

- [ ] **Step 4: Perform manual acceptance**

Use every seeded role at desktop and mobile widths. Record failures, add a failing regression test, fix, and rerun the full gate before checking an item.

- [ ] **Step 5: Correct readiness documentation**

Remove unsupported production/100% claims. Document exact commands, test counts, local simulator limitations, credentials, and residual cloud-production work.

- [ ] **Step 6: Commit**

Commit as `chore: pass secure local acceptance gate`.

## Subsequent Plans

After this plan passes, write separate plans for store-selection/direct-plumber booking, full inventory/refund/dispute workflows, and cloud production operations. Each starts from the passing `scripts/verify-local.ps1` gate.
