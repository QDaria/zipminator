# Use Case: Defense and Intelligence

Defense organizations handle classified information with lifespans measured in decades. The quantum threat is not hypothetical for this sector; adversaries are already conducting harvest-now-decrypt-later attacks on intercepted communications. Zipminator provides NIST-standard post-quantum key exchange with true quantum entropy from IBM Quantum hardware.

## The Challenge

Defense-specific requirements include:

- **Classification lifetimes**: TOP SECRET/SCI data must remain protected for 50+ years
- **Adversary capability**: Nation-state adversaries have the resources to build quantum computers first
- **Supply chain security**: Cryptographic implementations must be auditable and free of backdoors
- **Air-gapped networks**: Many defense systems operate without internet connectivity
- **NATO interoperability**: Allied nations must agree on cryptographic standards

NIST's Post-Quantum Cryptography Standardization project selected ML-KEM (Kyber) as the primary KEM standard specifically because of the defense sector's urgency.

## Zipminator Solution

### Quantum-Resistant Key Exchange

Replace classical Diffie-Hellman with Kyber768 for all key negotiations:

```python
from zipminator import keypair, encapsulate, decapsulate

# Unit A generates a keypair (done once, public key distributed)
pk_a, sk_a = keypair()

# Unit B encapsulates a session key using Unit A's public key
ct, session_key = encapsulate(pk_a)

# Unit A decapsulates to recover the session key
recovered = decapsulate(ct, sk_a)

assert session_key == recovered  # 32-byte shared secret
# Use session_key for AES-256-GCM encryption of communications
```

### True Quantum Entropy

For key generation at the highest security level, seed with entropy harvested from IBM Quantum hardware:

```python
from zipminator.crypto.pqc import PQC

# Read 32 bytes of quantum entropy from the pool
seed = open("quantum_entropy/quantum_entropy_pool.bin", "rb").read(32)

pqc = PQC(level=768)
pk, sk = pqc.generate_keypair(seed=seed)
# Key material seeded from 156-qubit Eagle r3 quantum processor
```

The entropy pool is fed by real quantum circuits executed on IBM Fez and Marrakesh processors (156-qubit Eagle r3 family) via qBraid. Each harvest cycle produces ~50KB of raw quantum entropy.

### Air-Gapped Deployment

Zipminator operates fully offline:

```bash
# Set offline mode (no API calls)
export ZIPMINATOR_OFFLINE=1

# Use activation code instead of API key
export ZIPMINATOR_ACTIVATION_CODE="ENTERPRISE-LEVEL10"

# Pre-harvest entropy on a connected system, transfer the pool file
# via approved data diode or removable media
scp quantum_entropy/quantum_entropy_pool.bin airgap:/opt/zipminator/entropy/
```

### Classified Data Handling

For temporary access to classified data, use the self-destruct module:

```python
from zipminator.crypto.self_destruct import SecureDestruct

# Create a self-destructing encrypted container
sd = SecureDestruct(
    file_path="/tmp/classified_briefing.enc",
    ttl_seconds=3600,  # Auto-destruct after 1 hour
    overwrite_passes=3,  # DoD 5220.22-M 3-pass overwrite
)

# After TTL expires or manual trigger:
sd.destroy()
# Pass 1: zeros, Pass 2: ones, Pass 3: random bytes
# Audit log entry created
```

## Security Properties

### Constant-Time Guarantees

All secret-dependent operations in Zipminator's Kyber768 implementation use constant-time primitives:

| Operation | Technique |
|-----------|-----------|
| Key comparison | `subtle::ConstantTimeEq` |
| Secret selection | `subtle::ConditionallySelectable` |
| Conditional subtraction | Arithmetic masking (no branches) |
| NTT multiplication | Montgomery reduction (`#[inline(always)]`) |

These prevent timing side-channel attacks, which are a primary concern in defense environments where adversaries have physical access to hardware.

### NIST KAT Validation

The implementation is validated against NIST's official Known Answer Test vectors:

```bash
cd crates/zipminator-nist && cargo test
# 35 tests against official FIPS 203 KAT vectors
```

### Fuzz Testing

Four cargo-fuzz targets cover the attack surface with millions of randomized inputs:

```bash
cd crates/zipminator-fuzz
cargo fuzz run fuzz_keygen -- -max_total_time=86400  # 24-hour fuzz run
cargo fuzz run fuzz_encapsulate -- -max_total_time=86400
cargo fuzz run fuzz_decapsulate -- -max_total_time=86400
cargo fuzz run fuzz_round_trip -- -max_total_time=86400
```

### Open Source Auditability

The Rust core is open source (Apache-2.0), enabling independent security audits. The codebase enforces:

- `#![forbid(unsafe_code)]` in all non-FFI modules
- `cargo clippy --all-targets -- -D warnings` (zero warnings)
- No external cryptographic dependencies beyond `subtle` (constant-time primitives)

## NIST FIPS 203 Compliance

Zipminator implements the NIST FIPS 203 (ML-KEM-768) algorithm specification. It has **not** undergone FIPS 140-3 module validation (CMVP certification). For deployments requiring FIPS 140-3 validated modules, the Enterprise tier includes a roadmap to CMVP certification.

## Deployment Model

Defense deployments typically require:

- **On-premise / air-gapped** installation with no external dependencies
- **HSM integration** (PKCS#11) for key storage
- **Pre-harvested quantum entropy** transferred via secure channel
- **Source code audit** before deployment
- **Custom integration** with existing COMSEC infrastructure

Contact [mo@qdaria.com](mailto:mo@qdaria.com) for defense and classified program inquiries.
