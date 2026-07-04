# Phase 13D.1 Golden Path Blocker Fixes

## Executive summary
- Phase: `13D.1`
- Branch: `phase13a-local-staging-sms`
- Previous commit: `0937907`
- Assessment: golden path blockers are fixed at source and covered by focused regression tests.
- Production deployment remains `NO`.
- Cloud staging deployment remains `NO` until Phase 13D is rerun cleanly against restarted local services.

## Customer address 403 root cause and fix
- Root cause: `SecurityConfig` allowed only `GET /api/v1/users/me` before the broad admin-only `/api/v1/users/**` matcher, so authenticated customer requests to `POST /api/v1/users/me/addresses` were denied before reaching `UserAddressController`.
- Fix: added a narrow authenticated matcher for `/api/v1/users/me/addresses` and `/api/v1/users/me/addresses/**` before the admin-only user-management matcher.
- Ownership safety: address creation still uses `CurrentUser.require()` and assigns the persisted address to the authenticated user server-side.
- Regression: `UserEndpointSecurityTest` now proves anonymous address creation is rejected, customer self-address creation succeeds, and customer access to admin-only `/api/v1/users` remains forbidden.

## Store pack 409 root cause and fix
- Investigation: backend integration coverage showed `PATCH /api/v1/checkout/orders/{id}/pack` transitions `PACKING -> READY_FOR_PICKUP` without duplicate constraint errors in the current code path.
- Verified behavior: `StorePartnerIntegrationTest` covers accept, pack, handover, invalid transitions, and unauthorized customer access.
- Result: the duplicate constraint symptom was not reproduced in backend tests after the product-order list mismatch was fixed; pack and handover are green in the targeted suite.

## Store app product-order list fix
- Root cause: store app order listing used `/api/v1/orders/status/{status}`, which is the service-order endpoint, while detail/actions used product-order checkout endpoints.
- Backend fix: added `GET /api/v1/checkout/orders/status/{status}` for `STORE_MANAGER` and `ADMIN` users.
- Authorization behavior: store managers see only product orders for stores they manage; admins can see all product orders with the requested status; customers are forbidden.
- Store app fix: `store-app` now lists product orders from `/checkout/orders/status/CONFIRMED` and maps the checkout response shape through the existing product-order mapper.

## Admin login Failed to fetch root cause and fix
- Root cause: local admin portal runs on `http://localhost:3101`, but backend CORS defaults and local-staging properties did not allow that origin.
- Fix: added `http://localhost:3101` plus local Expo web ports `19007`, `19008`, and `19009` to local CORS configuration.
- Regression: `UserEndpointSecurityTest` now verifies an admin-portal preflight request from `http://localhost:3101` receives `Access-Control-Allow-Origin: http://localhost:3101`.
- Note: live backend on `8081` must be restarted to pick up the updated local-staging CORS configuration before rerunning browser login.

## Backend tests
- Focused security test before fix: failed as expected with authenticated address creation returning `403`.
- Focused store list test before fix: failed as expected because `/api/v1/checkout/orders/status/CONFIRMED` was not implemented.
- Focused blocker suite: `16` tests, `0` failures, `0` errors.
- Full backend suite: `208` tests, `0` failures, `0` errors, `0` skipped.

## Admin / customer / plumber / store checks
- Admin portal: `npm run build` passed; `npm test` passed (`2/2`). Next.js emitted a post-build standalone trace-copy warning after successful route generation.
- Customer app: `npm run typecheck` passed; `npm test` passed (`2/2`); `npx expo export --platform web` passed.
- Plumber app: `npm run typecheck` passed; `npm test` passed (`3/3`); `npx expo export --platform web` passed.
- Store app: `npm run typecheck` passed; `npm test` passed (`6/6`); `npx expo export --platform web` passed with the existing missing favicon warning.

## Targeted golden path rerun status
- Customer address: fixed by backend authorization test; live local backend requires restart before browser rerun.
- Store accept: backend integration pass.
- Store pack: backend integration pass.
- Store handover: backend integration pass.
- Delivery OTP: unchanged in this phase; previously passed in Phase 13D.
- Store list: fixed by backend endpoint test and store-app endpoint wiring.
- Admin login: CORS root cause fixed and preflight covered by test; live local backend requires restart before browser rerun.

## Safety checks
- Log scan: no obvious JWT, bearer token, OTP, password, or test phone leakage found in scanned runtime log files.
- Source URL scan: app API and Edge defaults remain local; external URLs found are image/font assets.
- Secret safety: no real secrets were added.

## Remaining blockers
- Restart local backend with `SPRING_PROFILES_ACTIVE=local-staging` so updated CORS and endpoint code are active on `8081`.
- Rerun the full Phase 13D browser-driven local golden path.
- Confirm admin credentialed browser login, customer address creation, store list visibility, store pack, and handover against the restarted runtime.
- Production remains `NO`.

## Final recommendation
- Ready to rerun Phase 13D locally after restarting backend and store/admin app sessions.
- Do not proceed to cloud staging until the rerun passes cleanly.
- Do not deploy production.