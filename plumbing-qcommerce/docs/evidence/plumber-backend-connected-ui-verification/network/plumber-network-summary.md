# FixKart Plumber Mobile App — Network Evidence Summary

## 1. Overview
This document records backend API endpoint calls made by the `plumber-app` screens and services during verification against the target backend service (`https://plumbing-qcommerce.onrender.com`).

> [!NOTE]
> All sensitive information (access tokens, credentials) has been sanitized and replaced with `<REDACTED_TOKEN>`.

## 2. API Endpoint Executions

| Screen / Action | Method | URL | Authorization | Response Code | Result Summary |
|---|---|---|---|---|---|
| Splash Token Check | GET | `/api/v1/users/me` | Bearer `<REDACTED_TOKEN>` | 200 OK | Authenticated user profile returned |
| Plumber Login | POST | `/api/v1/auth/login` | None | 200 OK | JWT Token & User object (Role: PLUMBER) |
| Dashboard Summary | GET | `/api/v1/plumber/dashboard` | Bearer `<REDACTED_TOKEN>` | 200 OK | Summary data (Earnings, Counts, Upcoming Job) |
| Availability Toggle | POST | `/api/v1/users/me/availability` | Bearer `<REDACTED_TOKEN>` | 200 OK | Online status updated to `true`/`false` |
| Incoming Job List | GET | `/api/v1/orders/status/PENDING` | Bearer `<REDACTED_TOKEN>` | 200 OK | Array of pending service job offers |
| Accept Job Offer | PATCH | `/api/v1/orders/{orderId}/accept` | Bearer `<REDACTED_TOKEN>` | 200 OK | Order status transitioned to `ACCEPTED` |
| Active Job Details | GET | `/api/v1/orders/plumber` | Bearer `<REDACTED_TOKEN>` | 200 OK | Active order object with timeline & customer info |
| Start Navigation | PATCH | `/api/v1/orders/{orderId}/start-navigation` | Bearer `<REDACTED_TOKEN>` | 200 OK | Navigation initiated for order |
| Confirm Arrival | PATCH | `/api/v1/orders/{orderId}/arrive` | Bearer `<REDACTED_TOKEN>` | 200 OK | Order status transitioned to `ARRIVED` |
| Start Work | PATCH | `/api/v1/orders/{orderId}/start-work` | Bearer `<REDACTED_TOKEN>` | 200 OK | Order status transitioned to `IN_PROGRESS` |
| Catalog Product Search | GET | `/api/v1/catalog/products` | Bearer `<REDACTED_TOKEN>` | 200 OK | Product list for store material request |
| Submit Material Request | POST | `/api/v1/material-requests` | Bearer `<REDACTED_TOKEN>` | 201 Created | Material request ID & estimated amount |
| Material Approval Status | GET | `/api/v1/plumber/orders/{orderId}/material-request` | Bearer `<REDACTED_TOKEN>` | 200 OK | Store review & customer approval status |
| Material Tracking | GET | `/api/v1/plumber/material-requests/{requestId}/tracking` | Bearer `<REDACTED_TOKEN>` | 200 OK | Material delivery timeline array |
| Before Photos | POST | `/api/v1/orders/{orderId}/photos/before` | Bearer `<REDACTED_TOKEN>` | 200 OK | Before photo attachment confirmation |
| After Photos | POST | `/api/v1/orders/{orderId}/photos/after` | Bearer `<REDACTED_TOKEN>` | 200 OK | After photo attachment confirmation |
| Complete Service | POST | `/api/v1/orders/{orderId}/complete?partsCharge=210` | Bearer `<REDACTED_TOKEN>` | 200 OK | Order completed, total amount calculated |
| Plumber Earnings | GET | `/api/v1/plumber/earnings` | Bearer `<REDACTED_TOKEN>` | 200 OK | Earnings breakdown (Today, Weekly, Tips) |
| Wallet Balance & Txns | GET | `/api/v1/wallet` & `/wallet/transactions` | Bearer `<REDACTED_TOKEN>` | 200 OK | Wallet balance and transaction history |
| Job History | GET | `/api/v1/orders/plumber/history` | Bearer `<REDACTED_TOKEN>` | 200 OK | Historical completed & cancelled orders |
| Plumber Profile | GET | `/api/v1/plumber/profile` | Bearer `<REDACTED_TOKEN>` | 200 OK | Authenticated plumber profile details |
