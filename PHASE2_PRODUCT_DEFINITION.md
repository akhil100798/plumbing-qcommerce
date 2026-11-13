# FixKart Phase 2 Product Definition

**Status:** Design only — no implementation in this phase

**Boundary:** Phase 1 is certified and frozen. Phase 2 must not change assignment, offer eligibility, first-accept concurrency, tracking, cancellation, payment semantics, material/store lifecycle, authorization, V24, or V25. Phase 2 gates apply only to explicitly enabled orders.

## 1. Product definition

Phase 2 closes the trust gap after a plumber arrives at the customer location:

1. The plumber records what was observed and recommends a bounded repair.
2. The backend calculates labor and known-material pricing from versioned policy/catalog data.
3. The customer reviews one complete immutable quote and explicitly approves or rejects it.
4. Approved work may continue; rejected work stops and is closed through the existing lifecycle policy.
5. Materials that are needed but not yet priced continue through the existing plumber → store flow and produce a separate priced addendum before those materials are used.

The first wedge is diagnosis clarity and material-price trust. Phase 2 is not a generic marketplace, dynamic-pricing engine, or full billing rewrite.

### Product invariants

- The visit/diagnosis fee remains separate and already owed under the existing policy.
- A plumber never supplies an authoritative payable total.
- Every published quote is an immutable version with a backend-calculated total, currency, pricing-policy version, and expiry.
- `QUOTE_APPROVED` means customer repair-scope authorization only. It is not payment authorization.
- Customer approval is explicit, attributable, timestamped, idempotent, and tied to one quote version.
- No paid repair work starts without approval of the applicable quote/addendum.
- Operations cannot silently fabricate approval or mutate a published quote.
- A rejected quote stops the repair workflow; it does not silently reduce scope.
- Existing material/store statuses and ownership remain authoritative for material fulfillment.

## 2. Frozen Phase 1 boundary and diagnosis entry point

Phase 1 remains authoritative for request creation, offer visibility, assignment, first accept, navigation, arrival, cancellation, tracking, and existing material/store fulfillment.

The diagnosis phase begins immediately after the assigned plumber successfully calls the existing arrival endpoint:

`POST/PATCH /api/v1/orders/{id}/arrive`

That endpoint currently transitions the service order to `IN_PROGRESS`. Phase 2 should not reinterpret or replace that transition. Instead, the service order receives a separate Phase 2 workflow state:

`NOT_STARTED → DRAFT → SUBMITTED`

The first diagnosis draft may be created only when the order is `IN_PROGRESS` and the caller is the assigned plumber. Existing `WORK_RESUMED` jobs may use the quote/addendum flow for a later approved scope, but must not be treated as a new arrival. `NOT_STARTED` is derived when no diagnosis row exists; it is not persisted.

The existing Mongo `ServiceLog.diagnosis` field is a useful historical log, but it is not sufficient as the approval/pricing source of truth. Phase 2 diagnosis and quote records must be transactional and relational; a final service log can reference their IDs.

### Feature policy

Flag: `phase2DiagnosisQuotes.enabled`.

- Default: `OFF`.
- Target by service area, issue category, and optionally plumber cohort.
- When off, Phase 1 behavior is unchanged: no Phase 2 UI, no diagnosis/quote gates, and legacy material/completion behavior remains active.
- Jobs created before enablement remain Phase 1-only unless explicitly enrolled.
- When on for an order, server-side diagnosis, material-use, resume, and completion gates apply regardless of client UI state.
- The flag controls new enrollment only. Each enrolled order has one immutable `phase2_enrollments` snapshot; every Phase 2 gate consults that snapshot, not the current flag or targeting rules.
- Disabling the flag is a safe rollback for new Phase 2 entry. Existing enrolled orders retain their gates and recorded policy; they are never silently bypassed or stranded. Orders without enrollment remain Phase 1-only. Old `IN_PROGRESS` jobs remain Phase 1-only unless explicitly enrolled through an auditable operation.

## 3. Lifecycle and state model

### 3.1 Diagnosis state

| State | Meaning | Allowed next states |
|---|---|---|
| `NOT_STARTED` | Derived DTO state: no diagnosis row exists | `DRAFT` when the assigned plumber creates one |
| `DRAFT` | Structured observations, recommendation, and evidence are being prepared | `DRAFT`, `SUBMITTED`, `CANCELLED` |
| `SUBMITTED` | Immutable diagnosis version used for quote calculation and material identification | `SUPERSEDED`, `CANCELLED` |
| `SUPERSEDED` | Replaced by the single permitted controlled revision | terminal for that version |
| `CANCELLED` | Order or audited operational cancellation closed this diagnosis version | terminal for that version |

Required diagnosis data: affected component/category, observed condition, diagnosis narrative, recommended remedy, estimated labor units, known material candidates, safety notes, and evidence references. At least one valid private before/diagnosis photo is required before submission, subject to category policy.

### 3.2 Quote state

Quote versions are separate from `OrderStatus` and do not replace Phase 1 statuses.

| State | Meaning | Allowed next states |
|---|---|---|
| `DRAFT` | Backend is calculating or plumber is completing a bounded proposal | `PUBLISHED`, `CANCELLED` |
| `PUBLISHED` | Customer can decide until `expiresAt` | `APPROVED`, `REJECTED`, `EXPIRED`, `SUPERSEDED` |
| `APPROVED` | Customer authorized this immutable scope/version | terminal for that version |
| `REJECTED` | Customer declined the diagnosis/quote | terminal for that version |
| `EXPIRED` | Decision window elapsed | terminal for that version |
| `SUPERSEDED` | Replaced by the one controlled revision | terminal for that version |
| `CANCELLED` | Order was cancelled or quote was withdrawn before decision | terminal |

Diagnosis submission changes the diagnosis to `SUBMITTED` and creates a separate quote record in `DRAFT`. Diagnosis never transitions to `QUOTE_DRAFT`. Only one published quote may be current. There is exactly one initial quote plus at most one replacement revision. The replacement supersedes, never edits, the original.

### 3.3 Addendum state

An addendum is a quote version for material lines discovered or priced after the initial quote. It uses the same immutable decision model but is linked to the original approved quote:

`DRAFT → PUBLISHED → APPROVED | REJECTED | EXPIRED | SUPERSEDED | CANCELLED`

The existing material request can be created after diagnosis submission. Store approval, reservation, packing, pickup, and collection remain governed by the existing material workflow. Final priced material data is copied into the addendum snapshot; it is never retroactively changed in the original quote.

Addendum versioning is independent of initial-quote revision. Each addendum attempt has its own version number under `(service_order_id, base_quote_id, quote_kind)`. There is no automatic or unlimited revision. Rejection, expiry, or cancellation closes that authorization attempt; a correction creates a new audited addendum version with the same valid approved base and explicitly supersedes the prior addendum attempt without rewriting its decision history. A published addendum cannot be edited.

### 3.4 Relationship to `OrderStatus`

Phase 1 `OrderStatus` remains unchanged. The Phase 2 state is an orthogonal workflow projection:

- arrival: `IN_PROGRESS` + diagnosis `NOT_STARTED`
- diagnosis submitted: `IN_PROGRESS` + quote `PUBLISHED` or pending material data
- quote approved: `IN_PROGRESS` + approved quote
- materials required: existing flow may move the order to `MATERIALS_REQUIRED` / `WAITING_FOR_STORE` / subsequent existing statuses
- work resumed: existing `WORK_RESUMED` plus approved applicable quote/addendum
- completion: existing completion and payment flow remain authoritative
- cancellation: existing cancellation closes open diagnosis/quote/addendum records atomically

For Phase 2-enabled orders, the completion and resume gates in Sections 11 and E3/E4 apply before existing work/completion mutations. For Phase 1-only orders, every existing transition and billing behavior remains unchanged.

## 4. API design

All endpoints must derive actor identity from authentication. Client-supplied plumber/customer IDs are not trusted.

### Plumber diagnosis and quote proposal

