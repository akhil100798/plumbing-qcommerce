# Backend State Transition Verification Evidence

## Plumber Material Self-Pickup Lifecycle Verification

```text
REQUESTED
→ STORE_REVIEWING
→ APPROVED / PARTIALLY_AVAILABLE
→ RESERVED
→ PREPARING
→ READY_FOR_PICKUP
→ PLUMBER_AT_STORE
→ PLUMBER_COLLECTION_RECORDED
→ COLLECTED
```

| Step | Role | Method | Endpoint | Expected Before Status | Expected HTTP | Expected After Status | Local H2 Test Result | Render Test Result |
| ---- | ---- | ------ | -------- | ---------------------- | ------------- | --------------------- | -------------------- | ------------------ |
| 1. Request Materials | Plumber | `POST` | `/api/v1/materials/request` | N/A | 200 OK | `REQUESTED` | PASS | BLOCKED (502) |
| 2. Store Review & Approve | Store Manager | `POST` | `/api/v1/materials/{id}/approve` | `REQUESTED` | 200 OK | `APPROVED` | PASS | BLOCKED (502) |
| 3. Store Prepare | Store Manager | `POST` | `/api/v1/materials/{id}/prepare` | `APPROVED` | 200 OK | `PREPARING` | PASS | BLOCKED (502) |
| 4. Ready for Pickup | Store Manager | `POST` | `/api/v1/materials/{id}/ready-for-pickup` | `PREPARING` | 200 OK | `READY_FOR_PICKUP` | PASS | BLOCKED (502) |
| 5. Plumber Arrival | Plumber | `POST` | `/api/v1/materials/{id}/plumber-arrived` | `READY_FOR_PICKUP` | 200 OK | `PLUMBER_AT_STORE` | PASS | BLOCKED (502) |
| 6. Plumber Collection | Plumber | `POST` | `/api/v1/materials/{id}/record-collection` | `PLUMBER_AT_STORE` | 200 OK | `PLUMBER_COLLECTION_RECORDED` | PASS | BLOCKED (502) |
| 7. Store Confirmation | Store Manager | `POST` | `/api/v1/materials/{id}/confirm-collection` | `PLUMBER_COLLECTION_RECORDED` | 200 OK | `COLLECTED` | PASS | BLOCKED (502) |

## Stock Restoration Verification
- When request is canceled after reservation, inventory stock is restored exactly once.
- Duplicate collection confirmations are rejected as HTTP 409 Conflict / invalid state transition.
