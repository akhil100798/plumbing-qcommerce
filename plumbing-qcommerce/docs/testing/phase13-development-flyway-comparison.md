# Phase 13 vs Development Flyway Migration Comparison

## Migration Files Present on Both Branches

Both `phase13a-local-staging-sms` and `Development` contain identical Flyway migrations:

| Version | Filename | Phase 13 | Development | SQL Same | Conflict |
|---------|----------|----------|-------------|----------|---------|
| V1 | V1__init_schema.sql | ✓ | ✓ | YES | NONE |
| V2 | V2__add_user_data_tables.sql | ✓ | ✓ | YES | NONE |
| V3 | V3__add_wallet_notifications.sql | ✓ | ✓ | YES | NONE |
| V4 | V4__add_user_status.sql | ✓ | ✓ | YES | NONE |
| V5 | V5__add_finance_admin_tables.sql | ✓ | ✓ | YES | NONE |
| V6 | V6__add_support_admin_tables.sql | ✓ | ✓ | YES | NONE |
| V7 | V7__add_plumber_manager_tables.sql | ✓ | ✓ | YES | NONE |
| V8 | V8__add_marketing_admin_tables.sql | ✓ | ✓ | YES | NONE |
| V9 | V9__harden_admin_migrations.sql | ✓ | ✓ | YES | NONE |
| V10 | V10__expand_users_role_check_for_admin_roles.sql | ✓ | ✓ | YES | NONE |
| V11 | V11__align_product_order_status_constraint.sql | ✓ | ✓ | YES | NONE |
| V12 | V12__expand_product_order_delivery_otp_length.sql | ✓ | ✓ | YES | NONE |
| V13 | V13__add_google_auth_and_profile_completion_fields.sql | ✓ | ✓ | YES | NONE |
| V14 | V14__add_arrived_at_to_service_orders.sql | ✓ | ✓ | YES | NONE |
| V15 | V15__add_plumber_store_pickup_workflow.sql | ✓ | ✓ | YES | NONE |
| V16 | V16__add_product_order_status_history.sql | ✓ | ✓ | YES | NONE |
| V17 | V17__align_service_order_status_constraint.sql | ✓ | ✓ | YES | NONE |
| V18 | V18__align_reservation_status_constraint.sql | ✓ | ✓ | YES | NONE |
| V19 | V19__add_rating_and_service_order_history.sql | ✓ | ✓ | YES | NONE |

**Total migrations: 19 (V1–V19)**  
**Migrations added in Development vs Phase 13: 0**  
**Migrations removed from Development vs Phase 13: 0**  
**SQL content conflicts: 0**

## Flyway Conflict Assessment

```
FLYWAY HISTORY CONFLICT: NONE
```

No duplicate version with different SQL content was found. The migration set is identical on both branches.

## Migration Content Summary (V15–V19 — Self-Pickup Workflow)

| Version | Purpose | Impact |
|---------|---------|--------|
| V15 | Add plumber store pickup workflow columns | Adds `plumber_arrived_at`, `plumber_collection_recorded_at`, `store_collection_confirmed_at` |
| V16 | Add product order status history table | Tracks all state transitions for audit trail |
| V17 | Align service order status check constraint | Adds self-pickup states to allowed values |
| V18 | Align reservation status check constraint | Aligns reservation state machine |
| V19 | Add rating and service order history | Adds rating columns and order history tracking |

## Deployment Safety

- All migrations V1–V14 are additive and compatible with production data
- V15–V19 add new columns with defaults or nullable constraints — safe to run on existing data
- No existing column types were changed
- No constraints were relaxed in a way that could corrupt data

## Recommendation

```text
Flyway Reconciliation: PASS — NO ACTION REQUIRED
```

Development and Phase 13 share identical V1–V19 migrations. Deploying Development to Render will apply exactly the same migrations currently expected by the production schema.
