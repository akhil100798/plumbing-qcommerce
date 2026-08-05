# FixKart Plumber App — Backend Screen Contract Map

| Screen | Data Needed | Current Frontend Service Call | Expected Backend Endpoint | Status |
|---|---|---|---|---|
| 1. Splash | Token Verification / Initial App Load | `authService.getProfile()` | `GET /api/v1/users/me` | READY |
| 2. Login | Email/Password Auth & Role Verification | `authService.login()` | `POST /api/v1/auth/login` | READY |
| 3. OTP Verification | 6-Digit Verification Code | Local Auth / Phone OTP | UI Only / `POST /api/v1/auth/verify-otp` | UI SKELETON |
| 4. Dashboard | Plumber Profile, Status, Today Earnings, Overview Counts, Upcoming Job | `plumberDashboardService.getDashboard()` | `GET /api/v1/plumber/dashboard` | WIRED |
| 5. Incoming Job Request | Pending / Assigned Jobs, Accept Action | `jobService.acceptJob()` | `GET /api/v1/orders/status/PENDING`, `PATCH /api/v1/orders/{id}/accept` | WIRED |
| 6. Active Job | Selected Active Job Details & Customer Info | `jobService.getActiveJob()` | `GET /api/v1/orders/{id}`, `GET /api/v1/orders/plumber` | WIRED |
| 7. Navigation | Start Navigation / Route Details | `jobService.startNavigation()` | `PATCH /api/v1/orders/{id}/start-navigation` or `on-the-way` | WIRED |
| 8. Reached Customer | Confirm Arrival | `jobService.markArrived()` | `PATCH /api/v1/orders/{id}/arrive` | WIRED |
| 9. Start Work | Pre-work Checklist & Start Work Action | `jobService.startWork()` | `PATCH /api/v1/orders/{id}/start-work` or `start` | WIRED |
| 10. Material Request | Catalog Products, Store Selection, Create Request | `materialService.createRequest()` | `GET /api/v1/catalog/products`, `POST /api/v1/material-requests` | WIRED |
| 11. Material Approval Status | Request Status, Items, Cost Breakdown | `materialService.fetchMaterialStatus()` | `GET /api/v1/plumber/orders/{orderId}/material-request` | WIRED |
| 12. Material Tracking | Order Delivery Timeline, Delivery Agent Contact | `materialService.getTracking()` | `GET /api/v1/plumber/material-requests/{id}/tracking` | WIRED |
| 13. Before Photos | Before Work Photo Upload | `photoService.uploadBefore()` | `POST /api/v1/orders/{id}/photos/before` | HONEST PENDING |
| 14. After Photos | After Work Photo Upload | `photoService.uploadAfter()` | `POST /api/v1/orders/{id}/photos/after` | HONEST PENDING |
| 15. Complete Service | Complete Job, Part Charge, Customer Payout | `jobService.completeJob()` | `POST /api/v1/orders/{id}/complete` | WIRED |
| 16. Earnings | Earnings Breakdown (Today, Weekly, Tips, Jobs) | `earningsService.fetchEarnings()` | `GET /api/v1/plumber/earnings` | WIRED |
| 17. Wallet | Wallet Balance, Top-up, Withdraw, Transactions | `walletService.getWallet()`, `walletService.getTransactions()` | `GET /api/v1/wallet`, `GET /api/v1/wallet/transactions` | WIRED |
| 18. Job History | Historical Completed / Cancelled Jobs List | `jobService.getHistory()` | `GET /api/v1/orders/plumber/history` | WIRED |
| 19. Profile | Profile Info, Star Rating, Availability Switch, Logout | `profileService.updateAvailability()`, `authService.logout()` | `POST /api/v1/users/me/availability`, `GET /api/v1/users/me` | WIRED |
| 20. Drawer / Menu | Navigation Links, Online Switch, Logout | `profileService.updateAvailability()`, `authService.logout()` | `POST /api/v1/users/me/availability`, `GET /api/v1/users/me` | WIRED |
