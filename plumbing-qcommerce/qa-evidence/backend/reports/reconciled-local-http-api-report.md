# Reconciled Local HTTP API Verification Report

## 1. Operational & Business Endpoint Results Table

| Method | Exact Endpoint | Role | HTTP | Expected | Re-fetch State | Result |
| ------ | -------------- | ---- | ---- | -------- | -------------- | ------ |
| GET | `/health/live` | Public | 200 | 200 OK | UP | PASS |
| GET | `/health/ready` | Public | 200 | 200 OK | UP | PASS |
| GET | `/version` | Public | 200 | 200 OK | Development metadata match | PASS |
| POST | `/api/v1/auth/login` | Public | 200 | JWT token returned | Token valid | PASS |
| POST | `/api/v1/auth/refresh` | Public | 200 | New JWT & Refresh token | Token rotated | PASS |
| POST | `/api/v1/auth/logout` | Authenticated | 200 | Session invalidated | Refresh token revoked | PASS |
| GET | `/api/v1/categories` | Public | 200 | Category list | Active categories returned | PASS |
| GET | `/api/v1/products` | Public | 200 | Product catalog page | Catalog items returned | PASS |
| GET | `/api/v1/stores` | Public | 200 | Store list | Active stores returned | PASS |
| GET | `/api/v1/stores/1/inventory` | Public | 200 | Inventory items | Stock levels returned | PASS |
| POST | `/api/v1/customer/service-orders` | CUSTOMER | 200 | Service order created | `REQUESTED` | PASS |
| POST | `/api/v1/plumber/jobs/1/accept` | PLUMBER | 200 | Job assigned | `ACCEPTED` | PASS |
| POST | `/api/v1/plumber/jobs/1/start` | PLUMBER | 200 | Job started | `IN_PROGRESS` | PASS |
| POST | `/api/v1/plumber/material-requests` | PLUMBER | 200 | Material request created | `STORE_REVIEWING` | PASS |
| GET | `/api/v1/store/material-requests` | STORE_MANAGER | 200 | Store request list | Request listed | PASS |
| POST | `/api/v1/store/material-requests/1/approve` | STORE_MANAGER | 200 | Request approved | `APPROVED` & Inventory reserved | PASS |
| POST | `/api/v1/store/material-requests/1/prepare` | STORE_MANAGER | 200 | Materials prepared | `PREPARING` | PASS |
| POST | `/api/v1/store/material-requests/1/ready-for-pickup` | STORE_MANAGER | 200 | Ready for pickup | `READY_FOR_PICKUP` | PASS |
| POST | `/api/v1/plumber/material-requests/1/arrived-at-store` | PLUMBER | 200 | Arrival recorded | `PLUMBER_AT_STORE` | PASS |
| POST | `/api/v1/plumber/material-requests/1/collect` | PLUMBER | 200 | Collection recorded | `PLUMBER_COLLECTION_RECORDED` | PASS |
| POST | `/api/v1/store/material-requests/1/confirm-collection` | STORE_MANAGER | 200 | Collection confirmed | `COLLECTED` & Inventory deducted | PASS |
| POST | `/api/v1/plumber/jobs/1/complete` | PLUMBER | 200 | Work resumed & completed | `COMPLETED` | PASS |

---

## 2. Authentication & Authorization Security Summary
- **Refresh Token Rotation**: Reused refresh tokens are immediately rejected with `401 Unauthorized`.
- **Logout Session Invalidation**: Logout revokes active refresh tokens immediately.
- **RBAC Role Matrix**:
  - Customers cannot modify store inventory or approve material requests (returns `403 Forbidden`).
  - Plumbers cannot confirm store collections as store manager (returns `403 Forbidden`).
  - Store Managers cannot record plumber arrival (returns `403 Forbidden`).
