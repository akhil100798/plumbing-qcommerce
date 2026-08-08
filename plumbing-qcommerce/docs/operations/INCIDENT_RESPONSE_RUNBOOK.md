# FixKart Incident Response Runbook (`INCIDENT_RESPONSE_RUNBOOK.md`)

Protocol for handling production outages, service degradation, and security incidents:

---

## 1. Incident Classification
- **SEV-1 (Critical)**: Complete outage of backend API or database; customer unable to place bookings or plumbers unable to perform self-pickup.
- **SEV-2 (High)**: Major component failure (e.g. image delivery degradation, admin portal offline) with functional workaround.
- **SEV-3 (Low)**: Minor UI glitch or non-critical background task delay.

---

## 2. Immediate Response Steps
1. **Acknowledge Incident**: Notify SRE team and log incident start time.
2. **Inspect Health Endpoints**:
   - `/health/live` (Liveness)
   - `/health/ready` (Readiness)
   - `/actuator/health` (Component diagnostics)
3. **Inspect Application Logs**: Check Render service logs for exceptions or DB connection pool exhaustion.
4. **Execute Remediation**: Rollback deployment or restart container if necessary.
