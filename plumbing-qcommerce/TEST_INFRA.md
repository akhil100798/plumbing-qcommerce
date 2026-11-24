# FixKart Quick-Commerce Plumbing Platform — Test Infrastructure Specification (TEST_INFRA.md)

**Document Version:** 1.0.0  
**Target System:** FixKart Quick-Commerce Ecosystem ("The Golden Triangle")  
**Owner:** E2E Testing Track (`test_writer_e2e`)  
**Status:** APPROVED FOR EXECUTION  
**Applicability:** Features 1 through 24 (PROJECT.md § Feature Inventory)

---

## 1. Architecture & Design Principles

FixKart is a distributed, high-concurrency quick-commerce plumbing ecosystem consisting of four primary client surfaces and two backend runtimes:
- **Customer App**: React Native (Expo Web/Mobile) for service booking, tracking, and payment.
- **Plumber App**: React Native (Expo Web/Mobile) for job discovery, navigation, on-site diagnostics, material requests, and completion.
- **Store Counter App**: React Native (Expo Web/Mobile) for local hardware store managers to reserve, pack, and hand over plumbing components.
- **Super Admin Portal**: Next.js 15 (Turbopack) for platform governance, financial audits, and operational dispatch.
- **Edge Service**: Node.js Express Gateway handling real-time WebSockets, geospatial plumber tracking with Redis, and Kafka event routing.
- **Backend Core**: Spring Boot 3.3.4 (Java 21, JPA/Hibernate, Flyway, PostgreSQL 16, Kafka, Actuator, Micrometer).

### Opaque-Box Testing Principles
1. **Requirement-Driven & Contract-Centric**: Tests are authored strictly against the behavioral interface contracts, state machines, and mathematical properties defined in `PROJECT.md` and `ORIGINAL_REQUEST.md`.
2. **Implementation Decoupling**: Tests treat underlying code as an opaque box, observing inputs, outputs, HTTP responses, cryptographic signatures, header mutations, state changes, and event streams.
3. **No Facade or Dummy Asserts**: Every test asserts genuine invariants—verifying exact cryptographic checksums (HMAC-SHA256, HMAC-SHA512), strict regular expressions, state transition legality, and numerical boundaries.
4. **Isolated & Self-Contained**: Tests require no unconfigured cloud vendor credentials (AWS/R2, Twilio, Razorpay) to validate correctness; contracts specify deterministic mock/sandbox behavior when credentials are unset.
5. **Deterministic Execution**: Tests execute standalone via Node.js v22 with zero native binary build dependencies, ensuring rapid, reproducible CI/local verification.

---

## 2. Test Design Methodologies

The test suite applies four formal software testing disciplines:

### 2.1 Category-Partition Method (CPM)
Inputs for each of the 24 features are partitioned into discrete equivalence classes:
- **Environment & URL Configuration**: Dev/test environment, staging/preview environment with explicit backend, staging targeting production (disallowed), production default.
- **Identity & Authorization**: Valid roles (`CUSTOMER`, `PLUMBER`, `STORE_MANAGER`, `ADMIN`, `SUPER_ADMIN`), unauthenticated guests, expired tokens, tokens signed with weak or foreign algorithms (HS256 vs HS512), tampered claims.
- **Order State Machine**: Transitions `PENDING` -> `ASSIGNED` -> `ARRIVED` -> `IN_PROGRESS` -> `COMPLETED` -> `CONFIRMED`, along with branching sub-states for `WAITING_FOR_MATERIALS` and `CANCELLED`.
- **Material Lifecycle**: `MATERIAL_REQUEST_CREATED` -> `RESERVED` -> `PREPARED` -> `COLLECTED` -> `COMPLETED`.
- **Payment Providers**: `cod` (Cash On Delivery), `razorpay` (Tokenized online capture), `mock` (Sandbox simulation).

