# FIXKART CUSTOMER APP — BACKEND INTEGRATION CONTRACT MATRIX

## 1. Authentication & Session Management

| Feature | Screen | User Action | HTTP Method | Endpoint | Request Body | Response Payload | Auth Required | Status Code | Error Handling |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Send OTP | `LoginScreen` | Enter 10-digit mobile & click "Get OTP" | `POST` | `/api/v1/auth/send-otp` | `{"phone": "9876511223"}` | `{"message": "OTP sent successfully"}` | None | `200 OK` | `400 Bad Request` if invalid phone |
| Verify OTP | `OtpScreen` | Enter 6-digit OTP & click "Verify & Proceed" | `POST` | `/api/v1/auth/verify-otp` | `{"phone": "9876511223", "code": "123456"}` | `{"token": "...", "refreshToken": "...", "userId": 1, "role": "CUSTOMER", "email": "..."}` | None | `200 OK` | `400 Bad Request` on invalid/expired OTP |
| Token Refresh | API Client (Automatic) | Token expired on API call (401) | `POST` | `/api/v1/auth/refresh` | `{"refreshToken": "..."}` | `{"token": "...", "refreshToken": "..."}` | None | `200 OK` | `401 Unauthorized` (triggers logout) |
| Get Current User | `ProfileScreen`, `App` startup | App launch / Profile view | `GET` | `/api/v1/auth/me` | None | `{"id": 1, "email": "...", "fullName": "...", "role": "CUSTOMER", "phone": "...", "profileComplete": true, "status": "ACTIVE"}` | `Bearer <token>` | `200 OK` | `401 Unauthorized` |
| Complete Profile | `ProfileScreen` | Update profile information | `PUT` | `/api/v1/customers/me/profile-completion` | `{"fullName": "...", "phone": "...", "addressLine1": "...", "landmark": "...", "city": "...", "state": "...", "pincode": "..."}` | `User` entity | `Bearer <token>` | `200 OK` | `400 Bad Request` |

---

## 2. Address Management

| Feature | Screen | User Action | HTTP Method | Endpoint | Request Body | Response Payload | Auth Required | Status Code | Error Handling |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| List Addresses | `SavedAddressesScreen`, `HomeScreen`, `CartScreen`, `CheckoutScreen` | Load saved addresses | `GET` | `/api/v1/users/me/addresses` | None | `[{"id": 1, "label": "Home", "name": "...", "addressLine": "...", "phone": "..."}]` | `Bearer <token>` | `200 OK` | `401 Unauthorized` |
| Add Address | `SavedAddressesScreen` | Fill address form and click "Save Address" | `POST` | `/api/v1/users/me/addresses` | `{"label": "Home", "name": "...", "addressLine": "Flat 402, Sunshine Residency, HSR Layout, Bengaluru - 560102", "phone": "9876511223"}` | `UserAddress` entity with `id` | `Bearer <token>` | `200 OK` | `400 Bad Request` |
| Delete Address | `SavedAddressesScreen` | Click Delete icon | `DELETE` | `/api/v1/users/me/addresses/{id}` | None | Empty | `Bearer <token>` | `200 OK` | `403 Forbidden`, `404 Not Found` |

---

## 3. Catalog & Products

| Feature | Screen | User Action | HTTP Method | Endpoint | Request Body | Response Payload | Auth Required | Status Code | Error Handling |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Get Categories | `HomeScreen`, `SearchScreen` | Initial load / view categories | `GET` | `/api/v1/catalog/categories` | None | `[{"id": 1, "name": "Pipes & Fittings", "description": "...", "parentId": null}]` | None | `200 OK` | `500 Internal Error` |
| Get Products | `HomeScreen`, `SearchScreen`, `CategoryScreen` | View catalog / filter by category | `GET` | `/api/v1/catalog/products?categoryId={id}` | None | `[{"id": 1, "sku": "...", "name": "...", "description": "...", "price": 420.00, "imageUrl": "...", "categoryId": 1, "categoryName": "..."}]` | None | `200 OK` | `500 Internal Error` |
| Get Product Detail | `ProductDetailScreen` | Select product item | `GET` | `/api/v1/catalog/products/{id}` | None | `ProductDTO` entity | None | `200 OK` | `404 Not Found` |
| Search Catalog | `SearchScreen` | Enter search term | `GET` | `/api/v1/catalog/search?q={query}` | None | `List<ProductDTO>` | None | `200 OK` | `500 Internal Error` |

---

## 4. Service Requests & Order Management

