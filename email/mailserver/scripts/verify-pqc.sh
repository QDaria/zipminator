#!/bin/bash
# Verify PQC TLS negotiation on all mail ports
# Run this after the server is up to confirm X25519MLKEM768 is active
# ============================================================================

HOSTNAME="${1:-localhost}"

echo "=== Zipminator PQC TLS Verification ==="
echo "Target: ${HOSTNAME}"
echo ""

verify_port() {
    local port=$1
    local service=$2
    local starttls=$3

    echo "--- ${service} (port ${port}) ---"

    local cmd="openssl s_client -connect ${HOSTNAME}:${port} -groups X25519MLKEM768 -brief"
    if [ -n "${starttls}" ]; then
        cmd="${cmd} -starttls ${starttls}"
    fi

    result=$(echo "" | timeout 10 ${cmd} 2>&1)

    if echo "${result}" | grep -q "X25519MLKEM768"; then
        echo "  PQC TLS: ACTIVE (X25519MLKEM768)"
        echo "  ${result}" | grep -E "Protocol|Ciphersuite|Server" | head -3 | sed 's/^/  /'
    elif echo "${result}" | grep -q "Protocol"; then
        echo "  PQC TLS: FALLBACK (classical key exchange)"
        echo "  ${result}" | grep -E "Protocol|Ciphersuite|Server" | head -3 | sed 's/^/  /'
    else
        echo "  Connection: FAILED"
        echo "  ${result}" | head -3 | sed 's/^/  /'
    fi
    echo ""
}

# SMTP (port 25, STARTTLS)
verify_port 25 "SMTP" "smtp"

# Submission (port 587, STARTTLS)
verify_port 587 "Submission" "smtp"

# SMTPS (port 465, implicit TLS)
verify_port 465 "SMTPS" ""

# IMAPS (port 993, implicit TLS)
verify_port 993 "IMAPS" ""

echo "=== OpenSSL Version ==="
openssl version
echo ""

echo "=== Supported Groups ==="
openssl ecparam -list_curves 2>/dev/null | grep -i "x25519\|mlkem\|kyber" || \
    echo "(ML-KEM groups handled internally by TLS 1.3, not listed in ecparam)"

echo ""
echo "=== Verification Complete ==="
