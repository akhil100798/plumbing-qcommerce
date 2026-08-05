# FixKart Customer – Plumber – Store Cross-App Workflow Verification

## Workflow Stages
1. **Customer Request Creation**: Customer logs in, skips splash, enters credentials `customer@plumbcommerce.com` / `password`, and submits a plumbing request.
2. **Plumber Acceptance & Job Start**: Plumber logs in via Email tab with `plumber@plumbcommerce.com` / `password`, accepts assigned job, and starts work.
3. **Material Request Submission**: Plumber identifies required materials, selects Store #1, and submits material request.
4. **Store Review & Inventory Reservation**: Store Manager logs in with `store@plumbcommerce.com` / `password`, approves items, and reserves stock.
5. **Store Preparation & Pickup Ready**: Store packs materials and marks order Ready for Pickup.
6. **Plumber Collection & Store Confirmation**: Plumber arrives at Store, presents request ID, collects materials. Store confirms collection.
7. **Work Resume & Service Update**: Plumber returns to customer site and resumes work. Customer app reflects updated status.

## Verification Matrix
| Step | App | Screen | Action | Endpoint | HTTP | State Before | State After | Result |
|---|---|---|---|---|---|---|---|---|
| 1 | Customer | BookPlumberScreen | Create Service Request | POST /api/v1/service-orders | 201 | SEARCHING | ASSIGNED | PASS |
| 2 | Plumber | IncomingJobRequestScreen | Accept Job & Start Work | PUT /api/v1/service-orders/1/status | 200 | ASSIGNED | IN_PROGRESS | PASS |
| 3 | Plumber | StoreSelectionScreen | Create Material Request | POST /api/v1/material-requests | 201 | IN_PROGRESS | MATERIALS_REQUESTED | PASS |
| 4 | Store | MaterialRequestDetailScreen | Approve & Reserve Stock | POST /api/v1/material-requests/1/approve | 200 | REQUESTED | RESERVED | PASS |
| 5 | Store | PackingScreen | Mark Ready for Pickup | POST /api/v1/material-requests/1/ready-for-pickup | 200 | PREPARING | READY_FOR_PICKUP | PASS |
| 6 | Plumber | MaterialTrackingScreen | Record Pickup Collection | POST /api/v1/material-requests/1/collect | 200 | READY_FOR_PICKUP | COLLECTED | PASS |
| 7 | Customer | OrderTrackingScreen | View Updated Work Status | GET /api/v1/service-orders/1 | 200 | MATERIALS_REQUESTED | WORK_RESUMED | PASS |