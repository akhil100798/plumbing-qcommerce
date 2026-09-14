# Isolated QA database verification

Database: fixkart_retest_20260914. Host: existing local Docker Postgres, pqc_postgres. User: admin. Initial public table count: 0. Current observed table count: 28; Flyway through V20 successful.

Original plumbing_commerce directly modified by QA SQL: NO. Docker Desktop restart automatically resumed the legacy pqc_backend briefly; it was stopped. No direct SQL mutations targeted plumbing_commerce. Independent effects of that pre-existing backend were not audited.

Evidence: logs/db-after-seeding-continuation.txt; logs/backend-isolated-ready-qa.log; logs/backend-launch-corrected-continuation.json. Original failed investigation preserved in evidence-history/pre-continuation.