- `POST /api/v1/orders/{orderId}/diagnosis`
  - Creates the diagnosis draft after arrival.
- `PATCH /api/v1/orders/{orderId}/diagnosis/{diagnosisId}`
  - Updates a draft owned by the assigned plumber.
- `POST /api/v1/orders/{orderId}/diagnosis/{diagnosisId}/submit`
  - Validates structured fields and required evidence; locks the diagnosis and creates a quote draft.
- `GET /api/v1/orders/{orderId}/diagnosis`
  - Returns the authorized current diagnosis and evidence metadata.
- `POST /api/v1/orders/{orderId}/quotes/{quoteId}/publish`
  - Calculates/snapshots labor and known material lines and publishes the quote.
- `POST /api/v1/orders/{orderId}/quotes/{quoteId}/revise`
  - Creates the one permitted replacement and supersedes the old version with an audit reason.
- `POST /api/v1/orders/{orderId}/material-requests`
  - Phase 2 may call the existing material-request creation behavior only after diagnosis submission; this is an integration gate, not a new store workflow.

### Customer decision

- `GET /api/v1/customer/orders/{orderId}/diagnosis`
- `GET /api/v1/customer/orders/{orderId}/quotes/current`
- `POST /api/v1/customer/orders/{orderId}/quotes/{quoteId}/approve`
- `POST /api/v1/customer/orders/{orderId}/quotes/{quoteId}/reject`
  - Rejection requires a bounded reason category and optional customer note.
- `GET /api/v1/customer/orders/{orderId}/addenda/current`
- `POST /api/v1/customer/orders/{orderId}/addenda/{addendumId}/approve`
- `POST /api/v1/customer/orders/{orderId}/addenda/{addendumId}/reject`

Approval/rejection endpoints must be idempotent using an idempotency key and must return the existing decision for a repeated request. A decision against an expired, superseded, cancelled, or non-current version returns a deterministic conflict.

### Operations

- `GET /api/v1/admin/service-jobs/{orderId}/diagnosis`
- `GET /api/v1/admin/service-jobs/{orderId}/quotes`
- `GET /api/v1/admin/service-jobs/{orderId}/audit`
- `POST /api/v1/admin/service-jobs/{orderId}/request-quote-revision`
- `POST /api/v1/admin/service-jobs/{orderId}/cancel-diagnosis`
- `GET /api/v1/admin/service-jobs/{orderId}/reconciliation`
- Explicit correction commands are limited to the unused initial quote revision, one valid material-addendum correction, or cancellation/closure. There is no operations override-authorization command.

Operations may cancel, reopen through a new quote request, or record mediation. They may not edit an immutable quote or create a customer approval. Any operational action requires a reason and audit actor.

## 5. Database and migration plan

Add a new migration after V25, tentatively `V26__add_phase2_diagnosis_quote_flow.sql`. Do not modify prior migrations.

### Core tables

`phase2_enrollments`

- `id`, `service_order_id`, `feature_key`, service-area/category/plumber-cohort snapshots, `enrollment_policy_version`, `enrolled_at`, `created_at`
- `service_order_id` is unique; row existence means enabled enrollment. Enrollment is created once and immutable. Operational cancellation never mutates or deletes the row; it uses Phase 2 cancellation/audit state.

`service_diagnoses`

- `id`, `service_order_id`, `plumber_id`
- `state`, `revision_number`, `submitted_at`
- structured diagnosis fields and safety flag/notes
- `created_at`, `updated_at`, optimistic `version`

`service_quotes`

- `id`, `service_order_id`, `diagnosis_id`, `quote_kind` (`INITIAL`, `REVISION`, `MATERIAL_ADDENDUM`)
- `version_number`, `state`, `currency`
- `labor_subtotal`, `known_material_subtotal`, `total`; Phase 2 does not add a platform fee
- `pricing_catalog_version`, `published_at`, `expires_at`
- `pricing_catalog_id` (required for `INITIAL`/`REVISION`; nullable only for material-only `MATERIAL_ADDENDUM`), `base_quote_id`, `supersedes_quote_id`, `approved_at`, `rejected_at`, `decision_actor_id`, `decision_reason`
- immutable timestamps and optimistic `version`

`service_quote_lines`

- `quote_id`, line type (`SERVICE`, `MATERIAL`, `FEE`), catalog/service code or material reference
- description snapshot, quantity, unit, unit price, line total, pricing source/version
- no dependence on mutable catalog data after publication

`service_diagnosis_evidence`

- `diagnosis_id`, `service_order_photo_id`, evidence role, created timestamp; evidence belongs to a diagnosis version and reuses existing `ServiceOrderPhoto` binary storage

`service_quote_events`

- quote/diagnosis ID, event type, actor ID/role, reason, from/to state, request/idempotency key, timestamp

`service_pricing_catalog` and `service_pricing_catalog_lines`

- backend-owned versioned service codes and labor rules
- active window, currency, unit, price, issue/category applicability, status
- no destructive updates to versions referenced by a quote

`phase2_reconciliations`

- one bounded reconciliation snapshot per positive-variance attempt, with status, correction type, optional correction quote, audit actor, timestamps, and resolution

### Constraints and transaction rules

- one current diagnosis draft/submitted record per order;
- one current published quote per order/kind;
- unique `(service_order_id, quote_kind, version_number)`;
- quote line totals and quote total calculated server-side;
- `expires_at > published_at`;
- approval/rejection can transition only the current unexpired published version;
- create-diagnosis is the canonical Phase 2 entry transaction: after successful arrival leaves the order `IN_PROGRESS`, the assigned plumber locks `service_order`, checks the unique enrollment row, evaluates the current flag/targeting exactly once only when no row exists, inserts enrollment if eligible, and creates diagnosis `DRAFT` before commit. Enrollment and draft creation are atomic and idempotent; concurrent requests yield one enrollment and one draft. Ineligible orders return a Phase 1-only/feature-disabled result. Existing `IN_PROGRESS` jobs are not automatically enrolled; old-job enrollment requires a separate audited operation.
- diagnosis submission, quote draft creation, and material-request eligibility are one transaction where possible;
- customer decision locks the quote and writes the audit event atomically;
- cancellation locks the service order and closes all open Phase 2 records atomically;
- use the same service-order lock strategy established in Phase 1.

## 6. Customer flow

1. Existing tracking shows the plumber arrived; Phase 1 tracking remains unchanged.
2. Customer receives “Diagnosis in progress,” with no unverified diagnosis or price shown.
3. After submission, customer sees structured findings, recommended repair, private evidence photos, known materials, labor lines, total, currency, visit-fee separation, expiry, and clear “approve”/“reject” actions.
4. Approval shows the exact version, timestamp, and scope authorized. It creates repair-scope authorization only. It does not call `PaymentService`, create a `PaymentOperation`, capture funds, mutate payment status, mutate `service_orders.total_amount`, or replace the existing `COMPLETED -> PAID` flow.
5. Rejection stops paid repair work and exposes close/cancel guidance. It does not create a hidden reduced-scope job.
6. If final material pricing arrives later, the customer receives a separate addendum with only the newly priced material scope. Existing material pickup cannot be treated as customer authorization until the addendum is approved.
7. Expired or superseded quotes are read-only and require a new controlled version.

## 7. Plumber flow

1. After successful Phase 1 arrival, plumber opens a diagnosis draft.
2. Plumber records structured observations, remedy, labor service codes/quantities, safety notes, and required evidence photos.
3. Submission locks the diagnosis and allows the existing material request flow to begin for identified materials.
4. Backend validates service catalog lines and computes the quote; the plumber may explain scope but cannot set the payable total. Quote approval is not payment authorization.
5. Plumber sees pending customer decision and cannot mark paid repair work as started without approval.
6. One pre-approval revision is available if clarification or correction is needed. The prior version remains visible as superseded.
7. When materials become priced, the plumber confirms the material addendum data; the existing store lifecycle continues unchanged.
8. After approval and material readiness, existing resume/work/completion paths continue. For Phase 2-enabled orders, server-side gates require submitted diagnosis, approved initial quote, all required approved addenda, and no safety block before resume or completion. A safety issue routes to cancellation/operations handling, not an unlogged bypass. Phase 1-only jobs are unchanged.

