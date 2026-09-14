# FixKart Local Regression Retest

## Executive Summary

**NOT READY — MAJOR DEFECTS REMAIN**

Current source builds and real seeded role authentication work locally. Customer browser authentication, the materials-required start transition, and required photo capture prevent a complete browser lifecycle. No product code was changed. No mocked/fabricated PASS was counted. Local results do not certify deployed aliases.

## Tested branch/SHA and environment

Development-2: 096fe3c86e71c56302dc63a2004d87b5debb11cc. Verified local/origin agreement with 0 ahead / 0 behind before testing. Existing Docker Postgres database fixkart_retest_20260914 was created empty and migrated through V20. Real random QA credentials and real tokens were used. Chrome/Playwright tested local ports 8082/8083/8084/3001 against backend 8081. The browser/controller and Docker were recovered after interruptions; old failures remain recorded.

## Historical reports analyzed and previous totals

Canonical prior assertion rows: 646; BLOCKED: 449; PASS: 143; FAIL: 29; NOT APPLICABLE: 6; NOT TESTED: 19. Detailed historical control rows: 63. Both sets are retained, 709 accounted rows. The control rows overlap aggregate checks, so this is a reconciliation ledger, not an independent-feature count. Other historical narrative/design reports are inventoried but do not create current PASS claims.

## Current totals and delta

FAIL: 37; BLOCKED: 106; N/A: 63; NOT TESTED: 261; PASS: 242. Previous ledger totals: BLOCKED: 450; PASS: 167; FAIL: 67; NOT APPLICABLE: 6; NOT TESTED: 19. See retest-master.csv and delta-summary.csv for every row, its evidence, and its precise limitation. Unexecuted edge cases remain NOT TESTED; blocked dependencies remain BLOCKED.

## Static validation

| Component | Result | Evidence |
| --- | --- | --- |
| Backend | 276 tests; 0 failures/errors/skips | logs/backend-mvn-test.log |
| Customer | typecheck PASS; 3 contract assertions PASS; DIRECT EXPO WEB EXPORT PASS | logs/customer-static-continuation.json; logs/customer-npm-test.log |
| Plumber | typecheck PASS; 5 files / 11 tests PASS; build PASS | logs/plumber-static-continuation.json; logs/plumber-npm-test.log |
| Store | typecheck PASS; 4 files / 13 tests PASS; build PASS | logs/store-static-continuation.json; logs/store-npm-test.log |
| Admin | typecheck PASS; lint 0 errors / 1 warning; 3 tests PASS; post-sync build PASS | logs/admin-typecheck.log; logs/admin-lint.log; logs/admin-test.log; logs/admin-build-postsync.log |

The backend source did not change between the reused successful test run and 096fe3c; that commit changes two Admin files. The pre-sync Admin build failure is stale and is excluded from current failures. Backend Docker build succeeded from current source; image digest is in environment-evidence.json.

## Backend/API and persistence

Health/live, health/ready, version, Actuator health and Actuator info returned 200 after full seeding. Actuator info returns an empty object, not the previously reported 500. Initial premature health/auth probes are superseded by post-seeding evidence. Flyway V20 and role counts were verified through read-only docker exec SQL. Docker Desktop restart automatically resumed the legacy pqc_backend briefly; it was stopped. No direct SQL mutations targeted plumbing_commerce. Independent effects of that pre-existing backend were not audited.

## Customer

The supported local environment restart corrected the original retired-backend target. Ten-digit phone submission still fails OtpRequest validation requiring '+91 XXXXXXXXXX', blocking a real Customer browser session. Guest catalog eventually displayed four seeded products with runtime prices; earlier transport failure silently substituted static products. Static fallback content is excluded from real inventory certification. Account-dependent address/checkout/tracking assertions remain blocked.

## Plumber

Real password login, session restoration, incoming runtime job, acceptance, arrival, diagnosis UI, material tracking and collection were exercised. Materials Required updates Redux state but omits the backend start call; the real material submission returned 409 while the job remained ACCEPTED. The API was explicitly used to start work and continue subsequent independent checks. The after-photo screen requires three photos but its handler cannot capture/upload any; Next remains disabled.

## Store

Real Store login and seeded store/inventory were verified. Runtime material request was listed, approved/prepared, and marked READY_FOR_PICKUP through the UI, with API read-back. Collection and later state results are enumerated in lifecycle-finished-continuation.json where available. No unsupported partial/negative operations are inferred from the successful happy path.

## Admin

The repaired post-sync build passed. A real SUPER_ADMIN browser session loaded 37 available navigation views with captured API responses. This certifies read views, not every create/edit/delete form. Settings and Audit Logs are labeled Coming soon. Sub-role API boundaries were tested; per-role browser results, if executed, are in admin-role-browser-continuation.json.

## Complete lifecycle

The new service order and material request IDs came from live API responses. Customer creation used the API because Customer UI login is blocked. Plumber acceptance/arrival and Store preparation/readiness used real browser interactions. Material creation required API start-work continuation due to a recorded product defect. Plumber photo capture blocks browser completion. Therefore the full Customer → Plumber → Store → Customer browser lifecycle is **BLOCKED**, even when individual API transitions pass.

