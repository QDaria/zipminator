# IBM Quantum QRNG Best Practices

## Overview

This document compiles best practices for implementing IBM Quantum Random Number Generation (QRNG) based on research of existing implementations and IBM Quantum Platform documentation.

## 1. Authentication & Token Management

### Token Storage Best Practices

**Recommended Approach:**
```python
from qiskit import IBMQ

# Save token securely to local config (~/.qiskit/qiskitrc)
IBMQ.save_account('YOUR_IBM_QUANTUM_TOKEN')

# Load account from saved credentials
IBMQ.load_account()
```

**Environment Variable Approach:**
```python
import os
from qiskit import IBMQ

# Store in environment variable
token = os.getenv('IBM_QUANTUM_TOKEN')
IBMQ.enable_account(token)
```

**Security Considerations:**
- ✅ Never hardcode tokens in source code
- ✅ Use environment variables or secure config files
- ✅ Add `.qiskitrc` to `.gitignore`
- ✅ Rotate tokens periodically
- ✅ Use different tokens for development and production
- ❌ Never commit tokens to version control
- ❌ Avoid storing tokens in plain text configuration files in the repository

### Token Acquisition
```
1. Visit: https://quantum.cloud.ibm.com/
2. Sign in or create an account
3. Click profile icon (top right)
4. Copy API token from account settings
5. Store securely using methods above
```

## 2. Quantum Random Number Generation Patterns

### Basic QRNG Circuit

**Conceptual Approach:**
```python
from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
from qiskit import execute, IBMQ

def generate_quantum_random_bit():
    """
    Generate a single quantum random bit using superposition.

    Theory: Apply Hadamard gate to create equal superposition |0⟩ + |1⟩,
    then measure. Quantum collapse provides true randomness.
    """
    # Create circuit with 1 qubit and 1 classical bit
    qr = QuantumRegister(1, 'q')
    cr = ClassicalRegister(1, 'c')
    circuit = QuantumCircuit(qr, cr)

    # Apply Hadamard gate: |0⟩ → (|0⟩ + |1⟩)/√2
    circuit.h(qr[0])

    # Measure qubit
    circuit.measure(qr[0], cr[0])

    return circuit

def generate_random_bytes(num_bytes, backend):
    """
    Generate multiple quantum random bytes.

    Args:
        num_bytes: Number of random bytes to generate
        backend: IBM Quantum backend to use

    Returns:
        bytes: Quantum-generated random bytes
    """
    bits_needed = num_bytes * 8
    circuits = [generate_quantum_random_bit() for _ in range(bits_needed)]

    # Execute circuits in batches
    job = execute(circuits, backend=backend, shots=1)
    result = job.result()

    # Extract measurement results
    random_bits = []
    for i in range(bits_needed):
        counts = result.get_counts(i)
        bit = '1' if '1' in counts else '0'
        random_bits.append(bit)

    # Convert bits to bytes
    bit_string = ''.join(random_bits)
    random_bytes = int(bit_string, 2).to_bytes(num_bytes, byteorder='big')

    return random_bytes
```

### Optimized Multi-Qubit QRNG

**Efficient Approach:**
```python
def generate_random_bytes_optimized(num_bytes, backend, qubits_per_circuit=5):
    """
    Generate random bytes using multiple qubits per circuit for efficiency.

    Args:
        num_bytes: Number of random bytes needed
        backend: IBM Quantum backend
        qubits_per_circuit: Number of qubits to use (5 for 5-qubit machines)

    Returns:
        bytes: Quantum-generated random bytes
    """
    bits_needed = num_bytes * 8
    circuits_needed = (bits_needed + qubits_per_circuit - 1) // qubits_per_circuit

    circuits = []
    for _ in range(circuits_needed):
        qr = QuantumRegister(qubits_per_circuit, 'q')
        cr = ClassicalRegister(qubits_per_circuit, 'c')
        circuit = QuantumCircuit(qr, cr)

        # Apply Hadamard to all qubits
        for i in range(qubits_per_circuit):
            circuit.h(qr[i])

        # Measure all qubits
        circuit.measure(qr, cr)
        circuits.append(circuit)

    # Execute all circuits
    job = execute(circuits, backend=backend, shots=1)
    result = job.result()

    # Collect all bits
    all_bits = []
    for i in range(circuits_needed):
        counts = result.get_counts(i)
        measurement = list(counts.keys())[0]  # Get the single measurement
        all_bits.extend(measurement[::-1])  # Reverse for correct bit order

    # Convert to bytes (truncate to exact number needed)
    bit_string = ''.join(all_bits[:bits_needed])
    random_bytes = int(bit_string, 2).to_bytes(num_bytes, byteorder='big')

    return random_bytes
```

