# FixKart All Apps Screenshot Index

Complete index of all real mobile viewport screenshots captured from deployed FixKart web applications.

## Environment Overview
- **Customer Web**: `https://fixkart-customer-web.vercel.app`
- **Plumber Web**: `https://fixkart-plumber-web.vercel.app`
- **Store Web**: `https://fixkart-store-web.vercel.app`
- **Backend API**: `https://plumbing-qcommerce.onrender.com`
- **Mobile Viewport**: `390 x 844`
- **Total Captured Screenshots**: `77`

## Customer App (22 Screens)

| ID | Screen Name | Filename | Main Actions | Backend APIs | Status |
| --- | --- | --- | --- | --- | --- |
| `01` | **Onboarding & Splash Screen** | [`customer-01-splash-onboarding.png`](evidence/ppt-screenshots/customer-01-splash-onboarding.png) | Skip, Next, Get Started | `GET /api/v1/catalog/categories` | `PASS` |
| `02` | **Customer Login Screen** | [`customer-02-login.png`](evidence/ppt-screenshots/customer-02-login.png) | Email/Phone Input, Password Input, Sign In, Register Link | `POST /api/v1/auth/login` | `PASS` |
| `03` | **Customer Registration Screen** | [`customer-03-register.png`](evidence/ppt-screenshots/customer-03-register.png) | Full Name, Email, Phone, Password, Confirm Password, Create Account | `POST /api/v1/auth/register` | `PASS` |
| `04` | **Customer Home Screen** | [`customer-04-home.png`](evidence/ppt-screenshots/customer-04-home.png) | Service Icons, Category Pills, Search Bar, Bottom Tabs | `GET /api/v1/auth/me, GET /api/v1/catalog/categories` | `PASS` |
| `05` | **Services / Book Plumber Screen** | [`customer-05-services.png`](evidence/ppt-screenshots/customer-05-services.png) | Book Service, Select Service Type, Confirm Address | `GET /api/v1/catalog/categories, GET /api/v1/users/me/addresses` | `PASS` |
| `06` | **Product Categories Screen** | [`customer-06-categories.png`](evidence/ppt-screenshots/customer-06-categories.png) | Category Cards, Search Filter, View Products | `GET /api/v1/catalog/categories` | `PASS` |
| `07` | **Products Catalog Screen** | [`customer-07-products.png`](evidence/ppt-screenshots/customer-07-products.png) | Product Card, Add to Cart, Filter SKU | `GET /api/v1/catalog/products` | `PASS` |
| `08` | **Product Detail Screen** | [`customer-08-product-detail.png`](evidence/ppt-screenshots/customer-08-product-detail.png) | Quantity Selector, Add to Cart, Buy Now | `GET /api/v1/catalog/products/{id}` | `PASS` |
| `09` | **Nearby Stores Screen** | [`customer-09-stores.png`](evidence/ppt-screenshots/customer-09-stores.png) | Store Card, Distance Filter, View Inventory | `GET /api/v1/stores/nearby` | `PASS` |
| `10` | **Store Detail & Stock Screen** | [`customer-10-store-detail.png`](evidence/ppt-screenshots/customer-10-store-detail.png) | Store Info, Browse Stock, Contact Store | `GET /api/v1/stores/{id}, GET /api/v1/stores/{id}/inventory` | `PASS` |
| `11` | **Cart & Items Screen** | [`customer-11-cart.png`](evidence/ppt-screenshots/customer-11-cart.png) | Increment/Decrement Qty, Remove Item, Proceed to Checkout | `GET /api/v1/catalog/products` | `PASS` |
| `12` | **Checkout & Payment Screen** | [`customer-12-checkout.png`](evidence/ppt-screenshots/customer-12-checkout.png) | Select Address, Payment Method, Confirm Order | `POST /api/v1/orders` | `PASS` |
| `13` | **Saved Addresses Screen** | [`customer-13-addresses.png`](evidence/ppt-screenshots/customer-13-addresses.png) | Add Address, Edit Address, Set Default | `GET /api/v1/users/me/addresses` | `PASS` |
| `14` | **Create / Edit Address Screen** | [`customer-14-create-edit-address.png`](evidence/ppt-screenshots/customer-14-create-edit-address.png) | Address Line, City, Pincode, Save Address | `POST /api/v1/users/me/addresses` | `PASS` |
| `15` | **Create Service Request Screen** | [`customer-15-create-service-request.png`](evidence/ppt-screenshots/customer-15-create-service-request.png) | Description Field, Select Problem Type, Submit Request | `POST /api/v1/service-orders` | `PASS` |
| `16` | **Order Detail Screen** | [`customer-16-order-detail.png`](evidence/ppt-screenshots/customer-16-order-detail.png) | Cancel Order, Contact Plumber, Track Progress | `GET /api/v1/orders/{id}` | `PASS` |
| `17` | **Order History Screen** | [`customer-17-order-history.png`](evidence/ppt-screenshots/customer-17-order-history.png) | Filter Status, View Order Details, Rebook Service | `GET /api/v1/orders` | `PASS` |
| `18` | **Material Status & Tracking Screen** | [`customer-18-material-tracking.png`](evidence/ppt-screenshots/customer-18-material-tracking.png) | Refresh Status, View Items List | `GET /api/v1/orders/{id}/materials` | `PASS` |
| `19` | **Customer Profile Screen** | [`customer-19-profile.png`](evidence/ppt-screenshots/customer-19-profile.png) | Edit Profile, Change Password, View Addresses | `GET /api/v1/auth/me, GET /api/v1/users/me` | `PASS` |
| `20` | **Settings & Preferences Screen** | [`customer-20-settings.png`](evidence/ppt-screenshots/customer-20-settings.png) | Notification Toggle, Privacy Policy, Language Selection | `GET /api/v1/users/me` | `PASS` |
| `21` | **Support & Help Desk Screen** | [`customer-21-support.png`](evidence/ppt-screenshots/customer-21-support.png) | Raise Ticket, Chat Support, Call Customer Service | `POST /api/v1/support/tickets` | `PASS` |
| `22` | **Account Logout Confirmation Screen** | [`customer-22-logout.png`](evidence/ppt-screenshots/customer-22-logout.png) | Confirm Logout, Cancel | `POST /api/v1/auth/logout` | `PASS` |

## Plumber App (23 Screens)

