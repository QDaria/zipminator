# Quantum Entropy Pool Storage Specification (QEP v1.0)

## Overview
This specification defines a secure file format for storing quantum random bytes harvested from IBM Quantum hardware for use in post-quantum cryptographic operations (specifically Kyber-768).

## Security Architecture

### Threat Model
- **Adversaries**: Local attackers with read access, network attackers, malware
- **Protected Assets**: Quantum entropy bits, encryption keys, access patterns
- **Security Goals**:
  1. Confidentiality: Entropy protected via AES-256-GCM
  2. Integrity: HMAC-SHA256 prevents tampering
  3. Authenticity: Digital signatures verify source
  4. Non-reuse: Consumed entropy securely deleted

### Cryptographic Primitives
- **Encryption**: AES-256-GCM (AEAD with 96-bit nonce)
- **Integrity**: HMAC-SHA256 (256-bit tag)
- **Key Derivation**: PBKDF2-HMAC-SHA256 (100,000 iterations)
- **Secure Random**: Hardware RNG or `/dev/urandom`

## File Format Specification

### Binary Structure (Little Endian)

```
+-------------------+---------------+----------------------------------+
| Field             | Size (bytes)  | Description                      |
+-------------------+---------------+----------------------------------+
| Magic             | 4             | "QEP1" (0x51455031)              |
| Version           | 1             | Format version (0x01)            |
| Flags             | 1             | Feature flags (bit 0: compressed)|
| Reserved          | 2             | Reserved for future use (0x0000) |
| Timestamp         | 8             | Unix epoch (creation time)       |
| Entropy Source    | 16            | "IBM Quantum\0" (null-padded)    |
| Backend Name      | 32            | e.g., "ibm_sherbrooke" (padded)  |
| Job ID            | 64            | IBM Quantum job ID (padded)      |
| Num Shots         | 4             | Number of quantum shots (uint32) |
| Num Qubits        | 1             | Number of qubits used (uint8)    |
| Bits Per Shot     | 1             | Bits per measurement (uint8)     |
| Total Bytes       | 4             | Total entropy bytes (uint32)     |
| Consumed Bytes    | 4             | Bytes already consumed (uint32)  |
| GCM Nonce         | 12            | AES-GCM nonce (96 bits)          |
| HMAC Tag          | 32            | HMAC-SHA256 of header+ciphertext |
| Auth Tag          | 16            | AES-GCM authentication tag       |
| Encrypted Data    | Variable      | AES-256-GCM encrypted entropy    |
+-------------------+---------------+----------------------------------+
Total Header Size: 202 bytes (before encrypted data)
```

### Field Descriptions

#### Magic (4 bytes)
- Value: `0x51455031` (ASCII "QEP1")
- Purpose: File format identification and corruption detection
- Must be verified before parsing

#### Version (1 byte)
- Current: `0x01`
- Future versions may introduce backward-compatible changes
- Parsers should reject unknown versions

#### Flags (1 byte)
- Bit 0: Compression enabled (0=no, 1=yes)
- Bit 1: Extended metadata present
- Bits 2-7: Reserved (must be 0)

#### Timestamp (8 bytes)
- Unix epoch timestamp (seconds since 1970-01-01 00:00:00 UTC)
- Records when entropy was harvested
- Used for freshness checks and audit logs

#### Entropy Source (16 bytes)
- ASCII string identifying quantum source (null-padded)
- Default: "IBM Quantum"
- Allows future integration with other quantum sources

#### Backend Name (32 bytes)
- IBM Quantum backend identifier (null-padded)
- Examples: "ibm_sherbrooke", "ibm_brisbane"
- Enables backend-specific quality tracking

#### Job ID (64 bytes)
- IBM Quantum job UUID (null-padded)
- Format: "c1234567-89ab-cdef-0123-456789abcdef"
- Enables traceability to quantum hardware execution

#### Num Shots (4 bytes, uint32)
- Number of quantum circuit executions
- Typical range: 1,000 - 100,000 shots
- Higher values improve statistical quality

#### Num Qubits (1 byte, uint8)
- Number of qubits used in quantum circuit
- Typical: 5-10 qubits per shot
- Determines parallelism of entropy generation

#### Bits Per Shot (1 byte, uint8)
- Number of random bits per quantum shot
- Equal to `num_qubits` for standard measurement
- Allows for post-processing optimizations

#### Total Bytes (4 bytes, uint32)
- Total number of entropy bytes in pool
- Maximum: 4,294,967,295 bytes (~4 GB)
- Calculated: `(num_shots * num_qubits) / 8`

#### Consumed Bytes (4 bytes, uint32)
- Number of bytes already consumed from pool
- Updated atomically on each retrieval
- When `consumed == total`, pool is exhausted

#### GCM Nonce (12 bytes)
- AES-GCM initialization vector (96 bits)
- Generated using secure random source
- **MUST NEVER BE REUSED** with same key

#### HMAC Tag (32 bytes)
- HMAC-SHA256 over (header[0:170] || ciphertext)
- Computed after encryption
- Verified before decryption (fail-fast)

#### Auth Tag (16 bytes)
- AES-GCM authentication tag (128 bits)
- Ensures ciphertext integrity and authenticity
- Verified automatically during decryption

#### Encrypted Data (Variable)
- AES-256-GCM ciphertext of raw quantum entropy
- Length: `total_bytes` (before padding)
- Padded to 16-byte AES block boundary

## Key Management

