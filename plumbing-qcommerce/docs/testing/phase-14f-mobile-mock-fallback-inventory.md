# Phase 14F Mobile Mock Fallback Inventory

## Executive Summary

Phase 14F Step 1 inventories mock fallback, fake data, timeout simulation, local-only defaults, and incomplete real API usage across `customer-app`, `plumber-app`, and `store-app`.

Search terms used:

```text
mock, fallback, fake, dummy, sample, demo, hardcoded, setTimeout, Alert.alert, TODO, FIXME, localhost, 127.0.0.1, 8081, 8080, catch, placeholder, static data, offline data, test data
```

This step makes no functional code changes. It documents where staging can still drift away from the live Render backend.

## Total Findings By App

| App | Findings |
|---|---:|
| `customer-app` | 12 |
| `plumber-app` | 15 |
| `store-app` | 17 |
| **Total** | **44** |

## Total Findings By Priority

| Priority | Meaning | Count |
|---|---|---:|
| `P0` | Blocks real staging UAT or silently replaces backend with fake data | 9 |
| `P1` | Important app flow still depends on mock data | 17 |
| `P2` | Cosmetic placeholder or safe local-only demo data | 10 |
| `P3` | Documentation/example/mock test fixture only | 8 |

## Customer App Findings

| # | File | Type | Current Behavior | Risk | Priority | Recommended Fix | Action |
|---|---|---|---|---|---|---|---|
| C1 | `customer-app/src/services/apiClient.ts:4` | Localhost default backend | Falls back to `http://localhost:8081` if env vars are absent | Can accidentally target local backend during staging smoke | `P2` | Keep only for local dev and add staging startup assertion when env is blank | gate behind dev-only flag |
| C2 | `customer-app/src/services/plumbers/plumberRepository.ts:5` | Localhost edge fallback | Uses `EXPO_PUBLIC_EDGE_URL` or falls back to `http://localhost:3000` | Nearby-plumber dispatch can silently target local edge | `P1` | Disable edge features when URL is blank in staging; avoid localhost fallback in non-dev | gate behind dev-only flag |
| C3 | `customer-app/src/screens/HomeScreen.tsx:32` | Localhost edge fallback | Screen-level edge URL also defaults to `http://localhost:3000` | Order broadcast/tracking can diverge from staging backend behavior | `P1` | Reuse centralized edge config and fail closed when edge URL is absent | replace with real API |
| C4 | `customer-app/src/screens/auth/SplashScreen.tsx:31` | Placeholder user id | Seeds session state with `id: 999` before resolving `/users/me` | Can mask auth/session bugs and create incorrect user assumptions | `P1` | Remove placeholder identity; bootstrap only from persisted token + `/users/me` | remove |
| C5 | `customer-app/src/services/profile/profileRepository.ts:31` | Mock stats and saved cards | Returns `Promise.resolve(...)` for wallet/order stats and saved cards | Profile appears functional even when backend data is missing | `P1` | Add real profile/stats endpoints or show empty/error states | replace with real API |
| C6 | `customer-app/src/screens/ProductListingScreen.tsx:36` | Product list fallback mockup | On fetch failure, injects hardcoded product catalog rows | Silently replaces backend catalog with fake merchandise | `P0` | Remove fallback dataset and render explicit error/retry UI | remove |
| C7 | `customer-app/src/screens/ProductDetailsScreen.tsx:39` | Product detail fallback mockup | On fetch failure, falls back to hardcoded product detail behavior | Users can complete staging browsing against fake product data | `P0` | Remove fallback and show real API error state | remove |
| C8 | `customer-app/src/screens/MaterialApprovalScreen.tsx:20` | Hardcoded material request + timeout simulation | Uses `mockMaterials` and `setTimeout` to simulate approval/payment | Material flow is fully fake and blocks real service-order UAT | `P0` | Replace with live material-request/payment state from backend | replace with real API |
| C9 | `customer-app/src/screens/PlumberConfirmationScreen.tsx:45` | Demo/dev fallback | Contains explicit demo fallback path after assignment failure | Service booking confirmation may look successful without backend proof | `P1` | Replace with real polling/error state and restrict demo path to dev only | gate behind dev-only flag |
| C10 | `customer-app/src/screens/PlumberTrackingScreen.tsx:30` | Simulated material-request CTA | Exposes `Simulate Material Request (Demo)` action | Encourages testers to continue through fake service flow | `P2` | Remove from staging builds or gate behind hidden dev switch | gate behind dev-only flag |
| C11 | `customer-app/src/screens/PaymentMethodsScreen.tsx:66` | Mock payment-method mutation | Contains mock card add flow with success alert | Wallet/payment methods can appear editable without backend persistence | `P2` | Replace with real card API or disable editing in staging | replace with real API |
| C12 | `customer-app/src/screens/ChatScreen.tsx:60`, `customer-app/src/screens/PaymentScreen.tsx:40`, `customer-app/src/screens/OrderTrackingScreen.tsx:56`, `customer-app/src/screens/ServiceCompletionScreen.tsx:30` | Timeout-based simulation | Uses `setTimeout` to simulate replies, payments, delivery confirmation, and completion | UI can imply completed flow without backend confirmation | `P2` | Convert to explicit API/websocket-driven state or mark as dev demo only | gate behind dev-only flag |