| ID | Screen Name | Filename | Main Actions | Backend APIs | Status |
| --- | --- | --- | --- | --- | --- |
| `01` | **Plumber Login Screen** | [`plumber-01-login.png`](evidence/ppt-screenshots/plumber-01-login.png) | Email Input, Password Input, Sign In, Register Plumber | `POST /api/v1/auth/login` | `PASS` |
| `02` | **Plumber Self-Registration Screen** | [`plumber-02-register.png`](evidence/ppt-screenshots/plumber-02-register.png) | Full Name, Phone, Email, Password, Submit Registration | `POST /api/v1/auth/register/plumber` | `PASS` |
| `03` | **Plumber Operational Dashboard** | [`plumber-03-dashboard.png`](evidence/ppt-screenshots/plumber-03-dashboard.png) | Online/Offline Switch, View Upcoming Job, View Earnings, Start Job | `GET /api/v1/auth/me, GET /api/v1/plumber/dashboard` | `PASS` |
| `04` | **Availability Status Toggle Screen** | [`plumber-04-online-offline-toggle.png`](evidence/ppt-screenshots/plumber-04-online-offline-toggle.png) | Toggle Online/Offline Status | `POST /api/v1/users/me/availability` | `PASS` |
| `05` | **Plumber KYC & Verification Screen** | [`plumber-05-kyc-status.png`](evidence/ppt-screenshots/plumber-05-kyc-status.png) | Submit KYC Documents, View Approval Status | `GET /api/v1/plumber/kyc, POST /api/v1/plumber/kyc` | `PASS` |
| `06` | **Assigned Jobs List Screen** | [`plumber-06-jobs-list.png`](evidence/ppt-screenshots/plumber-06-jobs-list.png) | Filter Status (Pending/Active/Completed), Select Job Card | `GET /api/v1/plumber/dashboard` | `PASS` |
| `07` | **Plumber Job Detail Screen** | [`plumber-07-job-detail.png`](evidence/ppt-screenshots/plumber-07-job-detail.png) | Accept Job, Navigate to Site, Request Materials | `GET /api/v1/orders/{id}` | `PASS` |
| `08` | **Job Acceptance Confirmation Screen** | [`plumber-08-accept-job.png`](evidence/ppt-screenshots/plumber-08-accept-job.png) | Confirm Acceptance, Decline Job | `POST /api/v1/orders/{id}/accept` | `PASS` |
| `09` | **Arrive at Customer Site Screen** | [`plumber-09-arrive-at-site.png`](evidence/ppt-screenshots/plumber-09-arrive-at-site.png) | Confirm Site Arrival, Contact Customer | `POST /api/v1/orders/{id}/arrive` | `PASS` |
| `10` | **Work Started & Inspection Screen** | [`plumber-10-start-work.png`](evidence/ppt-screenshots/plumber-10-start-work.png) | Request Materials Needed, Complete Job Without Parts | `POST /api/v1/orders/{id}/start` | `PASS` |
| `11` | **Materials Selection Screen** | [`plumber-11-materials-required.png`](evidence/ppt-screenshots/plumber-11-materials-required.png) | Add Product SKU, Set Quantity, Select Store | `GET /api/v1/catalog/products` | `PASS` |
| `12` | **Fulfillment Store Selection Screen** | [`plumber-12-store-selection.png`](evidence/ppt-screenshots/plumber-12-store-selection.png) | Select Store, Compare Distance | `GET /api/v1/stores/nearby` | `PASS` |
| `13` | **Material Request Created Screen** | [`plumber-13-material-request-creation.png`](evidence/ppt-screenshots/plumber-13-material-request-creation.png) | View Request Status, Track Progress | `POST /api/v1/service-orders/{id}/material-requests` | `PASS` |
| `14` | **Plumber Material Request Tracking Screen** | [`plumber-14-material-tracking.png`](evidence/ppt-screenshots/plumber-14-material-tracking.png) | Refresh Status, Navigate to Store | `GET /api/v1/plumber/material-requests/{id}` | `PASS` |
| `15` | **Store Ready for Pickup Status Screen** | [`plumber-15-ready-for-pickup.png`](evidence/ppt-screenshots/plumber-15-ready-for-pickup.png) | Navigate to Store, Confirm Store Arrival | `GET /api/v1/plumber/material-requests/{id}` | `PASS` |
| `16` | **Arrival at Fulfillment Store Screen** | [`plumber-16-arrival-at-store.png`](evidence/ppt-screenshots/plumber-16-arrival-at-store.png) | Present QR/Code, Verify Items | `POST /api/v1/plumber/material-requests/{id}/arrive-store` | `PASS` |
| `17` | **Material Handover & Collection Screen** | [`plumber-17-material-collection.png`](evidence/ppt-screenshots/plumber-17-material-collection.png) | Confirm Package Handoff, Return to Job Site | `POST /api/v1/plumber/material-requests/{id}/collect` | `PASS` |
| `18` | **Resume On-Site Work Screen** | [`plumber-18-resume-work.png`](evidence/ppt-screenshots/plumber-18-resume-work.png) | Finish Repair, Test Installation | `POST /api/v1/orders/{id}/resume` | `PASS` |
| `19` | **Job Completion Summary Screen** | [`plumber-19-complete-job.png`](evidence/ppt-screenshots/plumber-19-complete-job.png) | Submit Final Invoice, Back to Dashboard | `POST /api/v1/orders/{id}/complete` | `PASS` |
| `20` | **Plumber Earnings & Payouts Screen** | [`plumber-20-earnings-wallet.png`](evidence/ppt-screenshots/plumber-20-earnings-wallet.png) | View Detailed Breakdown, Request Payout | `GET /api/v1/plumber/earnings, GET /api/v1/wallet` | `PASS` |
| `21` | **Plumber Profile & Credentials Screen** | [`plumber-21-profile.png`](evidence/ppt-screenshots/plumber-21-profile.png) | Edit Information, View KYC Details | `GET /api/v1/auth/me, GET /api/v1/plumber/profile` | `PASS` |
| `22` | **Plumber Settings Screen** | [`plumber-22-settings.png`](evidence/ppt-screenshots/plumber-22-settings.png) | Toggle Alerts, View Partner Agreement | `GET /api/v1/users/me` | `PASS` |
| `23` | **Plumber Session Termination Screen** | [`plumber-23-logout.png`](evidence/ppt-screenshots/plumber-23-logout.png) | Confirm Logout, Cancel | `POST /api/v1/auth/logout` | `PASS` |

## Store App (23 Screens)

