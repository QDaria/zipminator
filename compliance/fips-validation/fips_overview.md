# FIPS 140-3 Validation Overview for Zipminator

## Executive Summary

FIPS 140-3 (Federal Information Processing Standard) certification is **MANDATORY** for Zipminator to access U.S. government, Department of Defense, and National Security System (NSS) markets under CNSA 2.0 compliance requirements. This certification validates that cryptographic modules meet stringent security requirements.

## FIPS 140-3 Security Levels

### Recommended: Security Level 2

**Rationale**: Optimal balance of security, cost, and time-to-market for Zipminator.

| Security Level | Requirements | Cost | Timeline | Recommendation |
|---------------|--------------|------|----------|----------------|
| **Level 1** | Basic functional requirements | $50-75K | 6-9 months | ❌ Insufficient for government |
| **Level 2** | Physical tamper evidence, role-based auth | $100-150K | 9-12 months | ✅ **RECOMMENDED** |
| **Level 3** | Physical tamper detection/response | $200-300K | 12-18 months | ⚠️ Higher barrier |
| **Level 4** | Complete physical envelope protection | $500K+ | 18-24 months | ❌ Overkill for software |

### Level 2 Requirements for Zipminator

1. **Physical Security**: Tamper-evident seals on hardware enclosures
2. **Role-Based Authentication**: Separate Crypto Officer and User roles
3. **Software/Firmware Security**: Integrity checking, secure loading
4. **Design Assurance**: Complete design documentation
5. **Mitigation of Other Attacks**: Side-channel analysis, fault injection

## Cryptographic Module Boundary

### Zipminator Module Definition

```
┌─────────────────────────────────────────────────────┐
│        FIPS 140-3 Cryptographic Module              │
│                  "Zipminator"                       │
│                                                      │
│  ┌────────────────────────────────────────────┐   │
│  │  QRNG Core (Quantum Random Number Gen)     │   │
│  │  - Laser quantum source                     │   │
│  │  - Photon detection                         │   │
│  │  - Raw entropy extraction                   │   │
│  └────────────────────────────────────────────┘   │
│                      ↓                              │
│  ┌────────────────────────────────────────────┐   │
│  │  Entropy Processing & Health Tests          │   │
│  │  - NIST SP 800-90B health tests             │   │
│  │  - Entropy conditioning                     │   │
│  │  - Quality assurance                        │   │
│  └────────────────────────────────────────────┘   │
│                      ↓                              │
│  ┌────────────────────────────────────────────┐   │
│  │  NIST-Approved PQC Algorithms               │   │
│  │  - ML-KEM-768 (FIPS 203)                    │   │
│  │  - ML-KEM-1024 (FIPS 203)                   │   │
│  │  - ML-DSA-65 (FIPS 204)                     │   │
│  │  - ML-DSA-87 (FIPS 204)                     │   │
│  └────────────────────────────────────────────┘   │
│                      ↓                              │
│  ┌────────────────────────────────────────────┐   │
│  │  Approved Services                          │   │
│  │  - Key generation (ML-KEM, ML-DSA)          │   │
│  │  - Encapsulation/Decapsulation (ML-KEM)     │   │
│  │  - Sign/Verify (ML-DSA)                     │   │
│  │  - Show Status                              │   │
│  │  - Self-Test                                │   │
│  │  - Zeroize                                  │   │
│  └────────────────────────────────────────────┘   │
│                                                      │
│  API Interface: REST API + SDK                      │
└─────────────────────────────────────────────────────┘
```

### Module Components

**Hardware Boundary**:
- Quantum entropy source (laser + photon detector)
- Secure processing unit (if applicable)
- Physical tamper-evident seals (Level 2+)

**Software Boundary**:
- ML-KEM implementation (FIPS 203)
- ML-DSA implementation (FIPS 204)
- DRBG (if used, must be SP 800-90A approved)
- Health test suite (SP 800-90B)
- API layer

**Excluded from Module**:
- Application software calling Zipminator
- Operating system (must be on FIPS 140-3 approved OS list)
- Network interfaces (outside cryptographic boundary)

## NIST-Approved Algorithms

### Post-Quantum Cryptography (CNSA 2.0 Compliant)

| Algorithm | FIPS Standard | Purpose | Key Size | Status |
|-----------|--------------|---------|----------|--------|
| **ML-KEM-768** | FIPS 203 | Key Encapsulation | 768-bit | ✅ Required |
| **ML-KEM-1024** | FIPS 203 | Key Encapsulation | 1024-bit | ✅ Required |
| **ML-DSA-65** | FIPS 204 | Digital Signatures | 2560-bit | ✅ Required |
| **ML-DSA-87** | FIPS 204 | Digital Signatures | 3296-bit | ✅ Required |

