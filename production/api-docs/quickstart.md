# Zipminator Quick Start Guide

Get started with post-quantum cryptography in minutes.

---

## Installation

### Ubuntu/Debian

```bash
# Add Zipminator repository
curl -fsSL https://apt.qdaria.com/gpg.key | sudo apt-key add -
echo "deb https://apt.qdaria.com/ubuntu focal main" | sudo tee /etc/apt/sources.list.d/qdaria.list

# Install development package
sudo apt-get update
sudo apt-get install libzipminator-dev zipminator-qrng-driver

# Verify installation
zipminator-cli --version
```

### RHEL/CentOS/Fedora

```bash
# Add Zipminator repository
sudo dnf config-manager --add-repo https://yum.qdaria.com/zipminator.repo

# Install development package
sudo dnf install libzipminator-devel zipminator-qrng-driver

# Verify installation
zipminator-cli --version
```

### Build from Source

```bash
# Clone repository
git clone https://github.com/qdaria/zipminator.git
cd zipminator

# Install dependencies
sudo apt-get install build-essential cmake libssl-dev

# Build and install
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release -DENABLE_AVX2=ON
make -j$(nproc)
sudo make install
sudo ldconfig

# Run tests
make test
```

### Docker Container

```bash
docker pull qdaria/zipminator:latest
docker run -it --device=/dev/qrng0 qdaria/zipminator bash
```

---

## Hardware QRNG Setup

### Supported Devices

| Vendor | Model | Interface | Throughput |
|--------|-------|-----------|------------|
| ID Quantique | Quantis USB | USB 2.0 | 4 Mbps |
| ID Quantique | Quantis PCIe | PCIe x1 | 240 Mbps |
| ID Quantique | Quantis Chip | I2C/SPI | 6-20 Mbps |

### USB QRNG Setup

```bash
# Load kernel driver
sudo modprobe quantis_usb

# Verify device
lsusb | grep "ID Quantique"
ls -l /dev/qrng0

# Set permissions (development only)
sudo chmod 666 /dev/qrng0

# Production: use udev rules
echo 'KERNEL=="qrng*", MODE="0660", GROUP="qrng"' | sudo tee /etc/udev/rules.d/99-qrng.rules
sudo udevadm control --reload-rules
sudo usermod -aG qrng $USER
```

### Fallback Mode (No QRNG)

```c
zipminator_config_t config = zipminator_get_default_config();
config.entropy_source = ZIPMINATOR_ENTROPY_SYSTEM;  // Use system PRNG
zipminator_init(&config, NULL);
```

**Warning:** System PRNG mode is NOT recommended for production use in high-assurance environments. QRNG provides measurably higher security against side-channel and fault injection attacks.

---

## Basic Usage: Kyber Key Exchange

### C Example

```c
#include <zipminator/kyber768.h>
#include <stdio.h>
#include <string.h>

int main() {
    // Initialize library
    zipminator_config_t config = zipminator_get_default_config();
    zipminator_error_t error;

    if (zipminator_init(&config, &error) != ZIPMINATOR_SUCCESS) {
        fprintf(stderr, "Init failed: %s\n", error.message);
        return 1;
    }

    // Alice: Generate key pair
    uint8_t alice_pk[1184], alice_sk[2400];
    if (zipminator_kyber768_keygen(alice_pk, alice_sk, &error) != ZIPMINATOR_SUCCESS) {
        fprintf(stderr, "KeyGen failed: %s\n", error.message);
        return 1;
    }
    printf("Alice generated key pair\n");

    // Bob: Encapsulate shared secret using Alice's public key
    uint8_t ciphertext[1088], bob_shared_secret[32];
    if (zipminator_kyber768_encaps(alice_pk, ciphertext, bob_shared_secret, &error) != ZIPMINATOR_SUCCESS) {
        fprintf(stderr, "Encaps failed: %s\n", error.message);
        return 1;
    }
    printf("Bob encapsulated shared secret\n");

    // Alice: Decapsulate to recover shared secret
    uint8_t alice_shared_secret[32];
    if (zipminator_kyber768_decaps(ciphertext, alice_sk, alice_shared_secret, &error) != ZIPMINATOR_SUCCESS) {
        fprintf(stderr, "Decaps failed: %s\n", error.message);
        return 1;
    }
    printf("Alice decapsulated shared secret\n");

    // Verify both parties have same shared secret
    if (memcmp(alice_shared_secret, bob_shared_secret, 32) == 0) {
        printf("SUCCESS: Shared secrets match!\n");
        printf("Shared secret: ");
        for (int i = 0; i < 32; i++) {
            printf("%02x", alice_shared_secret[i]);
        }
        printf("\n");
    } else {
        printf("ERROR: Shared secrets do not match!\n");
        return 1;
    }

    zipminator_cleanup();
    return 0;
}
```

**Compile:**
```bash
gcc -o kyber_example kyber_example.c -lzipminator -O3 -march=native
./kyber_example
```

---

## Basic Usage: Dilithium Digital Signatures

### C Example

