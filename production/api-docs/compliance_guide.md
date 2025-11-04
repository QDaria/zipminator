# Compliance Guide: CNSA 2.0, FIPS 140-3, and Common Criteria

This guide helps organizations achieve compliance with post-quantum cryptography standards using Zipminator.

---

## NSA CNSA 2.0 Compliance

### Overview

The **Commercial National Security Algorithm Suite 2.0** (CNSA 2.0) mandates quantum-resistant algorithms for U.S. National Security Systems (NSS).

**Authority:** National Security Memorandum 10 (NSM-10), September 2022

**Applicability:**
- Federal government agencies
- Defense Industrial Base (DIB)
- Contractors handling classified information
- Critical infrastructure interacting with NSS

---

### CNSA 2.0 Algorithm Requirements

| Function | Algorithm | Zipminator Implementation |
|----------|-----------|---------------------------|
| Key Establishment | ML-KEM-1024 (Kyber-1024) | `zipminator_kyber1024_*()` |
| Digital Signatures | ML-DSA-87 (Dilithium-5) | `zipminator_dilithium5_*()` |
| Symmetric Encryption | AES-256 (GCM/CCM) | Use with OpenSSL/libsodium |
| Hashing | SHA-384, SHA-512 | Use with OpenSSL |
| Random Number Generation | NIST SP 800-90B | Hardware QRNG (ID Quantique) |

**Note:** CNSA 2.0 **prefers pure PQC** over hybrid (classical + PQC) for NSS applications.

---

### Migration Timeline

| Date | Requirement |
|------|-------------|
| **Now - Dec 31, 2025** | Voluntary early deployment encouraged |
| **Jan 1, 2027** | All **new NSS acquisitions** must be CNSA 2.0 compliant |
| **Dec 31, 2030** | All **fielded equipment** unable to support CNSA 2.0 must be phased out |
| **Dec 31, 2031** | **Full enforcement**: All NSS cryptography must use CNSA 2.0 algorithms |
| **2035** | All NSS must be fully quantum-resistant per NSM-10 |

**Action Required:** Begin migration planning NOW to meet Jan 1, 2027 deadline for new systems.

---

### CNSA 2.0 Configuration

```c
#include <zipminator/kyber1024.h>
#include <zipminator/dilithium5.h>

// CNSA 2.0 compliant configuration
zipminator_config_t config = {
    .entropy_source = ZIPMINATOR_ENTROPY_QRNG,  // Hardware QRNG mandatory
    .enable_side_channel_protection = true,
    .enable_fault_protection = true,
    .qrng_health_check_interval_ms = 100
};

zipminator_error_t error;
if (zipminator_init(&config, &error) != ZIPMINATOR_SUCCESS) {
    // FAIL-SAFE: Do not proceed without QRNG
    syslog(LOG_CRIT, "CNSA 2.0: QRNG init failed - ABORT");
    exit(1);
}

// Key Establishment: ML-KEM-1024
uint8_t pk[1568], sk[3168];
zipminator_kyber1024_keygen(pk, sk, &error);

// Digital Signatures: ML-DSA-87
uint8_t sig_pk[2592], sig_sk[4864];
zipminator_dilithium5_keygen(sig_pk, sig_sk, &error);

// Symmetric Encryption: AES-256-GCM (via OpenSSL)
// Hash: SHA-384 (via OpenSSL)
```

**Critical:** Set `QRNG_FALLBACK=0` to fail if hardware QRNG unavailable (required for CNSA 2.0).

---

### CNSA 2.0 Compliance Checklist

- [ ] **Algorithms:** Use only ML-KEM-1024 and ML-DSA-87 (no hybrid mode)
- [ ] **Entropy Source:** Hardware QRNG (NIST SP 800-90B certified)
- [ ] **No Fallback:** System PRNG fallback disabled (`QRNG_FALLBACK=0`)
- [ ] **Side-Channel Protection:** Enabled (`enable_side_channel_protection = true`)
- [ ] **Fault Protection:** Enabled (`enable_fault_protection = true`)
- [ ] **Key Rotation:** Annual for signing keys, quarterly for encryption keys
- [ ] **Audit Logging:** All cryptographic operations logged to SIEM
- [ ] **FIPS 140-3 Module:** Use validated crypto module (when available)
- [ ] **Physical Security:** QRNG device in secured facility
- [ ] **Documentation:** Maintain crypto inventory and migration plan
- [ ] **Training:** Personnel trained on PQC best practices
- [ ] **Testing:** Annual penetration testing and side-channel analysis

---

### CNSA 2.0 Self-Assessment

**Score your compliance:**

| Criterion | Weight | Status |
|-----------|--------|--------|
| Using ML-KEM-1024 for key establishment | 20% | [ ] |
| Using ML-DSA-87 for signatures | 20% | [ ] |
| Hardware QRNG deployed | 15% | [ ] |
| No system PRNG fallback | 10% | [ ] |
| Side-channel protection enabled | 10% | [ ] |
| Annual key rotation | 5% | [ ] |
| Audit logging to SIEM | 10% | [ ] |
| FIPS 140-3 validated module | 10% | [ ] |

