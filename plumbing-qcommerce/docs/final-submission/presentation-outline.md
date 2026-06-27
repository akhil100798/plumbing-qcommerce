# Presentation Outline

## Slide 1 - Title
- PlumbCommerce
- Smart plumbing quick-commerce and service management platform
- Final year / college project presentation

## Slide 2 - Problem Statement
- Separate systems for products, plumbers, delivery, refunds, and support create delays and poor coordination.

## Slide 3 - Proposed Solution
- Unified platform connecting customer demand, store supply, plumber execution, delivery coordination, and secure admin control.

## Slide 4 - System Architecture
- Client apps + Admin Portal + Spring Boot backend + PostgreSQL + MongoDB + Redis + Kafka + Edge Service.

## Slide 5 - User Roles
- Customer
- Plumber
- Store Manager
- Delivery Partner
- Admin roles by module

## Slide 6 - Customer App
- Browse products
- Place orders
- Book plumbing services
- Raise support issues

## Slide 7 - Plumber App
- Accept jobs
- Track active work
- Handle material-linked service flow
- Monitor availability and performance

## Slide 8 - Store App
- Manage stock
- Fulfill product orders
- Coordinate store-routed service support

## Slide 9 - Admin Portal
- Central dashboarding for super admin, operations, finance, support, plumber manager, and marketing roles

## Slide 10 - RBAC Security
- Route-group access control
- Role-specific admin permissions
- Forbidden access checks and scoped AI access

## Slide 11 - Backend APIs
- Authentication
- Admin modules
- Catalog and checkout
- Delivery, service jobs, refunds, and support APIs

## Slide 12 - Database Design
- Users, orders, service jobs, settlements, refunds, tickets, KYC, marketing entities, outbox/events

## Slide 13 - Real-time Edge Service
- Intended for real-time and integration-oriented flows
- Mention local health/runtime follow-up as future hardening area

## Slide 14 - AI Analytics
- Admin-visible AI route group
- Demand, forecasting, and admin analytics support

## Slide 15 - Testing
- Backend automated tests
- Frontend lint/typecheck/build
- Runtime role-based screenshot validation

## Slide 16 - Screenshots
- Login
- Super Admin pages
- Operations, Finance, Support, Plumber Manager, Marketing pages
- Forbidden access example

## Slide 17 - Future Scope
- Live notification delivery
- Full payout integration
- Richer analytics and attribution
- Expanded real-time observability

## Slide 18 - Conclusion
- PlumbCommerce is ready for final college demo and the admin portal is ready for UAT-oriented presentation.
