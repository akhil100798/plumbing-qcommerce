# FixKart Production Risk Register (`FIXKART_PRODUCTION_RISK_REGISTER.md`)

Identified production risks, impact assessments, evidence logs, and blocker classifications:

| Risk ID | Risk Summary | Severity | Probability | Impact | Evidence Location | Production Blocker |
| --- | --- | --- | --- | --- | --- | --- |
| **PR-01** | Admin Portal Deployment Status | Medium | Medium | Medium | Admin portal runs in local staging (`:3101`), needs Vercel production hosting | No (Beta Target) |
| **PR-02** | Polling vs Push Dispatch | Medium | Low | Medium | Client apps use short polling instead of WebSocket push subscriptions | No (Acceptable for Beta) |
| **PR-03** | Redundant Starter Health Checks | Low | Low | Low | Redis & Kafka indicators disabled in production Actuator config to prevent false DOWN state | No (Verified Fixed) |
| **PR-04** | Client DTO Duplicate Types | Low | Low | Low | TypeScript DTO interfaces duplicated across frontend apps | No (Technical Debt) |

---

## Risk Severity Classifications
- **CRITICAL**: 0 Risks (Zero system-breaking vulnerabilities identified)
- **HIGH**: 0 Risks (Zero high-impact execution blockers identified)
- **MEDIUM**: 2 Risks (Admin portal deployment & polling synchronization)
- **LOW**: 2 Risks (Build optimizations & code refactoring)
