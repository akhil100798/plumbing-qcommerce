# QA evidence inventory

Recursive workspace search found 1170 relevant artifact files, excluding dependency/build/vendor trees. Every discovered file is indexed in artifact-classification.csv. Prior inventory is preserved in evidence-history/pre-continuation.

Canonical prior sources: coverage-cases.csv (646 assertions) and control-coverage.csv (63 finer control rows). All 709 are retained. The 63 controls overlap aggregate feature assertions; this conservative reconciliation count is not 709 independent features. coverage-matrix, blocked-tests, not-tested, role-matrix, runtime-control-inventory, and source-screen-inventory are derived views/inventories rather than additional executed assertion sets.

Other reports read: reports/production-readiness/FIXKART_PRODUCTION_READINESS_REPORT.md (older Development SHA b2dacdb, unsupported narrative lifecycle and fixed example IDs); customer-app/CUSTOMER_BACKEND_INTEGRATION_REPORT.md (implementation claims, not fresh execution evidence); docs/ui-redesign/FIXKART_UI_REDESIGN_REPORT.md (design/static history); full-e2e-qa/REPORT.md and underlying JSON/screenshots. Their narrative claims are historical, not current PASS evidence. The production-readiness diagram's example IDs and OTP are never used in testing.

Current evidence classification limitations and excluded mock copies: INVALID_EVIDENCE.md.
