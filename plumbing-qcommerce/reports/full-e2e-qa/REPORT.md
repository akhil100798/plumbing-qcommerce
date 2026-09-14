# FIXKART COMPLETE END-TO-END QA, SECURITY & PRODUCTION READINESS REPORT

## 1. Executive summary

**Release recommendation: BLOCKED — ENVIRONMENT PREVENTED COMPLETE CERTIFICATION.** FixKart is not professionally certified for production by this audit. Public applications were exercised in real Google Chrome, and the intended backend was tested with bounded live requests. No authenticated browser session or full customer → plumber → store lifecycle completed. A rendered login page is not counted as a functional login PASS.

The intended backend is healthy after a long cold start and matches Development-2 HEAD. Customer login is blocked by trusted-origin CORS rejection. Plumber, store, and the discovered repository admin deployment still attempt the retired backend. The public mobile-web aliases are older than HEAD, and the latest admin build failed. The only historical repository QA credential value tried is rejected by the intended backend. Missing input names and several silent public controls were independently reproduced.

The consolidated scope contains **646 checks: 143 PASS, 29 FAIL, 449 BLOCKED, 19 NOT TESTED, 6 NOT APPLICABLE**. These are assertion-level checks, not unique defects. Many blocked rows are distinct required business assertions behind the same prerequisite. Exhaustive authenticated coverage was not possible. The detailed CSVs preserve these omissions instead of certifying them.

| Area | Pass | Fail | Blocked | Not tested | N/A |
|---|---:|---:|---:|---:|---:|
| Customer | 13 | 3 | 113 | 1 | 3 |
| Plumber | 6 | 9 | 78 | 0 | 2 |
| Store | 3 | 4 | 63 | 0 | 1 |
| Admin | 3 | 2 | 87 | 0 | 0 |
| Integration | 0 | 0 | 42 | 0 | 0 |
| Backend/API | 24 | 0 | 15 | 0 | 0 |
| Security | 24 | 4 | 36 | 5 | 0 |
| Accessibility | 6 | 7 | 7 | 6 | 0 |
| Responsive | 64 | 0 | 8 | 7 | 0 |

See [case checklist](coverage-cases.csv), [module coverage matrix](coverage-matrix.csv), [control outcomes](control-coverage.csv), [runtime control inventory](runtime-control-inventory.csv), and [source screen inventory](source-screen-inventory.csv). The latter contains 115 source screen/page files at local HEAD; it is planning evidence, not proof those screens are in the older deployed clients. The control outcome table maps 63 public control/state entries to explicit results. Runtime inventory contains repeated control observations across states, not 251 unique controls. The checklist was consolidated after runtime exploration.

## 2. Environment

| Target | URL / revision |
|---|---|
| Customer | https://fixkart-customer-web.vercel.app/ — production alias SHA cf3fab03ba22ff8b7be03ff89c167373ebd1a137 |
| Plumber | https://fixkart-plumber-web.vercel.app/ — same production SHA cf3fab03 |
| Store | https://fixkart-store-web.vercel.app/ — same production SHA cf3fab03 |
| Verified repository admin | https://admin-portal-ten-weld.vercel.app/ — production metadata SHA 99a190577a61df168f208ad30e683dd7431754bc, branch phase13a-local-staging-sms, dirty-build flag |
| Runbook admin URL | https://fixkart-admin.vercel.app/ — redirects to a Clerk development sign-in; not used for admin-role certification |
| Intended backend | https://plumbing-qcommerce.onrender.com — 1.0.0, Development-2, 618a8181b165644013422a217bb5dc2ff66b9209 |
| Expected/local SHA | 618a8181b165644013422a217bb5dc2ff66b9209; initial checkout clean |
| Runtime profile | Render startup logs explicitly say staging; QA seed completion observed |
| Browser | Installed Google Chrome 152.0.7977.84, headless, controlled by Playwright 1.62.1 on Windows |
| Dates | 2026-09-13, approximately 15:48–16:11 UTC / 21:18–21:41 IST |
| Viewports | 360×800, 390×844, 412×915, 768×1024, 1024×768, 1366×768, 1440×900, 1920×1080 |

