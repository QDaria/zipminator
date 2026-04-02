#!/bin/bash
# Zipminator Q-VPN Server — Deployment Script
#
# Usage:
#   ./deploy.sh                  # Deploy to Fly.io
#   ./deploy.sh local            # Build and run locally with Docker
#   ./deploy.sh local-stop       # Stop local container
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="zipminator-vpn"

case "${1:-fly}" in

# ── Fly.io Deployment ────────────────────────────────────────────────────
fly)
    echo "=== Deploying ${APP_NAME} to Fly.io ==="

    # Check if app exists
    if ! fly apps list 2>/dev/null | grep -q "$APP_NAME"; then
        echo "Creating Fly.io app: ${APP_NAME}"
        fly apps create "$APP_NAME" --org personal
    fi

    # Allocate dedicated IPv4 (required for UDP/IPsec)
    if ! fly ips list --app "$APP_NAME" 2>/dev/null | grep -q "v4"; then
        echo "Allocating dedicated IPv4 address..."
        fly ips allocate-v4 --app "$APP_NAME"
    fi

    # Set secrets (prompt for password if not set)
    if ! fly secrets list --app "$APP_NAME" 2>/dev/null | grep -q "VPN_USERS"; then
        echo ""
        echo "Set VPN credentials. Format: user1:pass1,user2:pass2"
        echo "Example: zipminator:MySecurePassword123"
        read -rp "VPN_USERS: " VPN_CREDS
        fly secrets set "VPN_USERS=${VPN_CREDS}" --app "$APP_NAME"
    fi

    # Deploy
    cd "$SCRIPT_DIR"
    fly deploy --app "$APP_NAME"

    echo ""
    echo "=== Deployment complete ==="
    echo "App:     https://fly.io/apps/${APP_NAME}"
    fly ips list --app "$APP_NAME"
    echo ""
    echo "Update your DNS: point vpn.zipminator.zip to the IPv4 address above."
    ;;

# ── Local Docker Build/Run ───────────────────────────────────────────────
local)
    echo "=== Building and running ${APP_NAME} locally ==="

    cd "$SCRIPT_DIR"

    docker build -t "$APP_NAME" .

    # Stop existing container if running
    docker rm -f "$APP_NAME" 2>/dev/null || true

    docker run -d \
        --name "$APP_NAME" \
        --cap-add NET_ADMIN \
        --cap-add NET_RAW \
        --sysctl net.ipv4.ip_forward=1 \
        -p 500:500/udp \
        -p 4500:4500/udp \
        -e VPN_SERVER_ID="vpn.zipminator.zip" \
        -e VPN_USERS="zipminator:localtest123" \
        "$APP_NAME"

    echo ""
    echo "=== Local container started ==="
    echo "Container: ${APP_NAME}"
    echo "IKE:       udp://localhost:500"
    echo "NAT-T:     udp://localhost:4500"
    echo "Logs:      docker logs -f ${APP_NAME}"
    echo "Stop:      ./deploy.sh local-stop"
    ;;

# ── Stop Local Container ─────────────────────────────────────────────────
local-stop)
    echo "Stopping ${APP_NAME}..."
    docker rm -f "$APP_NAME" 2>/dev/null || true
    echo "Done."
    ;;

*)
    echo "Usage: $0 [fly|local|local-stop]"
    exit 1
    ;;
esac
