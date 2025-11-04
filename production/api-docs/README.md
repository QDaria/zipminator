# Zipminator API Documentation

Complete API documentation and integration guides for the Zipminator Post-Quantum Cryptography (PQC) platform.

---

## 📚 Documentation Structure

### Core Documentation

1. **[API Reference](./api_reference.md)** - Complete C API documentation
   - CRYSTALS-Kyber (ML-KEM) key encapsulation
   - CRYSTALS-Dilithium (ML-DSA) digital signatures
   - QRNG management and health monitoring
   - Error handling and initialization
   - Performance benchmarks

2. **[Quick Start Guide](./quickstart.md)** - Get started in minutes
   - Installation (Ubuntu, RHEL, macOS, Docker)
   - Hardware QRNG setup
   - Basic usage examples (C, C++, Python, Rust)
   - Command-line interface
   - Performance tuning

3. **[Security Best Practices](./security_best_practices.md)** - Production deployment
   - Key lifecycle management
   - Side-channel attack mitigation
   - QRNG health monitoring
   - Proper error handling
   - Audit logging

4. **[Compliance Guide](./compliance_guide.md)** - Regulatory compliance
   - NSA CNSA 2.0 compliance
   - FIPS 140-3 validation
   - Common Criteria EAL4+
   - Industry-specific compliance (PCI DSS, HIPAA, GDPR)

---

### Integration Guides (`integration/`)

- **[TLS 1.3 Integration](./integration/tls_integration.md)**
  - Hybrid key exchange (X25519 + Kyber)
  - Dilithium certificate generation
  - OpenSSL engine integration
  - Performance benchmarks

- **[VPN Integration](./integration/vpn_integration.md)**
  - IPSec with IKEv2 + Kyber
  - WireGuard + PQC overlay
  - OpenVPN configuration
  - High-availability setups

- **[SSH Integration](./integration/ssh_integration.md)** (Coming soon)
  - Quantum-safe SSH key exchange
  - Certificate-based authentication
  - Compatibility with OpenSSH

- **[Application Encryption](./integration/application_encryption.md)** (Coming soon)
  - File encryption
  - Database encryption
  - Secure messaging
  - Key management

---

### Code Examples (`examples/`)

- **[example_basic.c](./examples/example_basic.c)** - Fundamental operations
  - Kyber-768 key exchange walkthrough
  - Dilithium-3 signing and verification
  - QRNG health monitoring
  - Performance measurement

- **[example_python_binding.py](./examples/example_python_binding.py)** - Python ctypes
  - Python wrapper for Zipminator C API
  - All major operations demonstrated
  - Error handling examples

- **[example_error_handling.c](./examples/example_error_handling.c)** (Coming soon)
  - Comprehensive error handling patterns
  - Recovery strategies
  - Logging and alerting

- **[example_tls.c](./examples/example_tls.c)** (Coming soon)
  - Full TLS 1.3 client/server
  - Hybrid key exchange
  - Dilithium certificates

- **[example_rust.rs](./examples/example_rust.rs)** (Coming soon)
  - Rust integration
  - Memory-safe wrappers
  - Tokio async support

---

## 🚀 Quick Links

### For Developers

- **Getting Started:** Start with [Quick Start Guide](./quickstart.md)
- **API Details:** See [API Reference](./api_reference.md)
- **Code Examples:** Browse [`examples/`](./examples/)

### For Security Engineers

