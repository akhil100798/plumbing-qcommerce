# Render health and authentication smoke check

- Timestamp: 2026-07-19T10:18:54.1270628+05:30
- Backend URL: `https://plumbing-qcommerce.onrender.com`
- `GET /health/live`: HTTP 200 (PASS)
- `POST /api/v1/auth/login`: HTTP 200 using the designated customer test user (PASS)
- Tested local commit: `d1321710365a24cd9e5a54cfc006401f71c67cd5`
- Deployed commit: not exposed by the checked endpoints
- Secret handling: response bodies, access tokens, refresh tokens, passwords, and authorization headers were not recorded

## UI preflight

- `http://localhost:19106`: unreachable
- `http://localhost:19107`: unreachable
- `http://localhost:19108`: unreachable
- In-app browser control: unavailable because its Windows sandbox process failed during startup

No API result in this file is treated as real UI E2E evidence.
