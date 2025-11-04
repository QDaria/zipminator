# Security Best Practices for Zipminator PQC

This guide outlines security best practices for deploying Zipminator in production environments.

---

## Key Lifecycle Management

### Key Generation

**DO:**
- ✅ Always use hardware QRNG for key generation in production
- ✅ Generate keys in secure, isolated environments (HSM or secure enclave)
- ✅ Verify QRNG health before each key generation: `zipminator_qrng_get_health()`
- ✅ Use appropriate security level for threat model:
  - NIST Level 1 (Kyber-512, Dilithium-2): Commercial applications
  - NIST Level 3 (Kyber-768, Dilithium-3): Government, financial
  - NIST Level 5 (Kyber-1024, Dilithium-5): National Security Systems (CNSA 2.0)

**DON'T:**
- ❌ Generate keys in uncontrolled environments (untrusted networks, VMs)
- ❌ Reuse keys across different applications or contexts
- ❌ Generate keys with system PRNG in high-assurance deployments
- ❌ Skip error checking on key generation functions

**Example:**
```c
zipminator_config_t config = {
    .entropy_source = ZIPMINATOR_ENTROPY_QRNG,
    .enable_side_channel_protection = true,
    .enable_fault_protection = true,
    .qrng_health_check_interval_ms = 100
};

zipminator_error_t error;
if (zipminator_init(&config, &error) != ZIPMINATOR_SUCCESS) {
    syslog(LOG_CRIT, "QRNG init failed: %s - ABORT", error.message);
    exit(1);  // Fail-safe: do not proceed without QRNG
}

// Verify QRNG health before key generation
zipminator_qrng_health_t health;
zipminator_qrng_get_health(&health, &error);
if (!health.is_healthy) {
    syslog(LOG_CRIT, "QRNG unhealthy - cannot generate keys");
    exit(1);
}

// Now safe to generate keys
uint8_t pk[1184], sk[2400];
if (zipminator_kyber768_keygen(pk, sk, &error) != ZIPMINATOR_SUCCESS) {
    syslog(LOG_ERR, "KeyGen failed: %s", error.message);
    // Handle error appropriately
}
```

---

### Secure Key Storage

**Encryption at Rest:**
```c
// Encrypt secret keys with AES-256-GCM before storage
#include <openssl/evp.h>

void encrypt_secret_key(
    const uint8_t *secret_key,
    size_t sk_len,
    const uint8_t *master_key,  // 32 bytes from HSM/KMS
    uint8_t *encrypted_sk,
    uint8_t *nonce,             // 12 bytes IV
    uint8_t *tag                // 16 bytes auth tag
) {
    EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
    EVP_EncryptInit_ex(ctx, EVP_aes_256_gcm(), NULL, master_key, nonce);

    int len;
    EVP_EncryptUpdate(ctx, encrypted_sk, &len, secret_key, sk_len);
    EVP_EncryptFinal_ex(ctx, encrypted_sk + len, &len);
    EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_GET_TAG, 16, tag);

    EVP_CIPHER_CTX_free(ctx);
}
```

**File Permissions:**
```bash
# Store secret keys with minimal permissions
chmod 600 /etc/zipminator/keys/server-secret.key
chown root:root /etc/zipminator/keys/server-secret.key

# Use SELinux/AppArmor for additional protection
semanage fcontext -a -t zipminator_key_t "/etc/zipminator/keys(/.*)?
```

**Hardware Security Modules (HSM):**
```c
// Store keys in FIPS 140-3 Level 3 HSM
#include <pkcs11.h>

CK_RV store_key_in_hsm(const uint8_t *secret_key, size_t sk_len) {
    CK_SESSION_HANDLE session;
    // ... initialize PKCS#11 session ...

    CK_OBJECT_CLASS key_class = CKO_SECRET_KEY;
    CK_KEY_TYPE key_type = CKK_GENERIC_SECRET;
    CK_BBOOL true_val = CK_TRUE;

    CK_ATTRIBUTE template[] = {
        {CKA_CLASS, &key_class, sizeof(key_class)},
        {CKA_KEY_TYPE, &key_type, sizeof(key_type)},
        {CKA_VALUE, (void*)secret_key, sk_len},
        {CKA_PRIVATE, &true_val, sizeof(true_val)},
        {CKA_SENSITIVE, &true_val, sizeof(true_val)},
        {CKA_EXTRACTABLE, &false_val, sizeof(false_val)}
    };

    CK_OBJECT_HANDLE key_handle;
    return C_CreateObject(session, template, 6, &key_handle);
}
```

