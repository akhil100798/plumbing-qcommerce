# PlumbCommerce Final Submission Report

## 1. Project Abstract
PlumbCommerce is a multi-role quick-commerce and service platform for plumbing materials and plumbing services. The system combines product ordering, store coordination, delivery management, plumber job execution, finance oversight, support operations, and marketing administration inside one integrated platform. The Phase 10 submission focuses on final demo readiness, admin portal evidence, documentation, and validation.

## 2. Problem Statement
Traditional plumbing service workflows are fragmented. Customers often need to search separately for materials, technicians, delivery options, and issue resolution support. Stores and service teams also lack a unified operational view. This creates delays, poor coordination, inconsistent follow-up, and limited visibility for administrators.

## 3. Objectives
- Provide one platform for plumbing product ordering and plumbing service booking.
- Coordinate customers, plumbers, stores, and delivery partners through shared workflows.
- Secure admin access with role-based permissions.
- Offer dashboards for operations, finance, support, plumber management, and marketing.
- Maintain auditability, controlled access, and demo-safe reporting for academic presentation.

## 4. Existing System
In a traditional approach:
- Product buying and service booking are handled separately.
- Manual calls and messaging are used for assignment and escalation.
- Refunds, tickets, and KYC are tracked inconsistently.
- Admin visibility is partial and role enforcement is weak.
- Reporting is often manual or spread across multiple tools.

## 5. Proposed System
PlumbCommerce introduces a centralized digital platform with:
- Customer ordering and service requests.
- Store and inventory coordination.
- Plumber workflow management.
- Delivery workflow support.
- Admin portal dashboards by role.
- RBAC-protected APIs and route-level access control.
- Finance, support, and marketing administration in one portal.

## 6. System Architecture
High-level architecture:
- Client apps: Customer app, Plumber app, Store app, Admin Portal.
- Backend: Spring Boot API layer with security, business workflows, and Flyway migrations.
- Data layer: PostgreSQL for transactional data, MongoDB for logs/audit-style documents, Redis for caching/pub-sub style support, Kafka for outbox/event flow.
- Edge/real-time layer: Node.js edge service for real-time and integration-oriented flows.

Request flow:
1. User authenticates and receives JWT.
2. Client calls backend APIs based on role.
3. Backend persists transactional data in PostgreSQL.
4. Logs/audit data can be pushed to MongoDB through the outbox/log flow.
5. Admin portal consumes grouped admin APIs by module.

## 7. Technology Stack
- Backend: Java 17, Spring Boot 4, Spring Security, Spring Data JPA
- Database: PostgreSQL, MongoDB
- Messaging/Cache: Kafka, Redis
- Frontend Admin Portal: Next.js 16, React 19, TypeScript
- Testing: JUnit 5, Spring Boot Test, MockMvc, Vitest/ESLint/TypeScript checks, Playwright-based screenshot capture
- DevOps: Docker Compose, Flyway

## 8. Modules
- Customer ordering and checkout
- Service job booking and fulfillment
- Store operations and stock support
- Delivery workflow support
- Super Admin management
- RBAC and admin role assignment
- Operations Admin dashboard and order/job management
- Finance Admin payments, settlements, refunds, commission reporting
- Support Admin tickets, escalations, user context
- Plumber Manager KYC, performance, earnings visibility
- Marketing Admin offers, campaigns, banners, notifications, reports

## 9. Roles and Responsibilities
- Customer: Places product orders, books plumbing jobs, raises support issues.
- Plumber: Accepts and executes service work, requests materials where needed.
- Store Manager: Manages stock and store-side fulfillment tasks.
- Delivery Partner: Handles delivery assignment and completion.
- Super Admin: Oversees users, admins, roles, and system visibility.
- Operations Admin: Monitors product orders, service jobs, material requests, and delays.
- Finance Admin: Reviews payments, settlements, payouts, and refunds.
- Support Admin: Handles tickets, escalations, communication history, and user context.
- Plumber Manager: Reviews KYC, tracks plumber availability/performance, monitors earnings.
- Marketing Admin: Manages offers, campaigns, banners, segments, notifications, and reports.

## 10. Admin Portal RBAC Matrix
| Route Group | Allowed Roles |
| --- | --- |
| `/dashboard`, `/users`, `/admins`, `/roles`, `/system-health` | `SUPER_ADMIN`, `ADMIN` |
| `/operations/**` | `SUPER_ADMIN`, `ADMIN`, `OPERATIONS_ADMIN` |
| `/finance/**` | `SUPER_ADMIN`, `ADMIN`, `FINANCE_ADMIN` |
| `/support/**` | `SUPER_ADMIN`, `ADMIN`, `SUPPORT_ADMIN` |
| `/plumber-manager/**` | `SUPER_ADMIN`, `ADMIN`, `PLUMBER_MANAGER` |
| `/marketing/**` | `SUPER_ADMIN`, `ADMIN`, `MARKETING_ADMIN` |
| `/api/v1/ai/**` | `SUPER_ADMIN`, `ADMIN`, `OPERATIONS_ADMIN`, `FINANCE_ADMIN`, `MARKETING_ADMIN`, scoped `STORE_MANAGER` only where intentionally retained |

## 11. Database Design
Primary transactional entities include:
- `users`
- `stores`
- `stocks`
- `products`, `categories`
- `product_orders`, `product_order_items`
- `service_orders`
- `refund_requests`
- `settlements`
- `support_tickets`, `support_messages`
- `plumber_kyc`
- `offers`, `marketing_campaigns`, `marketing_banners`, `marketing_notifications`
- `outbox_events`, wallet-related entities, refresh tokens, notifications

Relationships:
- One customer can have many product orders and service orders.
- One store can fulfill many orders and support many jobs.
- One plumber can be linked to many service orders and one KYC record.
- Product orders may optionally link to a service order for material requests.
- Support tickets can reference product or service workflows.

## 12. API Summary
Key admin API groups:
- `/api/v1/admin/rbac/**`
- `/api/v1/admin/super/**`
- `/api/v1/admin/operations/**`
- `/api/v1/admin/finance/**`
- `/api/v1/admin/support/**`
- `/api/v1/admin/plumber-manager/**`
- `/api/v1/admin/marketing/**`
- `/api/v1/ai/**`

Supporting APIs also cover authentication, catalog, checkout, delivery, wallet, notifications, and service workflows.

## 13. Testing Report
A detailed report is available in `docs/final-submission/testing-report.md`.
Current validated highlights:
- Backend test suite passes.
- Admin portal lint passes.
- Admin portal typecheck passes.
- Admin portal production build passes.
- Real runtime screenshot evidence was captured after seeding demo data.

## 14. Screenshots Index
The screenshot catalog is available in `docs/final-submission/screenshots-index.md`.
Image files are stored under `evidence/final-demo/admin-portal/`.

## 15. Future Scope
- Live Firebase/SMS/email notification delivery
- Full payout execution and settlement integration
- Stronger real-time edge-service health and observability
- Analytics expansion with production-grade attribution
- Advanced customer segmentation and campaign performance metrics
- Mobile app runtime smoke evidence in the same final evidence set

## 16. Conclusion
PlumbCommerce now demonstrates an end-to-end college project that combines e-commerce, service orchestration, secure admin workflows, and role-based oversight. The admin portal is ready for UAT-style presentation, and the overall project is prepared for final college demo with realistic data, captured evidence, and updated documentation.
