# Main vs Development Flyway Database Migration Comparison Report

## 1. Migration Summary

| Metric | Result |
| ------ | ------ |
| Latest Migration on `main` | `V14__add_arrived_at_to_service_orders.sql` |
| Latest Migration on `Development` | `V19__add_rating_and_service_order_history.sql` |
| Migrations Added by `Development` | 5 (`V15` through `V19`) |
| Backward Compatibility | Compatible (additive schema modifications and status constraints) |
| Required before Startup | Yes (Spring Boot Flyway automatically executes migrations on boot) |

---

## 2. Migration Breakdown Table

| Version | Migration File | In main | In Development | Purpose | Required Before Startup | Risk |
| ------- | -------------- | ------- | -------------- | ------- | ----------------------- | ---- |
| V15 | `V15__add_plumber_store_pickup_workflow.sql` | No | Yes | Adds `plumber_at_store_at` and `plumber_collected_at` to material requests | Yes | Low |
| V16 | `V16__add_product_order_status_history.sql` | No | Yes | Adds product order status history tracking | Yes | Low |
| V17 | `V17__align_service_order_status_constraint.sql` | No | Yes | Updates service order status check constraints | Yes | Low |
| V18 | `V18__align_reservation_status_constraint.sql` | No | Yes | Aligns inventory reservation status constraints | Yes | Low |
| V19 | `V19__add_rating_and_service_order_history.sql` | No | Yes | Adds ratings and service order state history table | Yes | Low |

---

## 3. Database Schema Improvements
- **Self-Pickup Timestamps**: `V15` introduces timestamp tracking when a plumber arrives at a store and when materials are collected.
- **Order & Service History**: `V16` and `V19` create audit trails for status transitions across store orders and plumber service requests.
- **Status Constraints**: `V17` and `V18` update check constraints to accommodate new state machine states without breaking existing records.
