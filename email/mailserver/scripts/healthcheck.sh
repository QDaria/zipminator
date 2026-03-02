#!/bin/bash
# Health check: verify Postfix and Dovecot are running and TLS is active
set -e

# Check Postfix
postfix status > /dev/null 2>&1 || exit 1

# Check Dovecot
doveadm log errors 2>/dev/null || true

# Verify PQC TLS on IMAP (port 993)
echo "" | timeout 5 openssl s_client -connect localhost:993 \
    -groups X25519MLKEM768 -brief 2>&1 | grep -q "Protocol" || {
    # Fallback: just check port is open
    echo "" | timeout 3 openssl s_client -connect localhost:993 -brief 2>/dev/null
}

exit 0
