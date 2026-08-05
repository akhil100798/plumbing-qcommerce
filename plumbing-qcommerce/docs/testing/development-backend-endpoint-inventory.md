# Development Backend Endpoint Inventory Report

## 1. Complete Endpoint Directory

| Module | Method | Exact Endpoint | Controller | Allowed Roles | Request DTO | Response DTO | Main Has It | Development Has It |
| ------ | ------ | -------------- | ---------- | ------------- | ----------- | ------------ | ----------- | ------------------ |
| Version | GET | `/version` | `VersionController` | Public | None | Map<String, Object> | No | Yes |
| Health | GET | `/health/live` | `HealthController` | Public | None | Map<String, Object> | Yes | Yes |
| Health | GET | `/health/ready` | `HealthController` | Public | None | Map<String, Object> | Yes | Yes |
| Actuator | GET | `/actuator/health` | Actuator | Public | None | Map<String, Object> | Yes | Yes |
| Auth | POST | `/api/v1/auth/register` | `AuthController` | Public | `RegisterRequest` | `AuthResponse` | Yes | Yes |
| Auth | POST | `/api/v1/auth/login` | `AuthController` | Public | `LoginRequest` | `AuthResponse` | Yes | Yes |
| Auth | POST | `/api/v1/auth/refresh` | `AuthController` | Public | `RefreshTokenRequest` | `AuthResponse` | Yes | Yes |
| Auth | POST | `/api/v1/auth/logout` | `AuthController` | Authenticated | None | Map<String, Object> | Yes | Yes |
| Customer Profile | GET | `/api/v1/customer/profile` | `CustomerProfileController` | CUSTOMER | None | `CustomerProfileResponse` | Yes | Yes |
| Customer Profile | PUT | `/api/v1/customer/profile` | `CustomerProfileController` | CUSTOMER | `CustomerProfileRequest` | `CustomerProfileResponse` | Yes | Yes |
| Service Orders | POST | `/api/v1/customer/service-orders` | `CustomerServiceOrderController` | CUSTOMER | `CreateServiceOrderRequest` | `ServiceOrderResponse` | Yes | Yes |
| Service Orders | GET | `/api/v1/customer/service-orders` | `CustomerServiceOrderController` | CUSTOMER | None | List<ServiceOrderResponse> | Yes | Yes |
| Service Orders | GET | `/api/v1/customer/service-orders/{id}` | `CustomerServiceOrderController` | CUSTOMER | None | `ServiceOrderResponse` | Yes | Yes |
| Plumber Jobs | GET | `/api/v1/plumber/jobs` | `PlumberJobController` | PLUMBER | None | List<PlumberJobResponse> | Yes | Yes |
| Plumber Jobs | POST | `/api/v1/plumber/jobs/{id}/accept` | `PlumberJobController` | PLUMBER | None | `PlumberJobResponse` | Yes | Yes |
| Plumber Jobs | POST | `/api/v1/plumber/jobs/{id}/start` | `PlumberJobController` | PLUMBER | None | `PlumberJobResponse` | Yes | Yes |
| Plumber Jobs | POST | `/api/v1/plumber/jobs/{id}/complete` | `PlumberJobController` | PLUMBER | None | `PlumberJobResponse` | Yes | Yes |
| Material Requests | POST | `/api/v1/plumber/material-requests` | `MaterialPickupController` | PLUMBER | `CreateMaterialRequest` | `MaterialRequestResponse` | No | Yes |
| Material Requests | POST | `/api/v1/plumber/material-requests/{id}/arrived-at-store` | `MaterialPickupController` | PLUMBER | None | `MaterialRequestResponse` | No | Yes |
| Material Requests | POST | `/api/v1/plumber/material-requests/{id}/collect` | `MaterialPickupController` | PLUMBER | None | `MaterialRequestResponse` | No | Yes |
| Store Material Actions | GET | `/api/v1/store/material-requests` | `StoreMaterialController` | STORE_MANAGER | None | List<MaterialRequestResponse> | No | Yes |
| Store Material Actions | POST | `/api/v1/store/material-requests/{id}/approve` | `StoreMaterialController` | STORE_MANAGER | `ApproveMaterialRequest` | `MaterialRequestResponse` | No | Yes |
| Store Material Actions | POST | `/api/v1/store/material-requests/{id}/prepare` | `StoreMaterialController` | STORE_MANAGER | None | `MaterialRequestResponse` | No | Yes |
| Store Material Actions | POST | `/api/v1/store/material-requests/{id}/ready-for-pickup` | `StoreMaterialController` | STORE_MANAGER | None | `MaterialRequestResponse` | No | Yes |
| Store Material Actions | POST | `/api/v1/store/material-requests/{id}/confirm-collection` | `StoreMaterialController` | STORE_MANAGER | None | `MaterialRequestResponse` | No | Yes |
| Catalog | GET | `/api/v1/categories` | `CatalogController` | Public | None | List<CategoryDto> | Yes | Yes |
| Catalog | GET | `/api/v1/products` | `CatalogController` | Public | None | Page<ProductDto> | Yes | Yes |
| Stores | GET | `/api/v1/stores` | `StoreController` | Public | None | List<StoreDto> | Yes | Yes |
| Stores | GET | `/api/v1/stores/{id}/inventory` | `StoreController` | Public | None | List<InventoryDto> | Yes | Yes |

---

## 2. Access Matrix
- **Public**: `/version`, `/health/**`, `/actuator/health`, `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/refresh`, `/api/v1/categories`, `/api/v1/products`, `/api/v1/stores/**`.
- **CUSTOMER**: `/api/v1/customer/**`.
- **PLUMBER**: `/api/v1/plumber/**`.
- **STORE_MANAGER**: `/api/v1/store/**`.
- **ADMIN**: `/api/v1/admin/**`.
