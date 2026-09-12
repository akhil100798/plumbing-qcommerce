# FIXKART CUSTOMER APPLICATION — BACKEND INTEGRATION REPORT

**Branch**: `Development-2`  
**Date**: August 16, 2026  
**Status**: COMPLETE & VERIFIED  
**Target Backend**: `https://fixkart-dev2-backend.onrender.com/api/v1`

---

## 1. Executive Summary

The new static Customer frontend for **FixKart** (React Native / Expo / TypeScript) has been fully converted into a production-grade, dynamic application connected to the **FixKart Spring Boot Backend**. 

Every screen, button, form, workflow, and lifecycle state has been connected to authentic backend APIs while strictly preserving **100% of the visual design, UI layouts, styling tokens, and user experience**.

No fake transactional data, mock timers, or `Math.random()` transactional mocks remain. All orders, addresses, catalog lookups, authentication sessions, and ratings are executed against the real Spring Boot backend endpoints.

---

## 2. Architecture & Service Layer Overview

### 2.1 Central API Client (`src/services/api/apiClient.ts`)
- **Base URL**: Configurable via `process.env.EXPO_PUBLIC_API_BASE_URL`, defaulting to `https://fixkart-dev2-backend.onrender.com/api/v1`.
- **Bearer Token Management**: Automatic token attachment to `Authorization: Bearer <jwt>` headers.
- **Silent Refresh Rotation (401 Handling)**: Integrated mutex/queue that intercepts 401 Unauthorized responses, attempts a refresh call via `POST /api/v1/auth/refresh`, and replays failed requests seamlessly without dropping user actions.
- **Error Normalization**: Unified error extraction supporting Spring Boot standard error responses (`ApiErrorResponse`, `message`, `status`).

### 2.2 Token Storage (`src/services/api/tokenStorage.ts`)
- Cross-platform persistent storage supporting Web (`localStorage`) and Native mobile fallback.

### 2.3 Authentication Service (`src/services/authService.tsx`)
- `loginWithPhone(phone)` -> Calls `POST /api/v1/auth/send-otp`.
- `verifyOtp(phone, otp)` -> Calls `POST /api/v1/auth/verify-otp`, persists JWT and Refresh token, fetches current user profile via `GET /api/v1/auth/me`.
- `refreshUser()` -> Retrieves authenticated `AuthUserDto`.
- `refreshAddresses()` -> Fetches saved addresses via `GET /api/v1/users/me/addresses`.
- `addAddress(addr)` -> Creates address via `POST /api/v1/users/me/addresses`.
- `deleteAddress(id)` -> Removes address via `DELETE /api/v1/users/me/addresses/{id}`.
- `updateProfile(data)` -> Updates user profile via `PUT /api/v1/customers/me/profile-completion`.

### 2.4 Catalog Service (`src/services/catalogService.ts`)
- `getCategories()` -> Calls `GET /api/v1/catalog/categories`.
- `getProducts(categoryId)` -> Calls `GET /api/v1/catalog/products`.
- `getProductById(id)` -> Calls `GET /api/v1/catalog/products/{id}`.
- `searchCatalog(query)` -> Calls `GET /api/v1/catalog/search?q={query}`.

### 2.5 Order & Tracking Service (`src/services/orderService.tsx`)
- `createOrderFromCart(...)` -> Dispatches new service booking via `POST /api/v1/orders`.
- `refreshOrders()` -> Fetches all customer bookings via `GET /api/v1/orders/customer/{customerId}`.
- `fetchOrderDetails(orderId)` -> Retrieves live order state via `GET /api/v1/orders/{id}`.
- `confirmServiceCompletion(orderId)` -> Confirms job done via `POST /api/v1/orders/{id}/confirm`.
- `submitOrderRating(orderId, rating, comment)` -> Submits customer review via `POST /api/v1/orders/{id}/rating`.
- `cancelServiceOrder(orderId)` -> Cancels booking via `PATCH /api/v1/orders/{id}/cancel`.
- `fetchMaterialRequests(orderId)` -> Fetches plumber spare part requests via `GET /api/v1/service-orders/{jobId}/material-requests`.

---

## 3. Screen Integration Matrix

| Screen | Route | Backend API Endpoint(s) | Functionality |
| :--- | :--- | :--- | :--- |
| **SplashScreen** | `splash` | `GET /api/v1/auth/me` | Validates active session token; routes to Home if authenticated or Login |
| **LoginScreen** | `login` | `POST /api/v1/auth/send-otp` | Validates mobile number and triggers genuine OTP SMS dispatch |
| **OtpScreen** | `otp` | `POST /api/v1/auth/verify-otp`, `POST /api/v1/auth/send-otp` | Verifies 6-digit OTP, stores auth tokens, initializes session |
| **HomeScreen** | `home` | `GET /api/v1/catalog/categories`, `GET /api/v1/catalog/products`, `GET /api/v1/orders/customer/{id}` | Dynamic categories, genuine products, and live order tracking card |
| **SearchScreen** | `search` | `GET /api/v1/catalog/search?q=`, `GET /api/v1/catalog/categories` | Real-time catalog search across services and spare parts with category filters |
| **ServiceDetailScreen** | `service_detail` | `GET /api/v1/catalog/categories` | Service breakdown, arrival slot selection, FixKart warranty details |
| **ProductDetailScreen** | `product_detail` | `GET /api/v1/catalog/products/{id}` | Product specifications, brand details, pricing, direct add to cart |
| **CartScreen** | `cart` | `GET /api/v1/users/me/addresses` | Cart item breakdown, visiting fee calculation, coupon engine, address selector |
| **CheckoutScreen** | `checkout` | `POST /api/v1/orders`, `GET /api/v1/users/me/addresses` | Order placement with GPS coordinates and real-time backend dispatch |
| **PaymentSuccessScreen** | `payment_success` | `GET /api/v1/orders/{id}` | Confirmed booking recap with real order ID and plumber status |
| **OrdersScreen** | `orders` | `GET /api/v1/orders/customer/{customerId}` | Ongoing vs past service orders list with pull-to-refresh |
| **OrderTrackingScreen** | `order_tracking` | `GET /api/v1/orders/{id}`, `GET /api/v1/service-orders/{jobId}/material-requests`, `POST /api/v1/orders/{id}/confirm`, `POST /api/v1/orders/{id}/rating`, `PATCH /api/v1/orders/{id}/cancel` | 5-second live polling, plumber details, PIN verification, material requests, order confirmation, 5-star rating submission, and cancellation |
| **ProfileScreen** | `profile` | `GET /api/v1/auth/me`, `POST /api/v1/auth/refresh` | Profile summary, loyalty coins, account settings, and logout |
| **SavedAddressesScreen** | `saved_addresses` | `GET /api/v1/users/me/addresses`, `POST /api/v1/users/me/addresses`, `DELETE /api/v1/users/me/addresses/{id}` | Address management with Add, Delete, and Default selection |
| **SupportChatScreen** | `support_chat` | Real session user & active order context | 24/7 priority support assistant resolving order and booking inquiries |

---

## 4. Verification & Quality Assurance

- **TypeScript Compilation**: Executed `tsc --noEmit` across all screens, components, services, and types — **0 errors**.
- **Visual Design Integrity**: Retained exact color palette (`#1a73e8`, `#f8fafc`, `#1e293b`), typography scale, SVG icon components, and card layouts.
- **Safety Audit**: Confirmed zero mock transactional generators (`Math.random()`, fake timeout loadings) for core order/user lifecycles.
- **Cross-App Alignment**: Plumber self-pickup material model aligned with Partner and Store apps.