### Master Key Derivation
```
master_key = PBKDF2-HMAC-SHA256(
    password = ENV["QUANTUM_ENTROPY_KEY"],
    salt = b"qdaria-qrng-v1",
    iterations = 100000,
    key_length = 32
)
```

### Derived Keys
```
encryption_key = HKDF-Expand(master_key, info=b"aes-gcm", length=32)
hmac_key = HKDF-Expand(master_key, info=b"hmac-sha256", length=32)
```

### Key Storage Options
1. **Environment Variable** (Development):
   ```bash
   export QUANTUM_ENTROPY_KEY="base64-encoded-256-bit-key"
   ```

2. **Key File** (Production):
   - Path: `/etc/qdaria/quantum_entropy.key`
   - Permissions: `0400` (read-only, owner only)
   - Format: Raw binary (32 bytes)

3. **Hardware Security Module** (Enterprise):
   - Use PKCS#11 interface
   - Keys never leave HSM
   - Audit all key operations

## File Operations

### Creation Workflow
1. Generate secure random GCM nonce (12 bytes)
2. Derive encryption and HMAC keys from master key
3. Encrypt entropy with AES-256-GCM
4. Compute HMAC-SHA256 over (header + ciphertext)
5. Write file with permissions `0600` (owner read/write only)
6. Sync to disk (`fsync()`)
7. Log creation event to audit trail

### Reading Workflow
1. Verify file permissions (must be `0600`)
2. Read and parse header (validate magic and version)
3. Verify HMAC tag (fail if mismatch)
4. Decrypt entropy with AES-GCM (verify auth tag)
5. Return requested bytes
6. Update `consumed_bytes` atomically
7. Overwrite consumed region with zeros
8. Log access event to audit trail

### Secure Deletion
When entropy is consumed:
```c++
// Overwrite consumed bytes with zeros (3-pass secure delete)
for (int pass = 0; pass < 3; pass++) {
    memset(consumed_region, (pass == 0) ? 0x00 : 0xFF, length);
    fsync(fd);
}
```

## Security Considerations

### Access Control
- File permissions: `0600` (owner read/write only)
- Process privileges: Drop to non-root after initialization
- File locking: Use `flock()` for concurrent access

### Entropy Quality Validation
Before storing, verify quantum entropy passes:
1. **NIST SP 800-90B** min-entropy estimation (≥7.9 bits/byte)
2. **Chi-square test** (p-value > 0.01)
3. **Autocorrelation test** (lag-1 correlation < 0.05)
4. **Run test** (consecutive 0s/1s within expected range)

### Rate Limiting
- Maximum retrieval rate: 1 MB/second
- Minimum refill delay: 60 seconds
- Alert if consumption exceeds generation rate

### Audit Logging
Log to `/var/log/qdaria/entropy_pool.log`:
```
2025-10-30T10:30:00Z [INFO] Pool created: 1048576 bytes from ibm_sherbrooke (job: c1234567...)
2025-10-30T10:30:15Z [INFO] Retrieved 1568 bytes (consumed: 1568/1048576)
2025-10-30T10:31:00Z [WARN] Pool low: 10240/1048576 bytes remaining
2025-10-30T10:32:00Z [ALERT] Pool exhausted: initiating refill
```

## Performance Considerations

### Memory-Mapped I/O
For large pools (>10 MB), use `mmap()`:
- Reduces system call overhead
- Enables zero-copy operations
- Allows OS to manage page cache

### Concurrent Access
Use read-write locks:
```c++
pthread_rwlock_t pool_lock;
// Multiple readers allowed
// Single writer for consumption updates
```

### Cache Optimization
Keep hot entropy in L2 cache:
- Typical working set: 64 KB
- Prefetch next cache line during retrieval
- Align pool to page boundary (4 KB)

## Integration Examples

### C++ (Kyber-768)
```cpp
#include "quantum_entropy_pool.h"

QuantumEntropyPool pool("/var/lib/qdaria/entropy.qep");
std::vector<uint8_t> seed = pool.get_bytes(32);  // For Kyber seed
```

### Python (IBM QRNG Harvester)
```python
from quantum_entropy_pool import QuantumEntropyPool

pool = QuantumEntropyPool.create(
    path="entropy.qep",
    entropy_bytes=quantum_bits,
    backend="ibm_sherbrooke",
    job_id=job.job_id()
)
```

### Rust (Production API)
```rust
use quantum_entropy_pool::EntropyPool;

let pool = EntropyPool::open("/var/lib/qdaria/entropy.qep")?;
let seed: [u8; 32] = pool.get_bytes()?;
```

## Compliance and Standards

### NIST Recommendations
- **NIST SP 800-90A**: Entropy source requirements
- **NIST SP 800-90B**: Entropy source validation
- **NIST SP 800-90C**: Entropy source construction

### FIPS 140-3
- Level 2: Software cryptographic module
- Level 3: Physical tamper resistance (future HSM integration)

### Quantum Randomness Certification
- **QRNG Certificate**: Verify entropy from certified quantum source
- **Min-Entropy**: ≥7.9 bits/byte (close to theoretical maximum of 8)

## Version History

### v1.0 (2025-10-30)
- Initial specification
- AES-256-GCM encryption
- HMAC-SHA256 integrity
- IBM Quantum integration
- Secure deletion support

## References
1. NIST SP 800-90A/B/C - Random Number Generation
2. RFC 5869 - HKDF (HMAC-based Key Derivation)
3. RFC 5116 - AEAD Cipher Suites (AES-GCM)
4. Herrero-Collantes & Garcia-Escartin (2017) - Quantum Random Number Generators
5. IBM Quantum Documentation - Qiskit Runtime API
