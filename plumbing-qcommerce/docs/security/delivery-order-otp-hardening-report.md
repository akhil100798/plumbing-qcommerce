# Delivery and Order OTP Hardening Report

This report documents the security audit and hardening of the delivery and order verification OTP flows in PlumbCommerce.

## 1. Vulnerability Analysis & Findings

Prior to this phase, the delivery OTP flow had several severe security vulnerabilities:
- **Insecure OTP Generation**: Used `java.util.Random` in the backend and `Math.random` in the edge-service. These are not cryptographically secure and are susceptible to seed prediction attacks.
- **Weak Plaintext Storage**: Plaintext OTP codes were stored in the database (`delivery_otp` column on `ProductOrder`) and returned in public API responses (`OrderDetailResponse`), allowing anyone with read access to intercept them.
- **Log Exposure**: Plaintext OTPs were logged in standard stdout logs and sent via unredacted Kafka message payloads.
- **Lack of Verification Protections**: There was no rate limiting, lockout mechanism, attempt limit, or resend cooldown on delivery OTPs.
- **Weak OTP Length**: 4-digit codes were used, which are significantly easier to brute force than 6-digit codes.
- **Insecure API Design**: Verification endpoints received OTPs as query parameters, which are susceptible to leaks in access logs, proxies, and browser histories.

## 2. Implemented Controls

We designed and implemented a secure, decoupled verification architecture:

### A. Cryptographically Secure Generation & Length
- Refactored backend OTP generation to use `java.security.SecureRandom` to generate a 6-digit code.
- Refactored edge-service to call the Spring Boot backend securely to generate/verify OTPs, eliminating duplicate code and moving security logic to the backend.

### B. Context-Bound Hashing (HMAC-SHA256)
- Cleaned up the database from storing plaintext verification secrets.
- Implemented `DeliveryOtpService` using Redis-backed storage:
  - Computed hashes using HMAC-SHA256 bound to: `orderId` + `deliveryPartnerId` + `hashSecret`.
  - Stored computed hashes in Redis under: `delivery-otp:{orderId}:{deliveryPartnerId}:hash`.

### C. Rate Limiting and Lockout Controls
- **Expiry**: Set a 15-minute TTL on the OTP hash key in Redis.
- **Attempts Limit**: Implemented a maximum of 5 verification attempts. If exceeded, the OTP state is deleted, locking verification.
- **Cooldown**: Enforced a 60-second resend cooldown via `delivery-otp:{orderId}:{deliveryPartnerId}:cooldown`.
- **Replay Protection**: Immediately deleted verification state upon successful verify call.

### D. Leak Prevention
- Redacted OTP values from all stdout/logger calls.
- Redacted OTP values from Kafka `DELIVERY_ASSIGNED` outbox event payloads.
- Omitted/masked the OTP in DTO responses (`OrderDetailResponse` and `OrderDetailDTO`).
- Modified the verification API to accept the OTP in a JSON request body instead of a query parameter.