- **Security:** Read [Security Best Practices](./security_best_practices.md)
- **Compliance:** Review [Compliance Guide](./compliance_guide.md)
- **CNSA 2.0:** See CNSA 2.0 section in [Compliance Guide](./compliance_guide.md#nsa-cnsa-20-compliance)

### For System Integrators

- **TLS:** See [TLS Integration Guide](./integration/tls_integration.md)
- **VPNs:** See [VPN Integration Guide](./integration/vpn_integration.md)
- **Performance:** Check benchmarks in [API Reference](./api_reference.md#performance-benchmarks)

---

## 🔑 Key Features

### NIST-Standardized Algorithms

- **CRYSTALS-Kyber (FIPS 203):** Quantum-resistant key encapsulation
  - Kyber-512 (NIST Level 1): ~128-bit quantum security
  - Kyber-768 (NIST Level 3): ~192-bit quantum security
  - Kyber-1024 (NIST Level 5): ~256-bit quantum security (CNSA 2.0)

- **CRYSTALS-Dilithium (FIPS 204):** Quantum-resistant digital signatures
  - Dilithium-2 (NIST Level 2): ~128-bit quantum security
  - Dilithium-3 (NIST Level 3): ~192-bit quantum security
  - Dilithium-5 (NIST Level 5): ~256-bit quantum security (CNSA 2.0)

### Hardware QRNG Integration

- **True quantum randomness** from photon-based entropy
- **NIST SP 800-90B certified** devices (ID Quantique)
- **Negligible performance overhead** (<0.01ms per operation)
- **Continuous health monitoring** and fault detection
- **Automatic fallback** to system PRNG (configurable)

### High Performance

- **AVX2 optimized** implementations (5-7x faster than reference C)
- **Constant-time operations** (side-channel protected)
- **Thread-safe** API for concurrent use
- **Low latency:** Kyber-768 key exchange in ~0.034ms total

---

## 📋 CNSA 2.0 Compliance

Zipminator is **fully compliant** with NSA's Commercial National Security Algorithm Suite 2.0:

| Requirement | Zipminator Implementation |
|-------------|---------------------------|
| Key Establishment | ML-KEM-1024 (Kyber-1024) |
| Digital Signatures | ML-DSA-87 (Dilithium-5) |
| Entropy Source | Hardware QRNG (NIST SP 800-90B) |
| Side-Channel Protection | Constant-time operations, fault detection |
| Symmetric Encryption | AES-256 (via standard libraries) |
| Hashing | SHA-384/512 (via standard libraries) |

**Timeline:**
- **Jan 1, 2027:** All new NSS acquisitions must be CNSA 2.0 compliant
- **Dec 31, 2031:** Full enforcement for all NSS

See [Compliance Guide](./compliance_guide.md) for details.

---

## 🎯 Performance Benchmarks

**Hardware:** Intel Xeon E5-2686 v4 (AVX2 support)

### Kyber-768 (Recommended for most applications)

| Operation | Time | Throughput |
|-----------|------|------------|
| KeyGen | 0.011 ms | 90,909 ops/sec |
| Encaps | 0.011 ms | 90,909 ops/sec |
| Decaps | 0.012 ms | 83,333 ops/sec |

**Total key exchange:** 0.034 ms (Alice KeyGen + Bob Encaps + Alice Decaps)

### Dilithium-3 (Recommended for most applications)

| Operation | Time | Throughput |
|-----------|------|------------|
| KeyGen | 0.045 ms | 22,222 ops/sec |
| Sign | 0.120 ms | 8,333 ops/sec |
| Verify | 0.045 ms | 22,222 ops/sec |

**Note:** QRNG overhead is <0.01ms per operation (negligible).

See [API Reference](./api_reference.md#performance-benchmarks) for full benchmarks.

---

## 🛠️ Installation

### Ubuntu/Debian

```bash
# Add repository
curl -fsSL https://apt.qdaria.com/gpg.key | sudo apt-key add -
echo "deb https://apt.qdaria.com/ubuntu focal main" | sudo tee /etc/apt/sources.list.d/qdaria.list

# Install
sudo apt-get update
sudo apt-get install libzipminator-dev zipminator-qrng-driver
```

### Build from Source

```bash
git clone https://github.com/qdaria/zipminator.git
cd zipminator
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release -DENABLE_AVX2=ON
make -j$(nproc)
sudo make install
```

See [Quick Start Guide](./quickstart.md) for detailed instructions.

---

## 📖 Basic Usage

### C API

```c
#include <zipminator/kyber768.h>

// Initialize library
zipminator_init(NULL, NULL);

// Alice: Generate key pair
uint8_t alice_pk[1184], alice_sk[2400];
zipminator_kyber768_keygen(alice_pk, alice_sk, NULL);

// Bob: Encapsulate shared secret
uint8_t ciphertext[1088], bob_shared[32];
zipminator_kyber768_encaps(alice_pk, ciphertext, bob_shared, NULL);

// Alice: Decapsulate
uint8_t alice_shared[32];
zipminator_kyber768_decaps(ciphertext, alice_sk, alice_shared, NULL);

// alice_shared == bob_shared (32-byte symmetric key)
```

### Python

```python
from zipminator import Kyber768

# Key exchange
alice_pk, alice_sk = Kyber768.keygen()
ciphertext, bob_shared = Kyber768.encaps(alice_pk)
alice_shared = Kyber768.decaps(ciphertext, alice_sk)

assert alice_shared == bob_shared
```

See [examples/](./examples/) for complete code.

---

## 🔒 Security

### Threat Model

Zipminator defends against:

- **Quantum attacks:** Shor's algorithm cannot break Kyber/Dilithium
- **Classical attacks:** Security levels equivalent to AES-128/192/256
- **Side-channel attacks:** Constant-time implementations, fault protection
- **Weak randomness:** Hardware QRNG provides true quantum entropy

### Best Practices

1. **Always use hardware QRNG** in production (high-assurance deployments)
2. **Enable side-channel protection:** `enable_side_channel_protection = true`
3. **Monitor QRNG health:** Alert on `zipminator_qrng_get_health()` failures
4. **Rotate keys regularly:** Annual for signing, quarterly for encryption
5. **Audit all operations:** Log to SIEM for compliance

See [Security Best Practices](./security_best_practices.md) for details.

---

## 📞 Support

### Resources

- **Documentation:** https://zipminator.qdaria.com/docs
- **GitHub:** https://github.com/qdaria/zipminator
- **Issues:** https://github.com/qdaria/zipminator/issues
- **Community:** https://community.qdaria.com

### Contact

- **General Support:** support@qdaria.com
- **Security Issues:** security@qdaria.com (PGP: https://qdaria.com/security.asc)
- **Sales (Enterprise):** sales@qdaria.com
- **Compliance Questions:** compliance@qdaria.com

---

## 📜 License

Zipminator is available under dual licensing:

- **Open Source:** Apache 2.0 License (for non-commercial use)
- **Commercial:** Contact sales@qdaria.com for enterprise licensing

---

## 🏆 Certifications

- **FIPS 140-3:** In progress (expected Q2 2026)
- **Common Criteria EAL4+:** Planned Q2 2026
- **NIST PQC Standards:** Implements FIPS 203 (ML-KEM) and FIPS 204 (ML-DSA)
- **CNSA 2.0:** Fully compliant

---

## 🗺️ Roadmap

### Current Version (1.0.0)

- ✅ Kyber-512, Kyber-768, Kyber-1024 (FIPS 203)
- ✅ Dilithium-2, Dilithium-3, Dilithium-5 (FIPS 204)
- ✅ Hardware QRNG integration (ID Quantique)
- ✅ AVX2 optimization
- ✅ OpenSSL engine
- ✅ C/C++ API

### Version 1.1.0 (Q1 2026)

- [ ] Falcon signatures (FIPS 206 - expected)
- [ ] SPHINCS+ signatures (FIPS 205)
- [ ] Rust native API
- [ ] Go bindings

### Version 2.0.0 (Q3 2026)

- [ ] FIPS 140-3 validation complete
- [ ] Common Criteria EAL4+ certification
- [ ] Hardware acceleration (FPGA, GPU)
- [ ] Cloud HSM integration (AWS KMS, Azure Key Vault)

---

## 🙏 Acknowledgments

Zipminator builds on the outstanding work of:

- **NIST PQC Team:** For standardizing quantum-resistant cryptography
- **CRYSTALS Team:** Peter Schwabe, Roberto Avanzi, et al. (Kyber/Dilithium algorithms)
- **Open Quantum Safe:** For liboqs and community leadership
- **ID Quantique:** For QRNG hardware and certification support

---

**Last Updated:** October 30, 2025
**Version:** 1.0.0
**Document Status:** Production Ready
