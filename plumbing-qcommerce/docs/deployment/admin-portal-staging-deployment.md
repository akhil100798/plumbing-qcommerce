# Admin Portal Staging Deployment

## Status

- Deployment platform: `Vercel`
- Admin staging URL: `https://admin-portal-ten-weld.vercel.app`
- Backend staging URL: `https://plumbing-qcommerce.onrender.com`
- CORS update: `PASS`
- Admin UAT: `PASS`
- Production readiness: `NO`

## Vercel Project Settings

- Root Directory: `admin-portal`
- Framework Preset: `Next.js`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: default Next.js output

## Required Environment Variables

```text
NEXT_PUBLIC_API_BASE_URL=https://plumbing-qcommerce.onrender.com
NEXT_PUBLIC_BACKEND_URL=https://plumbing-qcommerce.onrender.com
NEXT_PUBLIC_EDGE_URL=
```

`NEXT_PUBLIC_API_BASE_URL` is the preferred variable. `NEXT_PUBLIC_BACKEND_URL` stays enabled for backward compatibility.

## Deployed Staging URL

Use this public staging URL for admin UAT:

```text
https://admin-portal-ten-weld.vercel.app
```

Vercel preview deployments may require Vercel authentication depending on the team/project settings. Use the public alias above for shared staging validation.

## Backend CORS

Render backend `CORS_ALLOWED_ORIGINS` now includes the deployed admin portal origin:

```text
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3100,http://localhost:3101,http://localhost:19006,http://localhost:19007,http://localhost:19008,http://localhost:19009,https://admin-portal-ten-weld.vercel.app
```

Do not use wildcard origins.

## Deployment Notes

- The admin portal build succeeds on Vercel after switching the build script back to `next build`.
- The public staging app loads successfully.
- Render backend CORS was updated to allow the Vercel admin staging URL.
- Admin login and dashboard flows now work against the Render backend.
- Production readiness remains `NO`.

## Local Validation

Run from `admin-portal`:

```powershell
npm install
npm run lint
npm test
npm run build
```

Validated result for Phase 14D:

- `npm install`: PASS
- `npm run lint`: PASS
- `npm test`: PASS
- `npm run build`: PASS

## Final Outcome

1. Admin portal staging deployed: `YES`
2. Admin UAT: `PASS`
3. Mobile staging prepared: `YES`
4. Production readiness: `NO`
