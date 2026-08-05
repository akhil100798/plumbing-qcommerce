# Backend Authorization Verification Evidence

## Summary
Local security unit tests and `SecurityConfig` verification confirm proper RBAC enforcement. Runtime verification on Render is blocked by Render HTTP 502 Bad Gateway.

| Endpoint | Role Tested | Expected Status | Local Test Result | Render Test Result |
| -------- | ----------- | --------------- | ----------------- | ------------------ |
| `/api/v1/admin/users` | Customer | 403 Forbidden | PASS (403) | BLOCKED (502) |
| `/api/v1/admin/users` | Plumber | 403 Forbidden | PASS (403) | BLOCKED (502) |
| `/api/v1/admin/users` | Store Manager | 403 Forbidden | PASS (403) | BLOCKED (502) |
| `/api/v1/materials/{id}/approve` | Customer | 403 Forbidden | PASS (403) | BLOCKED (502) |
| `/api/v1/materials/{id}/approve` | Plumber | 403 Forbidden | PASS (403) | BLOCKED (502) |
| `/api/v1/materials/{id}/confirm-collection` | Plumber | 403 Forbidden | PASS (403) | BLOCKED (502) |
| `/api/v1/service-orders` | Unauthenticated | 401 Unauthorized | PASS (401) | BLOCKED (502) |