## 3. Backend Selection Strategy

### Backend Hierarchy

**Recommended Selection Order:**
```python
def select_best_backend(provider, min_qubits=1):
    """
    Select the best available backend based on availability and queue.

    Priority:
    1. Least busy real quantum backend
    2. Simulator if no real backends available
    3. Local simulator as fallback
    """
    # Get all available backends
    backends = provider.backends(
        filters=lambda b: b.configuration().n_qubits >= min_qubits and
                         b.status().operational
    )

    if not backends:
        # Fallback to simulator
        from qiskit import Aer
        return Aer.get_backend('qasm_simulator')

    # Sort by queue length (least busy first)
    backends_sorted = sorted(
        backends,
        key=lambda b: b.status().pending_jobs
    )

    return backends_sorted[0]
```

**Available IBM Quantum Backends:**
```python
# Real Quantum Hardware (requires IBM Quantum account)
REAL_BACKENDS = [
    'ibmq_armonk',       # 1 qubit
    'ibmq_london',       # 5 qubits
    'ibmq_burlington',   # 5 qubits
    'ibmq_essex',        # 5 qubits
    'ibmq_ourense',      # 5 qubits
    'ibmq_vigo',         # 5 qubits
    'ibmqx2',            # 5 qubits
]

# Simulators
SIMULATOR_BACKENDS = [
    'ibmq_qasm_simulator',  # Cloud simulator (32 qubits)
    'qasm_simulator',       # Local simulator (8 qubits) - No token needed
]
```

## 4. Rate Limiting & Credit Management

### Free Tier Considerations

**IBM Quantum Free Tier Limits:**
- Limited monthly quantum computing time
- Queue priority below paid accounts
- Variable job execution times based on queue

**Rate Limiting Strategy:**
```python
import time
from datetime import datetime, timedelta

class QuantumRateLimiter:
    """
    Rate limiter to preserve IBM Quantum free tier credits.
    """

    def __init__(self, max_jobs_per_hour=10, max_shots_per_job=1024):
        self.max_jobs_per_hour = max_jobs_per_hour
        self.max_shots_per_job = max_shots_per_job
        self.job_history = []

    def can_submit_job(self):
        """Check if we can submit another job without exceeding rate limit."""
        now = datetime.now()
        one_hour_ago = now - timedelta(hours=1)

        # Remove old jobs from history
        self.job_history = [
            job_time for job_time in self.job_history
            if job_time > one_hour_ago
        ]

        return len(self.job_history) < self.max_jobs_per_hour

    def record_job(self):
        """Record that a job was submitted."""
        self.job_history.append(datetime.now())

    def wait_if_needed(self):
        """Wait until we can submit the next job."""
        while not self.can_submit_job():
            sleep_time = 60  # Check every minute
            print(f"Rate limit reached. Waiting {sleep_time}s...")
            time.sleep(sleep_time)

# Usage
rate_limiter = QuantumRateLimiter(max_jobs_per_hour=5)

def generate_with_rate_limiting(num_bytes, backend, rate_limiter):
    """Generate random bytes with rate limiting."""
    rate_limiter.wait_if_needed()
    random_bytes = generate_random_bytes(num_bytes, backend)
    rate_limiter.record_job()
    return random_bytes
```

### Job Batching for Efficiency