```c
#include <zipminator/dilithium3.h>
#include <stdio.h>
#include <string.h>

int main() {
    zipminator_config_t config = zipminator_get_default_config();
    zipminator_error_t error;

    if (zipminator_init(&config, &error) != ZIPMINATOR_SUCCESS) {
        fprintf(stderr, "Init failed: %s\n", error.message);
        return 1;
    }

    // Generate signing key pair
    uint8_t public_key[1952], secret_key[4000];
    if (zipminator_dilithium3_keygen(public_key, secret_key, &error) != ZIPMINATOR_SUCCESS) {
        fprintf(stderr, "KeyGen failed: %s\n", error.message);
        return 1;
    }
    printf("Generated Dilithium-3 key pair\n");

    // Message to sign
    const char *message = "CNSA 2.0 compliant post-quantum signature";

    // Sign message
    uint8_t signature[3293];
    size_t sig_len;
    if (zipminator_dilithium3_sign(
            (const uint8_t*)message, strlen(message),
            secret_key, signature, &sig_len, &error) != ZIPMINATOR_SUCCESS) {
        fprintf(stderr, "Sign failed: %s\n", error.message);
        return 1;
    }
    printf("Signed message (%zu bytes)\n", sig_len);

    // Verify signature
    if (zipminator_dilithium3_verify(
            (const uint8_t*)message, strlen(message),
            signature, sig_len, public_key, &error) == ZIPMINATOR_SUCCESS) {
        printf("SUCCESS: Signature is valid!\n");
    } else {
        printf("ERROR: Signature is invalid!\n");
        return 1;
    }

    // Test: Tampered message should fail
    message = "Tampered message";
    if (zipminator_dilithium3_verify(
            (const uint8_t*)message, strlen(message),
            signature, sig_len, public_key, &error) == ZIPMINATOR_SUCCESS) {
        printf("ERROR: Tampered message verified (security failure)!\n");
        return 1;
    } else {
        printf("SUCCESS: Tampered message rejected\n");
    }

    zipminator_cleanup();
    return 0;
}
```

**Compile:**
```bash
gcc -o dilithium_example dilithium_example.c -lzipminator -O3 -march=native
./dilithium_example
```

---

## C++ API (Header-Only Wrapper)

```cpp
#include <zipminator/kyber.hpp>
#include <iostream>
#include <vector>

int main() {
    // RAII initialization
    zipminator::Library lib;

    // Generate keys
    auto [public_key, secret_key] = zipminator::Kyber768::keygen();
    std::cout << "Generated Kyber-768 key pair\n";

    // Encapsulate
    auto [ciphertext, bob_secret] = zipminator::Kyber768::encaps(public_key);

    // Decapsulate
    auto alice_secret = zipminator::Kyber768::decaps(ciphertext, secret_key);

    // Verify
    if (alice_secret == bob_secret) {
        std::cout << "SUCCESS: Shared secrets match!\n";
    }

    return 0;
}
```

**Compile:**
```bash
g++ -std=c++17 -o kyber_cpp kyber_cpp.cpp -lzipminator -O3 -march=native
./kyber_cpp
```

---

## Python Bindings (via ctypes)

### Installation

```bash
pip install zipminator
```

### Example

```python
from zipminator import Kyber768, Dilithium3

# Kyber key exchange
alice_pk, alice_sk = Kyber768.keygen()
ciphertext, bob_shared = Kyber768.encaps(alice_pk)
alice_shared = Kyber768.decaps(ciphertext, alice_sk)

assert alice_shared == bob_shared
print("Kyber key exchange successful!")

# Dilithium signatures
pk, sk = Dilithium3.keygen()
message = b"CNSA 2.0 compliant"
signature = Dilithium3.sign(message, sk)
is_valid = Dilithium3.verify(message, signature, pk)

print(f"Signature valid: {is_valid}")
```

---

## Rust Integration

### Cargo.toml

```toml
[dependencies]
zipminator = "1.0"
```

### Example

```rust
use zipminator::{Kyber768, Dilithium3, ZipminatorError};

fn main() -> Result<(), ZipminatorError> {
    // Initialize library
    zipminator::init_default()?;

    // Kyber key exchange
    let (alice_pk, alice_sk) = Kyber768::keygen()?;
    let (ciphertext, bob_shared) = Kyber768::encaps(&alice_pk)?;
    let alice_shared = Kyber768::decaps(&ciphertext, &alice_sk)?;

    assert_eq!(alice_shared, bob_shared);
    println!("Kyber key exchange successful!");

    // Dilithium signatures
    let (pk, sk) = Dilithium3::keygen()?;
    let message = b"CNSA 2.0 compliant";
    let signature = Dilithium3::sign(message, &sk)?;
    let is_valid = Dilithium3::verify(message, &signature, &pk)?;

    println!("Signature valid: {}", is_valid);

    Ok(())
}
```

---

## Command Line Interface