## 8. Admin/operations flow

Operations gets a service-job view containing:

- diagnosis state and structured fields;
- evidence thumbnails with scoped access;
- quote and addendum versions, line snapshots, pricing catalog version, expiry, and decisions;
- existing material-request status and store assignment;
- full audit timeline including actor, role, reason, and idempotency key.

Operations can monitor stale/expired decisions, request the one revision, cancel unsafe or rejected jobs, and investigate disputes. It cannot change catalog snapshots, edit a published quote, or impersonate customer approval. Emergency operational cancellation is allowed under existing role policy and must be auditable.

## 9. Security and privacy

- Enforce assigned-plumber ownership for diagnosis creation/editing/submission.
- Enforce customer ownership for customer diagnosis/quote reads and decisions.
- Enforce operations roles for internal audit and pricing administration.
- Keep actor IDs, internal reasons, pricing policy metadata, and operational notes out of customer/plumber DTOs unless intentionally user-facing.
- Keep diagnosis photos private; authorize every metadata and binary-file read against the order and actor.
- Validate MIME type, size, image dimensions, malware policy, and storage path; never trust client filenames or URLs.
- Avoid exposing customer phone, address, or coordinates beyond existing Phase 1 authorization.
- Record immutable decision/audit events and prevent replay with idempotency keys.
- Treat free text and photos as untrusted input; redact or restrict them in support/admin exports as policy requires.

## 10. Concurrency and idempotency risks

- Two customer approval requests must yield one decision and one authorization event.
- Approval racing expiry must be resolved under the quote/order lock using server time.
- Approval racing plumber revision must deterministically let the first committed valid transition win; the other receives conflict.
- Two material addendum approvals must not duplicate authorization or allow use of unapproved materials.
- Diagnosis submission must not create duplicate quotes or duplicate material requests on retry.
- Quote publication must snapshot catalog prices in one transaction and never recalculate a published version.
- Cancellation racing approval must have one authoritative outcome under the service-order lock.
- Outbox events should be emitted transactionally only for `DIAGNOSIS_SUBMITTED`, `QUOTE_PUBLISHED`, `QUOTE_APPROVED`, `QUOTE_REJECTED`, `QUOTE_EXPIRED`, `QUOTE_SUPERSEDED`, `ADDENDUM_PUBLISHED`, `ADDENDUM_APPROVED`, `ADDENDUM_REJECTED`, `ADDENDUM_SUPERSEDED`, and `PHASE2_CANCELLED`; draft edits remain audit history. Reconciliation remains an internal record and has no outbox event.

## 11. Test strategy

### Backend

- diagnosis field validation, evidence requirement, ownership, and lifecycle transitions;
- catalog version selection, currency, rounding, quantity rules, and server-side total calculation;
- immutable quote snapshots after catalog/customer/profile changes;
- one-revision limit and supersession;
- approval/rejection, expiry, duplicate requests, stale versions, and idempotency;
- addendum approval gating material use while preserving existing store transitions;
- cancellation rollback and closure of open Phase 2 records;
- authorization/privacy DTO tests for customer, plumber, and operations;
- lock/concurrency tests for approve-vs-expire, approve-vs-revise, cancel-vs-approve, and duplicate submission;
- variance-basis tests for excluded platform/visit/referral accounting, exact scope match, lower variance receipt behavior, and rejection of unapproved enrolled-order `extraCharge`;
- variance tests verify no `finalLegacyAmount`-based authorization comparison remains, zero variance uses `legacyRepairAmount`, and platform fee creates no repair variance;
- reconciliation tests for one-record positive variance creation, unresolved completion blocking, customer-approved retry, no operations override, used-revision rejection, and rejection of fake material corrections for labor variance;
- reconciliation reference tests require only `correction_quote_id` for `REVISION`, only `correction_addendum_id` for `MATERIAL_ADDENDUM`, neither for `CANCEL`, and reject wrong kind/order or unapproved corrections;
- enrollment tests for atomic enrollment plus diagnosis draft, rollback, concurrent creation, old `IN_PROGRESS` non-enrollment, and flag disablement after enrollment;
- material-link tests for item `order_id` mismatch, cross-order request rejection, and duplicate `PENDING`/`ACTIVE` item authorization;
- addendum tests for `SUPERSEDED`, one correction maximum, and correction-limit closure;
- advisory-lock concurrent catalog activation and outbox partial-unique-index tests;
- outbox retry tests cover one event for scheduler expiry, addendum supersession, cancellation, and request-driven idempotency, with zero events on rollback;
- outbox cardinality and rollback tests;
- V26 migration on PostgreSQL after V25 and constraint/index verification.

### Frontend

- plumber diagnosis draft, validation, photo upload, submit, revision, and pending decision states;
- customer quote rendering, visit-fee separation, expiry, approve/reject confirmation, and addendum flow;
- no fabricated prices, diagnosis, ETA, identity, or material approval state;
- admin quote/evidence/audit visibility and forbidden mutation controls;
- retry/error/conflict/401/403 behavior;
- customer, plumber, and admin typechecks plus focused regression suites.

### Manual certification

Use a disposable environment with two eligible plumbers and a real catalog version. Exercise the complete arrival → diagnosis → quote → customer decision → material addendum → work continuation path, including refresh/retry and race conditions. Never apply migrations or test data to live production.

## 12. Rollout plan

1. **Contract and schema shadow phase:** after V26 review, deploy schema/entities and read-only admin observability with `phase2DiagnosisQuotes.enabled=OFF`; no customer-visible behavior and no Phase 2 gates.
2. **Internal pilot:** enable for a small operations/plumber cohort, by service area and issue category. Keep a manual fallback and verify that Phase 1-only jobs retain legacy material/completion behavior.
3. **Customer pilot:** enable one complete quote flow for a narrow category where catalog pricing is reliable. Require operations visibility and a kill switch.
4. **Controlled expansion:** add categories only after pricing accuracy, photo/privacy review, cancellation handling, payment-boundary monitoring, and feature-off regression pass.
5. **General availability:** publish support playbooks, audit dashboards, dispute procedures, and data-retention controls.

No migration is applied to production until the V26 PostgreSQL migration, rollback strategy, backups, and feature-flag-off behavior are certified.

### Implementation order

1. Final contract freeze.
2. Acceptance and concurrency tests.
3. Stable enrollment model and flag policy.
4. Final V26 schema, including photo-phase compatibility.
5. Entities, repositories, composite keys, and locks.
6. Catalog activation and overlap enforcement.
7. Evidence/photo compatibility.
8. Diagnosis service.
9. Quote engine and revision/addendum versioning.
10. Idempotency and transactional outbox.
11. Customer decision.
12. Material linkage and addendum integration.
13. Dedicated `Phase2AuthorizationGate`.
14. Guard `resume()`, the material-use boundary, and `completeOrder()`.
15. DTOs/controllers.
16. Customer UI.
17. Plumber UI.
18. Operations UI.
19. Migration/regression certification.
20. Final engineering review and QA.

## 13. Explicitly out of scope

- multi-store marketplace or store bidding;
- delivery partner integration;
- dynamic, surge, zone, or time-based pricing;
- wallets, credits, refunds, or a replacement payment ledger;
- full GPS/live route tracking;
- advanced analytics or predictive diagnosis;
- open plumber marketplace or unrestricted plumber discovery;
- per-line customer negotiation or partial quote approval;
- unlimited quote revisions;
- operations editing or silently approving customer quotes;
- automated diagnosis by AI;
- customer-supplied repair scope as a pricing authority;
- redesign of the existing material/store lifecycle;
- changing Phase 1 assignment, cancellation, navigation, tracking, auth, or payment semantics.

## 14. Definition of Phase 2 success