Evidence: [deployment metadata and startup excerpts](deployment-evidence.json), [baseline](2026-09-13T15-49-28-895Z/baseline.json). Google Chrome UI, accessibility tree, screenshots, and browser request/console events were used; the DevTools panel itself was not manually operated. The unavailable agent-browser CLI was replaced with installed Playwright controlling actual Chrome. Browser code only observed state, changed browser viewport/media/network conditions, and injected the axe test engine; it did not inject authentication or fake application state.

## 3. Application health

| Request | Attempts | Final HTTP | Final response time | Result |
|---|---|---:|---:|---|
| /version | Two 90-second request timeouts; third succeeded | 200 | 77,663 ms | version 1.0.0 / branch and SHA match |
| /health/live | First attempt after recovery | 200 | 859 ms | UP |
| /health/ready | First attempt after recovery | 200 | 840 ms | UP |
| Warm /version | Later repeat | 200 | 319 ms | stable SHA |
| Warm /health/ready | Later repeat | 200 | 393 ms | UP |

Render logs report startup in 227.096 seconds (241.321 seconds process runtime). The initial outage recovered: it is a cold-start observation, not an ongoing product outage. An earlier harness used an invalid request-context reference and sent no health requests; its local exception is excluded from backend defect evidence.

## 4. Role coverage

[Role matrix](role-matrix.csv) lists CUSTOMER, PLUMBER, STORE_MANAGER, ADMIN, SUPER_ADMIN, OPERATIONS_ADMIN, PLUMBER_MANAGER, FINANCE_ADMIN, SUPPORT_ADMIN, and MARKETING_ADMIN. Source enum and staging seeder logs establish investigation scope and seeded identities. **No role was authenticated in the deployed UI or through the intended backend using the available historical QA credential.** Therefore landing pages, allowed/forbidden navigation, authenticated APIs, profile, session restore, logout, and post-logout protection remain BLOCKED for all ten roles. Anonymous 401 tests do not substitute for these boundaries. DELIVERY_PARTNER exists in source but is outside the requested self-pickup scope.

## 5. Customer app

- **Authentication:** onboarding Skip and first Next transition work; login rejects blank fields via a native dialog; Space activates the login button. Login submission targets the correct host but fails CORS. The root back arrow is inert. Google sign-in displays missing configuration instructions. Enter while in the password field produced no observed action; no keyboard-submit guarantee is claimed.
- **Registration:** opens and returns to login through its link and arrow. Blank name, missing/malformed email, and invalid phone produce validation dialogs. A password probe was intercepted by phone validation, so password length/mismatch are not passed. Registration persistence/duplicate account are blocked. Customer OTP is explicitly deferred in the deployed copy.
- **Home, catalog, UI search, product detail, services, booking, cart, checkout, orders, tracking, profile, addresses, support, and logout:** BLOCKED behind login. Public catalog API checks are reported separately and do not pass these UI features.
- **Offline/error handling:** a customer login attempt under browser offline mode produced Network Error, left the login screen in place, and created no authenticated state. One request attempt was captured for the offline double click; successful-login or business duplicate prevention remains untested.

## 6. Plumber app

- **Authentication:** Mobile/Email switch and Remember me visual toggles work. The exact Sign up text opens registration (clicking the surrounding sentence in an earlier harness did not; that harness miss is not a product defect). Blank/short mobile, blank email, and blank registration have no observable validation feedback. Forgot-password/Google/Facebook actions are inert. Email login targets the retired backend.
- **OTP:** Continue with the configured QA phone opens a screen claiming a code was sent without an initial send request. Wrong-code verification and resend are attempted against the retired backend and fail; no OTP correctness or expiry PASS is claimed. Back returns to login. Six OTP fields lack accessible names.
- **Registration:** form opens and returns to login; five fields lack names; persistence is blocked.
- **Dashboard, availability, jobs, incoming/active job, arrival, diagnosis, store selection, materials/approval/tracking/collection, resume/completion, earnings/wallet/history/profile/chat/logout:** BLOCKED.
- **Photos:** before/after screens are source-inventoried; runtime upload and backend contract are unverified behind authentication. This audit does not invent an upload success or assert a missing contract from absence of access.

## 7. Store app

