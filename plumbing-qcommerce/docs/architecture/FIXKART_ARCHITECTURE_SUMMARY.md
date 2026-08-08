# FixKart Executive Architecture Summary (`FIXKART_ARCHITECTURE_SUMMARY.md`)

This executive summary outlines the overall system architecture, application boundaries, data storage, communication mechanisms, state machines, and deployment configuration of the FixKart platform.

---

### 1. What is FixKart?
FixKart is a Quick-Commerce Plumbing & Repair On-Demand Platform. It connects customers needing plumbing services with qualified local plumbers and nearby plumbing hardware stores for instant material fulfillment and repair execution.

---

### 2. What applications exist?
FixKart comprises four front-end applications:
1. **Customer Web / Mobile App** (`customer-app`): Serves customers booking plumbing services, browsing products, placing orders, and tracking plumber status.
2. **Plumber Web / Mobile App** (`plumber-app`): Serves field plumbers managing assigned jobs, setting availability, submitting diagnostic logs, requesting required materials, and performing store self-pickups.
3. **Store Web / Mobile App** (`store-app`): Serves store managers managing hardware stock, reviewing material requests, preparing items, and verifying self-pickup OTP codes.
4. **Admin Portal** (`admin-portal`): Next.js console for platform administrators handling KYC verification, store stock onboarding, user roles, pricing, and analytics.

---

### 3. What is the backend?
The core backend (`backend`) is a Spring Boot 4.0.4 application written in Java 17 using Maven. It handles REST API routing, business domain services, state machines, Flyway database schema migrations, and Spring Security role-based access control (RBAC).

---

### 4. What database is used?
- **Primary Relational Database**: PostgreSQL (version 15+) managed via Flyway DDL migration scripts (`V1__init_schema.sql` through `V19__add_rating_and_service_order_history.sql`).
- **Cache Engine**: Redis (configured for token management & transient cache).
- **Auxiliary Document Store**: MongoDB (configured for extended telemetry logs).

---

### 5. How do applications communicate?
The frontend applications (`customer-app`, `plumber-app`, `store-app`, `admin-portal`) communicate with the backend exclusively via **HTTPS REST APIs** (`/api/v1/*`). Cross-application state updates are synchronized via near real-time state fetching and polling against backend endpoints.

---

### 6. How is authentication handled?
Authentication is stateless and uses **JWT Bearer tokens** issued by `AuthController`:
- **Access Token**: Short-lived (15 minutes) signed token sent in the `Authorization: Bearer <token>` HTTP header.
- **Refresh Token**: Long-lived (7 days) token stored securely (`expo-secure-store`) for silent token renewal via `POST /api/v1/auth/refresh`.
- **RBAC Roles**: `CUSTOMER`, `PLUMBER`, `STORE_MANAGER`, `SUPER_ADMIN`, `ADMIN`, `OPERATIONS_ADMIN`, `FINANCE_ADMIN`, `SUPPORT_ADMIN`, `PLUMBER_MANAGER`, `MARKETING_ADMIN`.

---

### 7. How does a service job flow?
```text
REQUESTED ──> ASSIGNED ──> EN_ROUTE ──> ARRIVED ──> DIAGNOSING
                                                         │
               ┌─────────────────────────────────────────┴────────────────────────────────────────┐
               ▼ (Materials Required)                                                             ▼ (No Materials)
    MATERIAL_SELECTION ──> WAITING_FOR_MATERIALS ──> IN_PROGRESS ──> COMPLETED           IN_PROGRESS ──> COMPLETED
```
1. Customer books a plumbing repair (`REQUESTED`).
2. Available Plumber accepts the request (`ASSIGNED`).
3. Plumber travels (`EN_ROUTE`) and arrives (`ARRIVED`).
4. Plumber inspects the issue (`DIAGNOSING`).
5. If materials are required, plumber submits a Material Request (`MATERIAL_SELECTION` $\rightarrow$ `WAITING_FOR_MATERIALS`).
6. Plumber collects materials from the store, returns to job site (`IN_PROGRESS`), completes work, and marks job `COMPLETED`.

---

### 8. How do material requests & self-pickups work?
1. Plumber submits a material request to a specific Store for job items (`REQUESTED`).
2. Store Manager reviews and approves the request (`APPROVED`), reserving stock items (`RESERVED`).
3. Store staff prepares the material package (`PREPARING`) and generates a 4-digit pickup OTP (`READY_FOR_PICKUP`).
4. Plumber arrives at the physical store, presents the OTP to the Store Manager.
5. Store Manager enters the OTP in `store-app` (`POST /api/v1/materials/pickup/confirm`).
6. Backend validates OTP, transitions material request status to `COLLECTED`, and converts reserved inventory to `FULFILLED`.

---

### 9. How is the system deployed?
- **Backend API**: Deployed on **Render** (`https://plumbing-qcommerce.onrender.com`) running as a Dockerized Spring Boot service connected to a Render Managed PostgreSQL database.
- **Frontend Applications**: Deployed on **Vercel Edge Network**:
  - Customer Web: `https://fixkart-customer-web.vercel.app`
  - Plumber Web: `https://fixkart-plumber-web.vercel.app`
  - Store Web: `https://fixkart-store-web.vercel.app`
- **CI/CD Pipeline**: GitHub Actions triggered on pushes to the `Development` branch to build, typecheck (`tsc --noEmit`), test (`vitest`), and trigger automated deployments.
