# PlumbCommerce Enterprise Architecture, Code, UI, and Test Audit

**Audit date:** 2026-06-18  
**Scope:** Spring Boot backend, Node.js edge service, Next.js admin portal, Expo customer app, Expo plumber app, infrastructure, security, and test assets.

## Executive Verdict

PlumbCommerce is a promising proof of concept with a sensible domain split: transactional business data in Spring/PostgreSQL, live geo-routing in Node/Redis, asynchronous events through Kafka, service logs in MongoDB, and separate role-oriented clients.

It is **not production ready or enterprise ready** in its current implementation. The architecture concept is stronger than the delivered product. Critical authorization defects, incomplete client workflows, unreliable outbox publication, missing automated coverage, vulnerable dependencies, and non-reproducible E2E tests prevent a production release.

### Ratings

| Area | Score | Verdict |
|---|---:|---|
| Architecture concept | 7/10 | Good prototype direction |
| Architecture implementation | 4/10 | Important patterns are incomplete |
| Backend code | 5/10 | Core CRUD/state flow exists; security and contracts are weak |
| Edge/realtime service | 4/10 | Geo lookup works conceptually; identity and resilience are incomplete |
| Admin portal | 4/10 | Builds cleanly; mostly static/mock and lacks authentication flow |
| Customer app | 3/10 | One partial workflow; core flows and authentication are missing |
| Plumber app | 3/10 | GPS prototype only; accepting a job does not update the backend |
| Automated testing | 2/10 | One context-load test; E2E suite is stale and non-reproducible |
| DevOps/operability | 3/10 | Local compose only; no CI/CD, health checks, migrations, or deployment model |
| Security readiness | 2/10 | Multiple release-blocking authorization and data exposure defects |
| Overall enterprise readiness | **3.5/10** | Prototype / early alpha |

**Estimated functional completion:** 40-45% of a deployable MVP, and roughly 25-30% of an enterprise production system.

## What Is Implemented

- Spring Boot domain entities and repositories for users, stores, service orders, and outbox events.
- Basic order state flow: `PENDING -> ACCEPTED -> IN_PROGRESS -> COMPLETED -> PAID`.
- Basic billing calculation and a mocked payment result.
- JWT creation, parsing, and Redis-backed logout blacklist.
- Redis geospatial plumber location storage and nearby search.
- Kafka-to-WebSocket bridge for an accepted-order notification.
- MongoDB service-log model and endpoints.
- Next.js dashboard and analytics screens.
- Expo customer and plumber prototype screens.
- Docker Compose definitions for PostgreSQL, Redis, MongoDB, Kafka, and ZooKeeper.
- OpenAPI dependency and basic global exception handling.

## Release-Blocking Findings

### 1. Public user APIs expose identities and password hashes

`SecurityConfig` ignores and permits every `/api/v1/users/**` request. `UserController` publicly exposes list and lookup endpoints, and returns the JPA `User` entity containing the `password` field.

Impact:

- Anonymous callers can enumerate users.
- Password hashes, phone numbers, roles, and emails can be exposed.
- Attackers gain high-value information for offline attacks and account targeting.

Required action:

- Permit only a dedicated registration endpoint.
- Return DTOs that never serialize password fields.
- Restrict user lookup/listing to authorized administrators and self-service operations.

### 2. Privilege escalation through public registration

Registration accepts the entity directly, including caller-supplied `role`. An anonymous caller can request `ADMIN`, `STORE_MANAGER`, or `PLUMBER`.

Required action:

- Public registration must force `CUSTOMER`.
- Plumber, manager, and admin provisioning must use separate approval/admin flows.
- Add verification, account status, and audit history.

### 3. Missing role and ownership authorization

Most controllers require only a valid JWT. There are no method-level checks on order creation, acceptance, start, completion, cancellation, store creation, payments, or service logs. IDs are accepted from request bodies and query parameters without confirming they belong to the authenticated principal.

Examples:

- Any authenticated user can accept an order for any plumber ID.
- Any authenticated user can start, complete, cancel, or pay another user's order.
- Any authenticated user can read another customer's orders and service logs.
- Any authenticated user can create a store for an arbitrary manager.

`AdminController` uses `@PreAuthorize`, but no `@EnableMethodSecurity` declaration exists, so that annotation is not reliably enabled.

