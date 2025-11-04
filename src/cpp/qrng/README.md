# QRNG Integration for Kyber-768

Production-grade Quantum Random Number Generator integration for CRYSTALS-Kyber-768.

## Quick Start

### Build

```bash
# With CMake
mkdir build && cd build
cmake ..
make

# With Make
make -f ../Makefile.qrng all
```

### Test

```bash
make -f ../Makefile.qrng test
```

### Usage Example

```cpp
#include "qrng/entropy_pool.h"
#include "qrng/mock_qrng.h"
#include "kyber768.h"

int main() {
    // Initialize QRNG
    auto qrng = std::make_unique<qrng::MockQRNG>();
    qrng::GlobalEntropyPool::initialize(std::move(qrng));

    // Use Kyber with QRNG
    uint8_t pk[kyber768::KYBER_PUBLICKEYBYTES];
    uint8_t sk[kyber768::KYBER_SECRETKEYBYTES];
    kyber768::crypto_kem_keypair_qrng(pk, sk);

    // Cleanup
    qrng::GlobalEntropyPool::shutdown();
    return 0;
}
```

## Files

### Core Interface
- `qrng_interface.h` - Abstract QRNG interface
- `mock_qrng.h/cpp` - ChaCha20-based CSPRNG for testing
- `entropy_pool.h/cpp` - High-performance buffering layer

### Hardware Drivers
- `id_quantique_usb.h/cpp` - ID Quantique Quantis USB driver (requires libusb-1.0)

### Integration
- `../kyber768_qrng.cpp` - Kyber functions using QRNG
- `../../tests/cpp/test_qrng_integration.cpp` - Comprehensive test suite

### Build System
- `CMakeLists.txt` - CMake configuration
- `../Makefile.qrng` - Makefile configuration

## Features

✅ **True Quantum Entropy**: ID Quantique hardware support
✅ **High Performance**: Sub-microsecond buffered access
✅ **Thread-Safe**: Concurrent consumer support
✅ **Health Monitoring**: NIST SP 800-90B compliance
✅ **Auto-Recovery**: Automatic device failure handling
✅ **Mock Testing**: Deterministic ChaCha20 PRNG
✅ **Statistical Tests**: NIST SP 800-22 subset

## Requirements

- C++17 compiler (GCC 7+, Clang 6+)
- pthreads
- libusb-1.0 (optional, for hardware QRNG)

## Documentation

See `../../../docs/qrng-integration-guide.md` for complete documentation.

## Security

⚠️ **WARNING**: Never use `MockQRNG` in production cryptographic applications!

Always use hardware QRNG (`IDQuantiqueUSB`) for production deployments.

## License

Same as parent project.
