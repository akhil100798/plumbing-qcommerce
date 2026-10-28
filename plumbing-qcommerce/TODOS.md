# TODOS

## Phase 3 Full Pilot

### Complete the deferred four-role material and payment pilot

**What:** Add store logistics with customer-authorized material addenda, read-only admin visibility, owning-customer completion confirmation and payment, and four-role E2E certification.

**Why:** Milestone one intentionally certifies only customer + plumber labor-only service; it cannot establish readiness for the original four-role paid material pilot.

**Context:** Resume from `akhil-Development-2-design-20261005.md` after the customer/plumber labor-only milestone. Reuse the store material-request lifecycle. Store approval/reservation must pause before preparation/packing until the plumber publishes the addendum and the customer decides; logistics collection is not repair authorization. Admin remains read-only. Do not infer pricing provenance absent backend fields. Preserve a compatibility path for reliably identified in-flight legacy orders; if there is no reliable discriminator, require an operational drain before route isolation. Finish with authenticated all-role positive/negative UI E2E.

**Effort:** XL
**Priority:** P1
**Depends on:** Milestone-one contract and authenticated E2E baseline; real store price/availability evidence; usable role credentials and backend runtime; verified pricing fields; pricing fixture validation; legacy-route discriminator or drained legacy orders.

### Reproduce post-material `/start` authorization boundary

**What:** Add a focused backend integration test for direct `/start` calls from post-material states and minimally guard the path only if the test reproduces bypass of Phase 2 `/resume` authorization.

**Why:** Post-material repair must require the distinct customer return-to-customer decision and guarded resume sequence, including for direct API callers.

**Context:** `ServiceOrderService.startOrder` currently lists several material statuses as startable, while a separate `/resume` path implements Phase 2 authorization. This is an inspection-only concern, not a confirmed defect. Reproduce with the backend integration fixture before any change; preserve legacy callers unless the failing test establishes a regression.

**Effort:** M
**Priority:** P1
**Depends on:** Before full material pilot; backend/PostgreSQL integration-test runtime and authenticated plumber/customer fixture.

### Reproduce material request and partial-stock invariants

**What:** Add backend integration tests for pre-base-quote material requests and partial-stock reservation/packing integrity; repair only a test-proven defect with minimal regression coverage.

**Why:** Store preparation must not get ahead of customer-authorized repair scope, and partial inventory must not create over-reservation, over-packing, or a dead-end request.

**Context:** Code inspection suggested both seams, but neither has been reproduced. Store integration remains deferred. The full store flow must pause after requested quantities are approved/reserved and before pack/collect until the customer decides on the published addendum. Keep the V1–V34 backend frozen unless a focused reproducer proves a defect.

**Effort:** M
**Priority:** P1
**Depends on:** Before full store pilot; backend/PostgreSQL fixture with approved/rejected quote states and controlled partial inventory.

### Reproduce service confirmation/payment transition compatibility

**What:** Reproduce owning-customer confirmation and payment in both call orders, then minimally repair only if integration tests prove a customer cannot complete both actions safely.

**Why:** Full-pilot closure requires truthful customer confirmation and backend-success payment without weakening payment eligibility or reporting local success.

**Context:** Inspection suggests confirmation changes `COMPLETED` to `CUSTOMER_CONFIRMED`, while payment eligibility accepts `COMPLETED`; no focused integration reproduction has established a defect. Payment and confirmation are outside milestone one. Keep the backend frozen until a reproducer demonstrates the conflict; require regression tests and real gateway/method validation before any repair.

**Effort:** M
**Priority:** P1
**Depends on:** Before full-pilot payment closure; backend integration fixture and usable payment gateway/method configuration.
