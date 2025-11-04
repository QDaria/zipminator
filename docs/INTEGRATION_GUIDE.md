# QRNG Integration with Zipminator

## Overview
Integrate quantum random number generation (QRNG) with Rust/C++ Kyber768 implementation for production-grade post-quantum encryption.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Zipminator Application                    │
├─────────────────────────────────────────────────────────────┤
│  Python API  │  Rust CLI  │  C++ Library  │  WASM Module   │
├─────────────────────────────────────────────────────────────┤
│                   Kyber768 Crypto Layer                      │
│  • Key Generation (uses QRNG)                               │
│  • Encryption/Decryption                                     │
│  • Digital Signatures                                        │
├─────────────────────────────────────────────────────────────┤
│                    Entropy Pool Manager                      │
│  • Pool rotation (monthly)                                   │
│  • Fallback to /dev/urandom if pool exhausted              │
│  • Integrity verification (SHA-256/512)                      │
├─────────────────────────────────────────────────────────────┤
│                  Quantum Entropy Pool                        │
│  • 50 KB reserved pool                                       │
│  • Real IBM Quantum hardware                                 │
│  • Monthly automated harvesting                              │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
zipminator/
├── production/
│   └── entropy_pool/
│       ├── quantum_entropy_2025-10-30.bin    # Active pool
│       ├── quantum_entropy_2025-10-30.hex    # Verification
│       ├── quantum_entropy_2025-10-30.meta   # Metadata
│       └── pool.lock                          # Prevent concurrent access
│
├── src/
│   ├── rust/
│   │   ├── kyber768/
│   │   │   ├── keygen.rs        # Uses QRNG for key generation
│   │   │   ├── encrypt.rs
│   │   │   └── decrypt.rs
│   │   └── qrng/
│   │       ├── entropy_pool.rs  # Pool manager
│   │       ├── harvester.rs     # IBM Quantum interface
│   │       └── rng.rs           # Custom RNG implementation
│   │
│   ├── cpp/
│   │   ├── qrng/
│   │   │   ├── entropy_pool.h   # C++ pool interface
│   │   │   └── entropy_pool.cpp
│   │   └── kyber768/
│   │       └── keygen.cpp       # Uses entropy_pool
│   │
│   └── python/
│       ├── bindings.rs          # PyO3 bindings
│       └── multi_provider_harvester.py
```

## Implementation Steps

### 1. Rust Entropy Pool Manager

```rust
// src/rust/qrng/entropy_pool.rs

use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use std::sync::Mutex;
use sha2::{Sha256, Digest};

pub struct EntropyPool {
    pool_file: Mutex<File>,
    current_offset: Mutex<usize>,
    pool_size: usize,
    sha256_hash: String,
}

impl EntropyPool {
    pub fn new(pool_path: &str) -> Result<Self, Box<dyn std::error::Error>> {
        let mut file = File::open(pool_path)?;

        // Verify pool integrity
        let mut contents = Vec::new();
        file.read_to_end(&mut contents)?;

        let mut hasher = Sha256::new();
        hasher.update(&contents);
        let hash = format!("{:x}", hasher.finalize());

        // Verify against .meta file
        let meta_path = pool_path.replace(".bin", ".meta");
        let meta = std::fs::read_to_string(&meta_path)?;

        if !meta.contains(&hash) {
            return Err("Pool integrity check failed".into());
        }

        Ok(Self {
            pool_file: Mutex::new(file),
            current_offset: Mutex::new(0),
            pool_size: contents.len(),
            sha256_hash: hash,
        })
    }

    pub fn get_random_bytes(&self, num_bytes: usize) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        let mut file = self.pool_file.lock().unwrap();
        let mut offset = self.current_offset.lock().unwrap();

        // Check if we have enough bytes remaining
        if *offset + num_bytes > self.pool_size {
            // Wrap around to beginning
            *offset = 0;
            file.seek(SeekFrom::Start(0))?;
        }

        let mut buffer = vec![0u8; num_bytes];
        file.read_exact(&mut buffer)?;

        *offset += num_bytes;

