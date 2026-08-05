# Main vs Development Backend File Gap Report

## 1. Summary of Changes in Backend Module

| Component | Files Added / Modified | Primary Improvement |
| --------- | ---------------------- | ------------------- |
| Controllers | `VersionController.java`, `HealthController.java`, `MaterialPickupController.java`, `StoreMaterialController.java` | Added `/version` metadata endpoint, connected self-pickup APIs |
| Security | `SecurityConfig.java` | Allowed public access to `/version` |
| Migrations | `V17__plumber_material_pickup.sql`, `V18__plumber_material_pickup_schema_alignment.sql`, `V19__drop_obsolete_delivery_pickup_tables.sql` | Added plumber store pickup timestamps and schema alignment |
| Services | `MaterialRequestService.java`, `StoreMaterialService.java` | Handled `PLUMBER_AT_STORE` and `COLLECTED` state transitions |
| Entities | `MaterialRequest.java` | Added self-pickup timestamp fields |
| Tests | `HealthAndActuatorTest.java`, `PlumberMaterialIntegrationTest.java` | Added `/version` test and verified 246 backend tests |

---

## 2. Detailed File Comparison Table

| File | Change | Module | Main Behavior | Development Behavior | Deployment Impact |
| ---- | ------ | ------ | ------------- | -------------------- | ----------------- |
| `VersionController.java` | [NEW] | Controllers | Absent | Returns application version, branch, commit SHA, buildTime | Required for Render version verification |
| `HealthController.java` | Modified | Controllers | `/health/live`, `/health/ready` | Clean health endpoints | Required for Render health probes |
| `SecurityConfig.java` | Modified | Security | `/version` required authentication | `/version` permitted unauthenticated | Required for automated version checks |
| `V17__plumber_material_pickup.sql` | [NEW] | Flyway Migrations | Absent | Adds plumber self-pickup columns | Mandatory database migration |
| `V18__plumber_material_pickup_schema_alignment.sql` | [NEW] | Flyway Migrations | Absent | Fixes table constraints for store pickup | Mandatory database migration |
| `V19__drop_obsolete_delivery_pickup_tables.sql` | [NEW] | Flyway Migrations | Absent | Drops obsolete delivery tables | Mandatory database migration |
| `HealthAndActuatorTest.java` | Modified | Tests | 6 tests | 7 tests (verifies `/version`) | Ensures zero test regression |
