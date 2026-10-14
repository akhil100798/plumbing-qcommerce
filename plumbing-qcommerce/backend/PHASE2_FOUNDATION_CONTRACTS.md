# FixKart Phase 2 foundation contracts

This document freezes backend contracts before diagnosis and quote lifecycle work.

## Transaction claims

Idempotency claims use PostgreSQL `INSERT ... ON CONFLICT DO NOTHING`. A duplicate
claim is not treated as an exception, so the transaction remains usable for the
replay read. Quote-event claims use the same pattern. The event row is inserted
before its outbox row in the same transaction.

## Outbox delivery

`OutboxPoller` selects unprocessed rows ordered by creation time. It marks a row
processed only after Kafka acknowledges the send. Failed sends remain unprocessed
and are retried on a later poll. There is no claim/lease or `FOR UPDATE SKIP
LOCKED`, so multiple poller instances can select the same row. Delivery is
therefore at-least-once and external duplicate delivery is possible. Phase 2
prevents duplicate dispatch rows through `service_quote_events`; it does not
claim exactly-once Kafka delivery.

## Customer diagnosis evidence

Customer access requires the authenticated user to be the owning customer of the
service order. Only photos whose phase is `DIAGNOSIS` may be returned. Storage
keys are never part of the response. Binary reads must use the customer-safe
service boundary and repeat the same ownership, diagnosis, and order checks.
Plumber `BEFORE` and `AFTER` access remains on the existing assigned-plumber
boundary.

## Lock order

Phase 2 command flows must acquire locks in this order:

`idempotency -> service_order -> phase2 resource -> product_order -> product_order_item -> stock/reservation`

Existing Phase 1 material paths may acquire stock/reservation locks without a
service-order lock. They are not reused as Phase 2 command implementations until
their lock order is reviewed.

## Billing

`visitFee` is informational in legacy preview only. It is excluded from
`legacyRepairAmount` and `finalLegacyAmount`, matching frozen Phase 1 completion
behavior.
