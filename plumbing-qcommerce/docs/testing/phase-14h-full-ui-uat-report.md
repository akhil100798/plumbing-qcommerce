# Phase 14H - Full UI-Based Live UAT Report

## Scope

- Project: `PlumbCommerce / plumbing-qcommerce`
- Branch: `phase13a-local-staging-sms`
- Backend target: `https://plumbing-qcommerce.onrender.com`
- UI method used: Expo web + Playwright screenshot capture
- Mock fallback setting: `EXPO_PUBLIC_ALLOW_MOCK_FALLBACKS=false`
- Production ready: `NO`

## Environment Prepared

Local `.env` files were created for:

- `customer-app/.env`
- `plumber-app/.env`
- `store-app/.env`

All three were configured with:

```text
EXPO_PUBLIC_API_BASE_URL=https://plumbing-qcommerce.onrender.com
EXPO_PUBLIC_BACKEND_URL=https://plumbing-qcommerce.onrender.com
EXPO_PUBLIC_EDGE_URL=
EXPO_PUBLIC_ALLOW_MOCK_FALLBACKS=false
```

## Validation Commands

### Customer app

- `npm run typecheck` - PASS
- `npm test` - PASS (`8/8`)
- `npm run build` - PASS

### Plumber app

- `npm run typecheck` - PASS
- `npm test` - PASS (`7/7`)
- `npm run build` - PASS

### Store app

- `npm run typecheck` - PASS
- `npm test` - PASS (`10/10`)
- `npm run build` - PASS
- Build warning: missing `./assets/favicon.png`

## Auth Fixes Applied

### App-side fixes

- `store-app` primary login button now uses the same `Pressable` interaction model already used by the working button implementations.
- `customer-app` now exposes a staging-safe email/password login option when pointed at the Render staging backend.
- `plumber-app` now exposes a staging-safe email/password login option when pointed at the Render staging backend.
- `plumber-app` password login no longer incorrectly routes through OTP send.
- All three mobile API clients now normalize backend URLs so either of these env shapes work safely:
  - `https://plumbing-qcommerce.onrender.com`
  - `https://plumbing-qcommerce.onrender.com/api/v1`

### Verified result

- Customer web login now issues `POST https://plumbing-qcommerce.onrender.com/api/v1/auth/login`
- Plumber web login now issues `POST https://plumbing-qcommerce.onrender.com/api/v1/auth/login`
- Store web login now issues `POST https://plumbing-qcommerce.onrender.com/api/v1/auth/login`

This confirms the previous app-side request-path bug is fixed.

## Evidence Captured

### Customer app

- `docs/evidence/phase-14h-ui-uat/customer-app/00-smoke.png`
- `docs/evidence/phase-14h-ui-uat/customer-app/01-post-splash.png`
- `docs/evidence/phase-14h-ui-uat/customer-app/02-login.png`
- `docs/evidence/phase-14h-ui-uat/customer-app/03-login-filled-fixed.png`
- `docs/evidence/phase-14h-ui-uat/customer-app/04-post-login-fixed.png`

### Plumber app

- `docs/evidence/phase-14h-ui-uat/plumber-app/01-login.png`
- `docs/evidence/phase-14h-ui-uat/plumber-app/02-login-after-splash.png`
- `docs/evidence/phase-14h-ui-uat/plumber-app/03-login-filled-fixed.png`
- `docs/evidence/phase-14h-ui-uat/plumber-app/04-post-login-fixed.png`

### Store app

- `docs/evidence/phase-14h-ui-uat/store-app/01-login.png`
- `docs/evidence/phase-14h-ui-uat/store-app/02-login-email-mode.png`
- `docs/evidence/phase-14h-ui-uat/store-app/03-login-filled.png`
- `docs/evidence/phase-14h-ui-uat/store-app/04-post-login.png`
- `docs/evidence/phase-14h-ui-uat/store-app/05-login-filled-fixed.png`
- `docs/evidence/phase-14h-ui-uat/store-app/06-post-login-fixed.png`

## Customer App UI UAT

### Screens reached through UI

- Splash screen - PASS
- Onboarding screen - PASS
- Login screen - PASS
- Staging credential login mode - PASS
- Credential submit attempt - PASS

### Live observations

- Splash auto-advanced into onboarding.
- `Skip` navigation worked and reached the login screen.
- A staging-safe credential login option is now visible on web against the Render backend.
- `customer@plumbcommerce.com` / `password` can be entered through the UI.
- The app now issues the correct real backend login request path.
- The request is currently blocked by browser CORS from local Expo web origin.

### Customer verdict

- UI shell and credential submit path: PASS
- Authenticated live UAT from localhost web: BLOCKED by CORS
- Overall: PARTIAL

## Plumber App UI UAT

### Screens reached through UI

- Splash screen - PASS
- Login screen - PASS
- Staging credential login mode - PASS
- Credential submit attempt - PASS

### Live observations

- Splash rendered correctly and advanced to login.
- A staging-safe credential login option is now visible on web against the Render backend.
- `plumber@plumbcommerce.com` / `password` can be entered through the UI.
- The previous app-side bug where the password screen still triggered OTP flow is fixed.
- The app now issues the correct real backend login request path.
- The request is currently blocked by browser CORS from local Expo web origin.

### Plumber verdict

- UI shell and credential submit path: PASS
- Authenticated live UAT from localhost web: BLOCKED by CORS
- Overall: PARTIAL

## Store App UI UAT

### Screens reached through UI

- Login screen in OTP mode - PASS
- Login screen in email/password mode - PASS
- Credential entry screen - PASS
- Credential submit attempt - PASS

### Live observations

- Store app loaded the real login screen against the staging env.
- The `Login with Email / Password` toggle worked through UI.
- `store@plumbcommerce.com` and `password` were entered through the UI fields successfully.
- The previous app-side bug that prevented submit from issuing a real login request is fixed.
- The app now issues the correct real backend login request path.
- The request is currently blocked by browser CORS from local Expo web origin.

### Store verdict

- UI shell and credential submit path: PASS
- Authenticated live UAT from localhost web: BLOCKED by CORS
- Overall: PARTIAL

## Cross-App Findings

### Confirmed

- All three apps build successfully with staging env values pointing to Render.
- Real UI shells render for customer, plumber, and store on Expo web.
- All three apps now issue the correct real backend login request path.
- The earlier duplicate `/api/v1/api/v1/...` request bug is fixed.
- Mock fallback remains disabled.
- No localhost backend requests were used.

### Current blocker

The remaining blocker is now environment-level rather than app-level:

1. Render backend CORS does not currently allow the active local Expo web origins used during this pass.
2. Browser failure observed:
   - `Access to XMLHttpRequest ... has been blocked by CORS policy`
3. Because the browser blocks the login response, authenticated dashboards cannot yet be reached from local Expo web.

## Recommended next step

Update Render `CORS_ALLOWED_ORIGINS` to include the active local web origins used for UI UAT, for example:

- `http://localhost:19106`
- `http://localhost:19107`
- `http://localhost:19108`

After that, rerun the Phase 14H web login flow and recapture post-login dashboard screenshots.

## Final Verdict

```text
CUSTOMER APP UI UAT: PARTIAL
PLUMBER APP UI UAT: PARTIAL
STORE APP UI UAT: PARTIAL
FULL LIVE MOBILE UI UAT: BLOCKED ON RENDER CORS FOR LOCAL EXPO WEB ORIGINS
MOBILE STAGING READY: PARTIAL
PRODUCTION READY: NO
```