### 2.2 Boundary Value Analysis (BVA)
Tests systematically probe the extremes of all input domains:
- **Touch Target Dimensions**: $43 \times 43\text{ px}$ (violates WCAG), $44 \times 44\text{ px}$ (exact boundary), $48 \times 48\text{ px}$ (comfortable).
- **OTP Gateway**: 0-second resend (blocked), 59-second resend (blocked), 60-second resend (permitted); attempt counter at 4 (valid), 5 (lockout triggered), 6 (rejected).
- **Geospatial Proximity**: $0.0\text{ km}$ (exact match), $4.99\text{ km}$ (in boundary), $5.00\text{ km}$ (perimeter), $5.01\text{ km}$ (excluded).
- **Connection Pools**: Min idle = 3, Max pool = 15, Timeout = 10,000 ms, Leak threshold = 30,000 ms.
- **Payload & File Buffering**: Zero-byte uploads, multi-megabyte payloads bypass JVM heap directly to S3 V4 pre-signed PUT URLs.
- **JWT Key Length**: 63 bytes (rejected as insecure for HS512), 64 bytes (exact 512-bit minimum, valid), 128 bytes (valid).

### 2.3 Pairwise Combinatorial Interaction Testing
Subsystems do not operate in isolation. Tier 3 tests orthogonal interactions across features:
- **Payment & Transactional Outbox**: Tokenized payment capture combined with atomic outbox state transition.
- **Telecom & Geospatial Matching**: Plumber OTP authentication combined with Redis GEOADD/GEORADIUS proximity matching.
- **Pre-signed Cloudflare Storage & Material Workflow**: S3 V4 photo upload verification paired with on-site part replacement verification.
- **Zero-Trust Security & Header Hardening**: Dynamic CORS 403 enforcement combined with HMAC SHA-512 JWT verification and OWASP headers.
- **Observability & Correlation Tracing**: Prometheus Micrometer latency metrics combined with distributed `X-Correlation-ID` header propagation.
- **Outbox Persistence & Kafka/WebSocket Topics**: Atomic database event insertion paired with Socket.IO room broadcast.

### 2.4 Real-World Application Scenarios (The Golden Triangle)
Tier 4 models complete, multi-actor business lifecycles spanning Customer, Plumber, Store Counter, and Admin:
- **Scenario 1**: Standard Happy-Path COD Lifecycle (Order -> Dispatch -> Arrival -> Photo -> Repair -> COD Settlement -> Rating -> Admin Audit).
- **Scenario 2**: Digital Tokenized Razorpay Lifecycle (Order -> Dispatch -> Webhook Verification -> Digital Capture -> Idempotent Replay Prevention).
- **Scenario 3**: Emergency Dispatch with Store Part Request (Leak Emergency -> Proximity Dispatch -> On-Site Part Request -> Counter Handover -> Repair Resumption).
- **Scenario 4**: Material Request Rejection & Substitute Re-Order (Part Defect -> Store Manager Reject -> Alternative Re-Order -> Handover -> Job Finish).
- **Scenario 5**: Premature Cancellation, Penalty Calculation & Rollback (Customer Cancels Post-Dispatch -> Restocking -> Outbox Rollback Event -> Admin Ledger Audit).

---

## 3. Four-Tier Test Suite Architecture

