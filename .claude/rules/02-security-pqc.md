# Security + Post-Quantum Cryptography Rules

## NIST PQC Standards (Final, August 2024)
- FIPS 203 / ML-KEM: Key encapsulation (replaces RSA, ECDH)
- FIPS 204 / ML-DSA: Digital signatures (replaces ECDSA)
- FIPS 205 / SLH-DSA: Hash-based signatures (stateless)
- NIST deprecates RSA/ECC after 2030, disallows after 2035

## Zipminator PQC Implementation Rules
- All new cryptographic operations MUST use NIST PQC algorithms
- Hybrid mode (classical + PQC in parallel) during migration phases
- Key sizes: ML-KEM-768 minimum, ML-KEM-1024 for high-security
- Never hardcode keys or seeds — use hardware-backed key storage
- QRNG entropy for key generation where available
- Log all cryptographic operations for audit trail (DORA Art. 7)

## DORA Compliance Requirements (Norwegian law since 1 July 2025)
- Art. 6.1: Document encryption policies for data at rest, transit, use
- Art. 6.4: Periodic cryptographic updates based on cryptanalysis developments
  → This is the quantum-readiness clause — must be auditable
- Art. 7: Full cryptographic key lifecycle management
- Art. 50: Non-compliance fines up to 2% of global turnover

## Code Security Patterns
```typescript
// NEVER
const key = "hardcoded_secret_key_12345";
const encrypted = crypto.encrypt(data, key);

// ALWAYS
const key = await keyStore.getKey(keyId); // hardware-backed
const encrypted = await pqcEncrypt(data, key, { algorithm: "ML-KEM-768" });
```

## What NOT to put in git
- .env files (any variant)
- Private keys (*.pem, *.key, *.p12)
- API tokens or secrets
- Test credentials
- QRNG seed values

## Dependency Security
- Run `pnpm audit` before any release
- No packages with known crypto vulnerabilities
- Verify liboqs version ≥ 0.10.0 for full NIST PQC support
- Pin cryptographic dependencies with exact versions (no ^ or ~)
