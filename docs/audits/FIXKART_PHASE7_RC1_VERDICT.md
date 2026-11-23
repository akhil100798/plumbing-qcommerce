# FIXKART PHASE 7: RELEASE CANDIDATE 1 (RC-1) CERTIFICATION VERDICT & AUDIT REPORT

**Date:** 02 November 2026  
**Auditor / Roles:** Principal Full-Stack Engineer, Distributed Systems Architect, Cloud Security Engineer & Lead QA Automation Architect  
**Framework:** G-Stack Verification Framework  
**Branch:** `Development-2`  
**Certified Commit SHA:** `da4689e2192765553e4e7c062b634888880d2ce2`  
**Production Isolation Status:** ENFORCED (Render Service `srv-daio2sbm8hqs73dl5oug` Auto-Deploy: `Off`)  
**Staging Target:** PostgreSQL 18.6 `fixkart_staging_local` | Backend Port `8080` (Proxy `8085`) | 4 Native Frontends (`3000`, `3001`, `3002`, `3101`)

---

## 1. EXECUTIVE SUMMARY & VERDICT

### FINAL VERDICT: **READY FOR STAGING RELEASE CANDIDATE 1 (RC-1)**
*Production Deployment: **HOLD / GATED** (Requires Explicit Stakeholder Approval & Production R2 Secret Provisioning)*

All four critical release blockers identified across Phase 6 and the G-Stack audit have been completely resolved, empirically verified, and certified under native execution without mock fallbacks or route interceptions:

1. **P0 Financial Concurrency & Audit Integrity:** **CERTIFIED (6/6 PASS)**. Concurrent payment capture races have been eliminated. Concurrent capture requests now return the exact canonical gateway transaction ID, and finalization inserts an exactly-once `PAID` audit row into `service_order_status_history`. All 6 strict database-level transaction integrity tests passed with zero failures.
2. **P1 Backend CORS Resolution:** **CERTIFIED (4/4 TEST SUITE PASS)**. Expanded allowed origins to encompass all active multi-app development and staging ports (`3000`, `3001`, `3002`, `3101` across both `localhost` and `127.0.0.1`). Implemented dynamic origin reflection with regex protection for Vercel preview environments (`^https://[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.vercel\.app$`), supporting `allowCredentials=true` while strictly rejecting rogue or attacker domains with `HTTP 403 Forbidden`.
3. **P1 Plumber Client Resilience:** **CERTIFIED**. Enforced fail-closed policy (`canUseDevMockFallbacks = () => false;`). The plumber application no longer falls back to synthetic mock profiles (e.g. Rajesh Kumar) or fake jobs on network/CORS issues.
4. **P1 Native Browser User Acceptance Testing (UAT):** **CERTIFIED (14/14 PASS)**. All 14 golden-path lifecycle steps (`UAT-01` through `UAT-14`) were executed using real browser DOM interactions in Playwright Chromium across 4 isolated sessions (Customer, Plumber, Store Partner, and Super Admin). All 14 scenarios transitioned from `BLOCKED` to `PASS`.

---

## 2. P0 FINANCIAL INTEGRITY & CONCURRENCY SCORECARD

Execution of `FIXKART_PHASE6_RELEASE_CANDIDATE_HARDENING/verify-transaction-integrity.py` against the certified backend:

| Test ID | Transaction Category | Execution Conditions | Invariant Asserted | Status |
|---|---|---|---|---|
| `INV-RACE` | Inventory Concurrency | 2 concurrent reservation requests for 2 units on stock with only 2 available | Exactly 1 request succeeds (HTTP 200), racing request rejected with HTTP 409 Conflict | **PASS** |
| `INV-DUPLICATE` | Reservation Idempotency | Sequential replay of already reserved material request | Replay safely handled without double reservation or stock drift | **PASS** |
| `INV-RELEASE` | Cancellation Stock Release | Cancellation of reserved material request | Reserved quantity decremented, available quantity restored atomically | **PASS** |
| `PAY-CONCURRENT` | Payment Race Condition | 2 concurrent HTTP capture requests on the same completed service order | Exactly one gateway capture executed; racing thread waits and returns identical canonical transaction ID (`ch_mock_0f47ba2b`) | **PASS** |
| `PAY-REPLAY` | Payment Replay Idempotency | Sequential re-execution of payment capture | Returns canonical transaction ID, HTTP 200, zero duplicate charges | **PASS** |
| `PAY-STATUS-AUDIT` | Status History Audit | Inspection of `service_order_status_history` post-capture | Exactly one `PAID` audit record exists with actor `CUSTOMER` and transaction ID recorded; zero duplicates on replayed payments | **PASS** |