### Supporting Algorithms (Must be CAVP Validated)

| Algorithm | Purpose | Standard | Notes |
|-----------|---------|----------|-------|
| SHA-256/384/512 | Hashing | FIPS 180-4 | For SHAKE variants |
| SHAKE-128/256 | XOF | FIPS 202 | ML-KEM/ML-DSA internal |
| HMAC | MAC | FIPS 198-1 | Optional for API auth |
| AES-256 | Symmetric | FIPS 197 | Optional for storage |

## Cryptographic Module Validation Program (CMVP) Process

### Overview

```
┌─────────────────────┐
│  CAVP Validation    │ ← Algorithm testing (NIST CAVP)
│  (2-3 months)       │   Receives certificate numbers
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  CMVP Lab Testing   │ ← Module testing (accredited lab)
│  (3-4 months)       │   Physical, logical, interface testing
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  NIST Review        │ ← CMVP review process
│  (3-5 months)       │   Comments, corrections, iterations
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  FIPS 140-3 CERT    │ ← Certificate issuance
│  (Certificate #)    │   Listed on NIST website
└─────────────────────┘
```

### Step 1: CAVP (Cryptographic Algorithm Validation Program)

**Duration**: 2-3 months
**Cost**: Included in CMVP lab fees

**Process**:
1. Submit algorithm implementation to NIST ACVTS (Automated Cryptographic Validation Testing System)
2. Run test vectors for each algorithm:
   - ML-KEM-768 (FIPS 203)
   - ML-KEM-1024 (FIPS 203)
   - ML-DSA-65 (FIPS 204)
   - ML-DSA-87 (FIPS 204)
   - SHA-256/384/512 (FIPS 180-4)
   - SHAKE-128/256 (FIPS 202)
3. Receive CAVP certificate numbers (required for CMVP submission)

**Deliverables**:
- CAVP certificate for each algorithm
- Certificate numbers (e.g., A1234, A1235...)

### Step 2: CMVP Laboratory Testing

**Duration**: 3-4 months
**Cost**: $50,000 - $150,000

**Testing Areas**:

1. **Cryptographic Module Specification** (Section 1)
   - Module description
   - Module type (software, hardware, hybrid)
   - Validation level
   - Approved algorithms

2. **Cryptographic Module Interfaces** (Section 2)
   - Data input/output
   - Control input
   - Status output
   - Power interface

3. **Roles, Services, and Authentication** (Section 3)
   - Crypto Officer role
   - User role
   - Authentication mechanisms
   - Service authorization

4. **Software/Firmware Security** (Section 4)
   - Integrity checks (HMAC, digital signature)
   - Secure loading
   - Version control

5. **Operational Environment** (Section 5)
   - OS requirements
   - Configuration management
   - Approved mode of operation

6. **Physical Security** (Section 6)
   - Level 2: Tamper-evident seals
   - Production-grade packaging

7. **Non-Invasive Security** (Section 7)
   - Side-channel attack mitigation
   - Differential power analysis (DPA)
   - Timing attack resistance

8. **Sensitive Security Parameters** (Section 8)
   - Key generation
   - Key storage
   - Key zeroization

9. **Self-Tests** (Section 9)
   - Power-up tests (KATs)
   - Conditional tests
   - Error states

10. **Life-Cycle Assurance** (Section 10)
    - Configuration management
    - Secure distribution
    - Guidance documentation

11. **Mitigation of Other Attacks** (Section 11)
    - Additional security mechanisms
    - Attack surface analysis

**Deliverables**:
- CMVP Test Report (200-300 pages)
- Entropy Assessment Report (per SP 800-90B)
- Security Policy Document (50-100 pages)

### Step 3: NIST CMVP Review

**Duration**: 3-5 months
**Cost**: Included in lab fees

**Process**:
1. NIST validators review test report and security policy
2. Issue comments and questions (typically 2-3 rounds)
3. Lab addresses comments and resubmits
4. Final validation decision

**Potential Issues**:
- Incomplete documentation
- Algorithm implementation discrepancies
- Security policy gaps
- Physical security concerns

### Step 4: Certificate Issuance

**Duration**: 2-4 weeks after approval
**Cost**: None

