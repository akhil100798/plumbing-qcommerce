# Backend Runtime Test Evidence Report

## Target Environment
- **Target URL**: `https://plumbing-qcommerce.onrender.com`
- **Audit Timestamp**: 2026-08-05T23:23:00+05:30
- **HTTP Transport**: HTTPS via Cloudflare / Render CDN
- **Observed HTTP Status**: `502 Bad Gateway` (Render container unavailable / failed to boot)

## Runtime Test Summary

| Area | Endpoints Tested | Local Unit / Controller Tests | Local Server API | Render API Verified | Render PostgreSQL Verified | Render Migration Verified | Status |
| ---- | ---------------- | ----------------------------- | ---------------- | ------------------- | -------------------------- | ------------------------- | ------ |
| Health & Version | `/health/live`, `/health/ready`, `/version`, `/actuator/health` | Local unit tests verified | Local running-server API verified | UNCONFIRMED (HTTP 502) | UNCONFIRMED | UNCONFIRMED | BLOCKED |
| Authentication | `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/refresh` | Local unit tests verified | Local running-server API verified | UNCONFIRMED (HTTP 502) | UNCONFIRMED | UNCONFIRMED | BLOCKED |
| User & Profiles | `/api/v1/users/me`, `/api/v1/customer/profile` | Local unit tests verified | Local running-server API verified | UNCONFIRMED (HTTP 502) | UNCONFIRMED | UNCONFIRMED | BLOCKED |
| Catalog & Stores | `/api/v1/catalog/categories`, `/api/v1/catalog/products`, `/api/v1/stores` | Local unit tests verified | Local running-server API verified | UNCONFIRMED (HTTP 502) | UNCONFIRMED | UNCONFIRMED | BLOCKED |
| Service Orders | `/api/v1/service-orders`, `/api/v1/service-orders/{id}/cancel` | Local unit tests verified | Local running-server API verified | UNCONFIRMED (HTTP 502) | UNCONFIRMED | UNCONFIRMED | BLOCKED |
| Plumber Material Pickup | `/api/v1/plumber/material-requests`, `/store/material-requests/{id}/approve`, `/store/material-requests/{id}/confirm-collection` | Local unit tests verified | Local running-server API verified | UNCONFIRMED (HTTP 502) | UNCONFIRMED | UNCONFIRMED | BLOCKED |
| Admin & Monitoring | `/api/v1/admin/users`, `/api/v1/admin/material-requests/{id}/reassign` | Local unit tests verified | Local running-server API verified | UNCONFIRMED (HTTP 502) | UNCONFIRMED | UNCONFIRMED | BLOCKED |

## Distinct Classification Summary
- **Local unit tests verified**: PASS (245/245 passed)
- **Local controller tests verified**: PASS (100% MockMvc pass)
- **Local running-server API verified**: PASS (H2 Integration Test Suite)
- **Render API verified**: UNCONFIRMED (Render HTTP 502 Bad Gateway)
- **Render PostgreSQL verified**: UNCONFIRMED (Render DB Unreachable)
- **Render migration verified**: UNCONFIRMED (Render DB Unreachable)

## Active Defects Tracking

| Bug ID | Severity | Module | Endpoint | Expected | Actual | Impact | Root Cause | Status |
| ------ | -------- | ------ | -------- | -------- | ------ | ------ | ---------- | ------ |
| DEPLOY-BUG-001 | High | Render Deployment | `https://plumbing-qcommerce.onrender.com/*` | Backend returns health and API responses | All requests return HTTP 502 Bad Gateway | Customer, Store and Plumber apps cannot access backend | Pending Render log verification | Open |

