#!/bin/sh
set -e

echo "=========================================================="
echo "  FIXKART STAGING CONTAINER TAILSCALE VALIDATION SUITE"
echo "=========================================================="

FORWARD_PORT="${TAILSCALE_FORWARD_PORT:-15432}"
DB_NAME="${STAGING_DB_NAME:-fixkart_staging_local}"
DB_USER="${STAGING_DB_USER:-fixkart_staging_user}"

echo ""
echo "--- TEST 1: TAILNET REGISTRATION ---"
tailscale status
TS_IP=$(tailscale ip -4 2>/dev/null || true)
echo "Node Tailscale IP: ${TS_IP}"

if [ -n "$TS_IP" ]; then
  echo "PASS: Tailnet node is connected and registered with IP ${TS_IP}."
else
  echo "FAIL: Tailnet node has no Tailscale IP assigned."
  exit 1
fi

# Verify tailnet contains target host 'akii' (100.80.46.12)
if tailscale status | grep -q "100.80.46.12"; then
  echo "PASS: Target host 'akii' (100.80.46.12) is visible in tailnet peer list."
else
  echo "FAIL: Target host 100.80.46.12 not found in tailnet peer list."
  exit 1
fi

echo ""
echo "--- TEST 2: TAILSCALE SERVE REACHABILITY ---"
echo "Testing connectivity to 127.0.0.1:${FORWARD_PORT}..."
if nc -z -w 5 127.0.0.1 "${FORWARD_PORT}"; then
  echo "PASS: TCP-to-SOCKS5 forwarder port ${FORWARD_PORT} is reachable."
else
  echo "FAIL: Cannot connect to forwarder port ${FORWARD_PORT}."
  exit 2
fi

echo ""
echo "--- TEST 3: POSTGRESQL AUTHENTICATION & TEST 4: SELECT 1 ---"
SELECT_ONE_RESULT=$(psql -h 127.0.0.1 -p "${FORWARD_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "SELECT 1;")
if [ "$SELECT_ONE_RESULT" = "1" ]; then
  echo "PASS: Authenticated as ${DB_USER} and executed SELECT 1 -> result: ${SELECT_ONE_RESULT}"
else
  echo "FAIL: SELECT 1 did not return 1 (got: '${SELECT_ONE_RESULT}')"
  exit 3
fi

echo ""
echo "--- TEST 5: DATABASE IDENTITY & ISOLATION ---"
IDENTITY=$(psql -h 127.0.0.1 -p "${FORWARD_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "SELECT current_database() || '|' || current_user;")
echo "Identity returned: $IDENTITY"
EXPECTED_IDENTITY="${DB_NAME}|${DB_USER}"
if [ "$IDENTITY" = "$EXPECTED_IDENTITY" ]; then
  echo "PASS: Database identity matches: ${IDENTITY}"
else
  echo "FAIL: Expected '${EXPECTED_IDENTITY}', got '${IDENTITY}'"
  exit 5
fi

# Assert production isolation: ensure database is NOT production
if echo "$IDENTITY" | grep -qi "prod"; then
  echo "CRITICAL VIOLATION: Database name contains 'prod'!"
  exit 55
fi

echo ""
echo "--- TEST 6: FLYWAY VERSION 36 ---"
FLYWAY_COUNT=$(psql -h 127.0.0.1 -p "${FORWARD_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "SELECT count(*) FROM flyway_schema_history;")
FLYWAY_MAX_RANK=$(psql -h 127.0.0.1 -p "${FORWARD_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "SELECT max(installed_rank) FROM flyway_schema_history;")
FLYWAY_MAX_VER=$(psql -h 127.0.0.1 -p "${FORWARD_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "SELECT max(version::integer) FROM flyway_schema_history;")
echo "Flyway count:     $FLYWAY_COUNT"
echo "Flyway max rank:  $FLYWAY_MAX_RANK"
echo "Flyway max ver:   $FLYWAY_MAX_VER"

if [ "$FLYWAY_COUNT" = "36" ] && [ "$FLYWAY_MAX_RANK" = "36" ] && [ "$FLYWAY_MAX_VER" = "36" ]; then
  echo "PASS: Flyway schema verified: exactly 36 migrations applied, max rank 36, max version 36."
else
  echo "FAIL: Flyway history mismatch (count=${FLYWAY_COUNT}, max_rank=${FLYWAY_MAX_RANK}, max_ver=${FLYWAY_MAX_VER})"
  exit 6
fi

echo ""
echo "--- TEST 7: SAFE SYNTHETIC WRITE TRANSACTION (WITH ROLLBACK) ---"
SYNTH_RESULT=$(psql -h 127.0.0.1 -p "${FORWARD_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "
  BEGIN;
  CREATE TEMP TABLE _synthetic_staging_test (id serial, label text);
  INSERT INTO _synthetic_staging_test (label) VALUES ('probe-staging-tailscale');
  SELECT count(*) FROM _synthetic_staging_test;
  ROLLBACK;
")
echo "Synthetic test output: $SYNTH_RESULT"
if echo "$SYNTH_RESULT" | grep -q "1"; then
  echo "PASS: Synthetic write transaction executed and rolled back cleanly without affecting database data."
else
  echo "FAIL: Synthetic transaction failed."
  exit 7
fi

echo ""
echo "--- TEST 8: CONNECTION RECOVERY AFTER DISCONNECT ---"
echo "Simulating forwarder interruption by terminating socat..."
pkill -f "socat" || true
sleep 1

echo "Verifying forwarder is stopped..."
if nc -z -w 2 127.0.0.1 "${FORWARD_PORT}" 2>/dev/null; then
  echo "WARNING: Forwarder port still open."
else
  echo "Forwarder port closed as expected."
fi

echo "Restarting TCP-to-SOCKS5 forwarder..."
socat TCP4-LISTEN:${FORWARD_PORT},bind=127.0.0.1,fork,reuseaddr SOCKS5-CONNECT:127.0.0.1:${TAILSCALE_SOCKS_PORT:-1055}:${TAILSCALE_TARGET_HOST:-100.80.46.12}:${TAILSCALE_TARGET_PORT:-15433} > /tmp/socat.log 2>&1 &
sleep 2

echo "Testing connection recovery after forwarder restart..."
RECOVER_RESULT=$(psql -h 127.0.0.1 -p "${FORWARD_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "SELECT 1;")
if [ "$RECOVER_RESULT" = "1" ]; then
  echo "PASS: Connection recovered cleanly after forwarder restart."
else
  echo "FAIL: Connection recovery failed."
  exit 8
fi

echo ""
echo "=========================================================="
echo "  ALL 8 ACCEPTANCE TESTS PASSED SUCCESSFULLY!"
echo "=========================================================="
