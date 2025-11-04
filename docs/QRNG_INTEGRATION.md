# QRNG Integration for Kyber-768

## Overview

This document describes the quantum random number generator (QRNG) integration into the Rust Kyber-768 implementation for the Qdaria QRNG project.

## Architecture

### Component Overview

```
┌─────────────────────────────────────────┐
│         Kyber-768 Operations            │
│  (keygen, encapsulate, decapsulate)     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Entropy Pool                     │
│  • Thread-safe buffering                │
│  • Automatic refilling                  │
│  • Health monitoring                    │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         QRNG Device Trait                │
│  • initialize()                          │
│  • get_random_bytes()                   │
│  • health_check()                       │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ ID Quantique │  │ Mock Device  │
│   (libusb)   │  │  (Testing)   │
└──────────────┘  └──────────────┘
```

### Key Components

#### 1. QrngDevice Trait (`src/qrng/mod.rs`)

Core abstraction for quantum random number generators:

```rust
pub trait QrngDevice: Send + Sync {
    fn initialize(&mut self) -> Result<(), QrngError>;
    fn get_random_bytes(&mut self, buffer: &mut [u8]) -> Result<usize, QrngError>;
    fn health_check(&self) -> Result<HealthStatus, QrngError>;
    fn is_ready(&self) -> bool;
    fn shutdown(&mut self) -> Result<(), QrngError>;
}
```

#### 2. ID Quantique Driver (`src/qrng/id_quantique.rs`)

Production driver for ID Quantique Quantis USB devices:
- USB communication via `libusb`
- Automatic device discovery (VID: 0x0ABA, PID: 0x0101)
- Statistical quality verification
- Error handling and retry logic
- Performance metrics tracking

#### 3. Entropy Pool (`src/qrng/entropy_pool.rs`)

Thread-safe buffering layer:
- Configurable min/max buffer sizes
- Background refilling via worker thread
- Automatic triggering below threshold
- Cross-channel communication (crossbeam)
- Health status monitoring

#### 4. Mock Device (`src/qrng/mock.rs`)

Testing implementation:
- Deterministic pseudo-random generation
- Configurable failure modes
- No hardware dependencies
- Suitable for CI/CD pipelines

## Integration with Kyber-768

### Modified Operations

#### Key Generation

```rust
pub fn keygen(&self) -> Result<(PublicKey, SecretKey), QrngError> {
    const KEYGEN_RANDOM_BYTES: usize = 64;
    let mut random_bytes = vec![0u8; KEYGEN_RANDOM_BYTES];
    self.entropy_pool.get_random_bytes(&mut random_bytes)?;

    let seed = &random_bytes[..32];
    let coins = &random_bytes[32..];
    let (pk, sk) = Kyber768::keygen_from_seed(seed, coins);

    Ok((pk, sk))
}
```

#### Encapsulation

```rust
pub fn encapsulate(&self, public_key: &PublicKey)
    -> Result<(Ciphertext, SharedSecret), QrngError> {
    const ENCAPS_RANDOM_BYTES: usize = 32;
    let mut random_bytes = [0u8; ENCAPS_RANDOM_BYTES];
    self.entropy_pool.get_random_bytes(&mut random_bytes)?;

    let (ct, ss) = Kyber768::encapsulate_with_randomness(public_key, &random_bytes);
    Ok((ct, ss))
}
```

## Configuration

### Entropy Pool Configuration

```rust
pub struct EntropyPoolConfig {
    pub min_bytes: usize,           // Default: 4096 (4KB)
    pub max_bytes: usize,           // Default: 65536 (64KB)
    pub refill_chunk_size: usize,   // Default: 8192 (8KB)
    pub refill_threshold: usize,    // Default: 16384 (16KB)
    pub health_check_interval: Duration, // Default: 60s
}
```

### Usage Example

