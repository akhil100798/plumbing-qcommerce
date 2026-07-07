# Phase 14C Staging Frontend and Mobile Setup

## Backend Staging URL

```text
https://plumbing-qcommerce.onrender.com
```

Use `/health/live` for Render health checks. `/actuator/health` can report degraded status if optional infrastructure health contributors are enabled.

## Architecture

- Admin portal calls the Spring Boot backend directly.
- Customer, plumber, and store mobile apps call the Spring Boot backend directly for REST APIs.
- Edge service remains optional for WebSocket and nearby plumber flows. Keep `EXPO_PUBLIC_EDGE_URL` empty for backend-only staging smoke tests.

## Admin Portal Staging URL

```text
https://admin-portal-ten-weld.vercel.app
```

## Mobile App Environment

Applies to `customer-app`, `plumber-app`, and `store-app`.

Local development:

```text
EXPO_PUBLIC_API_BASE_URL=http://localhost:8081
EXPO_PUBLIC_BACKEND_URL=http://localhost:8081
EXPO_PUBLIC_EDGE_URL=http://localhost:3000
EXPO_PUBLIC_ALLOW_MOCK_FALLBACKS=true
```

Render staging backend:

```text
EXPO_PUBLIC_API_BASE_URL=https://plumbing-qcommerce.onrender.com
EXPO_PUBLIC_BACKEND_URL=https://plumbing-qcommerce.onrender.com
EXPO_PUBLIC_EDGE_URL=
EXPO_PUBLIC_ALLOW_MOCK_FALLBACKS=false
```

`EXPO_PUBLIC_API_BASE_URL` is preferred. `EXPO_PUBLIC_BACKEND_URL` remains supported for backward compatibility.
Mock fallback is disabled by default for staging. Local demo data may be used only when both the app is running locally and `EXPO_PUBLIC_ALLOW_MOCK_FALLBACKS=true`.

## Backend Staging Seed Requirement

```text
APP_DEMO_SEED_ENABLED=true
APP_MOBILE_DEMO_SEED_ENABLED=true
```

Default staging accounts:

- `superadmin@plumbcommerce.com`
- `customer@plumbcommerce.com`
- `plumber@plumbcommerce.com`
- `store@plumbcommerce.com`

Default staging password:

```text
password
```

## Render Backend CORS

```text
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3100,http://localhost:3101,http://localhost:19006,http://localhost:19007,http://localhost:19008,http://localhost:19009,https://admin-portal-ten-weld.vercel.app
```

## Current Phase 14F Findings

- Customer staging no longer simulates payment-method mutation, payment confirmation, delivery OTP confirmation, or service completion success.
- Plumber staging no longer simulates navigation arrival or photo-upload success; those flows now fail closed with clear unavailable states.
- Store staging no longer exposes mock reviews or promotions as live staging data.
- Remaining fixture-only P3 items are limited to tests, dev examples, and web QA fallback components.
- Local validation PASS:
  - `customer-app`: typecheck, tests, build
  - `plumber-app`: typecheck, tests, build
  - `store-app`: typecheck, tests, build
- Latest live staging smoke PASS:
  - `/health/live`: `UP`
  - `customer@plumbcommerce.com`: login PASS
  - `plumber@plumbcommerce.com`: login PASS
  - `store@plumbcommerce.com`: login PASS
- Mobile staging remains `PARTIAL` because several real backend endpoints are still unavailable, but staging no longer reports fake success for those flows.
- Production deployment remains `NO`.
