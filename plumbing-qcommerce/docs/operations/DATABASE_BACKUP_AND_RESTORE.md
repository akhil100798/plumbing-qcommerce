# FixKart Database Backup and Restore Runbook (`DATABASE_BACKUP_AND_RESTORE.md`)

Database reliability, backup scheduling, point-in-time recovery, and restore procedures:

---

## 1. Managed PostgreSQL Backup Strategy
- **Backup Provider**: Render Managed PostgreSQL
- **Automatic Snapshot Schedule**: Daily automated full database snapshots at 02:00 UTC.
- **Point-In-Time Recovery (PITR)**: 7-day rolling WAL log retention allowing point-in-time restoration.

---

## 2. Manual Backup Execution (pg_dump)
To take a manual pre-deployment backup snapshot:
```bash
pg_dump -h <RENDER_PG_HOST> -U <RENDER_PG_USER> -d <RENDER_PG_DB> -F c -b -v -f fixkart_backup_$(date +%Y%m%d_%H%M%S).dump
```

---

## 3. Database Restore Procedure
To restore from snapshot file:
```bash
pg_restore -h <RENDER_PG_HOST> -U <RENDER_PG_USER> -d <RENDER_PG_DB> --clean --if-exists -v fixkart_backup_20260808.dump
```
- **Post-Restore Verification**: Verify Flyway schema table `flyway_schema_history` integrity and run application readiness check (`/health/ready`).