**Deliverables**:
- FIPS 140-3 Certificate (PDF)
- Certificate number (e.g., #4567)
- Listing on NIST CMVP website
- Security Policy (public, redacted if needed)

**Certificate Maintenance**:
- Valid for 5 years from issuance
- Algorithm transitions (e.g., new FIPS standards)
- Software updates require re-validation or letters

## Required Documentation

### 1. Security Policy (50-100 pages)

**Mandatory Sections**:
1. Cryptographic Module Specification
2. Cryptographic Module Interfaces
3. Roles, Services, and Authentication
4. Software/Firmware Security
5. Operational Environment
6. Physical Security
7. Non-Invasive Security
8. Sensitive Security Parameters Management
9. Self-Tests
10. Life-Cycle Assurance
11. Mitigation of Other Attacks

### 2. Entropy Assessment Report (SP 800-90B)

**Required for QRNG**:
- Noise source description
- Entropy estimation (min-entropy per bit)
- Health test design
- Continuous health test implementation
- Startup health test implementation
- Vetted conditioning functions (if used)

**Minimum Entropy Requirement**: 128 bits for ML-KEM-768, 192 bits for ML-KEM-1024

### 3. Source Code and Design Documents

**Required**:
- Complete source code (submitted to lab, can be proprietary)
- High-level design document (HLD)
- Low-level design document (LLD)
- Finite State Model (FSM)
- Algorithm implementation descriptions

### 4. User Guidance Documents

**Required**:
- Administrator Guide (Crypto Officer)
- User Guide
- Installation/Configuration Guide
- API Reference Manual

## Maintenance and Re-Validation

### Change Types

| Change Type | Re-Validation Required | Process |
|-------------|------------------------|---------|
| **Bug fix (no security impact)** | ❌ Letter to CMVP | 1-2 months |
| **Algorithm parameter change** | ✅ Partial re-validation | 3-6 months |
| **New algorithm addition** | ✅ Partial re-validation | 3-6 months |
| **Security mechanism change** | ✅ Full re-validation | 9-12 months |
| **Module boundary change** | ✅ Full re-validation | 9-12 months |

### Algorithm Transitions

**CNSA 2.0 Timeline**:
- **2025**: ML-KEM and ML-DSA preferred
- **2030**: Classical algorithms (RSA, ECDH) deprecated for NSS
- **2035**: Quantum-resistant only for new systems

**Zipminator Strategy**: Maintain FIPS 140-3 certificate with both classical and PQC algorithms during transition (2025-2030).

## Compliance Benefits

### Market Access

1. **U.S. Federal Government**
   - Addressable market: $85 billion (cybersecurity)
   - FedRAMP High authorization
   - DoD IL4/IL5 systems

2. **National Security Systems (NSS)**
   - Intelligence Community (IC)
   - Department of Defense (DoD)
   - Critical Infrastructure (CI/KR)

3. **Financial Services**
   - Banking (FDIC requirements)
   - Payment processing (PCI-DSS)
   - Securities trading (SEC regulations)

4. **Healthcare**
   - HIPAA compliance
   - Medical device security (FDA)
   - Health information exchanges

5. **International Markets**
   - Common Criteria recognition
   - NATO interoperability
   - Five Eyes intelligence sharing

### Competitive Advantage

- **Unique Position**: First QRNG-based PQC platform with FIPS 140-3
- **Market Timing**: CNSA 2.0 mandate drives demand (2025-2030)
- **Trust Signal**: NIST validation = government-grade security
- **Procurement Enabler**: Required for GSA Schedule, DLA contracts

## Risk Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Algorithm implementation errors | Medium | High | Pre-validation testing, CAVP early |
| Entropy source failure | Low | High | Redundant health tests, SP 800-90B compliance |
| Side-channel vulnerabilities | Medium | Medium | DPA/timing analysis, countermeasures |
| CMVP review delays | High | Medium | Experienced lab, complete documentation |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Validation timeline overrun | Medium | Medium | Add 3-month buffer to roadmap |
| Cost overruns | Low | Low | Fixed-price lab contracts |
| Standards changes | Low | High | Monitor NIST, implement latest drafts |
| Competitor validation | Medium | Medium | First-mover advantage, speed to market |

## Next Steps

1. **Month 1**: Complete pre-validation checklist (see `pre_validation_checklist.md`)
2. **Month 2**: Select CMVP lab and sign contract (see `lab_recommendations.md`)
3. **Month 3**: Submit algorithms to NIST ACVTS for CAVP testing
4. **Month 4**: Begin CMVP lab engagement
5. **Month 9**: Target certificate issuance

## References

- [FIPS 140-3 Standard](https://csrc.nist.gov/publications/detail/fips/140/3/final)
- [NIST CMVP](https://csrc.nist.gov/projects/cryptographic-module-validation-program)
- [NIST SP 800-90B](https://csrc.nist.gov/publications/detail/sp/800-90b/final) (Entropy Sources)
- [FIPS 203](https://csrc.nist.gov/publications/detail/fips/203/final) (ML-KEM)
- [FIPS 204](https://csrc.nist.gov/publications/detail/fips/204/final) (ML-DSA)
- [CNSA 2.0](https://media.defense.gov/2022/Sep/07/2003071834/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS_.PDF)

---

**Document Control**
Version: 1.0
Date: 2025-10-30
Author: FIPS Validation Specialist
Status: Final
