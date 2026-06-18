# PlumbCommerce Local Production-Readiness Design

**Date:** 2026-06-18
**Status:** Approved for implementation planning

## Objective

Turn the current PlumbCommerce early-alpha repository into a secure, reliable, locally deployable application that can be exercised end to end through clean role-based user interfaces before any cloud-production rollout.

The local acceptance environment will use Docker Compose and deterministic simulators for payments, maps, routing, and external notifications. Production-provider integration and cloud deployment are outside this implementation cycle.

## Delivery Strategy

Use a phased repair of the existing architecture. Each phase must leave a working, testable vertical slice and must pass its own release gate before the next phase begins.

1. Establish reproducible Docker startup, test harnesses, health checks, and seeded users.
2. Correct authentication, authorization, data exposure, and dependency vulnerabilities.
3. Deliver a complete nearby-plumber workflow across customer UI, edge service, plumber UI, backend, Kafka, and databases.
4. Complete customer, plumber, store-manager, and admin workflows.
5. Harden event delivery, concurrency, observability, failure handling, and operational tooling.
6. Run automated and manual UI acceptance gates and resolve all release-blocking defects.

## System Architecture

The existing service boundaries remain:

- **Spring Boot core:** authoritative source for identity, roles, stores, orders, pricing, payment simulation, state transitions, and audit history.
- **Node.js edge gateway:** authenticated realtime connections, Redis GEO routing, rate limiting, and Kafka-to-WebSocket delivery.
- **PostgreSQL:** transactional users, stores, orders, payments, audit state, and outbox records.
- **MongoDB:** detailed service logs and flexible work evidence.
- **Redis:** ephemeral plumber location, rate-limit state, revoked tokens, and short-lived coordination state.
- **Kafka:** versioned domain-event transport between durable state changes and realtime projections.
- **Next.js admin/store portal:** operational interfaces for administrators and store managers.
- **Expo customer and plumber clients:** role-specific workflows, exposed through Expo web for local browser acceptance and compatible with device builds.

Docker Compose will start infrastructure and application containers with health checks, dependency readiness, persistent volumes, and environment-driven configuration. A single documented command will start the system and seed deterministic local accounts and data.

## Identity And Authorization

Public registration creates `CUSTOMER` accounts only. Admin, store-manager, and plumber accounts are provisioned by authenticated administrators or the local seed process.

All REST inputs use validated request DTOs and outputs use response DTOs. Persistence entities are not serialized directly. Password hashes and internal fields never appear in API responses or logs.

Spring method security is enabled. Every operation enforces both role and resource ownership:

- Customers can create and view their own orders, cancel only permitted states, and pay only their own completed orders.
- Plumbers can see eligible offers and mutate only orders assigned to them.
- Store managers can administer only their stores, inventory, and assigned work.
- Administrators can perform explicitly defined cross-tenant operations with audit records.

The authenticated principal is the source of acting identity. Caller-supplied customer, plumber, manager, or room IDs are rejected or ignored where identity can be derived.

Socket.IO authenticates with the same JWT contract. Room membership and GPS updates are derived from JWT subject and role. Reconnection reauthenticates and restores only authorized subscriptions.

JWT logout uses remaining token lifetime for revocation. Privileged authorization fails closed when revocation state cannot be checked. CORS, Swagger exposure, secrets, logging levels, and environment defaults are profile-specific.

## Order And Realtime Flow

The first completed vertical slice is nearby assignment:

1. A customer authenticates and creates a durable `PENDING` order in Spring Boot.
2. The order and `ORDER_CREATED` outbox record commit atomically.
3. The edge service receives the versioned event and finds eligible online plumbers in Redis.
4. Authorized plumber rooms receive an offer containing the durable order ID.
5. A plumber accepts through the backend using optimistic locking or an atomic conditional update.
6. Exactly one plumber wins; competing acceptances receive a conflict response.
7. An acknowledged outbox event announces assignment and updates the customer UI.
8. The assigned plumber starts and completes work, records parts and evidence, and produces an invoice.
9. The customer completes a deterministic simulated payment and can view order history.

All state transitions are audited with actor, timestamp, previous state, new state, and correlation ID.

## Event Reliability

Outbox records contain structured versioned JSON, event ID, aggregate ID, event type, topic, creation time, attempt count, next-attempt time, processing status, and last error.

An event is marked published only after Kafka acknowledges delivery. Multi-instance polling uses row claiming or database locking. Publication retries use bounded exponential backoff and eventually move failed events to a visible dead-letter state.

