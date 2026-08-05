# Backend Security Audit

## Security Mechanisms & Compliance Audit

### 1. Authentication & JWT Safety
- **JWT Key Signature**: Uses HMAC-SHA256 via `Keys.hmacShaKeyFor(jwtSecret.getBytes())`.
- **Token Expiration**: Access tokens expire in 86400 seconds (24 hours).
- **Refresh Token Rotation**: Refresh tokens are stored in the database (`RefreshToken` entity) and revoked/rotated upon reuse. Old refresh token reuse attempts trigger immediate invalidation.
- **Logout Handling**: `/api/v1/auth/logout` invalidates the active refresh token and purges the SecurityContext.

### 2. Password Hashing & Secret Exposure
- **PasswordEncoder**: `BCryptPasswordEncoder` used for user registration and authentication.
- **Log Masking**: Sensitive parameters (tokens, passwords, authorization headers) are masked in logs via `PhoneMaskingUtil` and logback configuration.
- **Repository Secret Audit**: `git grep` verified zero plaintext passwords or active cloud credentials in source code.

### 3. Authorization & IDOR Protection
- **Role Check Enforcement**: Endpoint protection rules in `SecurityConfig.java` strictly enforce role checks (`hasRole('ADMIN')`, `hasRole('STORE_MANAGER')`, `hasRole('PLUMBER')`, `hasRole('CUSTOMER')`).
- **Resource Ownership Validation**: `ServiceOrderService` and `PlumberMaterialService` verify resource ownership (`order.getCustomer().getId().equals(currentUser.getId())`).

### 4. Input Validation & Exception Protection
- **Bean Validation**: DTOs use `@NotNull`, `@NotBlank`, `@Size`, `@Pattern`, `@Min`, `@Positive`.
- **Global Error Handling**: `GlobalExceptionHandler` sanitizes error responses to prevent stack trace leaks in API error payloads.

### 5. Dependency & Actuator Security
- **Actuator Exposure**: `/actuator/health` and `/actuator/info` are safe read-only endpoints. Sensitive environment or heap endpoints are restricted.
- **Dependency Audit**: Spring Boot 4.0.4, Spring Security, Jackson, JJWT 0.11.5 up to date.
