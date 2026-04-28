# Lead Developer's Handoff: PlumbCommerce Interface Logic

**To**: UI/UX Designer  
**From**: Lead System Developer  
**Project**: PlumbCommerce Quick-Commerce Ecosystem  

This document explains the "Nervous System" of our platform. Use this to ensure your designs align with our real-time, event-driven architecture.

---

## 🏗️ 1. Global System States (The Workflow)
The UI must visually represent the following state transitions managed by our **Spring Boot REST API** and **Node.js Edge Gateway**.

| Application State | Data Source | UI Requirement |
| :--- | :--- | :--- |
| **GUEST / IDLE** | REST | Generic landing page; high-conversion login/signup CTA. |
| **SEARCHING...** | Redis (Geo) | Pulse animation for "Radius Search" (0-latency feedback). |
| **JOB_OFFERED** | WebSocket | High-alert screen for Plumbers (30s timer before expiry). |
| **ACCEPTED** | Kafka Event | Instant transition to Tracking view for both roles. |
| **IN_PROGRESS** | REST | Work log entry screen; showing "Parts Used" dropdown. |
| **COMPLETED** | MongoDB | Final Invoice view; Rating & Review prompt. |

---

## ⚡ 2. Real-time Communication (WebSockets)
We use **Socket.io** for live synchronization. Your designs must account for these low-latency updates:
- **Location Pulse**: The Plumber app emits a `location_ping` every 5 seconds. The Customer Map must animate smoothly between these points without jitter.
- **Event Forwarding**: When a plumber accepts a job, our Kafka bus pushes a `PLUMBER_ASSIGNED` event. The Customer app must update **without a page refresh**.

---

## 🛡️ 3. Security & Validation States
Our gateway is hardened with **JWT Authentication** and **Rate Limiting**.
- **Rate Limit (429)**: If a user spams the "Find Plumber" button, the UI must show a "Cooling down..." or "Too many requests" state.
- **Unauthorized (401)**: If a session expires, the UI must gracefully redirect to Login without losing the current search context.

---

## 📊 4. Data Inputs (What you can show)
The following data attributes are available for your UI components:

- **Plumber Profile**: `fullName`, `rating`, `totalJobsCompleted`, `specialty`.
- **Order Metadata**: `orderId`, `creationTimestamp`, `requestedServiceType`.
- **Live Metrics**: `totalRevenue`, `activePlumbersCount` (for Admin Dashboard).
- **Inventory**: `partName`, `partPrice`, `stockLevel`.

---

## ⚙️ 5. Technical Constraints for Design
1.  **Latency**: Design for speed. Every millisecond counts in "Quick-Commerce". Use optimistic UI updates where possible.
2.  **Responsiveness**: The **Admin and Store** views are Web-first (Desktop/Tablet). The **Customer and Plumber** views are strictly Mobile-first (iOS/Android).
3.  **Map Integration**: We provide a raw coordinate stream (`latitude`, `longitude`). Design for a "Vector Map" style (Mapbox/Google Maps).

---

**Lead Developer Note**:  
"We have built the brain and the muscle of the platform—now we need you to build the face. The goal is to make a high-stakes plumbing emergency feel calm, fast, and professional."
