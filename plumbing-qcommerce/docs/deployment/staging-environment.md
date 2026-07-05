# PlumbCommerce Staging Environment

## Purpose

This document defines the Phase 14B cloud staging setup for remote validation. The staging environment is for release verification only and must not use production secrets, production payment keys, production SMS keys, or production customer data.

## Source Branch

- Branch: `phase13a-local-staging-sms`
- Required CI precondition: Backend CI, Edge CI, Admin CI, Mobile Web CI, and Secret Scan must pass before staging deployment.
- Latest verified CI baseline before Phase 14B: `7fe4cc0`

## Backend Deployment Target

- Target platform: Google Cloud Run
- Region: `asia-south1`
- Service name: `plumbcommerce-backend-staging`
- Image repository: `plumbcommerce`
- Image name: `plumbcommerce-backend:staging`
- Runtime port: `8080`
- Spring profile: `prod`

Cloud Run command template:

```bash
PROJECT_ID=<your-google-cloud-project-id>
REGION=asia-south1
REPOSITORY=plumbcommerce
SERVICE_NAME=plumbcommerce-backend-staging
IMAGE=plumbcommerce-backend

gcloud auth login
gcloud config set project "$PROJECT_ID"

gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com

gcloud artifacts repositories create "$REPOSITORY" \
  --repository-format=docker \
  --location="$REGION" \
  --description="PlumbCommerce staging Docker images"

gcloud builds submit backend \
  --tag "$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$IMAGE:staging"

gcloud run deploy "$SERVICE_NAME" \
  --image "$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$IMAGE:staging" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 8080
```

If the Artifact Registry repository already exists, continue with the image build and deployment.

## PostgreSQL Staging Database

Preferred first staging option: external managed PostgreSQL such as Neon, Supabase, Render Postgres, or Aiven.

Required JDBC format:

```text
DATABASE_URL=jdbc:postgresql://HOST:5432/DB_NAME?sslmode=require
DATABASE_USERNAME=STAGING_DB_USER
DATABASE_PASSWORD=STAGING_DB_PASSWORD
```

Do not commit actual staging credentials. Set credentials through Cloud Run environment variables, Cloud Run secrets, or Secret Manager.

## Required Backend Environment Variables

```text
SPRING_PROFILES_ACTIVE=prod
PORT=8080
APP_SCHEDULING_ENABLED=false
DATABASE_URL=jdbc:postgresql://HOST:5432/DB_NAME?sslmode=require
DATABASE_USERNAME=STAGING_DB_USER
DATABASE_PASSWORD=STAGING_DB_PASSWORD
JWT_SECRET=STAGING_LONG_RANDOM_SECRET
CORS_ALLOWED_ORIGINS=http://localhost:3100
OTP_HASH_SECRET=STAGING_LONG_RANDOM_SECRET
DELIVERY_OTP_HASH_SECRET=STAGING_LONG_RANDOM_SECRET
SMS_PROVIDER=none
SMS_LOCAL_CAPTURE_ENABLED=false
SMS_FAIL_IF_MISSING_PROVIDER=true
APP_SEED_DEMO_ENABLED=false
APP_SEED_CATALOG_ENABLED=false
APP_SEED_ADMIN_DEMO_ENABLED=false
APP_SEED_FAIL_IF_PROD_DEMO_ENABLED=true
```

Optional first-deploy values:

```text
REDIS_HOST=
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_SSL=false
MONGO_URI=
KAFKA_BOOTSTRAP_SERVERS=
KAFKA_USERNAME=
KAFKA_PASSWORD=
KAFKA_SECURITY_PROTOCOL=
KAFKA_SASL_MECHANISM=
```

## Health Check Endpoint

```bash
curl https://STAGING_BACKEND_URL/actuator/health
```

Expected result: HTTP 200 with a valid health response.

## Login Test Endpoint

```bash
curl -X POST https://STAGING_BACKEND_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@plumbcommerce.com","password":"password"}'
```

Expected result: token and user details for a seeded staging admin user.

## Admin Portal Staging

- Deployment target: Vercel or selected static/Next.js host.
- Staging URL placeholder: `https://STAGING_ADMIN_PORTAL_URL`
- Deploy only after backend staging health and login pass.

Required staging environment:

```text
NEXT_PUBLIC_API_BASE_URL=https://STAGING_BACKEND_URL
NEXT_PUBLIC_EDGE_URL=
```

Validation before deployment:

```bash
cd admin-portal
npm ci
npm run test
npm run build
```

## Mobile Staging Plan

Apps:

- `customer-app`
- `plumber-app`
- `store-app`

Required staging environment:

```text
EXPO_PUBLIC_BACKEND_URL=https://STAGING_BACKEND_URL
EXPO_PUBLIC_EDGE_URL=
```

Do not build staging APKs until backend staging health and login pass.

## Database Verification

Verify after backend deployment:

1. Flyway reaches the latest migration.
2. Tables are created.
3. Seeded admin users exist.
4. V10 role constraint is applied.
5. Demo data seeding does not crash.
6. Restarting the service does not duplicate critical data.

## Known Limitations

- `APP_SCHEDULING_ENABLED=false` for the first staging deploy.
- Kafka is not active unless explicitly configured.
- Mongo audit persistence is optional unless `MONGO_URI` is configured.
- Redis-backed OTP/logout/token blacklist behavior is limited unless Redis is configured.
- Demo users still use demo password if seeded.
- Payments and SMS must remain sandboxed or disabled.
- Production deployment status: `NO`.

## Current Phase 14B Status

- Backend image build result: pending cloud tooling.
- Backend staging deployment result: not started.
- Staging backend URL: pending.
- Health endpoint result: not run.
- Login endpoint result: not run.
- Database migration result: not verified.
- Seeder result: not verified.
- Production deployment allowed: `NO`.