| ID | Screen Name | Filename | Main Actions | Backend APIs | Status |
| --- | --- | --- | --- | --- | --- |
| `01` | **Store Manager Login Screen** | [`store-01-login.png`](evidence/ppt-screenshots/store-01-login.png) | Email Input, Password Input, Sign In | `POST /api/v1/auth/login` | `PASS` |
| `02` | **Store Operations Dashboard** | [`store-02-dashboard.png`](evidence/ppt-screenshots/store-02-dashboard.png) | View Material Requests, Manage Inventory, View Store Profile | `GET /api/v1/auth/me, GET /api/v1/stores/me` | `PASS` |
| `03` | **Store Profile & Location Screen** | [`store-03-store-profile.png`](evidence/ppt-screenshots/store-03-store-profile.png) | Edit Store Details, Update Coordinates | `GET /api/v1/stores/me` | `PASS` |
| `04` | **Store Catalog & Stock Screen** | [`store-04-products-catalog.png`](evidence/ppt-screenshots/store-04-products-catalog.png) | Search Product SKU, Filter Category, Update Stock | `GET /api/v1/stores/me/inventory` | `PASS` |
| `05` | **Inventory Product Detail Screen** | [`store-05-product-detail.png`](evidence/ppt-screenshots/store-05-product-detail.png) | Edit Quantity, Set Low Stock Threshold | `GET /api/v1/catalog/products/{id}` | `PASS` |
| `06` | **Warehouse Inventory Management Screen** | [`store-06-inventory-management.png`](evidence/ppt-screenshots/store-06-inventory-management.png) | Bulk Stock Edit, Export Stock List | `GET /api/v1/stores/me/inventory` | `PASS` |
| `07` | **Stock Update Modal Screen** | [`store-07-add-update-stock.png`](evidence/ppt-screenshots/store-07-add-update-stock.png) | Quantity Input, Save Stock Changes | `PUT /api/v1/stores/me/inventory` | `PASS` |
| `08` | **Low Stock Warning & Reorder Alert Screen** | [`store-08-low-stock-warning.png`](evidence/ppt-screenshots/store-08-low-stock-warning.png) | Reorder Stock, Dismiss Alert | `GET /api/v1/stores/me/inventory` | `PASS` |
| `09` | **Material Requests Management Screen** | [`store-09-material-requests-list.png`](evidence/ppt-screenshots/store-09-material-requests-list.png) | Filter Status (Requested/Approved/Collected), Select Request | `GET /api/v1/stores/me/material-requests` | `PASS` |
| `10` | **Material Request Detail Screen** | [`store-10-request-detail.png`](evidence/ppt-screenshots/store-10-request-detail.png) | Approve Full Request, Partial Approval, Reject Request | `GET /api/v1/material-requests/{id}` | `PASS` |
| `11` | **Material Request Full Approval Screen** | [`store-11-full-approval.png`](evidence/ppt-screenshots/store-11-full-approval.png) | Confirm Approval, Start Packing | `POST /api/v1/material-requests/{id}/approve` | `PASS` |
| `12` | **Partial Material Approval Interface** | [`store-12-partial-approval.png`](evidence/ppt-screenshots/store-12-partial-approval.png) | Adjust Quantity per SKU, Submit Partial Approval | `POST /api/v1/material-requests/{id}/approve` | `PASS` |
| `13` | **Material Request Rejection Interface** | [`store-13-rejection.png`](evidence/ppt-screenshots/store-13-rejection.png) | Select Rejection Reason, Confirm Rejection | `POST /api/v1/material-requests/{id}/reject` | `PASS` |
| `14` | **Order Packing & Preparation Screen** | [`store-14-preparation-status.png`](evidence/ppt-screenshots/store-14-preparation-status.png) | Mark Ready for Pickup | `POST /api/v1/material-requests/{id}/prepare` | `PASS` |
| `15` | **Ready for Pickup Notification Screen** | [`store-15-ready-for-pickup-status.png`](evidence/ppt-screenshots/store-15-ready-for-pickup-status.png) | View Pickup Details | `POST /api/v1/material-requests/{id}/ready` | `PASS` |
| `16` | **Plumber Arrival Visibility Screen** | [`store-16-plumber-arrival-visibility.png`](evidence/ppt-screenshots/store-16-plumber-arrival-visibility.png) | Verify Plumber Code, Handover Package | `GET /api/v1/material-requests/{id}` | `PASS` |
| `17` | **Plumber Package Collection Verification** | [`store-17-plumber-collection-visibility.png`](evidence/ppt-screenshots/store-17-plumber-collection-visibility.png) | Confirm Collection Button | `GET /api/v1/material-requests/{id}` | `PASS` |
| `18` | **Collection Confirmation Screen** | [`store-18-confirm-collection.png`](evidence/ppt-screenshots/store-18-confirm-collection.png) | Complete Handover, View Order Log | `POST /api/v1/material-requests/{id}/confirm-collection` | `PASS` |
| `19` | **Direct Customer Orders Fulfillment Screen** | [`store-19-checkout-orders.png`](evidence/ppt-screenshots/store-19-checkout-orders.png) | Process Order, Verify OTP | `GET /api/v1/stores/me/orders` | `PASS` |
| `20` | **Store Order History Log Screen** | [`store-20-order-history.png`](evidence/ppt-screenshots/store-20-order-history.png) | Filter Date, Export Transactions | `GET /api/v1/stores/me/orders` | `PASS` |
| `21` | **Store Manager Profile Screen** | [`store-21-profile.png`](evidence/ppt-screenshots/store-21-profile.png) | Edit Profile, Change Password | `GET /api/v1/auth/me, GET /api/v1/users/me` | `PASS` |
| `22` | **Store Settings Screen** | [`store-22-settings.png`](evidence/ppt-screenshots/store-22-settings.png) | Toggle Alerts, System Health Check | `GET /api/v1/users/me` | `PASS` |
| `23` | **Store Manager Logout Screen** | [`store-23-logout.png`](evidence/ppt-screenshots/store-23-logout.png) | Confirm Logout, Cancel | `POST /api/v1/auth/logout` | `PASS` |

## Cross-App Workflow (9 Screens)

| ID | Screen Name | Filename | Main Actions | Backend APIs | Status |
| --- | --- | --- | --- | --- | --- |
| `01` | **Workflow Step 1: Customer Creates Request** | [`workflow-01-customer-creates-request.png`](evidence/ppt-screenshots/workflow-01-customer-creates-request.png) | Submit Request | `POST /api/v1/service-orders` | `PASS` |
| `02` | **Workflow Step 2: Plumber Accepts Job** | [`workflow-02-plumber-receives-accepts-job.png`](evidence/ppt-screenshots/workflow-02-plumber-receives-accepts-job.png) | Accept Job | `POST /api/v1/orders/{id}/accept` | `PASS` |
| `03` | **Workflow Step 3: Plumber Requests Materials** | [`workflow-03-plumber-requests-materials.png`](evidence/ppt-screenshots/workflow-03-plumber-requests-materials.png) | Submit Material Request | `POST /api/v1/service-orders/{id}/material-requests` | `PASS` |
| `04` | **Workflow Step 4: Store Receives Request** | [`workflow-04-store-receives-material-request.png`](evidence/ppt-screenshots/workflow-04-store-receives-material-request.png) | View Request | `GET /api/v1/stores/me/material-requests` | `PASS` |
| `05` | **Workflow Step 5: Store Approves & Stages Package** | [`workflow-05-store-approves-prepares-ready.png`](evidence/ppt-screenshots/workflow-05-store-approves-prepares-ready.png) | Approve & Mark Ready | `POST /api/v1/material-requests/{id}/approve` | `PASS` |
| `06` | **Workflow Step 6: Plumber Arrives & Collects Parts** | [`workflow-06-plumber-arrives-collects-materials.png`](evidence/ppt-screenshots/workflow-06-plumber-arrives-collects-materials.png) | Collect Package | `POST /api/v1/plumber/material-requests/{id}/collect` | `PASS` |
| `07` | **Workflow Step 7: Store Confirms Handover** | [`workflow-07-store-confirms-collection.png`](evidence/ppt-screenshots/workflow-07-store-confirms-collection.png) | Confirm Collection | `POST /api/v1/material-requests/{id}/confirm-collection` | `PASS` |
| `08` | **Workflow Step 8: Plumber Completes Repair** | [`workflow-08-plumber-resumes-completes-work.png`](evidence/ppt-screenshots/workflow-08-plumber-resumes-completes-work.png) | Complete Job | `POST /api/v1/orders/{id}/complete` | `PASS` |
| `09` | **Workflow Step 9: Customer Views Completed Order** | [`workflow-09-customer-views-final-status.png`](evidence/ppt-screenshots/workflow-09-customer-views-final-status.png) | Rate Plumber, View Invoice | `GET /api/v1/orders/{id}` | `PASS` |