Consumers are idempotent by event ID. Invalid events are rejected with actionable diagnostics. Kafka headers carry correlation and causation IDs. Replay does not duplicate user-visible state changes.

## Local Simulators

### Payment

The payment simulator persists attempts and supports deterministic scenarios selected by documented test payment methods:

- successful capture;
- decline;
- duplicate idempotency request;
- refund;
- delayed webhook-like completion.

It validates currency and amount against the server-calculated invoice. UI and APIs label these transactions as simulated local payments.

### Map And Routing

The map simulator renders deterministic coordinates, plumber movement, route line, distance, and ETA without external keys. Test scenarios can place plumbers inside or outside the service radius and simulate movement or loss of location updates.

## User Interfaces

All clients use environment-based API and WebSocket URLs and a shared API contract. No fixed user IDs, fixed coordinates, WIP alerts, inert controls, or hardcoded localhost assumptions remain.

### Customer

- Register, login, logout, and session restoration.
- Create nearby, store-based, and direct-plumber requests.
- See search, offer, assignment, arrival, work, invoice, payment, cancellation, history, and feedback states.
- View the local map simulator with route and ETA.
- Receive realtime updates and recover after reconnect.

### Plumber

- Login, profile, verification status, and availability.
- Foreground location publishing with an offline/retry queue for local acceptance.
- Receive, accept, and decline offers.
- View simulated navigation and perform arrive, start, complete, parts, and service-log actions.
- View completed work and simulated earnings.

### Admin And Store Manager

- Login, role-aware navigation, and protected routes.
- Manage authorized users, plumbers, stores, inventory, orders, and payment simulations.
- Operate live jobs and assignment actions through real APIs.
- View real metrics, dependency health, outbox/dead-letter status, and audit records.
- Filter, paginate, retry, and export supported operational data.

Every screen includes accessible loading, empty, validation, offline, reconnect, unauthorized, forbidden, conflict, and server-error states. Controls perform real operations and prevent accidental duplicate submission.

## Error Handling And Observability

REST errors use a consistent structure with stable error code, message, field errors, timestamp, path, and correlation ID. Authentication failures do not reveal whether an account exists.

Services apply explicit connection and request timeouts, bounded retries, and graceful shutdown. Health endpoints distinguish liveness from readiness and expose dependency status without leaking secrets.

OpenTelemetry-compatible correlation IDs propagate through HTTP, Kafka headers, background jobs, and edge logs. Local logs are structured and use appropriate levels. The admin UI displays actionable operational state for manual testing.

## Testing Strategy

Changes follow test-driven development. A behavior test must fail for the intended reason before production code is changed.

### Backend

- Unit tests for validation, pricing, state transitions, payment simulation, and event serialization.
- Spring Security integration tests for every role, ownership boundary, and anonymous request.
- Repository and Testcontainers tests against PostgreSQL, MongoDB, Redis, and Kafka.
- Concurrency tests proving one-winner order acceptance and idempotent payment/outbox behavior.

### Edge

- Unit tests for JWT identity binding, payload validation, geo selection, and event parsing.
- Integration tests with Redis and Kafka for room isolation, rate limiting, reconnect, retry, and dependency failure.

### UI

- Component tests for forms, loading/error states, and role guards.
- Playwright workflows for customer, plumber, manager, and administrator roles.
- Desktop and mobile-width screenshot checks for clipping, overlap, contrast, and responsiveness.
- Browser console and network checks with no unexpected errors or failed requests.

### Release Gate

Local acceptance requires:

- all builds, linters, type checks, unit tests, integration tests, and E2E tests passing;
- healthy Docker services and application readiness endpoints;
- no unaccepted critical or high production dependency advisories;
- complete automated customer-to-plumber-to-payment workflow;
- successful manual checklist for all roles;
- no known release-blocking security, correctness, data-loss, or UI defects.

## Deliverables

- Hardened backend and edge services.
- Completed role-based web/mobile UI workflows.
- Docker Compose local acceptance environment with seeds and health checks.
- Automated test suites and one-command verification.
- Local test credentials and manual acceptance checklist.
- Updated architecture, API, operations, and startup documentation.
- A final verification report containing command evidence and any explicitly accepted residual risks.

## Out Of Scope

- Cloud deployment and cloud-specific infrastructure.
- Live payment-provider settlement or plumber bank payouts.
- Paid map-provider integration.
- App Store or Play Store release automation.
- Formal external certification or penetration-test attestation.

These items may begin only after the local release gate passes.
