# Backend Authorization Matrix

## Role-Based Access Control (RBAC) Matrix

| Endpoint | Customer | Plumber | Store Manager | Admin | Unauthenticated |
| -------- | -------- | ------- | ------------- | ----- | --------------- |
| `GET /health/live` | ALLOW (200) | ALLOW (200) | ALLOW (200) | ALLOW (200) | ALLOW (200) |
| `POST /api/v1/auth/login` | ALLOW (200) | ALLOW (200) | ALLOW (200) | ALLOW (200) | ALLOW (200) |
| `POST /api/v1/auth/register/customer` | ALLOW (200) | ALLOW (200) | ALLOW (200) | ALLOW (200) | ALLOW (200) |
| `GET /api/v1/catalog/products` | ALLOW (200) | ALLOW (200) | ALLOW (200) | ALLOW (200) | ALLOW (200) |
| `GET /api/v1/users/me` | ALLOW (200) | ALLOW (200) | ALLOW (200) | ALLOW (200) | DENY (401) |
| `POST /api/v1/service-orders` | ALLOW (200) | DENY (403) | DENY (403) | DENY (403) | DENY (401) |
| `GET /api/v1/plumbers/me/jobs` | DENY (403) | ALLOW (200) | DENY (403) | DENY (403) | DENY (401) |
| `POST /api/v1/materials/request` | DENY (403) | ALLOW (200) | DENY (403) | DENY (403) | DENY (401) |
| `GET /api/v1/materials/store/requests` | DENY (403) | DENY (403) | ALLOW (200) | ALLOW (200) | DENY (401) |
| `POST /api/v1/materials/{id}/approve` | DENY (403) | DENY (403) | ALLOW (200) | ALLOW (200) | DENY (401) |
| `POST /api/v1/materials/{id}/confirm-collection` | DENY (403) | DENY (403) | ALLOW (200) | ALLOW (200) | DENY (401) |
| `PUT /api/v1/stores/{id}/inventory/{pId}` | DENY (403) | DENY (403) | ALLOW (200) | ALLOW (200) | DENY (401) |
| `GET /api/v1/admin/users` | DENY (403) | DENY (403) | DENY (403) | ALLOW (200) | DENY (401) |
| `POST /api/v1/admin/materials/{id}/reassign` | DENY (403) | DENY (403) | DENY (403) | ALLOW (200) | DENY (401) |

## Authorization Safety Findings
- Cross-role privilege escalation is strictly blocked in `SecurityConfig.java`.
- Customer cannot modify store inventory or approve material requests.
- Plumber cannot confirm collection on behalf of the store.
- Store manager cannot perform plumber arrival or collection recording.
- Unauthenticated requests to protected API endpoints return HTTP 401 Unauthorized.