```rust
use kyber768::{EntropyPool, EntropyPoolConfig, IdQuantiqueDevice, Kyber768Qrng};
use std::sync::Arc;

// Initialize QRNG device
let device = Box::new(IdQuantiqueDevice::new()?);

// Configure entropy pool
let config = EntropyPoolConfig {
    min_bytes: 8192,
    max_bytes: 131072,
    refill_chunk_size: 16384,
    refill_threshold: 32768,
    ..Default::default()
};

// Create entropy pool
let pool = Arc::new(EntropyPool::new(device, config)?);

// Create Kyber with QRNG
let kyber = Kyber768Qrng::new(pool);

// Generate keypair with quantum randomness
let (public_key, secret_key) = kyber.keygen()?;

// Encapsulate with quantum randomness
let (ciphertext, shared_secret) = kyber.encapsulate(&public_key)?;

// Decapsulate (no randomness needed)
let recovered_secret = kyber.decapsulate(&ciphertext, &secret_key);
assert_eq!(shared_secret.as_bytes(), recovered_secret.as_bytes());
```

## Testing

### Mock Device for CI/CD

```rust
use kyber768::{MockQrngDevice, EntropyPool, EntropyPoolConfig};

let device = Box::new(MockQrngDevice::new());
let config = EntropyPoolConfig::default();
let pool = EntropyPool::new(device, config)?;
```

### Statistical Tests

Run comprehensive statistical tests:

```bash
cargo test --test test_qrng -- --nocapture
```

Tests include:
- Bit bias verification
- Runs test for randomness
- Frequency distribution
- Concurrent access validation
- Health monitoring

### Property-Based Tests

With `proptest` feature enabled:

```bash
cargo test --features proptest-tests
```

## Performance Benchmarks

Run benchmarks:

```bash
cargo bench --bench qrng_benchmark
```

Benchmark categories:
- Device initialization overhead
- Random byte generation throughput
- Entropy pool creation time
- Concurrent access performance
- Statistical quality check overhead

## Error Handling

### Error Types

```rust
pub enum QrngError {
    InitializationFailed(String),
    DeviceNotFound,
    ReadError(String),
    UsbError(String),
    InsufficientEntropy,
    HealthCheckFailed(String),
    InvalidBufferSize { expected: usize, actual: usize },
    Timeout(u64),
    StatisticalTestFailed(String),
}
```

### Health Status

```rust
pub enum HealthStatus {
    Healthy,    // Normal operation
    Degraded,   // Functional but with issues
    Failed,     // Device failure
}
```

## Security Considerations

### Statistical Quality

The ID Quantique driver performs real-time statistical checks:
- Bit bias verification (target: 0.5 ± 0.05)
- Minimum entropy rate: 7.9 bits/byte
- Automatic rejection of low-quality data

### Thread Safety

- All QRNG operations are thread-safe (Send + Sync)
- Entropy pool uses mutex-protected buffer
- Worker thread handles refilling asynchronously
- No data races or deadlocks

### Production Recommendations

1. **Always verify device health** before critical operations
2. **Monitor error rates** via statistics
3. **Set appropriate buffer sizes** for your workload
4. **Enable logging** in production (env_logger)
5. **Handle QrngError gracefully** with fallback strategies

## Dependencies

```toml
[dependencies]
libusb = "0.3"          # USB communication
thiserror = "1.0"       # Error handling
log = "0.4"             # Logging
env_logger = "0.11"     # Log configuration
crossbeam = "0.8"       # Thread-safe channels

[dev-dependencies]
proptest = "1.4"        # Property-based testing
criterion = "0.5"       # Benchmarking
```

## Future Enhancements

1. **Additional QRNG Devices**
   - QuantumCTek driver
   - ANU QRNG (network-based)
   - Generic driver interface

2. **Advanced Statistical Tests**
   - NIST SP 800-90B entropy assessment
   - Diehard test suite integration
   - Real-time quality monitoring dashboard

3. **Async Support**
   - Tokio-based async entropy pool
   - Non-blocking device operations
   - Async/await API

4. **Performance Optimizations**
   - SIMD-accelerated statistical checks
   - Zero-copy buffer management
   - Lock-free concurrent access

## References

- [ID Quantique Quantis Documentation](https://www.idquantique.com/random-number-generation/products/quantis-qrng-chip/)
- [NIST SP 800-90B: Recommendation for the Entropy Sources](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-90B.pdf)
- [CRYSTALS-Kyber Specification](https://pq-crystals.org/kyber/)
- [libusb Documentation](https://libusb.info/)

## Support

For issues and questions:
- GitHub: [qdaria-qrng repository]
- Email: support@qdaria.io