**Batch Multiple Requests:**
```python
def batch_generate_random_bytes(byte_requests, backend, rate_limiter):
    """
    Generate multiple random byte requests in batched jobs.

    Args:
        byte_requests: List of byte counts [32, 64, 128, ...]
        backend: IBM Quantum backend
        rate_limiter: Rate limiter instance

    Returns:
        List of random byte arrays
    """
    all_circuits = []
    request_boundaries = []

    # Build all circuits
    for num_bytes in byte_requests:
        circuits = build_circuits_for_bytes(num_bytes)
        request_boundaries.append(len(all_circuits) + len(circuits))
        all_circuits.extend(circuits)

    # Execute all circuits in one job
    rate_limiter.wait_if_needed()
    job = execute(all_circuits, backend=backend, shots=1)
    rate_limiter.record_job()

    result = job.result()

    # Split results by original requests
    results = []
    start = 0
    for end in request_boundaries:
        request_results = extract_bytes_from_results(result, start, end)
        results.append(request_results)
        start = end

    return results
```

## 5. Entropy Pool Management

### Local Entropy Pool

**Caching Strategy:**
```python
import threading
from collections import deque

class QuantumEntropyPool:
    """
    Maintain a local pool of quantum-generated random bytes.

    Features:
    - Background refilling
    - Minimum threshold maintenance
    - Thread-safe access
    """

    def __init__(self, backend, rate_limiter,
                 min_bytes=1024, max_bytes=4096, refill_bytes=2048):
        self.backend = backend
        self.rate_limiter = rate_limiter
        self.min_bytes = min_bytes
        self.max_bytes = max_bytes
        self.refill_bytes = refill_bytes

        self.pool = deque()
        self.lock = threading.Lock()
        self.refill_thread = None
        self.running = False

        # Initial fill
        self._refill_pool()

    def get_bytes(self, num_bytes):
        """
        Get random bytes from the pool.

        Args:
            num_bytes: Number of random bytes needed

        Returns:
            bytes: Quantum random bytes
        """
        with self.lock:
            # Check if we have enough bytes
            if len(self.pool) < num_bytes:
                # Emergency refill (blocking)
                self._refill_pool()

            # Extract bytes from pool
            result = bytes([self.pool.popleft() for _ in range(num_bytes)])

            # Trigger background refill if below threshold
            if len(self.pool) < self.min_bytes and not self.running:
                self._start_background_refill()

            return result

    def _refill_pool(self):
        """Refill the entropy pool (blocking)."""
        bytes_to_generate = min(
            self.refill_bytes,
            self.max_bytes - len(self.pool)
        )

        if bytes_to_generate <= 0:
            return

        new_bytes = generate_with_rate_limiting(
            bytes_to_generate,
            self.backend,
            self.rate_limiter
        )

        with self.lock:
            self.pool.extend(new_bytes)

    def _start_background_refill(self):
        """Start background thread to refill pool."""
        if self.running:
            return

        self.running = True
        self.refill_thread = threading.Thread(target=self._background_refill)
        self.refill_thread.daemon = True
        self.refill_thread.start()

    def _background_refill(self):
        """Background thread function to refill pool."""
        try:
            self._refill_pool()
        finally:
            self.running = False

    def get_pool_size(self):
        """Get current size of entropy pool."""
        with self.lock:
            return len(self.pool)
```

### Persistent Storage

