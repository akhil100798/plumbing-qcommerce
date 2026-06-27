# Render Backend Deployment

## Overview
- Repository: `akhil100798/plumbing-qcommerce`
- Service to deploy: `backend`
- Render service type: Web Service
- Runtime: Docker
- Branch: `main`
- Root directory: `backend`

## Prerequisites
- GitHub repo is pushed and accessible from Render
- A Render PostgreSQL instance is created
- A strong JWT secret is ready
- Optional Redis, MongoDB, and Kafka details are available if you want those integrations active on first deploy

## 1. Create Render PostgreSQL
- In Render, create a new PostgreSQL service
- Wait until it is available
- Copy:
  - Internal or external database hostname
  - Database name
  - Username
  - Password
- Build the JDBC URL in this format:
  - `jdbc:postgresql://HOST:5432/DATABASE`

## 2. Create the Render Web Service
- Click **New +** -> **Web Service**
- Connect the GitHub repository `akhil100798/plumbing-qcommerce`
- Configure:
  - Name: `plumbcommerce-backend`
  - Branch: `main`
  - Root Directory: `backend`
  - Runtime: `Docker`
  - Plan: your preferred Render plan

## 3. Recommended Health Check
- Preferred health check path: `/actuator/health`
- Existing lightweight fallback path: `/health/ready`
- If Actuator health is not desired, use `/health/ready` in Render

## 4. Required Environment Variables
- `SPRING_PROFILES_ACTIVE=prod`
- `PORT=10000`
- `DATABASE_URL=jdbc:postgresql://REPLACE_HOST:5432/REPLACE_DB`
- `DATABASE_USERNAME=REPLACE_USER`
- `DATABASE_PASSWORD=REPLACE_PASSWORD`
- `JWT_SECRET=replace-with-long-random-secret-minimum-32-chars`
- `CORS_ALLOWED_ORIGINS=https://your-admin-portal-url.vercel.app,http://localhost:3100`

## 5. Optional Environment Variables
- `APP_SCHEDULING_ENABLED=true`
- `REDIS_HOST=`
- `REDIS_PORT=6379`
- `REDIS_PASSWORD=`
- `REDIS_SSL=false`
- `MONGO_URI=`
- `KAFKA_BOOTSTRAP_SERVERS=`
- `KAFKA_USERNAME=`
- `KAFKA_PASSWORD=`
- `KAFKA_SECURITY_PROTOCOL=`
- `KAFKA_SASL_MECHANISM=`

## 6. First Deploy Guidance
- Start with PostgreSQL configured correctly
- If Redis, MongoDB, or Kafka are not ready yet:
  - The app can still start with production fallbacks
  - Related features may be degraded until those services are configured
  - Set `APP_SCHEDULING_ENABLED=false` if you want to avoid background outbox polling until Kafka/Mongo are ready

## 7. Seeder Behavior
- Flyway runs automatically in `prod`
- Demo admin users are seeded idempotently if missing
- Seeded admin password is `password`
- Change demo credentials after deployment if this environment becomes shared or long-lived

## 8. Post-Deploy Test Commands

### Bash
```bash
BACKEND_URL=https://your-render-backend-url.onrender.com

curl "$BACKEND_URL/actuator/health"

curl -X POST "$BACKEND_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@plumbcommerce.com","password":"password"}'
```

### PowerShell
```powershell
$BACKEND_URL="https://your-render-backend-url.onrender.com"

Invoke-RestMethod -Uri "$BACKEND_URL/actuator/health" -Method GET

Invoke-RestMethod `
  -Uri "$BACKEND_URL/api/v1/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"superadmin@plumbcommerce.com","password":"password"}'
```

## 9. Common Errors and Fixes
- `Connection refused` to PostgreSQL
  - Verify `DATABASE_URL`, username, password, and Render DB accessibility
- Flyway migration failure
  - Verify the database is empty or compatible with existing Flyway history
- `401` on login
  - Confirm the seeded user exists and password is exactly `password`
- CORS blocked in browser
  - Add the frontend URL to `CORS_ALLOWED_ORIGINS`
- Background warnings for Kafka/Mongo
  - Configure optional infra variables or set `APP_SCHEDULING_ENABLED=false` for the first deploy

## 10. Suggested Deploy Sequence
- Deploy PostgreSQL
- Configure backend env vars
- Deploy backend
- Verify `/actuator/health`
- Test admin login
- Connect admin portal to the new backend URL
