# UI/UX Design Specification: PlumbCommerce Ecosystem

## 🎨 1. Design Language & Brand Identity
The interface must feel **Premium, Reliable, and High-Speed**.

- **Primary Color**: #3B82F6 (Vibrant Blue - "Trust & Water")
- **secondary Color**: #10B981 (Emerald Green - "Success & Ready")
- **Accent Color**: #F59E0B (Amber - "Urgency & Warning")
- **Typography**: Inter or Roboto (Clean, highly legible sans-serif)
- **Style**: Modern Minimalist, Glassmorphism for overlays, rounded corners (12px-16px).

---

## 📱 2. Customer App (Mobile)
**Goal**: Find and track a plumber with zero friction.

### Key Screens & Flows:
1.  **Home Dashboard**: Simple search/category selection (Leaking pipe, Tap install, etc.).
2.  **Discovery (Nearby)**: A "Lightning" pulse animation while searching Redis-geo radius.
3.  **Live Tracking**: Real-time map view with a moving plumber icon.
4.  **Completion & Review**: Invoice summary and 5-star rating system.

---

## 👨‍🔧 3. Plumber/Partner App (Mobile)
**Goal**: Maximize job acceptance speed and navigation accuracy.

### Key Screens & Flows:
1.  **Duty Toggle**: Large "Go Online" switch that triggers the GPS pulse to Edge/Redis.
2.  **Job Alert (Broadcast)**: Full-screen intrusive alert with sound for incoming job offers.
3.  **Navigation**: Integrated Google Maps/Mapbox view with "Tap to Start Job".
4.  **Service Logging**: Field for photo upload and "Parts Used" selection (tied to Store Inventory).

---

## 🏢 4. Store Manager Interface (Web/Tablet)
**Goal**: Manage incoming "Part Used" events and restock alerts.

- **Inventory Dashboard**: List of parts with low-stock warnings.
- **Order Audit**: Seeing which plumbers are using which parts for which customers.
- **Self-Identity**: Ability to add/update store coordinates for the geo-fencing engine.

---

## 📊 5. Global Admin Portal (Web/Desktop)
**Goal**: High-level platform health monitoring.

- **Platform KPI Center**: Real-time ticker of Total Revenue, Active Plumbers, and Pending Jobs.
- **Heatmap**: Visualization of job density across the city (using the Redis-geo data).
- **Incident Control**: Ability to view escalated/cancelled orders.

---

## ⚙️ 6. Technical Design Constraints
- **Mobile Handshakes**: Design for "Offline" states (plumber loses signal). Include loading skeletons.
- **Data Refresh**: Maps must update every 5 seconds (matched to our Kafka/Socket sync rate).
- **Form Factors**: Customer/Plumber are strictly **Native Mobile** (iOS/Android compatible). Store/Admin are **Responsive Web**.
