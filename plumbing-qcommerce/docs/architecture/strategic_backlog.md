# Strategic Development Backlog

This document represents the final backlog of **Phase 9+** features and architectural improvements to reach 100% enterprise-scale maturity.

---

## 🏗️ 1. Distributed Architecture & Consistency
- **Transactional Outbox Pattern**: Implement an outbox table in PostgreSQL to ensure that every `Order` state change is guaranteed to be published to Kafka, even during system failures.
- **Saga Pattern Orchestration**: Formalize the matching flow (Consumer Order -> Redis Scout -> Kafka Assignment -> Store Reservation) into a distributed Saga to handle rollbacks if a store is out of stock.
- **Distributed Tracing**: Integrate **OpenTelemetry** across the Java Backend, Node Edge Service, and Kafka topics for end-to-end request observability.

## 📱 2. Native Mobile & Real-time Integration
- **Direct Map Rendering**: Replace the current map mockups with live **Mapbox** or **Google Maps SDK** integration in the `customer-app` and `plumber-app`.
- **Firebase Cloud Messaging (FCM)**: Implement high-priority push notifications for job offers to the `plumber-app` (currently relies on active WebSocket/Polling).
- **Network Resiliency**: Implement an **Offline GPS Buffer** in the Plumber's mobile app to queue and retry location pings when passing through 4G dead zones.

## 🛡️ 3. Security & Global Compliance
- **Token Revocation (Blacklist)**: Implement a Redis-backed blacklist to allow instant session termination of stolen or compromised JWT tokens.
- **Data Privacy (GDPR/Data Anonymization)**: Implement logic to purge sensitive customer location data after job completion or upon user request.
- **Rate Limit Geo-Partitioning**: Scale the Redis-backed rate limiter across multiple city-shards to prevent global bottlenecks.

## 💰 4. Financial & Payment Systems
- **Payment Gateway Integration**: Full integration of **Stripe** or **Razorpay** to automate the `PAID` state transition after job completion.
- **Automatic Payout Engine**: Automate the transfer of funds (minus platform fees) from the escrow account to the Plumber's bank account via API.

---
**Current Status**: 85% Production Ready (Stable Core, Secured Gateway, Documented API).
**Next Priority**: Payment Gateway and Outbox Pattern.
