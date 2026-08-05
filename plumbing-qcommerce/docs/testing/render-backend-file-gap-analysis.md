# Render Backend File Gap Analysis

## Overview
This document analyzes potential code, configuration, and migration file gaps between the current local `Development` branch (`d4185a3`) and the deployed Render environment (`https://plumbing-qcommerce.onrender.com`).

| File | Change Type | Change Summary | Runtime Impact | Deployment Required | Risk |
| ---- | ----------- | -------------- | -------------- | ------------------- | ---- |
| `backend/src/main/resources/db/migration/V15__add_plumber_store_pickup_workflow.sql` | [NEW] | Adds material request self-pickup tables and status enums | Required for plumber self-pickup workflow | Yes | Critical |
| `backend/src/main/resources/db/migration/V16__add_product_order_status_history.sql` | [NEW] | Tracks product order state transitions | Enables order audit history | Yes | Medium |
| `backend/src/main/resources/db/migration/V17__align_service_order_status_constraint.sql` | [NEW] | Updates service order status check constraint | Fixes invalid status errors during job lifecycle | Yes | High |
| `backend/src/main/resources/db/migration/V18__align_reservation_status_constraint.sql` | [NEW] | Updates reservation status check constraint | Prevents SQL constraint violation on stock reservation | Yes | High |
| `backend/src/main/resources/db/migration/V19__add_rating_and_service_order_history.sql` | [NEW] | Adds rating schema and service order status history | Enables customer service ratings & job history | Yes | Medium |
| `backend/src/main/java/com/pqc/core/controller/MaterialPickupController.java` | [NEW] | Endpoints for store approval, preparation, and pickup | Plumber material pickup operations | Yes | Critical |
| `backend/src/main/java/com/pqc/core/service/PlumberMaterialService.java` | [MODIFY] | Handles stock reservation, full/partial approval, collection | Core material request transaction logic | Yes | Critical |
| `backend/src/main/java/com/pqc/core/config/SecurityConfig.java` | [MODIFY] | Updated RBAC rules for material pickup & health checks | Restricts store/plumber pickup endpoints | Yes | High |
| `backend/src/main/resources/application.yml` | [MODIFY] | Sets `FEATURE_DELIVERY_ENABLED=false` by default | Enforces plumber self-pickup MVP workflow | Yes | High |
| `backend/src/main/java/com/pqc/core/controller/HealthController.java` | [MODIFY] | Exposes `/health/live`, `/health/ready`, `/version` | System health and version observability | Yes | Low |