---

### Key Rotation

**Frequency:**
- **Kyber Encryption Keys:** Rotate every 90 days or 1M encryptions
- **Dilithium Signing Keys:** Rotate every 365 days (shorter than RSA due to newness)
- **TLS/VPN Session Keys:** Rotate every 5-10 minutes (Perfect Forward Secrecy)

**Example Rotation Script:**
```bash
#!/bin/bash
# /usr/local/bin/rotate-dilithium-cert.sh

set -e

NEW_KEY="/tmp/new-dilithium-key.pem"
NEW_CERT="/tmp/new-dilithium-cert.pem"
CURRENT_KEY="/etc/ssl/private/server-dilithium.key"
CURRENT_CERT="/etc/ssl/certs/server-dilithium.pem"

# Generate new key
zipminator-cli dilithium3 keygen \
    --output-public /tmp/new-public.pem \
    --output-secret "$NEW_KEY"

# Generate CSR and sign
openssl req -new -engine zipminator \
    -key "$NEW_KEY" -keyform ENGINE \
    -out /tmp/server.csr \
    -subj "/C=US/ST=CA/O=Example/CN=server.example.com"

openssl x509 -req -in /tmp/server.csr \
    -CA /etc/ssl/certs/ca-dilithium.pem \
    -CAkey /etc/ssl/private/ca-key.pem \
    -engine zipminator \
    -out "$NEW_CERT" \
    -days 365

# Atomic replacement (avoid downtime)
cp "$NEW_KEY" "$CURRENT_KEY"
cp "$NEW_CERT" "$CURRENT_CERT"

# Reload services
systemctl reload nginx
systemctl reload apache2

# Cleanup
shred -u "$NEW_KEY" /tmp/new-public.pem /tmp/server.csr

logger "Dilithium certificate rotated successfully"
```

**Cron Job:**
```cron
# Rotate Dilithium certificates annually
0 2 1 1 * /usr/local/bin/rotate-dilithium-cert.sh
```

---

## Side-Channel Attack Mitigation

### Constant-Time Operations

Zipminator implements constant-time algorithms to prevent timing attacks:

```c
// GOOD: Constant-time comparison
int ct_memcmp(const uint8_t *a, const uint8_t *b, size_t len) {
    volatile uint8_t diff = 0;
    for (size_t i = 0; i < len; i++) {
        diff |= a[i] ^ b[i];
    }
    return diff;  // 0 if equal, non-zero otherwise
}

// BAD: Variable-time comparison (leaks via timing)
if (memcmp(secret_a, secret_b, 32) == 0) {  // ❌ DO NOT USE
    // ...
}
```

**Enable Protections:**
```c
zipminator_config_t config = {
    .enable_side_channel_protection = true,  // Forces constant-time operations
    .enable_fault_protection = true          // Detects fault injection attacks
};
```

---

### Cache-Timing Mitigation

**Disable CPU Features in High-Assurance Environments:**
```bash
# Disable Hyper-Threading (prevents cross-thread cache attacks)
echo off | sudo tee /sys/devices/system/cpu/smt/control

# Disable Turbo Boost (prevents frequency-based side channels)
echo 1 | sudo tee /sys/devices/system/cpu/intel_pstate/no_turbo

# Use CPU pinning for crypto operations
taskset -c 0 ./crypto_server
```

**Memory Isolation:**
```c
#include <sys/mman.h>

// Lock secret key memory to prevent swapping
uint8_t secret_key[2400];
mlock(secret_key, sizeof(secret_key));

// Clear memory securely after use
void secure_zero(void *ptr, size_t len) {
    volatile uint8_t *p = ptr;
    while (len--) *p++ = 0;
}

// Or use explicit_bzero (glibc 2.25+)
explicit_bzero(secret_key, sizeof(secret_key));
munlock(secret_key, sizeof(secret_key));
```

---

### Power Analysis Protection

**Randomized Execution:**
```c
// Zipminator internally uses random delays to thwart power analysis
// This is transparent to the user, but can be tuned:

zipminator_config_t config = {
    .enable_side_channel_protection = true,
    // Internal: adds random clock cycles between operations
};
```