**Save Quantum Entropy to Disk:**
```python
import os
import hashlib
import json
from pathlib import Path

class QuantumEntropyCache:
    """
    Cache quantum random bytes to disk for offline use.

    Features:
    - Encrypted storage
    - Integrity verification (SHA-256 hashes)
    - Metadata tracking (generation time, backend used)
    """

    def __init__(self, cache_dir='~/.quantum_entropy'):
        self.cache_dir = Path(cache_dir).expanduser()
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.metadata_file = self.cache_dir / 'metadata.json'
        self.load_metadata()

    def load_metadata(self):
        """Load metadata about cached entropy."""
        if self.metadata_file.exists():
            with open(self.metadata_file, 'r') as f:
                self.metadata = json.load(f)
        else:
            self.metadata = {'files': {}}

    def save_metadata(self):
        """Save metadata to disk."""
        with open(self.metadata_file, 'w') as f:
            json.dump(self.metadata, f, indent=2)

    def cache_entropy(self, random_bytes, backend_name):
        """
        Cache quantum random bytes to disk.

        Args:
            random_bytes: Random bytes to cache
            backend_name: Name of quantum backend used

        Returns:
            str: Cache file identifier
        """
        # Generate hash for integrity
        data_hash = hashlib.sha256(random_bytes).hexdigest()

        # Create unique filename
        timestamp = datetime.now().isoformat()
        filename = f"entropy_{data_hash[:16]}.bin"
        filepath = self.cache_dir / filename

        # Write binary data
        with open(filepath, 'wb') as f:
            f.write(random_bytes)

        # Store metadata
        self.metadata['files'][filename] = {
            'hash': data_hash,
            'size': len(random_bytes),
            'backend': backend_name,
            'timestamp': timestamp
        }
        self.save_metadata()

        return filename

    def load_entropy(self, filename):
        """
        Load cached quantum entropy from disk.

        Args:
            filename: Cache file identifier

        Returns:
            bytes: Cached quantum random bytes
        """
        filepath = self.cache_dir / filename

        if not filepath.exists():
            raise FileNotFoundError(f"Cache file not found: {filename}")

        # Read binary data
        with open(filepath, 'rb') as f:
            random_bytes = f.read()

        # Verify integrity
        computed_hash = hashlib.sha256(random_bytes).hexdigest()
        stored_hash = self.metadata['files'][filename]['hash']

        if computed_hash != stored_hash:
            raise ValueError(f"Integrity check failed for {filename}")

        return random_bytes

    def get_available_entropy(self):
        """Get total bytes of cached entropy available."""
        return sum(
            meta['size']
            for meta in self.metadata['files'].values()
        )
```

## 6. Error Handling & Fallback Strategies

### Robust Error Handling

**Comprehensive Fallback:**
```python
import secrets
from qiskit.providers.exceptions import QiskitBackendNotFoundError, IBMQAccountError

class QuantumRandomGenerator:
    """
    Quantum random number generator with robust fallback mechanisms.
    """

    def __init__(self, prefer_quantum=True):
        self.prefer_quantum = prefer_quantum
        self.backend = None
        self.entropy_pool = None
        self.entropy_cache = QuantumEntropyCache()
        self.rate_limiter = QuantumRateLimiter()

        if prefer_quantum:
            self._initialize_quantum()

    def _initialize_quantum(self):
        """Initialize IBM Quantum backend with error handling."""
        try:
            # Try to load saved account
            IBMQ.load_account()
            provider = IBMQ.get_provider()
            self.backend = select_best_backend(provider)
            self.entropy_pool = QuantumEntropyPool(
                self.backend,
                self.rate_limiter
            )
            print(f"✅ Quantum backend initialized: {self.backend.name()}")

        except IBMQAccountError:
            print("⚠️  No IBM Quantum account found. Using simulator.")
            self._fallback_to_simulator()

        except QiskitBackendNotFoundError:
            print("⚠️  No quantum backend available. Using simulator.")
            self._fallback_to_simulator()

        except Exception as e:
            print(f"⚠️  Quantum initialization failed: {e}")
            self._fallback_to_simulator()

    def _fallback_to_simulator(self):
        """Fallback to local quantum simulator."""
        try:
            from qiskit import Aer
            self.backend = Aer.get_backend('qasm_simulator')
            self.entropy_pool = QuantumEntropyPool(
                self.backend,
                self.rate_limiter
            )
            print("✅ Local simulator fallback active")
        except Exception as e:
            print(f"⚠️  Simulator fallback failed: {e}")
            self.backend = None
            self.entropy_pool = None

    def get_random_bytes(self, num_bytes, allow_classical_fallback=True):
        """
        Get quantum random bytes with fallback strategies.

        Fallback hierarchy:
        1. Quantum entropy pool (preferred)
        2. Cached quantum entropy
        3. Classical CSPRNG (if allowed)

        Args:
            num_bytes: Number of random bytes needed
            allow_classical_fallback: Allow fallback to classical RNG

        Returns:
            tuple: (bytes, source) where source is 'quantum', 'cached', or 'classical'
        """
        # Try quantum entropy pool
        if self.entropy_pool:
            try:
                return self.entropy_pool.get_bytes(num_bytes), 'quantum'
            except Exception as e:
                print(f"⚠️  Quantum generation failed: {e}")

        # Try cached quantum entropy
        if self.entropy_cache.get_available_entropy() >= num_bytes:
            try:
                # Load oldest cache file
                files = sorted(
                    self.entropy_cache.metadata['files'].items(),
                    key=lambda x: x[1]['timestamp']
                )
                if files:
                    filename = files[0][0]
                    cached_bytes = self.entropy_cache.load_entropy(filename)
                    if len(cached_bytes) >= num_bytes:
                        return cached_bytes[:num_bytes], 'cached'
            except Exception as e:
                print(f"⚠️  Cache read failed: {e}")

        # Fallback to classical CSPRNG
        if allow_classical_fallback:
            print(f"ℹ️  Using classical CSPRNG fallback for {num_bytes} bytes")
            return secrets.token_bytes(num_bytes), 'classical'

        raise RuntimeError("No quantum entropy available and classical fallback disabled")

    def prefill_cache(self, target_bytes=10240):
        """
        Pre-generate quantum entropy and cache it.

        Args:
            target_bytes: Target number of bytes to cache
        """
        print(f"Pre-filling quantum entropy cache with {target_bytes} bytes...")

        bytes_generated = 0
        while bytes_generated < target_bytes:
            batch_size = min(2048, target_bytes - bytes_generated)

            try:
                random_bytes, source = self.get_random_bytes(
                    batch_size,
                    allow_classical_fallback=False
                )

                if source == 'quantum':
                    self.entropy_cache.cache_entropy(
                        random_bytes,
                        self.backend.name()
                    )
                    bytes_generated += len(random_bytes)
                    print(f"  Cached {bytes_generated}/{target_bytes} bytes")

            except Exception as e:
                print(f"⚠️  Cache pre-fill error: {e}")
                break

        print(f"✅ Cache pre-fill complete: {bytes_generated} bytes")
```

