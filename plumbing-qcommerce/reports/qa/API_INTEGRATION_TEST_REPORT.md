# API Contract, Integration & WebSocket Test Report

**Target Platform**: FixKart Quick-Commerce Plumbing Platform  
**Subsystems Audited**: Core Backend Engine (`plumbing-qcommerce/backend` — Spring Boot 4 / Java 17) & Edge Service Gateway (`plumbing-qcommerce/edge-service` — Node.js / Express / Socket.io / Redis / Kafka)  
**QA Specialist Role**: API Contract, Integration & WebSocket QA Specialist (`qa_api_integration_1`)  
**Audit Date**: 2026-11-03  
**Status**: Comprehensive Assessment Completed (Zero Application Source Code Modifications)

---

## 1. Executive Summary

This diagnostic assessment evaluated the entire REST API and WebSocket communication surface of the FixKart quick-commerce plumbing platform. The scope encompassed all **41 Spring Boot REST controllers**, Edge Service proxy and metric routes, security filters, global exception handlers, JSON serialization contracts, DTO Bean Validations, and the Socket.io WebSocket gateway.

### High-Level Audit Findings
1. **Critical Error-Handling & Status Code Conformance Failures**:
   - `GlobalExceptionHandler` erroneously maps **all unhandled `RuntimeException` instances directly to HTTP 404 Not Found**. When null-pointer exceptions, state-transition violations, or Spring `HttpMessageNotReadableException` (malformed JSON payloads) occur, the API returns a 404 Not Found rather than 400 Bad Request or 500 Internal Server Error, concealing systemic bugs and violating HTTP specifications.
   - Standard Spring MVC servlet exceptions (e.g. `MissingServletRequestParameterException`, `HttpRequestMethodNotSupportedException`) fall through to a catch-all `Exception` handler, returning **HTTP 500 Internal Server Error** instead of HTTP 400 or 405.
   - Resource creation endpoints across multiple services return HTTP 200 OK rather than **HTTP 201 Created**, while deletion endpoints return HTTP 200 OK with empty bodies instead of **HTTP 204 No Content**.

2. **Severe Security Filter Blocking**:
   - The Spring Security configuration explicitly declares `.requestMatchers("/api/v1/delivery/**").denyAll()`. Every delivery partner and store handover endpoint under `/api/v1/delivery/*` is unconditionally blocked with **HTTP 403 Forbidden**, completely severing Edge Gateway delivery proxies and mobile delivery partner workflows.

3. **Inconsistent Error Envelopes & Data Contracts**:
   - While an official `ApiError` record (`timestamp`, `status`, `code`, `message`, `path`, `correlationId`, `details`) is defined, only `AccessDeniedException` utilizes it. All other exception handlers return an unstructured `Map<String, Object>`.
   - Endpoints such as `/api/v1/auth/logout`, `/api/v1/checkout/confirm/{orderId}`, and `/api/v1/checkout/release/{orderId}` return raw plain-text (`text/plain`) strings rather than structured JSON objects.
   - The OTP verification endpoint (`/api/v1/auth/verify-otp`) returns an ad-hoc map missing critical properties (`accessToken`, `fullName`, `phone`, `user` object) present in standard `AuthResponse` models.

4. **Insecure Direct Object Reference (IDOR) & Broken Object-Level Authorization**:
   - Critical checkout lifecycle operations (`POST /api/v1/checkout/confirm/{orderId}` and `POST /api/v1/checkout/release/{orderId}`) lack `@PreAuthorize` authorization annotations and user ownership checks. Any authenticated caller can manipulate financial confirmation or release stock reservations for any arbitrary order.
   - Unrestricted wallet top-up (`POST /api/v1/wallet/topup?amount=...`) allows arbitrary balance creation with zero payment validation or role enforcement.

5. **WebSocket Gateway Discrepancies & Orphaned Events**:
   - The Socket.io Edge Gateway implements room registrations only for `plumber_{id}`, `customer_{id}`, `delivery_{id}`, and `store_{id}`. It completely lacks room join handlers for `order_{id}`, `service_{id}`, and `admin`.
   - When the Kafka consumer receives a confirmed material order and broadcasts `PARTS_EN_ROUTE` to `service_${data.serviceOrderId}`, **no socket can ever join this room**, resulting in silent event loss.
   - Contractual events specified in platform documentation (`plumber:location_update`, `order:status_changed`, `inventory:reserved`, `inventory:released`, `payment:confirmed`) are not emitted by Edge Gateway; the service instead listens to custom events like `location_ping`.

---

## 2. Complete API Endpoint Inventory & Status Matrix

The following matrix documents all audited REST endpoints across the Backend and Edge Gateway.

