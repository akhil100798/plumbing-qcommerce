# Phase 13B.2 Users Me Auth Fix

## Root cause
The backend security matcher order treated `GET /api/v1/users/me` as part of the broader admin-only `/api/v1/users/**` rule. Authenticated `CUSTOMER` and `PLUMBER` users therefore received `403` on their own profile endpoint, which also blocked Edge socket authentication because the edge middleware validates JWTs through the backend `GET /api/v1/users/me` call.

## Code fix summary
- Added `requestMatchers(HttpMethod.GET, "/api/v1/users/me").authenticated()` before the broad admin-only users matcher in `backend/src/main/java/com/pqc/core/config/SecurityConfig.java`.
- Expanded `backend/src/test/java/com/pqc/core/security/UserEndpointSecurityTest.java` with regression coverage for unauthenticated, customer, plumber, admin, and super-admin access paths plus admin-only route protection.

## Backend regression results
- Targeted backend tests: PASS — `UserEndpointSecurityTest` 8/8.
- Full backend tests: PASS — 205 tests, 0 failures, 0 errors.

## Local runtime recovery
- Expected PostgreSQL host: `localhost`
- Expected PostgreSQL port: `5433`
- Expected database: `plumbing_commerce`
- Expected username: `admin`
- Compose file: `docker-compose.yml`
- Postgres service name: `postgres` / container `pqc_postgres`
- Docker Desktop was initially unavailable and blocked local runtime recovery.
- Local PostgreSQL was restored via Docker Desktop and verified reachable on `localhost:5433`.
- Redis and MongoDB were verified reachable from their running local containers.
- Zookeeper recovered, while the Kafka container still exits with a stale broker registration (`NodeExists`) issue. This did not block the auth and socket security validation performed in this phase.

## Backend local-staging runtime
- Backend startup: PASS — host jar launched in `local-staging` on port `8081`.
- Health endpoint: PASS — `GET /actuator/health` returned `UP`.
- API docs: PASS — `GET /api-docs` returned HTTP 200.

## Runtime auth verification
- CUSTOMER `GET /api/v1/users/me`: PASS — HTTP 200.
- PLUMBER `GET /api/v1/users/me`: PASS — HTTP 200.
- ADMIN `GET /api/v1/users/me`: PASS — HTTP 200.
- Unauthenticated `GET /api/v1/users/me`: PASS — HTTP 401.
- CUSTOMER admin-only `/api/v1/users`: PASS — HTTP 403.
- PLUMBER admin-only `/api/v1/users`: PASS — HTTP 403.
- ADMIN admin-only `/api/v1/users`: PASS — HTTP 200.

## Edge local-staging validation
- `npm ci`: PASS.
- `npm test`: PASS — 15/15.
- `npm run build`: PASS.
- Edge health: PASS — `GET /api/v1/edge/health` returned `UP` with Redis adapter connected.
- Explicit CORS: PASS — allowed origin returned `http://localhost:3100`; no wildcard was used.
- Missing JWT rejected: PASS.
- Invalid JWT rejected: PASS.
- Valid customer socket connects: PASS.
- Valid plumber socket connects: PASS.
- Room spoofing rejected: PASS.
- Location spoofing rejected: PASS.
- Invalid coordinates rejected: PASS.
- Valid authorized location update succeeds: PASS.
- Log safety: PASS — smoke harness confirmed no token leakage in edge logs.

## Remaining blockers
- Kafka local container still fails to stay up due to a stale Zookeeper broker-registration state (`NodeExists`).
- Admin/mobile client validation and later staging work remain outside this phase.
- Production deployment remains blocked pending later remote CI, staging, and golden-path release gates.

## Verdict
Edge local staging auth and socket validation are recovered for this phase. Production remains `NO`.