```
scripts/e2e_tests/
├── run_all.js                                # Standalone Unified Test Runner
├── lib/
│   ├── framework.js                          # Lightweight, zero-dependency test runner engine
│   ├── contracts.js                          # Pure contract validators, crypto oracles, state models
│   └── fixtures.js                           # Combinatorial payloads, mock records, schema definitions
├── tier1_feature_coverage/                   # Tier 1: Feature Coverage (>=5 tests per feature * 24 = 120 tests)
│   ├── f01_resolve_api_base_url.test.js
│   ├── f02_customer_app_tests.test.js
│   ├── f03_svg_emoji_replacement.test.js
│   ├── f04_touch_target_wcag.test.js
│   ├── f05_web_builds_exports.test.js
│   ├── f06_payment_adapters.test.js
│   ├── f07_tokenized_checkout_webhooks.test.js
│   ├── f08_twilio_sms_otp.test.js
│   ├── f09_r2_presigned_urls.test.js
│   ├── f10_transactional_outbox.test.js
│   ├── f11_kafka_websocket_alignment.test.js
│   ├── f12_redis_geo_ttl.test.js
│   ├── f13_composite_db_indexes.test.js
│   ├── f14_hikaricp_config.test.js
│   ├── f15_zero_trust_secrets.test.js
│   ├── f16_cors_restriction.test.js
│   ├── f17_jwt_hs512_signing.test.js
│   ├── f18_owasp_security_headers.test.js
│   ├── f19_prometheus_micrometer.test.js
│   ├── f20_correlation_id_tracing.test.js
│   ├── f21_e2e_test_suite_runner.test.js
│   ├── f22_golden_triangle_uat.test.js
│   ├── f23_adversarial_hardening.test.js
│   └── f24_git_release_runbook.test.js
├── tier2_boundary_corner/                    # Tier 2: Boundary & Corner Cases (>=5 tests per feature * 24 = 120 tests)
│   ├── f01_resolve_api_base_url_boundary.test.js
│   ├── f02_customer_app_boundary.test.js
│   ├── f03_svg_emoji_boundary.test.js
│   ├── f04_touch_target_boundary.test.js
│   ├── f05_web_builds_boundary.test.js
│   ├── f06_payment_adapters_boundary.test.js
│   ├── f07_checkout_webhooks_boundary.test.js
│   ├── f08_twilio_sms_boundary.test.js
│   ├── f09_r2_presigned_boundary.test.js
│   ├── f10_outbox_boundary.test.js
│   ├── f11_kafka_websocket_boundary.test.js
│   ├── f12_redis_geo_boundary.test.js
│   ├── f13_db_indexes_boundary.test.js
│   ├── f14_hikaricp_boundary.test.js
│   ├── f15_zero_trust_boundary.test.js
│   ├── f16_cors_boundary.test.js
│   ├── f17_jwt_hs512_boundary.test.js
│   ├── f18_owasp_headers_boundary.test.js
│   ├── f19_prometheus_boundary.test.js
│   ├── f20_correlation_tracing_boundary.test.js
│   ├── f21_test_suite_boundary.test.js
│   ├── f22_golden_triangle_boundary.test.js
│   ├── f23_adversarial_boundary.test.js
│   └── f24_git_release_boundary.test.js
├── tier3_cross_feature/                      # Tier 3: Pairwise Combinatorial Cross-Feature Interactions
│   ├── tf_checkout_outbox_interaction.test.js
│   ├── tf_twilio_geo_match_interaction.test.js
│   ├── tf_r2_photo_material_interaction.test.js
│   ├── tf_cors_jwt_security_interaction.test.js
│   ├── tf_correlation_metrics_interaction.test.js
│   └── tf_outbox_kafka_socket_interaction.test.js
└── tier4_real_world_scenarios/               # Tier 4: Real-World "Golden Triangle" Workflows
    ├── scenario1_standard_cod_workflow.test.js
    ├── scenario2_razorpay_online_workflow.test.js
    ├── scenario3_emergency_dispatch_material_workflow.test.js
    ├── scenario4_material_rejection_reorder_workflow.test.js
    └── scenario5_cancellation_refund_audit_workflow.test.js
```

---

## 4. 24 Feature Coverage Matrix