Remember me changes visually, Register Store opens the nine-field form, and its return link works. Login targets the retired backend. Empty login and registration do not show useful validation feedback; the password-recovery action is inert. Nine registration fields lack accessible names. Invalid-coordinate entry occurred in an incomplete form, so it does not establish independent coordinate validation. All dashboard summaries, material request list/details/approval/rejection/partial approval/preparation/ready/collection, inventory/stock/product details, history, business screens, profile and logout remain BLOCKED.

## 8. Admin portal

An accessible repository deployment exists; **ENV-ADMIN-001 (not deployed/not accessible) is not asserted**. Its login is reachable at the Vercel-verified alias. Empty and malformed fields activate browser validity constraints. An unauthenticated /dashboard deep link returns the login surface without admin content. Authentication uses the retired backend and reports Failed to fetch. The latest Development-2 build failed; an older branch remains live. All admin modules and role restrictions are BLOCKED. The runbook Clerk page was observed only to resolve environment identity; no security probes or credential submissions were made to Clerk/Google.

## 9. Complete E2E workflow

**Final result: BLOCKED.** No service request was created. Customer request → assignment → acceptance → arrival → diagnosis → materials → store approval → preparation → ready → plumber collection → store confirmation → resumed work → completion → customer confirmation/rating is entirely blocked at authenticated entry. There are no fabricated order, material-request, or transition IDs. Actor/action/endpoint/status/old-state/new-state/persistence records cannot be supplied for transitions that did not occur. Each transition is separately listed in [blocked-tests.csv](blocked-tests.csv). No business data was modified.

## 10. Authentication

Direct backend empty login returns 400 with a concise validation error; missing/malformed bearer access to /auth/me returns 401. One attempt using the existing historical QA value for each of four seeded accounts returns 401 Invalid credentials. No password guessing continued. No JWT was fabricated or installed. Session restoration, refresh, token rotation/reuse, logout invalidation, expired real token, invalid signature derived from a real token, and post-logout access remain BLOCKED. Public-input type=password was observed; authenticated token-storage behavior was not observed.

## 11. Authorization

Fourteen anonymous protected GET probes returned 401, including admin metrics/RBAC/finance/operations/plumber-manager/marketing; plumber dashboard/earnings/profile/materials; store materials; checkout orders/customer materials; and notifications. Missing and malformed bearer /auth/me checks also reject. This proves only anonymous denial at the tested paths. Cross-customer/plumber/store IDOR, customer→plumber/store, plumber→inventory, store→admin, client role tampering and all admin least-privilege assertions remain BLOCKED. No authenticated unauthorized success or IDOR vulnerability was established.

## 12. Security

| ID / category | Affected role / endpoint | Severity | Evidence and recommendation |
|---|---|---|---|
| BUG-PROD-BACKEND-001 / CORS availability | Intended app roles / OPTIONS /api/v1/auth/login | High | Four intended origins receive 403. Configure explicit trusted origins; preserve external-origin rejection. |
| Wrong backend / release integrity | Plumber, Store, Admin / auth endpoints | High | Browser targets retired host. Correct build-time/runtime API target and deploy verified aliases. |
| Anonymous protection | Public actor / protected GET sample | Passed narrow check | 401 for every tested protected path; do not infer authenticated RBAC. |
| Input/SQL-error exposure | Public catalog search | Passed narrow check | Quote, SQL boolean string, script text, traversal text, template text, Unicode and 400-character probe return JSON empty lists, not DB errors. This is not comprehensive SQLi/XSS certification. |
| Arbitrary-origin CORS | OPTIONS with qa-untrusted.invalid Origin | Passed narrow check | 403, no credentialed allow-origin. The invalid domain was only an Origin header; no third-party request was made. |
| Header hardening | Verified public frontends | Observation | HSTS present; no CSP/X-Content-Type-Options/Referrer-Policy/Permissions-Policy/frame protection seen on the three mobile HTML responses. No exploit chain demonstrated; optional-header absence alone is not a defect. |
| Backend headers | Intended backend | Observation | HSTS, nosniff, DENY and no-store observed. |
| Tokens/session | Authenticated roles | BLOCKED | No successful token issue/storage/rotation/logout lifecycle to inspect. No token values in report. |
| Rate limiting | Login/OTP/reset | NOT TESTED | Small bounded sample only; no 429 was seen, which does not prove rate limiting absent. |