| Endpoint | HTTP Method | Auth Required | Request DTO / Schema | Status Code Conformance | Result |
|---|---|---|---|---|---|
| `/api/v1/auth/register` | `POST` | Public | `CustomerRegistrationRequest` (`@Valid`) | 201 Created / 400 / 409 | **PASS** |
| `/api/v1/auth/register/plumber` | `POST` | Public | `CustomerRegistrationRequest` (`@Valid`) | 201 Created / 400 / 409 | **PASS** |
| `/api/v1/auth/register/store` | `POST` | Public | `StoreRegistrationRequest` (`@Valid`) | 201 Created / 400 / 409 | **PASS** |
| `/api/v1/auth/login` | `POST` | Public | `Map<String, String>` (Untyped Map) | 200 OK / 400 / 401 | **WARN** (Untyped Map payload) |
| `/api/v1/auth/refresh` | `POST` | Public | `Map<String, String>` (Untyped Map) | 200 OK / 400 / 401 | **WARN** (Untyped Map payload) |
| `/api/v1/auth/logout` | `POST` | Bearer Token | Header Bearer JWT | 200 OK / 400 / 500 (`text/plain`) | **FAIL** (Returns text/plain, not JSON) |
| `/api/v1/auth/send-otp` | `POST` | Public | `OtpRequest` (`@Valid`) | 200 OK / 400 | **PASS** |
| `/api/v1/auth/verify-otp` | `POST` | Public | `OtpRequest` (`@Valid`) | 200 OK / 400 | **FAIL** (Contract mismatch with AuthResponse) |
| `/api/v1/auth/google/customer` | `POST` | Public | `GoogleCustomerAuthRequest` | 200 OK / 400 / 401 / 403 | **PASS** |
| `/api/v1/auth/me` | `GET` | Authenticated | None | 200 OK / 401 | **PASS** |
| `/api/v1/users/me` | `GET` | Authenticated | None | 200 OK / 401 | **PASS** |
| `/api/v1/users/me/availability` | `POST` | `PLUMBER` | `AvailabilityRequest` | 200 OK / 403 | **PASS** |
| `/api/v1/users/me/addresses` | `GET` | Authenticated | None | 200 OK / 401 | **PASS** |
| `/api/v1/users/me/addresses` | `POST` | Authenticated | `UserAddress` (JPA Entity directly) | 200 OK / 404 (NPE mapped to 404) | **FAIL** (Mass assignment, NPE returns 404) |
| `/api/v1/users/me/addresses/{id}` | `DELETE` | Authenticated | None | 200 OK (Empty body) | **WARN** (Expected 204 No Content) |
| `/api/v1/customers/me/profile-completion` | `PUT` | `CUSTOMER` | `CustomerProfileCompletionRequest` | 200 OK / 403 | **WARN** (Returns JPA User entity directly) |
| `/api/v1/users` | `POST` | `ADMIN`, `SUPER_ADMIN` | `User` (JPA Entity directly) | 200 OK / 403 | **WARN** (Returns JPA User entity directly) |
| `/api/v1/users/{email}` | `GET` | `ADMIN`, `SUPER_ADMIN` | Path variable (Email) | 200 OK / 403 / 404 | **WARN** (Dot truncation risk in Spring MVC) |
| `/api/v1/users` | `GET` | `ADMIN`, `SUPER_ADMIN` | None | 200 OK / 403 | **PASS** |
| `/api/v1/orders` | `POST` | `CUSTOMER` | `CreateOrderRequest` | 200 OK (Expected 201 Created) | **FAIL** (Returns 200 instead of 201 Created) |
| `/api/v1/orders/{id}/accept` | `POST`/`PATCH` | `PLUMBER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{id}/reject` | `POST`/`PATCH` | `PLUMBER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{id}/arrive` | `POST`/`PATCH` | Assigned `PLUMBER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{id}/start-navigation` | `POST`/`PATCH` | Assigned `PLUMBER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{id}/start` | `POST`/`PATCH` | Assigned `PLUMBER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{id}/photos/before` | `POST` | Assigned `PLUMBER` | `MultipartFile` (`file`) | 200 OK / 403 / 400 | **PASS** |
| `/api/v1/orders/{id}/photos/after` | `POST` | Assigned `PLUMBER` | `MultipartFile` (`file`) | 200 OK / 403 / 400 | **PASS** |
| `/api/v1/orders/{id}/photos/{phase}` | `GET` | Assigned `PLUMBER` | Path enum (`ServiceOrderPhotoPhase`) | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{id}/photos/{photoId}/file` | `GET` | Assigned `PLUMBER` | Path variables | 200 OK (Binary stream) | **PASS** |
| `/api/v1/orders/plumber/history` | `GET` | `PLUMBER` | None | 200 OK / 403 | **PASS** |
| `/api/v1/orders/plumber/jobs/offers` | `GET` | `PLUMBER` | None | 200 OK / 403 | **PASS** |
| `/api/v1/orders/{id}/assignment-history` | `GET` | Authorized Reader | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{id}/complete` | `POST`/`PATCH` | Assigned `PLUMBER` | Query param `partsCharge` | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{id}/confirm` | `POST`/`PATCH` | `CUSTOMER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{id}/rating` | `POST` | `CUSTOMER` | `RatingRequest` | 200 OK / 403 / 400 | **PASS** |
| `/api/v1/orders/{id}/rating` | `GET` | Authenticated | None | 200 OK / 404 | **PASS** |
| `/api/v1/orders/{id}/history` | `GET` | Authenticated | None | 200 OK / 404 | **PASS** |
| `/api/v1/orders/{id}/cancel` | `PATCH` | Authorized Canceller | Query param `reason` | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/customer/{customerId}` | `GET` | Authorized Customer | None | 200 OK / 403 | **PASS** |
| `/api/v1/orders/plumber` | `GET` | `PLUMBER` | None | 200 OK / 403 | **PASS** |
| `/api/v1/orders/status/{status}` | `GET` | `PLUMBER`, `STORE_MANAGER`, `ADMIN` | Path variable `status` | 200 OK / 400 (Leaks internal Enum pkg) | **WARN** (Enum parse failure leaks Java pkg) |
| `/api/v1/orders/{id}` | `GET` | Authorized Reader | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/checkout/reserve` | `POST` | Authenticated | `CheckoutRequest` (`@Valid`) | 200 OK / 400 / 404 | **WARN** (Directly returns JPA entity) |
| `/api/v1/checkout/confirm/{orderId}` | `POST` | Authenticated | None | 200 OK (`text/plain`) | **FAIL** (Missing @PreAuthorize IDOR, text/plain) |
| `/api/v1/checkout/release/{orderId}` | `POST` | Authenticated | None | 200 OK (`text/plain`) | **FAIL** (Missing @PreAuthorize IDOR, text/plain) |
| `/api/v1/checkout/orders/status/{status}` | `GET` | `STORE_MANAGER`, `ADMIN` | Path variable `ProductOrderStatus` | 200 OK / 403 | **PASS** |
| `/api/v1/checkout/orders/{id}` | `GET` | Authenticated | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/checkout/orders` | `GET` | Authenticated | None | 200 OK / 401 | **PASS** |
| `/api/v1/checkout/material-requests/customer` | `GET` | `CUSTOMER` | None | 200 OK / 403 | **PASS** |
| `/api/v1/checkout/material-requests/plumber` | `GET` | `PLUMBER` | None | 200 OK / 403 | **PASS** |
| `/api/v1/checkout/material-requests/store` | `GET` | `STORE_MANAGER`, `ADMIN` | None | 200 OK / 403 | **PASS** |
| `/api/v1/checkout/orders/{id}/accept` | `PATCH` | `STORE_MANAGER`, `ADMIN` | `OrderActionRequest` (`@Valid`) | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/checkout/orders/{id}/pack` | `PATCH` | `STORE_MANAGER`, `ADMIN` | `PackOrderRequest` (`@Valid`) | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/checkout/orders/{id}/handover` | `POST` | `STORE_MANAGER`, `ADMIN` | `HandoverRequest` (`@Valid`) | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/stores` | `POST` | `STORE_MANAGER`, `ADMIN` | `Store` (JPA Entity directly) | 200 OK (Expected 201 Created) | **FAIL** (Mass assignment, 200 instead of 201) |
| `/api/v1/stores/{storeId}/inventory/{productId}` | `PUT` | `STORE_MANAGER`, `ADMIN` | `StockUpdateRequest` (`@Valid`) | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/stores/{storeId}/inventory/{productId}/threshold` | `PATCH` | `STORE_MANAGER`, `ADMIN` | `Map<String, Integer>` | 200 OK / 403 / 404 | **WARN** (Untyped Map payload) |
| `/api/v1/stores/me/inventory` | `POST` | `STORE_MANAGER`, `ADMIN` | `AddCatalogProductRequest` (Unvalidated record) | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/stores` | `GET` | Authenticated | None | 200 OK / 401 | **PASS** |
| `/api/v1/stores/me` | `GET` | `STORE_MANAGER`, `ADMIN` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/stores/me` | `PUT` | `STORE_MANAGER`, `ADMIN` | `Store` (JPA Entity directly) | 200 OK / 403 | **WARN** (Direct entity payload) |
| `/api/v1/stores/me/business-hours` | `GET` | `STORE_MANAGER`, `ADMIN` | None | 200 OK / 403 | **PASS** |
| `/api/v1/stores/me/business-hours` | `PUT` | `STORE_MANAGER`, `ADMIN` | `List<StoreBusinessHours>` (Entities directly) | 200 OK / 403 | **WARN** (Direct entity list payload) |
| `/api/v1/stores/me/reports/monthly` | `GET` | `STORE_MANAGER`, `ADMIN` | Query params `year`, `month` | 200 OK / 403 | **PASS** |
| `/api/v1/stores/me/reports/monthly/pdf` | `GET` | `STORE_MANAGER`, `ADMIN` | Query params `year`, `month` | 200 OK (`application/pdf`) | **PASS** |
| `/api/v1/stores/{id}` | `GET` | Authenticated | None | 200 OK / 404 | **PASS** |
| `/api/v1/stores/me/inventory` | `GET` | `STORE_MANAGER`, `ADMIN` | None | 200 OK / 403 | **PASS** |
| `/api/v1/stores/{id}/inventory` | `GET` | Authenticated | None | 200 OK / 404 | **PASS** |
| `/api/v1/stores/nearby` | `GET` | Authenticated | Query params `lat`, `lng` | 200 OK / 400 | **WARN** (No bounds validation on coordinates) |
| `/api/v1/catalog/categories` | `GET` | Public | None | 200 OK | **PASS** |
| `/api/v1/catalog/products` | `GET` | Public | Query param `categoryId` | 200 OK | **PASS** |
| `/api/v1/catalog/products/{id}` | `GET` | Public | None | 200 OK / 404 | **PASS** |
| `/api/v1/catalog/search` | `GET` | Public | Query param `q` | 200 OK / 500 (Missing param throws 500) | **FAIL** (Missing 'q' returns 500, not 400) |
| `/api/v1/plumber/dashboard` | `GET` | `PLUMBER` | None | 200 OK / 403 | **PASS** |
| `/api/v1/plumber/earnings` | `GET` | `PLUMBER` | None | 200 OK / 403 | **PASS** |
| `/api/v1/plumber/profile` | `GET` | `PLUMBER` | None | 200 OK / 403 | **PASS** |
| `/api/v1/plumber/kyc` | `GET` | `PLUMBER` | None | 200 OK / 403 | **PASS** |
| `/api/v1/plumber/kyc` | `POST` | `PLUMBER` | `PlumberKycSubmissionRequest` (`@Valid`) | 201 Created / 409 Conflict | **PASS** |
| `/api/v1/plumber/orders/{orderId}/material-request` | `GET` | `PLUMBER` | None | 200 OK / 403 | **PASS** |
| `/api/v1/plumber/material-requests/{requestId}/tracking` | `GET` | `PLUMBER` | None | 200 OK (Hardcoded static dummy data) | **FAIL** (Fake dummy endpoint implementation) |
| `/api/v1/delivery/available` | `GET` | `DELIVERY_PARTNER` | None | 403 Forbidden (Blocked by SecurityConfig) | **FAIL** (Hard-blocked by denyAll() rule) |
| `/api/v1/delivery/{orderId}/accept` | `PATCH` | `DELIVERY_PARTNER` | Query param `otp` | 403 Forbidden (Blocked by SecurityConfig) | **FAIL** (Hard-blocked by denyAll() rule) |
| `/api/v1/delivery/{orderId}/confirm-otp` | `POST` | `CUSTOMER` | `OtpRequest` | 403 Forbidden (Blocked by SecurityConfig) | **FAIL** (Hard-blocked by denyAll() rule) |
| `/api/v1/delivery/{orderId}/otp/generate` | `POST` | `STORE_MANAGER`, `ADMIN` | None | 403 Forbidden (Blocked by SecurityConfig) | **FAIL** (Hard-blocked by denyAll() rule) |
| `/api/v1/delivery/{orderId}/verify-otp` | `POST` | `DELIVERY_PARTNER`, `ADMIN` | `OtpRequest` | 403 Forbidden (Blocked by SecurityConfig) | **FAIL** (Hard-blocked by denyAll() rule) |
| `/api/v1/delivery/{orderId}/status` | `GET` | Authenticated | None | 403 Forbidden (Blocked by SecurityConfig) | **FAIL** (Hard-blocked by denyAll() rule) |
| `/api/v1/delivery/partners` | `GET` | `STORE_MANAGER`, `ADMIN` | None | 403 Forbidden (Blocked by SecurityConfig) | **FAIL** (Hard-blocked by denyAll() rule) |
| `/api/v1/delivery/{orderId}/assign` | `POST` | `STORE_MANAGER`, `ADMIN` | Query param `partnerId` | 403 Forbidden (Blocked by SecurityConfig) | **FAIL** (Hard-blocked by denyAll() rule) |
| `/api/v1/payments/initiate` | `POST` | `CUSTOMER` | `PaymentRequest` | 200 OK / 400 / 403 / 409 | **PASS** |
| `/api/v1/payments/process` | `POST` | `CUSTOMER` | `PaymentRequest` | 200 OK / 400 / 409 | **PASS** |
| `/api/v1/payments/webhook` | `POST` | Public | Header `X-Razorpay-Signature`, raw String | 200 OK / 400 | **PASS** |
| `/api/v1/admin/finance/dashboard` | `GET` | Finance Admins | None | 200 OK / 403 | **PASS** |
| `/api/v1/admin/finance/payments` | `GET` | Finance Admins | Query params (Filter & Page) | 200 OK / 403 | **PASS** |
| `/api/v1/admin/finance/payments/{id}` | `GET` | Finance Admins | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/finance/settlements/stores` | `GET` | Finance Admins | Query params | 200 OK / 403 | **PASS** |
| `/api/v1/admin/finance/payouts/plumbers` | `GET` | Finance Admins | Query params | 200 OK / 403 | **PASS** |
| `/api/v1/admin/finance/payouts/delivery-partners` | `GET` | Finance Admins | Query params | 200 OK / 403 | **PASS** |
| `/api/v1/admin/finance/refunds` | `GET` | Finance Admins | Query params | 200 OK / 403 | **PASS** |
| `/api/v1/admin/finance/refunds/{refundId}/approve` | `PATCH` | Finance Admins | `RefundActionRequest` (Unvalidated) | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/finance/refunds/{refundId}/reject` | `PATCH` | Finance Admins | `RefundActionRequest` (Unvalidated) | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/finance/commission-report` | `GET` | Finance Admins | Query params `fromDate`, `toDate` | 200 OK / 403 | **PASS** |
| `/api/v1/wallet` | `GET` | Authenticated | None | 200 OK / 401 | **PASS** |
| `/api/v1/wallet/topup` | `POST` | Authenticated | Query param `amount` | 200 OK / 400 | **FAIL** (Unrestricted balance topup without payment gate) |
| `/api/v1/wallet/pay` | `POST` | Authenticated | Query params `amount`, `description` | 200 OK / 404 (IllegalState returns 404) | **FAIL** (Insufficient balance returns 404, not 400/422) |
| `/api/v1/wallet/transactions` | `GET` | Authenticated | None | 200 OK / 401 | **PASS** |
| `/api/v1/notifications` | `GET` | Authenticated | None | 200 OK / 401 | **PASS** |
| `/api/v1/notifications/{id}/read` | `PATCH` | Authenticated Owner | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/notifications/read-all` | `PATCH` | Authenticated | None | 200 OK / 401 | **PASS** |
| `/api/v1/service-orders/{jobId}/material-requests` | `GET` | Authenticated | None | 200 OK / 401 | **WARN** (Missing @PreAuthorize ownership check) |
| `/api/v1/service-orders/{serviceOrderId}/material-requests` | `POST` | `PLUMBER` | `MaterialRequestBody` (Unvalidated) | 201 Created / 403 | **PASS** |
| `/api/v1/material-requests/{requestId}` | `PUT` | `PLUMBER` | `MaterialRequestBody` (Unvalidated) | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/material-requests/{requestId}/cancel` | `POST` | Authenticated | `CancelRequestBody` (Optional) | 200 OK / 404 | **PASS** |
| `/api/v1/material-requests/{requestId}/history` | `GET` | Authenticated | None | 200 OK / 404 | **PASS** |
| `/api/v1/material-requests/{id}/submit` | `POST` | `PLUMBER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/plumber/material-requests` | `GET` | `PLUMBER` | None | 200 OK / 403 | **PASS** |
| `/api/v1/plumber/material-requests/{id}` | `GET` | `PLUMBER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/store/material-requests` | `GET` | `STORE_MANAGER` | None | 200 OK / 403 | **PASS** |
| `/api/v1/store/material-requests/{id}` | `GET` | `STORE_MANAGER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/store/material-requests/{id}/approve` | `POST` | `STORE_MANAGER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/store/material-requests/{id}/partially-approve` | `POST` | `STORE_MANAGER` | `PartialApproval` (`quantities`) | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/store/material-requests/{id}/reject` | `POST` | `STORE_MANAGER` | `Reason` (`reason`) | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/store/material-requests/{id}/reserve` | `POST` | `STORE_MANAGER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/store/material-requests/{id}/prepare` | `POST` | `STORE_MANAGER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/store/material-requests/{id}/packing` | `POST` | `STORE_MANAGER` | `PackingRequestBody` | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/store/material-requests/{id}/ready-for-pickup` | `POST` | `STORE_MANAGER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/plumber/material-requests/{id}/arrived-at-store` | `POST` | `PLUMBER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/plumber/material-requests/{id}/collect` | `POST` | `PLUMBER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/store/material-requests/{id}/confirm-collection` | `POST` | `STORE_MANAGER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/service-orders/{jobId}/returning-to-customer` | `POST` | `PLUMBER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/service-orders/{jobId}/resume-work` | `POST` | `PLUMBER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{orderId}/addenda` | `POST` | `PLUMBER` | `MaterialAddendumCreateRequest` (`@Valid`) | 200 OK (Expected 201 Created) | **WARN** (Returns 200 instead of 201 Created) |
| `/api/v1/orders/{orderId}/addenda/{addendumId}` | `PATCH` | `PLUMBER` | `MaterialAddendumUpdateRequest` (`@Valid`) | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{orderId}/addenda/{addendumId}/publish` | `POST` | `PLUMBER` | `MaterialAddendumPublishRequest` | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{orderId}/addenda/current` | `GET` | `CUSTOMER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{orderId}/addenda/{addendumId}` | `GET` | `CUSTOMER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{orderId}/addenda` | `GET` | `CUSTOMER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{orderId}/addenda/{addendumId}/approve` | `POST` | `CUSTOMER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{orderId}/addenda/{addendumId}/reject` | `POST` | `CUSTOMER` | `QuoteRejectRequest` (`@Valid`) | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/customer/orders/{orderId}/quotes/current` | `GET` | `CUSTOMER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/customer/orders/{orderId}/quotes/{quoteId}/approve` | `POST` | `CUSTOMER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/customer/orders/{orderId}/quotes/{quoteId}/reject` | `POST` | `CUSTOMER` | `QuoteRejectRequest` (`@Valid`) | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{orderId}/quotes/{quoteId}` | `GET` | `PLUMBER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{orderId}/quotes/current` | `GET` | `PLUMBER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{orderId}/quotes/{quoteId}` | `PATCH` | `PLUMBER` | `QuoteDraftUpdateRequest` (`@Valid`) | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{orderId}/quotes/{quoteId}/publish` | `POST` | `PLUMBER` | `QuotePublishRequest` | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{orderId}/quotes/{quoteId}/revise` | `POST` | `PLUMBER` | `QuoteRevisionRequest` | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{orderId}/diagnosis` | `POST` | `PLUMBER` | `DiagnosisDraftRequest` (`@Valid`) | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{orderId}/diagnosis/{diagnosisId}` | `PATCH` | `PLUMBER` | `DiagnosisDraftUpdateRequest` (`@Valid`) | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{orderId}/diagnosis/{diagnosisId}/evidence` | `POST` | `PLUMBER` | MultipartFile `file` | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{orderId}/diagnosis/{diagnosisId}/submit` | `POST` | `PLUMBER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{orderId}/diagnosis/{diagnosisId}/revise` | `POST` | `PLUMBER` | `DiagnosisDraftRequest` (`@Valid`) | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{orderId}/diagnosis/{diagnosisId}/cancel` | `POST` | Operations Admins | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/orders/{orderId}/diagnosis` | `GET` | `PLUMBER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/customer/orders/{orderId}/diagnosis` | `GET` | `CUSTOMER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/customer/orders/{orderId}/diagnosis/evidence` | `GET` | `CUSTOMER` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/customer/orders/{orderId}/diagnosis/evidence/{photoId}/file` | `GET` | `CUSTOMER` | Path variables | 200 OK (Binary stream) | **PASS** |
| `/api/v1/logs` | `POST` | `PLUMBER` | `Map<String, Object>` (Untyped Map) | 200 OK / 404 (NPE on missing ID returns 404) | **FAIL** (NPE returns 404, untyped map) |
| `/api/v1/logs/order/{orderId}` | `GET` | Authorized Reader | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/logs/plumber/{plumberId}` | `GET` | `ADMIN` or Plumber Owner | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/super/dashboard` | `GET` | `SUPER_ADMIN`, `ADMIN` | None | 200 OK / 403 | **PASS** |
| `/api/v1/admin/super/users` | `GET` | `SUPER_ADMIN`, `ADMIN` | Query params | 200 OK / 403 | **PASS** |
| `/api/v1/admin/super/users/{id}` | `GET` | `SUPER_ADMIN`, `ADMIN` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/super/users/{id}/status` | `PATCH` | `SUPER_ADMIN`, `ADMIN` | `UserStatusUpdateRequest` | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/super/admin-users` | `GET` | `SUPER_ADMIN`, `ADMIN` | None | 200 OK / 403 | **PASS** |
| `/api/v1/admin/super/system-health` | `GET` | `SUPER_ADMIN`, `ADMIN` | None | 200 OK / 403 | **PASS** |
| `/api/v1/admin/operations/dashboard` | `GET` | Operations Admins | None | 200 OK / 403 | **PASS** |
| `/api/v1/admin/operations/product-orders` | `GET` | Operations Admins | Query params | 200 OK / 403 | **PASS** |
| `/api/v1/admin/operations/product-orders/{id}` | `GET` | Operations Admins | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/operations/service-jobs` | `GET` | Operations Admins | Query params | 200 OK / 403 | **PASS** |
| `/api/v1/admin/operations/service-jobs/{id}` | `GET` | Operations Admins | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/operations/material-requests` | `GET` | Operations Admins | Query params | 200 OK / 403 | **PASS** |
| `/api/v1/admin/operations/delivery-partners/available` | `GET` | Operations Admins | None | 200 OK / 403 | **PASS** |
| `/api/v1/admin/operations/service-jobs/{jobId}/reassign-plumber` | `PATCH` | Operations Admins | `ReassignPlumberRequest` | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/operations/service-jobs/{jobId}/assign-plumber` | `PATCH` | Operations Admins | `ReassignPlumberRequest` | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/operations/service-jobs/eligible-plumbers` | `GET` | Operations Admins | None | 200 OK / 403 | **PASS** |
| `/api/v1/admin/operations/product-orders/{orderId}/reassign-delivery` | `PATCH` | Operations Admins | `ReassignDeliveryRequest` | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/operations/product-orders/{orderId}/cancel` | `PATCH` | Operations Admins | `OperationsCancelOrderRequest` | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/operations/service-jobs/{orderId}/diagnosis` | `GET` | Operations Admins | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/service-jobs/{orderId}/reconciliation` | `GET` | Operations Admins | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/service-jobs/{orderId}/quotes` | `GET` | Operations Admins | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/service-jobs/{orderId}/addenda` | `GET` | Operations Admins | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/material-requests` | `GET` | Operations Admins | Query params | 200 OK / 403 | **PASS** |
| `/api/v1/admin/material-requests/{id}` | `GET` | Operations Admins | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/material-requests/{id}/reassign-store` | `POST` | Operations Admins | `ReassignStoreRequest` | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/material-requests/{id}/cancel` | `POST` | Operations Admins | `CancelRequest` (Optional) | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/rbac/roles` | `GET` | `SUPER_ADMIN`, `ADMIN` | None | 200 OK / 403 | **PASS** |
| `/api/v1/admin/rbac/permissions` | `GET` | `SUPER_ADMIN`, `ADMIN` | None | 200 OK / 403 | **PASS** |
| `/api/v1/admin/rbac/roles/{role}/permissions` | `GET` | `SUPER_ADMIN`, `ADMIN` | Path variable `role` | 200 OK / 403 | **PASS** |
| `/api/v1/admin/rbac/me` | `GET` | Admin Roles | None | 200 OK / 403 | **PASS** |
| `/api/v1/admin/rbac/users/{userId}/role` | `POST` | `SUPER_ADMIN`, `ADMIN` | `AssignRoleRequest` | 200 OK / 400 / 403 / 404 | **PASS** |
| `/api/v1/admin/support/dashboard` | `GET` | Support Admins | None | 200 OK / 403 | **PASS** |
| `/api/v1/admin/support/tickets` | `GET` | Support Admins | Query params | 200 OK / 403 | **PASS** |
| `/api/v1/admin/support/tickets/{id}` | `GET` | Support Admins | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/support/tickets` | `POST` | Support Admins | `SupportTicketCreateRequest` | 200 OK (Expected 201 Created) | **WARN** (Returns 200 instead of 201 Created) |
| `/api/v1/admin/support/tickets/{id}/messages` | `POST` | Support Admins | `SupportMessageRequest` | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/support/tickets/{id}/assign` | `PATCH` | Support Admins | `SupportAssignRequest` | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/support/tickets/{id}/status` | `PATCH` | Support Admins | `SupportStatusUpdateRequest` | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/support/tickets/{id}/escalate` | `PATCH` | Support Admins | `SupportEscalateRequest` | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/support/tickets/{id}/close` | `PATCH` | Support Admins | `SupportCloseRequest` | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/support/context/user/{userId}` | `GET` | Support Admins | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/marketing/dashboard` | `GET` | Marketing Admins | None | 200 OK / 403 | **PASS** |
| `/api/v1/admin/marketing/offers` | `GET` | Marketing Admins | Query params | 200 OK / 403 | **PASS** |
| `/api/v1/admin/marketing/offers` | `POST` | Marketing Admins | `OfferCreateRequest` | 200 OK (Expected 201 Created) | **WARN** (Returns 200 instead of 201 Created) |
| `/api/v1/admin/marketing/offers/{id}` | `GET` | Marketing Admins | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/marketing/offers/{id}` | `PATCH` | Marketing Admins | `OfferUpdateRequest` | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/marketing/offers/{id}/activate` | `PATCH` | Marketing Admins | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/marketing/offers/{id}/deactivate` | `PATCH` | Marketing Admins | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/marketing/campaigns` | `GET` | Marketing Admins | Query params | 200 OK / 403 | **PASS** |
| `/api/v1/admin/marketing/campaigns` | `POST` | Marketing Admins | `CampaignCreateRequest` | 200 OK (Expected 201 Created) | **WARN** (Returns 200 instead of 201 Created) |
| `/api/v1/admin/marketing/campaigns/{id}` | `GET` | Marketing Admins | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/marketing/campaigns/{id}/status` | `PATCH` | Marketing Admins | `CampaignStatusUpdateRequest` | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/marketing/banners` | `GET` | Marketing Admins | None | 200 OK / 403 | **PASS** |
| `/api/v1/admin/marketing/banners` | `POST` | Marketing Admins | `BannerCreateRequest` | 200 OK (Expected 201 Created) | **WARN** (Returns 200 instead of 201 Created) |
| `/api/v1/admin/marketing/banners/{id}` | `PATCH` | Marketing Admins | `BannerUpdateRequest` | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/marketing/banners/{id}/activate` | `PATCH` | Marketing Admins | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/marketing/banners/{id}/deactivate` | `PATCH` | Marketing Admins | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/marketing/notifications` | `GET` | Marketing Admins | None | 200 OK / 403 | **PASS** |
| `/api/v1/admin/marketing/notifications/send` | `POST` | Marketing Admins | `MarketingNotificationRequest` | 200 OK / 403 | **PASS** |
| `/api/v1/admin/marketing/segments` | `GET` | Marketing Admins | None | 200 OK / 403 | **PASS** |
| `/api/v1/admin/marketing/reports` | `GET` | Marketing Admins | None | 200 OK / 403 | **PASS** |
| `/api/v1/admin/launch-roster/policies` | `GET` | `ADMIN`, `SUPER_ADMIN` | None | 200 OK / 403 | **PASS** |
| `/api/v1/admin/launch-roster/policies/{policyId}/members` | `GET` | `ADMIN`, `SUPER_ADMIN` | None | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/launch-roster/policies/{policyId}/members/{plumberId}` | `POST` | `ADMIN`, `SUPER_ADMIN` | `LaunchRosterActionRequest` (`@Valid`) | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/admin/launch-roster/policies/{policyId}/members/{plumberId}/deactivate` | `PATCH` | `ADMIN`, `SUPER_ADMIN` | `LaunchRosterActionRequest` (`@Valid`) | 200 OK / 403 / 404 | **PASS** |
| `/api/v1/ai/demand-forecast` | `GET` | `ADMIN`, `STORE_MANAGER` | Query param `topN` | 200 OK / 403 | **PASS** |
| `/api/v1/ai/dynamic-pricing` | `GET` | `ADMIN`, `STORE_MANAGER` | None | 200 OK / 403 | **PASS** |
| `/api/v1/ai/bundle-suggestions` | `GET` | `ADMIN`, `STORE_MANAGER`, `CUSTOMER` | Query param `serviceType` | 200 OK / 403 | **PASS** |
| `/api/v1/ai/dashboard-metrics` | `GET` | `ADMIN`, `STORE_MANAGER` | None | 200 OK / 403 | **PASS** |
| `/api/v1/config/public` | `GET` | Public | None | 200 OK | **PASS** |
| `/api/v1/support/contact` | `GET` | Public | None | 200 OK | **PASS** |
| `/health/live` | `GET` | Public | None | 200 OK / 503 | **PASS** |
| `/health/ready` | `GET` | Public | None | 200 OK / 503 | **PASS** |
| `/version` | `GET` | Public | None | 200 OK | **PASS** |
| `/actuator/health` | `GET` | Public | None | 200 OK | **PASS** |
| `/actuator/info` | `GET` | Public | None | 200 OK | **PASS** |
| `/actuator/metrics` | `GET` | Authenticated | None | 404 Not Found (Unexposed web endpoint) | **FAIL** (Not exposed in application.yml) |
| `/api/v1/edge/requests/nearby` | `POST` | Authenticated (Rate limited: 10/min) | `{ customerId, longitude, latitude }` | 200 OK / 404 / 403 / 429 | **PASS** |
| `/api/v1/edge/delivery/otp/generate` | `POST` | Authenticated | `{ orderId }` | 200 OK / 400 / 404 / 500 | **FAIL** (Fails due to backend delivery 403) |
| `/api/v1/edge/delivery/otp/verify` | `POST` | Authenticated | `{ orderId, otp }` | 200 OK / 400 / 404 / 500 | **FAIL** (Fails due to backend delivery 403) |
| `/api/v1/edge/metrics/surge` | `GET` | Authenticated | None | 200 OK / 401 / 500 | **PASS** |
| `/api/v1/edge/health` | `GET` | Public | None | 200 OK / 500 | **PASS** |

