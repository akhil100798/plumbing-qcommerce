# FixKart Production Deployment Runbook (`DEPLOYMENT_RUNBOOK.md`)

Step-by-step procedures for deploying backend and frontend releases:

---

## 1. Pre-Deployment Validation Checklist
1. Verify target release commit SHA on branch `Development-2`.
2. Run backend test suite: `./mvnw.cmd test-compile` (0 errors).
3. Run frontend typecheck across all applications: `npx tsc --noEmit` (0 errors).
4. Run frontend unit tests across all applications: `npm test` (0 failures).
5. Verify Flyway migrations syntax and SQL sequence order (`V1` to `V19`).

---

## 2. Render Backend Deployment Procedure
1. Log into Render Cloud Dashboard (`https://dashboard.render.com`).
2. Select service `plumbing-qcommerce` (Docker runtime).
3. Select Environment Settings: `SPRING_PROFILES_ACTIVE=prod`.
4. Trigger manual deploy from branch `Development-2` or webhook.
5. Monitor build logs and Docker startup sequence (`PlumbingCoreApplication.java`).
6. Verify readiness endpoint returns HTTP 200:
   ```bash
   curl -i https://plumbing-qcommerce.onrender.com/health/ready
   ```
7. Verify version metadata SHA match:
   ```bash
   curl -s https://plumbing-qcommerce.onrender.com/version
   ```

---

## 3. Vercel Frontend Deployments Procedure
1. Customer App: Deployed from `customer-app/` directory (`https://fixkart-customer-web.vercel.app`).
2. Plumber App: Deployed from `plumber-app/` directory (`https://fixkart-plumber-web.vercel.app`).
3. Store App: Deployed from `store-app/` directory (`https://fixkart-store-web.vercel.app`).
4. Admin Portal: Deployed from `admin-portal/` directory (`https://fixkart-admin.vercel.app`).
5. Confirm SPA client routing rewrites in `vercel.json` (`/ -> index.html`).

---

## 4. Post-Deployment Verification
- Run health liveness check: `/health/live` $\rightarrow$ `HTTP 200 OK` (`{"status":"UP"}`)
- Perform smoke test login on Customer, Plumber, Store, and Admin applications.