**Physical Security:**
- Use Faraday cages for HSMs and crypto hardware
- Monitor power consumption for anomalies (DPA detection)
- Use shielded QRNG devices (e.g., ID Quantique Quantis PCIe)

---

## QRNG Health Monitoring

### Continuous Health Checks

```c
#include <signal.h>
#include <syslog.h>

void qrng_monitor_thread(void *arg) {
    zipminator_qrng_health_t health;
    zipminator_error_t error;

    while (1) {
        sleep(60);  // Check every minute

        if (zipminator_qrng_get_health(&health, &error) != ZIPMINATOR_SUCCESS) {
            syslog(LOG_CRIT, "QRNG health check failed: %s", error.message);
            kill(getpid(), SIGTERM);  // Shut down server
            break;
        }

        if (!health.is_healthy) {
            syslog(LOG_CRIT, "QRNG unhealthy: %d failures, throughput %.2f Mbps",
                   health.health_check_failures, health.throughput_mbps);

            // Alert operations team
            system("alert-ops.sh 'QRNG failure detected'");

            // Fail-safe: shut down if QRNG fails 3 times
            if (health.health_check_failures >= 3) {
                syslog(LOG_CRIT, "QRNG failed 3 times - SHUTTING DOWN");
                kill(getpid(), SIGTERM);
            }
        }

        // Log metrics to monitoring system
        send_metric("qrng.entropy_bits", health.entropy_bits_generated);
        send_metric("qrng.throughput_mbps", health.throughput_mbps);
    }
}
```

### Alerting on Degradation

```bash
#!/bin/bash
# /usr/local/bin/qrng-health-check.sh

HEALTH=$(zipminator-cli qrng status --json)
IS_HEALTHY=$(echo "$HEALTH" | jq -r '.is_healthy')
THROUGHPUT=$(echo "$HEALTH" | jq -r '.throughput_mbps')

if [ "$IS_HEALTHY" != "true" ]; then
    # Send alert (PagerDuty, Slack, email, etc.)
    curl -X POST https://events.pagerduty.com/v2/enqueue \
        -H 'Content-Type: application/json' \
        -d '{
            "routing_key": "YOUR_INTEGRATION_KEY",
            "event_action": "trigger",
            "payload": {
                "summary": "QRNG health check failed",
                "severity": "critical",
                "source": "qrng-monitor"
            }
        }'
fi

# Warn if throughput drops below 1 Mbps
if (( $(echo "$THROUGHPUT < 1.0" | bc -l) )); then
    logger "WARNING: QRNG throughput degraded to $THROUGHPUT Mbps"
fi
```

---

## Proper Error Handling

### Never Ignore Errors

```c
// ❌ BAD: Ignoring errors
zipminator_kyber768_keygen(pk, sk, NULL);  // NULL error - cannot detect failures

// ✅ GOOD: Proper error handling
zipminator_error_t error;
int result = zipminator_kyber768_keygen(pk, sk, &error);
if (result != ZIPMINATOR_SUCCESS) {
    syslog(LOG_ERR, "KeyGen failed: %s (code %d) at %s:%d",
           error.message, error.code, error.file, error.line);

    // Take appropriate action based on error type
    switch (error.code) {
        case ZIPMINATOR_ERROR_QRNG_FAILURE:
            // Critical: QRNG unavailable
            alert_ops_team("QRNG failure");
            return ERROR_CRYPTO_DEVICE_FAILURE;

        case ZIPMINATOR_ERROR_MEMORY:
            // Critical: Out of memory
            return ERROR_OUT_OF_MEMORY;

        default:
            // Unknown error - fail safe
            return ERROR_INTERNAL;
    }
}
```

---

## Signature Verification

### Always Verify Signatures

```c
// ❌ BAD: Skipping verification in "trusted" environments
// if (is_trusted_source) {
//     return SIGNATURE_VALID;  // Never do this!
// }

// ✅ GOOD: Always verify, no exceptions
zipminator_error_t error;
int result = zipminator_dilithium3_verify(
    message, msg_len,
    signature, sig_len,
    public_key, &error
);

if (result != ZIPMINATOR_SUCCESS) {
    syslog(LOG_WARNING, "Signature verification failed: %s", error.message);
    return SIGNATURE_INVALID;
}

// Additional check: verify signature is not replay
if (is_signature_replayed(signature, sig_len)) {
    syslog(LOG_WARNING, "Replay attack detected");
    return SIGNATURE_REPLAYED;
}

return SIGNATURE_VALID;
```

