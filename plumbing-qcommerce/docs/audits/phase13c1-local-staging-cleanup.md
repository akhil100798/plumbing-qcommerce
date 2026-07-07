# Phase 13C.1 Local-Staging Cleanup

## Cleanup scope
- Branch: `phase13a-local-staging-sms`
- Starting commit: `0e74b80`
- Goal: remove generated local clutter, keep reusable edge diagnostics, and align local-staging defaults with Phase 13D golden-path expectations.

## Expo cache cleanup
- Removed generated `store-app/.expo/` from the working tree.
- Added `store-app/.expo/` to the root `.gitignore` so future Expo cache output stays out of commits.

## Edge smoke script decision
- Kept the smoke harness because it is reusable for Phase 13D/13E edge validation.
- Moved it from `edge-service/local-staging.security.smoke.js` to `edge-service/scripts/local-staging.security.smoke.js`.
- Added `npm run smoke:local-staging` in `edge-service/package.json`.
- Script review result: no hardcoded JWTs, no real phone numbers, no personal values, and test identities come from environment variables.

## Customer env correction
- `customer-app/.env` is a local ignored file, not a tracked repository default.
- Normalized the local workspace `customer-app/.env` values to:
  - `EXPO_PUBLIC_BACKEND_URL=http://localhost:8081`
  - `EXPO_PUBLIC_EDGE_URL=http://localhost:3000`
- Added tracked `customer-app/.env.example` with:
  - safe local-staging defaults
  - documented Android emulator `10.0.2.2` examples as comments only
  - documented physical-device LAN examples as comments only

## URL scan result
- Active local workspace `customer-app/.env` no longer contains `10.0.2.2`.
- `10.0.2.2` now appears only in commented examples inside `customer-app/.env.example`.
- Expected local-staging localhost fallbacks remain in config/source files:
  - `admin-portal/src/services/apiClient.ts`
  - `customer-app/src/services/apiClient.ts`
  - `customer-app/src/screens/HomeScreen.tsx`
  - `customer-app/src/services/plumbers/plumberRepository.ts`
  - `plumber-app/src/services/api/axiosClient.ts`
  - `plumber-app/src/services/websocket/websocketService.ts`
  - `store-app/src/services/api/axiosClient.ts`
- No `127.0.0.1` occurrences were found in the scanned source/config files.
- No obvious secrets were found in the focused source scan.

## Validation result
- Customer app:
  - `npm run typecheck`: PASS
  - `npm test`: PASS (`2/2`)
- Store app:
  - `npm run typecheck`: PASS
  - `npm test`: PASS (`6/6`)
- Edge smoke:
  - `npm run smoke:local-staging`: BLOCKED in this session because required env vars (`JWT_SECRET`, `TEST_CUSTOMER_ID`, `TEST_CUSTOMER_EMAIL`, `TEST_PLUMBER_ID`, `TEST_PLUMBER_EMAIL`) were not set

## Remaining blockers
- The reusable edge smoke harness still needs explicit local test env vars before it can run end-to-end.
- Phase 13D golden-path browser/app interaction is still the next gate.
- Staging deployment remains blocked.
- Production deployment remains `NO`.