## Plumber App Findings

| # | File | Type | Current Behavior | Risk | Priority | Recommended Fix | Action |
|---|---|---|---|---|---|---|---|
| P1 | `plumber-app/src/services/api/axiosClient.ts:4` | Localhost default backend | Falls back to `http://localhost:8081` when env vars are absent | Can point staging smoke to local backend unexpectedly | `P2` | Keep for dev only and assert env presence in staging | gate behind dev-only flag |
| P2 | `plumber-app/src/services/websocket/websocketService.ts:4` | Localhost edge default | Falls back to `http://localhost:3000` for websocket gateway | Live job offers can silently come from local edge server | `P1` | Disable websocket-driven job flow when edge URL is absent in staging | gate behind dev-only flag |
| P3 | `plumber-app/src/services/auth/authService.ts:38` | Mock auth session and OTP success | Returns mock token/session for hardcoded phone + `123456` when API fails | Completely bypasses real staging auth guarantees | `P0` | Remove mock auth path from staging/non-dev builds | remove |
| P4 | `plumber-app/src/services/jobs/jobService.ts:25` | Mock job lifecycle | Replaces job fetch/accept/start/complete with `MOCK_JOB_*` or local transitions on failure | Core plumber workflow can pass staging UAT with no backend job state | `P0` | Replace all fallbacks with error states and real API-only transitions | replace with real API |
| P5 | `plumber-app/src/services/materials/materialService.ts:19` | Mock material catalog/request/status | Falls back to `MOCK_CATALOG`, fake request ids, and local status defaults | Material request flow can look successful without backend/store integration | `P0` | Require live catalog/material APIs; show explicit unavailable state otherwise | replace with real API |
| P6 | `plumber-app/src/services/profile/profileService.ts:22` | Mock profile/local sync | Returns `MOCK_PLUMBER` and local availability success on failure | Profile and availability state can drift from backend truth | `P1` | Replace with backend error state and retry | replace with real API |
| P7 | `plumber-app/src/services/wallet/walletService.ts:14` | Mock balance and transactions | Returns fake balance and `MOCK_TRANSACTIONS` on failure | Earnings/wallet appears funded even when API is broken | `P1` | Use empty/error states until wallet APIs are verified | replace with real API |
| P8 | `plumber-app/src/services/earnings/earningsService.ts:28` | Mock earnings stats | Returns fake earnings aggregates and mock transactions | Business metrics can falsely validate payout flows | `P1` | Back with real wallet/reporting endpoints or disable screen in staging | replace with real API |
| P9 | `plumber-app/src/screens/materials/MaterialApprovalStatusScreen.tsx:62` | Simulated approval path | Offers quick approval simulation for demo/testing | Bypasses customer approval and delivery lifecycle | `P1` | Remove simulation from staging; keep only hidden dev mode | gate behind dev-only flag |
| P10 | `plumber-app/src/screens/materials/MaterialTrackingScreen.tsx:51` | Auto-advance delivery simulation | Uses `setTimeout` and simulated delivery CTA | Material delivery can complete without backend/store events | `P1` | Replace with real order/delivery polling and explicit pending states | replace with real API |
| P11 | `plumber-app/src/screens/jobs/NavigationScreen.tsx:45` | Simulated coordinates | Hardcodes plumber latitude for navigation rendering | Map/navigation can appear live while location pipeline is missing | `P2` | Use device/GPS coordinates or show unavailable state | replace with real API |
| P12 | `plumber-app/src/screens/photos/BeforePhotosScreen.tsx:26`, `plumber-app/src/screens/photos/AfterPhotosScreen.tsx:25` | Simulated camera capture | Work photos are simulated instead of real camera/upload | Completion proof can be faked during staging walkthroughs | `P2` | Gate simulated capture to dev only or wire to real photo capture/upload | gate behind dev-only flag |
| P13 | `plumber-app/src/screens/profile/ProfileScreen.tsx:53` | Demo mode menu | Menu shows `Demo Mode` details alert | Profile section can appear feature-complete without data | `P2` | Replace with real detail screens or disable unavailable actions | replace with real API |
| P14 | `plumber-app/src/components/maps/RouteMap.tsx:73`, `plumber-app/src/components/maps/MapPreview.tsx:59` | Web map fallback view | Shows mock route/map fallback when maps native module is absent | Safe for web QA but not a real mobile map proof | `P3` | Keep as web/test fixture only and document as non-production | kept as test fixture only |
| P15 | `plumber-app/App.test.tsx:11`, `plumber-app/src/services/api/tokenStorage.test.ts:25`, `plumber-app/src/services/mocks/mockData.ts:3` | Test fixtures and mock dataset | Dedicated mock data and test-only module mocks | No production risk if kept scoped to tests/dev | `P3` | Keep scoped to tests and dev-only fixtures | kept as test fixture only |

