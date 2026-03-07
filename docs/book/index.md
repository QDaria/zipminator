# Zipminator

**Post-Quantum Cryptography Platform for Data Protection**

Zipminator is a comprehensive PQC security platform built on NIST FIPS 203 (ML-KEM-768 / Kyber768). It combines quantum-resistant encryption with quantum random number generation from a 156-qubit IBM quantum processor, a 10-level anonymization system, PII scanning, and self-destruct capabilities.

## Core Capabilities

- **PQC Encryption**: ML-KEM-768 (Kyber768) key encapsulation mechanism, verified against NIST KAT test vectors
- **Quantum Random Number Generation**: Entropy harvested from 156-qubit IBM quantum hardware via qBraid
- **10-Level Anonymization**: From basic regex masking (L1) to total quantum pseudoanonymization (L10)
- **PII Scanning**: Automatic detection and classification of personally identifiable information
- **Self-Destruct**: DoD 5220.22-M 3-pass secure overwrite for sensitive data
- **Compliance Ready**: GDPR, HIPAA, and CCPA alignment with full audit trail

## Platform Components

| Component | Technology | Description |
|-----------|-----------|-------------|
| Crypto Engine | Rust + PyO3 | Kyber768 KEM with constant-time operations |
| Python SDK | Python 3.11 | Anonymizer, scanner, QRNG, CLI |
| Web Dashboard | Next.js 16 | 9-tab monitoring dashboard |
| Desktop Browser | Tauri 2.x | PQC-native browser with built-in VPN |
| Mobile App | Expo React Native | Cross-platform mobile client |
| API | FastAPI | REST backend with PostgreSQL + Redis |
| JupyterLab | Python | Interactive magics and widgets |

## Subscription Tiers

| Feature | Free | Developer | Pro | Enterprise |
|---------|------|-----------|-----|------------|
| Anonymization Levels | L1-L3 | L1-L5 | L1-L7 | L1-L10 |
| PQC Encryption | Basic | Full | Full | Full |
| QRNG Entropy | Simulated | Shared pool | Dedicated pool | Dedicated hardware |
| PII Scanning | 100 rows/day | 10K rows/day | Unlimited | Unlimited |
| Self-Destruct | -- | Single file | Batch | Enterprise policies |
| Audit Trail | -- | -- | 90 days | Unlimited |
| Support | Community | Email | Priority | Dedicated |

## FIPS 203 Compliance

Zipminator implements the NIST FIPS 203 (ML-KEM) algorithm specification. The Rust crypto engine has been verified against official NIST Known Answer Test (KAT) vectors. This is algorithm-level compliance, not FIPS 140-3 module validation (which requires a separate CMVP certification process).

## Getting Started

```{tableofcontents}
```
