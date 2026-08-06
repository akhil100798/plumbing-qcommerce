# Phase 13 → Development Render Deployment Report

## Deployment Target

```text
Repository:    https://github.com/akhil100798/plumbing-qcommerce
Branch:        Development
SHA:           177b5c6bf7c906dd976581f991490c8303e57e2a
Service URL:   https://plumbing-qcommerce.onrender.com
Service name:  plumbcommerce-backend
```

## Pre-Deployment Checklist

| Gate | Status |
|------|--------|
| Phase 13 fully incorporated into Development | PASS |
| Development behind Phase 13 = 0 | PASS |
| Development behind main = 0 | PASS |
| Flyway conflicts = 0 | PASS |
| render.yaml correct (rootDir=backend, healthCheck=/actuator/health) | PASS |
| application.yml datasource uses env-var | PASS |
| Dockerfile memory-tuned for Render free tier | PASS |
| Hard-coded DB hosts = 0 | PASS |
| Hard-coded secrets = 0 | PASS |
| Active production mocks = 0 | PASS |
| Delivery flag = disabled | PASS |
| Backend tests | PENDING |
| Mobile apps (customer, store, plumber) | PASS (prior session) |
| Development pushed to origin/Development | PASS |

## Render Dashboard Configuration Required

> [!IMPORTANT]
> The Playwright browser tool is unavailable (HTTP 404 on driver download). The user must manually perform these steps.

1. **Settings > Branch**: Change from current setting to `Development`
2. **Settings > Root Directory**: Confirm `backend`
3. **Settings > Dockerfile Path**: `./Dockerfile` (relative to rootDir)
4. **Environment > DATABASE_URL**: Ensure this points to the current active Render PostgreSQL database internal connection string
5. **Trigger Manual Deploy**

## Render PostgreSQL Database Fix

The previous `UnknownHostException` during Flyway startup was caused by a stale `DATABASE_URL` environment variable pointing to a deleted or expired Render PostgreSQL database hostname.

**To fix:**
1. Go to Render Dashboard > Your PostgreSQL database service
2. Confirm the database is active (not suspended/deleted)
3. Copy the **Internal Database URL** from the database service
4. Go to the plumbcommerce-backend service > Environment
5. Set `DATABASE_URL` to that internal URL
6. Alternatively, use Render's "Connect a database" feature to link automatically

## Expected Startup Sequence After Correct Configuration

```
[Render] Checking out commit <Development SHA> in branch Development
[Docker] Building image...
[Spring Boot] Starting PlumbingCoreApplication
[HikariCP] HikariPool-1 - Starting...
[HikariCP] Added connection conn0: url=jdbc:postgresql://<host>/...
[Flyway] Current version of schema: <last applied>
[Flyway] Migrating schema to version N...
[Flyway] Successfully applied N migrations
[Spring Boot] Tomcat started on port 10000
[Spring Boot] Started PlumbingCoreApplication in XX seconds
```

## Post-Deployment Verification (To Be Run After Deploy)

```powershell
# Health endpoints
node -e "const h=require('https');h.get('https://plumbing-qcommerce.onrender.com/health/live',r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>console.log('/health/live',r.statusCode,d))})"
node -e "const h=require('https');h.get('https://plumbing-qcommerce.onrender.com/version',r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>console.log('/version',r.statusCode,d))})"
```

Required results:
- `/health/live`: `200 OK` `{"status":"UP"}`
- `/health/ready`: `200 OK` `{"status":"UP"}`
- `/version`: `200 OK` `{"branch":"Development","commit":"177b5c6...","version":"1.0.0",...}`

## Deployment Status

```text
Render Dashboard Access: UNCONFIRMED — Playwright browser tool unavailable
Branch Change: PENDING (user action required)
Deploy Triggered: PENDING
Deployed SHA: UNCONFIRMED
Flyway Status: UNCONFIRMED
Health Endpoints: UNCONFIRMED
```
