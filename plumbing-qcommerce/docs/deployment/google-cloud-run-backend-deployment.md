# Google Cloud Run Backend Deployment Runbook

## Scope

This runbook describes the staging-only backend deployment path for PlumbCommerce on Google Cloud Run. It must not be used for production deployment without a separate production readiness approval.

## Preconditions

- Branch: `phase13a-local-staging-sms`
- CI gates passed: Backend CI, Edge CI, Admin CI, Mobile Web CI, Secret Scan
- Google Cloud SDK installed and authenticated
- Google Cloud project selected
- Staging PostgreSQL database provisioned
- No real secrets committed to the repository

## Variables

```bash
PROJECT_ID=<your-google-cloud-project-id>
REGION=asia-south1
REPOSITORY=plumbcommerce
SERVICE_NAME=plumbcommerce-backend-staging
IMAGE=plumbcommerce-backend
```

## Enable Services

```bash
gcloud auth login
gcloud config set project "$PROJECT_ID"
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
```

## Create Artifact Registry Repository

```bash
gcloud artifacts repositories create "$REPOSITORY" \
  --repository-format=docker \
  --location="$REGION" \
  --description="PlumbCommerce staging Docker images"
```

If the repository already exists, continue to the image build.

## Build Image

```bash
gcloud builds submit backend \
  --tag "$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$IMAGE:staging"
```

## Configure Runtime Secrets

Set these values in Cloud Run environment variables, Cloud Run secrets, or Secret Manager. Do not commit real values.

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

## Deploy Service

```bash
gcloud run deploy "$SERVICE_NAME" \
  --image "$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$IMAGE:staging" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 8080
```

## Verify

```bash
curl https://STAGING_BACKEND_URL/actuator/health
curl -X POST https://STAGING_BACKEND_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@plumbcommerce.com","password":"password"}'
```

Success requires Cloud Run startup, Flyway migration success, health response, and login token response.

## Production Status

Production deployment allowed: `NO`.