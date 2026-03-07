# Appendix

## Anonymization Glossary

**Differential Privacy**
: A mathematical framework that provides provable privacy guarantees. A mechanism is epsilon-differentially private if the output distribution changes by at most a factor of e^epsilon when any single record is added or removed. Zipminator uses the Laplace mechanism at L8.

**K-Anonymity**
: A property of a dataset where every combination of quasi-identifiers (attributes that could be used for re-identification) appears at least k times. Prevents linkage attacks by ensuring individuals cannot be distinguished from at least k-1 others. Used at L9.

**L-Diversity**
: An extension of k-anonymity that requires each equivalence class to contain at least l distinct values of the sensitive attribute. Prevents homogeneity attacks.

**Laplace Mechanism**
: A differential privacy mechanism that adds noise drawn from the Laplace distribution. The noise scale is calibrated as sensitivity/epsilon, where sensitivity is the maximum change in query output from any single record.

**One-Time Pad (OTP)**
: An encryption technique where each plaintext unit is combined with a random key unit of equal length. Theoretically unbreakable when the key is truly random, used only once, and kept secret. Zipminator's L10 uses QRNG-generated OTP mappings.

**PII (Personally Identifiable Information)**
: Any data that could potentially identify a specific individual. Includes direct identifiers (name, SSN) and quasi-identifiers (age + zipcode combinations).

**PQC (Post-Quantum Cryptography)**
: Cryptographic algorithms designed to resist attacks from both classical and quantum computers. Zipminator uses ML-KEM-768 (Kyber768), standardized as NIST FIPS 203.

**Pseudonymization**
: Replacing identifying fields with artificial identifiers (pseudonyms). Unlike anonymization, pseudonymization is reversible with the mapping key. Used at L4 and L10.

**QRNG (Quantum Random Number Generator)**
: A hardware device or service that generates random numbers using quantum mechanical phenomena (e.g., measurement of superposition states). Provides true randomness, unlike classical PRNGs.

**Quasi-Identifier**
: An attribute that is not a direct identifier but can be combined with other quasi-identifiers to re-identify individuals. Common examples: age, zipcode, gender, date of birth.

**Re-identification**
: The process of matching anonymized records back to specific individuals, typically through linkage attacks using quasi-identifiers or auxiliary data.

---

## FIPS 203 Overview

FIPS 203 (Federal Information Processing Standard 203) specifies the Module-Lattice-Based Key-Encapsulation Mechanism (ML-KEM), derived from the CRYSTALS-Kyber algorithm selected through NIST's Post-Quantum Cryptography Standardization Process.

### ML-KEM Parameter Sets

| Parameter Set | Security Level | Public Key | Secret Key | Ciphertext | Shared Secret |
|--------------|---------------|------------|------------|------------|---------------|
| ML-KEM-512 | NIST Level 1 | 800 bytes | 1632 bytes | 768 bytes | 32 bytes |
| ML-KEM-768 | NIST Level 3 | 1184 bytes | 2400 bytes | 1088 bytes | 32 bytes |
| ML-KEM-1024 | NIST Level 5 | 1568 bytes | 3168 bytes | 1568 bytes | 32 bytes |

Zipminator uses **ML-KEM-768** (NIST Level 3), which provides security roughly equivalent to AES-192. This level is recommended for most applications and is the default choice for government use.

### KEM Operations

1. **KeyGen()**: Generates a public/secret keypair. The public key is shared; the secret key is kept private.
2. **Encaps(pk)**: Takes a public key and produces a ciphertext and a shared secret. The sender transmits the ciphertext.
3. **Decaps(ct, sk)**: Takes the ciphertext and secret key to recover the identical shared secret.

The shared secret is then used as a symmetric key (e.g., for AES-256-GCM) to encrypt the actual data payload.

### Security Basis

ML-KEM's security relies on the hardness of the Module Learning With Errors (MLWE) problem, which is believed to be resistant to both classical and quantum attacks. No known quantum algorithm (including Shor's algorithm) provides a significant speedup for lattice problems.

---

## Norwegian Data Protection Authority (Datatilsynet)

The Norwegian Data Protection Authority (Datatilsynet) enforces the Personal Data Act (Personopplysningsloven), which implements the EU GDPR in Norwegian law. Key considerations for Zipminator deployments in Norway:

### Regulatory Framework

- **Personopplysningsloven (2018)**: Norwegian implementation of GDPR, effective July 20, 2018
- **Datatilsynet**: Independent supervisory authority responsible for enforcement
- **NSM (Nasjonal sikkerhetsmyndighet)**: National Security Authority, relevant for government deployments

### Norwegian-Specific Requirements

**Data Localization**: While GDPR does not mandate data localization within the EEA, Norwegian government entities may have additional requirements under the Security Act (Sikkerhetsloven). Zipminator's on-premises deployment option supports this.

**Schrems II Compliance**: For data transfers outside the EEA, organizations must conduct Transfer Impact Assessments (TIA). Zipminator's L8+ anonymization can render data non-personal under GDPR, eliminating transfer restrictions for anonymized datasets.

**Sector-Specific Rules**:
- **Health**: Helsenormen (health sector security standard) requires encryption for health data in transit and at rest
- **Finance**: Finanstilsynet guidelines require strong encryption for financial data
- **Government**: NSM's Grunnprinsipper for IKT-sikkerhet recommends post-quantum preparedness

### Datatilsynet Contact

- Website: [https://www.datatilsynet.no](https://www.datatilsynet.no)
- Guidance on anonymization: Published anonymization guidelines align with Article 29 Working Party Opinion 05/2014
- Sandbox: Datatilsynet operates a regulatory sandbox for privacy-innovative technologies
