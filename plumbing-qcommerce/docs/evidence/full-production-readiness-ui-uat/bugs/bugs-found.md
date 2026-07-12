# Full Production Readiness UI UAT — Bugs Found

## BUG-UI-001
- App: `customer-app`
- Role: `CUSTOMER`
- Screen: `Login`
- Flow step: `Authentication`
- Steps to reproduce:
  1. Open `http://localhost:19106`
  2. Enter `5555555601`
  3. Click `Send OTP`
- Expected result: Customer proceeds to an OTP verification or equivalent login step backed by the Render backend.
- Actual result: UI stays on the login screen and the backend request returns `404`.
- Backend request observed: `POST https://plumbing-qcommerce.onrender.com/api/v1/auth/send-otp`
- Response status: `404`
- Screenshot path: `docs/evidence/full-production-readiness-ui-uat/customer-app/003-after-send-otp.png`
- Severity: `Critical`
- Blocking production: `YES`
- Blocking E2E: `YES`
- Suggested fix: Restore the customer auth flow to a real supported path for staging/production. Either expose the verified email/password staging path again or wire the current OTP UI to a real backend endpoint that exists.

## BUG-UI-002
- App: `customer-app`
- Role: `CUSTOMER`
- Screen: `Login`
- Flow step: `Authentication`
- Steps to reproduce:
  1. Open `http://localhost:19106`
  2. Inspect the available login controls
- Expected result: A working login method for the seeded staging customer should be reachable through the real UI.
- Actual result: UI exposes only OTP and Google buttons plus non-production demo shortcuts; no reachable seeded email/password login path was surfaced in this capture.
- Backend request observed: `POST https://plumbing-qcommerce.onrender.com/api/v1/auth/send-otp`
- Response status: `404`
- Screenshot path: `docs/evidence/full-production-readiness-ui-uat/customer-app/001-login-screen.png`
- Severity: `High`
- Blocking production: `YES`
- Blocking E2E: `YES`
- Suggested fix: Restore a first-class customer login path compatible with the seeded staging account, or fully implement and verify OTP/Google flows.

## BUG-UI-003
- App: `plumber-app`
- Role: `PLUMBER`
- Screen: `Login`
- Flow step: `Authentication`
- Steps to reproduce:
  1. Open `http://localhost:19107`
  2. Switch to `Use Staging Email / Password`
  3. Enter `plumber@plumbcommerce.com / password`
  4. Click `Login`
- Expected result: Stable transition to the authenticated dashboard every time.
- Actual result: Backend login succeeds and dashboard data can load, but login-state behavior was inconsistent across audit runs, indicating an unstable auth transition.
- Backend request observed:
  - `POST https://plumbing-qcommerce.onrender.com/api/v1/auth/login`
  - `GET https://plumbing-qcommerce.onrender.com/api/v1/users/me`
  - `GET https://plumbing-qcommerce.onrender.com/api/v1/wallet`
  - `GET https://plumbing-qcommerce.onrender.com/api/v1/orders/plumber`
- Response status: `200`
- Screenshot path: `docs/evidence/full-production-readiness-ui-uat/plumber-app/003-after-login-click.png`
- Severity: `High`
- Blocking production: `YES`
- Blocking E2E: `YES`
- Suggested fix: Stabilize post-login auth state persistence/navigation in the plumber app and add automated regression coverage around successful login-to-dashboard transition.

## BUG-UI-004
- App: `store-app`
- Role: `STORE_MANAGER`
- Screen: `Orders / Materials`
- Flow step: `Fulfillment`
- Steps to reproduce:
  1. Open `http://localhost:19108`
  2. Log in as `store@plumbcommerce.com`
  3. Visit `Orders`, `Inventory`, and `Materials`
- Expected result: Real order/material request data should be visible when downstream flows create them.
- Actual result: Dashboard and tabs load, but all order counts are zero and materials show `No material requests in this state`, so store fulfillment could not be proven end-to-end.
- Backend request observed:
  - `GET https://plumbing-qcommerce.onrender.com/api/v1/checkout/orders/status/*`
  - `GET https://plumbing-qcommerce.onrender.com/api/v1/checkout/material-requests/store`
