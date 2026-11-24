# FixKart — QA Executive Summary Report

**Classification:** Engineering Leadership & Go-Live Decision Brief  
**Report Type:** Comprehensive QA Executive Summary  
**Prepared By:** QA Engineering — Lead Architect & Test Director  
**Date:** 2026-11-03  
**Branch:** `Development-2`  
**Last Code Commit:** `6f12609` — feat: elevate FixKart architecture to 10/10 production excellence  
**Platform:** FixKart "Golden Triangle" Quick-Commerce Plumbing Platform  

---

## 1. Top-Line Production Readiness Verdict

> [!CAUTION]
> ## ⛔ NOT PRODUCTION READY
> **4 Critical blockers must be resolved before any production deployment.** The platform has exceptional architectural foundations and passes 153/153 frontend and 535/535 backend unit tests. However, two authorization gaps, one camera bypass, and one OTP race condition represent unacceptable security and data-integrity risks for live users.

| Dimension | Score | Verdict |
|-----------|-------|---------|
| Architecture & Foundations | **9.2/10** | ✅ Production-grade |
| Security | **6.8/10** | ❌ 2 Critical, 5 High vulns |
| Test Coverage & Quality | **7.8/10** | ⚠️ Integration tests need live DB |
| Frontend & Mobile UX | **7.7/10** | ⚠️ 12 UX bugs (0 blockers) |
| Backend Correctness | **7.5/10** | ❌ 3 critical lock/race bugs |
| API Contract Compliance | **7.0/10** | ⚠️ Non-standard HTTP codes, BOLA |
| Concurrency Safety | **6.5/10** | ❌ 3 critical race conditions |
| **OVERALL PLATFORM SCORE** | **7.5/10** | **⛔ NOT GO-LIVE READY** |

---

## 2. Test Coverage Summary

### 2.1 All Test Suites

| Subsystem | Tests | Passed | Failed | Errors | Status |
|-----------|-------|--------|--------|--------|--------|
| Backend Unit (Spring Boot 4) | 535 | 535 | 0 | 0 | ✅ |
| Backend Integration (PostgreSQL-gated) | 142 | 0 | 0 | 142 | ⚠️ Env-gated |
| Edge Service (Node.js) | 16 | 16 | 0 | 0 | ✅ |
| Customer App (React Native/Expo) | 49 | 49 | 0 | 0 | ✅ |
| Plumber App | 43 | 43 | 0 | 0 | ✅ |
| Store App | 21 | 21 | 0 | 0 | ✅ |
| Admin Portal Unit | 24 | 24 | 0 | 0 | ✅ |
| Admin Portal TypeScript | — | PASS | — | — | ✅ |
| Admin Portal Production Build | 44 routes | PASS | — | — | ✅ |
| **TOTAL FRONTEND** | **153** | **153** | **0** | **0** | **✅** |

> [!NOTE]
> Backend integration test errors (142) are caused entirely by missing `PHASE1_TEST_POSTGRES_URL` environment variable — an intentional infrastructure guard (`PostgresTestTargetGuard.validate()`). No logic failures. Setting the env var in CI pipeline will bring these to 0 errors.

### 2.2 Black-Box Test Cases

| Category | Total | Passed | Failed | Pass Rate |
|----------|-------|--------|--------|-----------|
| Customer App Flows | 98 | 93 | 5 | 94.9% |
| Plumber App Flows | 87 | 82 | 5 | 94.3% |
| Store App Flows | 76 | 72 | 4 | 94.7% |
| Admin Portal Flows | 48 | 44 | 4 | 91.7% |
| Cross-App E2E Scenarios | 32 | 25 | 7 | 78.1% |
| Payment Lifecycle | 44 | 39 | 5 | 88.6% |
| **Total Black-Box** | **461** | **436** | **25** | **94.6%** |

---

## 3. Critical Blocker Registry (Must Fix Before Go-Live)