---

## 3. WebSocket Event & Room Matrix

The following matrix documents all Socket.io rooms, handshake validations, room authorizations, and inbound/outbound event contracts in `plumbing-qcommerce/edge-service`.

| Event Name | Direction | Room / Namespace | Auth Required | Payload Schema Status | Reconnection / Drop Behavior | Status / Conformance |
|---|---|---|---|---|---|---|
| **Handshake (`connect`)** | Inbound | Global Gateway | Bearer JWT (Headers/Auth) | Signature verified + `/api/v1/users/me` verified | Client reconnects automatically; re-verifies token | **PASS** (Strict token & backend user status check) |
| `register_plumber` | Inbound | `plumber_${plumberId}` | Role: `PLUMBER` | Validates `socket.user.plumberId === payload.plumberId` | Socket must re-emit `register_plumber` on reconnect | **PASS** (Spoofing rejected, throttled 5/s) |
| `register_customer` | Inbound | `customer_${customerId}` | Role: `CUSTOMER` | Validates `socket.user.customerId === payload.customerId` | Socket must re-emit `register_customer` on reconnect | **PASS** (Spoofing rejected, throttled 5/s) |
| `register_delivery_partner` | Inbound | `delivery_${partnerId}` | Role: `DELIVERY_PARTNER` | Validates `socket.user.partnerId === payload.partnerId` | Socket must re-emit `register_delivery_partner` on reconnect | **PASS** (Spoofing rejected, throttled 5/s) |
| `register_store` | Inbound | `store_${storeId}` | Role: `STORE_MANAGER` | Validates `socket.user.storeId === payload.storeId` | Socket must re-emit `register_store` on reconnect | **PASS** (Spoofing rejected, throttled 5/s) |
| `location_ping` | Inbound | Plumber Socket | Role: `PLUMBER` | Validates coordinates bounds (lat ±90, lng ±180), throttled 1/2s | In-memory throttling per socket resets on reconnect | **PASS** (Non-standard name: expected `plumber:location_update`) |
| `delivery_location_ping` | Inbound | Partner Socket | Role: `DELIVERY_PARTNER` | Validates coordinates bounds (lat ±90, lng ±180), throttled 1/2s | In-memory throttling per socket resets on reconnect | **PASS** (Non-standard event naming) |
| `JOB_OFFER` | Outbound | `plumber_${plumberId}` | System broadcast | `{ jobId, customerId, distance }` | Emitted only to connected sockets; no redis buffer replay | **PASS** |
| `PLUMBER_ASSIGNED` | Outbound | `customer_${customerId}` | Kafka consumer (`order-accepted`) | `{ orderId, plumberId, message }` | Emitted only to connected sockets | **PASS** |
| `DELIVERY_JOB_OFFER` | Outbound | `delivery_${partnerId}` | Kafka consumer (`order-confirmed`) | `{ orderId, storeId, customerId, serviceOrderId, distance }` | Emitted only to connected sockets | **PASS** |
| `MATERIAL_PAYMENT_REQUIRED` | Outbound | `customer_${customerId}` | Kafka consumer (`material-request-created`) | `{ productOrderId, serviceOrderId, plumberName, totalAmount, message }` | Emitted only to connected sockets | **PASS** |
| `PARTS_EN_ROUTE` | Outbound | `service_${serviceOrderId}` | Kafka consumer (`material-order-confirmed`) | `{ productOrderId, message }` | **ORPHANED**: No client can join `service_*` room! Event silently lost | **FAIL** (Missing room join listener) |
| `order:status_changed` | Outbound | `order_${id}`, `customer_${id}` | Expected by contract | **NOT IMPLEMENTED**: Never emitted across platform | Missing event broadcast | **FAIL** (Contract missing) |
| `inventory:reserved` | Outbound | `store_${id}` | Expected by contract | **NOT IMPLEMENTED**: Never emitted across platform | Missing event broadcast | **FAIL** (Contract missing) |
| `inventory:released` | Outbound | `store_${id}` | Expected by contract | **NOT IMPLEMENTED**: Never emitted across platform | Missing event broadcast | **FAIL** (Contract missing) |
| `payment:confirmed` | Outbound | `customer_${id}`, `order_${id}` | Expected by contract | **NOT IMPLEMENTED**: Never emitted across platform | Missing event broadcast | **FAIL** (Contract missing) |
| `admin` (Room) | Both | `admin` | Role: Admin | **NOT IMPLEMENTED**: No admin room join or event routing exists | Admins cannot receive live telemetry or dispatch feeds | **FAIL** (Room missing) |
| `error` | Outbound | Caller Socket | System | `{ message: string }` | Emitted on auth failure, rate limit, or invalid payload | **WARN** (Lacks code, timestamp, correlationId) |

