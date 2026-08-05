# Main vs Development Backend Comparison Report

## 1. Metric Overview

| Metric | Result |
| ------ | ------ |
| main SHA | `c92bd6c5bad30142df33adcd75a280bbfd046bfa` |
| origin/main SHA | `c92bd6c5bad30142df33adcd75a280bbfd046bfa` |
| Render Deployed SHA | `UNCONFIRMED` (Returns HTTP 502 Bad Gateway) |
| Development SHA | `d4185a3df63053e3ae0b0eee0ad72e131b860d81` |
| Development Ahead of main | 17 commits |
| Development Behind main | 7 commits |
| Development Ahead of Render | UNCONFIRMED |
| Render Ahead of Development | UNCONFIRMED |
| Branches Diverged | YES (Merge base: `d1321710365a24cd9e5a54cfc006401f71c67cd5`) |

---

## 2. Commits Present in Development but Absent from main (17 Commits)

```text
d4185a3 test: add strict frontend navigation evidence
6896254 fix: remove legacy delivery pickup ui
c878b42 fix: remove store and material tracking fallback data
9189136 fix: preserve authenticated nested navigation
51f2668 fix: connect store collection confirmation to plumber pickup API
04b45b2 feat: connect plumber app screens to backend workflow
3815370 feat: update DrawerMenuScreen with online switch and clean menu list reference UI
83d88f3 feat: update ProfileScreen and JobHistoryScreen with Avatar and MenuRow reference UI
1424ea5 feat: integrate Screens 13-17 into plumber app with PhotoGrid and BarChart
42c09df feat: enhance plumber app screens with reference UI components
36569e6 feat: integrate FixKart plumber mobile UI screens
8fc6dc9 feat: complete FixKart release-candidate implementation and verification
571f75d feat: complete FixKart store pickup workflow verification and fix database constraint checks
a246e20 test: align delivery flag and pickup migration coverage
834c295 fix: remove production mock fallbacks and connect pickup APIs
c268293 feat: add plumber store pickup material workflow
5deb8b2 chore: consolidate FixKart documentation and remove stale evidence
```

---

## 3. Key Backend Improvements in Development over Main
1. **Plumber Self-Pickup Material Workflow (`V17__plumber_material_pickup.sql`, `V18__plumber_material_pickup_schema_alignment.sql`, `V19__drop_obsolete_delivery_pickup_tables.sql`)**:
   - Replaced legacy delivery partner / courier dispatch dependencies with plumber self-pickup workflow.
   - Introduced `plumber_at_store_at` and `plumber_collected_at` timestamps on material requests.
   - Enforced database constraints and state transitions (`REQUESTED` -> `STORE_REVIEWING` -> `APPROVED` / `PARTIALLY_AVAILABLE` -> `RESERVED` -> `PREPARING` -> `READY_FOR_PICKUP` -> `PLUMBER_AT_STORE` -> `PLUMBER_COLLECTION_RECORDED` -> `COLLECTED`).
2. **Production Mock Cleanup**:
   - Removed production mock fallback data from `MaterialPickupController` and `StoreMaterialController`.
   - Wired controllers directly to real database repositories.
3. **Database Migration Alignment**:
   - Added Flyway migrations `V17`, `V18`, and `V19` ensuring schema cleanup and data integrity for store pickup workflows.
