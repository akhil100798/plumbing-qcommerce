# Local Staging Runtime

## Purpose

The `local-staging` Spring profile supports end-to-end OTP testing without a real SMS provider. It is restricted to local staging and stores the generated OTP in Redis for short-lived test retrieval.

## Required services

- PostgreSQL
- Redis
- MongoDB
- Kafka

## Required environment

```text
SPRING_PROFILES_ACTIVE=local-staging
SMS_PROVIDER=local-capture
SMS_LOCAL_CAPTURE_ENABLED=true
APP_SEED_DEMO_ENABLED=false
APP_SEED_CATALOG_ENABLED=false
APP_SEED_ADMIN_DEMO_ENABLED=false
```

Provide normal local database, Redis, MongoDB, Kafka, JWT, and OTP hashing secrets through environment variables. Do not commit those values.

## Run

```powershell
cd backend
.\mvnw.cmd test
.\mvnw.cmd -DskipTests package
java -jar target\plumbing-core-0.0.1-SNAPSHOT.jar
```

Verify:

```text
GET  http://localhost:8081/actuator/health
POST http://localhost:8081/api/v1/auth/send-otp
POST http://localhost:8081/api/v1/auth/verify-otp
```

## OTP capture

The capture key is `local-staging:otp:<sha256(normalized-phone)>`. Its TTL matches the configured OTP expiry. Retrieve it only from the local Redis instance for testing and delete it after use. The sender logs only a masked phone number and never logs or returns the OTP.

## Production safety

- `local-capture` is rejected under the `prod` profile.
- Enabling local capture is rejected under the `prod` profile.
- Production startup rejects a missing or `none` SMS provider.
- `NoOpSmsSender` is excluded from both `prod` and `local-staging`.
