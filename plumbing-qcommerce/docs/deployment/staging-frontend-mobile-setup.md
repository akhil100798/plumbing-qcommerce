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

## Admin Portal Environment

Local development:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8081
NEXT_PUBLIC_BACKEND_URL=http://localhost:8081
NEXT_PUBLIC_EDGE_URL=http://localhost:3000
```

Render staging backend:

```text
NEXT_PUBLIC_API_BASE_URL=https://plumbing-qcommerce.onrender.com
NEXT_PUBLIC_BACKEND_URL=https://plumbing-qcommerce.onrender.com
NEXT_PUBLIC_EDGE_URL=
```

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
Mock fallback is now disabled by default for staging. Local demo data may be used only when both the app is running locally and `EXPO_PUBLIC_ALLOW_MOCK_FALLBACKS=true`.

## Backend Staging Seed Requirement

Render staging should enable both admin and mobile demo users:

```text
APP_DEMO_SEED_ENABLED=true
APP_MOBILE_DEMO_SEED_ENABLED=true
```

This creates verified staging accounts for:

- `superadmin@plumbcommerce.com`
- `customer@plumbcommerce.com`
- `plumber@plumbcommerce.com`
- `store@plumbcommerce.com`

Default staging password:

```text
password
```

## Render Backend CORS

For deployed admin UAT and Expo web smoke tests, keep `CORS_ALLOWED_ORIGINS` explicit and never use wildcards.

```text
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3100,http://localhost:3101,http://localhost:19006,http://localhost:19007,http://localhost:19008,http://localhost:19009,https://admin-portal-ten-weld.vercel.app
```

## Windows PowerShell Commands

Customer app:

```powershell
cd customer-app
@"
EXPO_PUBLIC_API_BASE_URL=https://plumbing-qcommerce.onrender.com
EXPO_PUBLIC_BACKEND_URL=https://plumbing-qcommerce.onrender.com
EXPO_PUBLIC_EDGE_URL=
EXPO_PUBLIC_ALLOW_MOCK_FALLBACKS=false
"@ | Set-Content .env
npm install
npm run typecheck
npm test
npm run build
```

Plumber app:

```powershell
cd plumber-app
@"
EXPO_PUBLIC_API_BASE_URL=https://plumbing-qcommerce.onrender.com
EXPO_PUBLIC_BACKEND_URL=https://plumbing-qcommerce.onrender.com
EXPO_PUBLIC_EDGE_URL=
EXPO_PUBLIC_ALLOW_MOCK_FALLBACKS=false
"@ | Set-Content .env
npm install
npm run typecheck
npm test
npm run build
```

Store app:

```powershell
cd store-app
@"
EXPO_PUBLIC_API_BASE_URL=https://plumbing-qcommerce.onrender.com
EXPO_PUBLIC_BACKEND_URL=https://plumbing-qcommerce.onrender.com
EXPO_PUBLIC_EDGE_URL=
EXPO_PUBLIC_ALLOW_MOCK_FALLBACKS=false
"@ | Set-Content .env
npm install
npm run typecheck
npm test
npm run build
```

If Expo does not pick up the env change, clear cache:

```powershell
npx expo start -c
```

## Current Phase 14F Findings

- `customer-app` now authenticates successfully against live Render staging and fails closed when edge or profile-adjacent APIs are unavailable. No fake identity or fake plumber assignment remains in staging.
- `plumber-app` now authenticates successfully against live Render staging and surfaces explicit unavailable or pending states for websocket, wallet, earnings, and material-tracking gaps instead of silent mock success.
- `store-app` now authenticates successfully against live Render staging and uses real backend identity plus explicit unavailable states for wallet, notifications, analytics, dispatch, material requests, and profile details.
- Phase 14F P0 and P1 controls are complete. Remaining mobile blockers are `P2` and `P3` items plus full real API UAT across non-core flows.
- Latest local validation PASS:
  - `customer-app`: typecheck, tests, build
  - `plumber-app`: typecheck, tests, build
  - `store-app`: typecheck, tests, build
- Latest live staging smoke PASS:
  - `/health/live`: `UP`
  - `customer@plumbcommerce.com`: login PASS
  - `plumber@plumbcommerce.com`: login PASS
  - `store@plumbcommerce.com`: login PASS
- Mobile staging remains `PARTIAL` until Phase 14F Step 4 completes the remaining real API UAT and P2/P3 cleanup.
- Production deployment remains `NO`.
