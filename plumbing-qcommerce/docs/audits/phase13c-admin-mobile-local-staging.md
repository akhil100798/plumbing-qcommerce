# Phase 13C Admin and Mobile Local Staging Validation

## Backend and edge dependency status
- Backend health: `UP` on `http://localhost:8081/actuator/health`
- Backend API docs: HTTP `200` on `http://localhost:8081/api-docs`
- Edge health: `UP` on `http://localhost:3000/api/v1/edge/health`
- Edge Redis adapter: `CONNECTED`
- Kafka/Zookeeper: stable from Phase 13B.3

## Repo state
- Branch: `phase13a-local-staging-sms`
- Previous commit: `3c179b9`
- Working tree before this phase was clean except untracked `edge-service/local-staging.security.smoke.js`

## App structure summary
### Admin portal
- Package manager: `npm`
- Env file pattern: `.env.local` supported and ignored by `.gitignore`
- API config: `admin-portal/src/services/apiClient.ts`
- Edge config: no active edge client found in current source; local env still provisioned for future use
- Start command: `npm run dev`
- Lint command: `npm run lint`
- Test command: `npm test`
- Build command: `npm run build`

### Customer app
- Package manager: `npm`
- Env file pattern: checked-in `.env` exists; `.env.local` also loads in Expo and is ignored
- API config: `customer-app/src/services/apiClient.ts`
- Edge config: `customer-app/src/screens/HomeScreen.tsx`
- Start command: `npm run web` / `expo start --web`
- Typecheck command: `npm run typecheck`
- Test command: `npm test`
- Export command: `npx expo export --platform web`

### Plumber app
- Package manager: `npm`
- Env file pattern: `.env.local` supported and ignored
- API config: `plumber-app/src/services/api/axiosClient.ts`
- Edge config: `plumber-app/src/services/websocket/websocketService.ts`
- Start command: `npm run web` / `expo start --web`
- Typecheck command: `npm run typecheck`
- Test command: `npm test`
- Export command: `npx expo export --platform web`

### Store app
- Package manager: `npm`
- Env file pattern: `.env.local` created for this phase
- API config: `store-app/src/services/api/axiosClient.ts`
- Edge config: no active socket client found in current source
- Start command: `npm run web` / `expo start --web`
- Typecheck command: `npm run typecheck`
- Test command: `npm test`
- Export command: `npx expo export --platform web`

## Local-staging env configuration result
Created local-only env files and did not modify production env files:
- `admin-portal/.env.local`
- `customer-app/.env.local`
- `plumber-app/.env.local`
- `store-app/.env.local`

Configured values:
- Backend: `http://localhost:8081`
- Edge: `http://localhost:3000`

## Validation results
### Admin portal
- `npm ci`: PASS
- `npm run lint`: PASS
- `npm test`: PASS (2/2)
- `npm run build`: PASS, with a post-build traced-files warning from Next standalone copy
- Runtime shell: PASS — local dev server responded on `http://localhost:3101`
- Playwright page probe: PASS — login page loaded with title `PlumbCommerce | Super Admin Portal`
- API URL target: `http://localhost:8081`
- Edge URL target: local env prepared, not actively exercised in source during this phase
- Log safety: no token leakage observed in captured startup logs

### Customer app
- `npm ci`: PASS
- `npm run typecheck`: PASS
- `npm test`: PASS (2/2)
- `npx expo export --platform web`: PASS
- Runtime shell: PASS — Expo web runtime responded on `http://localhost:19007`
- API URL target: `http://localhost:8081`
- Edge URL target: `http://localhost:3000`
- Log safety: no token leakage observed in captured startup logs
- Note: deeper OTP/catalog/cart/checkout interaction was not automated in this shell-only pass

### Plumber app
- `npm ci`: PASS
- `npm run typecheck`: PASS
- `npm test`: PASS (3/3)
- `npx expo export --platform web`: PASS
- Runtime shell: PASS — Expo web runtime responded on `http://localhost:19008`
- API URL target: `http://localhost:8081`
- Edge URL target: `http://localhost:3000`
- Log safety: no token leakage observed in captured startup logs
- Note: deeper job-flow and live location interaction was not automated in this shell-only pass

### Store app
- `npm ci`: PASS
- `npm run typecheck`: PASS
- `npm test`: PASS (6/6)
- `npx expo export --platform web`: PASS, with favicon warning because `./assets/favicon.png` is missing
- Runtime shell: PASS — Expo web runtime responded on `http://localhost:19009`
- API URL target: `http://localhost:8081`
- Edge URL target: local env prepared; no active socket client found in current source during this phase
- Log safety: no token leakage observed in captured startup logs
- Note: deeper store dashboard/order/inventory interactions were not automated in this shell-only pass

## URL scan result
- Allowed local-staging URLs found in config and source as expected
- Unexpected localhost variants found:
  - `customer-app/.env` still contains checked-in `http://10.0.2.2:8081` and `http://10.0.2.2:3000`
- Hardcoded source fallbacks to localhost remain in multiple clients, but they align with local-staging and were not changed in this phase
- Generated bundle scan did not reveal unwanted `127.0.0.1` variants in built output

## Remaining blockers
- `customer-app/.env` still contains Android-emulator `10.0.2.2` values and should be handled carefully in later cleanup if the team wants local-staging defaults unified.
- Deeper browser-driven interactive smoke flows for admin/customer/plumber/store were not fully automated in this shell-only pass.
- Production remains `NO`.
