# Phase 13D.5 — Web Runtime and CORS Cleanup

Date: 2026-07-05

## Executive Summary

Phase 13D.5 removed the browser runtime errors caused by direct `expo-secure-store` calls in web builds, tightened local-staging CORS behavior, and revalidated the local golden path.

Current verdict:

```text
LOCAL GOLDEN PATH CLEAN — CLOUD STAGING NEXT
```

Production deployment remains:

```text
NO
```

## Web Runtime Fix

Customer, plumber, and store web builds now use a platform-aware token storage abstraction.

- Native runtimes continue to use `expo-secure-store`.
- Web runtime uses `localStorage`.
- Tokens are not logged.
- OTPs are not logged.
- Full phone numbers are not logged.

Files updated:

- `customer-app/src/services/tokenStorage.ts`
- `customer-app/src/services/apiClient.ts`
- `customer-app/src/screens/auth/SplashScreen.tsx`
- `plumber-app/src/services/api/tokenStorage.ts`
- `plumber-app/src/services/api/axiosClient.ts`
- `plumber-app/src/screens/auth/SplashScreen.tsx`
- `store-app/src/services/api/tokenStorage.ts`
- `store-app/src/services/api/axiosClient.ts`

## CORS Cleanup

Backend local-staging CORS now uses explicit allowed origins instead of wildcard loopback origin patterns.

Allowed local web origins:

```text
http://localhost:3101
http://localhost:19007
http://localhost:19008
http://localhost:19009
http://localhost:3000
```

Rejected origin examples:

```text
http://127.0.0.1:19007
http://evil.example
```

Backend now fails fast if wildcard CORS origins are configured.

Edge CORS now rejects bad HTTP origins with a controlled 403 instead of raising a server error.

## Verification Evidence

### Customer App

```text
npm run typecheck: PASS
npm test: PASS — 2 files, 4 tests
npx expo export --platform web --output-dir dist-phase13d5: PASS
Browser SecureStore console errors: 0
```

### Plumber App

```text
npm run typecheck: PASS
npm test: PASS — 2 files, 5 tests
npx expo export --platform web --output-dir dist-phase13d5: PASS
Browser SecureStore console errors: 0
```

### Store App

```text
npm run typecheck: PASS
npm test: PASS — 2 files, 8 tests
npx expo export --platform web --output-dir dist-phase13d5: PASS
Browser SecureStore console errors: 0
```

Observed non-blocking warnings:

- Expo favicon file is missing from store app config.
- React Native web deprecation warnings are still present.
- Existing store service require-cycle warning remains.

These warnings do not expose tokens, OTPs, secrets, or full phone numbers.

### Backend

```text
.\mvnw.cmd "-Dtest=CorsConfigurationSecurityTest" test: PASS — 3 tests
.\mvnw.cmd "-Dtest=*Cors*,*Security*" test: PASS — 33 tests
.\mvnw.cmd test: PASS — 215 tests, 0 failures, 0 errors
.\mvnw.cmd -DskipTests package: PASS
```

Runtime CORS checks:

```text
Backend allowed origin http://localhost:19007: PASS
Backend rejected origin http://127.0.0.1:19007: PASS — 403
Edge allowed origin http://localhost:3101: PASS
Edge rejected origin http://evil.example: PASS — 403
```

### Edge Service

```text
npm test -- server.security.test.js: PASS — 13 tests
npm test: PASS — 2 files, 16 tests
npm run build: PASS
```

### Admin Portal

```text
npm test: PASS — 1 file, 2 tests
npm run build: PASS
Browser login smoke: PASS
Dashboard smoke: PASS
Users page smoke: PASS
System health smoke: PASS
Logout session clear: PASS
Console errors: 0
```

Admin build emitted a known non-fatal traced-file copy warning from Next.js build output.

### Local Golden Path Smoke

```text
Customer registration/login: PASS
Address creation: PASS
Product checkout: PASS
Store order accept/pack/handover: PASS
Delivery OTP acceptance: PASS
Plumber WebSocket connect: PASS
Plumber socket spoof rejection: PASS
Service completion: PASS
Data consistency: PASS
Failed steps: none
```

Payment readiness note:

```text
PARTIAL — no real payment gateway was exercised in local-staging.
Checkout confirmation used the local/mock flow.
Cloud staging must use the approved sandbox payment path or a documented payment-disabled pilot path.
```

## Log Safety

Local runtime logs were scanned for obvious sensitive data exposure.

```text
Bearer tokens: not found
Token JSON fields: not found
Refresh token fields: not found
Password fields: not found
Plain OTP patterns: not found
Full test phone numbers: not found
JWT secret assignment: not found
```

## Remaining Blockers

- Remote CI has not been verified for this commit.
- Cloud staging environment has not been started.
- Cloud staging golden path has not been run.
- Real or sandbox payment flow has not been proven in staging.
- Production deployment is not approved.

## Recommendation

Proceed to cloud staging setup only after this cleanup commit is pushed and remote CI passes.

Do not deploy to production until remote CI and cloud staging golden path validation are complete.

