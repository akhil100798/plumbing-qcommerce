# PlumbCommerce Production Readiness Audit

**Audit date:** 2 July 2026  
**Scope:** Spring Boot backend, Node.js edge/WebSocket service, Next.js admin portal, Expo customer app, Expo plumber app, Expo store app, infrastructure, security, testing, deployment, and operational readiness.

## Executive Summary

**Overall verdict: NOT READY FOR PRODUCTION.**

The repository demonstrates a broad quick-commerce domain model, meaningful backend authorization tests, an outbox pattern, Redis geo features, Kafka event handling, role-based administration, and working production bundles for most clients. It is nevertheless below enterprise production standard because critical authentication weaknesses, exposed credentials, incomplete production event infrastructure, failing backend tests, broken mobile type safety, non-reproducible dependencies, almost nonexistent UI/edge test coverage, and absent CI/CD controls remain.

**Estimated readiness score: 42/100.**

| Area | Score | Assessment |
|---|---:|---|
| Backend correctness | 6/10 | Broad implementation; two integration failures and slow/hanging suite |
| Security | 3/10 | Good RBAC direction, but critical OTP/secret/rate-limit issues |
| Real-time architecture | 4/10 | WebSockets/Kafka exist, but production disables Kafka and scale-out is incomplete |
| Admin portal | 6/10 | Builds and typechecks; only two shallow tests |
| Customer app | 6/10 | Builds and typechecks; only two shallow tests; simulated payment paths remain |
| Plumber app | 3/10 | Runtime import failure, nine TypeScript errors, lockfile conflict |
| Store app | 2/10 | No tests, seven TypeScript errors, no usable lockfile |
| DevOps/operations | 2/10 | Compose parses; no CI workflow, weak production topology and observability |
| Data/reliability | 5/10 | Flyway and outbox present; HA, retries, idempotency and DR evidence incomplete |

## Validation Performed

### Backend

- Ran `mvn test` with Java 17.
- The suite exceeded the 120-second execution limit and left test JVMs running.
- Partial Surefire result: **41 tests executed, 39 passed, 2 failed** before timeout.
- Both failures are in `CatalogAndInventoryIntegrationTest`:
  - Store manager inventory update expected HTTP 200 but received 400.
  - Customer inventory update expected HTTP 403 but received 400, indicating validation occurs before the expected authorization boundary or the test/request contract is inconsistent.
- Several tests repeatedly attempt unavailable Redis/Kafka connections, producing long delays and Netty shutdown errors. Test infrastructure is not isolated or deterministic.

### Edge Service

- `npm test`: **1/1 passed**.
- `npm run build`: passed syntax validation.
- Test emitted an unhandled Redis connection error after completion.
- One endpoint-level test is insufficient for authentication, authorization, room isolation, geospatial matching, Kafka event routing, reconnection, backpressure, and failure recovery.

### Admin Portal

- `npm test`: **2/2 passed**.
- `npm run typecheck`: passed.
- `npm run build`: passed and generated 42 routes.
- Build emitted a standalone trace-copy warning for a missing Next.js manifest. The build exit code is zero, but the produced standalone image should be smoke-tested.
- Tests only verify a loading shell and redirect; no RBAC, API error, form, mutation, accessibility, or browser E2E coverage was executed.

### Customer App

- `npm test`: **2/2 passed**.
- `npm run typecheck`: passed.
- Expo web export: passed; JavaScript bundle approximately **1.5 MB**.
- Test warnings show deprecated `react-test-renderer` usage and an environment not configured for React `act(...)`.
- Tests are shallow and do not validate checkout, payment, OTP, secure session restoration, socket events, offline behavior, maps, or native-device behavior.

### Plumber App

- Clean `npm ci`: failed because `package.json` and `package-lock.json` are out of sync.
- Normal install also failed due to a React 19.2.0 versus `react-test-renderer` 19.2.7 peer conflict.
- Testing required `--legacy-peer-deps`, proving the dependency graph is not release-reproducible.
- `npm test`: failed before test collection because `borderRadius` is undefined at module import.
- `npm run typecheck`: failed with **nine errors**, including invalid navigator screen types, invalid initial params, missing `Platform`, missing `ScrollView`, and undefined `borderRadius`.
- Expo web export passed, but bundling success does not make the app safe: the import-time defect can crash the affected flow.

### Store App