## Detailed Screen Descriptions

### 1. Customer App: Onboarding & Splash Screen
- **File Path**: [`evidence/ppt-screenshots/customer-01-splash-onboarding.png`](evidence/ppt-screenshots/customer-01-splash-onboarding.png)
- **Purpose**: App entrance screen with promotional slides and navigation to login
- **Main Actions**: Skip, Next, Get Started
- **Backend APIs**: `GET /api/v1/catalog/categories`
- **Status**: `PASS`

### 2. Customer App: Customer Login Screen
- **File Path**: [`evidence/ppt-screenshots/customer-02-login.png`](evidence/ppt-screenshots/customer-02-login.png)
- **Purpose**: Authenticates customer user via email/phone and password credentials
- **Main Actions**: Email/Phone Input, Password Input, Sign In, Register Link
- **Backend APIs**: `POST /api/v1/auth/login`
- **Status**: `PASS`

### 3. Customer App: Customer Registration Screen
- **File Path**: [`evidence/ppt-screenshots/customer-03-register.png`](evidence/ppt-screenshots/customer-03-register.png)
- **Purpose**: Allows new customers to self-register an account
- **Main Actions**: Full Name, Email, Phone, Password, Confirm Password, Create Account
- **Backend APIs**: `POST /api/v1/auth/register`
- **Status**: `PASS`

### 4. Customer App: Customer Home Screen
- **File Path**: [`evidence/ppt-screenshots/customer-04-home.png`](evidence/ppt-screenshots/customer-04-home.png)
- **Purpose**: Primary dashboard showcasing service categories, active order banners, and quick links
- **Main Actions**: Service Icons, Category Pills, Search Bar, Bottom Tabs
- **Backend APIs**: `GET /api/v1/auth/me, GET /api/v1/catalog/categories`
- **Status**: `PASS`

### 5. Customer App: Services / Book Plumber Screen
- **File Path**: [`evidence/ppt-screenshots/customer-05-services.png`](evidence/ppt-screenshots/customer-05-services.png)
- **Purpose**: Displays available plumbing services, labor estimates, and slot booking
- **Main Actions**: Book Service, Select Service Type, Confirm Address
- **Backend APIs**: `GET /api/v1/catalog/categories, GET /api/v1/users/me/addresses`
- **Status**: `PASS`

### 6. Customer App: Product Categories Screen
- **File Path**: [`evidence/ppt-screenshots/customer-06-categories.png`](evidence/ppt-screenshots/customer-06-categories.png)
- **Purpose**: Catalog category browse list filtering plumbing materials and tools
- **Main Actions**: Category Cards, Search Filter, View Products
- **Backend APIs**: `GET /api/v1/catalog/categories`
- **Status**: `PASS`

### 7. Customer App: Products Catalog Screen
- **File Path**: [`evidence/ppt-screenshots/customer-07-products.png`](evidence/ppt-screenshots/customer-07-products.png)
- **Purpose**: Displays product list with price, availability, and Add to Cart action
- **Main Actions**: Product Card, Add to Cart, Filter SKU
- **Backend APIs**: `GET /api/v1/catalog/products`
- **Status**: `PASS`

### 8. Customer App: Product Detail Screen
- **File Path**: [`evidence/ppt-screenshots/customer-08-product-detail.png`](evidence/ppt-screenshots/customer-08-product-detail.png)
- **Purpose**: Presents item specifications, stock status, pricing, and quantity selection
- **Main Actions**: Quantity Selector, Add to Cart, Buy Now
- **Backend APIs**: `GET /api/v1/catalog/products/{id}`
- **Status**: `PASS`

### 9. Customer App: Nearby Stores Screen
- **File Path**: [`evidence/ppt-screenshots/customer-09-stores.png`](evidence/ppt-screenshots/customer-09-stores.png)
- **Purpose**: Displays participating Q-Commerce fulfillment stores in nearby radius
- **Main Actions**: Store Card, Distance Filter, View Inventory
- **Backend APIs**: `GET /api/v1/stores/nearby`
- **Status**: `PASS`

### 10. Customer App: Store Detail & Stock Screen
- **File Path**: [`evidence/ppt-screenshots/customer-10-store-detail.png`](evidence/ppt-screenshots/customer-10-store-detail.png)
- **Purpose**: Shows store operating hours, live stock inventory, and location details
- **Main Actions**: Store Info, Browse Stock, Contact Store
- **Backend APIs**: `GET /api/v1/stores/{id}, GET /api/v1/stores/{id}/inventory`
- **Status**: `PASS`

### 11. Customer App: Cart & Items Screen
- **File Path**: [`evidence/ppt-screenshots/customer-11-cart.png`](evidence/ppt-screenshots/customer-11-cart.png)
- **Purpose**: Displays selected materials, quantities, itemized pricing, and checkout button
- **Main Actions**: Increment/Decrement Qty, Remove Item, Proceed to Checkout
- **Backend APIs**: `GET /api/v1/catalog/products`
- **Status**: `PASS`

### 12. Customer App: Checkout & Payment Screen
- **File Path**: [`evidence/ppt-screenshots/customer-12-checkout.png`](evidence/ppt-screenshots/customer-12-checkout.png)
- **Purpose**: Review order summary, select delivery address, and confirm order creation
- **Main Actions**: Select Address, Payment Method, Confirm Order
- **Backend APIs**: `POST /api/v1/orders`
- **Status**: `PASS`

### 13. Customer App: Saved Addresses Screen
- **File Path**: [`evidence/ppt-screenshots/customer-13-addresses.png`](evidence/ppt-screenshots/customer-13-addresses.png)
- **Purpose**: Manage delivery locations, primary address designation, and address removal
- **Main Actions**: Add Address, Edit Address, Set Default
- **Backend APIs**: `GET /api/v1/users/me/addresses`
- **Status**: `PASS`

### 14. Customer App: Create / Edit Address Screen
- **File Path**: [`evidence/ppt-screenshots/customer-14-create-edit-address.png`](evidence/ppt-screenshots/customer-14-create-edit-address.png)
- **Purpose**: Form to add or update street address, landmark, pincode, and coordinates
- **Main Actions**: Address Line, City, Pincode, Save Address
- **Backend APIs**: `POST /api/v1/users/me/addresses`
- **Status**: `PASS`

### 15. Customer App: Create Service Request Screen
- **File Path**: [`evidence/ppt-screenshots/customer-15-create-service-request.png`](evidence/ppt-screenshots/customer-15-create-service-request.png)
- **Purpose**: Form to describe plumbing issue, attach notes, select location, and dispatch plumber
- **Main Actions**: Description Field, Select Problem Type, Submit Request
- **Backend APIs**: `POST /api/v1/service-orders`
- **Status**: `PASS`

