# FixKart Gap Analysis & Hardening Targets (`01_GAP_ANALYSIS.md`)

Analysis of technical gaps between initial baseline (`8.7/10`) and 10/10 production-readiness targets:

---

## 1. Category Gap Matrix

| Category | Current Baseline | Gap Description | Targeted Remediation Action |
| --- | ---: | --- | --- |
| **Admin Portal** | `8.2 / 10.0` | Next.js admin portal running in local staging | Validate Next.js production build & environment config |
| **Backup / Recovery** | `8.2 / 10.0` | Lack of explicit database backup runbook | Create `docs/operations/DATABASE_BACKUP_AND_RESTORE.md` |
| **Operational Readiness**| `8.5 / 10.0` | Deployment & incident runbooks fragmented | Consolidate deployment, rollback & credential rotation runbooks |
| **Accessibility** | `8.4 / 10.0` | Mobile touch target & screen reader label verification | Audit and verify touch targets $\ge 48\times 48\text{px}$ & accessibility labels |
| **Cross-App Workflow** | `8.8 / 10.0` | Verification of end-to-end order IDs across apps | Execute end-to-end workflow validation test |
| **Testing Suite** | `8.8 / 10.0` | Complete test suite execution across all modules | Run `mvn test`, `vitest`, `tsc --noEmit` across all modules |

---

## 2. Mandatory Production Safeguards Verified
- `canUseDevMockFallbacks = false` verified across `customer-app`, `plumber-app`, `store-app`.
- Zero raw stack trace leakage in Spring Boot `GlobalExceptionHandler`.
- Flyway schema migrations `V1` to `V19` strictly enforced without checksum drift.
- SecurityConfig CORS origins explicitly restricted.
