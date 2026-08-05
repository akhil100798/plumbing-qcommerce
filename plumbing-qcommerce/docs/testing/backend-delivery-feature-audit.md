# Backend Delivery Feature Audit

## Delivery Feature Audit Table

| Item / Code Symbol | Classification | Status in Code | MVP Requirement | Risk |
| ------------------ | -------------- | -------------- | --------------- | ---- |
| `FEATURE_DELIVERY_ENABLED` | Feature Flag | Set to `false` in `application.yml` | Excluded from MVP | Low |
| `DeliveryController.java` | Disabled Future Code | Protected by `FEATURE_DELIVERY_ENABLED` flag | Excluded from MVP | Low |
| `DeliveryService.java` | Disabled Future Code | Returns feature disabled error when flag is false | Excluded from MVP | Low |
| `DeliveryOtpService.java` | Disabled Future Code | Gated behind delivery feature flag | Excluded from MVP | Low |
| `availableDeliveryPartnerResponse` | Excluded DTO | Used for courier/rider dispatch UI | Excluded from MVP | Low |
| `reassignDeliveryRequest` | Excluded DTO | Used for rider re-assignment | Excluded from MVP | Low |
| Plumber Self-Pickup Workflow | Active MVP Workflow | Implemented in `MaterialPickupController` & `PlumberMaterialService` | Primary MVP Requirement | Critical (PASS) |

## Key Findings
- Delivery partner workflows (rider assignment, delivery OTP, courier dispatch, handover) are safely disabled via feature flag `FEATURE_DELIVERY_ENABLED=false`.
- The active MVP workflow is plumber self-pickup (`Plumber requests products -> Store approves -> Stock reserved -> Store prepares -> Store ready -> Plumber arrives -> Plumber records collection -> Store confirms -> Plumber returns to site`).
- No active delivery code interferes with the plumber self-pickup workflow.