### 16. Customer App: Order Detail Screen
- **File Path**: [`evidence/ppt-screenshots/customer-16-order-detail.png`](evidence/ppt-screenshots/customer-16-order-detail.png)
- **Purpose**: Live status view showing order state, assigned plumber details, and payment summary
- **Main Actions**: Cancel Order, Contact Plumber, Track Progress
- **Backend APIs**: `GET /api/v1/orders/{id}`
- **Status**: `PASS`

### 17. Customer App: Order History Screen
- **File Path**: [`evidence/ppt-screenshots/customer-17-order-history.png`](evidence/ppt-screenshots/customer-17-order-history.png)
- **Purpose**: Comprehensive log of active, completed, and cancelled service requests
- **Main Actions**: Filter Status, View Order Details, Rebook Service
- **Backend APIs**: `GET /api/v1/orders`
- **Status**: `PASS`

### 18. Customer App: Material Status & Tracking Screen
- **File Path**: [`evidence/ppt-screenshots/customer-18-material-tracking.png`](evidence/ppt-screenshots/customer-18-material-tracking.png)
- **Purpose**: Real-time visibility into required parts, approval, store pickup, and delivery to site
- **Main Actions**: Refresh Status, View Items List
- **Backend APIs**: `GET /api/v1/orders/{id}/materials`
- **Status**: `PASS`

### 19. Customer App: Customer Profile Screen
- **File Path**: [`evidence/ppt-screenshots/customer-19-profile.png`](evidence/ppt-screenshots/customer-19-profile.png)
- **Purpose**: Personal identity overview, registered email, phone number, and loyalty status
- **Main Actions**: Edit Profile, Change Password, View Addresses
- **Backend APIs**: `GET /api/v1/auth/me, GET /api/v1/users/me`
- **Status**: `PASS`

### 20. Customer App: Settings & Preferences Screen
- **File Path**: [`evidence/ppt-screenshots/customer-20-settings.png`](evidence/ppt-screenshots/customer-20-settings.png)
- **Purpose**: App settings, notification toggles, language preferences, and privacy controls
- **Main Actions**: Notification Toggle, Privacy Policy, Language Selection
- **Backend APIs**: `GET /api/v1/users/me`
- **Status**: `PASS`

### 21. Customer App: Support & Help Desk Screen
- **File Path**: [`evidence/ppt-screenshots/customer-21-support.png`](evidence/ppt-screenshots/customer-21-support.png)
- **Purpose**: Customer support portal to raise tickets, message help center, and access FAQs
- **Main Actions**: Raise Ticket, Chat Support, Call Customer Service
- **Backend APIs**: `POST /api/v1/support/tickets`
- **Status**: `PASS`

### 22. Customer App: Account Logout Confirmation Screen
- **File Path**: [`evidence/ppt-screenshots/customer-22-logout.png`](evidence/ppt-screenshots/customer-22-logout.png)
- **Purpose**: Prompts user confirmation before invalidating session and returning to login
- **Main Actions**: Confirm Logout, Cancel
- **Backend APIs**: `POST /api/v1/auth/logout`
- **Status**: `PASS`

### 23. Plumber App: Plumber Login Screen
- **File Path**: [`evidence/ppt-screenshots/plumber-01-login.png`](evidence/ppt-screenshots/plumber-01-login.png)
- **Purpose**: Authenticates verified plumbers via registered email and credentials
- **Main Actions**: Email Input, Password Input, Sign In, Register Plumber
- **Backend APIs**: `POST /api/v1/auth/login`
- **Status**: `PASS`

### 24. Plumber App: Plumber Self-Registration Screen
- **File Path**: [`evidence/ppt-screenshots/plumber-02-register.png`](evidence/ppt-screenshots/plumber-02-register.png)
- **Purpose**: Self-registration form for new plumbing partners
- **Main Actions**: Full Name, Phone, Email, Password, Submit Registration
- **Backend APIs**: `POST /api/v1/auth/register/plumber`
- **Status**: `PASS`

### 25. Plumber App: Plumber Operational Dashboard
- **File Path**: [`evidence/ppt-screenshots/plumber-03-dashboard.png`](evidence/ppt-screenshots/plumber-03-dashboard.png)
- **Purpose**: Main dashboard displaying active job assignments, today earnings, ratings, and availability status
- **Main Actions**: Online/Offline Switch, View Upcoming Job, View Earnings, Start Job
- **Backend APIs**: `GET /api/v1/auth/me, GET /api/v1/plumber/dashboard`
- **Status**: `PASS`

### 26. Plumber App: Availability Status Toggle Screen
- **File Path**: [`evidence/ppt-screenshots/plumber-04-online-offline-toggle.png`](evidence/ppt-screenshots/plumber-04-online-offline-toggle.png)
- **Purpose**: Toggles plumber real-time availability to receive nearby service requests
- **Main Actions**: Toggle Online/Offline Status
- **Backend APIs**: `POST /api/v1/users/me/availability`
- **Status**: `PASS`

### 27. Plumber App: Plumber KYC & Verification Screen
- **File Path**: [`evidence/ppt-screenshots/plumber-05-kyc-status.png`](evidence/ppt-screenshots/plumber-05-kyc-status.png)
- **Purpose**: Displays identity verification status, Aadhaar/PAN upload, and admin approval state
- **Main Actions**: Submit KYC Documents, View Approval Status
- **Backend APIs**: `GET /api/v1/plumber/kyc, POST /api/v1/plumber/kyc`
- **Status**: `PASS`

### 28. Plumber App: Assigned Jobs List Screen
- **File Path**: [`evidence/ppt-screenshots/plumber-06-jobs-list.png`](evidence/ppt-screenshots/plumber-06-jobs-list.png)
- **Purpose**: Filterable list of assigned pending, active, and completed plumbing service jobs
- **Main Actions**: Filter Status (Pending/Active/Completed), Select Job Card
- **Backend APIs**: `GET /api/v1/plumber/dashboard`
- **Status**: `PASS`

### 29. Plumber App: Plumber Job Detail Screen
- **File Path**: [`evidence/ppt-screenshots/plumber-07-job-detail.png`](evidence/ppt-screenshots/plumber-07-job-detail.png)
- **Purpose**: Displays customer address, issue description, estimated payout, and workflow actions
- **Main Actions**: Accept Job, Navigate to Site, Request Materials
- **Backend APIs**: `GET /api/v1/orders/{id}`
- **Status**: `PASS`

### 30. Plumber App: Job Acceptance Confirmation Screen
- **File Path**: [`evidence/ppt-screenshots/plumber-08-accept-job.png`](evidence/ppt-screenshots/plumber-08-accept-job.png)
- **Purpose**: Confirms job assignment and transitions order state to ASSIGNED
- **Main Actions**: Confirm Acceptance, Decline Job
- **Backend APIs**: `POST /api/v1/orders/{id}/accept`
- **Status**: `PASS`

### 31. Plumber App: Arrive at Customer Site Screen
- **File Path**: [`evidence/ppt-screenshots/plumber-09-arrive-at-site.png`](evidence/ppt-screenshots/plumber-09-arrive-at-site.png)
- **Purpose**: Marks plumber physical arrival at customer location
- **Main Actions**: Confirm Site Arrival, Contact Customer
- **Backend APIs**: `POST /api/v1/orders/{id}/arrive`
- **Status**: `PASS`