**Interpretation:**
- **90-100%:** Fully compliant
- **70-89%:** Mostly compliant - address gaps
- **<70%:** Non-compliant - significant remediation required

---

## FIPS 140-3 Validation

### Overview

**FIPS 140-3** is the U.S. government standard for cryptographic modules. Post-quantum algorithms (ML-KEM, ML-DSA) are being added to the FIPS 140-3 Derived Test Requirements (DTR).

**Status:** Zipminator FIPS 140-3 validation is **in progress**. Expected certificate number: TBD Q2 2026.

---

### FIPS 140-3 Security Levels

| Level | Description | Zipminator Target |
|-------|-------------|-------------------|
| Level 1 | Basic security, software-only | General commercial use |
| Level 2 | Physical tamper-evidence | Government, financial |
| Level 3 | Physical tamper-resistance | NSS, critical infrastructure |
| Level 4 | Active tamper response | Highly classified systems |

**Zipminator Hardware QRNG:** ID Quantique Quantis devices support **Level 2-3** (depending on model).

---

### FIPS 140-3 Requirements for PQC

#### Algorithm Implementation

- [ ] **Approved Algorithms:** ML-KEM (FIPS 203), ML-DSA (FIPS 204)
- [ ] **Key Generation:** Using approved DRBG (QRNG per SP 800-90B)
- [ ] **Constant-Time:** All operations protected against timing attacks
- [ ] **Self-Tests:** Power-on self-tests (POST) for all algorithms
- [ ] **Known Answer Tests (KAT):** Verify correctness on startup

#### Random Number Generation

- [ ] **Entropy Source:** NIST SP 800-90B compliant (hardware QRNG)
- [ ] **Health Tests:** Continuous health monitoring of entropy source
- [ ] **Conditioning:** Optional conditioning function (QRNG provides full entropy)

#### Key Management

- [ ] **Key Generation:** In FIPS-approved boundary (HSM or secure software module)
- [ ] **Key Storage:** Encrypted at rest with AES-256
- [ ] **Key Zeroization:** Secure erasure of keys on demand or device decommissioning
- [ ] **Key Access:** Role-based access control (RBAC)

#### Physical Security (Level 2+)

- [ ] **Tamper-Evident:** Physical seals or coatings on device
- [ ] **Role Authentication:** Multi-factor authentication for administrative roles
- [ ] **Audit Logging:** Immutable log of all security-relevant events

---

### Enabling FIPS Mode

```c
zipminator_config_t config = zipminator_get_default_config();
config.fips_mode = true;  // Enable FIPS 140-3 mode

zipminator_error_t error;
if (zipminator_init(&config, &error) != ZIPMINATOR_SUCCESS) {
    fprintf(stderr, "FIPS init failed: %s\n", error.message);
    exit(1);
}

// Run self-tests
if (zipminator_self_test(&error) != ZIPMINATOR_SUCCESS) {
    fprintf(stderr, "Self-test failed: %s\n", error.message);
    exit(1);
}

// Verify FIPS mode active
zipminator_version_t version;
zipminator_get_version(&version);
if (!version.fips_mode) {
    fprintf(stderr, "ERROR: FIPS mode not active\n");
    exit(1);
}
```

---

### FIPS 140-3 Validation Process

**Timeline:** 12-18 months

1. **Preparation (Months 1-3):**
   - Complete security policy documentation
   - Implement all FIPS requirements
   - Internal testing and gap analysis

2. **Lab Testing (Months 4-9):**
   - Submit module to CMVP-accredited lab
   - Lab performs Derived Test Requirements (DTR)
   - Address any findings

3. **CMVP Review (Months 10-15):**
   - NIST CMVP reviews test report
   - Coordinate review (CR) phase
   - Address CMVP questions

4. **Certificate Issuance (Months 16-18):**
   - Final approval from CMVP
   - Certificate posted to NIST website
   - Module listed on CMVP validated modules list

**Cost:** $50,000 - $150,000 (depending on level)

---

## Common Criteria EAL4+ Certification

### Overview

**Common Criteria** is an international standard (ISO/IEC 15408) for IT security evaluation. **EAL4+** (Evaluation Assurance Level 4, Augmented) provides high assurance through methodical design, testing, and independent review.

**Target:** Q2 2026

---

### Protection Profile: Cryptographic Module

**TOE (Target of Evaluation):** Zipminator PQC Library with Hardware QRNG

**Security Functional Requirements (SFRs):**

