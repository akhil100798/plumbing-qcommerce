# FixKart Rollback Runbook (`ROLLBACK_RUNBOOK.md`)

Emergency procedures for executing immediate rollback in the event of production incidents:

---

## 1. Rollback Trigger Criteria
- Backend application fails to start or health readiness `/health/ready` returns HTTP 500/503.
- Error rate (`5xx`) spikes above 2% over a 5-minute rolling window.
- Database migration error or unrecoverable transactional state failure occurs.

---

## 2. Render Backend Rollback Procedure
1. Log into Render Cloud Dashboard (`https://dashboard.render.com`).
2. Select service `plumbing-qcommerce`.
3. Navigate to **Deploys** tab and identify previous stable commit SHA (e.g. `b2dacdb0dd17fdaa2ccc287e224b30dcb726501c`).
4. Click **Rollback to this deploy**.
5. Verify application container restarts and `/health/live` returns HTTP 200 OK.

---

## 3. Vercel Frontend Rollback Procedure
1. Open Vercel Project Dashboard for target app (`Customer`, `Plumber`, `Store`, or `Admin`).
2. Go to **Deployments** tab.
3. Locate previous healthy deployment.
4. Click **Instant Rollback** to redirect domain traffic immediately.