## Store App Findings

| # | File | Type | Current Behavior | Risk | Priority | Recommended Fix | Action |
|---|---|---|---|---|---|---|---|
| S1 | `store-app/src/services/api/axiosClient.ts:4` | Localhost default backend | Falls back to `http://localhost:8081` when env vars are absent | Staging smoke can unintentionally hit local backend | `P2` | Keep for dev only and fail closed in staging | gate behind dev-only flag |
| S2 | `store-app/src/services/inventory/inventoryService.ts:40` | Mock inventory/catalog fallback | Uses `mockProducts`, `mockCategories`, dummy stock, and mock add/update flows when API is missing/fails | Store inventory can appear fully functional without backend | `P0` | Remove fallback datasets from staging and surface explicit API errors | replace with real API |
| S3 | `store-app/src/services/orders/ordersService.ts:48` | Mock order lifecycle | Falls back to `localOrders` for list/details/accept/pack/handover and has missing API branches | Core store fulfillment can pass staging with fake state transitions | `P0` | Replace with backend-only order transitions and explicit failures | replace with real API |
| S4 | `store-app/src/services/store/storeService.ts:12` | Mock profile/update fallback | Returns `mockStore` and local merges for update | Store identity/profile can be fake while app appears healthy | `P0` | Back with real store profile API or disable editing | replace with real API |
| S5 | `store-app/src/services/wallet/walletService.ts:15` | Mock wallet fallback | Uses `mockTransactions` and local withdrawal simulation on failure | Financial state can be fabricated during staging UAT | `P1` | Replace with read-only error state until wallet API is real | replace with real API |
| S6 | `store-app/src/services/notifications/notificationService.ts:14` | Mock notification fallback | Uses `mockNotifications` for list and read actions | Notification center can appear functional with no backend | `P1` | Replace with real API or empty/error states | replace with real API |
| S7 | `store-app/src/services/analytics/analyticsService.ts:18` | Mock analytics fallback | Uses fake sales metrics and top products | Analytics dashboard can mislead readiness decisions | `P1` | Back with real analytics endpoints or disable in staging | replace with real API |
| S8 | `store-app/src/services/dispatch/dispatchService.ts:7` | Always-mock riders | Returns `mockRiders` with TODOs for real backend hookup | Dispatch assignment never proves real delivery-partner integration | `P1` | Replace with live rider availability/assignment API | replace with real API |
| S9 | `store-app/src/services/orders/materialRequestService.ts:2` | Local mock material requests | Maintains `localMaterialRequests` rather than live store requests | Material request fulfillment can remain fake | `P1` | Replace with real material-request endpoints | replace with real API |
| S10 | `store-app/src/screens/auth/SplashScreen.tsx:24` | Dummy session recovery | Uses timeout simulation and dispatches dummy user for recovery | Can bypass real persisted session verification | `P1` | Bootstrap only from stored tokens and live `/users/me` | remove |
| S11 | `store-app/src/screens/auth/LoginScreen.tsx:35` | Test OTP disclosure | Shows `Test OTP code is 123456` success alert | Encourages fake OTP mental model even when live auth works | `P1` | Remove test OTP messaging from staging | remove |
| S12 | `store-app/src/screens/dashboard/DashboardScreen.tsx:13` | Mock store name in dashboard | Imports `mockStore` and renders fake store name | Dashboard identity can drift from actual logged-in store | `P1` | Bind header/store name to authenticated backend profile | replace with real API |
| S13 | `store-app/src/screens/profile/StoreProfileScreen.tsx:8` | Static business/bank/GST data | Displays `mockStore` and hardcoded business details via alerts | High trust surface can show fake merchant identity details | `P1` | Back with live profile data or hide until API is ready | replace with real API |
| S14 | `store-app/src/screens/reviews/ReviewsRatingsScreen.tsx:7`, `store-app/src/screens/offers/OffersPromotionsScreen.tsx:8` | Mock collections with delay | Uses `mockReviews` / `mockOffers` plus timeout simulation | Non-core modules look live without backend coverage | `P2` | Gate to dev only or disable in staging until APIs exist | gate behind dev-only flag |
| S15 | `store-app/src/screens/profile/AccountScreen.tsx:12` | Static partner info | Uses mock/static account/help/legal content | Low-risk but not proof of backend-backed account data | `P2` | Keep static informational content, but separate from profile truth | kept as test fixture only |
| S16 | `store-app/src/mocks/index.ts:3` | Central mock dataset | Large shared mock catalog/order/store/rider data backing many fallbacks | Necessary for dev/demo, but dangerous if reachable in staging flows | `P3` | Keep only behind explicit dev/test gating | kept as test fixture only |
| S17 | `store-app/App.test.tsx:14`, `store-app/src/services/api/tokenStorage.test.ts:25`, `store-app/.env.example:2` | Tests and dev examples | Test-only `vi.mock(...)` and localhost examples for dev setup | Acceptable when kept out of runtime staging code | `P3` | Keep as test/dev fixtures only | kept as test fixture only |

