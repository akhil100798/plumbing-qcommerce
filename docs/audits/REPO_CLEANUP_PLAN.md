# FixKart repository cleanup plan

Every dirty/untracked path is covered by one category below.

## A. KEEP — PRODUCT SOURCE

Keep all 17 modified source files under:

- `plumbing-qcommerce/customer-app/src/**`
- `plumbing-qcommerce/plumber-app/src/**`
- `plumbing-qcommerce/store-app/src/**`

These contain the Customer API-base/OTP remediation, Plumber auth/material/photo
workflow fixes, and Store auth/accessibility/material-flow fixes. No product
source file will be deleted or reverted.

## B. KEEP — PRODUCT TEST

Keep:

- `plumbing-qcommerce/plumber-app/App.test.tsx`
- `plumbing-qcommerce/plumber-app/src/services/materials/materialService.resume.test.ts`

They protect the current React Native test mock and the persisted Resume
transition, including the already-resumed no-mutation case.

## C. KEEP — MIGRATION / CONFIGURATION

No dirty migration/configuration file is present. Existing tracked V21 and
package/config files remain unchanged.

## D. KEEP — FINAL QA EVIDENCE

Keep the authoritative final report, ledger, reconciliation, defect, coverage,
security, accessibility, network, console, responsive, lifecycle, root-cause,
fingerprint, evidence-index, and manifest files in
`reports/final-local-regression-20260916/`. Keep selected lifecycle/auth/RBAC/
accessibility/network JSON evidence and the Resume/photo diagnostic evidence.
Keep `reports/secondary-remediation-20260916/` compact reports and referenced
current remediation evidence. Preserve the open nested-button defect evidence:
the Customer Orders console capture and source path remain available.

Final evidence files are classified by exact path after cleanup in
`REPO_CLEANUP_RESULT.md`; generated scripts and duplicate screenshots are not
part of the authoritative evidence set.

## E. KEEP — DOCUMENTATION

Keep this inventory, this plan, the cleanup result, and the final certification
Markdown/CSV documentation. Keep tracked repository documentation unchanged.

## F. ARCHIVE OUTSIDE REPOSITORY

Move, preserving relative directory structure, to
`C:/Users/akhil/OneDrive/Desktop/Workspace/fixkart-qa-archive/20260917/`:

- `reports/full-local-regression-20260916/`
- `reports/release-blocker-runtime-certification-20260915/`

These are useful historical runs but are superseded by the final local report.
The archive is outside Git; the final evidence index will record its location.

## G. DELETE — GENERATED / TEMPORARY

After verifying paths, individually remove:

- `backend/uploads/` runtime-generated photo binaries
- `customer-app/dist-final-local/`, `dist-local-qa/`, `dist-local-qa2/`
- root scratch lists `artifact_paths.txt`, `tmp_artifact_focus.txt`,
  `tmp_artifact_list.txt`
- `qa-photo-fixture.png` after the final lifecycle synthesis is retained
- obsolete one-off final-report generators and diagnostic scripts whose results
  are already in the authoritative report
- duplicate/debug screenshots and process logs with no unique referenced fact

No Git bulk-clean command will be used.

## H. INVESTIGATE BEFORE DECISION

No product source or product test is in this category. Any final evidence file
with a relative link required by the authoritative report is retained until the
link is replaced with a compact final-evidence reference.

## Exact execution set

The following exact targets are disposable and will be removed only after this
plan is recorded:

- `plumbing-qcommerce/backend/uploads/`
- `plumbing-qcommerce/customer-app/dist-final-local/`
- `plumbing-qcommerce/customer-app/dist-local-qa/`
- `plumbing-qcommerce/customer-app/dist-local-qa2/`
- repository-root `artifact_paths.txt`, `tmp_artifact_focus.txt`, and
  `tmp_artifact_list.txt`
- all one-off `.cjs` runners under the two report directories; their sanitized
  JSON/CSV/Markdown outputs are retained
- duplicate empty/alias console and network captures: unqualified console
  captures, `network/customer.json`, `network/plumber.json`,
  `network/store.json`, and the duplicate pre-ready resume JSON

The retained report directories contain the authoritative ledgers, summaries,
root-cause documents, sanitized runtime JSON, lifecycle proof, and selected
screenshots. No product source, product test, migration, or runtime
configuration is in the deletion set.
