# Evidence index

- FIXKART_LOCAL_REGRESSION_RETEST_REPORT.md: conclusion and scope.
- retest-master.csv: every historical assertion/control and current evidence.
- prior-defect-reconciliation.csv: exactly one local status per prior defect plus remote status.
- logs/: static logs, live auth/API, lifecycle and browser snapshots.
- network/: sanitized per-app request and console capture.
- screenshots/: real Chrome screenshots; use artifact-classification.csv to exclude stale/mock images.
- evidence-history/: original report files preserved before reconciliation.
- INVALID_EVIDENCE.md: invalid/stale/mislabeled evidence rules.
- reconciliation-proof.json: machine-checked counts.
- manifest-sha256.csv: safe current evidence hashes; excludes itself.