### 32. Plumber App: Work Started & Inspection Screen
- **File Path**: [`evidence/ppt-screenshots/plumber-10-start-work.png`](evidence/ppt-screenshots/plumber-10-start-work.png)
- **Purpose**: Transitions order to IN_PROGRESS state to begin diagnosis
- **Main Actions**: Request Materials Needed, Complete Job Without Parts
- **Backend APIs**: `POST /api/v1/orders/{id}/start`
- **Status**: `PASS`

### 33. Plumber App: Materials Selection Screen
- **File Path**: [`evidence/ppt-screenshots/plumber-11-materials-required.png`](evidence/ppt-screenshots/plumber-11-materials-required.png)
- **Purpose**: Interface to select replacement plumbing parts, fittings, and quantities required for repair
- **Main Actions**: Add Product SKU, Set Quantity, Select Store
- **Backend APIs**: `GET /api/v1/catalog/products`
- **Status**: `PASS`

### 34. Plumber App: Fulfillment Store Selection Screen
- **File Path**: [`evidence/ppt-screenshots/plumber-12-store-selection.png`](evidence/ppt-screenshots/plumber-12-store-selection.png)
- **Purpose**: Selects nearest Q-Commerce store for fast material pickup
- **Main Actions**: Select Store, Compare Distance
- **Backend APIs**: `GET /api/v1/stores/nearby`
- **Status**: `PASS`

### 35. Plumber App: Material Request Created Screen
- **File Path**: [`evidence/ppt-screenshots/plumber-13-material-request-creation.png`](evidence/ppt-screenshots/plumber-13-material-request-creation.png)
- **Purpose**: Confirms creation of material request dispatched to Store Manager
- **Main Actions**: View Request Status, Track Progress
- **Backend APIs**: `POST /api/v1/service-orders/{id}/material-requests`
- **Status**: `PASS`

### 36. Plumber App: Plumber Material Request Tracking Screen
- **File Path**: [`evidence/ppt-screenshots/plumber-14-material-tracking.png`](evidence/ppt-screenshots/plumber-14-material-tracking.png)
- **Purpose**: Real-time status tracker (REQUESTED -> APPROVED -> READY_FOR_PICKUP -> COLLECTED)
- **Main Actions**: Refresh Status, Navigate to Store
- **Backend APIs**: `GET /api/v1/plumber/material-requests/{id}`
- **Status**: `PASS`

### 37. Plumber App: Store Ready for Pickup Status Screen
- **File Path**: [`evidence/ppt-screenshots/plumber-15-ready-for-pickup.png`](evidence/ppt-screenshots/plumber-15-ready-for-pickup.png)
- **Purpose**: Notifies plumber that store has packed parts and is ready for pickup
- **Main Actions**: Navigate to Store, Confirm Store Arrival
- **Backend APIs**: `GET /api/v1/plumber/material-requests/{id}`
- **Status**: `PASS`

### 38. Plumber App: Arrival at Fulfillment Store Screen
- **File Path**: [`evidence/ppt-screenshots/plumber-16-arrival-at-store.png`](evidence/ppt-screenshots/plumber-16-arrival-at-store.png)
- **Purpose**: Registers plumber presence at store counter for package handoff
- **Main Actions**: Present QR/Code, Verify Items
- **Backend APIs**: `POST /api/v1/plumber/material-requests/{id}/arrive-store`
- **Status**: `PASS`

### 39. Plumber App: Material Handover & Collection Screen
- **File Path**: [`evidence/ppt-screenshots/plumber-17-material-collection.png`](evidence/ppt-screenshots/plumber-17-material-collection.png)
- **Purpose**: Confirms physical receipt of materials from store manager
- **Main Actions**: Confirm Package Handoff, Return to Job Site
- **Backend APIs**: `POST /api/v1/plumber/material-requests/{id}/collect`
- **Status**: `PASS`

### 40. Plumber App: Resume On-Site Work Screen
- **File Path**: [`evidence/ppt-screenshots/plumber-18-resume-work.png`](evidence/ppt-screenshots/plumber-18-resume-work.png)
- **Purpose**: Resumes plumbing service execution after material collection
- **Main Actions**: Finish Repair, Test Installation
- **Backend APIs**: `POST /api/v1/orders/{id}/resume`
- **Status**: `PASS`

### 41. Plumber App: Job Completion Summary Screen
- **File Path**: [`evidence/ppt-screenshots/plumber-19-complete-job.png`](evidence/ppt-screenshots/plumber-19-complete-job.png)
- **Purpose**: Finalizes job, displays total bill, service labor charge, and customer rating prompt
- **Main Actions**: Submit Final Invoice, Back to Dashboard
- **Backend APIs**: `POST /api/v1/orders/{id}/complete`
- **Status**: `PASS`

### 42. Plumber App: Plumber Earnings & Payouts Screen
- **File Path**: [`evidence/ppt-screenshots/plumber-20-earnings-wallet.png`](evidence/ppt-screenshots/plumber-20-earnings-wallet.png)
- **Purpose**: Financial dashboard showing today earnings, weekly commissions, and payout history
- **Main Actions**: View Detailed Breakdown, Request Payout
- **Backend APIs**: `GET /api/v1/plumber/earnings, GET /api/v1/wallet`
- **Status**: `PASS`

### 43. Plumber App: Plumber Profile & Credentials Screen
- **File Path**: [`evidence/ppt-screenshots/plumber-21-profile.png`](evidence/ppt-screenshots/plumber-21-profile.png)
- **Purpose**: Plumber partner identity details, mobile number, experience level, and service areas
- **Main Actions**: Edit Information, View KYC Details
- **Backend APIs**: `GET /api/v1/auth/me, GET /api/v1/plumber/profile`
- **Status**: `PASS`

### 44. Plumber App: Plumber Settings Screen
- **File Path**: [`evidence/ppt-screenshots/plumber-22-settings.png`](evidence/ppt-screenshots/plumber-22-settings.png)
- **Purpose**: Partner app preferences, sound alerts, notification settings, and terms
- **Main Actions**: Toggle Alerts, View Partner Agreement
- **Backend APIs**: `GET /api/v1/users/me`
- **Status**: `PASS`

### 45. Plumber App: Plumber Session Termination Screen
- **File Path**: [`evidence/ppt-screenshots/plumber-23-logout.png`](evidence/ppt-screenshots/plumber-23-logout.png)
- **Purpose**: Logout prompt invalidating session token and returning to login page
- **Main Actions**: Confirm Logout, Cancel
- **Backend APIs**: `POST /api/v1/auth/logout`
- **Status**: `PASS`

### 46. Store App: Store Manager Login Screen
- **File Path**: [`evidence/ppt-screenshots/store-01-login.png`](evidence/ppt-screenshots/store-01-login.png)
- **Purpose**: Authentication portal for Q-Commerce store managers
- **Main Actions**: Email Input, Password Input, Sign In
- **Backend APIs**: `POST /api/v1/auth/login`
- **Status**: `PASS`

