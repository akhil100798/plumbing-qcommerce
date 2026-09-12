# FIXKART CUSTOMER APP — API TEST MATRIX

| Feature | Endpoint | Method | Auth | Expected 2xx | Negative Test / Edge Case | UI Screen | Implemented | Tested |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Auth: Send OTP | `/api/v1/auth/send-otp` | `POST` | None | `200 OK` (`{"message": "OTP sent successfully"}`) | Invalid phone format (`400 Bad Request`) | `LoginScreen` | Yes | Yes |
| Auth: Verify OTP | `/api/v1/auth/verify-otp` | `POST` | None | `200 OK` (`token`, `refreshToken`, `userId`) | Invalid/expired OTP code (`400 Bad Request`) | `OtpScreen` | Yes | Yes |
| Auth: Token Refresh | `/api/v1/auth/refresh` | `POST` | None | `200 OK` (`token`, `refreshToken`) | Expired/invalid refresh token (`401 Unauthorized`) | Central `apiClient` | Yes | Yes |
| Profile: Current User | `/api/v1/auth/me` | `GET` | `Bearer` | `200 OK` (`AuthUserDto`) | Missing/invalid token (`401 Unauthorized`) | `ProfileScreen`, App Startup | Yes | Yes |
| Profile: Completion | `/api/v1/customers/me/profile-completion` | `PUT` | `Bearer` | `200 OK` (`User`) | Invalid/missing fields (`400 Bad Request`) | `ProfileScreen` | Yes | Yes |
| Address: List | `/api/v1/users/me/addresses` | `GET` | `Bearer` | `200 OK` (`List<UserAddress>`) | Unauthenticated (`401`) | `SavedAddressesScreen`, `HomeScreen` | Yes | Yes |
| Address: Add | `/api/v1/users/me/addresses` | `POST` | `Bearer` | `200 OK` (`UserAddress`) | Missing address line/phone (`400`) | `SavedAddressesScreen` | Yes | Yes |
| Address: Delete | `/api/v1/users/me/addresses/{id}` | `DELETE` | `Bearer` | `200 OK` | Address not owned by user (`403 Forbidden`) | `SavedAddressesScreen` | Yes | Yes |
| Catalog: Categories | `/api/v1/catalog/categories` | `GET` | None | `200 OK` (`List<CategoryDTO>`) | Server error (`500`) | `HomeScreen`, `SearchScreen` | Yes | Yes |
| Catalog: Products | `/api/v1/catalog/products` | `GET` | None | `200 OK` (`List<ProductDTO>`) | Category filtering query param | `HomeScreen`, `SearchScreen` | Yes | Yes |
| Catalog: Product Detail | `/api/v1/catalog/products/{id}` | `GET` | None | `200 OK` (`ProductDTO`) | Non-existent product ID (`404`) | `ProductDetailScreen` | Yes | Yes |
| Catalog: Search | `/api/v1/catalog/search` | `GET` | None | `200 OK` (`List<ProductDTO>`) | Query parameter `q` | `SearchScreen` | Yes | Yes |
| Order: Create Service Order | `/api/v1/orders` | `POST` | `Bearer` | `200 OK` (`ServiceOrder`) | Missing description/coords (`400`) | `CheckoutScreen` | Yes | Yes |
| Order: List Customer Orders | `/api/v1/orders/customer/{customerId}` | `GET` | `Bearer` | `200 OK` (`List<ServiceOrder>`) | Unauthorized customer access (`403`) | `OrdersScreen` | Yes | Yes |
| Order: Get Details | `/api/v1/orders/{id}` | `GET` | `Bearer` | `200 OK` (`ServiceOrder`) | Non-existent order ID (`404`) | `OrderTrackingScreen` | Yes | Yes |
| Order: Status History | `/api/v1/orders/{id}/history` | `GET` | `Bearer` | `200 OK` (`List<StatusHistory>`) | Non-existent order ID (`404`) | `OrderTrackingScreen` | Yes | Yes |
| Order: Cancel | `/api/v1/orders/{id}/cancel` | `PATCH` | `Bearer` | `200 OK` (`ServiceOrder`) | Invalid state cancellation (`400`) | `OrderTrackingScreen` | Yes | Yes |
| Order: Customer Confirm | `/api/v1/orders/{id}/confirm` | `POST` | `Bearer` | `200 OK` (`CustomerConfirmationResponse`) | Order not in completed state (`400`) | `OrderTrackingScreen` | Yes | Yes |
| Order: Rating Submit | `/api/v1/orders/{id}/rating` | `POST` | `Bearer` | `200 OK` (`RatingResponse`) | Rating < 1 or > 5 (`400`) | `OrderTrackingScreen` | Yes | Yes |
| Order: Rating Get | `/api/v1/orders/{id}/rating` | `GET` | `Bearer` | `200 OK` (`RatingResponse`) | No rating submitted yet (`404`) | `OrderTrackingScreen` | Yes | Yes |
| Materials: Job Requests | `/api/v1/service-orders/{jobId}/material-requests` | `GET` | `Bearer` | `200 OK` (`List<MaterialRequestSummaryResponse>`) | Unrelated customer access (`403`) | `OrderTrackingScreen` | Yes | Yes |
| Notifications: List | `/api/v1/notifications` | `GET` | `Bearer` | `200 OK` (`List<Notification>`) | Unauthenticated (`401`) | `HomeScreen` | Yes | Yes |
| Notifications: Mark Read | `/api/v1/notifications/{id}/read` | `PATCH` | `Bearer` | `200 OK` (`Notification`) | Notification not owned by user (`403`) | Notifications UI | Yes | Yes |
| Notifications: Mark All Read | `/api/v1/notifications/read-all` | `PATCH` | `Bearer` | `200 OK` | Unauthenticated (`401`) | Notifications UI | Yes | Yes |
