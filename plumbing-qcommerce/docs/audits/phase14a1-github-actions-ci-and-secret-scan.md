# Phase 14A.1 — GitHub Actions CI and Secret Scan

Date: 2026-07-05

## Why Phase 14A Was Blocked

Phase 14A was blocked because the pushed branch had no effective component workflows running for the Phase 13D.5 cleanup. GitHub Actions initially returned zero runs for the branch, and the repository-root workflow directory did not contain the required component CI and secret-scan gates for this branch.

## Workflows Added

The following root-level GitHub Actions workflows were added:

- `.github/workflows/backend-ci.yml`
- `.github/workflows/edge-ci.yml`
- `.github/workflows/admin-ci.yml`
- `.github/workflows/mobile-ci.yml`
- `.github/workflows/secret-scan.yml`

Important correction:

```text
Initial workflow files were accidentally committed under nested plumbing-qcommerce/.github/workflows.
Commit 9cec6a9 moved them to repository-root .github/workflows.
Commit 5cdb7d7 fixed working-directory and cache paths for the nested plumbing-qcommerce project layout.
```

## Workflow Configuration

```text
Backend CI: Java 17, Maven cache, ./mvnw test, ./mvnw -DskipTests package
Edge CI: Node 22 LTS, npm ci, npm test, npm run build
Admin CI: Node 22 LTS, npm ci, npm test, npm run build
Mobile Web CI: Node 22 LTS matrix for customer-app, plumber-app, store-app
Secret Scan: Gitleaks GitHub Action, full history checkout
```

Safe public placeholder build env values only:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8081
NEXT_PUBLIC_EDGE_URL=http://localhost:3000
EXPO_PUBLIC_BACKEND_URL=http://localhost:8081
EXPO_PUBLIC_EDGE_URL=http://localhost:3000
```

No real secrets were added to workflow files.

## Local Workflow-Like Command Results

All local workflow-like gates exited with code 0 before the CI workflow commits:

```text
backend: .\mvnw.cmd test — PASS
backend: .\mvnw.cmd -DskipTests package — PASS
edge-service: npm ci — PASS
edge-service: npm test — PASS
edge-service: npm run build — PASS
admin-portal: npm ci — PASS
admin-portal: npm test — PASS
admin-portal: npm run build — PASS
customer-app: npm ci — PASS
customer-app: npm run typecheck — PASS
customer-app: npm test — PASS
customer-app: npx expo export --platform web — PASS
plumber-app: npm ci — PASS
plumber-app: npm run typecheck — PASS
plumber-app: npm test — PASS
plumber-app: npx expo export --platform web — PASS
store-app: npm ci — PASS
store-app: npm run typecheck — PASS
store-app: npm test — PASS
store-app: npx expo export --platform web — PASS
```

## Workflow Validation

```text
npx prettier --check .github/workflows/*.yml: PASS after formatting new workflows
Workflow safety grep for local Windows paths: PASS
Workflow safety grep for deployment keywords/secrets: PASS for new workflows
Generated Expo dist folders: removed before commit
Working tree before workflow commit: clean except intended workflow files
```

## Remote GitHub Actions Results

Final verified workflow commit:

```text
5cdb7d7 — Fix GitHub Actions workflow paths
```

GitHub Actions runs:

```text
Backend CI: https://github.com/akhil100798/plumbing-qcommerce/actions/runs/28732601496
Edge CI: https://github.com/akhil100798/plumbing-qcommerce/actions/runs/28732601501
Admin CI: https://github.com/akhil100798/plumbing-qcommerce/actions/runs/28732601490
Mobile Web CI: https://github.com/akhil100798/plumbing-qcommerce/actions/runs/28732601499
Secret Scan: https://github.com/akhil100798/plumbing-qcommerce/actions/runs/28732601507
```

Job-by-job result:

```text
Backend CI: FAILED
Edge CI: PASSED
Admin CI: PASSED
Customer app CI: PASSED
Plumber app CI: PASSED
Store app CI: PASSED
Secret scan: PASSED
Overall remote CI: FAILED
```

Notes:

```text
The first root workflow run failed because Node 24 setup failed and component paths pointed at repository root instead of plumbing-qcommerce/.
Commit 5cdb7d7 fixed Node to 22 LTS and corrected nested project paths.
After 5cdb7d7, Edge, Admin, Mobile Web, and Secret Scan passed.
Backend CI still failed.
Unauthenticated GitHub API access was rate-limited while retrieving final Backend step details.
Raw job logs require repository admin authentication from this environment.
```

## Secret Scan Result

```text
Gitleaks Secret Scan: PASSED
```

## Remaining Blockers

- Backend CI is failing remotely and must be diagnosed from authenticated GitHub Actions logs.
- Overall remote CI is not green.
- Cloud staging setup must not begin until Backend CI is fixed and the final CI run passes.
- Cloud staging deployment has not started.
- Production deployment is not approved.

## Cloud Staging Recommendation

```text
Do not start Phase 14B cloud staging setup yet.
First inspect the Backend CI run logs, fix the backend workflow or backend Linux CI issue, push the fix, and verify all workflows pass.
```

Production remains:

```text
NO
```

Final verdict:

```text
BLOCKED — REMOTE CI FAILED
```

