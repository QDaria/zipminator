#!/bin/bash
set -e

DOMAIN="${MAIL_DOMAIN:-zipminator.zip}"
HOSTNAME="${MAIL_HOSTNAME:-mail.${DOMAIN}}"

echo "=== Zipminator Quantum-Secure Mail Server ==="
echo "  Domain:   ${DOMAIN}"
echo "  Hostname: ${HOSTNAME}"
echo "  OpenSSL:  $(openssl version)"
echo "  PQC TLS:  X25519MLKEM768 hybrid key exchange"
echo "  DKIM:     RSA-2048 (s1) + ML-DSA-65 (s1pq)"
echo "============================================="

# Update Postfix hostname
postconf -e "myhostname=${HOSTNAME}"
postconf -e "mydomain=${DOMAIN}"

# Generate self-signed cert if none provided (dev only)
if [ ! -f /etc/ssl/certs/mail.zipminator.zip.crt ]; then
    echo ">>> Generating self-signed TLS certificate (dev mode)..."
    openssl req -new -x509 -nodes -days 365 \
        -keyout /etc/ssl/private/mail.zipminator.zip.key \
        -out /etc/ssl/certs/mail.zipminator.zip.crt \
        -subj "/CN=${HOSTNAME}/O=Zipminator/C=NO" \
        -addext "subjectAltName=DNS:${HOSTNAME},DNS:${DOMAIN}"
    chmod 600 /etc/ssl/private/mail.zipminator.zip.key
fi

# Generate DH parameters for Dovecot (if missing)
if [ ! -f /etc/dovecot/dh.pem ]; then
    echo ">>> Generating DH parameters (2048-bit)..."
    openssl dhparam -out /etc/dovecot/dh.pem 2048
fi

# Generate DKIM RSA key (s1 selector) if missing
if [ ! -f /etc/opendkim/keys/zipminator.zip/s1.private ]; then
    echo ">>> Generating DKIM RSA-2048 key (selector: s1)..."
    mkdir -p /etc/opendkim/keys/zipminator.zip
    opendkim-genkey -b 2048 -d "${DOMAIN}" -s s1 \
        -D /etc/opendkim/keys/zipminator.zip
    chown -R opendkim:opendkim /etc/opendkim/keys
    echo ""
    echo ">>> RSA DKIM DNS Record (add to DNS):"
    cat /etc/opendkim/keys/zipminator.zip/s1.txt
    echo ""
fi

# Create Dovecot users file if missing
if [ ! -f /etc/dovecot/users ]; then
    echo ">>> Creating default Dovecot users file..."
    touch /etc/dovecot/users
    chmod 600 /etc/dovecot/users
fi

# Create Postfix virtual mailbox file if missing
if [ ! -f /etc/postfix/vmailbox ]; then
    echo ">>> Creating virtual mailbox map..."
    touch /etc/postfix/vmailbox
    postmap /etc/postfix/vmailbox
fi

# Fix permissions
mkdir -p /var/spool/postfix/private /run/opendkim
chown -R postfix:postfix /var/spool/postfix
chown -R vmail:vmail /var/mail
chown -R opendkim:opendkim /run/opendkim

# Verify PQC TLS configuration
echo ""
echo ">>> Verifying PQC TLS configuration..."
echo "  Postfix tls_eecdh_auto_curves: $(postconf -h tls_eecdh_auto_curves)"
echo ""

# Start services via supervisor
exec "$@"
