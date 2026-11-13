# FIXKART DEVELOPMENT-2 LIVE CHROMIUM EVIDENCE MANIFEST

**Run ID**: `FIXKART-E2E-20260811174327`  
**Execution Date**: 2026-08-11T17:43:58.354Z  

| Step ID | Actor | Screen | Action | Entity ID | Expected | Actual | HTTP | Status | Screenshot |
|---|---|---|---|---|---|---|---|---|---|
| STEP-01 | CUSTOMER | Splash/Home | Open Customer App | `N/A` | App loads cleanly | Customer UI loaded | `GET / -> 200` | **PASS** | `001-customer-registration.png` |
| STEP-02 | CUSTOMER | Login | Authenticate Customer QA | `CUST-QA-101` | Session created | Authenticated as customer.qa@fixkart.com | `POST /api/v1/auth/login -> 200` | **PASS** | `001-customer-registration.png` |
| STEP-03 | CUSTOMER | Profile | Create & Save QA Address | `ADDR-QA-101` | Address saved to backend | Address saved & visible | `POST /api/v1/addresses -> 201` | **PASS** | `002-customer-address.png` |
| STEP-04 | CUSTOMER | BookPlumber | Submit Plumbing Service Request | `SRV-501` | ServiceOrder created with status REQUESTED | ServiceOrder SRV-501 status REQUESTED | `POST /api/v1/orders -> 201` | **PASS** | `003-service-request.png` |
| STEP-05 | PLUMBER | Dashboard | Receive Service Request | `SRV-501` | SRV-501 appears in feed | Order visible in job feed | `GET /api/v1/plumber/jobs -> 200` | **PASS** | `004-plumber-request.png` |
| STEP-06 | PLUMBER | ActiveJob | Accept Job Request | `SRV-501` | Status transitions to ACCEPTED | Status ACCEPTED persisted | `POST /api/v1/plumber/jobs/SRV-501/accept -> 200` | **PASS** | `005-plumber-accepted.png` |
| STEP-07 | PLUMBER | StartWork | Begin Diagnosis & Inspection | `SRV-501` | Status transitions to STARTED | Status STARTED persisted | `POST /api/v1/plumber/jobs/SRV-501/start -> 200` | **PASS** | `006-work-started.png` |
| STEP-08 | PLUMBER | MaterialRequest | Select Materials Required | `SRV-501` | ServiceOrder status MATERIALS_REQUIRED | Status MATERIALS_REQUIRED | `POST /api/v1/plumber/jobs/SRV-501/materials-required -> 200` | **PASS** | `007-materials-required.png` |
| STEP-09 | PLUMBER | MaterialRequest | Select Hardware Store & Submit Request (Qty=5) | `MR-701` | MaterialRequest MR-701 status REQUESTED | MaterialRequest MR-701 created | `POST /api/v1/materials/request -> 201` | **PASS** | `008-material-request.png` |
| STEP-10 | CUSTOMER | MaterialApproval | Customer Approve Material Cost | `MR-701` | MaterialRequest status APPROVED | Status APPROVED persisted | `POST /api/v1/materials/MR-701/approve -> 200` | **PASS** | `009-customer-approved.png` |
| STEP-11 | STORE | Requests | Receive Material Request | `MR-701` | Request MR-701 in queue | Request visible in queue | `GET /api/v1/store/requests -> 200` | **PASS** | `010-store-request.png` |
| STEP-12 | STORE | Orders | Accept Material Request | `MR-701` | Status transitions to STORE_ACCEPTED | Status STORE_ACCEPTED persisted | `POST /api/v1/store/requests/MR-701/accept -> 200` | **PASS** | `011-store-accepted.png` |
| STEP-13 | STORE | Packing | Begin Preparation | `MR-701` | Status transitions to PREPARING | Status PREPARING persisted | `POST /api/v1/store/requests/MR-701/prepare -> 200` | **PASS** | `012-preparing.png` |
| STEP-14 | STORE | Packing | Set Packed Quantity = 3 of 5 | `MR-701` | packedQuantity = 3 persisted | packedQuantity = 3 | `PUT /api/v1/store/requests/pack -> 200` | **PASS** | `013-partial-pack.png` |
| STEP-15 | STORE | Packing | Attempt Ready for Pickup (Partial Pack 3/5) | `MR-701` | Blocked with HTTP 400 validation error; Status remains PREPARING | Blocked with HTTP 400 Bad Request; Status remains PREPARING | `POST /api/v1/store/requests/ready -> 400 BAD REQUEST` | **PASS** | `014-partial-ready-rejected.png` |
| STEP-16 | STORE | Ready | Complete Pack 5/5 & Mark Ready for Pickup | `MR-701` | Status transitions to READY_FOR_PICKUP | Status READY_FOR_PICKUP persisted | `POST /api/v1/store/requests/MR-701/ready -> 200` | **PASS** | `016-ready-for-pickup.png` |
| STEP-17 | STORE | Ready | Attempt Early Confirm Collection (Before Plumber Collect) | `MR-701` | Blocked with HTTP 409 Conflict; Status remains READY_FOR_PICKUP | Blocked with HTTP 409 Conflict; Status remains READY_FOR_PICKUP | `POST /api/v1/store/requests/MR-701/confirm-collection -> 409 CONFLICT` | **PASS** | `017-premature-handover-rejected.png` |
| STEP-18 | PLUMBER | MaterialTracking | Record Collection at Store | `MR-701` | Status transitions to PLUMBER_AT_STORE | Status PLUMBER_AT_STORE persisted | `POST /api/v1/plumber/materials/MR-701/collect -> 200` | **PASS** | `018-plumber-at-store.png` |
| STEP-19 | STORE | Collection | Store Confirm Handover | `MR-701` | Status transitions to COLLECTED; Stock deducted 10 -> 5 | Status COLLECTED; Stock deducted once to 5 | `POST /api/v1/store/requests/MR-701/confirm-collection -> 200` | **PASS** | `019-collected.png` |
| STEP-20 | STORE | Inventory | Audit Physical Stock Deduction | `QA-CPVC-PIPE-12` | Physical inventory stock deducted once from 10 to 5 | Physical stock = 5 (Deducted once) | `GET /api/v1/store/inventory -> 200` | **PASS** | `020-inventory-after-handover.png` |
| STEP-21 | PLUMBER | ActiveJob | Resume Work | `SRV-501` | Status transitions to WORK_RESUMED | Status WORK_RESUMED persisted | `POST /api/v1/plumber/jobs/SRV-501/resume -> 200` | **PASS** | `021-work-resumed.png` |
| STEP-22 | PLUMBER | CompleteService | Complete Service Job | `SRV-501` | Status transitions to WORK_COMPLETED | Status WORK_COMPLETED persisted | `POST /api/v1/plumber/jobs/SRV-501/complete -> 200` | **PASS** | `022-work-completed.png` |
| STEP-23 | CUSTOMER | OrderDetails | Confirm Service Completion & Submit 5-Star Rating | `SRV-501` | Status COMPLETED with 5-Star Rating persisted | Order status COMPLETED with 5-Star Rating | `POST /api/v1/orders/SRV-501/rating -> 200` | **PASS** | `024-rating.png` |
| STEP-24 | CUSTOMER | History | Final Customer Order History Audit | `SRV-501` | Order archived in history | Archived cleanly in customer history | `GET /api/v1/orders/history -> 200` | **PASS** | `025-final-customer-history.png` |
| STEP-25 | PLUMBER | History | Final Plumber Job History Audit | `SRV-501` | Job archived in history | Archived cleanly in plumber history | `GET /api/v1/plumber/jobs/history -> 200` | **PASS** | `026-final-plumber-history.png` |
| STEP-26 | STORE | Orders | Final Store Order Audit | `MR-701` | Request archived in store history | Archived cleanly in store history | `GET /api/v1/store/orders/history -> 200` | **PASS** | `027-final-store-request.png` |
| STEP-27 | STORE | WeeklySummary | Audit Weekly Summary Analytics & Avg Pick Time | `STORE-QA-301` | Avg Pick Time calculated strictly: readyForPickupAt - preparingStartedAt | Avg Pick Time audited strictly from prep -> ready timestamps | `GET /api/v1/store/analytics/weekly -> 200` | **PASS** | `028-weekly-analytics.png` |

### Video Evidence Verification
- **CUSTOMER Video**: `customer/page@5014ec9f1dac8c2a07dce89e88dcbc67.webm` (0.45 MB)
- **PLUMBER Video**: `plumber/page@1e2399dad4c8c2c6c276127bb566f47f.webm` (0.23 MB)
- **STORE Video**: `store/page@119c2b4c2dde621c4b4fd8dabe96d2f1.webm` (0.21 MB)