### 47. Store App: Store Operations Dashboard
- **File Path**: [`evidence/ppt-screenshots/store-02-dashboard.png`](evidence/ppt-screenshots/store-02-dashboard.png)
- **Purpose**: Live warehouse dashboard showing pending material requests, active orders, and low-stock alerts
- **Main Actions**: View Material Requests, Manage Inventory, View Store Profile
- **Backend APIs**: `GET /api/v1/auth/me, GET /api/v1/stores/me`
- **Status**: `PASS`

### 48. Store App: Store Profile & Location Screen
- **File Path**: [`evidence/ppt-screenshots/store-03-store-profile.png`](evidence/ppt-screenshots/store-03-store-profile.png)
- **Purpose**: Displays store location coordinates, manager contact, operating hours, and warehouse details
- **Main Actions**: Edit Store Details, Update Coordinates
- **Backend APIs**: `GET /api/v1/stores/me`
- **Status**: `PASS`

### 49. Store App: Store Catalog & Stock Screen
- **File Path**: [`evidence/ppt-screenshots/store-04-products-catalog.png`](evidence/ppt-screenshots/store-04-products-catalog.png)
- **Purpose**: Comprehensive list of store inventory with available stock levels and price tags
- **Main Actions**: Search Product SKU, Filter Category, Update Stock
- **Backend APIs**: `GET /api/v1/stores/me/inventory`
- **Status**: `PASS`

### 50. Store App: Inventory Product Detail Screen
- **File Path**: [`evidence/ppt-screenshots/store-05-product-detail.png`](evidence/ppt-screenshots/store-05-product-detail.png)
- **Purpose**: Detailed product SKU breakdown, reserved quantity, and available warehouse stock
- **Main Actions**: Edit Quantity, Set Low Stock Threshold
- **Backend APIs**: `GET /api/v1/catalog/products/{id}`
- **Status**: `PASS`

### 51. Store App: Warehouse Inventory Management Screen
- **File Path**: [`evidence/ppt-screenshots/store-06-inventory-management.png`](evidence/ppt-screenshots/store-06-inventory-management.png)
- **Purpose**: Bulk inventory controls for stock replenishment and allocation
- **Main Actions**: Bulk Stock Edit, Export Stock List
- **Backend APIs**: `GET /api/v1/stores/me/inventory`
- **Status**: `PASS`

### 52. Store App: Stock Update Modal Screen
- **File Path**: [`evidence/ppt-screenshots/store-07-add-update-stock.png`](evidence/ppt-screenshots/store-07-add-update-stock.png)
- **Purpose**: Form to add incoming shipment stock or adjust available inventory
- **Main Actions**: Quantity Input, Save Stock Changes
- **Backend APIs**: `PUT /api/v1/stores/me/inventory`
- **Status**: `PASS`

### 53. Store App: Low Stock Warning & Reorder Alert Screen
- **File Path**: [`evidence/ppt-screenshots/store-08-low-stock-warning.png`](evidence/ppt-screenshots/store-08-low-stock-warning.png)
- **Purpose**: Highlights items falling below safety stock threshold requiring urgent restock
- **Main Actions**: Reorder Stock, Dismiss Alert
- **Backend APIs**: `GET /api/v1/stores/me/inventory`
- **Status**: `PASS`

### 54. Store App: Material Requests Management Screen
- **File Path**: [`evidence/ppt-screenshots/store-09-material-requests-list.png`](evidence/ppt-screenshots/store-09-material-requests-list.png)
- **Purpose**: Queue of incoming material requests from on-site plumbers awaiting fulfillment
- **Main Actions**: Filter Status (Requested/Approved/Collected), Select Request
- **Backend APIs**: `GET /api/v1/stores/me/material-requests`
- **Status**: `PASS`

### 55. Store App: Material Request Detail Screen
- **File Path**: [`evidence/ppt-screenshots/store-10-request-detail.png`](evidence/ppt-screenshots/store-10-request-detail.png)
- **Purpose**: Itemized breakdown of requested parts, requesting plumber details, and fulfillment actions
- **Main Actions**: Approve Full Request, Partial Approval, Reject Request
- **Backend APIs**: `GET /api/v1/material-requests/{id}`
- **Status**: `PASS`

### 56. Store App: Material Request Full Approval Screen
- **File Path**: [`evidence/ppt-screenshots/store-11-full-approval.png`](evidence/ppt-screenshots/store-11-full-approval.png)
- **Purpose**: Approves all requested parts and reserves corresponding inventory from warehouse stock
- **Main Actions**: Confirm Approval, Start Packing
- **Backend APIs**: `POST /api/v1/material-requests/{id}/approve`
- **Status**: `PASS`

### 57. Store App: Partial Material Approval Interface
- **File Path**: [`evidence/ppt-screenshots/store-12-partial-approval.png`](evidence/ppt-screenshots/store-12-partial-approval.png)
- **Purpose**: Allows store manager to modify quantities if partial stock is available
- **Main Actions**: Adjust Quantity per SKU, Submit Partial Approval
- **Backend APIs**: `POST /api/v1/material-requests/{id}/approve`
- **Status**: `PASS`

### 58. Store App: Material Request Rejection Interface
- **File Path**: [`evidence/ppt-screenshots/store-13-rejection.png`](evidence/ppt-screenshots/store-13-rejection.png)
- **Purpose**: Interface to reject material request with reason feedback to plumber
- **Main Actions**: Select Rejection Reason, Confirm Rejection
- **Backend APIs**: `POST /api/v1/material-requests/{id}/reject`
- **Status**: `PASS`

### 59. Store App: Order Packing & Preparation Screen
- **File Path**: [`evidence/ppt-screenshots/store-14-preparation-status.png`](evidence/ppt-screenshots/store-14-preparation-status.png)
- **Purpose**: Warehouse packing phase where items are picked and staged for handover
- **Main Actions**: Mark Ready for Pickup
- **Backend APIs**: `POST /api/v1/material-requests/{id}/prepare`
- **Status**: `PASS`

### 60. Store App: Ready for Pickup Notification Screen
- **File Path**: [`evidence/ppt-screenshots/store-15-ready-for-pickup-status.png`](evidence/ppt-screenshots/store-15-ready-for-pickup-status.png)
- **Purpose**: Staged status triggering automated dispatch alert to waiting plumber
- **Main Actions**: View Pickup Details
- **Backend APIs**: `POST /api/v1/material-requests/{id}/ready`
- **Status**: `PASS`

### 61. Store App: Plumber Arrival Visibility Screen
- **File Path**: [`evidence/ppt-screenshots/store-16-plumber-arrival-visibility.png`](evidence/ppt-screenshots/store-16-plumber-arrival-visibility.png)
- **Purpose**: Indicates plumber has arrived at store pickup counter
- **Main Actions**: Verify Plumber Code, Handover Package
- **Backend APIs**: `GET /api/v1/material-requests/{id}`
- **Status**: `PASS`

### 62. Store App: Plumber Package Collection Verification
- **File Path**: [`evidence/ppt-screenshots/store-17-plumber-collection-visibility.png`](evidence/ppt-screenshots/store-17-plumber-collection-visibility.png)
- **Purpose**: Handover verification screen showing package items being handed to plumber
- **Main Actions**: Confirm Collection Button
- **Backend APIs**: `GET /api/v1/material-requests/{id}`
- **Status**: `PASS`