| # | Feature Inventory Item | Tier 1 (Happy Path) | Tier 2 (Boundaries & Corners) | Tier 3 (Cross-Feature Pair) | Tier 4 (Scenario Lifecycle) | Verification Oracle |
|---|------------------------|---------------------|-------------------------------|-----------------------------|-----------------------------|---------------------|
| 1 | `resolveApiBaseUrl` Export & Guards | Localhost dev fallback, explicit staging URL, prod default | Null env, undefined keys, staging pointing to prod throws critical error, empty strings | Frontend requests propagate to backend | Initial client handshake in all scenarios | Mathematical URL parsing, strict error regex |
| 2 | Customer App 100% Test Pass | 9 test suites pass, 49 tests verified | Empty test mocks, missing tokens, unhandled rejected promises | App state syncing with Edge Gateway | Customer booking flow | Vitest / Jest execution report oracle |
| 3 | Replace 52 Raw Unicode Emojis | Vector SVG components rendered in navigation, badges, status | Unrendered glyph fallback, missing SVG attributes, dark/light theme tinting | Component render in on-site photo upload | Plumber & Store mobile apps in Scenario 1-5 | Direct AST/DOM element inspection |
| 4 | WCAG 2.1 AA Touch Target Sizing | $\ge 44 \times 44\text{ px}$ bounding box, hitSlop configuration | Exactly $44\text{ px}$, $43.9\text{ px}$ rejection, nested touchables, zero padding | Touch target inputs during payment authorization | Plumber job acceptance button in Scenario 1 | Layout metric assertions |
| 5 | Web Builds & Exports | Next.js 15 Turbopack root config, Expo Web static output | Missing dist folder, asset manifest validation, chunk hashing | Web app loads edge gateway assets | Admin portal audit in Scenario 1 | File system build artifacts & Exit Code 0 |
| 6 | COD & Razorpay Payment Adapters | `CodPaymentGatewayAdapter`, `RazorpayPaymentGatewayAdapter`, `@ConditionalOnProperty` | Unknown provider fallback, zero amount, negative amount, currency mismatch | Tokenized checkout triggers outbox event | Payment step in Scenarios 1, 2, 5 | Interface contract & bean condition model |
| 7 | Tokenized Checkout & Webhooks | HMAC SHA-256 signature verification, pessimistic lock, idempotency key | Tampered signature, expired timestamp, replayed idempotency key, malformed header | Payment capture verifies JWT authorization | Payment confirmation in Scenario 2 | `crypto.createHmac` oracle against webhook secret |
| 8 | Twilio SMS OTP Gateway | 6-digit OTP delivery, simulation mode, E.164 phone parsing | 60s cooldown violations, 5 max attempts lockout, circuit breaker after 5 errors | OTP login initiates Redis plumber geo registration | Plumber onboarding in Scenario 1 & 3 | Salted HMAC SHA-256 OTP digest matching |
| 9 | Cloudflare R2 S3 V4 Pre-Signed URLs | S3 V4 authorization query generation, pre-signed upload URL | Buffer overflow prevention (zero JVM buffering), expired signature, invalid bucket | Pre-signed upload feeds material inspection | Before/After photo upload in Scenarios 1-4 | Canonical request SHA-256 hash calculation |
| 10 | Transactional Outbox Atomic Persistence | Outbox event creation for `startOrder`, `cancelOrder`, material actions | Dual-write failure rollback, orphan event detection, null aggregate ID | Outbox poller feeds Kafka event bus | State persistence across all Scenarios | DB transactional boundary specification |
| 11 | Kafka / WebSocket Topic Alignment | Event schema matching `order-accepted`, `material-request-created` | Missing partition keys, deserialization error, malformed JSON | Kafka message triggers Socket.IO room broadcast | Plumber dispatch notification in Scenario 1 | Schema contract validator |
| 12 | Redis Plumber Geo TTL & Surge Fix | 5 km radius search, `plumbers_location` key consistency | Exact 5.0 km boundary, 300s companion TTL expiration, invalid lat/lon | Geo match triggers Twilio notification | Emergency dispatch in Scenario 3 | Haversine formula & Redis command oracle |
| 13 | Composite DB Indexes (Flyway V37) | `(customer_id, status)`, `(plumber_id, status)`, `(store_id, product_id)` | Single-column prefix scan, null status filtering, index name uniqueness | Fast query execution during high-volume dispatch | High-throughput query in Scenario 1 & 4 | SQL DDL AST / PostgreSQL EXPLAIN oracle |
| 14 | HikariCP Connection Pool Config | Max pool 15, min idle 3, timeout 10000, leak detection 30000 | Negative pool size, timeout > max lifetime, connection exhaustion | Pool resilience under outbox burst queries | Transactional load across all Scenarios | Spring property schema validator |
| 15 | Zero-Trust Secrets & Actuator Restrict | Actuator exposes only `health,info`, details `never`, zero prod secrets | Unauthorized access to `/actuator/env`, empty secret injection, trailing slashes | Protected actuator alongside dynamic CORS | Admin operational checks in Scenario 1 & 5 | HTTP response code & JSON field oracle |
| 16 | Dynamic CORS Domain Restriction | Whitelist `fixkart.com` & `admin.fixkart.com` with 200/204 | Unknown origins return HTTP 403, missing Origin header, port spoofing | CORS policy wraps JWT authenticated routes | Cross-app API calls across all Scenarios | Express/Spring CORS filter oracle |
| 17 | 512-bit HMAC SHA-512 JWT Signing | HS512 token signing, 64-byte secret verification, exp validation | HS256 algorithm confusion rejection, truncated key (<64 bytes), expired exp | Token authorization protects payment endpoints | User session authentication in Scenarios 1-5 | RFC 7519 JWT HS512 signature validation |
| 18 | OWASP Secure Headers & Middleware | CSP `default-src 'self'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` | Clickjacking iframe embedding blocked, MIME sniffing blocked, weak CSP | Secure headers attached to CORS-restricted responses | Client browser protection in all Scenarios | Security header specification match |
| 19 | Prometheus Metrics & Micrometer | `/actuator/prometheus` endpoint, JVM/JDBC metrics, order latency timers | Missing metrics registry, negative timer sample, high cardinality tags | Order transition timer records outbox latency | End-to-end latency tracking in Scenario 1 | Prometheus exposition format parser |
| 20 | Distributed `X-Correlation-ID` Tracing | Header generated if absent, preserved across Edge/Backend/Frontend | Non-UUID correlation ID sanitation, empty header, header injection | Correlation ID spans payment and outbox logging | Tracing single order across all 14 steps | Trace propagation contract validator |
| 21 | Opaque-Box E2E Test Suite | Unified runner discovers and executes Tiers 1-4 with structured summary | Test failure exit code 1, invalid tier argument, timeout handling | Validates cross-feature test harness | Governs execution of all test suites | Self-testing test runner oracle |
| 22 | 14-Step Playwright UAT Suite | Full 14-step order lifecycle executed across 4 actor roles | Out-of-order step execution, missing step precondition, race conditions | End-to-end integration of all platform features | Core basis for Scenario 1-5 | Playwright protocol step contract |
| 23 | Tier 5 Adversarial Coverage Hardening | Injection attacks, double-claim races, negative part quantities | Boundary overflow, replay attack, signature forgery, invalid state jump | Stress testing cross-feature interactions | Resiliency against bad actors in Scenario 4 | Adversarial mutation engine |
| 24 | Git Delivery & Release Runbook | Branch `Development-2`, Blue-Green Runbook, Rollback hashes verified | Dirty working tree check, uncommitted secrets check, missing rollback hash | Delivery verification of full test suite | Final platform certification | Git repository state & Markdown validator |

