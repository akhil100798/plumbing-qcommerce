# FixKart P0 Root Cause Notes

## Current E2E snapshot
- Source report: `docs/testing/full-real-ui-e2e-uat-report.md` from `HEAD`
- Source network evidence: `docs/evidence/full-real-ui-e2e-uat/network/e2e-flow-network-summary.md` from `HEAD`

## Order ID mismatch
- Customer-created service order in the recorded retry flow: `4`
- Plumber app active-job API response in the same flow: `GET /api/v1/orders/plumber` returned active order `1`
- Plumber app pending-job feed in the same flow: `GET /api/v1/orders/status/PENDING` returned pending order `4`
- Broken request captured in evidence: `PATCH /api/v1/orders/1/arrive`

## Root cause of wrong/stale job ID
- The plumber app mixed two different job sources:
  - active job recovery from `GET /api/v1/orders/plumber`
  - pending offer list from `GET /api/v1/orders/status/PENDING`
- A stale active order (`1`) was being used during the arrival flow while the current customer-created order was `4`.
- Remaining hardcoded/fallback paths found in code:
  - `plumber-app/src/navigation/MainTabNavigator.tsx` seeded the `Materials` tab with `PC123456`
  - `customer-app/src/screens/PlumberTrackingScreen.tsx` still had a dev-only navigation path using `order_service_777`
  - `customer-app/src/screens/MaterialApprovalScreen.tsx` compared `serviceOrderId` too strictly, allowing string/number mismatches to hide real pending requests

## Root cause of `/orders/{id}/arrive` 500
- `ServiceOrder.arrivedAt` is persisted to the `arrived_at` column.
- The migration adding that column lives in `backend/src/main/resources/db/migration/V14__add_arrived_at_to_service_orders.sql`.
- That migration was introduced later than the July 9, 2026 failing evidence, which strongly indicates the Render database was still missing `arrived_at` when the app tried to save arrival state.
- Backend lifecycle logic itself already supports the transition by:
  - validating plumber assignment
  - allowing `ACCEPTED`, `IN_PROGRESS`, and `COMBINED_ORDER`
  - setting `arrivedAt`
- The backend does not use a separate `ARRIVED` enum; the current app interprets `arrivedAt != null` as the reached/arrived state.

## Material-flow backend status
- Real material request creation endpoint exists:
  - `POST /api/v1/delivery/material-request`
- Real customer approval endpoint exists:
  - `POST /api/v1/checkout/confirm/{orderId}`
- Real store material request list exists:
  - `GET /api/v1/checkout/material-requests/store`
- Real store fulfillment endpoints exist:
  - `PATCH /api/v1/checkout/orders/{id}/accept`
  - `PATCH /api/v1/checkout/orders/{id}/pack`
  - `POST /api/v1/checkout/orders/{id}/handover`

## Store visibility expectation
- When a plumber creates a material request, a `ProductOrder` is created with status `PENDING`.
- When the customer confirms it, `CheckoutService.confirmPayment()` moves that `ProductOrder` to `CONFIRMED`.
- `GET /api/v1/checkout/material-requests/store` filters out only `PENDING` and `CANCELLED`, so the store app should receive the newly approved order once customer approval succeeds.

## Immediate fix focus
1. Remove stale/hardcoded service order IDs from plumber and customer UI paths
2. Ensure material approval screens use the real service order ID with tolerant ID matching
3. Keep backend arrival flow covered by focused tests so the migration-backed path stays protected
