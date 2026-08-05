# Main vs Development Flyway Reconciliation Report

## 1. Migration Inventory Comparison

| Version | Migration Script | In Main | In Development | Content Match | Conflict | Status |
| ------- | ---------------- | ------- | -------------- | ------------- | -------- | ------ |
| V1 | `V1__init_schema.sql` | Yes | Yes | Identical | No | Reconciled |
| V2 | `V2__add_user_data_tables.sql` | Yes | Yes | Identical | No | Reconciled |
| V3 | `V3__add_wallet_notifications.sql` | Yes | Yes | Identical | No | Reconciled |
| V4 | `V4__add_user_status.sql` | Yes | Yes | Identical | No | Reconciled |
| V5 | `V5__add_finance_admin_tables.sql` | Yes | Yes | Identical | No | Reconciled |
| V6 | `V6__add_support_admin_tables.sql` | Yes | Yes | Identical | No | Reconciled |
| V7 | `V7__add_plumber_manager_tables.sql` | Yes | Yes | Identical | No | Reconciled |
| V8 | `V8__add_marketing_admin_tables.sql` | Yes | Yes | Identical | No | Reconciled |
| V9 | `V9__harden_admin_migrations.sql` | Yes | Yes | Identical | No | Reconciled |
| V10 | `V10__expand_users_role_check_for_admin_roles.sql` | Yes | Yes | Identical | No | Reconciled |
| V11 | `V11__align_product_order_status_constraint.sql` | Yes | Yes | Identical | No | Reconciled |
| V12 | `V12__expand_product_order_delivery_otp_length.sql` | Yes | Yes | Identical | No | Reconciled |
| V13 | `V13__add_google_auth_and_profile_completion_fields.sql` | Yes | Yes | Identical | No | Reconciled |
| V14 | `V14__add_arrived_at_to_service_orders.sql` | Yes | Yes | Identical | No | Reconciled |
| V15 | `V15__add_plumber_store_pickup_workflow.sql` | No | Yes | New in Dev | No | Ready for Deployment |
| V16 | `V16__add_product_order_status_history.sql` | No | Yes | New in Dev | No | Ready for Deployment |
| V17 | `V17__align_service_order_status_constraint.sql` | No | Yes | New in Dev | No | Ready for Deployment |
| V18 | `V18__align_reservation_status_constraint.sql` | No | Yes | New in Dev | No | Ready for Deployment |
| V19 | `V19__add_rating_and_service_order_history.sql` | No | Yes | New in Dev | No | Ready for Deployment |

---

## 2. Integrity Verification
- Zero duplicate migration versions exist with differing SQL content.
- Migrations `V1` through `V14` are byte-for-byte identical between `main` and `Development`.
- Migrations `V15` through `V19` are strictly sequential and additive on `Development`.
