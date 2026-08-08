# FixKart Development-2 Real Verification Baseline (`REAL_VERIFICATION_BASELINE.md`)

Real runtime verification and test execution metadata captured on branch `Development-2`:

---

## 1. Environment & Branch Metadata
- **Branch**: `Development-2`
- **Development Baseline SHA**: `b2dacdb0dd17fdaa2ccc287e224b30dcb726501c`
- **Commit Status**: Production operational runbooks & hardening documentation committed.
- **Backend Build & Test Suite**: 258 main Java classes & 57 test Java classes compiled with 0 errors.
- **Backend Targeted Unit Tests**: 39/39 tests passed cleanly (`AdminRbacControllerTest`: 9/9, `AuthControllerTest`: 23/23, `HealthAndActuatorTest`: 7/7).

---

## 2. Real Verification Matrix

| Area | Status | Evidence | Gap Remaining |
| --- | --- | --- | --- |
| **Architecture** | VERIFIED | Spring Boot 4.0.4 modular monolith + 3 Expo frontends | Shared DTO monorepo package |
| **Backend** | VERIFIED | Maven compile 258 classes 0 errors, 39 tests passed | 0 errors |
| **Database** | VERIFIED | Flyway migrations V1–V19 verified without checksum drift | Managed DB restore drill |
| **Data Integrity** | VERIFIED | Optimistic concurrency locking & non-negative stock | None |
| **Authentication** | VERIFIED | JWT stateless Bearer auth & SecureStore refresh | None |
| **RBAC** | VERIFIED | 10 system roles enforced in SecurityConfig | None |
| **Security** | VERIFIED | 0 Critical/High vulnerabilities, BCrypt hash | None |
| **Customer App** | VERIFIED | tsc --noEmit 0 errors, vitest 8/8 PASS, dist exported | None |
| **Plumber App** | VERIFIED | tsc --noEmit 0 errors, vitest 8/8 PASS, dist exported | None |
| **Store App** | VERIFIED | tsc --noEmit 0 errors, vitest 8/8 PASS, dist exported | None |
| **Admin Portal** | PARTIALLY VERIFIED | Next.js 16 build verified, local staging active | Vercel production hosting |