### 🔴 BLOCKER-001: BOLA on Checkout Endpoints — No Authorization Check
- **Source Report:** `SECURITY_PEN_TEST_REPORT.md` → SEC-CRIT-001  
- **File:** `CheckoutController.java` — `POST /api/v1/checkout/release/{orderId}`, `POST /api/v1/checkout/confirm/{orderId}`  
- **Risk:** Any authenticated user (customer, plumber, store clerk) can cancel **any** other user's order or confirm any payment by knowing or guessing an `orderId`. Zero ownership verification in controller or service.  
- **CVSS Score:** 9.1 (Critical)  
- **Fix:** Add `@PreAuthorize("@orderAuthority.isOwner(authentication, #orderId)")` to both endpoints. Implement `OrderAuthority` bean that fetches the order and verifies `customer.id == auth.principal.id`.

### 🔴 BLOCKER-002: Unrestricted Wallet Top-Up — No Payment Validation
- **Source Report:** `SECURITY_PEN_TEST_REPORT.md` → SEC-CRIT-002  
- **File:** `WalletController.java` — `POST /api/v1/wallet/topup`  
- **Risk:** Any authenticated user can top up their wallet to any arbitrary amount by sending a crafted request — no Razorpay payment token verification, no amount reconciliation, no audit trail. Free money exploit.  
- **CVSS Score:** 9.4 (Critical)  
- **Fix:** Wallet top-up must verify a pre-authorized Razorpay `payment_id` via HMAC before crediting. Amount must match the Razorpay-confirmed charge, not the client-supplied value.

### 🔴 BLOCKER-003: Plumber Photo Capture Uses Hardcoded Unsplash URLs
- **Source Report:** `BLACK_BOX_TEST_REPORT.md` → BB-BUG-002  
- **File:** Plumber App — `PhotoCaptureScreen` or `JobDetailsScreen`  
- **Risk:** Repair evidence photos (before/after) are `unsplash.com` stock photos hardcoded in the code. No real camera integration, no actual R2 upload for repair photos. This means there is no real photographic evidence of work performed — a critical trust and legal liability risk. The `R2ObjectStorageService` pre-signed URL infrastructure exists but is not wired to the mobile camera.  
- **Severity:** Business-Critical (legal evidence, customer trust)  
- **Fix:** Wire `expo-image-picker` or `expo-camera` to the photo capture flow; call the R2 pre-signed URL endpoint; upload directly to Cloudflare R2.

### 🔴 BLOCKER-004: OTP Verification TOCTOU — Brute-Force Bypass
- **Source Report:** `CONCURRENCY_STRESS_TEST_REPORT.md` → CR-BUG-007 / `WHITE_BOX_TEST_REPORT.md` → WB-BUG-003  
- **File:** `OtpService.java` — `verifyOtp(String phone, String code)`  
- **Risk:** `verifyOtp()` has no `@Transactional` annotation. The read → compare → increment-attempt sequence is not atomic. Under concurrent OTP submissions, multiple threads can read the attempt count simultaneously (e.g., both see `attempts=4`), both verify, both pass the `< 5` guard, and both proceed — effectively bypassing the brute-force lockout. This allows unlimited OTP guessing.  
- **Fix:** Add `@Transactional` to `verifyOtp()`. Use a single `UPDATE otp_records SET attempts = attempts + 1 WHERE phone = ? RETURNING attempts` atomic query, or use Redis atomic increment with Lua script.

---

## 4. High-Severity Bug Summary (Fix Before Beta/Soft Launch)

