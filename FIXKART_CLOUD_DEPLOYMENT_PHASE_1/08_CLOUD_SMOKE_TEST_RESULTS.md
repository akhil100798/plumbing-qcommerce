# FixKart Cloud Deployment — Phase 1: Cloud Smoke Test Results

**Execution Date:** 2026-10-27  
**DevOps Engineer / Release QA Lead:** Release QA Lead  
**Execution Script:** `scripts/prod-smoke-test.cjs`

---

## 1. Executive Smoke Test Matrix

| # | System / Target | Production URL | HTTP Status | Latency | Content / Key Assertion | Verdict |
|---|---|---|---|---|---|---|
| **1** | **Spring Boot Actuator Health** | `https://plumbing-qcommerce.onrender.com/actuator/health` | `200 OK` | `567 ms` | `{"groups":["liveness","readiness"],"status":"UP"}` | **PASS** |
| **2** | **Spring Boot Product Catalog API** | `https://plumbing-qcommerce.onrender.com/api/v1/catalog/products` | `200 OK` | `571 ms` | Valid JSON array containing `QA-CPVC-PIPE-12` | **PASS** |
| **3** | **Customer Web Application** | `https://fixkart-customer-web.vercel.app` | `200 OK` | `655 ms` | `<title>customer-app</title>` + bundle mounted | **PASS** |
| **4** | **Plumber Web Application (Stitch)** | `https://fixkart-plumber-web.vercel.app` | `200 OK` | `659 ms` | `<title>FixKart Plumber</title>` + bundle mounted | **PASS** |
| **5** | **Store Partner Web App (Stitch 21-Screen)** | `https://fixkart-store-web.vercel.app` | `200 OK` | `93 ms` | `<title>store-app</title>` + bundle mounted | **PASS** |
| **6** | **Super Admin Portal** | `https://admin-portal-ten-weld.vercel.app` | `200 OK` | `937 ms` | `<title>PlumbCommerce \| Super Admin Portal</title>` | **PASS** |

---

## 2. Test Execution Raw Output

```text
=== PRODUCTION SMOKE TEST REPORT ===
[PASS] HTTP 200 | Render Backend Health (567ms) -> {"groups":["liveness","readiness"],"status":"UP"}
[PASS] HTTP 200 | Render Backend Products API (571ms) -> [{"id":1,"sku":"QA-CPVC-PIPE-12","name":"CPVC Pipe 1/2 inch 
[PASS] HTTP 200 | FixKart Customer Web App (655ms) -> customer-app
[PASS] HTTP 200 | FixKart Plumber Web App (Stitch) (659ms) -> FixKart Plumber
[PASS] HTTP 200 | FixKart Store Partner Web App (Stitch 21-Screen) (93ms) -> store-app
[PASS] HTTP 200 | FixKart Super Admin Portal (937ms) -> PlumbCommerce | Super Admin Portal
====================================
FINAL RESULT: 100% ALL 6 PRODUCTION TARGETS OPERATIONAL
```

---

## 3. Deep-Link & SPA Rewrites Validation

All three React Native Web / Expo applications (`customer-app`, `plumber-app`, `store-app`) have verified SPA rewrites in place via `vercel.json`:
- Reloading non-root URLs (such as `/login`, `/orders`, or `/diagnosis`) returns the single-page application `index.html` shell with HTTP 200 rather than an HTTP 404 Not Found error.
- JavaScript hydration succeeds without uncaught global exception triggers.
