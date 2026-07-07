# Phase 14G Mobile E2E UAT Report

## Scope
This report covers the local Phase 14G wiring needed to move mobile staging away from silent backend gaps and toward a real customer ? plumber ? store path.

## Previous Commit Used
- `0da655c`

## Files Changed
### Backend
- `backend/src/main/java/com/pqc/core/controller/CheckoutController.java`
- `backend/src/main/java/com/pqc/core/controller/StoreController.java`
- `backend/src/main/java/com/pqc/core/repository/ProductOrderRepository.java`
- `backend/src/main/java/com/pqc/core/service/StoreService.java`
- `backend/src/main/java/com/pqc/core/config/StagingMobileE2eDataSeeder.java`

### Customer app
- `customer-app/src/services/orders/orderRepository.ts`
- `customer-app/src/screens/HomeScreen.tsx`

### Plumber app
- `plumber-app/src/services/jobs/jobService.ts`

### Store app
- `store-app/src/screens/profile/StoreProfileScreen.tsx`
- `store-app/src/services/api/endpoints.ts`
- `store-app/src/services/store/storeService.ts`
- `store-app/src/services/inventory/inventoryService.ts`
- `store-app/src/services/orders/ordersService.ts`
- `store-app/src/services/orders/materialRequestService.ts`

## Commands Run
### Backend
- `./mvnw.cmd "-Dtest=StorePartnerIntegrationTest,PlumberMaterialIntegrationTest" test`
- Result: BLOCKED — local Java runtime unavailable/incomplete in this environment

### Customer app
- `npm run typecheck` — PASS
- `npm test` — PASS (`4` files, `8` tests)
- `npm run build` — PASS

### Plumber app
- `npm run typecheck` — PASS
- `npm test` — PASS (`3` files, `7` tests)
- `npm run build` — PASS

### Store app
- `npm run typecheck` — PASS
- `npm test` — PASS (`3` files, `10` tests)
- `npm run build` — PASS
- Known warning: missing `./assets/favicon.png` in Expo web config

## Live Staging Smoke Baseline
Current remote staging before these Phase 14G changes are deployed:
- `https://plumbing-qcommerce.onrender.com/health/live` — PASS (`UP`)
- `customer@plumbcommerce.com / password` — PASS
- `plumber@plumbcommerce.com / password` — PASS
- `store@plumbcommerce.com / password` — PASS

## UAT Result by App
### Customer
- Auth baseline: PASS
- Real material-request discovery from backend: implemented locally
- Real material approval action: uses existing backend confirm/release endpoints
- Final result: PARTIAL until backend changes are deployed and verified remotely

### Plumber
- Incoming job fetch now mapped to real backend service-order payload
- Accept/start/complete job actions now mapped to real backend payloads
- Material request create path remains real
- Final result: PARTIAL until backend changes are deployed and verified remotely

### Store
- Current store profile now uses `/stores/me`
- Inventory now resolves against `/stores/me/inventory`
- Material requests now use real backend list/action endpoints
- Orders view now loads multiple real backend statuses instead of only confirmed orders
- Final result: PARTIAL until backend changes are deployed and verified remotely

## Remaining Blockers
- backend Maven validation could not run locally due broken JDK install
- changes are not pushed yet, so GitHub Actions has not validated this patch set
- Render staging has not redeployed these backend changes yet
- store handover still depends on delivery partner resolution
- wallet / analytics / saved cards / availability persistence remain incomplete

## Final Verdict
- CUSTOMER APP STAGING UAT: PARTIAL
- PLUMBER APP STAGING UAT: PARTIAL
- STORE APP STAGING UAT: PARTIAL
- MOBILE STAGING READY: PARTIAL
- PRODUCTION READY: NO
