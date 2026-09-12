# FixKart Remediation Roadmap (`FIXKART_REMEDIATION_ROADMAP.md`)

Prioritized engineering action plan to transition FixKart from Beta Readiness (8.7/10) to Production Excellence (9.5+/10):

---

## 1. P0 — Immediate Action Items (Beta Launch Prerequisites)
- **Task 0.1**: Deploy `admin-portal` to Vercel production project (`https://fixkart-admin.vercel.app`).
- **Task 0.2**: Verify CORS configuration allows `fixkart-admin.vercel.app` origin.

---

## 2. P1 — Public Launch Action Items (Pre-Public Rollout)
- **Task 1.1**: Configure FCM push notifications for instant plumber job alerts on mobile devices.
- **Task 1.2**: Implement automated database backup verification scripts for Render Managed PostgreSQL.

---

## 3. P2 — Post-Launch Engineering Enhancements (Q3 Operations)
- **Task 2.1**: Consolidate shared frontend TypeScript DTO definitions into `@fixkart/api-client`.
- **Task 2.2**: Upgrade job status polling to persistent WebSocket/STOMP event subscriptions.

---

## 4. Effort Estimation Matrix
| Task | Priority | Effort Estimate | Risk Reduction |
| --- | --- | --- | --- |
| Admin Portal Vercel Deployment | P0 | Small (1 day) | High |
| FCM Push Notification Setup | P1 | Medium (2 days) | Medium |
| Shared `@fixkart/api-client` Package | P2 | Medium (3 days) | Low |
| WebSocket STOMP Push Upgrade | P2 | Large (5 days) | Medium |
