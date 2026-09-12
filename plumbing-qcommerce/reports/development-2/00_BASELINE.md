# FixKart Production Hardening Baseline (`00_BASELINE.md`)

## 1. Branch Metadata
- **Current Active Branch**: `Development-2`
- **Development Baseline SHA**: `b2dacdb0dd17fdaa2ccc287e224b30dcb726501c`
- **Development-2 Starting SHA**: `b2dacdb0dd17fdaa2ccc287e224b30dcb726501c`
- **origin/Development SHA**: `b2dacdb0dd17fdaa2ccc287e224b30dcb726501c`
- **Branch Isolation**: `Development` and `main` branches remain 100% untouched.

---

## 2. Initial Category Baseline Score Matrix

| Readiness Category | Initial Baseline Score | Hardening Target | Primary Focus Area |
| --- | ---: | ---: | --- |
| **Architecture** | `9.2 / 10.0` | `10.0 / 10.0` | Shared DTO contract alignment & modular boundaries |
| **Backend** | `8.8 / 10.0` | `10.0 / 10.0` | Complete test suite validation, 0 compiler warnings |
| **Database** | `8.9 / 10.0` | `10.0 / 10.0` | Flyway V1-V19 constraint verification & recovery runbook |
| **Data Integrity** | `8.8 / 10.0` | `10.0 / 10.0` | Non-negative stock & optimistic concurrency lock |
| **Authentication** | `8.8 / 10.0` | `10.0 / 10.0` | Stateless JWT Bearer rotation & SecureStore persistence |
| **Authorization / RBAC** | `8.8 / 10.0` | `10.0 / 10.0` | 10 Granular SecurityConfig role matrix checks |
| **Security Architecture** | `8.8 / 10.0` | `10.0 / 10.0` | Zero Critical/High vulnerabilities, CORS origin restriction |
| **Customer App** | `8.7 / 10.0` | `10.0 / 10.0` | Mobile viewport scaling, 0 dead controls, tsc & vitest PASS |
| **Plumber App** | `8.6 / 10.0` | `10.0 / 10.0` | Field job state persistence across reloads & OTP display |
| **Store App** | `8.6 / 10.0` | `10.0 / 10.0` | Material request fulfillment & pickup OTP verification |
| **Admin Portal** | `8.2 / 10.0` | `10.0 / 10.0` | Production Next.js build validation & staging deployment |
| **UI/UX & Design System** | `8.7 / 10.0` | `10.0 / 10.0` | Unified palette (#0166E4 blue, #20C45A green), high-res PNGs |
| **Accessibility** | `8.4 / 10.0` | `10.0 / 10.0` | 48px touch targets, ARIA labels, zero keyboard traps |
| **Reliability** | `8.6 / 10.0` | `10.0 / 10.0` | `/health/live` & `/health/ready` 200 OK verification |
| **Performance** | `8.7 / 10.0` | `10.0 / 10.0` | Sub-50ms API response time & zero bundle water-falls |
| **Observability** | `8.9 / 10.0` | `10.0 / 10.0` | Spring Boot Actuator UP status & structured logging |
| **Deployment** | `8.8 / 10.0` | `10.0 / 10.0` | Render Docker HTTP 200 & Vercel Edge frontend hosting |
| **CI/CD** | `8.8 / 10.0` | `10.0 / 10.0` | GitHub Actions workflow verification & release gates |
| **Operational Readiness**| `8.5 / 10.0` | `10.0 / 10.0` | Comprehensive operations & disaster recovery runbooks |
| **Backup / Recovery** | `8.2 / 10.0` | `10.0 / 10.0` | Database backup & point-in-time restore runbook |
| **Testing Suite** | `8.8 / 10.0` | `10.0 / 10.0` | All unit, integration, and cross-app E2E tests passing |
| **Cross-App Workflow** | `8.8 / 10.0` | `10.0 / 10.0` | E2E Customer $\rightarrow$ Plumber $\rightarrow$ Store $\rightarrow$ Customer flow |
| **Maintainability** | `8.8 / 10.0` | `10.0 / 10.0` | Clean code, strict TypeScript typing, 0 dead imports |

---

## 3. Initial Baseline Audit Summary
- **Overall Baseline Score**: `8.7 / 10.0`
- **Target Target Score**: `10.0 / 10.0` (Evidence-based)
- **Active Mock Count**: `0` production business mocks in active release code.
