# FixKart Workflow and API Map

This document outlines the step-by-step role-based execution workflows and maps them to their respective frontend UI screen states and backend endpoints.

---

## 1. Customer Flow

| Step | UI Screen | Action | Backend Endpoint | Expected Result |
|---|---|---|---|---|
| **C1** | `LoginScreen` | Enter details & Submit | `POST /api/v1/auth/login` | Session token received and saved |
| **C2** | `HomeScreen` | View categories, active jobs, plumber alerts | `GET /api/v1/users/me` | Fetch active user credentials and details |
| **C3** | `BookPlumberScreen` | Enter plumbing description, select booking type | `POST /api/v1/orders` | Create service order (`status = PENDING`) |
| **C4** | `PlumberTrackingScreen` | Track plumber ETA, phone number, and location | `GET /api/v1/orders/{id}` | Poll order status (`ACCEPTED`, `ARRIVED`, `STARTED`) |
| **C5** | `MaterialApprovalScreen` | View plumber-generated parts checklist and price | `GET /api/v1/checkout/material-requests/customer` | Display list of requested parts orders |
| **C6** | `MaterialApprovalScreen` | Approve material checklist | `POST /api/v1/checkout/confirm/{orderId}` | Lock stock reservation and notify store |
| **C7** | `ServiceCompletionScreen` | View job details, hours worked, parts cost breakdown | `GET /api/v1/orders/{id}` | Poll order status (`COMPLETED`), display checkout invoice |

---

## 2. Plumber Flow

| Step | UI Screen | Action | Backend Endpoint | Expected Result |
|---|---|---|---|---|
| **P1** | `LoginScreen` | Enter plumber credentials | `POST /api/v1/auth/login` | Session token loaded |
| **P2** | `DashboardScreen` | Toggle online/offline availability | `PATCH /api/v1/plumber/availability` | Sync plumber active status |
| **P3** | `IncomingJobRequestScreen` | Accept active service order | `PATCH /api/v1/orders/{id}/accept` | Service order assigned to plumber (`status = ACCEPTED`) |
| **P4** | `NavigationScreen` | View routing map and click arrived | `PATCH /api/v1/orders/{id}/arrive` | Order status changes (`status = ARRIVED`) |
| **P5** | `StartWorkScreen` | Confirm work started | `PATCH /api/v1/orders/{id}/start` | Order status changes (`status = STARTED`) |
| **P6** | `MaterialRequestScreen` | Select catalog materials & submit request | `POST /api/v1/delivery/material-request` | Create product reservation order linked to job |
| **P7** | `MaterialTrackingScreen` | Check customer approval and store fulfillment state | `GET /api/v1/checkout/material-requests/plumber` | Retrieve parts tracking status timeline |
| **P8** | `CompleteServiceScreen` | Upload before/after photos and complete work | `PATCH /api/v1/orders/{id}/complete` | Finish job (`status = COMPLETED`), trigger billing |

---

## 3. Store Flow

| Step | UI Screen | Action | Backend Endpoint | Expected Result |
|---|---|---|---|---|
| **S1** | `LoginScreen` | Store manager logs in | `POST /api/v1/auth/login` | Session token loaded |
| **S2** | `OrdersScreen` | View plumber material requests and retail purchases | `GET /api/v1/checkout/material-requests/store` | Retrieve store-assigned parts orders |
| **S3** | `OrderDetailsScreen` | Accept parts request and assign delivery rider | `PATCH /api/v1/checkout/orders/{id}/accept` | Mark order status (`status = ACCEPTED`) |
| **S4** | `PackingScreen` | Pack items via checklist and mark done | `PATCH /api/v1/checkout/orders/{id}/pack` | Mark order status (`status = PACKED`) |
| **S5** | `ReadyForPickupScreen` | Handover items to plumber or dispatch rider | `POST /api/v1/checkout/orders/{id}/handover` | Mark order status (`status = OUT_FOR_DELIVERY` or `DELIVERED`) |
| **S6** | `InventoryScreen` | View items in inventory, add new product | `GET /api/v1/stores/me/inventory` | Retrieve stock levels |
| **S7** | `ProductDetailsScreen` | View product, alert on low stock levels | `GET /api/v1/catalog/products/{id}` | Retrieve catalog item details |

---

## 4. Admin Flow

| Step | UI Screen | Action | Backend Endpoint | Expected Result |
|---|---|---|---|---|
| **A1** | `LoginScreen` | Admin credential check | `POST /api/v1/auth/login` | Session token loaded |
| **A2** | `Dashboard` | Monitor total revenue, active service jobs, dispatch metrics | `GET /api/v1/admin/metrics` | Retrieve global q-commerce metrics |
| **A3** | `AdminRbac` | Modify role permissions, audit users | `GET /api/v1/admin/rbac/roles` | Retrieve active system roles mapping |
| **A4** | `SeedUser` | Register a new test user account | `POST /api/v1/admin/seed-user` | Created account details returned |