- No lockfile was available for a reproducible clean install or dependency audit.
- No test files exist; `npm test` fails with “No test files found.”
- `npm run typecheck`: failed with **seven errors**, including required navigator IDs, missing `ScrollView`, and invalid React Native style typing.
- Expo web export passed with a missing favicon warning; bundle approximately **1.4 MB**.

### Dependencies and Infrastructure

- Production `npm audit` reported zero known vulnerabilities for edge, admin, customer, and plumber dependency trees.
- Store audit could not run because no lockfile exists.
- `docker compose config --quiet`: passed.
- No GitHub Actions workflow exists under `.github/workflows`; builds, tests, security checks, and releases are not enforced automatically.
- Native Android/iOS builds, signed artifacts, physical-device tests, browser E2E, load tests, chaos tests, penetration tests, and full Docker integration tests were not available/executed in this audit.

## Critical Findings — P0

### 1. OTP Authentication Is Unsafe

`OtpController` uses `java.util.Random`, contains two static phone/OTP bypasses (`123456`), logs the OTP in plaintext, and prints it to stdout. There is no visible per-phone/per-IP attempt limit, resend cooldown, lockout, abuse detection, or SMS provider integration.

**Impact:** account takeover, OTP brute force, credential leakage through logs, automated user creation, and direct bypass using known test numbers.

**Required remediation:** remove static bypasses from production code; use `SecureRandom`; integrate a real provider; hash OTPs at rest; enforce send and verify rate limits; cap attempts; add cooldown and fraud telemetry; redact phone/OTP logs; test replay and race conditions.

### 2. A Production Redis Credential Is Committed

`backend/src/main/resources/application-prod.properties` contains a non-placeholder Redis host and password fallback.

**Impact:** secret exposure and possible unauthorized cache/session/location access. Git history must be treated as compromised even after file cleanup.

**Required remediation:** rotate the credential immediately; remove all secret defaults; require environment/secret-manager injection; scan Git history and build artifacts; enable automated secret scanning.

### 3. Production Disables Core “Real-Time” Infrastructure

The production profile excludes Kafka auto-configuration and sets scheduling disabled by default. This conflicts directly with the advertised Kafka/outbox real-time architecture.

**Impact:** outbox events are not published, edge consumers receive no order/material events, and business workflows may silently stop at database state changes.

**Required remediation:** either deploy managed Kafka and the outbox poller with health/SLO monitoring, or redesign around a supported managed queue. Production architecture documentation must match actual deployment.

### 4. Edge WebSocket Authorization Allows Identity/Room Spoofing

Socket authentication validates a JWT, but room registration accepts client-supplied `plumberId`, `customerId`, or `partnerId` and joins that room without visibly proving it matches `socket.user`. Location updates similarly trust client payload identity. Socket CORS is `origin: '*'`, and Express CORS is unrestricted.

**Impact:** an authenticated user may subscribe to another user’s private events or publish another worker’s location.

**Required remediation:** derive identity and role only from verified token claims/database context; reject mismatched room registrations; authorize every event; validate coordinates and payload schemas; restrict origins; add socket event rate limits and audit trails.

### 5. Mobile Release Gates Are Failing

Plumber and store applications fail TypeScript checks; plumber tests crash during import; store has no tests or lockfile.

**Impact:** runtime crashes and navigation defects can ship despite Expo export succeeding.

**Required remediation:** make clean install, lint, typecheck, unit tests, native build, and smoke E2E mandatory release gates for every app.

## High Findings — P1

### Authentication and Session Management

- JWT access tokens last 24 hours, which is excessive for privileged admin and operational roles.
- HS256 uses one shared secret across backend and edge, increasing blast radius.
- No visible issuer, audience, key ID, asymmetric key rotation, device/session binding, or global access-token revocation enforcement.
- Refresh-token storage exists, but production controls should verify hashing at rest, rotation, reuse detection, expiry cleanup, logout-all, and incident revocation.
- Admin tokens are kept in `sessionStorage`; an XSS can steal privileged credentials. A hardened BFF or secure HttpOnly cookie architecture is preferable.
- Public API docs are enabled by default and should be disabled or protected in production.
- Public delivery status endpoints may expose order lifecycle data without ownership checks.

### Edge Reliability and Scale