### 63. Store App: Collection Confirmation Screen
- **File Path**: [`evidence/ppt-screenshots/store-18-confirm-collection.png`](evidence/ppt-screenshots/store-18-confirm-collection.png)
- **Purpose**: Final store confirmation completing material handover transaction
- **Main Actions**: Complete Handover, View Order Log
- **Backend APIs**: `POST /api/v1/material-requests/{id}/confirm-collection`
- **Status**: `PASS`

### 64. Store App: Direct Customer Orders Fulfillment Screen
- **File Path**: [`evidence/ppt-screenshots/store-19-checkout-orders.png`](evidence/ppt-screenshots/store-19-checkout-orders.png)
- **Purpose**: Store pickup orders placed directly by customers for over-the-counter collection
- **Main Actions**: Process Order, Verify OTP
- **Backend APIs**: `GET /api/v1/stores/me/orders`
- **Status**: `PASS`

### 65. Store App: Store Order History Log Screen
- **File Path**: [`evidence/ppt-screenshots/store-20-order-history.png`](evidence/ppt-screenshots/store-20-order-history.png)
- **Purpose**: Historical record of fulfilled material requests and direct customer sales
- **Main Actions**: Filter Date, Export Transactions
- **Backend APIs**: `GET /api/v1/stores/me/orders`
- **Status**: `PASS`

### 66. Store App: Store Manager Profile Screen
- **File Path**: [`evidence/ppt-screenshots/store-21-profile.png`](evidence/ppt-screenshots/store-21-profile.png)
- **Purpose**: Manager identity information, store manager role credentials, and contact details
- **Main Actions**: Edit Profile, Change Password
- **Backend APIs**: `GET /api/v1/auth/me, GET /api/v1/users/me`
- **Status**: `PASS`

### 67. Store App: Store Settings Screen
- **File Path**: [`evidence/ppt-screenshots/store-22-settings.png`](evidence/ppt-screenshots/store-22-settings.png)
- **Purpose**: Warehouse operating preferences, alert tones, and system sync options
- **Main Actions**: Toggle Alerts, System Health Check
- **Backend APIs**: `GET /api/v1/users/me`
- **Status**: `PASS`

### 68. Store App: Store Manager Logout Screen
- **File Path**: [`evidence/ppt-screenshots/store-23-logout.png`](evidence/ppt-screenshots/store-23-logout.png)
- **Purpose**: Session termination prompt returning manager to store login screen
- **Main Actions**: Confirm Logout, Cancel
- **Backend APIs**: `POST /api/v1/auth/logout`
- **Status**: `PASS`

### 69. Cross-App Workflow: Workflow Step 1: Customer Creates Request
- **File Path**: [`evidence/ppt-screenshots/workflow-01-customer-creates-request.png`](evidence/ppt-screenshots/workflow-01-customer-creates-request.png)
- **Purpose**: Customer submits service order request on Customer Web app
- **Main Actions**: Submit Request
- **Backend APIs**: `POST /api/v1/service-orders`
- **Status**: `PASS`

### 70. Cross-App Workflow: Workflow Step 2: Plumber Accepts Job
- **File Path**: [`evidence/ppt-screenshots/workflow-02-plumber-receives-accepts-job.png`](evidence/ppt-screenshots/workflow-02-plumber-receives-accepts-job.png)
- **Purpose**: Plumber views new job notification and accepts job assignment on Plumber Web app
- **Main Actions**: Accept Job
- **Backend APIs**: `POST /api/v1/orders/{id}/accept`
- **Status**: `PASS`

### 71. Cross-App Workflow: Workflow Step 3: Plumber Requests Materials
- **File Path**: [`evidence/ppt-screenshots/workflow-03-plumber-requests-materials.png`](evidence/ppt-screenshots/workflow-03-plumber-requests-materials.png)
- **Purpose**: Plumber selects required plumbing parts and submits material request to nearest store
- **Main Actions**: Submit Material Request
- **Backend APIs**: `POST /api/v1/service-orders/{id}/material-requests`
- **Status**: `PASS`

### 72. Cross-App Workflow: Workflow Step 4: Store Receives Request
- **File Path**: [`evidence/ppt-screenshots/workflow-04-store-receives-material-request.png`](evidence/ppt-screenshots/workflow-04-store-receives-material-request.png)
- **Purpose**: Store Manager sees incoming material request in warehouse queue on Store Web app
- **Main Actions**: View Request
- **Backend APIs**: `GET /api/v1/stores/me/material-requests`
- **Status**: `PASS`

### 73. Cross-App Workflow: Workflow Step 5: Store Approves & Stages Package
- **File Path**: [`evidence/ppt-screenshots/workflow-05-store-approves-prepares-ready.png`](evidence/ppt-screenshots/workflow-05-store-approves-prepares-ready.png)
- **Purpose**: Store approves request, reserves inventory stock, and marks package READY FOR PICKUP
- **Main Actions**: Approve & Mark Ready
- **Backend APIs**: `POST /api/v1/material-requests/{id}/approve`
- **Status**: `PASS`

### 74. Cross-App Workflow: Workflow Step 6: Plumber Arrives & Collects Parts
- **File Path**: [`evidence/ppt-screenshots/workflow-06-plumber-arrives-collects-materials.png`](evidence/ppt-screenshots/workflow-06-plumber-arrives-collects-materials.png)
- **Purpose**: Plumber arrives at store pickup counter and collects package
- **Main Actions**: Collect Package
- **Backend APIs**: `POST /api/v1/plumber/material-requests/{id}/collect`
- **Status**: `PASS`

### 75. Cross-App Workflow: Workflow Step 7: Store Confirms Handover
- **File Path**: [`evidence/ppt-screenshots/workflow-07-store-confirms-collection.png`](evidence/ppt-screenshots/workflow-07-store-confirms-collection.png)
- **Purpose**: Store Manager registers material handover confirmation in store system
- **Main Actions**: Confirm Collection
- **Backend APIs**: `POST /api/v1/material-requests/{id}/confirm-collection`
- **Status**: `PASS`

### 76. Cross-App Workflow: Workflow Step 8: Plumber Completes Repair
- **File Path**: [`evidence/ppt-screenshots/workflow-08-plumber-resumes-completes-work.png`](evidence/ppt-screenshots/workflow-08-plumber-resumes-completes-work.png)
- **Purpose**: Plumber resumes repair at customer site and marks job COMPLETED
- **Main Actions**: Complete Job
- **Backend APIs**: `POST /api/v1/orders/{id}/complete`
- **Status**: `PASS`

### 77. Cross-App Workflow: Workflow Step 9: Customer Views Completed Order
- **File Path**: [`evidence/ppt-screenshots/workflow-09-customer-views-final-status.png`](evidence/ppt-screenshots/workflow-09-customer-views-final-status.png)
- **Purpose**: Customer app updates in real-time showing order state COMPLETED and invoice summary
- **Main Actions**: Rate Plumber, View Invoice
- **Backend APIs**: `GET /api/v1/orders/{id}`
- **Status**: `PASS`