Phase 2 is successful when a customer can see exactly what the plumber observed, why the repair is recommended, what the known work costs, and which materials remain uncertain — then make one explicit decision before paid repair work proceeds. Every amount and decision must be reproducible from immutable snapshots and auditable without exposing internal operational data.

---

# Engineering-safe corrections

This section is authoritative where it is more specific than earlier product prose. It incorporates the completed engineering review and is still design-only.

## E1. Separate state machines and diagnosis versioning

`NOT_STARTED` is derived when no diagnosis row exists. It is not persisted.

Diagnosis states are exactly `DRAFT`, `SUBMITTED`, `SUPERSEDED`, and `CANCELLED`.

- Draft diagnosis data is mutable.
- Submitted diagnosis data is immutable and is never edited in place.
- Each diagnosis has `version_number` and nullable `revision_of_diagnosis_id`.
- A quote revision that changes diagnosis creates a new diagnosis version.
- The previous submitted diagnosis becomes `SUPERSEDED` only after the replacement diagnosis successfully submits.
- Evidence belongs to the diagnosis version.
- Quote lines snapshot the diagnosis facts needed to explain and price the scope.

Diagnosis submission performs two separate state changes in one transaction:

```text
diagnosis: NOT_STARTED/DRAFT -> SUBMITTED
quote:     no row           -> DRAFT
```

Diagnosis never transitions to `QUOTE_DRAFT`.

Quote states are exactly `DRAFT`, `PUBLISHED`, `APPROVED`, `REJECTED`, `EXPIRED`, `SUPERSEDED`, and `CANCELLED`.

Addendum states are exactly `DRAFT`, `PUBLISHED`, `APPROVED`, `REJECTED`, `EXPIRED`, `SUPERSEDED`, and `CANCELLED`.

### Transition contract

| Transition | Actor and prerequisite | Lock/idempotency | Audit/outcome |
|---|---|---|---|
| Diagnosis `NOT_STARTED -> DRAFT` | Assigned plumber; `IN_PROGRESS`; flag enabled | Idempotency row then service order lock | `DIAGNOSIS_DRAFT_CREATED`; duplicate returns same draft |
| Diagnosis `DRAFT -> DRAFT` | Assigned plumber; optimistic version matches | Order plus diagnosis version | `DIAGNOSIS_DRAFT_UPDATED`; stale version `409` |
| Diagnosis `DRAFT -> SUBMITTED` | Assigned plumber; `IN_PROGRESS`; valid fields/evidence | Idempotency, order, diagnosis | `DIAGNOSIS_SUBMITTED`; quote `DRAFT` created atomically |
| Diagnosis `SUBMITTED -> SUPERSEDED` | Revision service after replacement submits | Order lock | `DIAGNOSIS_SUPERSEDED`; invalid state `409` |
| Diagnosis open -> `CANCELLED` | Existing cancellation/operator policy | Order lock | One `PHASE2_CANCELLED`; existing order history is not duplicated |
| Quote `DRAFT -> PUBLISHED` | Quote service; submitted diagnosis, valid catalog/lines | Idempotency, order, quote | `QUOTE_PUBLISHED`; invalid catalog/state `409` or `422` |
| Quote `PUBLISHED -> APPROVED` | Owning customer; current and unexpired | Idempotency, order, quote | `QUOTE_APPROVED`; replay returns same decision |
| Quote `PUBLISHED -> REJECTED` | Owning customer; bounded reason | Same | `QUOTE_REJECTED`; race loser `409` |
| Quote `PUBLISHED -> EXPIRED` | Lazy decision or scheduler; server clock | Order plus quote | `QUOTE_EXPIRED`; already-terminal is a no-op |
| Quote `PUBLISHED -> SUPERSEDED` | One permitted revision before decision | Idempotency, order, quote | `QUOTE_SUPERSEDED`; revision exhaustion `409` |
| Quote/addendum open -> `CANCELLED` | Existing order cancellation or audited correction | Order plus record | Historical decisions remain immutable |
| Addendum `DRAFT -> PUBLISHED` | Final linked material prices/items | Idempotency, order, addendum, request | `ADDENDUM_PUBLISHED` |
| Addendum `PUBLISHED -> APPROVED` | Owning customer; current and unexpired | Idempotency, order, addendum, request | `ADDENDUM_APPROVED` |
| Addendum `PUBLISHED -> REJECTED` | Owning customer; bounded reason | Same | `ADDENDUM_REJECTED` |
| Addendum `PUBLISHED -> EXPIRED` | Lazy decision or scheduler | Same | Expiry audit; no approval |
| Addendum `PUBLISHED -> SUPERSEDED` | Audited correction; replacement publication succeeds atomically; one correction maximum | Idempotency, order, addendum, request | `ADDENDUM_SUPERSEDED` |

All invalid transitions return `409 Conflict`. Missing resources return `404`; unauthorized actors return `403`; malformed data returns `400`/`422`.

## E2. Exact quote revision rule

Initial-scope quote flow has exactly:

1. Version 1: `quote_kind = INITIAL`.
2. Version 2: `quote_kind = REVISION`.

The maximum is one initial quote plus one replacement revision. Revision is allowed only while the current initial quote is `PUBLISHED`, undecided, unexpired, uncancelled, and not previously revised. It is not allowed after `APPROVED`, `REJECTED`, `EXPIRED`, `SUPERSEDED`, or `CANCELLED`. Required material must not already be physically collected or used.

The assigned plumber may request a revision; operations may request one for clarification. A revised diagnosis creates a new diagnosis version. Customer rejection closes the quote flow. A later operations-requested diagnosis cycle is a new audited cycle, not a hidden revision.

Addenda have no automatic revision. An incorrect addendum is replaced only through an explicit audited plumber/operations correction flow. A maximum of one correction replacement is allowed per original addendum attempt; the replacement receives the next addendum version and the original becomes immutable `SUPERSEDED` only when replacement publication succeeds atomically. A rejected/expired/cancelled addendum cannot be edited or corrected again. A correction beyond that one replacement requires operations closure/cancellation. Addendum correction does not consume the initial quote revision.

## E3. Payment and completion boundary

`QUOTE_APPROVED` means customer repair-scope authorization only.

It must not call `PaymentService`, create `PaymentOperation`, capture funds, mutate payment status, mutate `service_orders.total_amount`, or replace `COMPLETED -> PAID`. Payment remains after completion under existing Phase 1 behavior. Pre-authorization, refunds/credits, a new payment ledger, and billing redesign are out of scope; the narrowly defined completion variance check and operations reconciliation policy below are required for the pilot.

Current Phase 1 `completeOrder()` can complete from existing active states and calculates legacy labor/parts/referral/platform billing. For Phase 2-enabled orders, a server-side gate must run before any legacy completion or billing mutation:

- diagnosis is `SUBMITTED`;
- applicable initial quote is `APPROVED`;
- all required material addenda are `APPROVED`;
- no safety block exists;
- normal existing completion eligibility passes.

After the authorization checks, use a side-effect-free `LegacyBillingPreviewService` that returns the same component breakdown and arithmetic as the current `completeOrder()`. The implementation must extract the existing calculation into one shared pure calculator used by both preview and completion so Phase 1 results remain unchanged. Define `legacyRepairAmount` as only the repair-scope portion: legacy labor plus delivered material/parts charges and approved repair-scope extra charges. Exclude the existing `platformFee`, the separate visit fee, and referral accounting amounts that are not customer repair scope. For an enrolled order, plumber `extraCharge` is rejected unless represented in a customer-approved quote or addendum. Compute `authorizedRepairAmount` as the approved initial/revision quote total plus all approved required addenda, and define:

```text
varianceAmount = legacyRepairAmount - authorizedRepairAmount
```

