#!/bin/sh
set -e

echo "=== FIXKART STAGING CONTAINER BOOTSTRAP ==="
echo "Target Tailscale Host: ${TAILSCALE_TARGET_HOST:-100.80.46.12}"
echo "Target Tailscale Port: ${TAILSCALE_TARGET_PORT:-15433}"
echo "SOCKS5 Proxy Port:     ${TAILSCALE_SOCKS_PORT:-1055}"
echo "TCP Forwarder Port:    ${TAILSCALE_FORWARD_PORT:-15432}"

mkdir -p /var/run/tailscale /var/lib/tailscale /tmp

# 1. Start tailscaled in userspace networking mode
echo "[1/4] Starting tailscaled in userspace networking mode..."
tailscaled \
  --tun=userspace-networking \
  --socks5-server=127.0.0.1:${TAILSCALE_SOCKS_PORT:-1055} \
  --state=/var/lib/tailscale/tailscaled.state > /tmp/tailscaled.log 2>&1 &
TAILSCALED_PID=$!

# Wait for tailscaled socket
for i in $(seq 1 30); do
  if [ -S /var/run/tailscale/tailscaled.sock ]; then
    echo "tailscaled socket ready (attempt $i)."
    break
  fi
  sleep 0.2
done

# 2. Authenticate to Tailnet
echo "[2/4] Registering node with Tailnet..."
HOSTNAME="${TAILSCALE_HOSTNAME:-fixkart-staging-backend}"
if [ -n "$TAILSCALE_AUTHKEY" ]; then
  echo "Authenticating using TAILSCALE_AUTHKEY..."
  tailscale up \
    --authkey="$TAILSCALE_AUTHKEY" \
    --hostname="$HOSTNAME" \
    --accept-routes=false
  echo "Tailscale registration completed successfully."
else
  echo "NOTICE: TAILSCALE_AUTHKEY not set. Starting tailscale up in background..."
  tailscale up --hostname="$HOSTNAME" --accept-routes=false > /tmp/tailscale-up.log 2>&1 &
  sleep 2
  if [ -f /tmp/tailscale-up.log ]; then
    cat /tmp/tailscale-up.log
  fi
fi

tailscale status || true

# 3. Start TCP-to-SOCKS5 forwarder
TARGET_HOST="${TAILSCALE_TARGET_HOST:-100.80.46.12}"
TARGET_PORT="${TAILSCALE_TARGET_PORT:-15433}"
SOCKS_PORT="${TAILSCALE_SOCKS_PORT:-1055}"
FORWARD_PORT="${TAILSCALE_FORWARD_PORT:-15432}"

echo "[3/4] Starting TCP-to-SOCKS5 forwarder: 127.0.0.1:${FORWARD_PORT} -> ${TARGET_HOST}:${TARGET_PORT} via SOCKS5 :${SOCKS_PORT}..."
socat TCP4-LISTEN:${FORWARD_PORT},bind=127.0.0.1,fork,reuseaddr SOCKS5-CONNECT:127.0.0.1:${SOCKS_PORT}:${TARGET_HOST}:${TARGET_PORT} > /tmp/socat.log 2>&1 &
SOCAT_PID=$!

echo "TCP-to-SOCKS5 forwarder started with PID ${SOCAT_PID}."

echo "[4/4] Executing container command: $@"
exec "$@"