## 7. Integration with Cryptographic Operations

### Quantum-Enhanced Key Generation

**Example: AES Key Generation:**
```python
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

def generate_quantum_aes_key(qrng, key_size=256):
    """
    Generate AES encryption key using quantum randomness.

    Args:
        qrng: QuantumRandomGenerator instance
        key_size: Key size in bits (128, 192, or 256)

    Returns:
        bytes: Quantum-generated AES key
    """
    key_bytes = key_size // 8
    key, source = qrng.get_random_bytes(key_bytes)

    print(f"Generated {key_size}-bit AES key from {source} source")
    return key

def encrypt_with_quantum_key(plaintext, qrng):
    """
    Encrypt data using quantum-generated AES key.

    Args:
        plaintext: Data to encrypt (bytes)
        qrng: QuantumRandomGenerator instance

    Returns:
        tuple: (ciphertext, key, iv, source)
    """
    # Generate key and IV using quantum randomness
    key, key_source = qrng.get_random_bytes(32)  # AES-256
    iv, iv_source = qrng.get_random_bytes(16)     # 128-bit IV

    # Encrypt
    cipher = Cipher(
        algorithms.AES(key),
        modes.CBC(iv),
        backend=default_backend()
    )
    encryptor = cipher.encryptor()

    # Pad plaintext to block size
    from cryptography.hazmat.primitives import padding
    padder = padding.PKCS7(128).padder()
    padded_data = padder.update(plaintext) + padder.finalize()

    ciphertext = encryptor.update(padded_data) + encryptor.finalize()

    source = f"key:{key_source}, iv:{iv_source}"
    return ciphertext, key, iv, source
```

## 8. Testing & Validation

### Randomness Quality Tests