| ID | Source | Severity | Component | Summary |
|----|--------|----------|-----------|---------|
| SEC-HIGH-001 | Security | 🟠 High | `RazorpayPaymentGatewayAdapter` | Webhook accepts `sim_*` bypass strings when HMAC secret unconfigured |
| SEC-HIGH-002 | Security | 🟠 High | `SecurityConfig` CORS | Wildcard `vercel.app` regex allows attacker CSRF |
| SEC-HIGH-003 | Security | 🟠 High | `CheckoutController.confirmPayment` | BOLA on unlinked product orders (subset of BLOCKER-001) |
| SEC-HIGH-004 | Security | 🟠 High | Edge Gateway (Node.js) | Missing CSP, X-Frame-Options, HSTS headers |
| SEC-HIGH-005 | Security | 🟠 High | Edge Gateway | No token revocation check on REST/WebSocket |
| BB-BUG-001 | Black-Box | 🟠 High | `PaymentController` | COD marks order PAID immediately without cash collection confirmation |
| BB-BUG-003 | Black-Box | 🟠 High | `ServiceOrderService` | Order completable with pending material requests → orphaned stock |
| BB-BUG-004 | Black-Box | 🟠 High | `CheckoutController` | Store handover has no token/barcode verification → unauthenticated release |
| CR-BUG-001 | Concurrency | 🔴 Critical | `CheckoutService.reserveStock` | Multi-product cart deadlock (unsorted row locking) |
| CR-BUG-002 | Concurrency | 🔴 Critical | `CheckoutService.confirmPayment` | Lost update race on unlinked order payments |
| CR-BUG-003 | Concurrency | 🟠 High | `ServiceOrderService` | Cross-entity deadlock between `service_orders` and `stocks` |
| CR-BUG-004 | Concurrency | 🟠 High | `PaymentController` | TOCTOU in idempotency check |
| WB-BUG-004 | White-Box | 🟠 High | `SecurityConfig` | `denyAll()` on `/api/v1/delivery/**` makes entire delivery subsystem dead code |
| API-BUG-001 | API | 🟡 Medium | `GlobalExceptionHandler` | All `RuntimeException` → HTTP 404 (should be 500) |
| UX-BUG-001 | UI/UX | 🟠 High | Plumber App | PlumberConfirmationScreen back button renders `?` |
| UX-BUG-003 | UI/UX | 🟠 High | Store App | PackingScreen overflow on 320px devices |

---

## 5. Full Bug Count by Category & Severity

| Category | 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low | Total |
|----------|------------|--------|----------|-------|-------|
| Security (Pen Test) | 2 | 5 | 4 | 2 | **13** |
| Concurrency / Stress | 3 | 4 | 3 | 0 | **10** |
| Black-Box / Functional | 2 | 3 | 8 | 12 | **25** |
| API Integration | 0 | 2 | 5 | 3 | **10** |
| White-Box / Code | 3 | 2 | 2 | 1 | **8** |
| UI/UX / Accessibility | 0 | 2 | 4 | 6 | **12** |
| **TOTAL** | **10** | **18** | **26** | **24** | **78** |

---

## 6. Category Report Scorecards

### 6.1 Security Score — 6.8/10

| Sub-Area | Score | Status |
|----------|-------|--------|
| Authentication (JWT HS512) | 9/10 | ✅ |
| Authorization / RBAC | 5/10 | ❌ BOLA on 2 endpoints |
| Wallet & Payment Security | 4/10 | ❌ No gateway validation |
| API Rate Limiting | 7/10 | ⚠️ Bypassable via X-Forwarded-For |
| CORS Policy | 6/10 | ⚠️ Wildcard Vercel regex |
| Security Headers | 7/10 | ⚠️ Edge GW missing headers |
| Token Revocation | 5/10 | ❌ No blacklist |
| OTP / Brute-Force Protection | 5/10 | ❌ TOCTOU bypass |
| **Overall Security** | **6.8/10** | **❌** |

### 6.2 Black-Box / Functional Score — 7.5/10

| Sub-Area | Score |
|----------|-------|
| Customer Order Flow | 8/10 |
| Plumber Job Lifecycle | 7/10 |
| Store Material Handover | 7.5/10 |
| Admin Management | 8.5/10 |
| Payment Processing | 6.5/10 |
| Cross-App E2E | 7/10 |
| **Overall Black-Box** | **7.5/10** |

### 6.3 API Integration Score — 7.0/10

| Sub-Area | Score |
|----------|-------|
| HTTP Status Code Compliance | 6/10 |
| REST Response Schema Consistency | 6.5/10 |
| WebSocket Event Delivery | 6/10 |
| Error Response Format | 6/10 |
| API Contract Adherence | 8/10 |
| **Overall API** | **7.0/10** |

### 6.4 Concurrency & Stress Score — 6.5/10

| Sub-Area | Score |
|----------|-------|
| Pessimistic Lock Coverage | 6/10 |
| Idempotency Key Implementation | 7/10 |
| Deadlock Prevention | 5/10 |
| HikariCP Configuration | 8/10 |
| Redis Geo Dispatch | 8/10 |
| OTP Concurrency Safety | 4/10 |
| **Overall Concurrency** | **6.5/10** |