## P0 Fixes Required Before Mobile Staging Can Move From PARTIAL To READY

1. Remove customer catalog/material hardcoded fallback from:
   - `customer-app/src/screens/ProductListingScreen.tsx:37`
   - `customer-app/src/screens/ProductDetailsScreen.tsx:40`
   - `customer-app/src/screens/MaterialApprovalScreen.tsx:20`
2. Remove plumber mock auth and mock job/material lifecycle from:
   - `plumber-app/src/services/auth/authService.ts:38`
   - `plumber-app/src/services/jobs/jobService.ts:25`
   - `plumber-app/src/services/materials/materialService.ts:19`
3. Remove store mock inventory/order/profile fallback from:
   - `store-app/src/services/inventory/inventoryService.ts:40`
   - `store-app/src/services/orders/ordersService.ts:48`
   - `store-app/src/services/store/storeService.ts:12`

## P1 Fixes Recommended Before Production Readiness

- Disable localhost websocket/edge defaults in staging when `EXPO_PUBLIC_EDGE_URL` is blank
- Replace customer profile mock stats/cards with real API or empty/error states
- Remove plumber profile, wallet, earnings, and approval/delivery simulations
- Remove store wallet, notifications, analytics, dispatch, splash dummy user, dashboard mock name, and static profile fallbacks
- Replace test OTP messaging in store login with real backend-driven confirmation only