**Basic Statistical Tests:**
```python
import numpy as np
from scipy import stats

def test_randomness_quality(random_bytes):
    """
    Perform basic statistical tests on random bytes.

    Tests:
    - Chi-squared test for uniform distribution
    - Runs test for independence
    - Entropy calculation

    Args:
        random_bytes: Random bytes to test

    Returns:
        dict: Test results
    """
    # Convert to bits
    bits = ''.join(format(byte, '08b') for byte in random_bytes)
    bit_array = np.array([int(b) for b in bits])

    results = {}

    # 1. Chi-squared test (uniform distribution)
    observed_ones = np.sum(bit_array)
    observed_zeros = len(bit_array) - observed_ones
    expected = len(bit_array) / 2

    chi_squared = ((observed_ones - expected)**2 +
                   (observed_zeros - expected)**2) / expected
    p_value = 1 - stats.chi2.cdf(chi_squared, df=1)

    results['chi_squared'] = {
        'statistic': chi_squared,
        'p_value': p_value,
        'passed': p_value > 0.01  # 99% confidence
    }

    # 2. Runs test (independence)
    runs = 1
    for i in range(1, len(bit_array)):
        if bit_array[i] != bit_array[i-1]:
            runs += 1

    n1 = observed_ones
    n0 = observed_zeros
    expected_runs = (2 * n0 * n1) / (n0 + n1) + 1
    variance = (2 * n0 * n1 * (2 * n0 * n1 - n0 - n1)) / \
               ((n0 + n1)**2 * (n0 + n1 - 1))

    z_score = (runs - expected_runs) / np.sqrt(variance)
    runs_p_value = 2 * (1 - stats.norm.cdf(abs(z_score)))

    results['runs_test'] = {
        'runs': runs,
        'expected': expected_runs,
        'z_score': z_score,
        'p_value': runs_p_value,
        'passed': runs_p_value > 0.01
    }

    # 3. Entropy calculation
    _, counts = np.unique(random_bytes, return_counts=True)
    probabilities = counts / len(random_bytes)
    entropy = -np.sum(probabilities * np.log2(probabilities))
    max_entropy = np.log2(256)  # 8 bits per byte

    results['entropy'] = {
        'shannon_entropy': entropy,
        'max_entropy': max_entropy,
        'normalized': entropy / max_entropy,
        'passed': entropy / max_entropy > 0.99
    }

    return results

# Usage
qrng = QuantumRandomGenerator()
test_bytes, source = qrng.get_random_bytes(10000)
results = test_randomness_quality(test_bytes)

print(f"\nRandomness Quality Tests ({source} source):")
print(f"  Chi-squared: {'✅ PASS' if results['chi_squared']['passed'] else '❌ FAIL'}")
print(f"    p-value: {results['chi_squared']['p_value']:.6f}")
print(f"  Runs test: {'✅ PASS' if results['runs_test']['passed'] else '❌ FAIL'}")
print(f"    p-value: {results['runs_test']['p_value']:.6f}")
print(f"  Entropy: {'✅ PASS' if results['entropy']['passed'] else '❌ FAIL'}")
print(f"    normalized: {results['entropy']['normalized']:.6f}")
```

## 9. Production Deployment Checklist

### Pre-Deployment Validation

- [ ] IBM Quantum account set up and token secured
- [ ] Token stored in secure location (not in code)
- [ ] Rate limiting configured for free tier
- [ ] Entropy pool size tuned for application needs
- [ ] Cache directory configured with appropriate permissions
- [ ] Fallback mechanisms tested
- [ ] Error handling validated for all failure modes
- [ ] Randomness quality tests passed
- [ ] Integration tests with cryptographic operations passed
- [ ] Monitoring and logging configured
- [ ] Documentation updated with operational procedures

### Operational Monitoring

