# Render vs Local Development Commit Comparison

## Git Commit Summary

```text
Repository root:          C:/Users/akhil/OneDrive/Desktop/Workspace/fixkart/plumbing-qcommerce
Current branch:           Development
Current local commit:     d4185a3df63053e3ae0b0eee0ad72e131b860d81
Remote Development ref:   origin/Development (DOES NOT EXIST ON REMOTE ORIGIN)
Remote main commit:       c92bd6c5bad30142df33adcd75a280bbfd046bfa
Render service URL:       https://plumbing-qcommerce.onrender.com
Render deployed commit:   UNCONFIRMED (HTTP requests to Render time out)
Version evidence source:  UNCONFIRMED — NO DIRECT COMMIT EVIDENCE
Confidence:               UNCONFIRMED — NO DIRECT COMMIT EVIDENCE
Render vs Development:    BLOCKED — RENDER VERSION COULD NOT BE CONFIRMED
```

## Detailed Commit Log (Local Development Branch)

| Commit | Message | Date | Files Changed | Feature/Fix | Present on Render |
| ------ | ------- | ---- | ------------- | ----------- | ----------------- |
| `d4185a3` | test: add strict frontend navigation evidence | 2026-08-05 | 2 | Frontend navigation tests | Unconfirmed |
| `6896254` | fix: remove legacy delivery pickup ui | 2026-08-05 | 4 | UI cleanup for plumber pickup | Unconfirmed |
| `c878b42` | fix: remove store and material tracking fallback data | 2026-08-05 | 3 | Remove mock fallback data | Unconfirmed |
| `9189136` | fix: preserve authenticated nested navigation | 2026-08-05 | 2 | Navigation stability | Unconfirmed |
| `51f2668` | fix: connect store collection confirmation to plumber pickup API | 2026-08-05 | 5 | Plumber material pickup workflow | Unconfirmed |
| `04b45b2` | feat: connect plumber app screens to backend workflow | 2026-08-05 | 8 | Plumber workflow integration | Unconfirmed |
| `3815370` | feat: update DrawerMenuScreen with online switch and clean menu list reference UI | 2026-08-05 | 3 | Plumber UI enhancement | Unconfirmed |
| `83d88f3` | feat: update ProfileScreen and JobHistoryScreen with Avatar and MenuRow reference UI | 2026-08-05 | 3 | Plumber UI enhancement | Unconfirmed |
| `1424ea5` | feat: integrate Screens 13-17 into plumber app with PhotoGrid and BarChart | 2026-08-05 | 6 | Plumber UI analytics | Unconfirmed |
| `42c09df` | feat: enhance plumber app screens with reference UI components | 2026-08-05 | 5 | Plumber UI design | Unconfirmed |
| `36569e6` | feat: integrate FixKart plumber mobile UI screens | 2026-08-05 | 7 | Mobile UI integration | Unconfirmed |
| `8fc6dc9` | feat: complete FixKart release-candidate implementation and verification | 2026-08-05 | 12 | Release candidate verification | Unconfirmed |
| `571f75d` | feat: complete FixKart store pickup workflow verification and fix database constraint checks | 2026-08-05 | 9 | Store pickup & DB constraints | Unconfirmed |
| `a246e20` | test: align delivery flag and pickup migration coverage | 2026-08-05 | 4 | Flyway & feature flag tests | Unconfirmed |
| `834c295` | fix: remove production mock fallbacks and connect pickup APIs | 2026-08-05 | 8 | Material pickup API connection | Unconfirmed |
| `c268293` | feat: add plumber store pickup material workflow | 2026-07-26 | 15 | Plumber self-pickup workflow & V15 migration | Unconfirmed |

## Deployment Impact Analysis

Because the Render service at `https://plumbing-qcommerce.onrender.com` is unreachable (HTTP connection requests to Cloudflare time out after 60s), the exact deployed commit SHA cannot be verified programmatically or via HTTP endpoints. 

If Render was deployed from `main` (`c92bd6c`), it is missing all recent material pickup workflow features (`c268293` through `d4185a3`), Flyway migrations V15-V19, and delivery flag configuration.

## Deployment Recommendation
Re-trigger build/deploy on Render from the `Development` branch after pushing local `Development` to a tracked remote repository branch, and verify that the instance boots cleanly.
