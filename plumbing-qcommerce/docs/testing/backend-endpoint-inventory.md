# Backend Endpoint Inventory (Exact Controller Mappings)

## Endpoint Inventory Table

| Method | Exact Route | Controller | Allowed Roles | Request DTO / Body | Response DTO | Tested on Render | Result |
| ------ | ----------- | ---------- | ------------- | ------------------ | ------------ | ---------------- | ------ |
| `GET` | `/health/live` | `HealthController` | Public | None | `Map<String, Object>` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `GET` | `/health/ready` | `HealthController` | Public | None | `Map<String, Object>` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `GET` | `/version` | `HealthController` | Public | None | `Map<String, Object>` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `GET` | `/actuator/health` | Spring Actuator | Public | None | `Map<String, Object>` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `GET` | `/actuator/info` | Spring Actuator | Public | None | `Map<String, Object>` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `POST` | `/api/v1/auth/register` | `AuthController` | Public | `CustomerRegistrationRequest` | `AuthResponse` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `POST` | `/api/v1/auth/login` | `AuthController` | Public | `Map<String, String>` | `AuthResponse` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `POST` | `/api/v1/auth/refresh` | `AuthController` | Public | `Map<String, String>` | `AuthResponse` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `POST` | `/api/v1/auth/logout` | `AuthController` | Public | `Map<String, String>` | `Map<String, String>` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `GET` | `/api/v1/users/me` | `UserController` | Authenticated | None | `User` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `GET` | `/api/v1/customer/profile` | `CustomerProfileController` | `ROLE_CUSTOMER` | None | `User` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `GET` | `/api/v1/catalog/categories` | `CatalogController` | Public | None | `List<CategoryDTO>` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `GET` | `/api/v1/catalog/products` | `CatalogController` | Public | None | `List<ProductDTO>` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `GET` | `/api/v1/catalog/products/{id}` | `CatalogController` | Public | None | `ProductDTO` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `GET` | `/api/v1/catalog/search` | `CatalogController` | Public | None | `List<ProductDTO>` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `GET` | `/api/v1/stores` | `StoreController` | Public | None | `List<Store>` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `GET` | `/api/v1/stores/{id}` | `StoreController` | Public | None | `Store` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `GET` | `/api/v1/stores/{id}/inventory` | `StoreController` | `ROLE_STORE_MANAGER`, `ROLE_ADMIN` | None | `List<Stock>` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `PUT` | `/api/v1/stores/{id}/inventory/{productId}` | `StoreController` | `ROLE_STORE_MANAGER`, `ROLE_ADMIN` | `StockUpdateRequest` | `Stock` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `POST` | `/api/v1/service-orders` | `ServiceOrderController` | `ROLE_CUSTOMER` | `CreateOrderRequest` | `ServiceOrder` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `GET` | `/api/v1/service-orders/customer` | `ServiceOrderController` | `ROLE_CUSTOMER` | None | `List<ServiceOrder>` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `GET` | `/api/v1/service-orders/{id}` | `ServiceOrderController` | Authenticated | None | `ServiceOrder` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `POST` | `/api/v1/service-orders/{id}/cancel` | `ServiceOrderController` | `ROLE_CUSTOMER`, `ROLE_ADMIN` | None | `ServiceOrder` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `POST` | `/api/v1/service-orders/{id}/rate` | `ServiceOrderController` | `ROLE_CUSTOMER` | `RatingRequest` | `RatingResponse` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `GET` | `/api/v1/plumber/jobs` | `PlumberController` | `ROLE_PLUMBER` | None | `List<ServiceOrder>` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `POST` | `/api/v1/plumber/jobs/{id}/accept` | `PlumberController` | `ROLE_PLUMBER` | None | `ServiceOrder` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `POST` | `/api/v1/plumber/jobs/{id}/start` | `PlumberController` | `ROLE_PLUMBER` | None | `ServiceOrder` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `POST` | `/api/v1/plumber/jobs/{id}/complete` | `PlumberController` | `ROLE_PLUMBER` | None | `ServiceOrder` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `GET` | `/api/v1/service-orders/{jobId}/material-requests` | `MaterialPickupController` | Authenticated | None | `List<MaterialRequestSummaryResponse>` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `POST` | `/api/v1/material-requests/{id}/submit` | `MaterialPickupController` | `ROLE_PLUMBER` | None | `MaterialRequestDetailResponse` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `GET` | `/api/v1/plumber/material-requests` | `MaterialPickupController` | `ROLE_PLUMBER` | None | `List<MaterialRequestSummaryResponse>` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `GET` | `/api/v1/plumber/material-requests/{id}` | `MaterialPickupController` | `ROLE_PLUMBER` | None | `MaterialRequestDetailResponse` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `GET` | `/api/v1/store/material-requests` | `MaterialPickupController` | `ROLE_STORE_MANAGER` | None | `List<MaterialRequestSummaryResponse>` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `GET` | `/api/v1/store/material-requests/{id}` | `MaterialPickupController` | `ROLE_STORE_MANAGER` | None | `MaterialRequestDetailResponse` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `POST` | `/api/v1/store/material-requests/{id}/approve` | `MaterialPickupController` | `ROLE_STORE_MANAGER` | None | `MaterialRequestDetailResponse` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `POST` | `/api/v1/store/material-requests/{id}/partially-approve` | `MaterialPickupController` | `ROLE_STORE_MANAGER` | `PartialApproval` | `MaterialRequestDetailResponse` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `POST` | `/api/v1/store/material-requests/{id}/reject` | `MaterialPickupController` | `ROLE_STORE_MANAGER` | `Reason` | `MaterialRequestDetailResponse` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `POST` | `/api/v1/store/material-requests/{id}/reserve` | `MaterialPickupController` | `ROLE_STORE_MANAGER` | None | `MaterialRequestDetailResponse` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `POST` | `/api/v1/store/material-requests/{id}/prepare` | `MaterialPickupController` | `ROLE_STORE_MANAGER` | None | `MaterialRequestDetailResponse` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `POST` | `/api/v1/store/material-requests/{id}/ready-for-pickup` | `MaterialPickupController` | `ROLE_STORE_MANAGER` | None | `MaterialRequestDetailResponse` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `POST` | `/api/v1/plumber/material-requests/{id}/arrived-at-store` | `MaterialPickupController` | `ROLE_PLUMBER` | None | `MaterialRequestDetailResponse` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `POST` | `/api/v1/plumber/material-requests/{id}/collect` | `MaterialPickupController` | `ROLE_PLUMBER` | None | `MaterialRequestDetailResponse` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `POST` | `/api/v1/store/material-requests/{id}/confirm-collection` | `MaterialPickupController` | `ROLE_STORE_MANAGER` | None | `MaterialRequestDetailResponse` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `POST` | `/api/v1/service-orders/{jobId}/returning-to-customer` | `MaterialPickupController` | `ROLE_PLUMBER` | None | `ServiceOrder` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `POST` | `/api/v1/service-orders/{jobId}/resume-work` | `MaterialPickupController` | `ROLE_PLUMBER` | None | `ServiceOrder` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `POST` | `/api/v1/checkout` | `CheckoutController` | `ROLE_CUSTOMER` | `CheckoutRequest` | `OrderDetailDTO` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `GET` | `/api/v1/admin/users` | `AdminController` | `ROLE_ADMIN` | None | `AdminUserListResponse` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
| `POST` | `/api/v1/admin/material-requests/{id}/reassign` | `AdminMaterialRequestController` | `ROLE_ADMIN` | `ReassignRequest` | `MaterialRequestDetailResponse` | Yes (Render HTTP 502) | BLOCKED (Render 502) |