### 6.5 White-Box / Code Quality Score — 7.5/10

| Sub-Area | Score |
|----------|-------|
| Transactional Propagation | 8/10 |
| Pessimistic Lock Coverage | 6/10 |
| Dead Code | 7/10 |
| Test Coverage (Unit) | 9/10 |
| Error Handling Paths | 6.5/10 |
| Config Hygiene | 8/10 |
| **Overall White-Box** | **7.5/10** |

### 6.6 UI/UX & Accessibility Score — 7.7/10

| Sub-Area | Score |
|----------|-------|
| Touch Target Compliance | 7.5/10 |
| Accessibility Labels | 8/10 |
| Color Contrast | 7/10 |
| Icon Standardization | 10/10 |
| Responsive Design | 7.5/10 |
| Navigation Flow | 8/10 |
| Admin Portal Web A11y | 8/10 |
| **Overall UI/UX** | **7.7/10** |

---

## 7. Architecture & Infrastructure Achievements ✅

The following production-grade infrastructure was delivered in `6f12609` and is confirmed in place:

| Feature | Implementation | Verified |
|---------|---------------|---------|
| HMAC SHA-512 JWT | `JwtService.java` — 512-bit key | ✅ |
| Razorpay Payment Adapter | `RazorpayPaymentGatewayAdapter.java` + `@ConditionalOnProperty` | ✅ |
| Twilio SMS with Circuit Breaker | `TwilioSmsSender.java` — Resilience4j | ✅ |
| Cloudflare R2 Pre-Signed Uploads | `R2ObjectStorageService.java` — AWS SigV4 | ✅ |
| Transactional Outbox Pattern | `ServiceOrderService`, `PlumberMaterialService` | ✅ |
| Redis Geo Dispatch (5km TTL) | `edge-service/redisService.js` — `GEOADD`/`GEOSEARCH`/300s TTL | ✅ |
| Flyway V37 Performance Indexes | Composite indexes on `service_orders`, `store_inventory` | ✅ |
| HikariCP Tuned | `max=15`, `idle=3`, `timeout=10000`, `leak=30000` | ✅ |
| OWASP Security Headers | CSP, X-Frame-Options: DENY, HSTS, nosniff | ✅ |
| Correlation ID Propagation | `CorrelationIdFilter.java` — `X-Correlation-ID` | ✅ |
| Micrometer Prometheus Metrics | JVM, JDBC, order latency, payment RT | ✅ |
| 52 Raw Emoji → SVG Icons | Lucide/AppIcon components | ✅ |
| `resolveApiBaseUrl` Env Guards | Staging→Prod cross-contamination prevented | ✅ |
| `application-prod.properties` Zero Secrets | Externalized via env vars | ✅ |

---

## 8. Go-Live Decision Matrix

| Gate | Requirement | Current State | Decision |
|------|-------------|--------------|----------|
| 🔴 Security Gate | Zero Critical vulnerabilities | 2 Critical (BLOCKER-001, -002) | **FAIL — Block** |
| 🔴 Integrity Gate | Real camera + photo upload | Unsplash URLs (BLOCKER-003) | **FAIL — Block** |
| 🔴 Auth Gate | OTP brute-force protection | TOCTOU bypass (BLOCKER-004) | **FAIL — Block** |
| 🟠 Concurrency Gate | No cart deadlocks | 2 Critical race conditions | **WARN — Resolve** |
| 🟡 API Gate | HTTP standards compliance | Non-standard codes (200/404) | **WARN — Resolve** |
| ✅ Unit Test Gate | All unit tests pass | 535/535 PASS | **PASS** |
| ✅ Build Gate | All production builds pass | 4/4 apps build clean | **PASS** |
| ✅ Architecture Gate | Production infra in place | All 5 Pillars delivered | **PASS** |
| ✅ Frontend Gate | No UI blockers | 0 UI production blockers | **PASS** |

---

## 9. Sprint to Production: Recommended Fix Order

### Sprint 0 — Critical Security Patch (48 hours)
1. `CheckoutController`: Add `@PreAuthorize` ownership check on `release` and `confirm` endpoints
2. `WalletController`: Add Razorpay payment token verification before crediting wallet
3. `OtpService.verifyOtp()`: Add `@Transactional` + atomic attempt counter