No confirmed BUG-SEC exploit is reported. Stored XSS, authenticated reflected XSS, and authenticated SQL/error probes remain blocked. Search JSON responses alone do not establish safe HTML rendering.

## 13. Network

In the selected canonical browser event logs: **9 failed requests across 4 distinct endpoint URLs**, **6 exploratory 404 document responses**, no observed 5xx. The four failed URLs are current-backend login, retired-backend login, retired verify-otp, and retired send-otp. Separate direct API preflight evidence has four unexpected intended-origin 403s and one expected untrusted-origin 403. No localhost traffic or request loop was observed in these samples. Counts exclude baseline navigation/discovery duplicates and the intentionally offline final test; see [counted events](network-console-summary.json).

The six 404s are repeated exploratory /orders, /jobs, and /inventory URLs. No runtime link generated those URLs and no deployed URL-routing contract was established, so **they are not promoted to confirmed SPA defects**. Their source-named screen counterparts remain blocked. Admin /dashboard resolves to a protected login surface.

## 14. Console

The same canonical logs contain 33 console error entries, 10 warnings, and zero captured pageerror events. Errors largely duplicate CORS/network resource failures and the exploratory 404s; these are not 33 distinct bugs. Warnings include React Native useNativeDriver fallback. No duplicate-key warning, mixed-content error, request loop, or uncaught page exception was observed in the tested public paths. No full authenticated console or unhandled-promise certification is claimed.

## 15. Accessibility

Axe WCAG A/AA checks cover customer login/registration, plumber email login/registration/OTP, store login/registration, and admin login. Missing-name findings: **20 nodes across three critical-impact rule instances** (store registration 9, plumber registration 5, OTP 6). Contrast findings: **2 serious-impact instances**, each 4.26:1. No moderate/minor automated violations were returned in the selected rules. Manual role/state and tab-cycle observations add BUG-A11Y-005.

Customer login/registration, store login, and admin login returned no axe violations in this rule set; that is not a full accessibility PASS. Public Tab/Shift+Tab focus was captured and native focus outlines were observed. Native dialogs were dismissed by the harness, so their focus trapping/restoration/Escape behavior was not manually certified. No screen-reader session or comprehensive touch-target/landmark audit was run. Reduced-motion media preference and animation state were recorded on the public suite; JavaScript-driven motion compliance is not established by an empty animation list.

## 16. Responsive

All **8 requested viewport sizes × 8 public form states = 64 horizontal-overflow checks passed** and have screenshots. The states are customer login/registration, plumber email login/registration/OTP, store login/registration, and admin login. The narrow store registration form scrolls vertically to its submit action. Representative screenshots were visually inspected; not every screenshot was individually reviewed for every possible overlap, contrast, sticky-element or safe-area issue. No horizontal-overflow defect was found by the captured DOM checks.

Authenticated screens, tables, cards, drawers and modals are BLOCKED. Onboarding and mobile-login variants were not separately swept at all eight sizes. **Actual Chrome zoom at 80/100/125/150/200 percent was NOT TESTED**; viewport emulation is not represented as browser zoom. No BUG-RESPONSIVE issue is asserted from the available evidence.

## 17. Data integrity

Inventory, order, material-status, profile, address and rating persistence are BLOCKED. No mutation/relogin or cross-role persistence test occurred. Four product IDs were obtained from the live list, then their details were fetched and compared successfully with that same-run list. That is read consistency, not mutation persistence. No database write, seed script, account creation, inventory adjustment, or role change was performed by this audit.

## 18. Performance observations

Cold start took roughly 4 minutes 20 seconds of bounded retry time and recovered. Warm sampled health/version responses were 319–393 ms; public catalog detail responses were 407–560 ms; search samples 362–617 ms. The anonymous role-gate sample included a 1,751 ms first response, with most following calls around 277–373 ms. No >3-second warm API response appears in the final public/security sample. This is not load testing, a percentile SLA, Web Vitals, or authenticated rendering performance certification. Public QA products have null imageUrl; actual catalog image UX could not be inspected behind login. No authoritative bundle optimization finding is made.

## 19. UX review

Customer has useful registration dialogs but a dead root back affordance and developer-facing Google configuration copy. Plumber/store lack visible validation feedback in several public paths; password-recovery/social controls appear actionable but do nothing. Plumber OTP overstates dispatch success. Admin retains older PlumbCommerce branding and an obsolete backend target; branding differences are observed, not treated as aesthetic defects. Session, destructive-confirmation, business loading/empty-state, and cross-role terminology UX remain blocked.