---

## 4. Detailed Issue Log

### API-BUG-001: Global Exception Handler Maps All `RuntimeException` Instances to HTTP 404 "Not Found"
- **Severity**: **Critical**
- **Affected Subsystem & Files**: Core Backend Engine (`backend/src/main/java/com/pqc/core/exception/GlobalExceptionHandler.java:64-74`)
- **Endpoint / Event**: All backend REST endpoints handling JSON request bodies or runtime business logic.
- **Request / Event Payload Example**:
  ```http
  POST /api/v1/auth/login HTTP/1.1
  Host: localhost:8081
  Content-Type: application/json

  { "email": "valid@pqc.com", "password": [malformed invalid json...
  ```
- **Expected Response / Status Code**:
  - Status: `400 Bad Request` (or `500 Internal Server Error` for unanticipated runtime bugs).
  - Body: Standard `ApiError` envelope detailing error code `MALFORMED_JSON` or `INVALID_REQUEST`.
- **Observed / Actual Response / Status Code**:
  - Status: `404 Not Found`
  - Body:
    ```json
    {
      "timestamp": "2026-11-03T18:28:52.123",
      "status": 404,
      "error": "Not Found",
      "message": "JSON parse error: Unexpected character..."
    }
    ```
- **Root-Cause Analysis**:
  In `GlobalExceptionHandler.java`:
  ```java
  @ExceptionHandler(RuntimeException.class)
  public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
      log.error("RuntimeException occurred: ", ex);
      String msg = ex.getMessage();
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
          "timestamp", LocalDateTime.now().toString(),
          "status", 404,
          "error", "Not Found",
          "message", msg != null ? msg : "Not Found"
      ));
  }
  ```
  Spring MVC's `HttpMessageNotReadableException` (thrown on malformed JSON bodies) extends `NestedRuntimeException` $\to$ `RuntimeException`. Consequently, whenever a client submits invalid JSON or encounters an unhandled `NullPointerException`, `IndexOutOfBoundsException`, or `IllegalStateException`, Spring catches it with this handler and responds with `404 Not Found`. Client applications mistake server failures or payload errors for nonexistent endpoints.
