# Local Manual Flow QA Evidence

This folder contains a runnable QA evidence suite for the local Docker stack.

It covers positive and negative cases for:

- Customer authentication and service request flow
- Plumber order accept/start/complete flow
- Plumber service log flow
- Admin metrics and unauthorized access checks
- Store manager store creation and store read flow
- Edge gateway auth, nearby dispatch, and validation failures
- UI smoke screenshots for admin, customer, and plumber screens

## Run

From the repo root:

```powershell
node .\qa-evidence\local-manual-flow\scripts\run-evidence.js
```

The script expects the local stack to be running:

```powershell
docker compose up -d
```

Outputs are written to:

- `qa-evidence/local-manual-flow/screenshots/`
- `qa-evidence/local-manual-flow/reports/qa-evidence-report.md`
- `qa-evidence/local-manual-flow/reports/qa-evidence-results.json`

