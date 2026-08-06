# Development-Only Commits vs Phase 13

## Overview

Development contains **18 commits** that are not present in `phase13a-local-staging-sms`.
These represent all improvements added to Development after Phase 13 was branched.

## Commit Classification Table

| # | SHA | Date | Message | Area | Classification |
|---|-----|------|---------|------|---------------|
| 1 | a192635 | 2026-07-03 | Merge PR#1 from phase12e-mobile-release-gates | Mobile/CI | MERGE COMMIT — mobile release gates |
| 2 | 83cd8dc | 2026-07-07 | Merge PR#2 from phase13a-local-staging-sms | Phase 13 | MERGE COMMIT — brings Phase 13 into main |
| 3 | acd1092 | 2026-07-07 | Merge PR#3 from phase13a-local-staging-sms | Phase 13 | MERGE COMMIT — brings Phase 13 into main |
| 4 | d32cce4 | 2026-07-08 | Merge PR#4 from phase13a-local-staging-sms | Phase 13 | MERGE COMMIT — brings Phase 13 into main |
| 5 | dbc9a28 | 2026-07-08 | Merge PR#5 from phase13a-local-staging-sms | Phase 13 | MERGE COMMIT — brings Phase 13 into main |
| 6 | 4920370 | 2026-07-12 | Merge PR#6 from phase13a-local-staging-sms | Phase 13 | MERGE COMMIT — brings Phase 13 into main |
| 7 | c92bd6c | 2026-07-19 | Merge PR#7 from phase13a-local-staging-sms | Phase 13 | MERGE COMMIT — brings Phase 13 into main |
| 8 | 51f2668 | 2026-07-27 | fix: connect store collection confirmation to plumber pickup API | Backend/Mobile | CRITICAL — store collection API integration |
| 9 | 9189136 | 2026-08-05 | fix: preserve authenticated nested navigation | Mobile/Plumber | CRITICAL — back-navigation fix |
| 10 | c878b42 | 2026-08-05 | fix: remove store and material tracking fallback data | Mobile/Store | IMPORTANT — removes stale mock data |
| 11 | 6896254 | 2026-08-05 | fix: remove legacy delivery pickup ui | Mobile/Plumber | IMPORTANT — removes delivery UI |
| 12 | d4185a3 | 2026-08-05 | test: add strict frontend navigation evidence | Tests | IMPORTANT — navigation test evidence |
| 13 | 144a345 | 2026-08-06 | feat: expose backend build and deployment version metadata | Backend | IMPORTANT — /version endpoint |
| 14 | f69bd21 | 2026-08-06 | docs: add final Render deployment report and rollback plan | Docs | DOCUMENTATION |
| 15 | 5c5e065 | 2026-08-06 | merge: reconcile main branch commits into Development | Git | MERGE — brings all main PRs into Development |
| 16 | 9f29825 | 2026-08-06 | docs: add reconciled main-development audit reports and QA evidence | Docs | DOCUMENTATION |
| 17 | ed4cf1c | 2026-08-06 | fix: align plumber navigation tests with typed route names | CI/Tests | CRITICAL — fixes CI typecheck failure |
| 18 | 177b5c6 | 2026-08-06 | docs: update commit hash in plumber navigation CI report | Docs | DOCUMENTATION |

## Key Development Improvements vs Phase 13

### Backend
- **GET /version**: New endpoint returning build metadata (branch, commit, buildTime, version). Allowed unauthenticated. Added to SecurityConfig permitting and HealthAndActuatorTest.

### Mobile Apps
- **Store collection confirmation**: Connected store collection confirmation screen to the plumber pickup API.
- **Authenticated nested navigation**: Fixed back-navigation that previously popped out of the authenticated Main navigator.
- **Mock data removal**: Removed all fallback/mock data from StoreSelectionScreen and MaterialTrackingScreen.
- **Legacy delivery UI removed**: Removed delivery partner pickup UI from plumber app.
- **Plumber navigation types fixed**: Resolved TS2322/TS2820 CI typecheck failures by aligning test route names with registered `MainTabParamList` keys.

### CI & Tests
- **Navigation test fix**: Updated navigation.test.ts to use `satisfies Array<keyof MainTabParamList>` with correct route names.
- **NavigatorScreenParams typing**: Typed `Main: NavigatorScreenParams<MainTabParamList> | undefined` in AppStackParamList.
- **Removed `as any` casts**: Replaced `{ screen: 'HomeTab' } as any` with typed `{ screen: 'Home' }`.

### Git Reconciliation
- Merged `main` (with 7 PR merge commits from Phase 13) into Development cleanly. Development is now 0 commits behind main.