- **Contract Remediation Recommendation**:
  Remove `HttpStatus.NOT_FOUND` from the catch-all `RuntimeException` handler. Route unexpected runtime exceptions to `HttpStatus.INTERNAL_SERVER_ERROR` (500). Explicitly register `@ExceptionHandler(HttpMessageNotReadableException.class)` returning `HttpStatus.BAD_REQUEST` (400) with a standard `ApiError` payload.

---

### API-BUG-002: Discrepant and Unenveloped Error Representations Across REST Endpoints
- **Severity**: **High**
- **Affected Subsystem & Files**: Backend Exception Handling (`GlobalExceptionHandler.java`, `AuthenticationController.java:30-66`, `CheckoutController.java:40-49`)
- **Endpoint / Event**: `/api/v1/auth/logout`, `/api/v1/checkout/confirm/{orderId}`, `/api/v1/checkout/release/{orderId}`
- **Request / Event Payload Example**:
  ```http
  POST /api/v1/auth/logout HTTP/1.1
  Host: localhost:8081
  Authorization: InvalidFormat
  ```
- **Expected Response / Status Code**:
  - Status: `400 Bad Request`
  - Content-Type: `application/json`
  - Body:
    ```json
    {
      "timestamp": "2026-11-03T19:00:00Z",
      "status": 400,
      "code": "INVALID_HEADER",
      "message": "Missing or invalid Authorization header",
      "path": "/api/v1/auth/logout",
      "correlationId": "8f8b8a91-...",
      "details": {}
    }
    ```
