# Phase 14C Staging Frontend and Mobile Setup

## Backend Staging URL

```text
https://plumbing-qcommerce.onrender.com
```

Use `/health/live` for Render health checks. `/actuator/health` can report degraded status if optional infrastructure health contributors are enabled.

## Architecture

- Admin portal calls the Spring Boot backend directly.
- Customer, plumber, and store mobile apps call the Spring Boot backend directly for REST APIs.
- Edge service remains optional for WebSocket/nearby plumber flows. No Render edge-service staging URL is configured yet, so `EXPO_PUBLIC_EDGE_URL` should remain empty for backend-only staging smoke tests.

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

`NEXT_PUBLIC_API_BASE_URL` is preferred. `NEXT_PUBLIC_BACKEND_URL` remains supported for backward compatibility.

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
```

Render staging backend:

```text
EXPO_PUBLIC_API_BASE_URL=https://plumbing-qcommerce.onrender.com
EXPO_PUBLIC_BACKEND_URL=https://plumbing-qcommerce.onrender.com
EXPO_PUBLIC_EDGE_URL=
```

`EXPO_PUBLIC_API_BASE_URL` is preferred. `EXPO_PUBLIC_BACKEND_URL` remains supported for backward compatibility.

## Render Backend CORS

For local staging smoke tests and deployed admin UAT, set Render `CORS_ALLOWED_ORIGINS` to include the local admin/mobile web origins you actually use and the public Vercel admin staging URL. Do not use wildcard origins with credentials.

Current staging value:

```text
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3100,http://localhost:3101,http://localhost:19006,http://localhost:19007,http://localhost:19008,http://localhost:19009,https://admin-portal-ten-weld.vercel.app
```

## Admin Portal Smoke

```powershell
cd admin-portal
$env:NEXT_PUBLIC_API_BASE_URL="https://plumbing-qcommerce.onrender.com"
$env:NEXT_PUBLIC_BACKEND_URL="https://plumbing-qcommerce.onrender.com"
npm ci
npm run test
npm run build
npm run dev -- --port 3100
```

Then verify:

1. Login page loads.
2. `superadmin@plumbcommerce.com` / `password` logs in.
3. Dashboard/protected route loads.
4. Logout returns to login.
5. Browser network calls target `https://plumbing-qcommerce.onrender.com`, not localhost.
6. No CORS or mixed-content errors appear.

## Mobile Smoke

For each app:

```powershell
cd customer-app # or plumber-app / store-app
$env:EXPO_PUBLIC_API_BASE_URL="https://plumbing-qcommerce.onrender.com"
$env:EXPO_PUBLIC_BACKEND_URL="https://plumbing-qcommerce.onrender.com"
$env:EXPO_PUBLIC_EDGE_URL=""
npm ci
npm run typecheck
npm run test
npm run build
```

Verify app screens show API errors cleanly and do not silently fall back to mock/localhost APIs when the staging URL is configured.

## Known Limitations

- Edge service staging URL is not configured in Phase 14C.
- OTP/SMS delivery is disabled in Render staging.
- Production deployment remains `NO`.