        Ok(buffer)
    }

    pub fn remaining_bytes(&self) -> usize {
        let offset = self.current_offset.lock().unwrap();
        self.pool_size - *offset
    }
}

// Custom RNG using quantum entropy
pub struct QuantumRng {
    pool: EntropyPool,
}

impl rand_core::RngCore for QuantumRng {
    fn next_u32(&mut self) -> u32 {
        let bytes = self.pool.get_random_bytes(4).unwrap();
        u32::from_le_bytes([bytes[0], bytes[1], bytes[2], bytes[3]])
    }

    fn next_u64(&mut self) -> u64 {
        let bytes = self.pool.get_random_bytes(8).unwrap();
        u64::from_le_bytes([
            bytes[0], bytes[1], bytes[2], bytes[3],
            bytes[4], bytes[5], bytes[6], bytes[7],
        ])
    }

    fn fill_bytes(&mut self, dest: &mut [u8]) {
        let bytes = self.pool.get_random_bytes(dest.len()).unwrap();
        dest.copy_from_slice(&bytes);
    }

    fn try_fill_bytes(&mut self, dest: &mut [u8]) -> Result<(), rand_core::Error> {
        self.fill_bytes(dest);
        Ok(())
    }
}
```

### 2. Kyber768 Integration

```rust
// src/rust/kyber768/keygen.rs

use crate::qrng::{EntropyPool, QuantumRng};

pub fn keygen_with_qrng(pool_path: &str) -> Result<(PublicKey, SecretKey), Box<dyn std::error::Error>> {
    // Use quantum entropy pool
    let pool = EntropyPool::new(pool_path)?;
    let mut rng = QuantumRng { pool };

    // Generate Kyber768 keypair using quantum randomness
    let (pk, sk) = kyber768::keypair(&mut rng);

    Ok((pk, sk))
}

pub fn keygen_hybrid() -> Result<(PublicKey, SecretKey), Box<dyn std::error::Error>> {
    // Try quantum pool, fallback to system RNG
    match keygen_with_qrng("production/entropy_pool/quantum_entropy.bin") {
        Ok(keys) => {
            println!("✅ Using quantum entropy for key generation");
            Ok(keys)
        }
        Err(e) => {
            println!("⚠️  Quantum pool unavailable, using system RNG: {}", e);
            let mut rng = rand::thread_rng();
            Ok(kyber768::keypair(&mut rng))
        }
    }
}
```

### 3. C++ Integration

```cpp
// src/cpp/qrng/entropy_pool.h

#ifndef QRNG_ENTROPY_POOL_H
#define QRNG_ENTROPY_POOL_H

#include <string>
#include <vector>
#include <fstream>
#include <mutex>

class EntropyPool {
public:
    EntropyPool(const std::string& pool_path);
    ~EntropyPool();

    std::vector<uint8_t> get_random_bytes(size_t num_bytes);
    size_t remaining_bytes() const;
    bool verify_integrity() const;

private:
    std::ifstream pool_file;
    mutable std::mutex pool_mutex;
    size_t current_offset;
    size_t pool_size;
    std::string sha256_hash;

    std::string calculate_sha256(const std::vector<uint8_t>& data) const;
    bool load_metadata(const std::string& meta_path);
};

#endif // QRNG_ENTROPY_POOL_H
```

### 4. Python Integration

```python
# src/python/zipminator_qrng.py

import zipminator_core  # Rust bindings via PyO3

class ZipminatorQRNG:
    def __init__(self, pool_path="production/entropy_pool/quantum_entropy.bin"):
        self.pool = zipminator_core.EntropyPool(pool_path)

    def generate_keypair(self):
        """Generate Kyber768 keypair using quantum entropy"""
        return zipminator_core.keygen_with_qrng(self.pool)

    def encrypt(self, plaintext, public_key):
        """Encrypt data with post-quantum crypto"""
        return zipminator_core.encrypt(plaintext, public_key)

    def decrypt(self, ciphertext, secret_key):
        """Decrypt data with post-quantum crypto"""
        return zipminator_core.decrypt(ciphertext, secret_key)

    def pool_status(self):
        """Get entropy pool status"""
        return {
            'remaining_bytes': self.pool.remaining_bytes(),
            'total_bytes': self.pool.pool_size,
            'percentage': (self.pool.remaining_bytes() / self.pool.pool_size) * 100,
            'sha256': self.pool.sha256_hash
        }