## Authentication, authorization/RBAC, and security

The initial 45 isolated API security checks passed, including second-customer/second-plumber IDOR, cross-role admin restrictions, own admin dashboard access, negative stock, duplicate accept, premature completion, and refresh rotation/reuse. Local CORS accepts four configured app origins and rejects an untrusted origin. Later endpoint probes and transport failures are reported separately. This is targeted QA, not a penetration-test or rate-limit/load certification.

## Accessibility

Focused real Chrome/axe checks confirm Plumber registration labels are fixed. Store registration and Plumber OTP inputs remain unnamed. Plumber login has tab ARIA/contrast violations; authenticated Store has focus/contrast violations. The first mislabeled Plumber registration scan was actually login and is excluded for that assertion. Keyboard samples are saved; full assistive-technology testing remains NOT TESTED.

## Responsive and zoom

Eight requested viewports were used for all four public login screens and representative Plumber/Store/Admin authenticated screens, plus focused Plumber/Store registration sweeps. Overflow measurements and screenshots certify only the observed layout checks. Authenticated Customer remains blocked. Actual Chrome zoom at 80/100/125/150/200 percent was not automated: NOT TESTED — AUTOMATION LIMITATION.

## Network and console

Sanitized per-app network and console files are under network/. Initial retired Customer target was corrected with supported environment configuration. Intermittent localhost resets/timeouts and a Docker stop interrupted execution; recovered requests used verified loopback and a Chrome DNS mapping to IPv4. Warnings include deprecated RNW properties and catalog fallback. No transport failure is silently treated as a business-rule failure or PASS.

## Performance observations

Only ordinary local API/browser latency samples were collected. Backend warm requests and loopback diagnostic timings are in performance-observations.csv. No throughput, concurrency, percentile SLO, device performance, or production load claim is made.

## Prior defect retest, fixed, still open, regressions and new defects

All 20 previous defects have exactly one local classification in prior-defect-reconciliation.csv. 7 are FIXED locally; 8 STILL OPEN; 1 PARTIALLY FIXED; 4 NO LONGER APPLICABLE TO LOCAL EXECUTION. Every row also retains a separate NOT RETESTED remote status. Current new defects: 5. PASS → FAIL ledger deltas are flagged; environment and interface changes must be considered before treating them as source regressions.

| New defect | Severity | Problem |
| --- | --- | --- |
| LOCAL-CUSTOMER-OTP-001 | High | Ten-digit OTP login is rejected by backend phone format |
| LOCAL-PLUMBER-START-001 | High | Materials Required changes local state without starting backend work |
| LOCAL-PLUMBER-PHOTO-001 | High | Required after-photo step cannot be completed |
| LOCAL-CUSTOMER-CATALOG-001 | Medium | API failure silently substitutes static sellable catalog entries |
| LOCAL-A11Y-STORE-001 | Medium | Authenticated Store view has focus and contrast violations |

## Blocked and not tested

Every omitted execution is explicit in blocked-tests.csv or not-tested.csv. Major blockers are Customer OTP, Plumber start synchronization/photo capture, interrupted transport, and unavailable features. Untested cases include exhaustive field mutation permutations, rate-limit thresholds, real token expiry, full screen-reader use, true zoom, remote redeployment and production load. No aggregate route PASS is substituted for those assertions.

## Coverage matrix and evidence reconciliation

Previous valid assertion/control rows: 709. Current accounted rows: 709. Unaccounted: 0. Previous defects: 20. Accounted previous defects: 20. Unaccounted: 0. Mock/fabricated PASS counted: 0.

## Readiness scores

Observed ledger PASS coverage: 34.1% (242/709, includes overlapping control granularity). This is an evidence coverage ratio, not a probability of production readiness. Static validation: 5/5 components pass the checks listed above. Full browser lifecycle certification: 0/1. Remote deployment certification in this local retest: 0/1.

## Secret hygiene

Plaintext local DB credential appeared in prior agent transcript: YES.
Credential included in final certification artifacts: NO.
JWT values stored in certification artifacts: NO.
Refresh-token values stored in certification artifacts: NO.
Temporary QA password stored in certification artifacts: NO.

The random QA password was passed through the container environment as requested and restored into process memory after interruption; it was never written to a QA credential file or displayed. Docker manages container environment metadata. Real application browser storage was created by actual logins, never manually seeded.

## Action plan

1. Fix Customer OTP phone normalization and retest genuine Customer login/session/address/checkout flows.
2. Persist backend work start before material creation in Plumber.
3. Implement the required photo capture/upload contract and complete the full browser lifecycle.
4. Fix remaining labels, ARIA semantics, focus/contrast and web feedback.
5. Retest unexecuted mutation/security/accessibility cases and separately certify deployed SHA/API routing/CORS.

## Evidence index and final verdict

Use evidence-index.md, artifact-classification.csv and manifest-sha256.csv. Historical files remain preserved; only current safe certification evidence is hashed into the manifest.

**NOT READY — MAJOR DEFECTS REMAIN**
