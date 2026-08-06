# Spring Data Repository Classification & Scoping Audit

## 1. Overview

Spring Data auto-configuration by default scans the base package of `@SpringBootApplication` (`com.pqc.core`) for all repository store types (JPA, MongoDB, Redis).

Prior to explicit scoping:
- Spring Data JPA scanned `com.pqc.core`, inspecting 28 JPA interfaces + 2 MongoDB document repositories.
- Spring Data Mongo scanned `com.pqc.core`, inspecting 2 MongoDB document repositories + 28 JPA repositories.
- Spring Data Redis scanned `com.pqc.core`, searching for `@RedisHash` domain classes and repository interfaces (finding 0).

This un-scoped repository scanning introduced significant reflection, metadata inspection, and bean definition overhead during `WebApplicationContext` initialization (~58.6s delay).

---

## 2. Repository Inventory & Classification Matrix

| Repository Interface | Package | Intended Store | Type | Required in MVP |
| -------------------- | ------- | -------------- | ---- | --------------- |
| `AdminAuditLogRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<AdminAuditLog, Long>` | YES |
| `CategoryRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<Category, Long>` | YES |
| `DeliveryDriverRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<DeliveryDriver, Long>` | Future delivery / Disabled |
| `DeliveryJobRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<DeliveryJob, Long>` | Future delivery / Disabled |
| `InventoryReservationRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<InventoryReservation, Long>` | YES |
| `MarketingBannerRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<MarketingBanner, Long>` | YES |
| `MarketingCampaignRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<MarketingCampaign, Long>` | YES |
| `MarketingNotificationRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<MarketingNotification, Long>` | YES |
| `NotificationRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<Notification, Long>` | YES |
| `OfferRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<Offer, Long>` | YES |
| `OutboxEventRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<OutboxEvent, Long>` | YES |
| `PlumberKycRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<PlumberKyc, Long>` | YES |
| `ProductOrderRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<ProductOrder, Long>` | YES |
| `ProductOrderStatusHistoryRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<ProductOrderStatusHistory, Long>` | YES |
| `ProductRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<Product, Long>` | YES |
| `RefreshTokenRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<RefreshToken, Long>` | YES |
| `RefundRequestRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<RefundRequest, Long>` | YES |
| `ServiceOrderRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<ServiceOrder, Long>` | YES |
| `ServiceOrderStatusHistoryRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<ServiceOrderStatusHistory, Long>` | YES |
| `SettlementRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<Settlement, Long>` | YES |
| `StockRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<Stock, Long>` | YES |
| `StoreRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<Store, Long>` | YES |
| `SupportMessageRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<SupportMessage, Long>` | YES |
| `SupportTicketRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<SupportTicket, Long>` | YES |
| `UserAddressRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<UserAddress, Long>` | YES |
| `UserRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<User, Long>` | YES |
| `WalletRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<Wallet, Long>` | YES |
| `WalletTransactionRepository` | `com.pqc.core.repository` | PostgreSQL | `JpaRepository<WalletTransaction, Long>` | YES |
| `AuditLogEventRepository` | `com.pqc.core.document` | MongoDB | `MongoRepository<AuditLogEvent, String>` | YES |
| `ServiceLogRepository` | `com.pqc.core.document` | MongoDB | `MongoRepository<ServiceLog, String>` | YES |

---

## 3. Scoping Solution Implemented

### JPA Repository Scoping
Created `@EnableJpaRepositories(basePackages = "com.pqc.core.repository")` in `JpaRepositoryConfig.java`.
Guarantees Spring Data JPA only inspects relational repositories in `com.pqc.core.repository`.

### MongoDB Repository Scoping
Created `@EnableMongoRepositories(basePackages = "com.pqc.core.document")` in `MongoRepositoryConfig.java`.
Guarantees Spring Data Mongo only inspects NoSQL document repositories in `com.pqc.core.document`.

### Redis Repository Scanning Disabled
Configured `spring.data.redis.repositories.enabled=false` in `application.yml` and `application-prod.properties`.
Completely skips Redis repository scanning while preserving `StringRedisTemplate` and `RedisTemplate` functionality for OTP caching.
