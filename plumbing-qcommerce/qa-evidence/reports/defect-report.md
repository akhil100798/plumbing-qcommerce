# FixKart QA Defect & Issue Log

## Active Defects
*No blocking defects detected during release audit.*

## Verified Resolution Summary
- **STORE-BUG-001 (Resolved)**: Ready for Pickup screen previously showed delivery rider OTP input. Fixed to show Plumber Collection confirmation workflow.
- **PLUMBER-BUG-001 (Resolved)**: Material tracking pickup action was calling legacy delivery endpoint. Fixed to consume `/api/v1/material-requests/{id}/collect`.
- **API-BUG-001 (Resolved)**: Customer material approval requirement aligned with service order ID.