---

## 5. Execution Model & Runner Specifications

The standalone test runner is executed from the `plumbing-qcommerce` root:

```bash
node scripts/e2e_tests/run_all.js
```

### Supported CLI Flags
- `--tier=1` : Execute Tier 1 (Feature Coverage) only.
- `--tier=2` : Execute Tier 2 (Boundary & Corner Cases) only.
- `--tier=3` : Execute Tier 3 (Cross-Feature Combinations) only.
- `--tier=4` : Execute Tier 4 (Real-World Application Scenarios) only.
- `--feature=<1-24>` : Execute all tiers for a specific feature.
- `--bail` : Terminate immediately on the first test failure.
- `--verbose` : Print granular step-by-step assertions.

### Exit Codes
- `0`: All executed tests PASSED (100% PASS).
- `1`: One or more tests FAILED, or test runner error occurred.

---

## 6. Expected Output Derivation & Verification Oracles

All tests in this suite derive expected outputs from authoritative mathematical, cryptographic, or architectural definitions:
1. **Cryptographic Hashes**: Node.js `crypto` primitives calculate reference HMAC-SHA256 and HMAC-SHA512 outputs.
2. **State Machines**: Deterministic finite state automata model valid transitions; invalid transitions are asserted to throw or reject with predefined domain exceptions.
3. **Geospatial Coordinates**: Standard Great-Circle Haversine distance equations verify 5 km radius boundaries.
4. **Regular Expressions**: Compliant with RFC 3986 (URI), RFC 7519 (JWT), and WCAG 2.1 AA specifications.

---

## 7. Defect Reporting & Escalation Protocol

When a test failure indicates a genuine defect in an application component:
1. The test runner logs the exact feature ID, test name, input vector, expected output, and actual output.
2. The finding is documented in the test execution report with the designated component owner (e.g., M1 Frontend, M2 Backend Adapters, M3 Resilience, M4 Security, M5 Observability).
3. The defect is escalated to the implementing agent without modifying application source code.
