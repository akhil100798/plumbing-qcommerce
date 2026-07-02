# Credential Rotation Checklist

## Incident Summary

A committed environment example file contained deployment credentials. Git history must be treated as compromised. Editing or deleting the working-tree file is not enough.

## Credentials to Rotate

* Redis credentials
* PostgreSQL credentials
* JWT signing secret
* MongoDB credentials
* Kafka credentials
* Render deployment/environment values if exposed

## Required Manual Actions

1. Rotate Redis credentials immediately.
2. Rotate PostgreSQL database password.
3. Rotate JWT signing secret and invalidate old sessions/tokens.
4. Rotate MongoDB Atlas database user password.
5. Rotate Kafka/Aiven credentials.
6. Review Render environment variables and deployment logs.
7. Remove old credentials from every hosting provider.
8. Redeploy backend, edge-service, admin portal, and apps using new environment variables only.
9. Run a full-history secret scan.
10. Consider Git history cleanup using BFG or git-filter-repo only after rotation.

## Rule Going Forward

No real secrets may be committed. Use hosting provider environment variables or secret managers only.
