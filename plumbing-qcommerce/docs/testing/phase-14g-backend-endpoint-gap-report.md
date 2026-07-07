# Phase 14G Backend Endpoint Gap Report

This document details the backend endpoint gap audit and matrices for PlumbCommerce mobile integration.

## 1. Backend/Mobile Endpoint Gap Matrix

| Flow | Screen/Service | Backend Endpoint | Exists? | Controller/Service/Repository | Request/Response Body | Status | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Customer: Material Approval** | `MaterialApprovalScreen` | `GET /api/v1/checkout/material-requests/customer` | **YES** | `CheckoutController`, `ProductOrderRepository` | Returns list of product orders with `serviceOrderId` and `items` | **RESOLVED** | P0 |
| **Customer: Material Payment** | `MaterialApprovalScreen` | `POST /api/v1/checkout/confirm/{orderId}` | **YES** | `CheckoutController`, `CheckoutService` | String response | **RESOLVED** | P0 |
| **Customer: Material Decline** | `MaterialApprovalScreen` | `POST /api/v1/checkout/release/{orderId}` | **YES** | `CheckoutController`, `CheckoutService` | String response | **RESOLVED** | P0 |
| **Plumber: Active Job List** | `DashboardScreen` | `GET /api/v1/orders/plumber` | **YES** | `ServiceOrderController`, `ServiceOrderService` | Returns assigned active/completed jobs | **RESOLVED** | P0 |
| **Plumber: Update Availability** | `DashboardScreen` | `POST /api/v1/users/me/availability` | **YES** | `UserController`, `PlumberKycRepository` | `{ availability: boolean }` / `User` | **RESOLVED** | P0 |
| **Store: Available Riders** | `DispatchAssignmentScreen` | `GET /api/v1/delivery/partners` | **YES** | `DeliveryController`, `UserRepository` | Returns list of riders | **RESOLVED** | P0 |
| **Store: Assign Rider** | `DispatchAssignmentScreen` | `POST /api/v1/delivery/{orderId}/assign?partnerId={id}` | **YES** | `DeliveryController`, `DeliveryService` | Returns updated `ProductOrder` | **RESOLVED** | P0 |

## 2. Endpoints Added/Completed in Phase 14G

1. **`POST /api/v1/users/me/availability`**: Enables plumbers to toggle their shift status (ONLINE/OFFLINE), saving to `plumber_kyc` database table.
2. **`GET /api/v1/orders/plumber`**: Returns all active and completed service orders assigned to the logged-in plumber, supporting active job state recovery.
3. **`GET /api/v1/delivery/partners`**: Enables store managers to lookup active delivery riders.
4. **`POST /api/v1/delivery/{orderId}/assign?partnerId={id}`**: Allows store managers to manually assign delivery riders to product/material orders on the staging dashboard.

## 3. Seed Data Added

Idempotent seed data for mobile staging E2E flow is injected via `StagingDemoMobileUserSeeder.java`:
- Customer Account: `customer@plumbcommerce.com`
- Plumber Account: `plumber@plumbcommerce.com`
- Store Manager Account: `store@plumbcommerce.com`
- Plumber KYC record initialized to `APPROVED` and `ONLINE` status.
- Catalog categories (`Pipes`, `Fittings`, `Tools`) and products (`CPVC-PIPE-12`, `PVC-ELBOW-34`, `PLUMB-TAPE-01`) seeded.
- Store inventory stock initialized to `40` available units for each product.
- One pending `ServiceOrder` seeded for the Customer so that a plumber has an active job to accept on login.

## 4. Remaining Gaps & Blockers

- **Direct Payment Gateways**: Credit card validation / payments on checkout use mock verification state or fail closed in staging.
- **Wallet & Earnings details**: Real transaction histories and detailed analytic stats for plumbers are mocked or return flat data.
- **Rider Self-Accept Flow**: Auto-routing delivery assignments is simulated, store manager manually forces dispatching in staging.