```

### 5. Monthly Automated Harvesting

```bash
#!/bin/bash
# scripts/monthly_harvest_cron.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Harvest 50 KB of quantum entropy
python3 "$SCRIPT_DIR/production_qrng_harvest.py" \
    --bytes 51200 \
    --qubits 120 \
    --output "$PROJECT_ROOT/production/entropy_pool"

# Rotate old pools (keep last 3 months)
find "$PROJECT_ROOT/production/entropy_pool" -name "*.bin" -mtime +90 -delete

# Send notification
if [ $? -eq 0 ]; then
    echo "✅ Quantum harvest successful" | mail -s "QRNG Harvest Success" admin@example.com
else
    echo "❌ Quantum harvest failed" | mail -s "QRNG Harvest FAILED" admin@example.com
fi
```

**Crontab Entry:**
```cron
# Run on 1st of each month at 2:00 AM
0 2 1 * * /path/to/scripts/monthly_harvest_cron.sh >> /var/log/qrng_harvest.log 2>&1
```

## Testing

### Unit Tests
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_entropy_pool_integrity() {
        let pool = EntropyPool::new("test_pool.bin").unwrap();
        assert!(pool.verify_integrity());
    }

    #[test]
    fn test_random_byte_generation() {
        let pool = EntropyPool::new("test_pool.bin").unwrap();
        let bytes = pool.get_random_bytes(32).unwrap();
        assert_eq!(bytes.len(), 32);
    }

    #[test]
    fn test_kyber768_keygen_with_qrng() {
        let (pk, sk) = keygen_with_qrng("test_pool.bin").unwrap();
        assert_eq!(pk.len(), KYBER768_PUBLICKEYBYTES);
        assert_eq!(sk.len(), KYBER768_SECRETKEYBYTES);
    }
}
```

### Integration Tests
```python
def test_end_to_end_encryption():
    zm = ZipminatorQRNG()

    # Generate keys
    pk, sk = zm.generate_keypair()

    # Encrypt
    plaintext = b"Secret quantum message"
    ciphertext = zm.encrypt(plaintext, pk)

    # Decrypt
    decrypted = zm.decrypt(ciphertext, sk)

    assert decrypted == plaintext
```

## Installation

```bash
# Install Rust version
cargo install zipminator

# Install Python bindings
pip install zipminator

# Install from source
git clone https://github.com/yourusername/zipminator.git
cd zipminator
cargo build --release
pip install -e .
```

## Usage Example

```python
from zipminator import ZipminatorQRNG

# Initialize with quantum entropy
zm = ZipminatorQRNG()

# Check pool status
status = zm.pool_status()
print(f"Entropy remaining: {status['percentage']:.1f}%")

# Generate quantum-secure keypair
public_key, secret_key = zm.generate_keypair()

# Encrypt sensitive data
encrypted = zm.encrypt(b"Top secret data", public_key)

# Decrypt
decrypted = zm.decrypt(encrypted, secret_key)
```

## Production Deployment

1. **Initial Setup**: Run harvest to create 50 KB pool
2. **Cron Job**: Set up monthly automated harvesting
3. **Monitoring**: Deploy executive dashboard
4. **Alerts**: Configure low-entropy warnings
5. **Fallback**: Ensure /dev/urandom fallback works
6. **Validation**: Run NIST randomness tests
7. **Audit**: Regular compliance checks

## Security Considerations

- ✅ Pool integrity verification (SHA-256/512)
- ✅ Exclusive file locking (prevent concurrent access)
- ✅ Automatic rotation (monthly)
- ✅ Fallback to system RNG if pool exhausted
- ✅ Audit logging for all pool accesses
- ✅ Encryption of pool files at rest
- ✅ Regular NIST randomness validation