| Feature | Screen | User Action | HTTP Method | Endpoint | Request Body | Response Payload | Auth Required | Status Code | Error Handling |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Create Service Order | `CheckoutScreen` | Click "Book & Dispatch Plumber" | `POST` | `/api/v1/orders` | `{"description": "Tap & Faucet Repair...", "latitude": 12.9141, "longitude": 77.6411, "requestType": "NEARBY_AUTO"}` | `ServiceOrder` entity with `id`, `status: "PENDING"`, timestamps | `Bearer <token>` | `200 OK` | `400 Bad Request` |
| List Customer Orders | `OrdersScreen` | View Ongoing / Past bookings | `GET` | `/api/v1/orders/customer/{customerId}` | None | `List<ServiceOrder>` | `Bearer <token>` | `200 OK` | `401 Unauthorized` |
| Get Order Details | `OrderTrackingScreen` | Open order tracking screen | `GET` | `/api/v1/orders/{id}` | None | `ServiceOrder` (includes customer, plumber, store, status, timestamps) | `Bearer <token>` | `200 OK` | `404 Not Found` |
| Order Status History | `OrderTrackingScreen` | View timeline progression | `GET` | `/api/v1/orders/{id}/history` | None | `[{"id": 1, "previousStatus": "PENDING", "newStatus": "ACCEPTED", "timestamp": "...", "actorRole": "PLUMBER", "reason": "..."}]` | `Bearer <token>` | `200 OK` | `404 Not Found` |
| Cancel Order | `OrderTrackingScreen` | Click Cancel Booking | `PATCH` | `/api/v1/orders/{id}/cancel` | None | `ServiceOrder` with `status: "CANCELLED"` | `Bearer <token>` | `200 OK` | `400 Conflict` (if non-cancellable) |
| Confirm Service Completion | `OrderTrackingScreen` | Confirm work done after plumber completes | `POST` / `PATCH` | `/api/v1/orders/{id}/confirm` | None | `{"orderId": 1, "status": "CUSTOMER_CONFIRMED", "message": "Order confirmed by customer", "timestamp": "..."}` | `Bearer <token>` | `200 OK` | `400 Conflict` |
| Submit Rating | `OrderTrackingScreen` | Select star rating & submit review | `POST` | `/api/v1/orders/{id}/rating` | `{"rating": 5, "comment": "Excellent service!"}` | `{"orderId": 1, "rating": 5, "comment": "...", "ratedAt": "..."}` | `Bearer <token>` | `200 OK` | `400 Bad Request` |
| Get Rating | `OrderTrackingScreen` | View submitted rating | `GET` | `/api/v1/orders/{id}/rating` | None | `RatingResponse` | `Bearer <token>` | `200 OK` | `404 Not Found` |

---

## 5. Material Request Tracking & Approval

| Feature | Screen | User Action | HTTP Method | Endpoint | Request Body | Response Payload | Auth Required | Status Code | Error Handling |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| View Job Material Requests | `OrderTrackingScreen` | Material request active on order | `GET` | `/api/v1/service-orders/{jobId}/material-requests` | None | `[{"id": 101, "storeId": 2, "storeName": "FixKart Central", "itemCount": 2, "totalAmount": 160.00, "status": "REQUESTED" \| "APPROVED" \| ...}]` | `Bearer <token>` | `200 OK` | `404 Not Found` |
| Customer Material Orders | `OrderTrackingScreen` | Fetch customer material requests | `GET` | `/api/v1/checkout/material-requests/customer` | None | `List<OrderDetailResponse>` | `Bearer <token>` | `200 OK` | `401 Unauthorized` |
| Material Request History | `OrderTrackingScreen` | View material status progression | `GET` | `/api/v1/material-requests/{requestId}/history` | None | `List<MaterialStatusHistoryResponse>` | `Bearer <token>` | `200 OK` | `404 Not Found` |

---

## 6. Notifications

| Feature | Screen | User Action | HTTP Method | Endpoint | Request Body | Response Payload | Auth Required | Status Code | Error Handling |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| List Notifications | `HomeScreen` (Notification modal/badge) | Open notifications | `GET` | `/api/v1/notifications` | None | `[{"id": 1, "title": "...", "message": "...", "read": false, "createdAt": "..."}]` | `Bearer <token>` | `200 OK` | `401 Unauthorized` |
| Mark Notification Read | Notifications | Click notification | `PATCH` | `/api/v1/notifications/{id}/read` | None | `Notification` | `Bearer <token>` | `200 OK` | `404 Not Found` |
| Mark All Read | Notifications | Click Mark all as read | `PATCH` | `/api/v1/notifications/read-all` | None | None | `Bearer <token>` | `200 OK` | `401 Unauthorized` |

---

## 7. Gaps & Deferred Scopes

- **Payment Gateway Processing**: Backend has mock `/api/v1/payments/process`. Real external payment gateways (Stripe/Razorpay live cards) remain deferred.
- **Marketing / Promotions**: Referral promo codes are visual UI components; marketing admin engine remains deferred.
- **Delivery Partner / Rider Dispatch**: Explicitly deferred. Material fulfillment follows Plumber self-pickup from Store.
