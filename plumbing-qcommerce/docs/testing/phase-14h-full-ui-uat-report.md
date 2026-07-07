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

- Customer web issues `POST https://plumbing-qcommerce.onrender.com/api/v1/auth/login` and reaches authenticated home.
- Plumber web issues `POST https://plumbing-qcommerce.onrender.com/api/v1/auth/login` and reaches authenticated dashboard.
- Store web issues `POST https://plumbing-qcommerce.onrender.com/api/v1/auth/login` and reaches authenticated dashboard and inventory.

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
- `docs/evidence/phase-14h-ui-uat/store-app/07-inventory-fixed.png`

## Customer App UI UAT

### Screens reached through UI

- Splash screen - PASS
- Onboarding screen - PASS
- Login screen - PASS
- Staging credential login mode - PASS
- Post-login home screen - PASS

### Live observations

- Splash auto-advanced into onboarding.
- `Skip` navigation worked and reached the login screen.
- A staging-safe credential login option is visible on web against the Render backend.
- `customer@plumbcommerce.com` / `password` can be entered through the UI.
- The app issues the correct real backend login request path.
- After login, authenticated home content loads, including greeting, search, nearby stores, and product cards.

### Customer verdict

- UI auth/login path: PASS
- Post-login home capture: PASS
- Overall: PASS

## Plumber App UI UAT

### Screens reached through UI

- Splash screen - PASS
- Login screen - PASS
- Staging credential login mode - PASS
- Post-login dashboard - PASS

### Live observations

- Splash rendered correctly and advanced to login.
- A staging-safe credential login option is visible on web against the Render backend.
- `plumber@plumbcommerce.com` / `password` can be entered through the UI.
- The previous app-side bug where the password screen still triggered OTP flow is fixed.
- After login, authenticated dashboard content loads, including online state, wallet, quick actions, and bottom navigation.
- A non-blocking geolocation warning still appears on web.

### Plumber verdict

- UI auth/login path: PASS
- Post-login dashboard capture: PASS
- Overall: PASS

## Store App UI UAT

### Screens reached through UI

- Login screen in OTP mode - PASS
- Login screen in email/password mode - PASS
- Credential entry screen - PASS
- Post-login dashboard - PASS
- Inventory screen - PASS

### Live observations

- Store app loaded the real login screen against the staging env.
- The `Login with Email / Password` toggle worked through UI.
- `store@plumbcommerce.com` and `password` were entered through the UI fields successfully.
- The previous app-side bug that prevented submit from issuing a real login request is fixed.
- After login, authenticated dashboard content loads.
- Inventory screen loads and correctly shows the current empty-state for products.

### Store verdict

- UI auth/login path: PASS
- Post-login dashboard/inventory capture: PASS
- Overall: PASS

## Cross-App Findings

### Confirmed

- All three apps build successfully with staging env values pointing to Render.
- Real UI shells render for customer, plumber, and store on Expo web.
- All three apps now issue the correct real backend login request path.
- Authenticated post-login UI now loads successfully for all three apps.
- Mock fallback remains disabled.
- No localhost backend requests were used.

### Remaining limitations

1. Phase 14H now confirms login and initial authenticated dashboard/home reachability.
2. This pass does not yet revalidate every deeper post-login flow across all tabs/screens.
3. Plumber web still shows a non-blocking geolocation warning.
4. Store inventory currently shows a valid empty-state rather than seeded product rows.

## Final Verdict

```text
APP-SIDE AUTH FIX: PASS
CUSTOMER APP UI UAT: PASS
PLUMBER APP UI UAT: PASS
STORE APP UI UAT: PASS
FULL LIVE MOBILE UI UAT: PARTIAL
MOBILE STAGING READY: PARTIAL
PRODUCTION READY: NO
```
