# Phase 12C — Edge WebSocket Authorization Hardening Report

## 1. Previous Spoofing Risks
Prior to this hardening, the WebSocket gateway in the `edge-service` had several critical vulnerabilities:
* **Client-Trusting Rooms:** Socket event handlers like `register_plumber`, `register_customer`, and `register_delivery_partner` accepted client-supplied IDs (e.g. `plumberId`, `customerId`) and placed sockets directly into those private rooms via `socket.join()`. This allowed any authenticated user to spoof any other user's identity and intercept their private events (such as job offers).
* **Location Spoofing:** `location_ping` and `delivery_location_ping` accepted client-supplied IDs, allowing malicious users to broadcast coordinates under another agent's identifier.
* **Wildcard CORS:** Both Express and Socket.IO allowed wildcard origins (`*`) under default configurations, which is unsafe for authenticated production environments.
* **Lack of Validation & Limits:** Coordinates were not bounds-checked, allowing invalid lat/lng inputs. Socket pings were not rate-limited, allowing connection and event flooding.

---

## 2. New Trust Model
The `edge-service` now enforces a **Zero-Trust Client Identity Model**:
* **Verified Tokens Only:** Sockets must submit a JWT token during handshake.
* **Backend Resolution:** The token's subject is forwarded to the trusted backend REST endpoint (`GET /api/v1/users/me`) to fetch the verified user record and resolve roles and database identifiers.
* **Socket Session Binding:** Resolved identifiers (e.g. `userId`, `plumberId`, `customerId`, `partnerId`, `storeId`) are attached to the `socket.user` object at handshake. Client-supplied payloads are ignored for private room assignments and location updates.

---

## 3. JWT Handshake Validation
The Socket.IO `socketAuth` middleware executes during connection:
1. Validates signature and expiry using the environment-injected `JWT_SECRET`.
2. Restricts connections if the secret is missing or default in a production environment.
3. Retrieves the authenticated profile from the backend to construct the session:
   ```javascript
   socket.user = {
     userId,
     role,
     email,
     phone,
     customerId?,
     plumberId?,
     storeId?,
     partnerId?
   }
   ```
4. Masks/redacts sensitive details in error outputs (no tokens are logged).

---

## 4. Room Authorization Rules
Symmetric room registration handlers validate permissions before calling `socket.join()`:
* **CUSTOMER:** Can join only `customer_${socket.user.customerId}`. Mismatches or incorrect roles emit `error` events.
* **PLUMBER:** Can join only `plumber_${socket.user.plumberId}`.
* **DELIVERY_PARTNER:** Can join only `delivery_${socket.user.partnerId}`.
* **STORE_MANAGER:** Can join only `store_${socket.user.storeId}`.

---

## 5. Location Event Authorization Rules
* **Ownership Check:** Senders must have the matching role and ID in their session to update coordinates.
* **Coordinates Range Check:** Latitudes must be within `[-90, 90]` and longitudes within `[-180, 180]`.
* **Throttling:** Limits updates to at most 1 ping per 2 seconds per socket.

---

## 6. CORS Policy
* Wildcards (`*`) are disallowed in production.
* Startup fails in production if `ALLOWED_ORIGINS` is missing or wildcard.
* Local development defaults to supporting common localhost ports (`3000`, `19006`, etc.).

---

## 7. Rate Limit Behavior
* **REST Endpoints:** Uses `express-rate-limit` with Redis storage for `/api/v1/edge/requests/nearby`.
* **Socket Events:** Local timestamps on socket objects enforce rate-limits for location updates and room joins, returning safe `error` messages on abuse.

---

## 8. Tests Added
* **[server.security.test.js](file:///d:/personal project/plumbing-qcommerce/edge-service/server.security.test.js):** 12 tests verifying JWT validation failures, room joining role checks, ID mismatch rejections, location coordinate range bounds, and production configuration safety rules.

---

## 9. Verification & Build Results
* **npm test result:** PASS. 13 tests passed successfully (1 test in `server.test.js` and 12 tests in `server.security.test.js`).
* **npm run build result:** PASS. Build syntax check via `node --check server.js` completed successfully.
* **npm audit result:** PASS. 0 vulnerabilities found in production dependencies (`npm audit --omit=dev`).

---

## 10. Security Grep Audit Results
A complete recursive search of the `edge-service` codebase yielded the following classifications:
* `origin: '*'` -> **SAFE**. No occurrences exist. CORS config is dynamic.
* `cors()` -> **SAFE**. Express instantiates CORS with validated `corsOptions`.
* `socket.join` -> **SAFE**. Sockets only join rooms constructed from the backend-resolved `socket.user` session attributes.
* `console.log` -> **SAFE**. Coordinates, credentials, and OTP values have been redacted/masked from all logging statements.
* `plumberId` / `customerId` / `partnerId` -> **SAFE**. Incoming event payload IDs are strictly cross-checked against the `socket.user` session object.
* `register_plumber` / `register_customer` / `location_ping` -> **SAFE**. Enforced via strict role checks and identity cross-verification.

---

## 11. Remaining Limitations
* Multi-instance Node.js scaling requires a Redis socket adapter to synchronize rooms across nodes.
* Real-time location validation against order routes is scoped for a later geo-fencing task.

---

## 12. Deployment Status
* **DEPLOYMENT ALLOWED:** NO.
* **Reason:** Although Phase 12C is fully secured, other critical blockers remain active (e.g. Mobile release gates compile errors, database seeder guards, and Phase 12B.2 order handover OTP hardening).