**Summary:** **6 / 6 Passed (100%)** | Zero Failures | Zero Timeouts. Evidence: `FIXKART_PHASE6_RELEASE_CANDIDATE_HARDENING/evidence/transaction-integrity.json`.

---

## 3. P1 BACKEND CORS RESOLUTION & FAIL-CLOSED RESILIENCE

### 3.1 Backend Configuration Changes
- **Dynamic Origin Reflection (`SecurityConfig.java`):**
  ```java
  private static final Pattern VERCEL_PREVIEW_PATTERN =
          Pattern.compile("^https://[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)*\\.vercel\\.app$");

  private boolean isOriginPermitted(String origin) {
      if (origin == null || origin.isBlank() || origin.contains("*")) return false;
      if (resolveAllowedOrigins().contains(origin)) return true;
      return VERCEL_PREVIEW_PATTERN.matcher(origin).matches();
  }
  ```
  Permitted origins are reflected dynamically into `Access-Control-Allow-Origin: <requestOrigin>`, preserving `allowCredentials: true` without violating W3C CORS security constraints on wildcards.
- **Allowed Origins Allowlist:**
  - `application-staging.properties`: `http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3101,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:3002,http://127.0.0.1:3101`
  - `application-local-staging.properties`: Extended with ports `3000`, `3001`, `3002`, `3101` across both `localhost` and `127.0.0.1`.
- **Automated Regression Verification (`CorsConfigurationSecurityTest.java`):**
  - Explicit local origins (`3000`, `3001`, `3002`, `3101`): `200 OK`
  - Vercel preview environments: `200 OK`
  - Unauthorized domains (`http://evil.example`, `https://attacker-vercel.app`): `403 Forbidden`
  - Result: **4 / 4 Unit Tests Passed (BUILD SUCCESS)**.

### 3.2 Plumber Client Fail-Closed Policy
- Modified `plumber-app/src/services/mockPolicy.ts`:
  ```typescript
  export const canUseDevMockFallbacks = () => false;
  ```
- Result: Plumber app will never show synthetic "Rajesh Kumar" data on backend unavailability; instead, it raises explicit error notifications and preserves state integrity. All 43 Plumber unit tests passed.

---

## 4. P1 NATIVE BROWSER UAT SCORECARD (THE GOLDEN TRIANGLE)

Executed via Playwright Chromium with 4 independent browser contexts without mocks or route interception.

