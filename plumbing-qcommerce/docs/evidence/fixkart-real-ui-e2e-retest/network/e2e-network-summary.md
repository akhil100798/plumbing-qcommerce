# E2E network summary

The requested real-UI network capture was not started because the required local apps were unreachable and the in-app browser controller could not start. No UI action rows, screenshots, order IDs, or workflow endpoint results were fabricated.

| App | Role | Action | Method | URL | Response | Screenshot | Result |
|---|---|---|---|---|---:|---|---|
| Preflight | N/A | Render liveness | GET | `https://plumbing-qcommerce.onrender.com/health/live` | 200 | N/A | PASS (preflight only) |
| Preflight | Customer test user | Authentication smoke | POST | `https://plumbing-qcommerce.onrender.com/api/v1/auth/login` | 200 | N/A | PASS (preflight only) |

Tokens, authorization headers, response bodies, secrets, and passwords are excluded.
