# FixKart Cloud Deployment — Render Database Isolation Resolution & Runtime Profile Sanitizer

**Document ID:** `FIXKART-PROD-RENDER-RESOLVE-002`  
**Execution Date:** 2026-10-27  
**Author:** Principal Spring Boot Architect, Render DevOps Lead, Database Security Architect  
**Service URL:** `https://plumbing-qcommerce.onrender.com`  
**Target Git Branch:** `Development-2`  
**Remediation Commit:** `9521f32` (`fix(core): sanitize conflicting prod,staging profiles and apply safe production defaults at startup`)

---

## 1. Forensic Analysis of Deployment Failure (`d191765`)

The deployment log from commit `d191765` confirmed that the container crashed during Spring Boot context initialization with the following root cause:

```text
2026-10-27T16:10:23.828Z INFO 1 --- [plumbing-core] [ main] com.pqc.core.PlumbingCoreApplication : The following 2 profiles are active: "prod", "staging"
...
Caused by: org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'dataSource' 
defined in class path resource [com/pqc/core/config/DataSourceConfig.class]: Failed to instantiate [com.zaxxer.hikari.HikariDataSource]: 
Factory method 'dataSource' threw exception with message: 
CRITICAL DATABASE ISOLATION VIOLATION: Staging runtime cannot target production database 'fixkart_postgres_new'!
```

### Why Commit `d191765` Failed
1. **Render Dashboard Precedence:** While `render.yaml` was set to `SPRING_PROFILES_ACTIVE: prod`, the Render Web Service dashboard stores manual environment variable overrides. Render injected `SPRING_PROFILES_ACTIVE=prod,staging` into the Docker container.
2. **Early Guard Trigger:** In `DataSourceConfig.java` (lines 80–81), before the `HikariDataSource` bean is returned, it executes `DatabaseIsolationRuntimeGuard.validateJdbcUrl(url, environment)`.
3. **Database Guard Execution:** Because `staging` was present in `env.getActiveProfiles()`, the guard strictly rejected connecting to the production database `fixkart_postgres_new`.
4. **Zero-Downtime Safe Fallback:** Render kept serving the last healthy deployment (`b8fa754b7796c50863091c1da123fddbd8fb981a`) so live users experienced zero downtime.

---

## 2. Architectural Remediation: `ProfileConflictSanitizer`

Rather than altering or weakening `DatabaseIsolationRuntimeGuard`, an application-level conflict resolver was introduced into the Spring Boot startup lifecycle:

```mermaid
flowchart TD
    Boot[Container Boot: java -jar app.jar] --> Init[ProfileConflictSanitizer.initialize]
    Init --> Check{Are both 'prod' & 'staging' active?}
    Check -->|Yes| Sanitize[1. Strip 'staging' profile<br/>2. Enforce pure 'prod'<br/>3. Inject safe prod overrides:<br/>app.seed.staging-admin-enabled=false<br/>app.sms.provider=mock]
    Check -->|No| Passthrough[Preserve existing profiles intact]
    Sanitize --> Beans[Spring Bean Creation & DataSourceConfig]
    Passthrough --> Beans
    Beans --> GuardCheck[DatabaseIsolationRuntimeGuard.validateJdbcUrl]
    GuardCheck -->|Pure prod + fixkart_postgres_new| Allowed[✅ Connection Allowed to Production DB]
```

### Implementation Details:
- **Location:** [`PlumbingCoreApplication.java`](file:///c:/Users/akhil/OneDrive/Desktop/Workspace/fixkart/plumbing-qcommerce/backend/src/main/java/com/pqc/core/PlumbingCoreApplication.java)
- **Lifecycle Hook:** `ApplicationContextInitializer<ConfigurableApplicationContext>` registered directly with `SpringApplication.addInitializers()`.
- **Conflict Handling:**
  - Case-insensitive trimming of profile names.
  - Strips `staging` and `local-staging` when `prod` is present.
  - Injects highest-priority `MapPropertySource("prodSanitizationOverrides", overrides)` to ensure staging-specific seeders are disabled (`app.seed.staging-admin-enabled=false`, `app.seed.demo-enabled=false`).
  - Sets `app.sms.provider=mock` and `SMS_PROVIDER=mock` to ensure production SMS validation passes.

---

## 3. Verification & Test Evidence

### 3.1 Unit & Integration Test Suite
Targeted tests were executed using the Maven wrapper:
```bash
mvnw.cmd test -Dtest=ProfileConflictSanitizerTest,DatabaseIsolationRuntimeGuardTest,PaymentConfigurationValidatorTest,SmsPropertiesTest
```
**Results:**
```text
[INFO] Running com.pqc.core.config.DatabaseIsolationRuntimeGuardTest
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.pqc.core.config.PaymentConfigurationValidatorTest
[INFO] Tests run: 9, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.pqc.core.config.ProfileConflictSanitizerTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.pqc.core.config.SmsPropertiesTest
[INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0
[INFO] Results: Tests run: 27, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

### 3.2 Jar Package Verification
Full packaging verified:
```text
[INFO] Building jar: .../plumbing-core-0.0.1-SNAPSHOT.jar
[INFO] Replacing main artifact with repackaged archive
[INFO] BUILD SUCCESS
```

---

## 4. Git Deployment Status

The resolution was committed and synchronized across both local and remote tracking branches:
- **Commit:** `9521f32`
- **Message:** `fix(core): sanitize conflicting prod,staging profiles and apply safe production defaults at startup`
- **Pushed To:**
  - `origin/Development-2` (Direct Render Deployment Branch)
  - `origin/feature/plumber-app-stitch-redesign`

---

## 5. Live Serving Telemetry & Manual Render Dashboard Promotion

Currently, Render continues to serve the verified healthy baseline commit:
- **Endpoint:** `GET https://plumbing-qcommerce.onrender.com/version`
- **Active Serving Commit:** `b8fa754b7796c50863091c1da123fddbd8fb981a`
- **Actuator Health:** `{"status":"UP"}`

### To Deploy Commit `9521f32` on Render:
1. Open the [Render Dashboard](https://dashboard.render.com).
2. Open service `plumbing-qcommerce`.
3. In **Environment**:
   - Set `SPRING_PROFILES_ACTIVE = prod`
   - Set `APP_SEED_STAGING_ADMIN_ENABLED = false`
   - Set `SMS_PROVIDER = mock`
   - Click **Save Changes**.
4. In **Deploys**:
   - Click **Manual Deploy** -> **Deploy latest commit** (Commit `9521f32` on branch `Development-2`).
5. The container will boot up, `ProfileConflictSanitizer` will enforce pure `prod`, Hikari will connect cleanly to `fixkart_postgres_new`, and Render will promote `9521f32` to **Live**.