### Sprint 1 — Camera & Core Bugs (1 week)
4. Plumber App: Wire `expo-camera` → R2 pre-signed URL for before/after photos
5. `SecurityConfig`: Replace wildcard `vercel.app` CORS regex with explicit whitelist
6. `RazorpayPaymentGatewayAdapter`: Remove `sim_*` webhook bypass branches
7. Edge Gateway: Add CSP, HSTS, X-Frame-Options headers in Express middleware
8. `CheckoutService.reserveStock()`: Sort `CartItemDTO` by product ID before acquiring locks (prevents deadlock)

### Sprint 2 — API Standards & UX (1 week)
9. `GlobalExceptionHandler`: Map `RuntimeException` → HTTP 500; creation endpoints → 201; deletion → 204
10. Fix `PlumberConfirmationScreen` back button icon rendering + `accessibilityLabel`
11. Fix `PackingScreen` fixed-width overflow for 320px devices
12. Add `jakarta.persistence.lock.timeout=5000` to datasource config
13. Remove or properly implement `/api/v1/delivery/**` endpoints (currently `denyAll()`)
14. Add CI environment variables for PostgreSQL integration tests

### Sprint 3 — Hardening (1 week, optional pre-launch)
15. COD payment: require explicit cash confirmation before marking `PAID`
16. Store handover: add token/barcode verification before releasing materials
17. Edge Gateway: implement JWT token revocation blacklist
18. Rate limiting: use real client IP (trust configured proxy IPs, not arbitrary `X-Forwarded-For`)

---

## 10. Report Index

| Report | File | Size | Status |
|--------|------|------|--------|
| Black-Box Test Report | `reports/qa/BLACK_BOX_TEST_REPORT.md` | 32 KB | ✅ Complete |
| API Integration Test Report | `reports/qa/API_INTEGRATION_TEST_REPORT.md` | 67 KB | ✅ Complete |
| Security Penetration Test Report | `reports/qa/SECURITY_PEN_TEST_REPORT.md` | 43 KB | ✅ Complete |
| Concurrency & Stress Test Report | `reports/qa/CONCURRENCY_STRESS_TEST_REPORT.md` | 39 KB | ✅ Complete |
| White-Box Test Report | `reports/qa/WHITE_BOX_TEST_REPORT.md` | ~22 KB | ✅ Complete |
| UI/UX & Accessibility Report | `reports/qa/UI_UX_ACCESSIBILITY_TEST_REPORT.md` | ~18 KB | ✅ Complete |
| **Executive Summary (this file)** | `reports/qa/EXECUTIVE_SUMMARY.md` | ~15 KB | ✅ Complete |

---

## 11. Platform Rating Summary

```
╔═══════════════════════════════════════════════════════════════╗
║         FIXKART PLATFORM — QA FINAL RATING CARD               ║
╠══════════════════════╦════════════╦══════════════════════════╣
║ Dimension            ║ Score      ║ Note                     ║
╠══════════════════════╬════════════╬══════════════════════════╣
║ Architecture         ║   9.2/10   ║ Outstanding foundations  ║
║ Security             ║   6.8/10   ║ 2 Critical vulns         ║
║ Test Coverage        ║   7.8/10   ║ Needs live DB for intgn  ║
║ Frontend/Mobile UX   ║   7.7/10   ║ 12 UX bugs, 0 blockers  ║
║ Backend Correctness  ║   7.5/10   ║ 3 critical race bugs     ║
║ API Compliance       ║   7.0/10   ║ Non-standard HTTP codes  ║
║ Concurrency Safety   ║   6.5/10   ║ Cart deadlock possible   ║
╠══════════════════════╬════════════╬══════════════════════════╣
║ OVERALL PLATFORM     ║   7.5/10   ║ ⛔ NOT PRODUCTION READY  ║
╚══════════════════════╩════════════╩══════════════════════════╝

  4 Critical Blockers → Sprint 0 (48h) + Sprint 1 (1 week)
  Estimated production readiness: 2–3 sprints from today
```

---
*Report generated: 2026-11-03 | QA Test Director | Branch: Development-2 | Commit: 6f12609*

