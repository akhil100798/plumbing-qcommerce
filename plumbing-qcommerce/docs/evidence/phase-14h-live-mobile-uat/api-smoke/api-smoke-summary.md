# Phase 14H — Staging Backend API Smoke Summary

This document captures the sanitized API verification probes executed against the live Render staging backend.

* **Target URL**: `https://plumbing-qcommerce.onrender.com`
* **Execution Timestamp**: 2026-07-07T18:30:00+05:30

---

## 1. Core Health Liveness Check

### Request
`GET https://plumbing-qcommerce.onrender.com/health/live`

### Response (200 OK)
```json
{
  "timestamp": "2026-07-07T13:00:28.529118442Z",
  "status": "UP"
}
```

---

## 2. Authentication Probes (Sanitized)

### POST /api/v1/auth/send-otp
* **Payload**: `{"phone":"5555555601"}`
* **Response (200 OK)**:
```json
{
  "message": "OTP sent successfully"
}
```

### POST /api/v1/auth/verify-otp
* **Payload**: `{"phone":"5555555601", "code":"123456"}`
* **Response (200 OK)**:
```json
{
  "token": "<REDACTED_TOKEN>",
  "refreshToken": "<REDACTED_TOKEN>",
  "user": {
    "id": 1,
    "email": "customer@plumbcommerce.com",
    "fullName": "Staging Customer",
    "phone": "5555555601",
    "role": "CUSTOMER"
  }
}
```

### GET /api/v1/users/me (As Customer)
* **Headers**: `Authorization: Bearer <REDACTED_TOKEN>`
* **Response (200 OK)**:
```json
{
  "id": 1,
  "email": "customer@plumbcommerce.com",
  "fullName": "Staging Customer",
  "phone": "5555555601",
  "role": "CUSTOMER"
}
```

---

## 3. Product Catalog Checks

### GET /api/v1/catalog/categories
* **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "name": "Pipes",
    "description": "PVC, CPVC, and drainage pipes",
    "parentId": null
  },
  {
    "id": 2,
    "name": "Fittings",
    "description": "Joints, tees, elbows, and adaptors",
    "parentId": null
  },
  {
    "id": 3,
    "name": "Tools",
    "description": "Plumbing hand tools and sealants",
    "parentId": null
  }
]
```

### GET /api/v1/catalog/products
* **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "sku": "CPVC-PIPE-12",
    "name": "CPVC Pipe 1/2 inch",
    "description": "Half-inch CPVC repair pipe",
    "price": 145.00,
    "imageUrl": null,
    "categoryId": 1,
    "categoryName": "Pipes"
  },
  {
    "id": 2,
    "sku": "PVC-ELBOW-34",
    "name": "PVC Elbow 3/4 inch",
    "description": "3/4 inch elbow joint connector",
    "price": 32.50,
    "imageUrl": null,
    "categoryId": 2,
    "categoryName": "Fittings"
  },
  {
    "id": 3,
    "sku": "THREAD-TAPE",
    "name": "Thread Seal Tape",
    "description": "PTFE teflon plumber sealant tape",
    "price": 15.00,
    "imageUrl": null,
    "categoryId": 3,
    "categoryName": "Tools"
  }
]
```

---

## 4. Mobile E2E Supporting Endpoints

### GET /api/v1/delivery/partners (As Store Manager)
* **Headers**: `Authorization: Bearer <REDACTED_TOKEN>`
* **Response (200 OK)**:
```json
[
  {
    "id": 4,
    "email": "rider@plumbcommerce.com",
    "fullName": "Staging Rider",
    "phone": "5555555604",
    "role": "DELIVERY_PARTNER"
  }
]
```

### GET /api/v1/orders/plumber (As Plumber)
* **Headers**: `Authorization: Bearer <REDACTED_TOKEN>`
* **Response (200 OK)**:
```json
[]
```
*(No active orders currently assigned to the plumber)*
