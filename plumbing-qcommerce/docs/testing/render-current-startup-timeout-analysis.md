# Render Startup Timeout Root Cause Analysis

## 1. Executive Summary

During deployment on Render free tier, the Spring Boot application initialized Tomcat and the `Root WebApplicationContext` but did not complete startup or bind the listening HTTP socket before Render's health check/port scan timeout (60–120s limit).

---

## 2. Startup Timeline & Stage Breakdown

| Timestamp Stage | Startup Stage | Duration | Result | Blocking Reason |
| --------------- | ------------- | -------: | ------ | --------------- |
| JVM Entry | `java -jar app.jar` | 0 ms | SUCCESS | Container boot |
| Spring Boot Init | `SpringApplication.run()` | ~500 ms | SUCCESS | Environment loading |
| Web Server Init | `Tomcat initialized with port: 10000` | ~2,100 ms | SUCCESS | Servlet engine creation |
| Context Reflection | Un-scoped Repository Scanning (JPA + Mongo + Redis) | ~35,000 ms | DELAY | Reflection & BeanDef scanning across `com.pqc.core` |
| Context Wiring | `Root WebApplicationContext initialization` | 58,594 ms | DELAY | Total context assembly time |
| DB / Flyway / Beans | Hikari Pool + Flyway + JPA EntityManagerFactory | > 60,000 ms | TIMEOUT | Render port scan timeout triggered before Tomcat started listener |
| Final Outcome | Render Port Scanner | Timeout | **FAILED** | No open HTTP port 10000 detected before timeout limit |

---

## 3. Key Log Evidence & Analysis

### What Was Logged
```text
Spring Boot: 4.0.4
Java: 17
Tomcat initialized with port: 10000
Root WebApplicationContext initialization: 58,594 ms
MongoDB repository scan: 2 repositories found
Redis repository scan: 0 repositories found
Render result: Port scan timeout / No open ports detected
```

### What Was Missing
```text
Tomcat started on port 10000 (http)
Started PlumbingCoreApplication in XX.XXX seconds
```

---

## 4. Root Cause Classification

1. **Un-scoped Spring Data Repository Scanning**:
   - `com.pqc.core` was recursively scanned by JPA, MongoDB, and Redis repositories simultaneously.
   - Spring Data Redis spent time looking for `@RedisHash` entities (finding 0).
   - Spring Data JPA inspected Mongo document repositories, and Mongo inspected 28 JPA repositories.

2. **Dual Profile Activation (`prod,staging`)**:
   - `render.yaml` was activating `SPRING_PROFILES_ACTIVE=prod,staging`.
   - Running dual profiles added property resolution and bean override evaluations during startup.

3. **Cumulative Startup Delay Exceeding Render Port Probe Window**:
   - Total context setup took over 58 seconds. When HikariCP connection establishment and Flyway migration validation run sequentially after context init, total boot time exceeded Render's port scan window.

---

## 5. Remediation Plan

1. **Scope JPA Repositories**: `@EnableJpaRepositories(basePackages = "com.pqc.core.repository")`
2. **Scope Mongo Repositories**: `@EnableMongoRepositories(basePackages = "com.pqc.core.document")`
3. **Disable Redis Repository Scanning**: `spring.data.redis.repositories.enabled=false`
4. **Single Active Profile**: Set `SPRING_PROFILES_ACTIVE=prod` in `render.yaml`
5. **Startup Duration Logger**: Log explicit `[STARTUP]` markers using `ApplicationReadyEvent`