For enrolled orders: zero variance allows completion; negative variance allows completion, stores/audits the negative variance, and charges only the actual lower legacy final amount under existing payment behavior. No refund or credit workflow is created; the customer receipt displays the lower actual amount. Positive variance blocks completion with deterministic `409 Conflict`, does not set `COMPLETED`, mutate billing/payment state, or call payment/capture, and creates or reuses one reconciliation record. The reconciliation must be resolved by customer-approved increased authorization, or the order must be closed/cancelled. Operations receives the quote, addenda, repair amount, excluded accounting amounts, variance, and blocking reason. Phase 1-only jobs are unchanged.

### Positive-variance reconciliation

`phase2_reconciliations` records `id`, `service_order_id`, `authorization_snapshot_amount`, `legacy_repair_amount`, `variance_amount`, `reason`, `status`, `correction_type`, nullable `correction_quote_id`, nullable `correction_addendum_id`, `created_by`, `created_at`, `resolved_at`, and `resolution`. States are `OPEN`, `AWAITING_CUSTOMER_APPROVAL`, `RESOLVED`, and `CLOSED_CANCELLED`. Correction types are `REVISION`, `MATERIAL_ADDENDUM`, and `CANCEL`. `REVISION` requires only `correction_quote_id`, whose quote kind is `REVISION`; `MATERIAL_ADDENDUM` requires only `correction_addendum_id`, whose quote kind is `MATERIAL_ADDENDUM`; `CANCEL` requires neither reference. Exactly the valid reference for the selected correction type may be populated. Row-level nullability/check constraints enforce what is possible; the locked reconciliation service verifies quote kind, same service order, and customer approval before `RESOLVED`.

Completion first performs the side-effect-free preview. If variance is positive, it creates or reuses that reconciliation row and returns `409`; duplicate completion retries do not create another row. Operations/plumber may choose exactly one valid correction: the still-unused initial `REVISION`, one material addendum correction only for genuinely new material scope, or cancellation/closure. The customer must approve the increased authorization. Completion retries only when the currently approved repair authorization is at least the current legacy repair amount; successful completion marks the reconciliation `RESOLVED`. A used revision cannot be reused, non-material variance cannot be represented by a fake material addendum, and no second hidden quote revision exists. Operations cannot override customer approval. If correction is unavailable, the order is closed/cancelled or routed to a future separately designed flow.

## E4. Material and resume gates

Existing `MATERIALS_REQUIRED`, `WAITING_FOR_STORE`, pickup, and collection statuses remain unchanged and describe logistics only. Pickup/collection is never customer approval.

For Phase 2-enabled orders:

- material request creation is allowed only after diagnosis submission;
- the repository has no separate material-consumption or installation command; `PlumberMaterialService.resume(jobId)` is the earliest existing server operation that enables repair continuation after collection, so the Phase 2 authorization gate belongs before its `WORK_RESUMED` mutation;
- material use is rejected unless the linked addendum is `APPROVED`; `completeOrder()` remains a secondary enforcement layer;
- `resume()` requires submitted diagnosis, approved initial quote, all required addenda approved, and normal existing resume eligibility;
- pickup alone never satisfies approval;
- Phase 1-only jobs bypass these gates.

The flow is:

```text
diagnosis submitted
 -> existing material request
 -> store pricing/fulfillment
 -> explicit request/item linkage
 -> addendum publication
 -> customer approval
 -> material use
 -> existing return/resume flow
```

## E5. Evidence model

The primary evidence relation is `service_diagnosis_evidence`, not `service_quote_evidence`:

```text
diagnosis_id
service_order_photo_id
evidence_role
created_at
```

Evidence belongs to the diagnosis version. Reuse existing `ServiceOrderPhoto` binary storage. The selected design is an explicit `DIAGNOSIS` photo phase, with existing `BEFORE`/`AFTER` behavior untouched. Implementation review must verify that the enum and authorization path can be added compatibly. If compatibility testing proves that impossible, implementation must stop for an explicit decision to reuse `BEFORE` with the diagnosis role stored in the relation; no silent fallback is allowed.

The current repository enum has only `BEFORE` and `AFTER`. Implementation must add `DIAGNOSIS` and include the V26/persistence check impact if a database constraint exists, upload validation, authorization, DTO/API support, and a separately authorized customer-safe read endpoint. Existing BEFORE and AFTER uploads, reads, and authorization must remain compatible and unchanged for Phase 1.

Validate same-order ownership transactionally. Validate actual MIME/content, size, and dimensions. Add a separately authorized customer evidence endpoint using streamed/signed access. Never expose raw storage keys. Do not weaken existing plumber-only photo endpoints globally. Retention/deletion must preserve evidence referenced by immutable quotes/audits.

## E6. Explicit material linkage

`service_quote_material_links` is required:

```text
id BIGSERIAL PRIMARY KEY
service_order_id BIGINT NOT NULL
quote_id BIGINT NOT NULL
material_request_id BIGINT NOT NULL
material_request_item_id BIGINT NULL
link_type VARCHAR(32) NOT NULL
authorization_state VARCHAR(24) NOT NULL
created_at TIMESTAMP NOT NULL
```

It references the quote/addendum, existing material request, and optional item. `service_quotes` and `product_orders` expose `UNIQUE(id,service_order_id)`, and the link uses composite FKs `(quote_id,service_order_id)` and `(material_request_id,service_order_id)`. The item uses an ordinary FK `material_request_item_id -> product_order_items(id)`. Because the frozen item schema owns the relationship through `product_order_items.order_id -> product_orders.id`, the locked material-link service invariant verifies `product_order_items.order_id = material_request_id` and that the request's `service_order_id` equals the link service order; the invariant runs in the same transaction and order lock as publication/approval. No nonexistent `product_order_items.material_request_id` column is assumed. Cancelled/rejected requests cannot publish addenda, collected/consumed items cannot be re-added, and one item may belong to only one active addendum. Link authorization states are `PENDING`, `ACTIVE`, `SUPERSEDED`, `CANCELLED`, `REJECTED`, and `EXPIRED`; a partial unique index on `(material_request_item_id) WHERE authorization_state IN ('PENDING','ACTIVE')` prevents duplicate active authorization. State transitions are atomic under the service-order lock. Quote lines retain immutable price snapshots; links are mutable only through audited correction.

## E7. Pricing and visit fee

Catalog identity is `catalog_key`, `version_number`, `currency`, `effective_from`, `effective_to`, and `status`. There is one active version per key/currency, active windows do not overlap, retirement prevents new use only, and referenced versions/lines are immutable. Published quotes never recalculate from live catalog prices. First release currency is INR only unless product policy changes.

Use Java `BigDecimal`, PostgreSQL `DECIMAL(19,2)`, and `RoundingMode.HALF_UP`. Quantity uses scale 2 unless a service is integer-only. Normalize `lineTotal = quantity * unitPrice`, labor subtotal, material subtotal, and total to scale 2:

```text
quoteTotal = laborSubtotal + knownMaterialSubtotal
```

Reject negative/zero quantities, negative prices, unsupported currency, invalid service/category, out-of-range quantities, mixed currencies, and client totals that differ from server calculation. Do not add a Phase 2 platform fee.

Customer presentation is:

```text
Visit fee: informational only, separate
Repair quote total: excludes visit fee
Repair authorization: quote total only
```

Do not introduce `grandTotalDue` unless existing product/payment policy explicitly requires it.

## E8. Final V26 schema plan

V26 is a future migration after V25. Do not create it yet and do not modify V1-V25. PostgreSQL is the source of truth. Money is `DECIMAL(19,2)`; timestamps follow the existing convention; foreign keys default to `ON DELETE RESTRICT` to preserve history. The final V26 table list is: `phase2_enrollments`, `service_diagnoses`, `service_diagnosis_evidence`, `service_quotes`, `service_quote_lines`, `service_pricing_catalog`, `service_pricing_catalog_lines`, `service_quote_events`, `phase2_idempotency_keys`, `service_quote_material_links`, and `phase2_reconciliations`, plus the required `service_order_photos` phase compatibility/check update.

### `phase2_enrollments`