## 20. Defect summary

**20 open items including environment/data blockers:** Critical 0; High 10; Medium 6; Low 4. These severity totals are separate from axe impact categories and from failed-check counts. Environment mismatch and unavailable QA credentials are not represented as backend business-logic bugs.

## 21. Defect table

| ID | Application | Module | Title | Severity | Priority | Status |
|---|---|---|---|---|---|---|
| BUG-PROD-BACKEND-001 | Backend | CORS | Trusted application origins rejected by login preflight | High | P0 | OPEN |
| BUG-PROD-PLUMBER-001 | Plumber | Authentication/backend configuration | Deployed client sends authentication to retired backend | High | P0 | OPEN |
| BUG-PROD-STORE-001 | Store | Authentication/backend configuration | Deployed client sends authentication to retired backend | High | P0 | OPEN |
| BUG-PROD-ADMIN-001 | Admin | Authentication/backend configuration | Deployed client sends authentication to retired backend | High | P0 | OPEN |
| BUG-PROD-CUSTOMER-001 | Customer | Google authentication | Enabled Google button exposes missing-config instructions | Low | P2 | OPEN |
| BUG-PROD-CUSTOMER-002 | Customer | Login navigation | Login back arrow has no observable destination | Low | P3 | OPEN |
| BUG-PROD-PLUMBER-002 | Plumber | Form validation | Invalid and empty authentication forms provide no feedback | Medium | P1 | OPEN |
| BUG-PROD-STORE-002 | Store | Form validation | Empty and partial login/registration forms fail silently | Medium | P1 | OPEN |
| BUG-PROD-PLUMBER-003 | Plumber | OTP | OTP screen claims a code was sent without an initial send request | Medium | P1 | OPEN |
| BUG-PROD-PLUMBER-004 | Plumber | Public auth actions | Forgot-password and social controls give no feedback | Low | P2 | OPEN |
| BUG-PROD-STORE-003 | Store | Password recovery | Forgot Password control gives no feedback | Low | P2 | OPEN |
| BUG-A11Y-001 | Store | Registration | Nine registration inputs have no accessible names | High | P1 | OPEN |
| BUG-A11Y-002 | Plumber | Registration | Five registration inputs have no accessible names | High | P1 | OPEN |
| BUG-A11Y-003 | Plumber | OTP | Six OTP inputs have no accessible names | High | P1 | OPEN |
| BUG-A11Y-004 | Plumber | Login/OTP contrast | Small supporting text falls below 4.5:1 contrast | Medium | P2 | OPEN |
| BUG-A11Y-005 | Plumber | Interactive semantics | Tabs and remember control lack roles/state; Sign up is absent from tab loop | Medium | P1 | OPEN |
| ENV-DEPLOY-001 | Backend | Release alignment | Public mobile-web aliases are behind backend and repository HEAD | High | P1 | OPEN |
| ENV-ADMIN-002 | Admin | Deployment | Development-2 admin build failed; old branch remains live | High | P1 | OPEN |
| ENV-ADMIN-003 | Admin | Environment documentation | Runbook admin URL points to a different authentication surface | Medium | P2 | OPEN |
| DATA-AUTH-001 | Backend | QA credentials | Repository QA fallback does not authenticate live seeded accounts | High | P1 | OPEN |

Every item has preconditions, reproduction, expected/actual result, evidence, frequency, impact, suggested direction and regression risk in [defects.md](defects.md). Findings have not been fixed or retested as fixed.

## 22. Security findings table

The table in section 12 is the security findings/observations register. No authenticated boundary or exploit receives PASS from source analysis. CORS over-restriction and obsolete destinations are release-blocking integration/configuration findings, not demonstrated data-exfiltration vulnerabilities. Absence of a confirmed exploit is not security certification.

## 23. Blocked tests

[blocked-tests.csv](blocked-tests.csv) explicitly lists **449 assertions** with the blocking reason. Core prerequisites are BUG-PROD-BACKEND-001, the three retired-target defects, ENV-DEPLOY-001, ENV-ADMIN-002, and DATA-AUTH-001. Blocked coverage includes all authenticated customer/plumber/store/admin workflows, supported roles' permissions, persistence, session lifecycle, mutation validation, concurrency, business state machine and full cross-app self-pickup flow. Optional post-auth features cannot be declared N/A until their deployed availability is observed.

