# Release-blocker root-cause analysis

## LOCAL-CUSTOMER-OTP-001 — ten-digit OTP login rejected

### Symptom and runtime evidence

The Customer login screen presents a fixed `+91` prefix and accepts a ten-digit
number.  The captured local request with the seeded Customer value returned HTTP
400 before OTP generation.  See the immutable QA evidence in
`../local-retest-20260913-2253/logs/customer-local-env-recheck-continuation.json`.

### Call path and persisted state

`LoginScreen` validates and passes ten digits to `AuthProvider.loginWithPhone`.
`authService` posts those digits to `/api/v1/auth/send-otp`.  `OtpRequest`
rejected the request because it required `+91 ` followed by ten digits.  The
controller and `OtpService` were therefore never reached.  The staging QA
seeder, existing `User.phone` values, and `UserRepository.findByPhone` use ten
digits, so prepending a prefix in one screen would have created a second mismatch
at verification and user lookup.

### Exact root cause

The application had no defined conversion boundary between user-facing Indian
phone notation and the domain identifier.  The customer client and stored users
use the ten-digit identifier; the OTP DTO enforced a different presentation
format.  OTP-store keys and HMAC inputs also used whatever representation the
caller supplied, making equivalent input forms non-equivalent.

### Options considered and chosen solution

Changing only the Customer screen was rejected because it leaves other clients
and existing stored users inconsistent.  Broadly accepting arbitrary digit
strings was rejected because it weakens input validation.  The chosen solution
accepts the supported Indian representations (ten digits, `+91` with optional
single space), validates them at the request boundary, and normalizes them once
to the deterministic ten-digit domain value before the OTP service, repository,
and token flow run.  This preserves existing users and makes rate limits,
locks, OTP hashes, and lookup use one key.

### Regression risk and required proof

Tests must cover accepted representations and malformed values, prove that
normalization reaches the OTP service and existing-user lookup, and preserve
the normal OTP security controls.  Runtime retest must use the real Customer
browser and backend OTP capture; no injected token or fake OTP is permitted.

## LOCAL-PLUMBER-START-001 — materials path does not persist work start

### Symptom and runtime evidence

After accept, arrival, diagnosis, and **Materials Required**, the previous QA
run observed a local UI transition but the service order remained `ACCEPTED`.
The subsequent real material submission returned HTTP 409.  The recorded
evidence is `../local-retest-20260913-2253/logs/material-api-continuation.json`.

### Call path and persisted state

`StartWorkScreen.handleStartWorkDirect` calls `jobService.startWork`, which
issues `PATCH /orders/{id}/start`.  `ServiceOrderController` delegates to
`ServiceOrderService.startOrder`, which records history and persists
`IN_PROGRESS`.  `PlumberMaterialService.createMaterialRequest` deliberately
requires `IN_PROGRESS` or `WORK_RESUMED` and then persists
`MATERIALS_REQUIRED` atomically with the request.  In contrast,
`handleMaterialsRequired` only dispatched Redux state and navigated to store
selection; it made no network request and did not require the diagnosis
checklist.

### Exact root cause

Two visually similar decisions had different state ownership.  Direct work
used the backend transition, while the materials decision treated a local Redux
timeline entry as if it represented that transition.  The backend correctly
rejected the resulting invalid state; the fault is the client bypass.

### Options considered and chosen solution

Weakening the material service precondition was rejected because it would allow
invalid state transitions from any client.  Pretending that navigation started
work was rejected because refresh loses that assertion.  The chosen solution
uses the existing persisted `startWork` operation for both decisions, waits for
its response before updating Redux or navigating, requires the completed
diagnosis for both paths, and disables duplicate requests while it is pending.

### Regression risk and required proof

The client must retain a retryable screen and show the server failure if start
fails.  Targeted browser retest must show the start request, an `IN_PROGRESS`
read-back, successful material creation through the UI, and persistence across
refresh without an API rescue call.

## LOCAL-PLUMBER-PHOTO-001 — required after photos have no upload contract

### Symptom, path, and persisted state

`AfterPhotosScreen` and `BeforePhotosScreen` allocate only in-memory URI arrays
and their add action always presents an unavailable alert.  The old controller
photo routes return success without accepting a file, validating ownership, or
persisting metadata.  `ServiceOrder` has no photo relationship.  Consequently
the required count can never be met and a page refresh would discard any future
client-only URI.

### Chosen solution

Add the Expo image picker used by the current Expo runtime and upload selected
images as multipart form data.  The backend stores only validated image bytes
under generated server-side names and persists metadata linked to the order and
before/after phase.  Listing and downloading remain assigned-plumber-only.  A
photo screen loads persisted metadata, shows real previews, and enables Next
only after the required uploads succeed.  Placeholder URIs and metadata-only
success responses are rejected.

## LOCAL-CUSTOMER-CATALOG-001 — failed inventory request becomes sellable fixtures

`CatalogService` caught product and category transport failures and returned
`src/data` fixture products. Home then rendered those fixture products with
cart controls. The chosen fix lets live inventory failures propagate, clears
the product/category lists, and shows a retryable unavailable state. Curated
service content remains separate because it does not claim stock availability.