| SFR | Requirement | Zipminator Implementation |
|-----|-------------|---------------------------|
| FCS_CKM.1 | Cryptographic Key Generation | ML-KEM, ML-DSA with QRNG |
| FCS_CKM.4 | Cryptographic Key Destruction | Secure zeroization |
| FCS_COP.1 | Cryptographic Operation | Encaps, Decaps, Sign, Verify |
| FDP_ITC.2 | Import of User Data | Key import with validation |
| FPT_TST.1 | TSF Testing | Power-on self-tests |
| FRU_FLT.2 | Fault Tolerance | QRNG health monitoring |

**Assurance Activities:**
- Design documentation review
- Functional testing (>500 test cases)
- Penetration testing
- Side-channel analysis
- Vulnerability assessment

---

### Common Criteria Certification Process

**Timeline:** 18-24 months

1. **Preparation (Months 1-6):**
   - Write Security Target (ST)
   - Develop Evidence Documentation
   - Internal security assessment

2. **Evaluation (Months 7-18):**
   - Submit to CC evaluation facility
   - Evaluator performs assurance activities
   - Developer responds to findings

3. **Certification (Months 19-24):**
   - Validation by national scheme (NIAP in U.S.)
   - Certificate issuance
   - Product listed on CC portal

**Cost:** $100,000 - $250,000

---

## Industry-Specific Compliance

### Payment Card Industry (PCI DSS 4.0)

**Requirement 4.2.1:** Use strong cryptography for cardholder data transmission

**Zipminator Alignment:**
- TLS 1.3 with Kyber-768 hybrid mode
- AES-256-GCM for data at rest
- Annual key rotation

**Action:** Update PCI DSS SAQ (Self-Assessment Questionnaire) to document PQC usage.

---

### HIPAA (Health Insurance Portability and Accountability Act)

**Security Rule § 164.312(a)(2)(iv):** Encryption and Decryption

**Zipminator Alignment:**
- Quantum-safe encryption for PHI (Protected Health Information)
- Hardware QRNG ensures unpredictability
- Audit logging for compliance

**Action:** Update HIPAA risk assessment to include quantum threat.

---

### GDPR (General Data Protection Regulation)

**Article 32:** Security of Processing

**Zipminator Alignment:**
- State-of-the-art cryptography (PQC)
- Pseudonymization and encryption
- Regular testing and evaluation

**Action:** Document PQC in Data Protection Impact Assessment (DPIA).

---

### NIST Cybersecurity Framework 2.0

**Category PR.DS-1:** Data-at-rest is protected

**Zipminator Alignment:**
- Kyber key encapsulation for symmetric key transport
- Hardware QRNG for key generation
- FIPS 140-3 validated module

**Action:** Map Zipminator to NIST CSF subcategories in implementation plan.

---

## Compliance Roadmap

### Phase 1: Assessment (Months 1-3)

- [ ] Inventory current cryptographic implementations
- [ ] Identify systems requiring PQC migration
- [ ] Determine compliance requirements (CNSA 2.0, FIPS, etc.)
- [ ] Establish migration timeline

### Phase 2: Pilot (Months 4-6)

- [ ] Deploy Zipminator in test environment
- [ ] Conduct performance benchmarking
- [ ] Train development and operations teams
- [ ] Develop integration playbooks

### Phase 3: Production (Months 7-12)

- [ ] Roll out PQC to non-critical systems
- [ ] Monitor QRNG health and performance
- [ ] Conduct security assessments
- [ ] Document compliance artifacts

### Phase 4: Certification (Months 13-24)

- [ ] Initiate FIPS 140-3 validation
- [ ] Pursue Common Criteria EAL4+ (if required)
- [ ] Conduct third-party penetration testing
- [ ] Obtain compliance certifications

---

## Audit and Attestation

### Annual Compliance Audit

**Scope:**
- Verify CNSA 2.0 algorithm usage
- Review QRNG health logs
- Validate key rotation schedules
- Confirm audit log retention (7 years)

**Deliverables:**
- Compliance attestation letter
- Gap analysis report
- Remediation plan (if needed)

### Third-Party Penetration Testing

**Frequency:** Annual

**Focus Areas:**
- Side-channel attacks (timing, power, cache)
- Fault injection attacks
- Key extraction attempts
- QRNG tampering

**Provider:** Engage CREST-certified pentesting firm

---

## References

- [NSA CNSA 2.0 Algorithms](https://media.defense.gov/2022/Sep/07/2003071836/-1/-1/0/CSI_CNSA_2.0_FAQ_.PDF)
- [NIST FIPS 140-3](https://csrc.nist.gov/publications/detail/fips/140/3/final)
- [Common Criteria Portal](https://www.commoncriteriaportal.org/)
- [NIST FIPS 203 (ML-KEM)](https://csrc.nist.gov/pubs/fips/203/final)
- [NIST FIPS 204 (ML-DSA)](https://csrc.nist.gov/pubs/fips/204/final)
- [PCI DSS 4.0](https://www.pcisecuritystandards.org/document_library/)

---

## Contact

For compliance assistance:
- **Compliance Team:** compliance@qdaria.com
- **Sales (Enterprise):** sales@qdaria.com
- **Technical Support:** support@qdaria.com
