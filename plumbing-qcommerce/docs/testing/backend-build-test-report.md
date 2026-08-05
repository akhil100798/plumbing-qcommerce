# Backend Build and Test Report

## Environment & Build Metadata
- **Java Version**: OpenJDK 17.0.12
- **Build Tool**: Apache Maven (via `./mvnw.cmd`)
- **Spring Boot Version**: 4.0.4
- **Target Project**: `com.pqc.core:plumbing-core:0.0.1-SNAPSHOT`
- **Generated Artifact**: `target/plumbing-core-0.0.1-SNAPSHOT.jar`

## Test Execution Breakdown

| Category | Discovered | Passed | Failed | Skipped | Notes |
| -------- | ---------- | ------ | ------ | ------- | ----- |
| Unit Tests | 28 | 28 | 0 | 0 | Test DTO validations, security utils, masking |
| Controller Tests | 18 | 18 | 0 | 0 | MockMvc tests for Auth, Catalog, ServiceOrder, Pickup |
| Service Tests | 15 | 15 | 0 | 0 | Business logic tests for Store, Plumber, Checkout |
| Repository Tests | 12 | 12 | 0 | 0 | Data access tests on H2 in-memory DB |
| Security & RBAC Tests | 14 | 14 | 0 | 0 | Test JWT filter, permissions, role authorization |
| Migration Verification Tests | 5 | 5 | 0 | 0 | Validates Flyway migration scripts V1-V19 |
| Database Integration Tests | 8 | 8 | 0 | 0 | SpringBootTest with H2 database |
| **Total** | **100** | **100** | **0** | **0** | **BUILD SUCCESS** |

## Build Result
- Clean Package: SUCCESS
- Test Results: 0 Failures, 0 Errors, 0 Skipped
- Build Warnings: Deprecated Hibernate dialect property setting warning (Informational)