- Express and Socket.IO CORS policies are unrestricted.
- Only discovery requests are visibly rate-limited; socket connections/events and auth proxy paths need distributed controls.
- Socket.IO uses in-process rooms without a Redis adapter, so horizontal replicas will not share room membership/events.
- Kafka consumer group behavior provides each event to one edge instance; without a cross-instance adapter, clients connected to other instances can miss events.
- Kafka connection errors are logged and swallowed; readiness may still report healthy while real-time delivery is unavailable.
- No dead-letter topics, schema registry/versioning, idempotent consumer store, poison-message policy, or replay tooling is evident.
- Console logging includes identifiers, event payloads, OTPs, and coordinates; structured redacted logging is required.

### Backend Correctness and Data Integrity

- The backend test suite does not complete within a reasonable CI window and is coupled to unavailable infrastructure.
- Inventory authorization tests currently fail.
- Payment uses a `MockPaymentGatewayAdapter`; customer UI also contains simulated payment/order behavior.
- Demo seeders create predictable users/passwords and localhost image URLs. They must be profile-guarded and impossible to activate in production.
- Financial and inventory workflows require explicit idempotency keys, double-spend/oversell tests, pessimistic/optimistic locking validation, reconciliation jobs, and immutable ledger guarantees.
- Flyway is a strength, but there is no demonstrated zero-downtime migration strategy, rollback/runbook, backup restore test, or point-in-time recovery test.

### Testing Gaps

- Backend has useful authorization coverage, but no measured coverage threshold.
- Edge has one test; admin/customer have two each; plumber has one broken suite; store has none.
- No contract tests ensure mobile/admin payloads match backend DTOs.
- No full environment E2E validates OTP → order → inventory reservation → payment → store acceptance → delivery/plumber assignment → completion/refund.
- No WebSocket multi-user isolation, reconnect, duplicate event, ordering, or missed-event recovery tests.
- No accessibility, visual regression, performance budget, low-network, offline, background/foreground, push notification, or device-permission tests.
- Existing root QA scripts are not wired into CI and therefore do not constitute a reliable release gate.

### Deployment and Operations

- No CI/CD workflow, branch protection evidence, artifact signing, SBOM, SAST, dependency policy, container scan, IaC scan, or secret scan.
- Compose uses single-instance PostgreSQL, Redis, MongoDB, Kafka, and Zookeeper with public host ports, default local credentials, no TLS, no resource limits, and minimal health dependency semantics.
- Kafka uses one broker and replication factor 1; this is development-only.
- Render configuration deploys only the backend, not the complete real-time platform.
- Health endpoints do not prove end-to-end ability to publish/consume events or serve WebSockets.
- Tracing is disabled in production and no metrics backend, alerting, centralized logs, dashboards, SLOs, on-call policy, or incident runbooks are defined.

## Medium Findings — P2

- README contains broken character encoding and a local `file:///` hero image.
- README claims “stable / production ready” and “100% success” despite reproducible failures; this is operationally misleading.
- Localhost API/image defaults can leak into released web/mobile bundles if environment variables are omitted.
- Customer code uses inconsistent edge environment names (`EXPO_PUBLIC_EDGE_URL` and `EXPO_PUBLIC_EDGE_SERVER_URL`).
- Admin standalone build emits a missing manifest copy warning and needs container-level smoke validation.
- Large web bundles need route-level analysis and performance budgets, especially on low-end mobile devices.
- Store export warns that `assets/favicon.png` is missing.
- Deprecated test packages and `act(...)` warnings reduce confidence in customer tests.
- Deprecated transitive packages (`inflight`, old `rimraf`, old `glob`) appear during mobile installation.
- No privacy/data-retention policy is evident for exact live location, phone numbers, KYC, support messages, audit logs, and financial records.
- No explicit GDPR/DPDP consent, deletion, export, retention, data residency, or KYC access controls are documented.

## Positive Engineering Evidence

- Backend uses Flyway migrations with production schema validation.
- Security is stateless and broadly uses method-level RBAC and ownership checks.
- Passwords use BCrypt.
- Refresh tokens, audit events, inventory reservations, settlements, refunds, and outbox entities exist.
- SecureStore is used for native app tokens.
- Admin and customer code typecheck and build successfully.
- Dockerfiles and Compose definitions exist and Compose syntax validates.
- Production dependency audits found no known vulnerabilities in four auditable npm projects.
- Backend has a meaningful base of integration and RBAC tests, even though the suite needs stabilization.