---

## Audit Logging

### Log All Cryptographic Operations

```c
#include <syslog.h>

void audit_log_keygen(const char *algorithm, const char *user) {
    syslog(LOG_INFO, "AUDIT: KeyGen algorithm=%s user=%s timestamp=%ld",
           algorithm, user, time(NULL));
}

void audit_log_sign(const char *algorithm, const char *user, size_t msg_len) {
    syslog(LOG_INFO, "AUDIT: Sign algorithm=%s user=%s msg_size=%zu timestamp=%ld",
           algorithm, user, msg_len, time(NULL));
}

void audit_log_verify(const char *algorithm, bool valid, const char *source) {
    syslog(LOG_INFO, "AUDIT: Verify algorithm=%s valid=%d source=%s timestamp=%ld",
           algorithm, valid, source, time(NULL));
}
```

**Centralized Logging:**
```bash
# Forward audit logs to SIEM
# /etc/rsyslog.d/zipminator-audit.conf

if $programname == 'zipminator' then {
    action(type="omfwd" target="siem.example.com" port="514" protocol="tcp")
    stop
}
```

---

## Secure Build Practices

### Compiler Flags

```bash
# GCC/Clang with security hardening
gcc -O3 -march=native \
    -D_FORTIFY_SOURCE=2 \          # Buffer overflow detection
    -fstack-protector-strong \     # Stack canaries
    -fPIE -pie \                   # Position-independent executable
    -Wl,-z,relro,-z,now \          # Full RELRO
    -Wl,-z,noexecstack \           # Non-executable stack
    -fcf-protection=full \         # Intel CET
    -o crypto_app crypto_app.c -lzipminator
```

### Static Analysis

```bash
# Run static analyzers
clang --analyze -Xanalyzer -analyzer-output=text crypto_app.c
cppcheck --enable=all crypto_app.c
flawfinder crypto_app.c
```

---

## Compliance Checklist

### CNSA 2.0 Compliance

- [ ] Use Kyber-1024 (ML-KEM-1024) for key establishment
- [ ] Use Dilithium-5 (ML-DSA-87) for digital signatures
- [ ] Use AES-256-GCM for symmetric encryption
- [ ] Use SHA-384/512 for hashing
- [ ] Hardware QRNG (NIST SP 800-90B certified)
- [ ] No fallback to system PRNG in production
- [ ] Side-channel and fault protection enabled
- [ ] QRNG health monitoring and alerting
- [ ] Annual key rotation for signing keys
- [ ] Quarterly rotation for encryption keys
- [ ] Full audit logging to SIEM
- [ ] FIPS 140-3 validated crypto module

### FIPS 140-3 Validation

- [ ] Use FIPS-validated Zipminator build (pending certification)
- [ ] Enable FIPS mode: `zipminator_init()` with `fips_mode = true`
- [ ] Self-tests on startup: `zipminator_self_test()`
- [ ] Zeroize keys after use
- [ ] Physical security for crypto devices (HSM)

---

## Security Incident Response

### Compromised Keys

1. **Immediate Actions:**
   - Revoke compromised certificates (CRL/OCSP)
   - Generate new keys with fresh QRNG entropy
   - Notify affected parties within 24 hours

2. **Investigation:**
   - Review audit logs for unauthorized access
   - Analyze QRNG health logs for anomalies
   - Check for side-channel attack signatures

3. **Remediation:**
   - Rotate all potentially affected keys
   - Patch vulnerabilities
   - Update incident response playbook

---

## References

- [NIST SP 800-57](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final) - Key Management
- [NIST SP 800-90B](https://csrc.nist.gov/publications/detail/sp/800-90b/final) - Entropy Sources
- [NSA CNSA 2.0 FAQ](https://media.defense.gov/2022/Sep/07/2003071836/-1/-1/0/CSI_CNSA_2.0_FAQ_.PDF)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)

---

## Contact

For security questions or to report vulnerabilities:
- **Security Team:** security@qdaria.com
- **PGP Key:** https://qdaria.com/security.asc
- **Bug Bounty:** https://qdaria.com/bug-bounty
