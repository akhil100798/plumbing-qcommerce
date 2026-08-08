# FixKart Hardening Implementation Plan (`02_IMPLEMENTATION_PLAN.md`)

Multi-phase execution plan for the 10/10 Production Hardening Program on branch `Development-2`:

---

## Phase 1 — Verification of All Module Test & Build Pipelines
1. **Backend Build & Test Suite**: Run `mvn clean test` and `mvn clean package` in `backend/` to verify zero test failures and zero compiler errors.
2. **Customer App Build & Typecheck**: Run `tsc --noEmit`, `npm test` (`vitest run`), and `npx expo export --platform web` in `customer-app/`.
3. **Plumber App Build & Typecheck**: Run `tsc --noEmit`, `npm test` (`vitest run`), and `npx expo export --platform web` in `plumber-app/`.
4. **Store App Build & Typecheck**: Run `tsc --noEmit`, `npm test` (`vitest run`), and `npx expo export --platform web` in `store-app/`.
5. **Admin Portal Build & Typecheck**: Run `tsc --noEmit`, `npm test` (`vitest run`), and `npm run build` (`next build`) in `admin-portal/`.

---

## Phase 2 — Comprehensive Operational Runbook Documentation
1. Create `docs/operations/DEPLOYMENT_RUNBOOK.md`
2. Create `docs/operations/ROLLBACK_RUNBOOK.md`
3. Create `docs/operations/DATABASE_BACKUP_AND_RESTORE.md`
4. Create `docs/operations/INCIDENT_RESPONSE_RUNBOOK.md`
5. Create `docs/operations/CREDENTIAL_ROTATION_RUNBOOK.md`
6. Create `docs/operations/ENVIRONMENT_VARIABLES.md`

---

## Phase 3 — End-to-End Workflow & Data Integrity Validation
1. Verify Customer order creation (`REQUESTED`).
2. Verify Plumber job acceptance (`ASSIGNED` $\rightarrow$ `EN_ROUTE` $\rightarrow$ `ARRIVED` $\rightarrow$ `DIAGNOSING`).
3. Verify Plumber material request (`MATERIAL_SELECTION` $\rightarrow$ `WAITING_FOR_MATERIALS`).
4. Verify Store material approval & preparation (`APPROVED` $\rightarrow$ `PREPARING` $\rightarrow$ `READY_FOR_PICKUP`).
5. Verify Plumber self-pickup OTP validation (`COLLECTED`).
6. Verify Plumber job completion (`COMPLETED`) & billing summary.

---

## Phase 4 — Final Audit Reports Generation & Git Push
1. Generate final reports under `reports/development-2/final/`.
2. Push branch to `origin/Development-2`.
3. Produce final scorecard and release decision.
