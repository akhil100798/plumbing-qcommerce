# Backend Repository Inventory

## Overview
This inventory covers the complete FixKart backend repository architecture, components, configurations, and test files.

| Area | Path | Purpose | Status | Notes |
| ---- | ---- | ------- | ------ | ----- |
| Application Entry Point | `backend/src/main/java/com/pqc/core/PlumbingCoreApplication.java` | Main Spring Boot application entry point | Active | Starts Spring context, enables async & scheduling when configured |
| Security Configuration | `backend/src/main/java/com/pqc/core/config/SecurityConfig.java` | Spring Security filter chain, CORS, endpoint protection | Active | Configures JWT filter, stateless session management, RBAC authorization |
| JWT Handling | `backend/src/main/java/com/pqc/core/security/JwtService.java` | JWT token generation, parsing, validation | Active | HMAC-SHA256 signing using configured secret key |
| JWT Filter | `backend/src/main/java/com/pqc/core/security/JwtAuthenticationFilter.java` | Per-request bearer token authentication filter | Active | Extracts Bearer token, populates SecurityContext |
| CORS Configuration | `backend/src/main/java/com/pqc/core/config/CorsConfig.java` | Cross-Origin Resource Sharing rules | Active | Allows configured origins for customer, store, and plumber web apps |
| Controllers (29) | `backend/src/main/java/com/pqc/core/controller/*.java` | REST API endpoint handlers | Active | Includes Auth, User, Catalog, Store, ServiceOrder, MaterialPickup, Admin controllers |
| Services (24) | `backend/src/main/java/com/pqc/core/service/*.java` | Business logic layer | Active | Covers order processing, material requests, stock reservation, auth, admin functions |
| Repositories (25) | `backend/src/main/java/com/pqc/core/repository/*.java` | Spring Data JPA database repositories | Active | Access layer for PostgreSQL / H2 entities |
| Entities (46) | `backend/src/main/java/com/pqc/core/entity/*.java` | JPA domain models & Enums | Active | User, Store, Product, ServiceOrder, ProductOrder, InventoryReservation, etc. |
| DTOs (93) | `backend/src/main/java/com/pqc/core/dto/*.java` | Request & Response data transfer objects | Active | Strongly typed DTOs with Bean Validation annotations |
| Mappers / Util | `backend/src/main/java/com/pqc/core/util/*.java` | Helper utilities | Active | Includes `PhoneMaskingUtil` and data mappers |
| Exception Handling | `backend/src/main/java/com/pqc/core/exception/GlobalExceptionHandler.java` | Centralized REST error handler | Active | Converts exceptions to standard JSON error format |
| Database Migrations | `backend/src/main/resources/db/migration/V1__...` to `V19__...` | Flyway SQL database schema migrations | Active | 19 migration scripts covering schema, RBAC, pickup workflow, history |
| Feature Flags | `backend/src/main/resources/application.yml` | Application feature control | Active | `FEATURE_DELIVERY_ENABLED=false` enforces plumber self-pickup workflow |
| Health Endpoints | `backend/src/main/java/com/pqc/core/controller/HealthController.java` | Custom health & readiness checks | Active | Exposes `/health/live`, `/health/ready`, `/version` endpoints |
| Actuator Configuration | `backend/src/main/resources/application.yml` | Spring Boot Actuator settings | Active | Exposes `/actuator/health` and `/actuator/info` |
| Logging | `backend/src/main/resources/logback-spring.xml` | Logback logging configuration | Active | Configured for console output with sensitive masking |
| Redis Usage | `backend/src/main/java/com/pqc/core/service/otp/RedisOtpStore.java` | Distributed caching / OTP store | Optional | Operates with fallback when Redis is absent |
| External Integrations | `backend/src/main/java/com/pqc/core/service/GoogleTokenVerifierService.java` | Google OAuth token verification | Active | Used for customer Google authentication |
| SMS Provider | `backend/src/main/java/com/pqc/core/service/notification/*` | SMS notification abstraction | Active | Supports LocalStaging, StagingDisabled, and NoOp SMS senders |
| Integration Tests | `backend/src/test/java/com/pqc/core/...` | JUnit 5 unit & integration test suite | Active | Covers security, RBAC, workflows, migrations, controllers |
| Build Configuration | `backend/pom.xml` | Maven project descriptor | Active | Spring Boot 4.0.4, Java 17, Flyway, PostgreSQL, JWT |
| Render Configuration | `plumbing-qcommerce/render.yaml` | Render cloud infrastructure service manifest | Active | Docker runtime, rootDir backend, free tier specification |
