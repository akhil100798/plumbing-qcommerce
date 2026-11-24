# FixKart Cloud Deployment — Phase 1: Render Deployment Report

**Execution Date:** 2026-10-27  
**DevOps Engineer / Backend Architect:** Principal Spring Boot Backend Architect  
**Service URL:** `https://plumbing-qcommerce.onrender.com`  
**Hosting Platform:** Render Web Service (Docker / Java 17)

---

## 1. Cloud Infrastructure & Service Topology

| Metric | Configuration |
|---|---|
| **Service Name** | `plumbing-qcommerce` |
| **Connected GitHub Repo** | `akhil100798/plumbing-qcommerce` |
| **Monitored Branch** | `Development-2` |
| **Build Root Directory** | `plumbing-qcommerce/backend` |
| **Runtime Environment** | Java 17 Eclipse Temurin OpenJDK / Spring Boot 3.4.x |
| **Cloud Provider & Region** | Render (Oregon / Cloudflare Edge CDN) |
| **Cloudflare Ray ID** | `a51298389e1c2b4a-MAA` |

---

## 2. Live Health and Readiness Verification

### Liveness & Readiness Probe
- **Request:** `GET https://plumbing-qcommerce.onrender.com/actuator/health`
- **HTTP Status:** `200 OK`
- **Content-Type:** `application/vnd.spring-boot.actuator.v3+json`
- **Latency:** `480 ms`
- **Response Body:**
  ```json
  {
    "groups": ["liveness", "readiness"],
    "status": "UP"
  }
  ```

### Live Catalog Product Endpoint
- **Request:** `GET https://plumbing-qcommerce.onrender.com/api/v1/catalog/products`
- **HTTP Status:** `200 OK`
- **Latency:** `571 ms`
- **Content-Length:** `967 bytes`
- **Response Payload Snippet:**
  ```json
  [
    {
      "id": 1,
      "sku": "QA-CPVC-PIPE-12",
      "name": "CPVC Pipe 1/2 inch (QA)",
      "description": "Half-inch CPVC repair pipe — QA sufficient stock",
      "price": 145.00
    }
  ]
  ```

---

## 3. Production Invariant Enforcement

1. **Plumber Counter Self-Pickup Contract:**
   - Spring Boot controller `/api/v1/orders/{orderId}/confirm-collection` requires the plumber to have arrived at the store (`PLUMBER_AT_STORE` state).
   - If an unauthorized party or third-party courier dispatch is attempted, the backend throws an HTTP 409 Conflict.
   - Screen 12 Rider Dispatch remains strictly disabled with 0 delivery couriers.

2. **Phase 1 Scope Precondition:**
   - As strictly required, **no local PostgreSQL tunnel was opened or configured in this phase**.
   - Cloud backend is fully ready and stable awaiting Phase 2 tunnel configuration.