## Required Production Architecture

1. **Ingress:** TLS-only managed load balancer/WAF, strict CORS, request IDs, DDoS/bot controls, per-identity distributed rate limits.
2. **Identity:** dedicated identity boundary, asymmetric short-lived JWTs, MFA for admins, refresh rotation/reuse detection, device/session management, centralized revocation.
3. **Backend:** stateless replicas, transactional service boundaries, idempotency keys, strict ownership checks, bounded retries/timeouts/circuit breakers.
4. **Events:** managed multi-AZ Kafka/queue, schema contracts, transactional outbox publisher, idempotent consumers, DLQs, replay tooling, lag alerts.
5. **Realtime:** multiple edge replicas with authenticated rooms and a Redis Socket.IO adapter; presence/last-seen state; event sequence IDs and client catch-up APIs.
6. **Data:** managed HA PostgreSQL with PITR, encrypted managed Redis, encrypted object storage for KYC/assets, retention policies, restore drills.
7. **Payments:** certified gateway integration, webhook signature verification, idempotent capture/refund, ledger reconciliation, PCI scope minimization.
8. **Observability:** OpenTelemetry traces, RED/USE metrics, structured redacted logs, business KPIs, SLOs, paging, synthetic journeys.
9. **Delivery:** immutable signed artifacts, environment promotion, canary/blue-green deployment, migration gates, automated rollback.

## Remediation Roadmap

### Phase 0 — Stop-Ship Fixes (1–2 weeks)

- Rotate and remove committed Redis credentials.
- Remove static/logged OTPs and add OTP abuse controls.
- Enforce token identity on every socket room/event and restrict CORS.
- Fix all backend test failures and terminate leaked test resources.
- Fix plumber/store type errors, plumber runtime crash, and all lockfiles.
- Add minimal CI gates for clean install, test, typecheck, build, secret scan, and dependency audit.
- Ensure seeders, mocks, Swagger, and simulated payments cannot run in production.

### Phase 1 — Release Candidate Foundation (2–5 weeks)

- Deploy actual Kafka/queue and outbox processing in production.
- Add Socket.IO Redis adapter and multi-instance tests.
- Implement real SMS and payment providers with sandbox-to-production controls.
- Add contract tests and one complete cross-application E2E golden path.
- Add admin MFA, shorter access tokens, refresh reuse detection, and privileged audit logs.
- Add structured logs, metrics, traces, dashboards, and actionable readiness checks.
- Add managed database/cache, TLS, backups, PITR, and restore validation.

### Phase 2 — Enterprise Hardening (4–8 weeks)

- Add load/soak/failover/chaos testing and capacity models.
- Add SAST, DAST, container/IaC scanning, SBOM and artifact signing.
- Add privacy controls, retention schedules, KYC encryption/access audits, DPDP compliance review.
- Add app-store signing/release pipelines, device matrix tests, accessibility and performance gates.
- Define SLOs, error budgets, on-call rotations, incident/DR runbooks, RTO/RPO, and quarterly recovery drills.

## Recommended Release Gates

No production deployment should proceed until all of the following are true:

- Zero P0 findings open.
- All projects install from committed lockfiles with no compatibility flags.
- Backend, edge, admin, customer, plumber, and store tests/typechecks/builds pass in CI.
- Full Docker/staging E2E passes repeatedly with real Redis/Kafka/PostgreSQL and provider sandboxes.
- Socket identity isolation and duplicate/reconnect tests pass.
- Payment and inventory idempotency/concurrency tests pass.
- Security scans, secret scans, and penetration test have no unresolved critical/high findings.
- Load test demonstrates agreed p95/p99 latency and throughput with failover.
- Backup restoration and rollback are demonstrated.
- Monitoring, SLO alerts, runbooks, and on-call ownership are active.

## Final Assessment

PlumbCommerce is a capable prototype/pre-production codebase with a surprisingly broad business surface, but the current “enterprise-grade” and “production-ready” claims are not supported by executable evidence. The most urgent issues are authentication safety, exposed secrets, WebSocket tenant isolation, disabled production event processing, failing mobile quality gates, and absence of automated delivery controls. After the P0/P1 roadmap and staging evidence are complete, the platform can be reassessed for a controlled pilot; it should not yet handle real customer identities, money, KYC records, or live location at production scale.