- **Observed / Actual Response / Status Code**:
  - Status: `400 Bad Request`
  - Content-Type: `text/plain;charset=UTF-8`
  - Body: `"Missing or invalid Authorization header"`
- **Root-Cause Analysis**:
  Multiple controllers return raw strings (`ResponseEntity<String>`) rather than structured JSON objects. Furthermore, `GlobalExceptionHandler` defines a production record `ApiError(timestamp, status, code, message, path, correlationId, details)`, but exclusively uses it for `AccessDeniedException`. All other handlers (`MethodArgumentNotValidException`, `DataIntegrityViolationException`, `IllegalArgumentException`, `Exception`) construct arbitrary inline `Map.of("timestamp", ..., "status", ..., "error", ..., "message", ...)`, omitting `correlationId`, `code`, `path`, and `details`.
- **Contract Remediation Recommendation**:
  Standardize all controller and `@RestControllerAdvice` responses to return `ApiError`. Replace `ResponseEntity<String>` return types in `AuthenticationController` and `CheckoutController` with JSON records or DTOs.

---

### API-BUG-003: Delivery Subsystem Hard-Blocked by Spring Security Configuration (`denyAll()`)
- **Severity**: **Critical**
- **Affected Subsystem & Files**: Security Configuration (`backend/src/main/java/com/pqc/core/config/SecurityConfig.java:110`)
- **Endpoint / Event**: `/api/v1/delivery/**` (including `/available`, `/{orderId}/accept`, `/{orderId}/confirm-otp`, `/{orderId}/otp/generate`, `/partners`, `/{orderId}/assign`)
- **Request / Event Payload Example**:
  ```http
  GET /api/v1/delivery/available HTTP/1.1
  Host: localhost:8081
  Authorization: Bearer <VALID_DELIVERY_PARTNER_JWT>
  ```
- **Expected Response / Status Code**:
  - Status: `200 OK`
  - Body: `[ { "id": 101, "status": "CONFIRMED", "totalAmount": 450.00, ... } ]`
- **Observed / Actual Response / Status Code**:
  - Status: `403 Forbidden`
  - Body: `{"status":403,"error":"ACCESS_DENIED","message":"You do not have permission to perform this operation."}`
- **Root-Cause Analysis**:
  In `SecurityConfig.java:110`:
  ```java
  .requestMatchers("/api/v1/delivery/**").denyAll()
  ```
  This security rule hard-blocks every request to the delivery subsystem, taking precedence over method-level `@PreAuthorize` security and profile properties (`features.delivery-enabled`). As a result, delivery partners cannot fetch jobs, verify delivery OTPs, or accept orders. Edge Gateway delivery routes invoking backend delivery APIs fail with 403 Forbidden.
- **Contract Remediation Recommendation**:
  Replace `.requestMatchers("/api/v1/delivery/**").denyAll()` with granular role-based permissions:
  ```java
  .requestMatchers("/api/v1/delivery/available", "/api/v1/delivery/*/accept").hasRole("DELIVERY_PARTNER")
  .requestMatchers("/api/v1/delivery/*/confirm-otp").hasRole("CUSTOMER")
  .requestMatchers("/api/v1/delivery/*/otp/generate", "/api/v1/delivery/partners", "/api/v1/delivery/*/assign").hasAnyRole("STORE_MANAGER", "ADMIN")
  ```

---

### API-BUG-004: Global Constraint Violation Handler Hardcodes Address Validation Failure Message
- **Severity**: **High**
- **Affected Subsystem & Files**: Backend Exception Handling (`backend/src/main/java/com/pqc/core/exception/GlobalExceptionHandler.java:96-104`)
- **Endpoint / Event**: All endpoints with Jakarta `@Validated` or JPA entities throwing `ConstraintViolationException`.
- **Request / Event Payload Example**:
  ```http
  POST /api/v1/stores/me/inventory HTTP/1.1
  Host: localhost:8081
  Authorization: Bearer <STORE_MANAGER_TOKEN>
  Content-Type: application/json

  { "productId": null, "initialQuantity": -5, "lowStockThreshold": -1 }
  ```
- **Expected Response / Status Code**:
  - Status: `400 Bad Request`
  - Body: `{"message": "initialQuantity must be greater than or equal to 0"}`
- **Observed / Actual Response / Status Code**:
  - Status: `400 Bad Request`
  - Body:
    ```json
    {
      "timestamp": "2026-11-03T18:28:52.123",
      "status": 400,
      "error": "Bad Request",
      "message": "Address validation failed"
    }
    ```
- **Root-Cause Analysis**:
  In `GlobalExceptionHandler.java:96-104`:
  ```java
  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException ex) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
          "timestamp", LocalDateTime.now().toString(),
          "status", 400,
          "error", "Bad Request",
          "message", "Address validation failed"
      ));
  }
  ```
  The handler hardcodes `"message", "Address validation failed"`. If a product quantity, phone number, rating, or quote line violates a `@Min`, `@NotNull`, or `@Pattern` constraint, the API misleadingly reports that "Address validation failed".
- **Contract Remediation Recommendation**:
  Extract the actual constraint violation message dynamically:
  ```java
  String msg = ex.getConstraintViolations().stream()
      .map(v -> v.getPropertyPath() + ": " + v.getMessage())
      .collect(Collectors.joining(", "));
  ```

---

### API-BUG-005: Missing Request Parameters Fall Through to HTTP 500 Internal Server Error
- **Severity**: **High**
- **Affected Subsystem & Files**: Controller Exception Handling (`backend/src/main/java/com/pqc/core/exception/GlobalExceptionHandler.java:121-131`, `CatalogController.java:63-70`)
- **Endpoint / Event**: `GET /api/v1/catalog/search` (and any endpoint with mandatory `@RequestParam`)
- **Request / Event Payload Example**:
  ```http
  GET /api/v1/catalog/search HTTP/1.1
  Host: localhost:8081
  ```
- **Expected Response / Status Code**:
  - Status: `400 Bad Request`
  - Body: `{"status": 400, "error": "Bad Request", "message": "Required request parameter 'q' for method parameter type String is not present"}`
- **Observed / Actual Response / Status Code**:
  - Status: `500 Internal Server Error`
  - Body:
    ```json
    {
      "timestamp": "2026-11-03T19:00:00.123",
      "status": 500,
      "error": "Internal Server Error",
      "message": "Required request parameter 'q' for method parameter type String is not present"
    }
    ```
- **Root-Cause Analysis**:
  In Spring MVC, missing required parameters throw `MissingServletRequestParameterException` (inheriting from `jakarta.servlet.ServletException`). `ServletException` does NOT extend `RuntimeException`. Because `GlobalExceptionHandler` does not extend `ResponseEntityExceptionHandler` and has no handler for `MissingServletRequestParameterException`, the exception falls into `@ExceptionHandler(Exception.class)`, which unconditionally returns HTTP 500.
- **Contract Remediation Recommendation**:
  Have `GlobalExceptionHandler` extend `ResponseEntityExceptionHandler` or register `@ExceptionHandler(MissingServletRequestParameterException.class)` returning `HttpStatus.BAD_REQUEST`.

---

### API-BUG-006: Insecure Direct Object Reference (IDOR) & Broken Object-Level Authorization on Checkout Confirm/Release
- **Severity**: **High**
- **Affected Subsystem & Files**: Checkout Controller (`backend/src/main/java/com/pqc/core/controller/CheckoutController.java:39-49`)
- **Endpoint / Event**: `POST /api/v1/checkout/confirm/{orderId}`, `POST /api/v1/checkout/release/{orderId}`
- **Request / Event Payload Example**:
  ```http
  POST /api/v1/checkout/confirm/9999 HTTP/1.1
  Host: localhost:8081
  Authorization: Bearer <ANY_AUTHENTICATED_CUSTOMER_OR_PLUMBER_TOKEN>
  ```
- **Expected Response / Status Code**:
  - Status: `403 Forbidden` (Caller does not own order 9999 and is not an authorized payment gateway adapter or store manager).
- **Observed / Actual Response / Status Code**:
  - Status: `200 OK`
  - Body: `"Payment confirmed and stock reservation finalized."`