Required action:

- Enable method security.
- Derive the acting user from the authenticated principal, not caller-supplied IDs.
- Enforce role, resource ownership, order assignment, and legal state transitions.
- Add authorization integration tests for every endpoint.

### 4. Shipped clients cannot authenticate with the edge service

The edge service applies Socket.IO authentication globally and protects the nearby REST route with JWT middleware. The admin, customer, and plumber clients connect without a token. The customer REST request also sends no `Authorization` header.

Result:

- Socket connections are rejected.
- Nearby-plumber requests return `401`.
- The main advertised real-time workflow cannot work from the shipped UI.

### 5. Socket identity is trusted from client messages

After authentication, clients can emit arbitrary `plumberId` or `customerId` values when joining rooms or sending location pings. The server does not bind those IDs to JWT identity or role.

Impact:

- A user can impersonate another plumber/customer room.
- A user can overwrite another plumber's location.
- Notifications may be observed or redirected by unauthorized users.

### 6. Transactional outbox can lose events

The outbox poller calls Kafka asynchronously, then immediately marks the event processed. A later Kafka callback failure does not restore the event.

Additional gaps:

- No row locking or claim mechanism for multiple application instances.
- No retry count, backoff, dead-letter status, or failure reason.
- No idempotency key or consumer deduplication.
- String-delimited payloads are brittle and unversioned.

Required action:

- Mark processed only after acknowledged publication.
- Use row claiming/locking or CDC such as Debezium.
- Store structured, versioned JSON payloads.
- Add retry/dead-letter policy and idempotent consumers.

### 7. Payment is always successful and not a payment integration

The payment service sets `externalSuccess = true` and generates a mock token. It does not validate the requested amount against the order total, implement idempotency, authenticate webhooks, reconcile transactions, refund, or pay out plumbers.

This must not be presented as production payment functionality.

## Architecture Assessment

### Strengths

- Clear separation between durable business logic and low-latency edge concerns.
- Appropriate use of Redis GEO for proximity search.
- A transactional outbox table is the correct direction.
- Role-oriented client separation is reasonable.
- PostgreSQL for transactional records and MongoDB for flexible service logs can be justified.

### Enterprise Architecture Faults

- This is currently a distributed monolith/prototype, not a mature microservice platform.
- There is no API gateway policy layer, service discovery, workload identity, or internal service authorization.
- Kafka and Redis are single-instance local dependencies with no HA, partitioning, TLS, ACLs, or recovery design.
- No saga or compensation model exists for assignment, inventory, payment, cancellation, and payout.
- No clear source-of-truth policy exists between PostgreSQL, Redis, Kafka, MongoDB, and clients.
- No schema registry, event versioning, DLQ, replay policy, or idempotency contract exists.
- OpenTelemetry dependencies are present, but end-to-end trace propagation through Node, Kafka headers, and clients is not implemented.
- No SLOs, alerting, dashboards, runbooks, backup/restore tests, RPO/RTO, or capacity model exist.
- `ddl-auto: update` is unsuitable for controlled enterprise database releases; Flyway or Liquibase is required.
- Infrastructure credentials and fallback JWT secrets are committed/defaulted in configuration.
- CORS allows every origin, and Swagger is public.
- Debug/TRACE logging is excessive and may expose sensitive operational data.

## Backend Code Assessment

### Positive

- Services use transactions for multi-record order/outbox writes.
- State-transition checks exist for key order steps.
- BCrypt is used for passwords.
- Basic duplicate-key and validation-style error responses exist.

### Faults

- Controllers accept untyped `Map<String, Object>` payloads instead of validated DTOs.
- There is almost no Bean Validation on request contracts.
- JPA entities are returned directly, exposing persistence shape and sensitive fields.
- Generic `RuntimeException` is converted to `404`, including cases that are not "not found."
- Login throws a `404` for an unknown email but `401` for a wrong password, enabling account enumeration.
- Order cancellation is not transactional and emits no outbox event.
- Billing uses local server time and hardcoded rates; no pricing/version/tax/currency model exists.
- No optimistic locking protects order state from concurrent acceptance or transition races.
- No audit trail records who changed order state.
- Lazy JPA associations are returned directly, risking serialization issues and accidental data exposure.
- Service-log payload casting is unchecked and can produce runtime errors.
- Logout blacklist duration is fixed at 24 hours instead of remaining token lifetime.
- Revocation fails open when Redis errors, which may be unacceptable for privileged operations.