Columns: `id BIGSERIAL PK`, `service_order_id BIGINT NOT NULL UNIQUE FK`, `feature_key VARCHAR(80) NOT NULL`, `service_area_snapshot VARCHAR(120) NOT NULL`, `issue_category_snapshot VARCHAR(120) NOT NULL`, `plumber_cohort_snapshot VARCHAR(120) NULL`, `enrollment_policy_version VARCHAR(80) NOT NULL`, `enrolled_at TIMESTAMP NOT NULL`, `created_at TIMESTAMP NOT NULL`.

The row is inserted once when the order first enters Phase 2 and is immutable. Global flag and targeting changes do not update it. `enabled=false` is not used for ordinary rollback; unenrolled orders have no row and remain Phase 1-only. Any exceptional operational enrollment/cancellation is separately audited.

### `service_diagnoses`

Columns: `id BIGSERIAL PK`, `service_order_id BIGINT NOT NULL FK`, `plumber_id BIGINT NOT NULL FK`, `revision_of_diagnosis_id BIGINT NULL self-FK`, `version_number INTEGER NOT NULL`, `state VARCHAR(24) NOT NULL`, `issue_component VARCHAR(120) NOT NULL`, `observed_condition TEXT NOT NULL`, `diagnosis_text TEXT NOT NULL`, `recommended_remedy TEXT NOT NULL`, `safety_notes TEXT NULL`, `safety_blocked BOOLEAN NOT NULL DEFAULT FALSE`, `estimated_labor_units DECIMAL(10,2) NOT NULL`, `created_at TIMESTAMP NOT NULL`, `updated_at TIMESTAMP NOT NULL`, `submitted_at TIMESTAMP NULL`, `cancelled_at TIMESTAMP NULL`, `row_version BIGINT NOT NULL DEFAULT 0`.

Checks: state allowlist; version > 0; labor units > 0; submitted timestamp for `SUBMITTED`/`SUPERSEDED`; cancelled timestamp for `CANCELLED`. Unique `(service_order_id, version_number)`. Partial unique index: one `DRAFT` or `SUBMITTED` diagnosis per order. Indexes on `(service_order_id,state,created_at)` and `(plumber_id,state,created_at)`. Submitted business fields are immutable.

### `service_diagnosis_evidence`

Columns: `id BIGSERIAL PK`, `diagnosis_id BIGINT NOT NULL FK`, `service_order_photo_id BIGINT NOT NULL FK`, `evidence_role VARCHAR(32) NOT NULL`, `created_at TIMESTAMP NOT NULL`.

Check role allowlist. Unique `(diagnosis_id, service_order_photo_id)`. Index `(diagnosis_id,evidence_role)`. Same-order validation is application-transaction enforced. Submitted evidence relations are immutable.

### `service_quotes`

Columns: `id BIGSERIAL PK`, `service_order_id BIGINT NOT NULL FK`, `diagnosis_id BIGINT NOT NULL FK`, `quote_kind VARCHAR(24) NOT NULL`, `version_number INTEGER NOT NULL`, `state VARCHAR(24) NOT NULL`, `currency CHAR(3) NOT NULL`, `labor_subtotal DECIMAL(19,2) NOT NULL`, `known_material_subtotal DECIMAL(19,2) NOT NULL`, `total DECIMAL(19,2) NOT NULL`, `pricing_catalog_id BIGINT NULL FK`, `base_quote_id BIGINT NULL self-FK`, `supersedes_quote_id BIGINT NULL self-FK`, `published_at TIMESTAMP NULL`, `expires_at TIMESTAMP NULL`, `approved_at TIMESTAMP NULL`, `rejected_at TIMESTAMP NULL`, `decision_actor_id BIGINT NULL FK`, `decision_reason VARCHAR(1000) NULL`, `created_at TIMESTAMP NOT NULL`, `updated_at TIMESTAMP NOT NULL`, `row_version BIGINT NOT NULL DEFAULT 0`.

Checks: kind/state allowlists; amounts >= 0; total equals labor plus materials; published requires timestamps and `expires_at > published_at`; approved/rejected require matching decision timestamp/actor; `INITIAL` requires version 1, no parents, and a catalog; `REVISION` requires version 2, an initial `supersedes_quote_id`, no base quote, and a catalog; `MATERIAL_ADDENDUM` requires `base_quote_id` to an approved current initial-scope quote of the same order, never supersedes it, and may omit the catalog only for material-only store-priced lines. Row-level catalog rule: `INITIAL` and `REVISION` require `pricing_catalog_id IS NOT NULL`; `MATERIAL_ADDENDUM` may be null. When an addendum catalog is null, locked publication service validation requires every child line to have `line_type = MATERIAL` and `pricing_source = STORE`; this child-row condition is intentionally service-enforced, not a quote-row CHECK. Supporting `UNIQUE(id,service_order_id)` enables composite ownership FKs. Parent kind/state/order rules and the same-order base-quote relationship are enforced by composite ownership plus locked service validation. Unique `(service_order_id,quote_kind,version_number)`. Partial unique indexes: one `PUBLISHED` quote per order/kind and one `APPROVED` initial-scope quote per order. Indexes on `(service_order_id,quote_kind,state)`, `(expires_at,state)`, and `diagnosis_id`. Published financial/diagnosis facts are immutable.

### `service_quote_lines`

Columns: `id BIGSERIAL PK`, `quote_id BIGINT NOT NULL FK`, `line_number INTEGER NOT NULL`, `line_type VARCHAR(24) NOT NULL`, `service_code VARCHAR(80) NULL`, `description_snapshot VARCHAR(500) NOT NULL`, `quantity DECIMAL(10,2) NOT NULL`, `unit VARCHAR(32) NOT NULL`, `unit_price DECIMAL(19,2) NOT NULL`, `line_total DECIMAL(19,2) NOT NULL`, `currency CHAR(3) NOT NULL`, `material_request_id BIGINT NULL FK`, `material_request_item_id BIGINT NULL FK`, `pricing_source VARCHAR(32) NOT NULL`, `created_at TIMESTAMP NOT NULL`.

Checks: type allowlist; line number > 0; quantity > 0; money >= 0; line total equals server-rounded quantity times price; service lines require service code; material lines require explicit material linkage. Unique `(quote_id,line_number)`. Index `(quote_id,line_type)`. Published lines are immutable.

### `service_pricing_catalog`

Columns: `id BIGSERIAL PK`, `catalog_key VARCHAR(80) NOT NULL`, `version_number INTEGER NOT NULL`, `status VARCHAR(24) NOT NULL`, `currency CHAR(3) NOT NULL`, `effective_from TIMESTAMP NOT NULL`, `effective_to TIMESTAMP NULL`, `created_by BIGINT NOT NULL FK`, `created_at TIMESTAMP NOT NULL`, `activated_at TIMESTAMP NULL`, `retired_at TIMESTAMP NULL`.

Checks: status allowlist; end after start; INR-only first release. Unique `(catalog_key,version_number)`. Partial unique index: one `ACTIVE` version per `(catalog_key,currency)`. Index `(catalog_key,currency,effective_from,effective_to)`. Activation must acquire `pg_advisory_xact_lock` using a documented deterministic 64-bit hash of normalized `catalog_key` and uppercase `currency` (trimmed, case-normalized, UTF-8 bytes), reload the family, reject overlapping ACTIVE ranges and one-active violations, then activate atomically. No activation path may bypass the advisory lock; concurrent overlap returns `409`. Referenced versions cannot be edited/deleted.

### `service_pricing_catalog_lines`

Columns: `id BIGSERIAL PK`, `catalog_id BIGINT NOT NULL FK`, `service_code VARCHAR(80) NOT NULL`, `issue_category VARCHAR(80) NULL`, `description VARCHAR(500) NOT NULL`, `unit VARCHAR(32) NOT NULL`, `unit_price DECIMAL(19,2) NOT NULL`, `min_quantity DECIMAL(10,2) NOT NULL DEFAULT 1`, `max_quantity DECIMAL(10,2) NOT NULL`, `created_at TIMESTAMP NOT NULL`.