- **Root-Cause Analysis**:
  In `CheckoutController.java`:
  ```java
  @PostMapping("/confirm/{orderId}")
  public ResponseEntity<String> confirmPayment(@PathVariable Long orderId) {
      checkoutService.confirmPayment(orderId);
      return ResponseEntity.ok("Payment confirmed and stock reservation finalized.");
  }
  ```
  Neither endpoint has `@PreAuthorize` annotations or ownership verification. Any authenticated user can trigger order confirmation or release inventory reservations belonging to any customer or store.
- **Contract Remediation Recommendation**:
  Enforce `@PreAuthorize("hasAnyRole('STORE_MANAGER', 'ADMIN') or @orderAuthorization.isOrderOwner(#orderId, authentication)")` or restrict payment confirmation to payment service adapters and authenticated webhook handlers.

---

### API-BUG-007: Unrestricted Wallet Balance Credit via Unverified Top-Up Endpoint
- **Severity**: **High**
- **Affected Subsystem & Files**: Wallet Management (`backend/src/main/java/com/pqc/core/controller/WalletController.java:43-86`)
- **Endpoint / Event**: `POST /api/v1/wallet/topup?amount=...`, `POST /api/v1/wallet/pay?amount=...`
- **Request / Event Payload Example**:
  ```http
  POST /api/v1/wallet/topup?amount=1000000.00 HTTP/1.1
  Host: localhost:8081
  Authorization: Bearer <CUSTOMER_TOKEN>
  ```
- **Expected Response / Status Code**:
  - Status: `400 Bad Request` or `403 Forbidden` (Direct arbitrary wallet credits must require verified gateway payment capture tokens or administrative role).
- **Observed / Actual Response / Status Code**:
  - Status: `200 OK`
  - Body: `{ "id": 1, "balance": 1000000.00, ... }`
- **Root-Cause Analysis**:
  `WalletController.topup` directly updates the database balance without verifying any payment intent or transaction receipt. Furthermore, in `WalletController.pay`, insufficient balance throws `IllegalStateException("Insufficient wallet balance")` which `GlobalExceptionHandler` converts to `HTTP 404 Not Found` (via API-BUG-001) instead of `400 Bad Request` or `422 Unprocessable Entity`.
- **Contract Remediation Recommendation**:
  Require a payment gateway transaction ID or Razorpay signature in `topup`, or restrict direct top-up to internal system roles. Handle `IllegalStateException` explicitly to return `400 Bad Request`.

---

### API-BUG-008: Authentication Envelope Inconsistency Between OTP Login and Password / Google Login
- **Severity**: **Medium**
- **Affected Subsystem & Files**: Authentication Subsystem (`backend/src/main/java/com/pqc/core/controller/OtpController.java:63-104`, `com/pqc/core/controller/AuthController.java:140-163`, `dto/AuthResponse.java`)
- **Endpoint / Event**: `POST /api/v1/auth/verify-otp` vs `POST /api/v1/auth/login`
- **Request / Event Payload Example**:
  ```http
  POST /api/v1/auth/verify-otp HTTP/1.1
  Host: localhost:8081
  Content-Type: application/json

  { "phone": "9876543210", "code": "123456" }
  ```
- **Expected Response / Status Code**:
  - Status: `200 OK`
  - Body Schema: Standard `AuthResponse`:
    ```json
    {
      "token": "eyJhbG...",
      "accessToken": "eyJhbG...",
      "refreshToken": "4a1b...",
      "userId": 12,
      "role": "CUSTOMER",
      "email": "9876543210@plumbcommerce.com",
      "fullName": "Customer 3210",
      "phone": "9876543210",
      "phoneVerified": true,
      "profileComplete": true,
      "user": { "id": 12, "email": "...", "role": "CUSTOMER" }
    }
    ```
- **Observed / Actual Response / Status Code**:
  - Status: `200 OK`
  - Body:
    ```json
    {
      "token": "eyJhbG...",
      "refreshToken": "4a1b...",
      "userId": 12,
      "role": "CUSTOMER",
      "email": "9876543210@plumbcommerce.com"
    }
    ```
- **Root-Cause Analysis**:
  `OtpController.verifyOtp` returns an ad-hoc `Map.of("token", ..., "refreshToken", ..., "userId", ..., "role", ..., "email", ...)` rather than using the canonical `AuthResponse.from(user, token, refreshToken)` builder used by `AuthController.login` and `AuthController.register`. The response is missing `accessToken`, `fullName`, `phone`, `phoneVerified`, `profileComplete`, and the nested `user` DTO, breaking frontend state hydrating logic.
- **Contract Remediation Recommendation**:
  Refactor `OtpController.verifyOtp` to return `ResponseEntity<AuthResponse>` using `AuthResponse.from(user, token, refreshToken)`.

---

### API-BUG-009: Mass-Assignment Vulnerability & Sensitive Data Leakage from Direct JPA Entity Exposure
- **Severity**: **Medium**
- **Affected Subsystem & Files**: Store & Address Controllers (`StoreController.java:29,73`, `UserAddressController.java:32`, `UserController.java:60`)
- **Endpoint / Event**: `POST /api/v1/stores`, `PUT /api/v1/stores/me`, `POST /api/v1/users/me/addresses`
- **Request / Event Payload Example**:
  ```http
  POST /api/v1/stores?managerEmail=admin@pqc.com HTTP/1.1
  Host: localhost:8081
  Authorization: Bearer <ADMIN_TOKEN>
  Content-Type: application/json

  {
    "id": 9999,
    "name": "New Hub Store",
    "address": "123 Main St",
    "latitude": 12.97,
    "longitude": 77.59,
    "createdAt": "2020-01-01T00:00:00"
  }
  ```
- **Expected Response / Status Code**:
  - Status: `201 Created`
  - Request DTO: Dedicated `StoreCreateRequest` ignoring client-supplied entity metadata like `id` or `createdAt`.
- **Observed / Actual Response / Status Code**:
  - Status: `200 OK` (Should be 201 Created).
  - Controller directly binds input JSON to the Hibernate `@Entity Store`.
- **Root-Cause Analysis**:
  Accepting JPA entities directly as `@RequestBody` bypasses parameter encapsulation. In `UserAddressController.java:34-37`, the controller executes `address.getLabel().trim()`, `address.getName().trim()`, etc., directly on the entity. If any required property is omitted, a `NullPointerException` occurs, which `GlobalExceptionHandler` converts to `HTTP 404 Not Found` (API-BUG-001) instead of returning `400 Bad Request`.
- **Contract Remediation Recommendation**:
  Replace entity request bodies with dedicated DTOs (`StoreCreateRequest`, `AddressCreateRequest`) annotated with Jakarta `@NotNull`, `@NotBlank`, and `@Size`.

---

### API-BUG-010: Hardcoded Mock Data Returned on Production Material Tracking Endpoint
- **Severity**: **Medium**
- **Affected Subsystem & Files**: Plumber Controller (`backend/src/main/java/com/pqc/core/controller/PlumberController.java:171-181`)
- **Endpoint / Event**: `GET /api/v1/plumber/material-requests/{requestId}/tracking`
- **Request / Event Payload Example**:
  ```http
  GET /api/v1/plumber/material-requests/99999/tracking HTTP/1.1
  Host: localhost:8081
  Authorization: Bearer <PLUMBER_TOKEN>
  ```
- **Expected Response / Status Code**:
  - Status: `404 Not Found` (Material request 99999 does not exist).
- **Observed / Actual Response / Status Code**:
  - Status: `200 OK`
  - Body:
    ```json
    [
      { "status": "REQUESTED", "time": "10:00 AM", "completed": true },
      { "status": "APPROVED", "time": "10:15 AM", "completed": true },
      { "status": "PICKED_UP", "time": "10:50 AM", "completed": true },
      { "status": "ON_THE_WAY", "time": "11:05 AM", "completed": true },
      { "status": "DELIVERED", "time": "Pending", "completed": false }
    ]
    ```
- **Root-Cause Analysis**:
  Lines 172-181 in `PlumberController.java` return a static list of maps with hardcoded timestamps and completed states regardless of whether the `requestId` exists, belongs to the plumber, or corresponds to an active dispatch.
- **Contract Remediation Recommendation**:
  Delegate tracking queries to `PlumberMaterialService.getMaterialTracking(requestId)` and derive tracking events from authentic database records (`ProductOrder` and `MaterialRequest` status logs).

---

### API-BUG-011: Missing WebSocket Room Listeners for `service_{id}`, `order_{id}`, and `admin`
- **Severity**: **Critical**
- **Affected Subsystem & Files**: Edge Gateway (`edge-service/server.js:322-400`, `edge-service/services/kafkaService.js:112`)
- **Endpoint / Event**: Socket.io Handlers / Kafka Event `material-order-confirmed`
- **Request / Event Payload Example**:
  - Kafka message on topic `material-order-confirmed`:
    ```json
    { "orderId": 501, "serviceOrderId": 88, "customerId": 10 }
    ```
- **Expected Behavior**:
  - Plumbers on-site for service order 88 receive `PARTS_EN_ROUTE` in their client application.
