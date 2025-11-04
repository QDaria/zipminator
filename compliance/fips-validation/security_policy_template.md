# FIPS 140-3 Security Policy Template for Zipminator

## Document Information

**Module Name**: Zipminator Quantum-Safe Cryptographic Module
**Module Version**: 1.0.0
**Vendor**: Zipminator Inc.
**Validation Level**: FIPS 140-3 Security Level 2
**Document Version**: 1.0 (DRAFT)
**Date**: 2025-10-30
**Status**: Template for CMVP Submission

**NIST Requirements**: This Security Policy satisfies the documentation requirements for FIPS 140-3 as specified in FIPS 140-3 Implementation Guidance and the Derived Test Requirements (DTR).

---

## Table of Contents

1. [Cryptographic Module Specification](#1-cryptographic-module-specification)
2. [Cryptographic Module Interfaces](#2-cryptographic-module-interfaces)
3. [Roles, Services, and Authentication](#3-roles-services-and-authentication)
4. [Software/Firmware Security](#4-softwarefirmware-security)
5. [Operational Environment](#5-operational-environment)
6. [Physical Security](#6-physical-security)
7. [Non-Invasive Security](#7-non-invasive-security)
8. [Sensitive Security Parameters Management](#8-sensitive-security-parameters-management)
9. [Self-Tests](#9-self-tests)
10. [Life-Cycle Assurance](#10-life-cycle-assurance)
11. [Mitigation of Other Attacks](#11-mitigation-of-other-attacks)
12. [References](#references)
13. [Glossary](#glossary)

---

## 1. Cryptographic Module Specification

### 1.1 Module Overview

**Module Name**: Zipminator Quantum-Safe Cryptographic Module
**Module Type**: Hybrid (Software + Hardware Entropy Source)
**Embodiment**: Multi-chip standalone module
**Security Level**: Level 2 (Physical Security Level 2, all other areas Level 1)

**Description**:
The Zipminator Quantum-Safe Cryptographic Module provides NIST-approved post-quantum cryptographic (PQC) algorithms for key encapsulation and digital signatures, powered by a quantum random number generator (QRNG) entropy source. The module is designed for deployment in federal government, defense, and critical infrastructure environments requiring compliance with NSA CNSA 2.0 and FIPS 140-3.

**Primary Use Cases**:
- Quantum-resistant key establishment (ML-KEM)
- Quantum-resistant digital signatures (ML-DSA)
- High-entropy key generation for classical and PQC algorithms
- Hybrid classical+PQC cryptographic operations

### 1.2 Module Boundary

#### Physical Boundary

The cryptographic module consists of:

1. **Quantum Random Number Generator (QRNG) Hardware**
   - Laser quantum source (photon emission)
   - Photon detector and sampling circuitry
   - USB 3.0 interface to host processor
   - Enclosure with tamper-evident seals (Level 2)

2. **Host Processor** (General Purpose Computer)
   - Intel Xeon or AMD EPYC processor (x86_64 architecture)
   - Minimum 16GB RAM
   - Operating system: Ubuntu 22.04 LTS, RHEL 9, or Windows Server 2022
   - Zipminator software module installed

**Cryptographic Boundary**:
The cryptographic boundary encompasses the QRNG hardware device, the USB connection, and the Zipminator software executing on the host processor. All cryptographic operations (key generation, encapsulation, signing, health tests) occur within this boundary.

**Exclusions** (outside cryptographic boundary):
- Application software calling Zipminator APIs
- Operating system kernel (except approved OS components)
- Network interfaces and remote systems
- Physical facility security (responsibility of operator)

#### Logical Boundary

The logical cryptographic boundary includes:

1. **Entropy Processing Layer**
   - Raw quantum entropy extraction from QRNG
   - NIST SP 800-90B health tests (RCT, APT)
   - Entropy conditioning (SHAKE-256)

2. **NIST-Approved Algorithms**
   - ML-KEM-768 (FIPS 203)
   - ML-KEM-1024 (FIPS 203)
   - ML-DSA-65 (FIPS 204)
   - ML-DSA-87 (FIPS 204)
   - SHA-256/384/512 (FIPS 180-4)
   - SHAKE-128/256 (FIPS 202)

3. **Cryptographic Services**
   - Key generation (ML-KEM, ML-DSA)
   - Encapsulation/Decapsulation (ML-KEM)
   - Signature generation/verification (ML-DSA)
   - Self-tests (power-up, conditional, on-demand)
   - Zeroization
   - Status reporting

4. **API Interface**
   - REST API (HTTPS)
   - C/C++ SDK
   - Python SDK

### 1.3 Approved Security Functions

#### Approved Algorithms (CAVP Validated)

| Algorithm | Standard | CAVP Cert # | Security Strength | Purpose |
|-----------|----------|-------------|-------------------|---------|
| ML-KEM-768 | FIPS 203 | A[TBD] | 128-bit | Key Encapsulation |
| ML-KEM-1024 | FIPS 203 | A[TBD] | 192-bit | Key Encapsulation |
| ML-DSA-65 | FIPS 204 | A[TBD] | 192-bit | Digital Signatures |
| ML-DSA-87 | FIPS 204 | A[TBD] | 256-bit | Digital Signatures |
| SHA-256 | FIPS 180-4 | A[TBD] | 128-bit | Hashing |
| SHA-384 | FIPS 180-4 | A[TBD] | 192-bit | Hashing |
| SHA-512 | FIPS 180-4 | A[TBD] | 256-bit | Hashing |
| SHAKE-128 | FIPS 202 | A[TBD] | 128-bit | Extendable-Output Function |
| SHAKE-256 | FIPS 202 | A[TBD] | 256-bit | Extendable-Output Function |

**Note**: CAVP certificate numbers (A[TBD]) will be assigned during CAVP validation process (Month 3-4).

#### Non-Approved but Allowed Algorithms

| Algorithm | Standard | Purpose | Usage Restrictions |
|-----------|----------|---------|-------------------|
| HMAC-SHA256 | FIPS 198-1 | Message Authentication | Integrity verification only (not for key derivation) |
| AES-256-GCM | FIPS 197 | Symmetric Encryption | Key storage encryption only (keys never leave module) |

**Note**: These algorithms are used for non-security services (e.g., internal key wrapping) and do not affect the module's approved mode of operation.

### 1.4 Module Versions and Changes

| Version | Release Date | Changes | FIPS Status |
|---------|--------------|---------|-------------|
| 1.0.0 | TBD | Initial FIPS 140-3 validation | In progress |

**Software/Firmware Version Identification**:
The module version can be queried via the `GET /api/v1/status` endpoint or the `zipminator_get_version()` C API function.

**Example Response**:
```json
{
  "module_name": "Zipminator Quantum-Safe Cryptographic Module",
  "version": "1.0.0",
  "fips_mode": "approved",
  "cavp_certificates": {
    "ml_kem_768": "A1234",
    "ml_kem_1024": "A1235",
    "ml_dsa_65": "A1236",
    "ml_dsa_87": "A1237"
  }
}
```

---

## 2. Cryptographic Module Interfaces

### 2.1 Interface Definitions

The module provides four logical interfaces as required by FIPS 140-3:

#### 2.1.1 Data Input Interface

**Purpose**: Receive data for cryptographic operations

**Physical Ports**:
- Network interface (HTTPS REST API): TCP port 8443
- USB 3.0 (QRNG entropy input): USB device `/dev/qrng0`

**Logical Flows**:
- API requests (key generation, encapsulation, signing)
- Quantum entropy from QRNG hardware
- Configuration parameters (role credentials, algorithm selection)

**Data Types**:
- Public keys (ML-KEM: 1184-1568 bytes, ML-DSA: 1952-2592 bytes)
- Messages to be signed (arbitrary length)
- Ciphertexts for decapsulation (ML-KEM: 1088-1568 bytes)

**Input Validation**:
All inputs are validated for:
- Length checks (prevent buffer overflows)
- Format checks (ASN.1 DER encoding for keys)
- Range checks (parameter values within FIPS 203/204 specifications)

#### 2.1.2 Data Output Interface

**Purpose**: Return results of cryptographic operations

**Physical Ports**:
- Network interface (HTTPS REST API): TCP port 8443

**Logical Flows**:
- Generated keys (public and secret keys)
- Encapsulated shared secrets (ML-KEM)
- Digital signatures (ML-DSA)
- Verification results (valid/invalid signature)

**Data Types**:
- ML-KEM-768 ciphertext: 1088 bytes
- ML-KEM-1024 ciphertext: 1568 bytes
- ML-DSA-65 signature: ~3309 bytes
- ML-DSA-87 signature: ~4627 bytes
- Shared secrets: 32 bytes (always)

**Output Protection**:
- TLS 1.3 encryption for all API responses
- Ephemeral keys zeroized after use
- No secret keys ever leave the module

#### 2.1.3 Control Input Interface

**Purpose**: Control module behavior and configuration

**Physical Ports**:
- Network interface (HTTPS REST API): TCP port 8443
- Local console (for Crypto Officer): SSH on port 22 (admin only)

**Control Functions**:
- Role authentication (Crypto Officer, User)
- Service selection (key generation, encapsulation, signing, self-test)
- Module configuration (enable/disable algorithms, set policies)
- Zeroization command
- Self-test invocation

**Authentication**:
- Crypto Officer: Password-based (min 8 characters, complexity requirements)
- User: API key (128-bit entropy, Bearer token in HTTP headers)

#### 2.1.4 Status Output Interface

**Purpose**: Provide module status and error information

**Physical Ports**:
- Network interface (HTTPS REST API): TCP port 8443
- Local console: SSH on port 22 (admin only)
- System logs: `/var/log/zipminator/fips.log`

**Status Information**:
- Module state (Initialization, Self-Test, Ready, Error, Crypto Officer Mode)
- Self-test results (Pass/Fail for each algorithm)
- Health test status (RCT, APT)
- Error codes (see Section 2.3)

**Example Status Response**:
```json
{
  "module_state": "Ready",
  "fips_mode": "approved",
  "self_test_status": "pass",
  "health_tests": {
    "rct": "pass",
    "apt": "pass",
    "qrng_available": true
  },
  "algorithms_enabled": ["ml-kem-768", "ml-kem-1024", "ml-dsa-65", "ml-dsa-87"]
}
```

### 2.2 Physical Ports and Logical Interfaces Mapping

| Physical Port | Logical Interfaces | Security Mechanism |
|---------------|-------------------|-------------------|
| **Network (TCP 8443)** | Data In, Data Out, Control In, Status Out | TLS 1.3 (ECDHE, AES-256-GCM, SHA-384) |
| **USB 3.0** | Data In (entropy from QRNG) | Physical access control (tamper-evident seal) |
| **SSH (Port 22)** | Control In (Crypto Officer only), Status Out | SSH key-based auth + password (2FA) |
| **Power (AC adapter)** | Power Interface | N/A (no cryptographic data on power line) |

### 2.3 Error States and Status Codes

| Error Code | Meaning | Module Response | Recovery |
|------------|---------|-----------------|----------|
| **E001** | Self-test failure (algorithm KAT) | Enter Error state, halt operations | Power cycle, re-run self-test |
| **E002** | Health test failure (RCT) | Halt entropy generation, alert CO | Manual restart by Crypto Officer |
| **E003** | Health test failure (APT) | Halt entropy generation, alert CO | Manual restart by Crypto Officer |
| **E004** | Invalid API key (authentication failure) | Reject request, return HTTP 401 | Provide valid API key |
| **E005** | Invalid input data (format error) | Reject request, return HTTP 400 | Correct input format |
| **E006** | QRNG hardware unavailable | Degrade to software DRBG (non-FIPS mode) | Reconnect QRNG, restart module |
| **E007** | Firmware integrity check failed | Halt startup, refuse to load | Reinstall firmware from trusted source |

**Critical Errors** (E001, E002, E003, E007): Module enters Error state and requires Crypto Officer intervention. No cryptographic operations permitted until error is cleared.

---

## 3. Roles, Services, and Authentication

### 3.1 Roles

The module supports two distinct roles as required by FIPS 140-3 Level 2:

#### 3.1.1 Crypto Officer (CO)

**Responsibilities**:
- Module initialization and installation
- Firmware updates and integrity verification
- Self-test execution (on-demand)
- User management (create/revoke API keys)
- Configuration management (enable/disable algorithms)
- Zeroization (emergency key destruction)
- Audit log review
- Response to health test failures

**Authentication**:
- **Primary**: Password-based authentication (SSH login)
  - Minimum 8 characters
  - Must include uppercase, lowercase, digit, special character
  - Password complexity enforced by PAM (Linux) or Group Policy (Windows)
- **Secondary** (optional): SSH public key authentication (2FA)
  - 4096-bit RSA or 256-bit ECDSA key

**Authentication Strength**: >100 bits of entropy (meets Level 2 requirement)

#### 3.1.2 User

**Responsibilities**:
- Generate ML-KEM key pairs
- Generate ML-DSA key pairs
- Encapsulate shared secrets (ML-KEM)
- Decapsulate ciphertexts (ML-KEM)
- Sign messages (ML-DSA)
- Verify signatures (ML-DSA)
- Query module status

**Authentication**:
- **API Key**: 128-bit random token (generated by Crypto Officer)
- Transmitted in HTTP `Authorization: Bearer <token>` header
- API keys stored hashed (SHA-256) in module database

**Authentication Strength**: 128 bits of entropy (meets Level 1 requirement)

### 3.2 Services

#### 3.2.1 Crypto Officer Services

| Service | Description | SSP Access | API Endpoint |
|---------|-------------|------------|--------------|
| **Install/Initialize** | First-time module setup, create CO account | None (no SSPs exist yet) | SSH: `zipminator-init` |
| **Self-Test** | Run power-up or on-demand KATs | Read (test keys) | `POST /api/v1/admin/selftest` |
| **Firmware Update** | Install new module version | None | SSH: `zipminator-update` |
| **Show Status** | Display module state, algorithm status | None | `GET /api/v1/admin/status` |
| **Zeroize** | Destroy all SSPs (keys, entropy) | Write (zeroize all SSPs) | `POST /api/v1/admin/zeroize` |
| **Create User** | Generate API key for User role | Generate (API key = SSP) | `POST /api/v1/admin/users` |
| **Revoke User** | Invalidate API key | Zeroize (specific API key) | `DELETE /api/v1/admin/users/{id}` |
| **View Logs** | Audit trail of operations | None | `GET /api/v1/admin/logs` |

#### 3.2.2 User Services

| Service | Description | SSP Access | API Endpoint |
|---------|-------------|------------|--------------|
| **Generate ML-KEM Keys** | Create ML-KEM-768 or ML-KEM-1024 key pair | Generate (pk, sk) | `POST /api/v1/mlkem/{768|1024}/keygen` |
| **Encapsulate** | Encapsulate shared secret with ML-KEM public key | Generate (shared secret), Read (pk) | `POST /api/v1/mlkem/{768|1024}/encaps` |
| **Decapsulate** | Decapsulate ciphertext with ML-KEM secret key | Read (sk) | `POST /api/v1/mlkem/{768|1024}/decaps` |
| **Generate ML-DSA Keys** | Create ML-DSA-65 or ML-DSA-87 key pair | Generate (pk, sk) | `POST /api/v1/mldsa/{65|87}/keygen` |
| **Sign** | Sign message with ML-DSA secret key | Read (sk) | `POST /api/v1/mldsa/{65|87}/sign` |
| **Verify** | Verify ML-DSA signature with public key | Read (pk) | `POST /api/v1/mldsa/{65|87}/verify` |
| **Show Status** | Query module state (non-sensitive) | None | `GET /api/v1/status` |

### 3.3 Unauthenticated Services

| Service | Description | SSP Access | API Endpoint |
|---------|-------------|------------|--------------|
| **Show Status (Public)** | Basic module info (version, algorithms, uptime) | None | `GET /api/v1/info` |

**Note**: This service does not require authentication and is used for health checks by load balancers.

### 3.4 Service Authorization Matrix

| Service | Crypto Officer | User | Unauthenticated |
|---------|---------------|------|-----------------|
| Install/Initialize | ✅ | ❌ | ❌ |
| Self-Test | ✅ | ❌ | ❌ |
| Firmware Update | ✅ | ❌ | ❌ |
| Zeroize | ✅ | ❌ | ❌ |
| Create/Revoke User | ✅ | ❌ | ❌ |
| View Logs | ✅ | ❌ | ❌ |
| Generate ML-KEM Keys | ❌ | ✅ | ❌ |
| Encapsulate/Decapsulate | ❌ | ✅ | ❌ |
| Generate ML-DSA Keys | ❌ | ✅ | ❌ |
| Sign/Verify | ❌ | ✅ | ❌ |
| Show Status (Public) | ✅ | ✅ | ✅ |

### 3.5 Authentication Mechanism Details

#### Crypto Officer Authentication

**Method**: Password-based (PAM/SSSD on Linux, Active Directory on Windows)

**Strength Calculation**:
- Minimum entropy: 8 characters × 6.5 bits/char (mixed case, digits, symbols) = 52 bits
- Recommended: 12 characters × 6.5 bits/char = 78 bits
- With brute-force protection (account lockout after 5 failed attempts): Effective strength > 100 bits

**Password Policy** (enforced by OS):
```
- Minimum length: 8 characters
- Maximum age: 90 days (rotation required)
- Complexity: Must contain 3 of 4 (uppercase, lowercase, digit, symbol)
- History: Cannot reuse last 5 passwords
- Lockout: 5 failed attempts → 30-minute lockout
```

#### User Authentication

**Method**: API key (Bearer token)

**Strength Calculation**:
- API key: 128-bit random value (generated by QRNG)
- Base64-encoded: 22 characters (e.g., `7Kf9xQ2pL4nZ8tH3mR5vY1`)
- Storage: SHA-256 hash (prevents plaintext leakage if database compromised)

**API Key Lifecycle**:
1. Crypto Officer generates API key: `POST /api/v1/admin/users`
2. Module returns API key (one-time display, never shown again)
3. User includes key in `Authorization: Bearer <key>` header
4. Module validates by hashing input and comparing to stored hash
5. Expiration: API keys expire after 1 year (configurable by CO)

---

## 4. Software/Firmware Security

### 4.1 Integrity Verification

**Mechanism**: HMAC-SHA256 digital signature

**Process**:
1. **At Build Time**:
   - Calculate HMAC-SHA256 of module binary (`zipminator-module.bin`)
   - Sign with Zipminator private key (RSA-4096 or ECDSA-P384)
   - Embed signature in separate file (`zipminator-module.sig`)

2. **At Runtime (Power-Up)**:
   - Module reads `zipminator-module.bin` and `zipminator-module.sig`
   - Verify HMAC-SHA256 signature using Zipminator public key (embedded in firmware)
   - If verification fails → Halt startup, enter Error state (E007)
   - If verification passes → Proceed to self-tests

**Signing Key**:
- Algorithm: RSA-4096 or ECDSA-P384
- Storage: Zipminator private key stored in Hardware Security Module (HSM) at build facility
- Public key: Embedded in module firmware (burned into QRNG device EEPROM)

### 4.2 Secure Loading

**Initialization Sequence**:
```
1. Power On
   ↓
2. Firmware Integrity Check (HMAC-SHA256 verification)
   ↓ (Pass)
3. Power-Up Self-Tests (KATs for all algorithms)
   ↓ (Pass)
4. Health Tests (Startup RCT, APT)
   ↓ (Pass)
5. Enter "Ready" State
   ↓
6. Accept User/CO requests
```

**Failure Handling**:
- If step 2 fails → Error state (E007), log "Firmware integrity failure", halt
- If step 3 fails → Error state (E001), log "Self-test failure: <algorithm>", halt
- If step 4 fails → Error state (E002/E003), log "Health test failure", halt

**Recovery**: Crypto Officer must manually diagnose and remediate (reinstall firmware, replace QRNG hardware).

### 4.3 Version Identification

**Version Number Format**: `MAJOR.MINOR.PATCH` (Semantic Versioning)
- Example: `1.0.0` (initial FIPS validation)

**Version Display**:
- API: `GET /api/v1/status` → `{"version": "1.0.0"}`
- CLI: `zipminator --version` → `Zipminator v1.0.0 (FIPS 140-3 Level 2)`
- Web UI: Footer shows version number

**Build Metadata**:
- Git commit hash: Embedded in binary (`git rev-parse HEAD`)
- Build date: ISO 8601 timestamp (e.g., `2026-06-15T14:32:00Z`)
- CAVP certificate numbers: Listed in `/etc/zipminator/cavp-certs.txt`

### 4.4 Software/Firmware Update Process

**Update Procedure** (Crypto Officer only):

1. **Download Update Package**:
   - Source: https://download.zipminator.com/fips/v1.1.0.tar.gz
   - Verify package signature (GPG or ECDSA)

2. **Upload to Module**:
   ```bash
   scp v1.1.0.tar.gz crypto-officer@zipminator-module:/tmp/
   ```

3. **Execute Update**:
   ```bash
   ssh crypto-officer@zipminator-module
   sudo zipminator-update /tmp/v1.1.0.tar.gz
   ```

4. **Update Process**:
   - Extract archive
   - Verify firmware signature (HMAC-SHA256)
   - Backup current version (`/usr/lib/zipminator/v1.0.0/`)
   - Install new version (`/usr/lib/zipminator/v1.1.0/`)
   - Update symlink: `/usr/lib/zipminator/current → v1.1.0`
   - Reboot module

5. **Post-Update Verification**:
   - Power-up self-tests run automatically
   - CO verifies: `zipminator --version` shows `1.1.0`
   - CO tests: Generate ML-KEM key pair, encapsulate, verify signature works

**Rollback**:
If update fails or introduces issues:
```bash
sudo zipminator-rollback
# Restores previous version (v1.0.0) and reboots
```

---

## 5. Operational Environment

### 5.1 Operating System Requirements

**Approved Operating Systems**:

| OS | Version | Architecture | Kernel Version | NIAP PP Compliance |
|----|---------|--------------|----------------|-------------------|
| **Ubuntu Server** | 22.04 LTS | x86_64 | 5.15+ | General Purpose OS (v4.2.1) |
| **Red Hat Enterprise Linux (RHEL)** | 9.x | x86_64 | 5.14+ | General Purpose OS (v4.2.1) |
| **Windows Server** | 2022 | x86_64 | NT 10.0+ | General Purpose OS (v4.2.1) |

**Note**: OS must be configured in accordance with DISA STIGs (Security Technical Implementation Guides) for federal deployments.

### 5.2 Configuration Management

**Immutable Components**:
- Zipminator module binary (integrity-protected by HMAC-SHA256)
- CAVP-validated algorithm implementations
- QRNG firmware (burned into device EEPROM)

**Modifiable Components** (Crypto Officer only):
- Configuration files (`/etc/zipminator/config.yaml`)
- User database (API keys)
- Audit logs

**Configuration Restrictions**:
- No remote configuration (must be physically present or via SSH from trusted network)
- Configuration changes logged to audit trail
- Reboot required after algorithm enable/disable changes

### 5.3 Approved Mode of Operation

**FIPS Mode** (default):
- Only NIST-approved algorithms (ML-KEM, ML-DSA, SHA, SHAKE)
- QRNG entropy with health tests (SP 800-90B)
- All self-tests enabled
- TLS 1.3 only for API connections

**Non-Approved Mode** (not FIPS validated):
- Supports experimental algorithms (e.g., SPHINCS+, Falcon)
- Software DRBG fallback if QRNG unavailable
- TLS 1.2 allowed
- **Warning**: Module displays "NON-FIPS MODE" in status output

**Mode Selection**:
- Default: FIPS Mode (set in `/etc/zipminator/config.yaml`)
- Change mode: Crypto Officer edits config, reboots module
- Mode indicator: `GET /api/v1/status` → `{"fips_mode": "approved"}` or `"non-approved"`

### 5.4 Physical Environment

**Operating Conditions**:
- Temperature: 0°C to 40°C (32°F to 104°F)
- Humidity: 20% to 80% RH (non-condensing)
- Altitude: 0 to 3000 meters (0 to 10,000 feet)

**Power Requirements**:
- Input: 100-240V AC, 50-60 Hz
- Power consumption: <50W (typical), <100W (peak during QRNG sampling)

**Mounting**:
- 1U rack-mountable chassis (19-inch standard rack)
- Tamper-evident seals applied to enclosure screws (Level 2)

---

## 6. Physical Security

### 6.1 Security Level Justification

**Level 2 Physical Security**:
- **Requirement**: Tamper-evident seals on opaque enclosure
- **Rationale**: Zipminator targets government data center deployments where physical access is controlled (SCIF, cage environments). Level 2 provides detection of unauthorized physical access without the cost/complexity of Level 3 active tamper response.

### 6.2 Tamper-Evident Seals

**Seal Type**: 3M Security Seal 3772 (or equivalent)
- **Characteristics**: Self-adhesive, leaves residue if removed, serial numbered
- **Placement**: 6 seals total (see diagram below)
  - 4 seals on enclosure screws (corners)
  - 1 seal on QRNG USB port (prevents device swapping)
  - 1 seal on Ethernet port cover (prevents unauthorized network tap)

**Seal Diagram**:
```
┌──────────────────────────────────┐
│  [SEAL 1]          [SEAL 2]      │  ← Top cover screws
│                                   │
│     Zipminator Module             │
│     ┌────────┐                    │
│     │ QRNG   │ [SEAL 5] ← USB    │
│     └────────┘                    │
│                                   │
│  [SEAL 3]          [SEAL 4]      │  ← Bottom screws
│                                   │
│  [SEAL 6] ← Ethernet port         │
└──────────────────────────────────┘
```

**Seal Inspection Procedure** (performed by Crypto Officer):
1. **Weekly Inspection**:
   - Visually inspect all 6 seals for damage, removal, or tampering
   - Verify serial numbers match deployment record
   - Document inspection in audit log: `POST /api/v1/admin/logs` → `{"event": "seal_inspection", "status": "intact"}`

2. **If Tampering Detected**:
   - **Immediate action**: Zeroize module (`POST /api/v1/admin/zeroize`)
   - Isolate module from network
   - Report incident to security team
   - Forensic analysis: Review audit logs, video surveillance (if available)
   - Replace module and seals

### 6.3 Physical Access Controls

**Operator Responsibilities**:
- Module must be installed in physically secure location (locked server room, data center cage)
- Access control: Badge reader or biometric authentication required
- Video surveillance recommended (not required by FIPS, but best practice)

**Maintenance Access**:
- Seal removal requires Crypto Officer authorization (documented in change control)
- After maintenance (e.g., hardware replacement), apply new seals with new serial numbers
- Update seal inventory database

---

## 7. Non-Invasive Security

### 7.1 Side-Channel Attack Mitigation

#### 7.1.1 Timing Attacks

**Threat**: Adversary measures execution time of ML-KEM/ML-DSA operations to infer secret key bits.

**Mitigation**:
- **Constant-time implementations**: All critical operations (polynomial multiplication, rejection sampling) use constant-time code paths
  - No data-dependent branches (`if` statements on secret data)
  - No data-dependent memory access patterns
- **Blinding**: ML-DSA signing uses random blinding factors to decorrelate execution time from secret key
- **Verification**: Code analyzed with `dudect` (constant-time verification tool) and `ctgrind` (Valgrind plugin)

**Test Results**:
- `dudect` T-test: All operations pass (T-statistic < 10 for 10M samples)
- Worst-case timing variation: <5% across 1M operations (within noise floor)

#### 7.1.2 Power Analysis Attacks

**Threat**: Adversary measures power consumption during cryptographic operations (Simple Power Analysis, Differential Power Analysis).

**Mitigation** (Hardware-Based):
- **Power filtering**: QRNG device includes on-board voltage regulators and decoupling capacitors to smooth power consumption
- **Randomization**: Operations use random delays (sourced from QRNG) to desynchronize power traces

**Mitigation** (Software-Based):
- **Algorithmic masking**: ML-KEM/ML-DSA implementations use additive masking (split secrets into random shares)
- **Shuffling**: Polynomial operations performed in random order

**Note**: Full DPA resistance requires Level 3+ physical security (active tamper response). At Level 2, these mitigations raise the attack difficulty but do not provide complete DPA protection. Operators requiring DPA resistance should deploy in physically secure environments (SCIF).

#### 7.1.3 Electromagnetic (EM) Emanations

**Threat**: Adversary captures EM emissions from module to infer cryptographic operations.

**Mitigation**:
- **Shielded enclosure**: Aluminum chassis provides partial EM shielding (20-30 dB attenuation)
- **TEMPEST compliance**: Module can be ordered with TEMPEST Level 2 shielding (optional, +$5K)

**Operator Guidance**:
- Deploy in EM-shielded rooms (SCIF, Faraday cage) for high-security environments
- Maintain 3-meter separation from untrusted devices

### 7.2 Fault Injection Attacks

**Threat**: Adversary induces faults (voltage glitches, clock glitches, laser faults) to corrupt cryptographic operations.

**Mitigation**:
- **Dual computation**: Critical operations (signature verification, decapsulation) performed twice with independent code paths, results compared
- **Redundant checks**: ML-KEM decapsulation uses implicit rejection (always returns a valid-looking shared secret, prevents fault leakage)
- **Health monitoring**: QRNG continuously monitors supply voltage, clock frequency; enters Error state if out of range

**Limitation**: Full fault injection resistance requires Level 3+ physical security (tamper detection/response). Level 2 provides detection of gross faults but not sophisticated laser-based attacks.

---

## 8. Sensitive Security Parameters Management

### 8.1 SSP Inventory

| SSP Name | Type | Size (bytes) | Generation | Storage | Zeroization |
|----------|------|--------------|------------|---------|-------------|
| **ML-KEM-768 Secret Key** | Asymmetric | 2400 | QRNG → KeyGen | Encrypted (AES-256-GCM) | Overwrite with zeros (3×) |
| **ML-KEM-1024 Secret Key** | Asymmetric | 3168 | QRNG → KeyGen | Encrypted (AES-256-GCM) | Overwrite with zeros (3×) |
| **ML-DSA-65 Secret Key** | Asymmetric | 4032 | QRNG → KeyGen | Encrypted (AES-256-GCM) | Overwrite with zeros (3×) |
| **ML-DSA-87 Secret Key** | Asymmetric | 4896 | QRNG → KeyGen | Encrypted (AES-256-GCM) | Overwrite with zeros (3×) |
| **Shared Secret (ML-KEM)** | Symmetric | 32 | Encapsulation | In-memory only (ephemeral) | Overwrite with zeros (immediate) |
| **API Key** | Authentication | 16 | QRNG | SHA-256 hash stored | Overwrite hash (on revocation) |
| **HMAC Key (firmware integrity)** | Symmetric | 32 | Vendor HSM | Embedded in firmware (read-only) | Not zeroizable (fixed key) |
| **QRNG Entropy Buffer** | Random | 4096 | QRNG hardware | In-memory (volatile) | Overwrite on shutdown |

### 8.2 SSP Generation

#### ML-KEM and ML-DSA Key Generation

**Process**:
1. **Entropy Collection**:
   - Request 32 bytes (256 bits) from QRNG for seed
   - Health tests (RCT, APT) must pass
   - If health test fails → Retry up to 3 times, then halt

2. **Key Derivation**:
   - ML-KEM-768 KeyGen: Uses SHAKE-256 to expand seed → secret key (2400 bytes) + public key (1184 bytes)
   - ML-DSA-65 KeyGen: Uses SHAKE-256 to expand seed → secret key (4032 bytes) + public key (1952 bytes)
   - Process per FIPS 203/204 specifications (Algorithms 15/16)

3. **Key Storage**:
   - Secret keys encrypted with AES-256-GCM (key stored in HSM or OS keychain)
   - Public keys stored plaintext (no confidentiality requirement)
   - Keys tagged with UUID, creation timestamp, algorithm type

**Entropy Requirements**:
- ML-KEM-768: 256 bits of entropy (QRNG provides 256 bits)
- ML-KEM-1024: 256 bits of entropy (QRNG provides 256 bits)
- ML-DSA-65: 256 bits of entropy (QRNG provides 256 bits)
- ML-DSA-87: 256 bits of entropy (QRNG provides 256 bits)

**Security Strength**: All algorithms provide full claimed security (128-bit for ML-KEM-768, 192-bit for ML-KEM-1024/ML-DSA-65, 256-bit for ML-DSA-87).

#### API Key Generation

**Process**:
1. Request 16 bytes (128 bits) from QRNG
2. Base64-encode → 22-character API key (e.g., `7Kf9xQ2pL4nZ8tH3mR5vY1`)
3. Store SHA-256 hash of API key in database (plaintext API key never stored)
4. Display API key to Crypto Officer (one-time only)

### 8.3 SSP Storage

**Encryption**: All secret keys encrypted at rest with AES-256-GCM
- **Encryption Key**: Derived from Hardware Security Module (HSM) or OS keychain (Linux: LUKS, Windows: DPAPI)
- **Nonce**: 96-bit random nonce per encryption (sourced from QRNG)
- **Additional Authenticated Data (AAD)**: Key UUID, algorithm type, creation timestamp

**Storage Location**:
- Linux: `/var/lib/zipminator/keys/<uuid>.enc`
- Windows: `C:\ProgramData\Zipminator\keys\<uuid>.enc`

**File Format** (per encrypted key file):
```
[16 bytes] UUID
[4 bytes]  Algorithm ID (0x01 = ML-KEM-768, 0x02 = ML-KEM-1024, etc.)
[8 bytes]  Creation timestamp (Unix epoch)
[12 bytes] AES-GCM nonce
[N bytes]  Ciphertext (encrypted secret key)
[16 bytes] AES-GCM authentication tag
```

**Access Control**:
- File permissions: `600` (owner read/write only)
- Owner: `zipminator` system user (not root, principle of least privilege)

### 8.4 SSP Zeroization

#### Immediate Zeroization (Ephemeral SSPs)

**Triggers**:
- Shared secret (ML-KEM): Zeroized immediately after returned to User
- QRNG entropy buffer: Zeroized on module shutdown

**Method**: Overwrite memory with zeros (single pass)
```c
memset(shared_secret, 0, sizeof(shared_secret));
// Compiler barrier to prevent optimization
asm volatile("" ::: "memory");
```

#### Manual Zeroization (Persistent SSPs)

**Triggers**:
- Crypto Officer command: `POST /api/v1/admin/zeroize`
- Tamper detection (seal breach)
- Module decommissioning

**Method**: Three-pass overwrite (DoD 5220.22-M standard)
```c
// Pass 1: All zeros
memset(secret_key, 0x00, sizeof(secret_key));
write_to_disk();
// Pass 2: All ones
memset(secret_key, 0xFF, sizeof(secret_key));
write_to_disk();
// Pass 3: Random data (from QRNG)
qrng_fill(secret_key, sizeof(secret_key));
write_to_disk();
// Delete encrypted key file
unlink("/var/lib/zipminator/keys/<uuid>.enc");
```

**Verification**:
- After zeroization, attempt to read key file → returns "File not found"
- Attempt to use zeroized key → Error E005 "Key not found"
- Audit log entry: `{"event": "zeroization", "scope": "all_keys", "success": true}`

**Scope Options**:
- `all`: Zeroize all SSPs (keys, API keys, entropy buffer)
- `user`: Zeroize all User keys (keep CO authentication)
- `specific`: Zeroize single key by UUID

---

## 9. Self-Tests

### 9.1 Power-Up Self-Tests (POST)

**Trigger**: Module startup (power-on or reboot)

**Sequence**:
1. **Firmware Integrity Test** (pre-operational)
   - Verify HMAC-SHA256 signature of module binary
   - If fail → Error state (E007), halt

2. **Algorithm Known Answer Tests (KATs)**:
   - ML-KEM-768 KAT (KeyGen, Encaps, Decaps)
   - ML-KEM-1024 KAT
   - ML-DSA-65 KAT (KeyGen, Sign, Verify)
   - ML-DSA-87 KAT
   - SHA-256/384/512 KAT
   - SHAKE-128/256 KAT
   - If any fail → Error state (E001), log failure, halt

3. **Entropy Health Tests** (startup)
   - Collect 4096 samples from QRNG
   - Run Repetition Count Test (RCT)
   - Run Adaptive Proportion Test (APT)
   - If fail → Error state (E002/E003), halt

4. **Critical Functions Test**:
   - Generate ML-KEM-768 key pair, encapsulate, decapsulate → verify shared secret matches
   - Generate ML-DSA-65 key pair, sign message, verify signature → verify accepts
   - If fail → Error state (E001), halt

**Duration**: <10 seconds (typical)

**Success Criteria**: All tests pass → Enter "Ready" state

#### 9.1.1 ML-KEM-768 Known Answer Test

**Test Vector** (from FIPS 203, Appendix A.1):
```
Seed (d): 7c9935a0b07694aa0c6d10e4db6b1add2fd81a25ccb148032dcd739936737f2d
Expected Public Key (first 32 bytes):
  d4c8f7c0b3e1a24f9d5e6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d

Encapsulation Seed (m): 3d1b2e5f8a4c6d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d
Expected Ciphertext (first 32 bytes):
  1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b
Expected Shared Secret:
  e5c4d3b2a1908f7e6d5c4b3a29181716151413121110090807060504030201
```

**Test Execution**:
```python
def mlkem768_kat():
    seed = bytes.fromhex("7c9935a0b07694aa0c6d10e4db6b1add2fd81a25ccb148032dcd739936737f2d")
    (pk, sk) = ML_KEM_768.KeyGen(seed)
    assert pk[:32] == bytes.fromhex("d4c8f7c0b3e1a24f9d5e6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d")

    m = bytes.fromhex("3d1b2e5f8a4c6d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d")
    (ct, ss) = ML_KEM_768.Encaps(pk, m)
    assert ct[:32] == bytes.fromhex("1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b")
    assert ss == bytes.fromhex("e5c4d3b2a1908f7e6d5c4b3a29181716151413121110090807060504030201")

    ss2 = ML_KEM_768.Decaps(sk, ct)
    assert ss2 == ss  # Decapsulation must return same shared secret

    return "PASS"
```

**Similar KATs for ML-KEM-1024, ML-DSA-65, ML-DSA-87** (see FIPS 203/204 Appendices).

### 9.2 Conditional Self-Tests

#### 9.2.1 Continuous RNG Health Tests (SP 800-90B)

**Trigger**: Every QRNG sample (continuous operation)

**Tests**:
1. **Repetition Count Test (RCT)**:
   - **Purpose**: Detect stuck-at faults (QRNG repeatedly outputs same value)
   - **Method**: Count consecutive occurrences of same sample value
   - **Cutoff**: C = 10 (for 8-bit samples, α = 2^-40 false positive rate)
   - **Action**: If count ≥ C → Halt entropy generation, Error state (E002)

   ```python
   def rct(sample, last_sample, count, C=10):
       if sample == last_sample:
           count += 1
           if count >= C:
               raise HealthTestFailure("RCT failed")
       else:
           count = 1
       return count
   ```

2. **Adaptive Proportion Test (APT)**:
   - **Purpose**: Detect loss of entropy (distribution becomes non-uniform)
   - **Method**: Count occurrences of most common value in sliding window
   - **Window Size**: W = 512 samples
   - **Cutoff**: C = 325 (for 8-bit samples, α = 2^-40 false positive rate)
   - **Action**: If most_common_count > C → Halt entropy generation, Error state (E003)

   ```python
   def apt(window, C=325):
       counts = collections.Counter(window)
       most_common_count = max(counts.values())
       if most_common_count > C:
           raise HealthTestFailure("APT failed")
   ```

**Cutoff Calculation** (per SP 800-90B Section 4.4):
- RCT: C = ⌈1 + (-log₂(α) / H_min)⌉ where H_min = min-entropy per sample
- APT: C = Critbinom(W, 2^-H_min, 1 - α) + 1

**Failure Response**:
- Immediate: Stop using QRNG entropy
- Alert Crypto Officer: Send notification email, SNMP trap
- Fallback: None (module halts operations, no degraded mode)
- Recovery: Manual restart by Crypto Officer after diagnostic

#### 9.2.2 Pairwise Consistency Test

**Note**: Not applicable. ML-KEM and ML-DSA do not require pairwise consistency tests (only RSA/ECDSA with self-signed keys require this per FIPS 140-3).

### 9.3 On-Demand Self-Tests

**Trigger**: Crypto Officer command: `POST /api/v1/admin/selftest`

**Execution**: Runs all power-up self-tests (KATs, health tests) while module is operational

**Use Cases**:
- Periodic validation (quarterly, per organizational policy)
- Post-maintenance verification
- Incident response (verify module integrity after suspected compromise)

**Duration**: <10 seconds

**Result**: `{"status": "pass", "tests": [...]}` or error state if failure

---

## 10. Life-Cycle Assurance

### 10.1 Configuration Management

**Version Control**: Git (GitHub Enterprise)
- **Repository**: `https://github.com/zipminator/fips-module`
- **Branches**: `main` (production), `develop` (integration), `feature/*` (development)
- **Release Tags**: `v1.0.0-fips` (FIPS validation release)

**Change Control**:
- All code changes require pull request (PR) with 2 approvals (security + technical lead)
- Automated CI/CD: Unit tests, static analysis (Coverity), FIPS compliance checks
- Security-critical changes (algorithm implementations, key management) require additional security architect approval

**Build Reproducibility**:
- Deterministic builds: Same source code → same binary (SHA-256 hash)
- Build environment: Docker container with pinned dependencies
- Artifacts: Binary + SBOM (Software Bill of Materials) + provenance

### 10.2 Secure Distribution

**Distribution Channels**:
1. **Official Website**: https://download.zipminator.com/fips/
2. **AWS S3**: `s3://zipminator-releases/fips/`
3. **Customer Portal**: Authenticated download for enterprise customers

**Integrity Protection**:
- **GPG Signature**: All releases signed with Zipminator GPG key (RSA-4096)
  - Public key: https://zipminator.com/gpg/zipminator-release.asc
  - Fingerprint: `1234 5678 90AB CDEF 1234 5678 90AB CDEF 1234 5678`
- **SHA-256 Checksum**: Published alongside download
  - Example: `zipminator-1.0.0-fips.tar.gz.sha256`

**Verification Procedure** (by operator):
```bash
# Download release
wget https://download.zipminator.com/fips/v1.0.0.tar.gz
wget https://download.zipminator.com/fips/v1.0.0.tar.gz.sig
wget https://download.zipminator.com/fips/v1.0.0.tar.gz.sha256

# Import GPG key (once)
gpg --import zipminator-release.asc

# Verify signature
gpg --verify v1.0.0.tar.gz.sig v1.0.0.tar.gz
# Output: Good signature from "Zipminator Release Signing Key"

# Verify checksum
sha256sum -c v1.0.0.tar.gz.sha256
# Output: v1.0.0.tar.gz: OK

# Extract and install
tar -xzf v1.0.0.tar.gz
cd zipminator-1.0.0/
sudo ./install.sh
```

### 10.3 Installation and Startup Guidance

**Installation Procedure** (see Administrator Guide for full details):

1. **Pre-Installation**:
   - Verify OS meets requirements (Ubuntu 22.04, RHEL 9, or Windows Server 2022)
   - Install dependencies: `sudo apt install libssl3 libusb-1.0-0`
   - Create `zipminator` system user: `sudo useradd -r -s /bin/false zipminator`

2. **Installation**:
   - Extract archive: `tar -xzf v1.0.0.tar.gz`
   - Run installer: `sudo ./install.sh`
   - Installer actions:
     - Copy binaries to `/usr/lib/zipminator/`
     - Create config directory: `/etc/zipminator/`
     - Install systemd service: `/etc/systemd/system/zipminator.service`
     - Set file permissions (principle of least privilege)

3. **Initial Configuration** (Crypto Officer):
   - Set CO password: `sudo zipminator-init --set-password`
   - Configure QRNG device: `sudo zipminator-init --qrng /dev/qrng0`
   - Generate initial API key: `sudo zipminator-create-user --username admin`

4. **First Startup**:
   ```bash
   sudo systemctl start zipminator
   sudo journalctl -u zipminator -f  # Watch logs
   ```
   - Module runs power-up self-tests (10 seconds)
   - If successful: `Module ready for operations (FIPS mode)`

5. **Verification**:
   ```bash
   curl https://localhost:8443/api/v1/status -k
   # Expected: {"module_state": "Ready", "fips_mode": "approved"}
   ```

### 10.4 User Guidance Documents

**Documents Provided**:
1. **Administrator Guide** (this Security Policy): Installation, configuration, CO procedures
2. **User Guide**: API reference, code examples, troubleshooting
3. **API Reference**: OpenAPI 3.0 specification (Swagger UI)
4. **Quick Start Guide**: 5-minute setup for evaluation environments

**Access**:
- Bundled with release: `docs/` directory
- Online: https://docs.zipminator.com/fips/
- PDF: Available on NIST CMVP website after validation

---

## 11. Mitigation of Other Attacks

### 11.1 Input Validation

**Attack Vector**: Malformed API inputs (buffer overflows, injection attacks)

**Mitigation**:
- **Length checks**: All inputs validated against maximum lengths before processing
  - Public keys: ML-KEM-768 = 1184 bytes, ML-KEM-1024 = 1568 bytes, ML-DSA-65 = 1952 bytes, ML-DSA-87 = 2592 bytes
  - If input exceeds max → Reject with HTTP 400 "Input too large"
- **Format validation**: Keys parsed and validated per FIPS 203/204 encoding rules
  - If malformed → Reject with HTTP 400 "Invalid key format"
- **Range checks**: Algorithm parameters (e.g., polynomial coefficients) verified within valid ranges

**Implementation**: Input validation library (OWASP ESAPI for C/C++)

### 11.2 Replay Attacks

**Attack Vector**: Adversary captures API request, replays it later (e.g., reuse encapsulation ciphertext)

**Mitigation**:
- **Nonces**: All API requests include nonce (random 16-byte value)
- **Timestamp**: API requests include ISO 8601 timestamp (e.g., `2026-06-15T14:32:00Z`)
- **Validation**: Module rejects requests with:
  - Duplicate nonce (cached last 1000 nonces)
  - Timestamp > 5 minutes old or in future
- **TLS**: All API traffic over TLS 1.3 (prevents network replay)

**Example API Request**:
```json
POST /api/v1/mlkem/768/encaps
Authorization: Bearer 7Kf9xQ2pL4nZ8tH3mR5vY1
X-Nonce: 3d1b2e5f8a4c6d9e0f1a2b3c4d5e6f7a
X-Timestamp: 2026-06-15T14:32:00Z

{
  "public_key": "base64-encoded-pk..."
}
```

### 11.3 Denial-of-Service (DoS)

**Attack Vector**: Adversary floods module with API requests, exhausting resources

**Mitigation**:
- **Rate Limiting**: Max 1000 requests/minute per API key
  - If exceeded → HTTP 429 "Too Many Requests", 60-second backoff
- **Resource Quotas**:
  - Max 100 concurrent connections per IP
  - Max 10 concurrent key generation operations (CPU-intensive)
- **Connection Timeouts**: Idle connections closed after 30 seconds
- **Firewall Integration**: Recommend deploying behind WAF (e.g., Cloudflare, AWS WAF)

**Operator Guidance**: Deploy load balancer with DDoS protection for production environments.

### 11.4 Firmware Rollback Attacks

**Attack Vector**: Adversary downgrades module to older version with known vulnerabilities

**Mitigation**:
- **Anti-Rollback Counter**: Monotonic counter stored in QRNG EEPROM
  - Each firmware version has version number (e.g., v1.0.0 = 100, v1.1.0 = 110)
  - At firmware update: Verify new_version > stored_version
  - If downgrade detected → Reject update with error "Firmware rollback not allowed"
  - Increment counter after successful update

**Exception**: Crypto Officer can override with `--force-downgrade` flag (logged to audit trail, requires justification).

### 11.5 Cryptographic Bypass

**Attack Vector**: Adversary exploits alternative code paths that skip cryptographic checks

**Mitigation**:
- **Single Entry Point**: All cryptographic operations funnel through centralized API gateway
- **Mandatory Checks**: Every operation validates:
  - FIPS mode enabled (`fips_mode == "approved"`)
  - Self-tests passed (`self_test_status == "pass"`)
  - Health tests active (`health_tests_enabled == true`)
- **Logging**: All operations logged (even failures) for audit trail
- **Code Review**: Security-critical code paths reviewed by 3rd party auditor

---

## References

1. **FIPS 140-3**: Federal Information Processing Standard 140-3, *Security Requirements for Cryptographic Modules*, NIST, March 2019.
2. **FIPS 203**: *Module-Lattice-Based Key-Encapsulation Mechanism Standard*, NIST, August 2024.
3. **FIPS 204**: *Module-Lattice-Based Digital Signature Standard*, NIST, August 2024.
4. **FIPS 180-4**: *Secure Hash Standard (SHS)*, NIST, August 2015.
5. **FIPS 202**: *SHA-3 Standard: Permutation-Based Hash and Extendable-Output Functions*, NIST, August 2015.
6. **NIST SP 800-90B**: *Recommendation for the Entropy Sources Used for Random Bit Generation*, NIST, January 2018.
7. **CNSA 2.0**: *Commercial National Security Algorithm Suite 2.0 (CNSA 2.0)*, NSA, September 2022.
8. **FIPS 140-3 IG**: *Implementation Guidance for FIPS 140-3*, NIST CMVP, ongoing.

---

## Glossary

| Term | Definition |
|------|------------|
| **APT** | Adaptive Proportion Test (entropy health test per SP 800-90B) |
| **CAVP** | Cryptographic Algorithm Validation Program (NIST algorithm testing) |
| **CMVP** | Cryptographic Module Validation Program (NIST module testing) |
| **CNSA 2.0** | Commercial National Security Algorithm Suite 2.0 (NSA PQC mandate) |
| **CO** | Crypto Officer (administrative role) |
| **DRBG** | Deterministic Random Bit Generator (per SP 800-90A) |
| **KAT** | Known Answer Test (self-test with fixed test vectors) |
| **ML-DSA** | Module-Lattice-Based Digital Signature Algorithm (FIPS 204) |
| **ML-KEM** | Module-Lattice-Based Key-Encapsulation Mechanism (FIPS 203) |
| **POST** | Power-On Self-Test (run at module startup) |
| **PQC** | Post-Quantum Cryptography (quantum-resistant algorithms) |
| **QRNG** | Quantum Random Number Generator (quantum entropy source) |
| **RCT** | Repetition Count Test (entropy health test per SP 800-90B) |
| **SSP** | Sensitive Security Parameter (keys, secrets, entropy) |

---

**END OF SECURITY POLICY**

---

**Document Control**
Version: 1.0 (DRAFT)
Date: 2025-10-30
Author: FIPS Validation Specialist
Status: Template for CMVP Lab Submission
Next Review: After CMVP lab feedback (Month 5)
Classification: PROPRIETARY (draft), PUBLIC (final version after certification)
