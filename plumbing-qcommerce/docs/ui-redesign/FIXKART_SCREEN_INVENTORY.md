# FIXKART SCREEN INVENTORY

## Customer App (15 screens)

| # | Screen | Route | File | Status |
|---|--------|-------|------|--------|
| 1 | SplashScreen | splash | screens/auth/SplashScreen.tsx | Audit complete, uses theme tokens |
| 2 | LoginScreen | login | screens/auth/LoginScreen.tsx | Audit complete, form validation improved |
| 3 | OtpScreen | otp | screens/auth/OtpScreen.tsx | Audit complete, theme-aligned |
| 4 | HomeScreen | home | screens/home/HomeScreen.tsx | Audit complete, section hierarchy solid |
| 5 | SearchScreen | search | screens/catalog/SearchScreen.tsx | Audit complete, filter/search working |
| 6 | ServiceDetailScreen | service_detail | screens/catalog/ServiceDetailScreen.tsx | Audit complete, booking flow intact |
| 7 | ProductDetailScreen | product_detail | screens/catalog/ProductDetailScreen.tsx | Audit complete, spec display good |
| 8 | CartScreen | cart | screens/cart/CartScreen.tsx | Audit complete, bill breakdown solid |
| 9 | CheckoutScreen | checkout | screens/checkout/CheckoutScreen.tsx | Audit complete, slot/payment selection |
| 10 | PaymentSuccessScreen | payment_success | screens/checkout/PaymentSuccessScreen.tsx | Audit complete, confirmation flow |
| 11 | OrdersScreen | orders | screens/orders/OrdersScreen.tsx | Updated to use StatusChip + statusUtils |
| 12 | OrderTrackingScreen | order_tracking | screens/orders/OrderTrackingScreen.tsx | Audit complete, timeline/tracking/materials |
| 13 | ProfileScreen | profile | screens/profile/ProfileScreen.tsx | Audit complete, menu structure good |
| 14 | SavedAddressesScreen | saved_addresses | screens/profile/SavedAddressesScreen.tsx | Audit complete, CRUD modal |
| 15 | SupportChatScreen | support_chat | screens/support/SupportChatScreen.tsx | Audit complete, quick replies |

## Plumber App (25 screens)

| # | Screen | Route | Status |
|---|--------|-------|--------|
| 1 | SplashScreen | Splash | 20 shared components exist but 12 unused |
| 2 | LoginScreen | Login | Duplicate style paradigms |
| 3 | OtpScreen | Otp | Hardcoded border radius |
| 4 | RegisterScreen | Register | No theme tokens used |
| 5 | DashboardScreen | Dashboard | Fallback color patterns |
| 6 | JobsScreen | Jobs | Minified single line file |
| 7 | IncomingJobRequest | IncomingJobRequest | Hardcoded colors (#0F172A, #10B981) |
| 8 | ActiveJobScreen | ActiveJob | Hardcoded green (#10B981) |
| 9 | NavigationScreen | Navigation | Hardcoded red tones |
| 10 | ReachedCustomerScreen | ReachedCustomer | Hardcoded dimensions |
| 11 | StartWorkScreen | StartWork | Two button paradigms |
| 12 | MaterialsScreen | Materials | Broken navigation |
| 13 | StoreSelectionScreen | StoreSelection | No PrimaryButton used |
| 14 | MaterialRequestScreen | MaterialRequest | Hardcoded footer radius |
| 15 | MaterialApprovalStatusScreen | MaterialApprovalStatus | Always shows "Approved" |
| 16 | MaterialTrackingScreen | MaterialTracking | Hardcoded guidance colors |
| 17 | BeforePhotosScreen | BeforePhotos | Duplicate of AfterPhotosScreen |
| 18 | AfterPhotosScreen | AfterPhotos | Duplicate of BeforePhotosScreen |
| 19 | CompleteServiceScreen | CompleteService | 3 states in one file |
| 20 | EarningsScreen | Earnings | Minified single line |
| 21 | WalletScreen | Wallet | Mock fallback data |
| 22 | JobHistoryScreen | JobHistory | Missing onPress handler |
| 23 | ProfileScreen | Profile | No shared components used |
| 24 | DrawerMenuScreen | DrawerMenu | Hardly any theme tokens |
| 25 | ChatScreen | Chat | Mock only |

## Store App (25 screens)

| # | Screen | Route | Status |
|---|--------|-------|--------|
| 1 | SplashScreen | Splash | Navy brand background |
| 2 | LoginScreenNew | Login | Good — uses PrimaryButton |
| 3 | LoginScreen (legacy) | — | Duplicate file (should be removed) |
| 4 | RegisterScreen | Register | Hardcoded border radius |
| 5 | DashboardScreen | Dashboard | Stats grid, low stock alerts |
| 6 | InventoryScreen | Inventory | Inline product card (duplicate) |
| 7 | ProductDetailsScreen | ProductDetails | No shared buttons |
| 8 | AddProductScreen | AddProduct | Duplicate radio pattern |
| 9 | LowStockAlertScreen | LowStockAlert | 100% hardcoded mock |
| 10 | MaterialRequestsScreen | MaterialRequests | Chip tabs vs underline tabs |
| 11 | MaterialRequestDetailScreen | MaterialRequestDetail | No shared buttons |
| 12 | PackingScreen | Packing | Colors.secondary orange bug (FIXED) |
| 13 | ReadyForPickupScreen | ReadyForPickup | Colors.secondary orange bug (FIXED) |
| 14 | CollectionConfirmationScreen | CollectionConfirmation | Colors.secondary orange bug (FIXED) |
| 15 | OrdersScreen | Orders | Feature placeholder |
| 16 | OrderDetailsScreen | OrderDetails | 100% hardcoded mock |
| 17 | AccountScreen | Account | Inline menu duplicating ProfileMenuItem |
| 18 | StoreProfileScreen | StoreProfile | Inline save button |
| 19 | NotificationsScreen | Notifications | Inline card duplicating NotificationCard |
| 20 | SalesAnalyticsScreen | SalesAnalytics | Charts unused, PDF broken on RN |
| 21 | WeeklySummaryScreen | WeeklySummary | Width: 47%, duplicates metric cards |
| 22 | ReviewsRatingsScreenNew | ReviewsRatings | Good — uses shared ReviewCard |
| 23 | WalletScreen | Wallet | Feature placeholder |
| 24 | OffersPromotionsScreen | OffersPromotions | Feature placeholder |
| 25 | DispatchAssignmentScreen | DispatchAssignment | Feature placeholder |

## Admin Portal (48 pages)

| Section | Pages | Covered |
|---------|-------|---------|
| Super Admin | Dashboard, Users, Users/[id], Admins, Roles, System Health, Settings | 7 |
| Operations | Dashboard, Orders, Orders/[id], Service Jobs, Service Jobs/[id], Material Requests, Material Pickups, Delivery Partners, Delayed, Reassignments | 10 |
| Finance | Dashboard, Payments, Payments/[id], Settlements, Payouts/Plumbers, Payouts/Delivery, Refunds, Commission Report | 8 |
| Support | Dashboard, Tickets, Tickets/[id], Escalations, Create Ticket, User Context | 6 |
| Plumber Manager | Dashboard, Plumbers, Plumbers/[id], KYC, KYC/[id], Performance, Earnings | 7 |
| Marketing | Dashboard, Offers, Offers/[id], Campaigns, Campaigns/[id], Banners, Notifications, Segments, Reports | 9 |
| System | Root /login, Analytics redirect, Settings placeholder | 3 |

---

**Total screens/pages across all 4 apps: 113**