## Edge Service Assessment

### Positive

- Redis-backed rate limiting and GEO lookup are suitable prototype choices.
- Kafka-to-Socket.IO bridging is easy to understand.

### Faults

- No health/readiness endpoints.
- No graceful shutdown for HTTP, Kafka, Redis, or Socket.IO.
- Kafka connection failure is logged but not surfaced through readiness.
- Existing logs show repeated Kafka consumer timeouts and restarts.
- No Redis/Kafka retry policy, circuit breaker, timeout policy, or degraded-mode behavior.
- No validation for coordinates, IDs, or request shape.
- Rate limiting only protects one route and is IP-based without trusted-proxy configuration.
- Job IDs use `Date.now()` and are not durable domain IDs.
- The nearby route broadcasts offers but does not create/reserve a backend order.
- No atomic "first plumber wins" acceptance mechanism exists.
- Client room registration and location updates lack role/identity enforcement.
- CORS is unrestricted.

## UI and UX Completion

### Admin portal: approximately 35% complete

Implemented:

- Store-manager dashboard shell.
- Analytics screen.
- Responsive layout builds successfully.

Pending/faulty:

- No login screen, route guard, token refresh, logout, or role routing.
- Dashboard Socket.IO connection sends no JWT.
- Store-manager dashboard listens for `JOB_OFFER`, but the edge service sends offers to plumber-specific rooms; the dashboard never registers as a plumber.
- Dispatch, view details, restock, export, and navigation controls have no behavior.
- Inventory, revenue, city chart, and alerts are hardcoded/mock.
- URLs are hardcoded to localhost.
- Admin development server defaults to port 3000, which conflicts with the edge service port.
- No loading error, empty, retry, pagination, filtering, accessibility, or audit workflow depth expected in an enterprise console.

### Customer app: approximately 25% complete

Implemented:

- Basic service selection shell.
- Nearby request attempt and assigned-plumber display.

Pending/faulty:

- No registration/login/token storage.
- No JWT on Socket.IO or REST calls.
- Uses fixed customer ID and San Francisco coordinates.
- No actual order creation in the Spring backend.
- Store-selection and direct-plumber flows explicitly show WIP alerts.
- Map, ETA, tracking, cancellation, payments, history, ratings, profile, notifications, and support are missing/mock.
- Cancel only clears local UI; it does not cancel the server order.
- No environment configuration for emulator/device/staging/production endpoints.

### Plumber app: approximately 25% complete

Implemented:

- Online toggle.
- Foreground location permission and periodic GPS ping.
- Job-offer card.

Pending/faulty:

- No login/token storage or authenticated socket.
- Uses a fixed plumber ID.
- "Accept & Navigate" only shows an alert and clears local state; it does not call order acceptance.
- Decline is not sent to the server.
- No background location service despite comments suggesting continuous/background tracking.
- No offline queue, reconnect recovery, navigation, job lifecycle actions, work logs, parts entry, invoice, earnings, payout, history, or profile verification.
- Reject button text is white on a light gray background, creating poor contrast.

## Test Execution Results

### Commands that passed

| Command | Result |
|---|---|
| `backend\mvnw.cmd test` | PASS: 1 test, only `contextLoads` |
| `admin-portal npm.cmd run lint` | PASS |
| `admin-portal npm.cmd run build` | PASS |
| `customer-app npx.cmd tsc --noEmit` | PASS |
| `plumber-app npx.cmd tsc --noEmit` | PASS |
| `docker compose config` | PASS with obsolete `version` warning |

### Commands that failed or were blocked

| Command | Result |
|---|---|
| `edge-service npm.cmd test` | FAIL: package script intentionally says no test specified |
| `node qa-e2e-test.js` | FAIL: backend unavailable, `ECONNREFUSED` on port 8081 |
| `node qa-phase9-verify.js` | FAIL: root project cannot resolve `axios` |
| `edge-service node e2e-test.js` | FAIL: `socket.io-client` is not installed |
| Docker runtime startup | BLOCKED: Docker Desktop daemon unable to start |