## 24. Not tested

[not-tested.csv](not-tested.csv) lists 19 explicit gaps: actual browser zoom; two public variants' full size sweeps; manual screen-reader session, full modal focus/escape, touch-target spacing and heading/landmark audit; rate-limit thresholds and reset/OTP abuse controls; CSP exploitation path; customer Enter-submit contract. Native app/device testing, video/HAR capture, formal load testing and database inspection were also not performed. Password validators hidden behind earlier phone validation were not certified. Successful registration, duplicate accounts and authenticated input edge cases remain blocked, not silently passed.

The original public-suite plumber run navigated to OTP with a prefilled number; its subsequent hidden-login selector errors are harness errors, not product failures. A corrected run explicitly cleared the mobile field and retested login. Final-controls initially timed out during the animated onboarding transition; the later customer run used verified Skip and completed its remaining checks. All artifacts are retained and caveats indexed.

## 25. Screenshot / evidence index

[evidence-index.md](evidence-index.md) enumerates 157 screenshots and all logs/reports/scripts. [manifest-sha256.csv](manifest-sha256.csv) records hashes of generated artifacts. Password fields are covered with bright magenta masks. JSON output omits passwords, JWTs, refresh tokens, authorization/cookie headers and secrets. No raw auth storage, HAR, trace ZIP, or video is provided. Timestamp folders are UTC. Prior repository QA reports were not recycled as current PASS evidence.

## 26. Production readiness scores

These are **conservative evidence-based certification scores**, not estimated reliability or a percentage of working features. Formula: 100 × passed scoped assertions / all applicable scoped assertions, with blocked/untested assertions earning zero. Equal-weight assertions mean counts such as viewport checks influence scores; these numbers cannot override release gates.

| Area | Evidence score /100 |
|---|---:|
| Customer | 10 |
| Plumber | 6 |
| Store | 4 |
| Admin | 3 |
| Integration | 0 |
| Backend/API | 62 |
| Security | 35 |
| Accessibility | 23 |
| Responsive | 81 |

## 27. Overall FixKart score

**22/100 evidence-based certification coverage** (143 / 640 applicable assertions). Most of the product remains unverified. This is not a measured product-quality score and must not be used as a release approval.

## 28. Release recommendation

**BLOCKED — ENVIRONMENT PREVENTED COMPLETE CERTIFICATION**

## 29. Release blockers

1. Customer origin rejected by intended backend CORS; no usable customer web login.
2. Plumber/store/admin deployed clients target the retired backend.
3. Approved release alignment is absent; admin HEAD build failed and old admin branch is live.
4. No usable approved QA credential was found to certify authenticated roles/APIs independently.
5. Required cross-role service/material self-pickup lifecycle and persistence remain unexecuted.
6. Plumber/store registration and OTP fields lack accessible names; required role entry paths cannot be accepted for assistive-technology users.

Cold start recovered and is not listed as a current outage blocker. Deferred payment/courier features and optional security headers are not invented release blockers.

## 30. Prioritized action plan

- **P0 — Immediate:** fix intended-origin CORS and the three obsolete frontend API targets. Verify requests from actual deployed aliases; do not relax CORS to arbitrary origins.
- **P1 — Before release:** fix/admin-build and align the approved deployment set; supply current staging QA credentials securely; fix form feedback and accessible names/semantics; correct OTP-dispatch messaging; then execute blocked role/business/security/persistence suites.
- **P2 — Next sprint:** restore or clearly disable password-recovery/social controls; fix contrast; update environment documentation; assess cold-start and header hardening in the intended hosting tier.
- **P3 — Improvement:** remove/fix root back affordance; complete zoom, manual accessibility, Web Vitals and broader browser/device coverage.

## 31. Retest plan

