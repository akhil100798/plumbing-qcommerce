# Render Deployment Rollback Plan

## 1. Rollback Baseline Metadata

| Field | Value |
| ----- | ----- |
| Primary Branch | `Development` |
| Deployed Target Commit | `144a345a83832207c2f764effc8830682537665a` |
| Rollback Branch | `main` |
| Rollback Commit SHA | `c92bd6c5bad30142df33adcd75a280bbfd046bfa` |
| Service Name | `plumbcommerce-backend` |
| Service URL | `https://plumbing-qcommerce.onrender.com` |

---

## 2. Trigger Criteria for Rollback
Rollback to `main` (`c92bd6c5bad30142df33adcd75a280bbfd046bfa`) must be triggered if:
1. Render deployment fails during Maven build or Spring Boot application startup.
2. Render container exits with memory exhaustion (exit code 137 / SIGKILL) or OOM errors.
3. Post-deployment `/health/live` or `/version` endpoints fail to return HTTP `200 OK`.
4. Flyway database migrations fail to apply cleanly.

---

## 3. Rollback Procedure
1. In the Render Dashboard settings for `plumbcommerce-backend`, change the configured branch from `Development` back to `main`.
2. Click **Manual Deploy** -> **Deploy latest commit** (or select deployment `c92bd6c5bad30142df33adcd75a280bbfd046bfa`).
3. Monitor build and container startup logs.
4. Verify HTTP `200 OK` from `https://plumbing-qcommerce.onrender.com/health/live`.
5. Isolate `Development` fixes locally without altering `main`.