```bash
# Generate Kyber-768 key pair
zipminator-cli kyber768 keygen --output-public alice.pub --output-secret alice.sec

# Encapsulate shared secret
zipminator-cli kyber768 encaps --public-key alice.pub --output-ciphertext ct.bin --output-secret shared.bin

# Decapsulate shared secret
zipminator-cli kyber768 decaps --ciphertext ct.bin --secret-key alice.sec --output-secret recovered.bin

# Generate Dilithium-3 key pair
zipminator-cli dilithium3 keygen --output-public signer.pub --output-secret signer.sec

# Sign file
zipminator-cli dilithium3 sign --message document.pdf --secret-key signer.sec --output signature.sig

# Verify signature
zipminator-cli dilithium3 verify --message document.pdf --signature signature.sig --public-key signer.pub
```

---

## CNSA 2.0 Compliance Mode

For NSA CNSA 2.0 compliance, use **Kyber-1024** and **Dilithium-5**:

```c
#include <zipminator/kyber1024.h>
#include <zipminator/dilithium5.h>

zipminator_config_t config = {
    .entropy_source = ZIPMINATOR_ENTROPY_QRNG,  // Hardware QRNG required
    .enable_side_channel_protection = true,
    .enable_fault_protection = true,
    .qrng_health_check_interval_ms = 100
};

zipminator_init(&config, NULL);

// Key establishment: ML-KEM-1024
uint8_t pk[1568], sk[3168];
zipminator_kyber1024_keygen(pk, sk, NULL);

// Digital signatures: ML-DSA-87
uint8_t sig_pk[2592], sig_sk[4864];
zipminator_dilithium5_keygen(sig_pk, sig_sk, NULL);
```

---

## Performance Tuning

### Enable AVX2 Acceleration

```bash
# Compile-time
cmake -DENABLE_AVX2=ON -DENABLE_AVX512=OFF

# Runtime detection (automatic)
zipminator-cli info
# Output: AVX2: enabled, AVX512: disabled
```

### Multi-threaded Key Generation

```c
#include <pthread.h>

void* generate_keys(void* arg) {
    uint8_t pk[1184], sk[2400];
    zipminator_kyber768_keygen(pk, sk, NULL);
    // Store keys...
    return NULL;
}

// Spawn 8 threads for batch key generation
pthread_t threads[8];
for (int i = 0; i < 8; i++) {
    pthread_create(&threads[i], NULL, generate_keys, NULL);
}
for (int i = 0; i < 8; i++) {
    pthread_join(threads[i], NULL);
}
```

**Note:** QRNG access is automatically synchronized for thread safety.

---

## QRNG Health Monitoring

```c
#include <zipminator/qrng.h>

zipminator_qrng_health_t health;
if (zipminator_qrng_get_health(&health, NULL) == ZIPMINATOR_SUCCESS) {
    printf("QRNG Status: %s\n", health.is_healthy ? "HEALTHY" : "UNHEALTHY");
    printf("Entropy generated: %lu bits\n", health.entropy_bits_generated);
    printf("Throughput: %.2f Mbps\n", health.throughput_mbps);
    printf("Device: %s\n", health.device_model);

    if (health.health_check_failures > 0) {
        fprintf(stderr, "WARNING: %d health check failures\n",
                health.health_check_failures);
    }
}
```

---

## Error Handling Best Practices

```c
zipminator_error_t error;
uint8_t pk[1184], sk[2400];

int result = zipminator_kyber768_keygen(pk, sk, &error);
if (result != ZIPMINATOR_SUCCESS) {
    // Log error with context
    syslog(LOG_ERR, "Zipminator KeyGen failed: %s (code %d) at %s:%d",
           error.message, error.code, error.file, error.line);

    // Handle specific errors
    switch (error.code) {
        case ZIPMINATOR_ERROR_QRNG_FAILURE:
            // Fallback to system entropy or retry
            zipminator_config_t config = zipminator_get_default_config();
            config.entropy_source = ZIPMINATOR_ENTROPY_SYSTEM;
            zipminator_init(&config, NULL);
            result = zipminator_kyber768_keygen(pk, sk, &error);
            break;

        case ZIPMINATOR_ERROR_MEMORY:
            // Out of memory - log and exit
            fprintf(stderr, "FATAL: Out of memory\n");
            exit(1);

        default:
            // Unknown error - fail safely
            return -1;
    }
}
```

---

## Next Steps

1. **Integration Guides:** See `/production/api-docs/integration/` for:
   - TLS 1.3 hybrid mode integration
   - IPSec/WireGuard VPN integration
   - SSH quantum-safe integration
   - Application-level encryption

2. **Security Best Practices:** Read `/production/api-docs/security_best_practices.md`

3. **Compliance Guide:** Review `/production/api-docs/compliance_guide.md` for CNSA 2.0 and FIPS 140-3

4. **Code Examples:** Explore `/production/api-docs/examples/` for advanced use cases

5. **API Reference:** Full API documentation at `/production/api-docs/api_reference.md`

---

## Support

- **Documentation:** https://zipminator.qdaria.com/docs
- **Community Forum:** https://community.qdaria.com
- **GitHub Issues:** https://github.com/qdaria/zipminator/issues
- **Email Support:** support@qdaria.com (commercial licenses)

**FIPS 140-3 Validation:** In progress
**Common Criteria EAL4+:** Planned Q2 2026
