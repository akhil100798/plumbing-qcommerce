# Role/account inventory

No credentials or tokens are recorded here.

| Role | Available | Source | Legitimate QA creation | Tests requiring role |
|---|---|---|---|---|
| SUPER_ADMIN | YES | staging admin seeder: `admin.qa@fixkart.com` | YES, seeded | super-admin/RBAC |
| ADMIN | NO dedicated seeded account | role enum/security rules; no current staging account | YES through supported Super Admin seed-user endpoint | admin matrix |
| OPERATIONS_ADMIN | YES | staging admin seeder | YES, seeded | operations navigation/API |
| PLUMBER_MANAGER | YES | staging admin seeder | YES, seeded | plumber-manager matrix |
| FINANCE_ADMIN | YES | staging admin seeder | YES, seeded | finance matrix |
| SUPPORT_ADMIN | YES | staging admin seeder | YES, seeded | support matrix |
| MARKETING_ADMIN | YES | staging admin seeder | YES, seeded | marketing matrix |
| STORE_MANAGER | YES | mobile QA seeder: `store.qa@fixkart.com` | YES, supported store registration | store matrix |
| CUSTOMER | YES | mobile QA seeder: two QA customers | YES, supported OTP registration | customer matrix |
| PLUMBER | YES | mobile QA seeder: two QA plumbers | YES, supported plumber registration | plumber matrix |
| DELIVERY_PARTNER | enum/security-only; delivery routes denied in current release | role enum and `SecurityConfig` | NO supported current-release QA path | delivery rows |

Runtime account checks used only in memory. Passwords, JWTs, refresh tokens, and cookies were excluded from evidence.
