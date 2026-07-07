# Phase 13B.3 Local Kafka/Zookeeper Cleanup

## Root cause summary
The local Kafka broker had previously failed with a stale Zookeeper broker-registration `NodeExists` condition at `/brokers/ids/1`. The issue was isolated to the local Compose-managed Kafka/Zookeeper pair and did not affect PostgreSQL, Redis, or MongoDB data.

## Compose services and settings
- Compose file: `docker-compose.yml`
- Kafka service: `kafka`
- Zookeeper service: `zookeeper`
- Kafka container: `pqc_kafka`
- Zookeeper container: `pqc_zookeeper`
- Kafka broker id: `1`
- Kafka advertised listeners: `PLAINTEXT://localhost:9092`
- Kafka port: `9092`
- Zookeeper port: `2181`
- Named Compose volumes in this repo: `pgdata`, `redisdata`, `mongodata`
- Dedicated named Kafka/Zookeeper volumes: none declared in `docker-compose.yml`

## Initial observed state
- Branch: `phase13a-local-staging-sms`
- Previous commit: `4099e9d`
- Working tree before cleanup was clean except untracked `edge-service/local-staging.security.smoke.js`
- Historical Kafka logs showed the stale `NodeExists` broker-registration failure.

## Non-destructive restart result
Performed the requested non-destructive recovery only:
1. `docker compose stop kafka zookeeper`
2. `docker compose rm -f kafka zookeeper`
3. `docker compose up -d zookeeper kafka`

The first attempt partially recreated Kafka while leaving the old stopped Zookeeper container in place, so the restart sequence was completed correctly by removing the stopped Zookeeper container and recreating both services together. No volume deletion was required.

## Volume cleanup requirement
- Targeted volume cleanup needed: `NO`
- Volumes removed: none
- PostgreSQL data untouched: `YES`
- Redis data untouched: `YES`
- MongoDB data untouched: `YES`

## Final Kafka/Zookeeper status
- Zookeeper: `UP`
- Kafka: `UP`
- `NodeExists` still present after corrected restart: `NO`
- Kafka topic probe command: `docker exec pqc_kafka kafka-topics --bootstrap-server localhost:9092 --list`
- Kafka topic probe result: command exited successfully with no topic output, consistent with an empty healthy broker
- Host Kafka port check: `localhost:9092` reachable

## Backend validation after cleanup
- Backend health after Kafka cleanup: `UP`
- API docs after Kafka cleanup: HTTP `200`

## Remaining blockers
- None from the local Kafka/Zookeeper stability issue.
- Later Phase 13C work remains separate.
- Production deployment remains `NO`.

## Verdict
Local Kafka/Zookeeper infrastructure is stable after non-destructive container recreation. No data volumes were removed.
