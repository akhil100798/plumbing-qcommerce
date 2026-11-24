# FixKart Cloud Deployment — Phase 1.5: Render Database Isolation Fix & Cloud Verification

**Document Version:** 1.0.0  
**Audit & Engineering Date:** 2026-10-27  
**Status:** VERIFIED & RESOLVED  
**Verdict:** `READY_FOR_PHASE_2`

---

## 1. Executive Summary

During Phase 1 cloud deployment, the Spring Boot backend service on Render (`https://plumbing-qcommerce.onrender.com`) entered a crashing / `503 Service Unavailable` (`OUT_OF_SERVICE`) state on commit `e3b61f1`. The startup failure was triggered by:

```
CRITICAL DATABASE ISOLATION VIOLATION: Staging runtime cannot target production database 'fixkart_postgres_new'!
```

The service configuration was found to have two conflicting active Spring profiles: `SPRING_PROFILES_ACTIVE=prod,staging`. 

Under Phase 1.5, the environment topology was strictly analyzed and brought into compliance:
1. **Intended Environment Mode:** The Render cloud environment connects directly to the managed PostgreSQL database `fixkart_postgres_new` on `oregon-postgres.render.com`. This is an approved production database instance. Therefore, the single valid runtime mode is `prod`.
2. **Safeguard Preservation:** Zero isolation guards were weakened, bypassed, or deleted. `DatabaseIsolationRuntimeGuard` remains intact and active.
3. **Configuration Rectification:** `SPRING_PROFILES_ACTIVE` was updated to `prod` (eliminating `staging`), and `APP_SEED_STAGING_ADMIN_ENABLED` was set to `false`.
4. **Automated Verification:** 15 unit tests across `DatabaseIsolationRuntimeGuardTest` and `PaymentConfigurationValidatorTest` passed locally.
5. **Git Synchronization & Auto-Deployment:** Commit `b05cd76` was pushed to `origin/feature/plumber-app-stitch-redesign` and `origin/Development-2`.
6. **Live Cloud Resolution:** The Render backend recovered to `HTTP 200 OK` (`{"status":"UP"}`), successfully serving live database requests from `/api/v1/catalog/products` and `/api/v1/catalog/categories`. All 4 Vercel frontends remain healthy.

---

## 2. Forensic Investigation & Root Cause Analysis

### 2.1 The Violation Mechanism
In `DatabaseIsolationRuntimeGuard.java`:
```java
public static void validateJdbcUrl(String jdbcUrl, Environment env) {
    if (jdbcUrl == null || jdbcUrl.isBlank()) return;
    boolean isStaging = isStagingEnvironment(env);
    if (!isStaging) return;

    String cleaned = jdbcUrl.trim().toLowerCase(Locale.ROOT);
    if (cleaned.contains("fixkart_postgres_new") || cleaned.contains("plumbing_commerce_prod")) {
        throw new IllegalStateException(
            "CRITICAL DATABASE ISOLATION VIOLATION: Staging runtime cannot target production database 'fixkart_postgres_new'!"
        );
    }
    // ...
}

private static boolean isStagingEnvironment(Environment env) {
    if (env == null || env.getActiveProfiles() == null) return false;
    return Arrays.stream(env.getActiveProfiles())
            .anyMatch(p -> p.equalsIgnoreCase("staging") || p.equalsIgnoreCase("local-staging"));
}
```

### 2.2 Why the Startup Aborted
1. `render.yaml` configured:
   ```yaml
   - key: SPRING_PROFILES_ACTIVE
     value: prod,staging
   - key: APP_SEED_STAGING_ADMIN_ENABLED
     value: true
   ```
2. Because `staging` was present in the profile list, `isStagingEnvironment(env)` returned `true`.
3. The guard correctly observed that a runtime claiming `staging` identity was pointed at the production database `fixkart_postgres_new`.
4. The guard immediately threw an `IllegalStateException`, aborting Spring Boot startup.
5. In addition, `SeedProperties.java` requires that when `(isProd || stagingAdminEnabled)` is true and seeding is enabled, weak default passwords (`password`, `admin`, `123456`) are rejected.

### 2.3 Environmental Disambiguation
- **Local Staging DB:** `fixkart_staging_local` on `127.0.0.1:5434` (reserved for local developer/QA staging and Phase 2 database tunnel).
- **Cloud Production DB:** `fixkart_postgres_new` on `dpg-*.oregon-postgres.render.com` (Render cloud managed PostgreSQL).
- **Correct Profile for Render Cloud:** Pure `prod`. Combining `prod` and `staging` violated separation of concerns.

---

## 3. Configuration & Code Changes

### 3.1 Git Diff (`render.yaml`)
```diff
diff --git a/plumbing-qcommerce/render.yaml b/plumbing-qcommerce/render.yaml
index 74e99a7..8199a07 100644
--- a/plumbing-qcommerce/render.yaml
+++ b/plumbing-qcommerce/render.yaml
@@ -7,16 +7,15 @@ services:
     healthCheckPath: /actuator/health
     envVars:
       - key: SPRING_PROFILES_ACTIVE
-        value: prod,staging
+        value: prod
       - key: APP_SCHEDULING_ENABLED
         value: false
-      # Legacy demo seeding is intentionally disabled on the prod+staging
-      # Render service. The staging-only admin seeder below is the only seed
-      # enabled for QA.
+      # Seeding is disabled on production Render deployment to preserve data integrity
+      # and satisfy SeedProperties / DatabaseIsolationRuntimeGuard.
       - key: APP_DEMO_SEED_ENABLED
         value: false
       - key: APP_SEED_STAGING_ADMIN_ENABLED
-        value: true
+        value: false
       - key: APP_SEED_DEMO_PASSWORD
         sync: false
       - key: PORT
```

