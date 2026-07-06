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

Overall admin UAT result: `FAIL`

### Root Cause

Backend Render CORS is blocking the deployed admin portal origin.

Observed browser error:

```text
Access to fetch at 'https://plumbing-qcommerce.onrender.com/api/v1/auth/login' from origin 'https://admin-portal-ten-weld.vercel.app' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Functional Results

- Login page loads: PASS
- Invalid login shows clean application error: FAIL
  - Current behavior: `Failed to fetch` because the request is blocked at preflight time.
- Superadmin login succeeds: FAIL
- Token stored in session storage: BLOCKED
- Redirect to dashboard works: BLOCKED
- Protected routes survive refresh: BLOCKED
- Logout works: BLOCKED
- No localhost or `127.0.0.1` requests: PASS
- Requests target Render backend: PASS
- No mixed-content errors: PASS
- No CORS errors: FAIL

## Role-wise Result

All role logins are blocked by the same backend CORS policy issue:

- `superadmin@plumbcommerce.com`: FAIL
- `operations@plumbcommerce.com`: FAIL
- `finance@plumbcommerce.com`: FAIL
- `support@plumbcommerce.com`: FAIL
- `plumbermanager@plumbcommerce.com`: FAIL
- `marketing@plumbcommerce.com`: FAIL

Password tested for each role:

```text
password
```

## Evidence Summary

- Frontend requests go to `https://plumbing-qcommerce.onrender.com`
- No calls were made to `localhost` or `127.0.0.1`
- Browser automation captured the CORS preflight failure before auth could complete

## Required Backend Fix

Update Render backend environment variable:

```text
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3100,http://localhost:3101,http://localhost:19006,http://localhost:19007,http://localhost:19008,http://localhost:19009,https://admin-portal-ten-weld.vercel.app
```

Redeploy the Render backend after saving the environment variable.

## Final Status

- Admin portal staging deployed: `YES`
- Admin UAT: `FAIL`
- Mobile staging prepared: `YES`
- Production ready: `NO`
