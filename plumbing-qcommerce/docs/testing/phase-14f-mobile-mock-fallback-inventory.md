# Phase 14F Mobile Mock Fallback Inventory

## Executive Summary

Phase 14F inventory and cleanup tracked mock fallback, fake data, timeout simulation, local-only defaults, and incomplete real API usage across `customer-app`, `plumber-app`, and `store-app`.

Search terms used:

```text
mock, fallback, fake, dummy, sample, demo, hardcoded, setTimeout, Alert.alert, TODO, FIXME, localhost, 127.0.0.1, 8081, 8080, catch, placeholder, static data, offline data, test data
```

This document now reflects the completed Phase 14F Step 1 through Step 4 cleanup status.

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

## P0 Implementation Result

- Inventory commit used: `e6841f5`
- P0 findings fixed: `9/9`
- Remaining after Step 2:
  - `P0`: `0`
  - `P1`: `17`
  - `P2`: `10`
  - `P3`: `8`

## P1 Implementation Result

- Previous commit used: `2830ec6`
- Step 3 commit: `d91741b`
- P1 findings fixed or controlled: `17/17`
- P1 findings dev-gated for local-only use: `8`
- P1 findings that still fabricate staging success: `0`
- Remaining after Step 3:
  - `P0`: `0`
  - `P1`: `0`
  - `P2`: `10`
  - `P3`: `8`

## P2/P3 Action Result

### Customer App

| Item | Priority | Result | Notes |
|---|---|---|---|
| `customer-app/src/services/apiClient.ts` localhost fallback | `P2` | controlled | Uses explicit staging backend when mock fallback flag is off |
| `customer-app/src/screens/PlumberTrackingScreen.tsx` simulated material CTA | `P2` | dev-gated | Hidden from staging; available only in local dev mode |
| `customer-app/src/screens/PaymentMethodsScreen.tsx` mock payment mutation | `P2` | removed from staging | Screen now shows unavailable state |
| `customer-app/src/screens/ChatScreen.tsx` timeout reply simulation | `P2` | dev-gated | No fake partner replies in staging |
| `customer-app/src/screens/PaymentScreen.tsx` timeout payment success | `P2` | dev-gated | No fake checkout confirmation in staging |
| `customer-app/src/screens/OrderTrackingScreen.tsx` timeout OTP success | `P2` | dev-gated | OTP confirmation blocked in staging |
| `customer-app/src/screens/ServiceCompletionScreen.tsx` timeout completion success | `P2` | dev-gated | Completion submission blocked in staging |

### Plumber App

| Item | Priority | Result | Notes |
|---|---|---|---|
| `plumber-app/src/services/api/axiosClient.ts` localhost fallback | `P2` | controlled | Uses explicit staging backend when mock fallback flag is off |
| `plumber-app/src/screens/jobs/NavigationScreen.tsx` simulated coordinates/navigation | `P2` | documented as limitation | Arrival/GPS remains unavailable in staging; no fake arrival success |
| `plumber-app/src/screens/photos/BeforePhotosScreen.tsx` simulated photo capture | `P2` | dev-gated | No fake photo attachment in staging |
| `plumber-app/src/screens/photos/AfterPhotosScreen.tsx` simulated photo capture | `P2` | dev-gated | No fake post-work photo completion in staging |
| `plumber-app/src/screens/profile/ProfileScreen.tsx` demo mode menu | `P2` | removed from staging | Screen already uses unavailable states from Step 3 |
| `plumber-app/src/components/maps/RouteMap.tsx` web fallback view | `P3` | kept as test fixture | Web QA-only fallback; documented as non-production |
| `plumber-app/src/components/maps/MapPreview.tsx` web fallback view | `P3` | kept as test fixture | Web QA-only fallback; documented as non-production |
| `plumber-app/App.test.tsx`, `plumber-app/src/services/api/tokenStorage.test.ts`, `plumber-app/src/services/mocks/mockData.ts` | `P3` | kept as test fixture | No staging runtime reachability |

### Store App

| Item | Priority | Result | Notes |
|---|---|---|---|
| `store-app/src/services/api/axiosClient.ts` localhost fallback | `P2` | controlled | Uses explicit staging backend when mock fallback flag is off |
| `store-app/src/screens/reviews/ReviewsRatingsScreen.tsx` mock reviews | `P2` | dev-gated | Staging shows unavailable state |
| `store-app/src/screens/offers/OffersPromotionsScreen.tsx` mock offers | `P2` | dev-gated | Staging shows unavailable state |
| `store-app/src/screens/profile/AccountScreen.tsx` static account/help/legal | `P2` | documented as limitation | Kept as static informational content, not live backend data |
| `store-app/src/mocks/index.ts` central mock dataset | `P3` | kept as test fixture | No longer reachable from staging-critical flows |
| `store-app/App.test.tsx`, `store-app/src/services/api/tokenStorage.test.ts`, `store-app/.env.example` | `P3` | kept as test fixture | Dev/test only |

## Remaining Backend Endpoint Blockers

- Customer:
  - material approval and payment confirmation flow
  - live chat transport
  - delivery OTP verification
  - service completion submission
- Plumber:
  - live GPS routing and arrival confirmation
  - before/after photo upload pipeline
  - full material delivery lifecycle confirmation
- Store:
  - live reviews and promotions APIs
  - wallet and analytics APIs remain unavailable but fail closed correctly
  - dispatch and material-request operations remain unavailable but fail closed correctly

## Final Counts After Step 4

- `P0`: `0`
- `P1`: `0`
- `P2`: `0` runtime fake-success paths remaining in staging
- `P3`: `8` kept as test/dev/web fixtures

## Final Verdict

- MOCK FALLBACK INVENTORY: `COMPLETE`
- CUSTOMER APP REAL API READINESS: `PARTIAL`
- PLUMBER APP REAL API READINESS: `PARTIAL`
- STORE APP REAL API READINESS: `PARTIAL`
- MOBILE STAGING READY: `PARTIAL`
- PRODUCTION READY: `NO`
