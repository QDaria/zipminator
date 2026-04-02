#!/bin/bash
set -euo pipefail

echo "=== Zipminator Q-VPN Server ==="
echo "Starting StrongSwan IKEv2..."

# --------------------------------------------------------------------------
# Generate server certificate if not mounted externally.
# In production, mount real certs via Fly.io secrets/volumes.
# --------------------------------------------------------------------------
CERT_DIR="/etc/ipsec.d"

if [ ! -f "$CERT_DIR/private/server-key.pem" ]; then
    echo "Generating self-signed server certificate..."

    # Determine server identity from env or default
    SERVER_ID="${VPN_SERVER_ID:-vpn.zipminator.zip}"

    # CA key + cert
    openssl ecparam -genkey -name secp384r1 -noout \
        -out "$CERT_DIR/private/ca-key.pem" 2>/dev/null

    openssl req -x509 -new -key "$CERT_DIR/private/ca-key.pem" \
        -sha384 -days 3650 \
        -subj "/CN=Zipminator Q-VPN CA" \
        -out "$CERT_DIR/cacerts/ca-cert.pem" 2>/dev/null

    # Server key + CSR + cert
    openssl ecparam -genkey -name secp384r1 -noout \
        -out "$CERT_DIR/private/server-key.pem" 2>/dev/null

    openssl req -new -key "$CERT_DIR/private/server-key.pem" \
        -sha384 \
        -subj "/CN=${SERVER_ID}" \
        -out /tmp/server.csr 2>/dev/null

    # Sign with SAN for the server identity
    openssl x509 -req -in /tmp/server.csr \
        -CA "$CERT_DIR/cacerts/ca-cert.pem" \
        -CAkey "$CERT_DIR/private/ca-key.pem" \
        -CAcreateserial -sha384 -days 365 \
        -extfile <(printf "subjectAltName=DNS:%s" "$SERVER_ID") \
        -out "$CERT_DIR/certs/server-cert.pem" 2>/dev/null

    rm -f /tmp/server.csr
    chmod 600 "$CERT_DIR/private/"*.pem

    echo "Self-signed certificate generated for ${SERVER_ID}"
fi

# --------------------------------------------------------------------------
# Write EAP credentials from environment variables.
# VPN_USERS format: "user1:pass1,user2:pass2"
# Falls back to a single default user if VPN_USERS is not set.
# --------------------------------------------------------------------------
SECRETS_FILE="/etc/ipsec.secrets"

# Always include the server private key reference
echo ": RSA server-key.pem" > "$SECRETS_FILE"

if [ -n "${VPN_USERS:-}" ]; then
    IFS=',' read -ra PAIRS <<< "$VPN_USERS"
    for pair in "${PAIRS[@]}"; do
        IFS=':' read -r user pass <<< "$pair"
        echo "${user} : EAP \"${pass}\"" >> "$SECRETS_FILE"
    done
    echo "Loaded ${#PAIRS[@]} EAP user(s) from VPN_USERS"
else
    # Default user for development/testing
    DEFAULT_PASS="${VPN_DEFAULT_PASSWORD:-changeme-in-production}"
    echo "zipminator : EAP \"${DEFAULT_PASS}\"" >> "$SECRETS_FILE"
    echo "WARNING: Using default VPN credentials. Set VPN_USERS for production."
fi

chmod 600 "$SECRETS_FILE"

# --------------------------------------------------------------------------
# Enable IP forwarding (required for VPN traffic routing).
# --------------------------------------------------------------------------
sysctl -w net.ipv4.ip_forward=1 2>/dev/null || true
sysctl -w net.ipv6.conf.all.forwarding=1 2>/dev/null || true

# --------------------------------------------------------------------------
# NAT masquerade for VPN client traffic.
# Detect the default outbound interface.
# --------------------------------------------------------------------------
DEFAULT_IF=$(ip route show default 2>/dev/null | awk '{print $5}' | head -1)
DEFAULT_IF="${DEFAULT_IF:-eth0}"

iptables -t nat -A POSTROUTING -s 10.14.0.0/24 -o "$DEFAULT_IF" -j MASQUERADE 2>/dev/null || true
iptables -A FORWARD -s 10.14.0.0/24 -j ACCEPT 2>/dev/null || true
iptables -A FORWARD -d 10.14.0.0/24 -j ACCEPT 2>/dev/null || true

echo "NAT configured on ${DEFAULT_IF} for 10.14.0.0/24"

# --------------------------------------------------------------------------
# Start StrongSwan in foreground.
# --------------------------------------------------------------------------
exec ipsec start --nofork