| Scenario ID | Persona / Flow | Actions & Assertions | Status | Evidence Receipt |
|---|---|---|---|---|
| **UAT-01** | Customer Order Creation | Customer logs in natively at `http://127.0.0.1:3000`, skips onboarding, selects emergency plumbing, inputs address, submits order. DB: Order `#33` created in status `PENDING`. | **PASS** | `01_customer_creates_plumbing_request.png` |
| **UAT-02** | Plumber Job Acceptance | Plumber logs in natively at `http://127.0.0.1:3001` via email tab (`plumber.qa@fixkart.com`), reviews incoming emergency offer, clicks Accept. DB: Status updated to `ACCEPTED`. | **PASS** | `02_plumber_accepts_job.png` |
| **UAT-03** | Plumber Arrival & Before Photo | Plumber marks arrival and starts diagnosis. Uploads 1024-byte before-service photo. Cryptographic SHA-256 byte readback matched (`true`). Status: `IN_PROGRESS`. | **PASS** | `03_plumber_arrives_and_before_photo.png` |
| **UAT-04** | Material Request Creation | Plumber requests CPVC Pipe 1/2" (2) and PVC Elbow 3/4" (1) from Store Partner #1. Material request `#22` submitted (`STORE_REVIEWING`). | **PASS** | `04_plumber_requests_materials.png` |
| **UAT-05** | Store Approval & Reservation | Store Partner logs in at `http://127.0.0.1:3002`, views Material Request `#22`, clicks Approve & Reserve. DB: Inventory allocated, `reserved_quantity` incremented. Status: `RESERVED`. | **PASS** | `05_store_approves_and_reserves.png` |
| **UAT-06** | Store Preparation & Packing | Store prepares items into bin, verifies packed counts, marks Ready for Pickup. Status: `READY_FOR_PICKUP`. | **PASS** | `06_store_prepares_and_packs.png` |
| **UAT-07** | Plumber Store Collection | Plumber arrives at store counter and collects packed hardware. Status: `PLUMBER_AT_STORE`. | **PASS** | `07_plumber_collects_materials.png` |
| **UAT-08** | Store Handover Confirmation | Store partner verifies collection and confirms physical handover. Status: `COLLECTED`. | **PASS** | `08_store_confirms_handover.png` |
| **UAT-09** | Plumber Transit to Site | Plumber marks departure from store returning to customer site. Service order status: `RETURNING_TO_CUSTOMER`. | **PASS** | `09_plumber_returning_to_site.png` |
| **UAT-10** | Work Resumption & After Photo | Plumber resumes repair on site. Uploads 1024-byte after-service completion photo. Cryptographic SHA-256 byte readback matched (`true`). Status: `IN_PROGRESS`. | **PASS** | `10_plumber_resumes_and_after_photo.png` |
| **UAT-11** | Order Completion | Plumber finalizes invoice with parts charge ₹325.00 (Total ₹525.00). Clicks Complete Order. Status: `COMPLETED`. | **PASS** | `11_plumber_completes_order.png` |
| **UAT-12** | Customer Payment Capture | Customer confirms completion, executes mock payment (`pm_card_visa_staging_mock`). Atomic lock verifies single canonical TxID (`ch_mock_d78b5785`). Status: `PAID`. | **PASS** | `12_customer_confirms_and_pays.png` |
| **UAT-13** | Customer Rating Submission | Customer submits 5-star rating with review comment. DB: Rating record linked to order `#33`. | **PASS** | `13_customer_submits_rating.png` |
| **UAT-14** | Super Admin Audit & Ledger Review | Super Admin logs in at `http://127.0.0.1:3101`, audits complete timeline (13 events). Verifies inventory deduction, exactly-once `PAID` status audit record. | **PASS** | `14_admin_verifies_audit.png` |

**Total Scenarios:** 14  
**Passed:** 14 (100%)  
**Blocked:** 0  
**Failed:** 0  
**Artifact Traces Generated:** `customer_trace.zip` (31 MB), `plumber_trace.zip` (6.4 MB), `store_trace.zip` (2.8 MB), `admin_trace.zip` (347 KB).

---

## 5. PRODUCTION RELEASE SAFETY & ISOLATION

1. **Auto-Deploy Isolation Verified:**
   - Production Render Service: `plumbing-qcommerce` (`srv-daio2sbm8hqs73dl5oug`)
   - Auto-deploy setting: **`Off`**
   - Active Production Commit: `b8fa754b7796c50863091c1da123fddbd8fb981a` (No rogue deployments triggered)
2. **Database Isolation Maintained:**
   - Production Database `fixkart_postgres_new`: **Zero connections / Zero queries / Zero writes.**
   - All tests targeted exclusively `fixkart_staging_local` via DPAPI-protected credentials.
3. **Secrets & Credentials Discipline:**
   - Zero hardcoded passwords, tokens, or JWTs present in source code or committed reports.
   - All DPAPI credentials safely scoped in Windows LocalAppData.

---

## 6. RELEASE CANDIDATE 1 (RC-1) RECOMMENDATIONS

1. **Staging Promotion (Immediate):**
   - The changes on branch `Development-2` (Commit `da4689e`) are fully certified for Staging Render (`srv-dbgqdbjbc2fs73bd4s90`).
   - Push to `origin/Development-2` will allow Staging Render to build and deploy the new CORS and atomic payment fixes.
2. **Production Release Gates (Prior to Production Deployment):**
   - **Gate 1:** Provision production Cloudflare R2 bucket (`fixkart-prod-photos`) and inject credentials into `srv-daio2sbm8hqs73dl5oug` dashboard before activating `APP_PHOTOS_PROVIDER=r2`.
   - **Gate 2:** Configure live payment gateway credentials (e.g. Razorpay / Stripe) or verify mock payment guard (`APP_PAYMENT_FAIL_IF_MOCK_IN_PROD`).
   - **Gate 3:** Execute manual deploy via Render dashboard only after explicit stakeholder sign-off.
