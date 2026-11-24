# FIXKART PLUMBER APP — 20 GOOGLE STITCH SCREEN MAPPING

This document maps all 20 exported Google Stitch reference designs to their exact implementation inside `plumbing-qcommerce/plumber-app/`.

---

## 1. Executive Screen Mapping Table

| # | Stitch Reference Directory | Implemented React Native Screen | Stack / Tab Route | Associated Redux / API Services | Automated Test Suite |
|---|---------------------------|----------------------------------|-------------------|----------------------------------|----------------------|
| 01 | `01_fixkart_splash` | `src/screens/auth/SplashScreen.tsx` | `Auth.Splash` | `tokenStorage`, `profileService`, `authSlice` | `App.test.tsx` |
| 02 | `02_fixkart_login` | `src/screens/auth/LoginScreen.tsx` | `Auth.Login` | `authService.loginWithPhone`, `authSlice` | `authService.test.ts` |
| 03 | `03_fixkart_otp` | `src/screens/auth/OtpScreen.tsx` | `Auth.Otp` | `authService.verifyOtp`, `tokenStorage` | `authService.test.ts` |
| 04 | `04_fixkart_dashboard` | `src/screens/dashboard/DashboardScreen.tsx` | `Main.Home` | `jobService`, `earningsService`, `profileService` | `App.test.tsx` |
| 05 | `05_fixkart_incomingjob` | `src/screens/jobs/IncomingJobRequestScreen.tsx` | `IncomingJobRequest` | `jobService.acceptJob`, `jobService.declineJob` | `phaseOneDeclineScreen.test.tsx` |
| 06 | `06_fixkart_activejob` | `src/screens/jobs/ActiveJobScreen.tsx` | `ActiveJob` | `jobService.getActiveJob`, `jobSlice` | `ActiveJobScreen.test.tsx` |
| 07 | `07_fixkart_navigation` | `src/screens/jobs/NavigationScreen.tsx` | `Navigation` | `jobService.markArrived`, `expo-location` | `NavigationScreen.test.tsx` |
| 08 | `08_fixkart_reachedcustomer` | `src/screens/jobs/ReachedCustomerScreen.tsx` | `ReachedCustomer` | `jobService.confirmArrival` | `jobService.test.ts` |
| 09 | `09_fixkart_startwork` | `src/screens/jobs/StartWorkScreen.tsx` | `StartWork` | `jobService.startWork` | `jobService.test.ts` |
| 10 | `10_fixkart_materialrequest` | `src/screens/materials/MaterialRequestScreen.tsx` | `MaterialRequest` | `materialService.createRequest`, `materialSlice` | `materialService.ts` |
| 11 | `11_fixkart_materialapproval` | `src/screens/materials/MaterialApprovalStatusScreen.tsx` | `MaterialApprovalStatus` | `materialService.getRequestStatus` | `materialService.ts` |
| 12 | `12_fixkart_materialtracking` | `src/screens/materials/MaterialTrackingScreen.tsx` | `MaterialTracking` | `materialService.confirmPickup` | `materialService.ts` |
| 13 | `13_fixkart_beforephotos` | `src/screens/photos/BeforePhotosScreen.tsx` | `BeforePhotos` | `expo-image-picker`, `jobService.uploadPhotos` | `jobService.test.ts` |
| 14 | `14_fixkart_afterphotos` | `src/screens/photos/AfterPhotosScreen.tsx` | `AfterPhotos` | `expo-image-picker`, `jobService.uploadPhotos` | `jobService.test.ts` |
| 15 | `15_fixkart_completeservice` | `src/screens/completion/CompleteServiceScreen.tsx` | `CompleteService` | `jobService.completeJob`, `jobSlice` | `jobService.test.ts` |
| 16 | `16_fixkart_earnings` | `src/screens/business/EarningsScreen.tsx` | `Main.Earnings` | `earningsService.getWeeklyEarnings` | `earningsService.ts` |
| 17 | `17_fixkart_wallet` | `src/screens/business/WalletScreen.tsx` | `Wallet` | `walletService.getWalletDetails` | `walletService.ts` |
| 18 | `18_fixkart_jobhistory` | `src/screens/business/JobHistoryScreen.tsx` / `JobsScreen.tsx` | `Main.Jobs` / `JobHistory` | `jobService.getJobHistory`, `phase2JobRepository` | `JobsScreen.test.tsx`, `phase2JobRepository.test.ts` |
| 19 | `19_fixkart_profile` | `src/screens/profile/ProfileScreen.tsx` | `Main.Profile` | `profileService.fetchProfile`, `kycService` | `App.test.tsx` |
| 20 | `20_fixkart_drawer` | `src/screens/profile/DrawerMenuScreen.tsx` | `Profile` (drawer) | `authSlice.logout`, `profileService` | `navigation.test.ts` |

---

## 2. Reconciled Additional Screens (Milestone D Logic)

The existing FixKart Plumber App contains business-critical Milestone D workflows that do not have direct 1:1 exported Stitch screens but are required for production operations. These screens use the exact Stitch Design System:

| Additional Screen | File Location | Purpose & Logic |
|-------------------|---------------|-----------------|
| `DiagnosisScreen` | `src/screens/jobs/DiagnosisScreen.tsx` | Diagnosis inspection, initial quotations, customer authorization, revised quotes |
| `StoreSelectionScreen` | `src/screens/materials/StoreSelectionScreen.tsx` | Partner store discovery, radius calculation, plumber store selection for material pickup |
| `MaterialsScreen` | `src/screens/materials/MaterialsScreen.tsx` | Active materials overview tab on main bottom navigation |
| `ChatScreen` | `src/screens/ChatScreen.tsx` | Direct in-app communication between assigned plumber and customer |