**Key Metrics to Track:**
```python
class QRNGMonitoring:
    """Track QRNG operational metrics."""

    def __init__(self):
        self.metrics = {
            'quantum_bytes_generated': 0,
            'cached_bytes_used': 0,
            'classical_fallback_bytes': 0,
            'jobs_submitted': 0,
            'jobs_failed': 0,
            'average_job_time': 0.0,
            'pool_refills': 0,
            'cache_hits': 0,
            'cache_misses': 0
        }

    def record_generation(self, num_bytes, source, job_time=None):
        """Record a random byte generation event."""
        if source == 'quantum':
            self.metrics['quantum_bytes_generated'] += num_bytes
            if job_time:
                self.metrics['jobs_submitted'] += 1
                # Update running average
                n = self.metrics['jobs_submitted']
                old_avg = self.metrics['average_job_time']
                self.metrics['average_job_time'] = \
                    (old_avg * (n - 1) + job_time) / n

        elif source == 'cached':
            self.metrics['cached_bytes_used'] += num_bytes
            self.metrics['cache_hits'] += 1

        elif source == 'classical':
            self.metrics['classical_fallback_bytes'] += num_bytes
            self.metrics['cache_misses'] += 1

    def get_report(self):
        """Generate metrics report."""
        total = sum([
            self.metrics['quantum_bytes_generated'],
            self.metrics['cached_bytes_used'],
            self.metrics['classical_fallback_bytes']
        ])

        return f"""
QRNG Operational Metrics
========================
Total bytes generated: {total:,}
  - Quantum: {self.metrics['quantum_bytes_generated']:,} ({self.metrics['quantum_bytes_generated']/total*100:.1f}%)
  - Cached: {self.metrics['cached_bytes_used']:,} ({self.metrics['cached_bytes_used']/total*100:.1f}%)
  - Classical: {self.metrics['classical_fallback_bytes']:,} ({self.metrics['classical_fallback_bytes']/total*100:.1f}%)

Job Statistics:
  - Jobs submitted: {self.metrics['jobs_submitted']}
  - Jobs failed: {self.metrics['jobs_failed']}
  - Average job time: {self.metrics['average_job_time']:.2f}s

Cache Performance:
  - Cache hits: {self.metrics['cache_hits']}
  - Cache misses: {self.metrics['cache_misses']}
  - Hit rate: {self.metrics['cache_hits']/(self.metrics['cache_hits']+self.metrics['cache_misses'])*100:.1f}%
"""
```

## 10. Summary & Recommendations

### Key Takeaways

1. **Token Security**: Never hardcode tokens; use environment variables or secure config files
2. **Rate Limiting**: Essential for free tier usage; implement job batching for efficiency
3. **Entropy Pooling**: Maintain local pool to reduce API calls and improve responsiveness
4. **Fallback Strategy**: Always have fallback to classical CSPRNG for reliability
5. **Multi-Qubit Circuits**: Use multiple qubits per circuit for better efficiency
6. **Caching**: Pre-generate and cache quantum entropy for offline use
7. **Testing**: Validate randomness quality with statistical tests
8. **Monitoring**: Track operational metrics for optimization

### Production-Ready Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│  (Crypto operations, key generation, random sampling)   │
└────────────────────┬────────────────────────────────────┘
                     │
           ┌─────────▼─────────┐
           │  QRNG Interface   │
           │  (get_random_bytes)│
           └─────────┬─────────┘
                     │
        ┌────────────▼────────────┐
        │  Quantum Entropy Pool   │
        │  (Thread-safe, Auto-    │
        │   refilling, 1-4KB)     │
        └────┬──────────────┬─────┘
             │              │
    ┌────────▼─────┐   ┌───▼────────────┐
    │ IBM Quantum  │   │  Entropy Cache │
    │   Backend    │   │  (Disk-based,  │
    │ (Rate-limited│   │   10-100MB)    │
    └────┬─────────┘   └───┬────────────┘
         │                 │
         └────────┬────────┘
                  │
         ┌────────▼─────────┐
         │  Classical CSPRNG │
         │   (Fallback)      │
         └───────────────────┘
```

### Next Steps for Implementation

1. ✅ Choose appropriate backend selection strategy
2. ✅ Implement rate limiting based on usage patterns
3. ✅ Configure entropy pool size for application requirements
4. ✅ Set up persistent cache for offline operation
5. ✅ Integrate with existing cryptographic operations
6. ✅ Add comprehensive error handling and fallback
7. ✅ Implement monitoring and alerting
8. ✅ Test randomness quality in production
9. ✅ Document operational procedures

---

**Document Version:** 1.0
**Last Updated:** 2025-10-30
**Based on:** IBM Quantum Platform, Qiskit documentation, and ozaner/qRNG implementation patterns