### E2E script quality faults

- Scripts are not connected to package scripts or CI.
- They have no controlled setup/teardown or test data isolation.
- Phase 9 assigns the complete login response object as the bearer token instead of `loginRes.data.token`.
- Phase 9 calls a nonexistent `GET /orders` endpoint and assumes order ID `1`.
- Edge E2E targets backend port `8080`, while the application uses `8081`.
- Edge E2E omits JWT despite edge authentication being mandatory.
- Main E2E sends `lat/lon` instead of `latitude/longitude` in one edge request.
- Main E2E expects authenticated nearby routing to return `200` even when no plumber is seeded.
- Several assertions encode old behavior, such as expecting duplicate registration to return `500`.
- Scripts often log failures without setting a failing exit code.
- No frontend component, browser, mobile, contract, concurrency, load, security, migration, or resilience tests exist.

### Dependency audit snapshot

As of 2026-06-18:

- Edge service: 11 production advisories reported, including 4 high.
- Admin portal: 4 production advisories reported, including 2 high.
- Customer app: 23 production-tree advisories, including 1 critical and 2 high.
- Plumber app: 23 production-tree advisories, including 1 critical and 2 high.

These counts require triage because some mobile findings affect build tooling rather than shipped runtime, but they still fail an enterprise dependency-governance gate.

## Delivery and Operational Gaps

- No CI workflow for build, tests, lint, dependency scan, SAST, container scan, or artifact publishing.
- No production Dockerfiles or Kubernetes/cloud deployment definitions.
- No secrets manager integration.
- No database migration tool or rollback strategy.
- No environment-specific configuration profiles.
- No container health checks or dependency startup readiness.
- No backups, restore validation, disaster recovery, or data retention process.
- No load test despite the sub-200ms and high-throughput claims.
- No privacy controls for customer location, consent, retention, deletion, or audit access.
- No evidence supporting the README claims of 100% E2E success or production readiness.

## Recommended Delivery Plan

### Phase 0: Stop-ship security correction

1. Close public user enumeration and remove password serialization.
2. Prevent role selection during public registration.
3. Enable and test method security.
4. Add role and ownership rules to every endpoint.
5. Bind Socket.IO identity/rooms/location to JWT claims.
6. Remove committed/default secrets and restrict CORS/Swagger.
7. Upgrade vulnerable direct dependencies.

### Phase 1: Make one vertical workflow real

Deliver a complete customer-nearby-plumber flow:

1. Authentication in both mobile apps.
2. Customer creates a durable backend order.
3. Edge discovers and offers the same order ID.
4. One plumber atomically accepts.
5. Customer receives assignment.
6. Plumber starts/completes work and uploads service log.
7. Customer sees final invoice.
8. All operations enforce identity, ownership, idempotency, and audit history.

### Phase 2: Reliability and data correctness

- Fix outbox acknowledgement and multi-instance claiming.
- Add optimistic locking and idempotency.
- Introduce versioned event schemas, retries, DLQ, and replay tooling.
- Add Flyway/Liquibase migrations.
- Add health/readiness checks, timeouts, graceful shutdown, and observability.

### Phase 3: Product completion

- Real payment gateway and webhook reconciliation.
- Store selection and direct plumber booking.
- Maps, routing, ETA, push notifications, offline GPS buffering.
- Admin operations for users, plumbers, stores, disputes, refunds, inventory, and audit trails.

### Phase 4: Enterprise readiness

- CI/CD quality gates and automated environments.
- Contract, integration, E2E, browser/mobile, load, chaos, and security tests.
- HA infrastructure, backups, DR exercises, SLOs, alerts, and runbooks.
- Privacy, retention, compliance, and financial reconciliation controls.

## Final Recommendation

Classify the repository as an **early alpha/proof of concept**, not stable or production ready. The core idea is worth continuing, but development should pause feature expansion until identity, authorization, one complete end-to-end workflow, test reproducibility, and outbox reliability are corrected.

A reasonable next milestone is **secure staging readiness**, not enterprise production. That milestone should require zero critical/high unaccepted security findings, repeatable one-command environment startup, a passing automated vertical E2E flow, role/ownership integration tests, and observable recovery from Redis/Kafka/PostgreSQL interruption.