- Response status: `200`
- Screenshot path: `docs/evidence/full-production-readiness-ui-uat/store-app/004-orders.png`
- Severity: `High`
- Blocking production: `YES`
- Blocking E2E: `YES`
- Suggested fix: Ensure upstream customer/plumber flows can create real store-visible records, then verify fulfillment state transitions through the store UI.

## BUG-UI-005
- App: `admin-portal`
- Role: `ADMIN`
- Screen: `Local login`
- Flow step: `Developer/local staging parity`
- Steps to reproduce:
  1. Start local admin portal on `http://localhost:3101`
  2. Attempt superadmin login
- Expected result: Local admin portal should target the Render backend like deployed staging.
- Actual result: Local admin attempted `POST http://localhost:8081/api/v1/auth/login` and failed with `net::ERR_CONNECTION_REFUSED`.
- Backend request observed: `POST http://localhost:8081/api/v1/auth/login`
- Response status: `ERR_CONNECTION_REFUSED`
- Screenshot path: `docs/evidence/full-production-readiness-ui-uat/admin-portal/001-login-screen.png`
- Severity: `Medium`
- Blocking production: `NO`
- Blocking E2E: `NO`
- Suggested fix: Align local admin env/config with `NEXT_PUBLIC_API_BASE_URL=https://plumbing-qcommerce.onrender.com` for reproducible staging UAT.

## BUG-UI-006
- App: `customer-app`
- Role: `QA / Release`
- Screen: `Build gate`
- Flow step: `Pre-test validation`
- Steps to reproduce:
  1. Run `npm run typecheck`
  2. Run `npm test`
- Expected result: Typecheck and tests should pass before production-readiness signoff.
- Actual result:
  - Typecheck fails on missing spacing token `xxs`, `AnimatedBottomTabButton` prop typing, and missing `Alert` import.
  - Tests fail because the `react-native` mock does not expose `Animated`.
- Backend request observed: `N/A`
- Response status: `N/A`
- Screenshot path: `docs/evidence/full-production-readiness-ui-uat/network/customer-typecheck.log`
- Severity: `High`
- Blocking production: `YES`
- Blocking E2E: `NO`
- Suggested fix: Fix current TypeScript regressions and update test mocks for animated components.

## BUG-UI-007
- App: `plumber-app`
- Role: `QA / Release`
- Screen: `Build gate`
- Flow step: `Pre-test validation`
- Steps to reproduce:
  1. Run `npm test`
- Expected result: Tests should pass before production-readiness signoff.
- Actual result: `vitest` suite fails in `App.test.tsx`, so the current release gate is not green.
- Backend request observed: `N/A`
- Response status: `N/A`
- Screenshot path: `docs/evidence/full-production-readiness-ui-uat/network/plumber-test.log`
- Severity: `High`
- Blocking production: `YES`
- Blocking E2E: `NO`
- Suggested fix: Update the failing test expectations/mocks to match the current dashboard rendering.

## BUG-UI-008
- App: `store-app`
- Role: `QA / Release`
- Screen: `Build gate`
- Flow step: `Pre-test validation`
- Steps to reproduce:
  1. Run `npm run typecheck`
  2. Run `npm test`
- Expected result: Typecheck and tests should pass before production-readiness signoff.
- Actual result:
  - Typecheck fails on missing color tokens (`surface`, `error`, `errorLight`), spacing token `xxs`, and `safeAreaStyle` prop mismatch.
  - Tests fail because the `react-native` mock does not expose `Animated`.
- Backend request observed: `N/A`
- Response status: `N/A`
- Screenshot path: `docs/evidence/full-production-readiness-ui-uat/network/store-typecheck.log`
- Severity: `High`
- Blocking production: `YES`
- Blocking E2E: `NO`
- Suggested fix: Repair theme typings/props and update test mocks for animated controls before release.

## BUG-UI-009
- App: `store-app`
- Role: `QA / Release`
- Screen: `Build gate`
- Flow step: `Pre-test validation`
- Steps to reproduce:
  1. Run `npm run build`
- Expected result: Clean build without missing asset warnings.
- Actual result: Build exports, but warns that `./assets/favicon.png` does not exist.
- Backend request observed: `N/A`
- Response status: `N/A`
- Screenshot path: `docs/evidence/full-production-readiness-ui-uat/network/store-build.log`
- Severity: `Low`
- Blocking production: `NO`
- Blocking E2E: `NO`
- Suggested fix: Add the configured favicon or remove the stale config reference.