## P0 Implementation Result

- Inventory commit used: `e6841f5`
- P0 findings fixed: `9/9`
- P0 files changed:
  - `customer-app/src/services/mockPolicy.ts`
  - `customer-app/src/screens/ProductListingScreen.tsx`
  - `customer-app/src/screens/ProductDetailsScreen.tsx`
  - `customer-app/src/screens/MaterialApprovalScreen.tsx`
  - `plumber-app/src/services/mockPolicy.ts`
  - `plumber-app/src/services/auth/authService.ts`
  - `plumber-app/src/services/jobs/jobService.ts`
  - `plumber-app/src/services/materials/materialService.ts`
  - `store-app/src/services/mockPolicy.ts`
  - `store-app/src/services/inventory/inventoryService.ts`
  - `store-app/src/services/orders/ordersService.ts`
  - `store-app/src/services/store/storeService.ts`
- Mocks removed from staging runtime:
  - Customer catalog/product detail fake fallback data
  - Plumber fake OTP verification success and local job/material success paths
  - Store inventory/order/profile fake persistence and local success paths
- Mocks dev-gated:
  - All former P0 mock paths now require `EXPO_PUBLIC_ALLOW_MOCK_FALLBACKS=true` plus a local/dev backend URL
- Endpoints still missing or explicitly blocked in staging:
  - Customer material approval/payment backend flow
  - Plumber navigation/arrival state update backend flow
  - Store order rejection, delivery partner resolution, delivery OTP resolution, and profile/catalog mutation backend flow
- Remaining counts after P0 implementation:
  - `P0`: `0`
  - `P1`: `17`
  - `P2`: `10`
  - `P3`: `8`
- Mobile staging verdict after P0:
  - `customer-app`: `PARTIAL`
  - `plumber-app`: `PARTIAL`
  - `store-app`: `PARTIAL`
  - `mobile staging`: `PARTIAL`
## Dev-Only Mock Policy Recommendation

1. Introduce a single explicit env flag such as `EXPO_PUBLIC_ENABLE_DEV_MOCKS=false`
2. Default the flag to `false` in staging and production-like env files
3. Allow mock datasets only when both are true:
   - app is in development mode
   - `EXPO_PUBLIC_ENABLE_DEV_MOCKS=true`
4. In staging, replace all silent fallbacks with one of:
   - blocking error state
   - retry UI
   - feature unavailable message
5. Add unit tests that assert staging builds do not silently switch to mock data
6. Keep test fixtures under `*.test.tsx`, `src/mocks`, and web-only shims, but prevent runtime imports in staging-critical services

## Final Verdict

- MOCK FALLBACK INVENTORY: `COMPLETE`
- CUSTOMER APP REAL API READINESS: `PARTIAL`
- PLUMBER APP REAL API READINESS: `PARTIAL`
- STORE APP REAL API READINESS: `PARTIAL`
- MOBILE STAGING READY: `PARTIAL`
- PRODUCTION READY: `NO`