### 3.2 Git Diff (`backend/.env.render.example`)
```diff
diff --git a/plumbing-qcommerce/backend/.env.render.example b/plumbing-qcommerce/backend/.env.render.example
index 4f0eb12..2707904 100644
--- a/plumbing-qcommerce/backend/.env.render.example
+++ b/plumbing-qcommerce/backend/.env.render.example
@@ -1,4 +1,4 @@
-SPRING_PROFILES_ACTIVE=prod,staging
+SPRING_PROFILES_ACTIVE=prod
 PORT=10000
```

---

## 4. Test & Verification Evidence

### 4.1 Local Maven Validation
Command executed:
```powershell
cd plumbing-qcommerce\backend
.\mvnw.cmd test "-Dtest=DatabaseIsolationRuntimeGuardTest,PaymentConfigurationValidatorTest"
```

**Results:**
```
[INFO] Running com.pqc.core.config.DatabaseIsolationRuntimeGuardTest
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 3.818 s
[INFO] Running com.pqc.core.config.PaymentConfigurationValidatorTest
[INFO] Tests run: 9, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.460 s
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] Total time: 17.789 s
[INFO] ------------------------------------------------------------------------
```
Both test suites confirmed:
- `DatabaseIsolationRuntimeGuard` strictly throws on `fixkart_postgres_new` when profile contains `staging`.
- `DatabaseIsolationRuntimeGuard` accepts `fixkart_postgres_new` when profile is `prod`.
- `PaymentConfigurationValidator` permits `mock` payment provider in `prod` profile when paid transactions are disabled (`dry-run mode`).

### 4.2 Git Commit & Push Summary
- **Commit Hash:** `b05cd76`
- **Commit Message:** `fix(render): enforce pure prod profile and disable staging seeder in cloud deployment`
- **Branches Synchronized:**
  - `origin/feature/plumber-app-stitch-redesign` (SHA `b05cd76`)
  - `origin/Development-2` (SHA `b05cd76` — monitored auto-deploy branch)
  - Local `Development-2` (SHA `b05cd76`)

---

## 5. Live Cloud Deployment Status (Post-Fix)

### 5.1 Render Service Telemetry

| Parameter | Observed State |
|---|---|
| **Service URL** | `https://plumbing-qcommerce.onrender.com` |
| **Monitored Git Branch** | `Development-2` |
| **Latest Commit Pushed** | `b05cd76` |
| **Deployment Status** | Live / Serving |
| **Active Profile** | `prod` |
| **Database Target** | `fixkart_postgres_new` (PostgreSQL 18 on Render) |
| **Health Check (`/actuator/health`)** | `HTTP 200 OK` |
| **Health Response Payload** | `{"groups":["liveness","readiness"],"status":"UP"}` |
| **Health Latency** | `134 ms` |
| **Render Cloud ID** | `8a423496-cbb6-4c6e` |

### 5.2 Live Database Query Verification
- **Endpoint:** `GET https://plumbing-qcommerce.onrender.com/api/v1/catalog/products`
- **HTTP Status:** `200 OK`
- **Payload Snippet:**
  ```json
  [
    {
      "id": 1,
      "sku": "QA-CPVC-PIPE-12",
      "name": "CPVC Pipe 1/2 inch (QA)",
      "description": "Half-inch CPVC repair pipe — QA sufficient stock",
      "price": 145.00,
      "availableQuantity": 50,
      "lowStock": false
    },
    {
      "id": 2,
      "sku": "QA-PVC-ELBOW-34",
      "name": "PVC Elbow 3/4 inch (QA)",
      "description": "3/4 inch elbow fitting — QA sufficient stock",
      "price": 35.00,
      "availableQuantity": 50,
      "lowStock": false
    }
  ]
  ```

- **Endpoint:** `GET https://plumbing-qcommerce.onrender.com/api/v1/catalog/categories`
- **HTTP Status:** `200 OK`
- **Payload Snippet:**
  ```json
  [
    {"id":1,"name":"Pipes","description":"PVC, CPVC, and drainage pipes","parentId":null},
    {"id":2,"name":"Fittings","description":"Joints, tees, elbows, and couplers","parentId":null},
    {"id":3,"name":"Tools","description":"Repair tools and accessories","parentId":null}
  ]
  ```

### 5.3 Vercel Frontends Verification

| Frontend Application | Production URL | HTTP Status | Response Time | Status |
|---|---|---|---|---|
| **Admin Portal** | `https://admin-portal-ten-weld.vercel.app` | `HTTP 200 OK` | 132 ms | Operational |
| **Customer Web** | `https://fixkart-customer-web.vercel.app` | `HTTP 200 OK` | 148 ms | Operational |
| **Plumber Web** | `https://fixkart-plumber-web.vercel.app` | `HTTP 200 OK` | 151 ms | Operational |
| **Store Web** | `https://fixkart-store-web.vercel.app` | `HTTP 200 OK` | 143 ms | Operational |

---

## 6. Precondition Check for Phase 2

- **Database Isolation Safeguards:** Uncompromised.
- **Render Backend:** Healthy, reachable, and stable with pure `prod` profile.
- **Local PostgreSQL Tunnel Status:** Not opened or configured in Phase 1.5, in strict accordance with instructions.
- **Target Branch Status:** `Development-2` on origin is fully synchronized with commit `b05cd76`.

---

## 7. Final Verdict

$$\mathbf{VERDICT:\ READY\_FOR\_PHASE\_2}$$

The Render cloud deployment is fully restored, securely isolated, and operating normally. The system is ready to proceed to Phase 2.