Checks: price >= 0; min > 0; max >= min. Unique `(catalog_id,service_code)`. Index `(catalog_id,issue_category,service_code)`. Lines are immutable after activation.

### `service_quote_events`

Columns: `id BIGSERIAL PK`, `service_order_id BIGINT NOT NULL FK`, `diagnosis_id BIGINT NULL FK`, `quote_id BIGINT NULL FK`, `aggregate_type VARCHAR(32) NOT NULL`, `aggregate_id BIGINT NOT NULL`, `transition_key VARCHAR(64) NOT NULL`, `event_type VARCHAR(48) NOT NULL`, `from_state VARCHAR(24) NULL`, `to_state VARCHAR(24) NULL`, `actor_id BIGINT NULL FK`, `actor_role VARCHAR(48) NULL`, `reason VARCHAR(1000) NULL`, `idempotency_key_id BIGINT NULL FK -> phase2_idempotency_keys(id)`, `created_at TIMESTAMP NOT NULL`.

Columns also include `aggregate_type VARCHAR(32) NOT NULL`, `aggregate_id BIGINT NOT NULL`, and `transition_key VARCHAR(64) NOT NULL`. `transition_key` is a simple stable enum-like key such as `EXPIRED`, `SUPERSEDED`, or `PHASE2_CANCELLED`; aggregate identity is stored separately. Checks event type and aggregate allowlists. Indexes `(service_order_id,created_at)`, `(quote_id,created_at)`, `(diagnosis_id,created_at)`. Request-driven uniqueness is `UNIQUE (idempotency_key_id,event_type) WHERE idempotency_key_id IS NOT NULL`. Deterministic transition uniqueness is `UNIQUE (aggregate_type,aggregate_id,transition_key,event_type)`. Scheduler retries cannot duplicate `QUOTE_EXPIRED`; replacement retries cannot duplicate `ADDENDUM_SUPERSEDED`; cancellation retries cannot duplicate `PHASE2_CANCELLED`. The transition identity is assigned before event insert, one logical transition emits one event, rollback emits none, and no command intentionally emits the same event type twice. No reconciliation outbox event is required because reconciliation is internal Phase 2 operations state and has no external consumer.

### `phase2_idempotency_keys`

Columns: `id BIGSERIAL PK`, `actor_id BIGINT NOT NULL FK`, `operation VARCHAR(64) NOT NULL`, `resource_type VARCHAR(64) NOT NULL`, `resource_id BIGINT NOT NULL`, `idempotency_key VARCHAR(128) NOT NULL`, `request_hash CHAR(64) NOT NULL`, `state VARCHAR(24) NOT NULL`, `response_status INTEGER NULL`, `response_body JSONB NULL`, `failure_code VARCHAR(64) NULL`, `failure_body JSONB NULL`, `created_at TIMESTAMP NOT NULL`, `completed_at TIMESTAMP NULL`.

Unique `(actor_id,operation,resource_type,resource_id,idempotency_key)`. Create commands use the parent service order as resource (`SERVICE_ORDER`, `orderId`), including diagnosis and child quote/addendum creation. States are `IN_PROGRESS`, `COMPLETED`, and `FAILED`: same payload plus COMPLETED replays the exact status/body; payload mismatch returns `409`; IN_PROGRESS returns deterministic retryable `409`; FAILED returns its committed failure response and is retried only with a new key. Business mutation, response replay, and outbox insertion commit atomically; FAILED emits no outbox event. Indexes `(resource_type,resource_id,operation)` and `(state,created_at)`. Mandatory for every side-effecting Phase 2 command.

### `phase2_reconciliations`

Columns: `id BIGSERIAL PK`, `service_order_id BIGINT NOT NULL FK`, `authorization_snapshot_amount DECIMAL(19,2) NOT NULL`, `legacy_repair_amount DECIMAL(19,2) NOT NULL`, `variance_amount DECIMAL(19,2) NOT NULL`, `reason VARCHAR(1000) NOT NULL`, `status VARCHAR(32) NOT NULL`, `correction_type VARCHAR(32) NULL`, `correction_quote_id BIGINT NULL FK -> service_quotes(id)`, `correction_addendum_id BIGINT NULL FK -> service_quotes(id)`, `created_by BIGINT NOT NULL FK`, `created_at TIMESTAMP NOT NULL`, `resolved_at TIMESTAMP NULL`, `resolution VARCHAR(1000) NULL`.

Checks: status allowlist `OPEN`, `AWAITING_CUSTOMER_APPROVAL`, `RESOLVED`, `CLOSED_CANCELLED`; correction-type allowlist; positive variance required; resolved timestamp required for `RESOLVED`/`CLOSED_CANCELLED`; row-level correction reference nullability by type. Partial unique index `(service_order_id,authorization_snapshot_amount,legacy_repair_amount) WHERE status='OPEN'`. This is an internal transactional record; no reconciliation outbox event is emitted unless a future external consumer is explicitly added.

### `service_quote_material_links`

Columns: `id BIGSERIAL PK`, `service_order_id BIGINT NOT NULL FK`, `quote_id BIGINT NOT NULL`, `material_request_id BIGINT NOT NULL`, `material_request_item_id BIGINT NULL`, `link_type VARCHAR(32) NOT NULL`, `authorization_state VARCHAR(24) NOT NULL`, `created_at TIMESTAMP NOT NULL`.

Checks link/state allowlists. Supporting unique keys `(id,service_order_id)` on `service_quotes` and `product_orders` support composite FKs `(quote_id,service_order_id)` and `(material_request_id,service_order_id)`. `material_request_item_id` has an ordinary FK to `product_order_items(id)`; the locked material-link service invariant verifies `product_order_items.order_id = material_request_id` and that the request's `service_order_id` equals the link service order. No nonexistent item/request column is assumed. Unique `(quote_id,material_request_id,material_request_item_id,link_type)`. Partial unique index `(material_request_item_id) WHERE authorization_state IN ('PENDING','ACTIVE')`. Atomic service-order-locked transitions cover publication, approval, rejection, supersession, cancellation, and expiry; cancelled/rejected requests and collected/consumed items cannot become active. Links are mutable only through audited correction; snapshots remain immutable.

## E9. Locking and expiry

Mutating transactions use this order:

```text
1. idempotency row
2. service_order row
3. diagnosis / quote / addendum row
4. material request row
5. dependent line/evidence/link rows
```

Reuse the existing Phase 1 service-order pessimistic lock strategy. Do not make external calls while locks are held.

Use both lazy expiry on reads/decisions and a scheduled expiry job for operational cleanup/events. The decision endpoint is authoritative. At the exact boundary, `now >= expires_at` means expired, using the database/server clock only.

## E10. DTO privacy and APIs

Customer DTOs may contain structured diagnosis, customer-safe evidence, quote lines, totals/currency, expiry, the customer's own decision, and addendum status. They must not contain internal actor IDs, operations reasons, internal pricing metadata, raw storage keys, or operations notes.

Plumber DTOs may contain the diagnosis draft, own submission state, quote decision state, and material/addendum status. Operations DTOs may contain full diagnosis versions, evidence metadata, quote snapshots/catalog version, audit actor/reason, idempotency operation IDs, material links, and cancellation history. Use separate DTO types and never serialize entities directly.

Side-effecting APIs require `Idempotency-Key`:

- diagnosis create/update/submit;
- quote publish/revise;
- customer quote approve/reject;
- addendum publish/approve/reject;
- operations revision request/cancellation.

Approval/rejection locks idempotency, order, and target record, verifies ownership/current unexpired state, commits one decision and one outbox event, and stores the replayable response. `403`, `404`, and `409` remain distinct.

## E11. Cancellation and outbox

For diagnosis `DRAFT`/`SUBMITTED`, quote `DRAFT`/`PUBLISHED`, and addendum `DRAFT`/`PUBLISHED`:

