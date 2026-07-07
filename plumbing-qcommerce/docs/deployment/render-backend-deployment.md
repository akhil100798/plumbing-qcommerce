# Render Backend Deployment Guide

This guide details the deployment of the PlumbCommerce Spring Boot backend to Render.

## 1. Staging Environment Details

- **Staging URL**: `https://plumbing-qcommerce.onrender.com`
- **Database**: Render PostgreSQL instance
- **Memory/CPU**: Starter tier (ideal for staging demo load)

## 2. Configuration Env Variables

When deploying on Render, configure the following Environment Variables in the Render Dashboard:

```env
SPRING_PROFILES_ACTIVE=prod,staging
APP_MOBILE_DEMO_SEED_ENABLED=true
SPRING_DATASOURCE_URL=jdbc:postgresql://<db-host>/<db-name>
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=<db-password>
JWT_SECRET=<secure-random-jwt-signing-secret>
```

## 3. Build & Run Command

- **Build Command**: `./mvnw clean package -DskipTests`
- **Start Command**: `java -jar target/plumbing-qcommerce-0.0.1-SNAPSHOT.jar`

## 4. Phase 14G Enhancements

- Added staging demo seeder support for E2E flows (seeded customer, plumber, store accounts, inventory, and a pending service order).
- Exposed endpoint `/api/v1/delivery/partners` allowing store managers and admins to query active delivery riders.
- Enabled manual assignment of delivery partners via `/api/v1/delivery/{orderId}/assign?partnerId={id}` for staging workflows.
