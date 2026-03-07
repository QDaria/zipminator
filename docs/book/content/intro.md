# Introduction

Zipminator provides enterprise-grade post-quantum cryptographic protection for sensitive data. It addresses the "harvest now, decrypt later" (HNDL) threat by replacing classical key exchange with quantum-resistant algorithms today.

## Features

### PQC Kyber768 (ML-KEM-768)

The core cryptographic engine is written in Rust and implements NIST FIPS 203 ML-KEM-768 (Kyber768). Key properties:

- **Public key**: 1184 bytes
- **Secret key**: 2400 bytes
- **Ciphertext**: 1088 bytes
- **Shared secret**: 32 bytes
- Constant-time operations to prevent side-channel attacks
- Verified against NIST Known Answer Test (KAT) vectors
- Exposed to Python via PyO3 bindings

### Quantum Random Number Generation (QRNG)

Entropy is harvested from a 156-qubit IBM quantum processor via the qBraid platform:

- Primary source: IBM Quantum (Rigetti and Fez as fallbacks)
- Entropy pool stored locally at `quantum_entropy/quantum_entropy_pool.bin`
- Harvester appends approximately 50 KB per cycle
- OS `secrets.token_bytes` used as bootstrap seed if pool is missing
- Pool size is read dynamically by all consumers

### 10-Level Anonymization System

A progressive anonymization system that balances data utility against privacy protection:

| Level | Name | Technique | Reversible |
|-------|------|-----------|------------|
| L1 | Minimal Masking | Regex pattern matching | Yes |
| L2 | Partial Redaction | First/last character preservation | Yes |
| L3 | Static Masking | Fixed `[REDACTED]` replacement | No |
| L4 | PQC Pseudonymization | SHA-3 + PQC seed hashing | With key |
| L5 | Data Generalization | Range bucketing | No |
| L6 | Data Suppression | Column removal | No |
| L7 | Quantum Jitter | QRNG Gaussian noise injection | No |
| L8 | Differential Privacy | Calibrated Laplace noise | No |
| L9 | Enhanced K-Anonymity | Quasi-identifier clustering | No |
| L10 | Total Quantum Pseudoanonymization | OTP mapping with QRNG | With key |

### PII Scanning

Automatic detection of personally identifiable information before encryption or anonymization:

- Email addresses, phone numbers, SSNs
- Credit card numbers (Luhn validation)
- IP addresses, dates of birth
- Custom regex pattern support
- Configurable sensitivity thresholds

### Self-Destruct

Secure data destruction following DoD 5220.22-M 3-pass overwrite:

1. Pass 1: Write zeros
2. Pass 2: Write ones
3. Pass 3: Write random data (QRNG when available)
4. Verify destruction

## Use Cases

### Government and Defense

- Classified document protection with quantum-resistant encryption
- HNDL risk mitigation for long-lived secrets
- Secure inter-agency communication channels

### Healthcare

- HIPAA-aligned patient record anonymization
- Clinical trial data de-identification (L5+ anonymization)
- Secure telemedicine data transmission

### Finance

- PCI DSS alignment for payment card data
- Transaction anonymization for analytics
- Quantum-safe key exchange for inter-bank communication

### Data Science

- Privacy-preserving dataset preparation (differential privacy at L8)
- K-anonymity enforcement for research datasets (L9)
- JupyterLab integration with interactive magics and widgets
- Pandas DataFrame encryption and anonymization