- open current records become `CANCELLED` during existing order cancellation;
- approved/rejected historical decisions remain immutable;
- `APPROVED`, `REJECTED`, `EXPIRED`, and `SUPERSEDED` records remain in their original terminal states; cancellation prevents their future effect but never rewrites history;
- audit records are never deleted;
- existing Phase 1 cancellation policy and one order-history event remain authoritative;
- exactly one `PHASE2_CANCELLED` event is emitted; no duplicate order-status history is created.

Meaningful outbox events only:

`DIAGNOSIS_SUBMITTED`, `QUOTE_PUBLISHED`, `QUOTE_APPROVED`, `QUOTE_REJECTED`, `QUOTE_EXPIRED`, `QUOTE_SUPERSEDED`, `ADDENDUM_PUBLISHED`, `ADDENDUM_APPROVED`, `ADDENDUM_REJECTED`, `ADDENDUM_SUPERSEDED`, `PHASE2_CANCELLED`.

Draft edits remain audit history, not integration events. Events are transactional, append-only, uniquely tied to operation/idempotency identity, and absent on rollback.

## E12. Implementation-safe test and rollout requirements

Tests must cover valid/invalid state transitions, diagnosis immutability/versioning, exactly one revision, rejection closure, addendum correction, catalog activation/effective windows/retirement and concurrent overlap rejection, INR and rounding rules, snapshot immutability, idempotency replay/payload mismatch/resource scoping/create diagnosis/FAILED retry, approve/reject/expire/revise/cancel races, lock order, cross-order and cross-request material-link rejection, one active addendum per item, cancelled/collected item rejection, valid and invalid addendum parents, pickup-not-approval, material-use/resume/completion gates, no payment call on approval, equal/lower/positive quote-vs-final variance (including no capture and reconciliation item), DTO privacy, evidence ownership/content/dimensions, outbox cardinality/rollback, cancellation retention, V26 after V25, existing-data compatibility, BEFORE/DIAGNOSIS/AFTER photo compatibility, customer evidence scoping, enrollment persistence/stability after flag or targeting changes, unenrolled Phase 1 bypass, feature-off behavior, Phase 1 regression, frontend suites/typechecks, and disposable end-to-end certification.

Rollout remains: schema shadow with flag off, internal cohort, narrow customer category, controlled expansion, then general availability. Enrollment is persisted once per order at entry and snapshots targeting/policy; the global flag controls only new enrollment. Feature-off behavior is a release gate. Existing jobs created before enablement remain Phase 1-only unless explicitly enrolled through an audited operation. No production migration occurs before V26 PostgreSQL, forward-repair, backup, and rollback certification.

## E13. Implementation-readiness checklist

Ready for implementation review only if:

- [x] State machines are separated.
- [x] `NOT_STARTED` is derived, not persisted.
- [x] Diagnosis versioning and submitted immutability are defined.
- [x] Revision rule is enforceable in database and application logic.
- [x] Payment boundary is frozen.
- [x] V26 tables, columns, constraints, indexes, and immutable rules are defined.
- [x] Idempotency and response replay are defined.
- [x] Material request/item linkage is defined.
- [x] Completion gate runs before legacy billing.
- [x] Resume and material-use gates are defined.
- [x] Evidence ownership and customer access are defined.
- [x] Feature flag and Phase 1-only compatibility are defined.
- [x] DTO privacy is defined.
- [x] Lock order, expiry, concurrency, and outbox rules are defined.
- [x] Required tests and migration safety checks are defined.
- [x] Stable persisted enrollment, variance handling, composite material integrity, addendum parentage, resource-scoped idempotency, cancellation preservation, material-use boundary, photo-phase migration, and catalog-overlap enforcement are defined.
- [x] Repair-scope variance basis, bounded reconciliation retry, enrollment entry transaction, actual-schema material FKs, active-item uniqueness, addendum supersession, advisory catalog locking, child-line catalog invariant, outbox uniqueness, reconciliation schema/API, and Phase 1 boundary are defined.

**Engineering status:** ready for a fourth and final `plan-eng-review`; not an implementation authorization.

### Correction-pass report

- **Sections changed:** feature policy/rollout, completion variance, material/resume boundary, addendum lifecycle, evidence/photo compatibility, V26 schema, idempotency, cancellation, tests, and implementation order.
- **Enrollment model:** immutable one-per-order `phase2_enrollments`; global flag controls new enrollment only.
- **Final variance policy:** `varianceAmount = legacyRepairAmount - authorizedRepairAmount`; equal/lower allows existing completion/payment, positive blocks with `409`, no capture, and audited operations reconciliation. `finalLegacyAmount` remains an existing billing/payment value only and is never the Phase 2 repair-authorization comparison basis.
- **Material linkage enforcement:** composite same-order/same-request foreign keys plus dedicated link authorization state and partial uniqueness for one active item addendum.
- **Addendum parent model:** required `base_quote_id` to the currently applicable approved initial-scope quote; addendum corrections are separately versioned and audited.
- **Idempotency:** uniqueness is `(actor_id, operation, resource_type, resource_id, idempotency_key)`; create commands use the parent service order; `IN_PROGRESS`, `COMPLETED`, and `FAILED` behavior is explicit.
- **Cancellation:** only open/current records become `CANCELLED`; approved/rejected/expired/superseded history remains unchanged and cancellation disables future effect.
- **Material-use method:** no explicit consumption/install endpoint exists; `PlumberMaterialService.resume(jobId)` is the earliest operation enabling resumed repair, with `completeOrder()` as secondary enforcement.
- **Photo migration:** add `DIAGNOSIS` alongside `BEFORE`/`AFTER`, updating enum/check, validation, authorization, DTO/API, and customer-safe reads without changing old behavior.
- **Catalog overlap:** locked catalog-family activation with atomic overlap recheck and concurrent-activation tests.
- **Final V26 table list:** `phase2_enrollments`, `service_diagnoses`, `service_diagnosis_evidence`, `service_quotes`, `service_quote_lines`, `service_pricing_catalog`, `service_pricing_catalog_lines`, `service_quote_events`, `phase2_idempotency_keys`, `service_quote_material_links`, `phase2_reconciliations`, plus the required photo-phase compatibility/check alteration.
- **Final repair-variance formula:** `varianceAmount = legacyRepairAmount - authorizedRepairAmount`.
- **Accounting treatment:** existing platform fee, separate visit fee, and non-repair referral accounting are excluded; plumber `extraCharge` requires customer-approved scope representation for enrolled orders.
- **Reconciliation model:** bounded `phase2_reconciliations`; one open snapshot, one remaining initial revision or one genuine-material addendum correction, otherwise closure/cancellation; customer approval is mandatory.
- **Enrollment entry:** locked, idempotent create-diagnosis transaction after arrival atomically inserts the immutable enrollment snapshot and diagnosis draft.
- **Material-link strategy:** composite quote/request ownership FKs, ordinary item FK, and locked service validation through existing `product_order_items.order_id`.
- **Active-item index:** partial unique `(material_request_item_id) WHERE authorization_state IN ('PENDING','ACTIVE')`.
- **Addendum state machine:** `DRAFT`, `PUBLISHED`, `APPROVED`, `REJECTED`, `EXPIRED`, `SUPERSEDED`, `CANCELLED`; one correction replacement maximum.
- **Base quote strategy:** composite quote ownership key plus locked kind/state/same-order validation.
- **Catalog locking:** `pg_advisory_xact_lock` over normalized catalog key and uppercase currency, followed by locked overlap and active-version checks.
- **Catalog nullability:** initial/revision require catalog; null addendum catalog requires all child lines to be `MATERIAL`/`STORE` at locked publication.
- **Outbox uniqueness:** `UNIQUE (idempotency_key_id,event_type) WHERE idempotency_key_id IS NOT NULL`.
- **Outbox transition identity:** `UNIQUE (aggregate_type,aggregate_id,transition_key,event_type)` protects scheduler, supersession, and cancellation retries; request-driven idempotency uniqueness remains in force.
- **Unresolved design questions:** none from the third review. The document is ready for a fourth and final plan-eng-review, not implementation authorization.
