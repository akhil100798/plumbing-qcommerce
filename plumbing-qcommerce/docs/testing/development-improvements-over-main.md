# Development Improvements over Main Report

## 1. Commit-by-Commit Inventory

| Commit | Message | Area | Improvement | Runtime Effect | Migration | Risk | Required on Render |
| ------ | ------- | ---- | ----------- | -------------- | --------- | ---- | ------------------ |
| `c268293` | `feat: add plumber store pickup material workflow` | Material Requests | Added self-pickup lifecycle endpoints and state transitions | Plumbers can request and collect materials at store | V17 | Low | Yes |
| `834c295` | `fix: remove production mock fallbacks and connect pickup APIs` | Production Readiness | Removed mock fallbacks in `MaterialPickupController` | All store pickup actions operate on real database | None | Low | Yes |
| `a246e20` | `test: align delivery flag and pickup migration coverage` | Testing | Aligned test suite with `FEATURE_DELIVERY_ENABLED=false` | Tests validate self-pickup MVP flow exclusively | V18 | Low | Yes |
| `571f75d` | `feat: complete FixKart store pickup workflow verification...` | Database & Security | Fixed database constraint checks and Flyway script ordering | Flyway migrations execute without FK constraint errors | V18, V19 | Low | Yes |
| `8fc6dc9` | `feat: complete FixKart release-candidate implementation...` | End-to-End | Finalized backend release candidate for self-pickup MVP | Operational stability across customer, plumber, store roles | None | Low | Yes |
| `51f2668` | `fix: connect store collection confirmation to plumber pickup API` | API Wiring | Connected store manager collection confirmation to plumber pickup API | Store manager can confirm plumber collection | None | Low | Yes |
| `c878b42` | `fix: remove store and material tracking fallback data` | Code Cleanup | Removed stale fallback data in material tracking controllers | Eliminates transient unpersisted data responses | None | Low | Yes |

---

## 2. Area-by-Area Breakdown

### Self-Pickup Workflow
- **Problem in main**: Legacy code assumed delivery partner courier dispatch and delivery OTP validation.
- **Change in Development**: Implemented plumber self-pickup workflow (`PLUMBER_AT_STORE`, `PLUMBER_COLLECTION_RECORDED`, `COLLECTED`).
- **Files affected**: `MaterialPickupController.java`, `StoreMaterialController.java`, `MaterialRequest.java`, `MaterialRequestService.java`.
- **Endpoint affected**: `/api/v1/plumber/material-requests/{id}/arrived-at-store`, `/api/v1/plumber/material-requests/{id}/collect`, `/api/v1/store/material-requests/{id}/confirm-collection`.
- **Database impact**: Added `plumber_at_store_at` and `plumber_collected_at` columns via migrations `V17__plumber_material_pickup.sql` and `V18__plumber_material_pickup_schema_alignment.sql`.
- **User-facing impact**: Plumber can pick up materials directly from the assigned store without waiting for third-party courier dispatch.
- **Risk if not deployed**: Store and plumber apps cannot process material pickup lifecycle on production.
- **Test coverage**: `PlumberMaterialIntegrationTest.java` (7 integration tests passing).

### Database Migrations
- **Problem in main**: Schema stopped at `V16__inventory_reservation_hardening.sql`.
- **Change in Development**: Added `V17`, `V18`, and `V19` Flyway migrations.
- **Files affected**: `V17__plumber_material_pickup.sql`, `V18__plumber_material_pickup_schema_alignment.sql`, `V19__drop_obsolete_delivery_pickup_tables.sql`.
- **Database impact**: Aligns schema for self-pickup workflow and cleans obsolete tables.
- **Risk if not deployed**: Flyway schema mismatch and missing columns on production database.

### Health & Version Metadata
- **Problem in main**: `/version` endpoint was absent or returned default unauthenticated 401 response.
- **Change in Development**: Implemented `VersionController.java` returning structured JSON metadata (`application`, `version`, `branch`, `commit`, `buildTime`) and updated `SecurityConfig.java`.
- **Files affected**: `VersionController.java`, `SecurityConfig.java`, `HealthAndActuatorTest.java`.
- **Endpoint affected**: `GET /version`.
- **Risk if not deployed**: Render deployment cannot be verified via public immutable commit SHA.