- **Observed Behavior**:
  - `kafkaService.js` executes `io.to("service_88").emit("PARTS_EN_ROUTE", ...)`.
  - In `server.js`, no socket event exists to join `service_*` or `order_*` rooms. Room `service_88` has zero members; the event is dropped silently without client notification.
  - Operations admins have no mechanism to join an `admin` room to monitor live dispatch updates.
- **Root-Cause Analysis**:
  `server.js` only implements `register_plumber`, `register_customer`, `register_delivery_partner`, and `register_store`. There are no socket handlers for `register_service`, `join_order`, or `register_admin`.
- **Contract Remediation Recommendation**:
  Implement authorized room-joining handlers in `server.js`:
  ```javascript
  socket.on('join_service', ({ serviceOrderId }) => {
      // Validate user is assigned plumber or customer on serviceOrderId
      socket.join(`service_${serviceOrderId}`);
  });
  socket.on('join_admin', () => {
      if (['ADMIN', 'SUPER_ADMIN', 'OPERATIONS_ADMIN'].includes(socket.user.role)) {
          socket.join('admin');
      }
  });
  ```

---

### API-BUG-012: WebSocket Contract & Event Naming Discrepancies
- **Severity**: **High**
- **Affected Subsystem & Files**: Edge Service Gateway (`edge-service/server.js:402-447`, `edge-service/services/kafkaService.js`)
- **Endpoint / Event**: Inbound & Outbound Socket.io Events
- **Contractual Expectations vs Implementation**:
  1. `plumber:location_update` is specified as the canonical location update contract, but the edge service exclusively listens to `location_ping`.
  2. `order:status_changed` is specified to broadcast order status updates to customer and admin rooms, but is nowhere emitted by backend or edge service.
  3. `inventory:reserved` and `inventory:released` are specified for store counter inventory tracking, but are not emitted upon checkout reservation.
  4. `payment:confirmed` is specified for real-time checkout completion, but is missing from the WebSocket gateway.
  5. Socket error messages emit `{ message: "..." }` lacking standard fields like `code`, `timestamp`, or `correlationId`.
- **Root-Cause Analysis**:
  Lack of a centralized event contract definition between backend Kafka producers, Node.js edge consumers, and mobile frontends.
- **Contract Remediation Recommendation**:
  Alias event listeners in `server.js` (`socket.on('plumber:location_update', ...)` alongside `location_ping`). Hook backend domain events (`OrderStatusChangedEvent`, `StockReservedEvent`) into Kafka topics consumed by `kafkaService.js` to broadcast standard events.

---

### API-BUG-013: High Coupling and Latency Amplification During WebSocket Handshake Authentication
- **Severity**: **High**
- **Affected Subsystem & Files**: Edge Service Middleware (`edge-service/middleware/authMiddleware.js:56-101`)
- **Endpoint / Event**: Socket.io Connection Handshake (`socketAuth`)
- **Observed Behavior**:
  For every incoming WebSocket connection, `socketAuth` invokes an HTTP `GET` request to Backend `/api/v1/users/me` with a 5000ms timeout. For store managers, it issues a secondary HTTP `GET` to `/api/v1/stores`.
- **Impact & Risk**:
  During edge restarts or network drops, hundreds of clients attempt simultaneous reconnection. This generates hundreds of synchronous HTTP calls against the backend database. If the backend response exceeds 5 seconds (such as during cold start or high load), the handshake aborts with "Authentication error", inducing a cascading connection failure loop.
- **Contract Remediation Recommendation**:
  Embed user claims (`role`, `userId`, `storeId`, `plumberId`, `status`) directly in the signed JWT payload during token minting, or cache user validation responses in Redis with a short TTL (e.g. 60 seconds).

---

### API-BUG-014: Inconsistent Idempotency Header Specifications Across Platform Endpoints
- **Severity**: **Medium**
- **Affected Subsystem & Files**: REST Controllers (`PaymentController.java:85,169`, `MaterialAddendumController.java:21,28,35`, `Phase2QuoteController.java:30,36,44`, `ServiceDiagnosisController.java:18,20,22`)
- **Endpoint / Event**: Payment checkout vs Material Addenda vs Quote vs Diagnosis endpoints
- **Observed Discrepancy**:
  - `PaymentController` expects: `@RequestHeader(value = "X-Idempotency-Key", required = false)`
  - `MaterialAddendumController`, `Phase2QuoteController`, `CustomerQuoteController`, and `ServiceDiagnosisController` expect: `@RequestHeader(value = "Idempotency-Key", required = false)`
- **Impact**:
  API clients sending standard `X-Idempotency-Key` headers to quote or addendum endpoints have their idempotency keys ignored, risking duplicate draft creation or race-condition replays.
- **Contract Remediation Recommendation**:
  Standardize on accepting both headers or adopt the IETF `Idempotency-Key` standard across all mutating POST/PATCH controllers.

---

### API-BUG-015: HTTP Status Code Non-Conformance on Creation and Deletion Endpoints
- **Severity**: **Medium**
- **Affected Subsystem & Files**: Multiple Backend Controllers (`ServiceOrderController.java:50`, `StoreController.java:29`, `MaterialAddendumController.java:19`, `UserAddressController.java:43`)
- **Observed Discrepancy**:
  - `POST /api/v1/orders` returns `200 OK` (Expected `201 Created`).
  - `POST /api/v1/stores` returns `200 OK` (Expected `201 Created`).
  - `POST /api/v1/orders/{orderId}/addenda` returns `200 OK` (Expected `201 Created`).
  - `DELETE /api/v1/users/me/addresses/{id}` returns `200 OK` with empty body (Expected `204 No Content`).
- **Contract Remediation Recommendation**:
  Return `ResponseEntity.status(HttpStatus.CREATED).body(...)` for resource creation and `ResponseEntity.noContent().build()` for resource deletion.

---

### API-BUG-016: Actuator Operational Endpoints Unexposed Under Web Profile
- **Severity**: **Medium**
- **Affected Subsystem & Files**: Configuration (`backend/src/main/resources/application.yml:67-74`, `SecurityConfig.java:120`)
- **Endpoint / Event**: `/actuator/metrics`, `/actuator/env`, `/actuator/loggers`, `/actuator/beans`
- **Observed Discrepancy**:
  `application.yml` does not declare `management.endpoints.web.exposure.include`. In Spring Boot, only `/actuator/health` and `/actuator/info` are exposed over the web by default. Attempts to query `/actuator/metrics` return `404 Not Found`, obstructing Prometheus and health monitoring integrations.
- **Contract Remediation Recommendation**:
  Configure `management.endpoints.web.exposure.include: "health,info,metrics,prometheus"` in `application.yml`.

---

## 5. Concluding Quality Verdict for API & WebSocket Integration

| Evaluation Discipline | Assessed Score | Verdict | Key Constraints & Blockers |
|---|---|---|---|
| **REST Schema Validation & DTOs** | 76 / 100 | **CONDTIONALLY ACCEPTABLE** | Missing DTOs in Store and Address controllers; untyped Maps used in auth and log endpoints. |
| **HTTP Status Code Conformance** | 68 / 100 | **FAIL** | All `RuntimeException` errors mapped to 404; missing parameters throw 500; 200 returned on creation. |
| **Error Handling & Envelopes** | 62 / 100 | **FAIL** | Unenveloped Maps, plain-text responses, hardcoded error messages ("Address validation failed"). |
| **Access Control & Security Rules** | 65 / 100 | **CRITICAL DEFECT** | Delivery subsystem hard-blocked by `denyAll()`; IDOR on checkout confirmation and release. |
| **WebSocket Contracts & Rooms** | 70 / 100 | **NEEDS REMEDIATION** | Missing `service_*`, `order_*`, and `admin` rooms; orphaned Kafka events; non-standard event naming. |
| **OVERALL INTEGRATION VERDICT** | **68.2 / 100** | **REJECTED (REQUIRES REMEDIATION)** | The platform cannot pass production certification until API-BUG-001, API-BUG-003, and API-BUG-011 are resolved. |

### Summary of Priority Fixes:
1. **P0 (Immediate Blockers)**:
   - Remove `.requestMatchers("/api/v1/delivery/**").denyAll()` from `SecurityConfig.java` to unblock delivery partners.
   - Fix `GlobalExceptionHandler.java` to stop converting runtime exceptions and malformed JSON into 404 Not Found.
   - Add `join_service`, `join_order`, and `join_admin` room listeners to `edge-service/server.js` so Kafka dispatch events reach clients.
2. **P1 (Security & Data Integrity)**:
   - Secure `/api/v1/checkout/confirm/{orderId}` and `/api/v1/checkout/release/{orderId}` against IDOR tampering.
   - Remove open arbitrary wallet balance top-up in `WalletController.java`.
   - Dynamicize constraint violation messages in `GlobalExceptionHandler.java`.
3. **P2 (Contract Polish)**:
   - Standardize `ApiError` envelope across all error responses.
   - Return 201 Created and 204 No Content where appropriate.
   - Align event names (`plumber:location_update`, `order:status_changed`, `inventory:reserved`).