- **BUG-PROD-BACKEND-001:** Repeat the exact reproduction in [defects.md](defects.md). Verify: Explicitly trusted deployed origins receive a valid CORS preflight; browser can submit authentication. Then repeat related public login, session restore and role-denial regression checks; retain a fresh timestamped screenshot and sanitized response. Do not reuse this audit's FAIL evidence as a fixed-result PASS.
- **BUG-PROD-PLUMBER-001:** Repeat the exact reproduction in [defects.md](defects.md). Verify: Authentication targets https://plumbing-qcommerce.onrender.com/api/v1/auth/login. Then repeat related public login, session restore and role-denial regression checks; retain a fresh timestamped screenshot and sanitized response. Do not reuse this audit's FAIL evidence as a fixed-result PASS.
- **BUG-PROD-STORE-001:** Repeat the exact reproduction in [defects.md](defects.md). Verify: Authentication targets https://plumbing-qcommerce.onrender.com/api/v1/auth/login. Then repeat related public login, session restore and role-denial regression checks; retain a fresh timestamped screenshot and sanitized response. Do not reuse this audit's FAIL evidence as a fixed-result PASS.
- **BUG-PROD-ADMIN-001:** Repeat the exact reproduction in [defects.md](defects.md). Verify: Authentication targets https://plumbing-qcommerce.onrender.com/api/v1/auth/login. Then repeat related public login, session restore and role-denial regression checks; retain a fresh timestamped screenshot and sanitized response. Do not reuse this audit's FAIL evidence as a fixed-result PASS.
- **BUG-A11Y-001:** Repeat the exact reproduction in [defects.md](defects.md). Verify: Each input has a programmatically associated name. Then repeat related public login, session restore and role-denial regression checks; retain a fresh timestamped screenshot and sanitized response. Do not reuse this audit's FAIL evidence as a fixed-result PASS.
- **BUG-A11Y-002:** Repeat the exact reproduction in [defects.md](defects.md). Verify: Every input has a meaningful accessible name. Then repeat related public login, session restore and role-denial regression checks; retain a fresh timestamped screenshot and sanitized response. Do not reuse this audit's FAIL evidence as a fixed-result PASS.
- **BUG-A11Y-003:** Repeat the exact reproduction in [defects.md](defects.md). Verify: OTP digits have distinct names or a single clearly labeled code input. Then repeat related public login, session restore and role-denial regression checks; retain a fresh timestamped screenshot and sanitized response. Do not reuse this audit's FAIL evidence as a fixed-result PASS.
- **ENV-DEPLOY-001:** Repeat the exact reproduction in [defects.md](defects.md). Verify: Certification targets identify the same approved release, or an explicitly approved compatibility set. Then repeat related public login, session restore and role-denial regression checks; retain a fresh timestamped screenshot and sanitized response. Do not reuse this audit's FAIL evidence as a fixed-result PASS.
- **ENV-ADMIN-002:** Repeat the exact reproduction in [defects.md](defects.md). Verify: Approved Development-2 admin build is healthy and deployed. Then repeat related public login, session restore and role-denial regression checks; retain a fresh timestamped screenshot and sanitized response. Do not reuse this audit's FAIL evidence as a fixed-result PASS.
- **DATA-AUTH-001:** Repeat the exact reproduction in [defects.md](defects.md). Verify: Approved staging QA credentials establish the expected identities. Then repeat related public login, session restore and role-denial regression checks; retain a fresh timestamped screenshot and sanitized response. Do not reuse this audit's FAIL evidence as a fixed-result PASS.

After the blockers are corrected: authenticate all ten supported roles using approved accounts; obtain resource IDs from runtime responses; create a QA service in the customer UI; perform every plumber/store transition in order; attempt the wrong collection sequence and duplicate transitions only on that QA workflow; compare pre/post status in both apps and backend GETs; complete and rate; refresh and relogin to verify persistence. Repeat catalog/cart/address/stock validators and cross-account read-only IDOR probes using second configured QA accounts. Exercise actual photo-upload capability and all reachable business controls. Re-run accessibility, eight-size responsive checks and real Chrome zoom on authenticated screens. Publish a new certification decision only after these pass or receive explicitly reviewed exceptions.

## 32. Final verdict

**FixKart is not certified ready for production.** The intended backend is alive and provides coherent public catalog responses, but the deployed ecosystem has confirmed authentication integration failures, stale client/admin deployments, inaccessible form fields, and unverified role/business flows. This report is an evidence-backed blocked QA audit, not a completed end-to-end acceptance certificate. Application code and deployment settings remain unchanged.
