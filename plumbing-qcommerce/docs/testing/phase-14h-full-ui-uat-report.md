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

## Evidence Captured

### Customer app

- `docs/evidence/phase-14h-ui-uat/customer-app/00-smoke.png`
- `docs/evidence/phase-14h-ui-uat/customer-app/01-post-splash.png`
- `docs/evidence/phase-14h-ui-uat/customer-app/02-login.png`

### Plumber app

- `docs/evidence/phase-14h-ui-uat/plumber-app/01-login.png`
- `docs/evidence/phase-14h-ui-uat/plumber-app/02-login-after-splash.png`

### Store app

- `docs/evidence/phase-14h-ui-uat/store-app/01-login.png`
- `docs/evidence/phase-14h-ui-uat/store-app/02-login-email-mode.png`
- `docs/evidence/phase-14h-ui-uat/store-app/03-login-filled.png`
- `docs/evidence/phase-14h-ui-uat/store-app/04-post-login.png`

## Customer App UI UAT

### Screens reached through UI

- Splash screen - PASS
- Onboarding screen - PASS
- Login screen - PASS

### Live observations

- Splash auto-advanced into onboarding.
- `Skip` navigation worked and reached the login screen.
- Login screen rendered the real mobile-number auth flow.
- No backend request was observed during initial onboarding/login rendering.
- No localhost backend request was observed during the captured login path.

### Blockers

- The customer app login UI is phone-and-OTP based, not email/password based.
- In this session, the shared primary action button did not trigger the expected web automation submit path, so a real OTP send/verify cycle could not be completed from automated web UI.
- Because staging SMS is disabled and there is no visible staging OTP capture screen in the customer UI flow, authenticated customer UAT remains blocked.

### Customer verdict

- Splash/onboarding/login shell: PASS
- Authenticated live UAT: BLOCKED
- Overall: PARTIAL

## Plumber App UI UAT

### Screens reached through UI

- Splash screen - PASS
- Login screen - PASS

### Live observations

- Splash rendered correctly and advanced to login.
- Login screen rendered mobile number, password, remember-me, forgot-password, and social options.
- No backend request was observed during initial login-screen rendering.
- No localhost backend request was observed during the captured login path.

### Blockers

- The live plumber UI could be opened and inspected, but authenticated UAT was not completed in this session.
- The plumber login path remains blocked for full live UAT because the app still depends on a phone/OTP-driven auth flow for actual session progression.
- As with customer/store, the shared primary button path did not provide a successful automated submission result in this web run.

### Plumber verdict

- Splash/login shell: PASS
- Authenticated live UAT: BLOCKED
- Overall: PARTIAL

## Store App UI UAT

### Screens reached through UI

- Login screen in OTP mode - PASS
- Login screen in email/password mode - PASS
- Credential entry screen - PASS

### Live observations

- Store app loaded the real login screen against the staging env.
- The `Login with Email / Password` toggle worked through UI.
- `store@plumbcommerce.com` and `password` were entered through the UI fields successfully.
- After credential entry, the web UI remained on the login screen.
- No `/api/v1/auth/login` request was observed during the attempted submit.
- No localhost backend request was observed during initial UI rendering or mode toggle.

### Blockers

- Store credential submission could not be completed through this automated web UI path because the primary login action did not produce a network request.
- Deeper store flows such as dashboard, inventory, incoming orders, and material requests remain unverified through UI in this session.

### Store verdict

- Login shell and credential mode toggle: PASS
- Live credential submit: BLOCKED
- Overall: PARTIAL

## Cross-App Findings

### Confirmed

- All three apps build successfully with staging env values pointing to Render.
- Real UI shells render for customer, plumber, and store on Expo web.
- No localhost backend API request was observed in the captured pre-auth UI paths.
- Mock fallback was disabled in env for this run.

### Current blockers

1. Customer app live login is OTP-based and not currently completable from available staging UI evidence.
2. Plumber app live login is not yet completable through the current automated web path.
3. Store app email/password mode renders, but submit does not issue the login request under this web automation run.
4. Because auth could not be completed through UI, downstream dashboards and role-specific business flows remain unverified in Phase 14H.

## Recommendations

1. Verify the primary button interaction manually in a normal browser, Android emulator, or physical device.
2. Provide a staging-safe OTP capture path for customer and plumber live UAT, or enable a dedicated staging test auth path.
3. Confirm whether the store app login submit issue is:
   - a web-only React Native interaction bug, or
   - a broader store login regression.
4. Resume full authenticated UI UAT only after one of the above auth blockers is cleared.

## Final Verdict

```text
CUSTOMER APP UI UAT: PARTIAL
PLUMBER APP UI UAT: PARTIAL
STORE APP UI UAT: PARTIAL
FULL LIVE MOBILE UI UAT: BLOCKED ON AUTH / WEB INTERACTION
MOBILE STAGING READY: PARTIAL
PRODUCTION READY: NO
```
