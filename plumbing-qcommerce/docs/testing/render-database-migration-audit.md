# Database Migration Audit

## Flyway Migration Inventory (Source Code)

| Migration Version | Filename | Purpose | Introduced by Commit | Present in Development | Expected on Render | Applied on Render | Checksum Valid |
| ----------------- | -------- | ------- | -------------------- | ---------------------- | ------------------ | ----------------- | -------------- |
| V1 | `V1__init_schema.sql` | Initial PostgreSQL schema setup | Baseline | Yes | Yes | Unconfirmed | Valid in Source |
| V2 | `V2__add_user_data_tables.sql` | User addresses & metadata tables | Baseline | Yes | Yes | Unconfirmed | Valid in Source |
| V3 | `V3__add_wallet_notifications.sql` | Wallet & notification tables | Baseline | Yes | Yes | Unconfirmed | Valid in Source |
| V4 | `V4__add_user_status.sql` | User status enum/column | Baseline | Yes | Yes | Unconfirmed | Valid in Source |
| V5 | `V5__add_finance_admin_tables.sql` | Finance admin & settlement schema | Baseline | Yes | Yes | Unconfirmed | Valid in Source |
| V6 | `V6__add_support_admin_tables.sql` | Support tickets & messaging schema | Baseline | Yes | Yes | Unconfirmed | Valid in Source |
| V7 | `V7__add_plumber_manager_tables.sql` | Plumber manager tables | Baseline | Yes | Yes | Unconfirmed | Valid in Source |
| V8 | `V8__add_marketing_admin_tables.sql` | Banners, campaigns, offers schema | Baseline | Yes | Yes | Unconfirmed | Valid in Source |
| V9 | `V9__harden_admin_migrations.sql` | Admin migration hardening | Baseline | Yes | Yes | Unconfirmed | Valid in Source |
| V10 | `V10__expand_users_role_check_for_admin_roles.sql` | Role check constraints expansion | Baseline | Yes | Yes | Unconfirmed | Valid in Source |
| V11 | `V11__align_product_order_status_constraint.sql` | Product order status constraint fix | Baseline | Yes | Yes | Unconfirmed | Valid in Source |
| V12 | `V12__expand_product_order_delivery_otp_length.sql` | OTP column width expansion | Baseline | Yes | Yes | Unconfirmed | Valid in Source |
| V13 | `V13__add_google_auth_and_profile_completion_fields.sql` | Google auth profile fields | Baseline | Yes | Yes | Unconfirmed | Valid in Source |
| V14 | `V14__add_arrived_at_to_service_orders.sql` | Service order arrival timestamp | Baseline | Yes | Yes | Unconfirmed | Valid in Source |
| V15 | `V15__add_plumber_store_pickup_workflow.sql` | Plumber self-pickup material schema | `c268293` | Yes | Required | Unconfirmed | Valid in Source |
| V16 | `V16__add_product_order_status_history.sql` | Product order status audit table | `c268293` | Yes | Required | Unconfirmed | Valid in Source |
| V17 | `V17__align_service_order_status_constraint.sql` | Service order status alignment | `571f75d` | Yes | Required | Unconfirmed | Valid in Source |
| V18 | `V18__align_reservation_status_constraint.sql` | Inventory reservation status constraint | `571f75d` | Yes | Required | Unconfirmed | Valid in Source |
| V19 | `V19__add_rating_and_service_order_history.sql` | Service order ratings & history | `d132171` | Yes | Required | Unconfirmed | Valid in Source |

## Database Status Summary
- Latest source migration: `V19__add_rating_and_service_order_history.sql`
- Total source migrations: 19
- Render DB confirmation status: UNCONFIRMED (Render service returned 502 Bad Gateway)
- Migration alignment verdict: BLOCKED — RENDER DB UNREACHABLE FOR SQL AUDIT
