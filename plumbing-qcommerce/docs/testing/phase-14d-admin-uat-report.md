# Phase 14D Admin Portal UAT Report

## Scope

- Admin portal staging deployment
- Browser-based login and protected-route smoke test
- Role-wise seeded admin login verification
- Network verification against Render backend

## Endpoints Under Test

- Admin portal: `https://admin-portal-ten-weld.vercel.app`
- Backend: `https://plumbing-qcommerce.onrender.com`

## Pre-UAT Build Validation

- `npm install`: PASS
- `npm run lint`: PASS
- `npm test`: PASS
- `npm run build`: PASS

## Browser UAT Result

Overall admin UAT result: `PASS`

## Functional Results

- Login page loads: PASS
- Superadmin login succeeds: PASS
- Token is stored correctly: PASS
- Redirect to dashboard works: PASS
- Protected routes work after refresh: PASS
- Dashboard loads from Render backend: PASS
- Invalid login shows clean error: PASS
- Logout works: PASS
- No localhost or `127.0.0.1` requests: PASS
- Requests target Render backend: PASS
- No mixed-content errors: PASS
- No CORS errors: PASS
- Backend `/health/live` works: PASS

## Role-wise Result

Verified successful admin login coverage:

- `superadmin@plumbcommerce.com`: PASS
- `operations@plumbcommerce.com`: PASS
- `finance@plumbcommerce.com`: PASS
- `support@plumbcommerce.com`: PASS
- `plumbermanager@plumbcommerce.com`: PASS
- `marketing@plumbcommerce.com`: PASS

Password tested for each role:

```text
password
```

## Evidence Summary

- Frontend requests go to `https://plumbing-qcommerce.onrender.com`
- No calls were made to `localhost` or `127.0.0.1`
- CORS issue was resolved after Render `CORS_ALLOWED_ORIGINS` was updated to include `https://admin-portal-ten-weld.vercel.app`
- Dashboard and authenticated admin flows load successfully from the Render backend

## Backend CORS Setting

Current required Render backend value:

```text
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3100,http://localhost:3101,http://localhost:19006,http://localhost:19007,http://localhost:19008,http://localhost:19009,https://admin-portal-ten-weld.vercel.app
```

## Final Status

- Admin portal staging deployed: `YES`
- Admin UAT: `PASS`
- Mobile staging prepared: `YES`
- Production ready: `NO`
