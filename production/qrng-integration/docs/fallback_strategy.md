# QRNG Fallback Strategy for Zipminator

## Executive Summary

This document defines the fallback strategy for entropy generation when hardware QRNG is unavailable. The strategy ensures Zipminator can operate in all deployment scenarios while maintaining security transparency and compliance with CNSA 2.0 requirements.

## Fallback Hierarchy

### Tier 1: Hardware QRNG (Primary)
- **Source**: ID Quantique Quantis (USB/PCIe/Chip)
- **Quality**: Quantum entropy, NIST SP 800-90B certified
- **Min-entropy**: ≥0.9997 bits per bit
- **Certifications**: NIST SP 800-90B, BSI AIS 31, METAS
- **Use Case**: Production deployments, high-assurance environments
- **Status Indicator**: `ENTROPY_SOURCE_QUANTUM`

### Tier 2: OS Cryptographic PRNG (Fallback 1)
- **Linux**: `/dev/urandom` (kernel CSPRNG)
- **Windows**: `CryptGenRandom()` / `BCryptGenRandom()`
- **macOS**: `/dev/urandom` (kernel CSPRNG)
- **Quality**: Cryptographically secure pseudorandom
- **Seeding**: OS-managed entropy pool (interrupt timing, hardware events)
- **Use Case**: Development, testing, environments without QRNG hardware
- **Status Indicator**: `ENTROPY_SOURCE_OS_CSPRNG`

**Security Properties**:
- FIPS 140-2 validated implementations available
- Resistant to prediction attacks when properly seeded
- Continuous reseeding from hardware entropy sources
- Acceptable for CNSA 2.0 compliance (software-only mode)

### Tier 3: Deterministic PRNG (Fallback 2 - Testing Only)
- **Algorithm**: AES-256-CTR-DRBG (NIST SP 800-90A)
- **Seeding**: Fixed test vectors or timestamp-based
- **Quality**: Deterministic, predictable output
- **Use Case**: Unit testing, reproducible test scenarios ONLY
- **Status Indicator**: `ENTROPY_SOURCE_DETERMINISTIC_INSECURE`
- **Warning**: **INSECURE - NOT FOR PRODUCTION USE**

## Failover State Machine

```
┌─────────────────────────────────────────────────────┐
│  INITIALIZATION                                     │
│  ├─ Attempt Hardware QRNG                          │
│  │  ├─ Device Found? → TIER_1_QUANTUM              │
│  │  └─ Not Found → Try Tier 2                      │
│  ├─ Attempt OS CSPRNG                               │
│  │  ├─ Available? → TIER_2_OS_CSPRNG               │
│  │  └─ Failed → Try Tier 3                         │
│  └─ Deterministic PRNG (if enabled)                 │
│     └─ TIER_3_DETERMINISTIC_INSECURE                │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  RUNTIME MONITORING                                 │
│  ├─ TIER_1_QUANTUM                                  │
│  │  ├─ Health Check Pass → Continue                │
│  │  └─ Health Check Fail → Failover to Tier 2      │
│  ├─ TIER_2_OS_CSPRNG                                │
│  │  ├─ OS Entropy Available → Continue             │
│  │  └─ OS Entropy Depleted → Error/Wait            │
│  └─ TIER_3_DETERMINISTIC_INSECURE                   │
│     └─ Log Warning Every Operation                  │
└─────────────────────────────────────────────────────┘
```

## Health Monitoring and Failover

### Hardware QRNG Health Checks

Performed automatically every 1 second (configurable):

1. **Entropy Source Status**
   - Quantum process functional
   - No physical tampering detected
   - Power supply stable

2. **Statistical Tests (NIST SP 800-90B)**
   - Repetition count test
   - Adaptive proportion test
   - Output distribution validation

3. **Device Communication**
   - USB/PCIe connection intact
   - Firmware responding
   - No I/O errors

### Automatic Failover Triggers

Hardware QRNG failover occurs when:
- Health check fails 3 consecutive times
- Device returns error code for read operation
- Timeout exceeded (>5 seconds for single operation)
- Hardware tampering detected
- Entropy quality below threshold (min-entropy < 0.95)

### Failover Actions

1. **Immediate**: Stop using failed entropy source
2. **Log**: Critical security event with timestamp and reason
3. **Alert**: Notify monitoring systems (SNMP, syslog)
4. **Switch**: Transition to next tier in hierarchy
5. **Continue**: Resume operations with fallback source

## Implementation Requirements

### C++ Interface

```cpp
enum class EntropySource {
    QUANTUM,              ///< Tier 1: Hardware QRNG
    OS_CSPRNG,           ///< Tier 2: Operating system CSPRNG
    DETERMINISTIC_INSECURE ///< Tier 3: Deterministic (testing only)
};

struct EntropyStatus {
    EntropySource current_source;
    bool is_secure;              ///< false for Tier 3
    bool hardware_available;
    bool os_csprng_available;
    uint32_t failover_count;
    std::string last_failover_reason;
};

class EntropyManager {
public:
    EntropyStatus get_status();
    size_t get_random_bytes(uint8_t* buffer, size_t length);
    void force_failover();  ///< For testing
    void allow_deterministic(bool enable); ///< Disable Tier 3 in production
};
```

### Rust Interface

```rust
pub enum EntropySource {
    Quantum,              // Tier 1: Hardware QRNG
    OsCsprng,            // Tier 2: Operating system CSPRNG
    DeterministicInsecure // Tier 3: Deterministic (testing only)
}

pub struct EntropyStatus {
    pub current_source: EntropySource,
    pub is_secure: bool,              // false for Tier 3
    pub hardware_available: bool,
    pub os_csprng_available: bool,
    pub failover_count: u32,
    pub last_failover_reason: String,
}

pub trait EntropyManager {
    fn get_status(&self) -> EntropyStatus;
    fn get_random_bytes(&mut self, buffer: &mut [u8]) -> Result<usize>;
    fn force_failover(&mut ());
    fn allow_deterministic(&mut self, enable: bool);
}
```

## Security Implications by Tier

### Tier 1: Hardware QRNG

**Security Level**: HIGHEST

- Information-theoretically unpredictable
- Immune to algorithmic attacks
- Certified entropy source
- Defense against side-channel attacks exploiting weak randomness
- Full CNSA 2.0 compliance with "quantum-safe" designation

**Threat Mitigation**:
- ✅ Lattice attacks on biased nonces (Dilithium)
- ✅ Fault injection attacks exploiting PRNG weaknesses
- ✅ Side-channel attacks correlating key material with RNG state
- ✅ Supply chain attacks targeting PRNG implementations

### Tier 2: OS CSPRNG

**Security Level**: HIGH (Acceptable)

- Cryptographically secure under standard assumptions
- Well-tested, mature implementations
- Suitable for most production use cases
- Meets FIPS 140-2 requirements when using validated implementations

**Residual Risks**:
- ⚠️ Vulnerable if OS entropy pool not properly seeded (low-entropy boot)
- ⚠️ Potential weakness in OS CSPRNG implementation (theoretical)
- ⚠️ No quantum-derived entropy (marketing limitation)

**Threat Mitigation**:
- ✅ Standard cryptographic attacks (with proper seeding)
- ⚠️ Advanced side-channel attacks (same as software PRNG)
- ⚠️ Fault attacks targeting PRNG state

### Tier 3: Deterministic PRNG

**Security Level**: INSECURE (Testing Only)

- Predictable output if seed is known
- Reproducible for test cases
- **MUST NOT** be used in production

**Security Properties**:
- ❌ NOT cryptographically secure
- ❌ Predictable with known seed
- ❌ Vulnerable to all entropy-based attacks
- ❌ Non-compliant with CNSA 2.0
- ❌ Non-compliant with FIPS 203/204

**Use Case**: Unit testing Kyber/Dilithium implementations with known test vectors

## Compliance Considerations

### CNSA 2.0 Requirements

**Hardware QRNG (Tier 1)**:
- ✅ Exceeds all randomness requirements
- ✅ Provides marketing differentiation
- ✅ Suitable for NSS deployments

**OS CSPRNG (Tier 2)**:
- ✅ Meets CNSA 2.0 requirements for software implementations
- ✅ Acceptable when hardware QRNG unavailable
- ⚠️ Must disclose to end users (not quantum entropy)

**Deterministic PRNG (Tier 3)**:
- ❌ NOT CNSA 2.0 compliant
- ❌ MUST be disabled in production builds

### FIPS 140-3 Validation

For Zipminator to achieve FIPS 140-3 certification:

1. **Entropy Source Documentation**:
   - Hardware QRNG: Provide NIST SP 800-90B validation certificates
   - OS CSPRNG: Reference validated OS implementations
   - Tier 3: Must be compile-time disabled for FIPS builds

2. **Self-Tests**:
   - Continuous QRNG health monitoring
   - Startup integrity tests
   - Conditional tests on entropy source transitions

3. **Critical Security Parameters (CSPs)**:
   - All random bytes treated as CSPs
   - Zeroization requirements after use
   - No logging of actual random values

## Configuration and Control

### Compile-Time Configuration

```c++
// Production build (default)
#define ZIPMINATOR_ALLOW_DETERMINISTIC_ENTROPY 0
#define ZIPMINATOR_REQUIRE_HARDWARE_QRNG 0  // Fallback to OS allowed
#define ZIPMINATOR_REQUIRE_QUANTUM_ENTROPY 1 // Fail if neither HW nor OS available

// High-assurance build (NSS deployments)
#define ZIPMINATOR_REQUIRE_HARDWARE_QRNG 1  // No fallback, fail if QRNG missing

// Testing build
#define ZIPMINATOR_ALLOW_DETERMINISTIC_ENTROPY 1
```

### Runtime Configuration

```bash
# Environment variables
export ZIPMINATOR_ENTROPY_SOURCE="auto"  # auto, quantum, os, deterministic
export ZIPMINATOR_QRNG_DEVICE="/dev/quantis0"
export ZIPMINATOR_FAILOVER_ENABLED="true"
export ZIPMINATOR_LOG_ENTROPY_EVENTS="true"
```

### Status Reporting

Applications can query entropy source at runtime:

```cpp
EntropyStatus status = entropy_mgr.get_status();

if (status.current_source == EntropySource::QUANTUM) {
    log_info("Using hardware QRNG - quantum entropy");
} else if (status.current_source == EntropySource::OS_CSPRNG) {
    log_warning("QRNG unavailable - using OS CSPRNG fallback");
} else {
    log_critical("INSECURE: Using deterministic entropy - NOT FOR PRODUCTION");
}
```

## Monitoring and Alerting

### Critical Events

Events that require immediate attention:

1. **QRNG Health Failure**: Hardware device failed health check
2. **Automatic Failover**: Switched from Tier 1 to Tier 2
3. **Tier 3 Active**: Deterministic PRNG in use (should never happen in production)
4. **Entropy Exhaustion**: OS CSPRNG reports insufficient entropy

### Logging Format

```
[TIMESTAMP] [SEVERITY] [COMPONENT:entropy] EVENT_TYPE: <details>

Example:
[2025-10-30T09:45:23Z] [CRITICAL] [entropy] QRNG_HEALTH_FAILURE: Entropy source statistical test failed (repetition count)
[2025-10-30T09:45:23Z] [WARNING] [entropy] FAILOVER_TRIGGERED: Switched to OS_CSPRNG (reason: hardware_health_check_failure)
```

### Metrics

Track and report to monitoring systems:
- `entropy_source_current`: Current tier (1, 2, or 3)
- `entropy_source_quantum_healthy`: Boolean (QRNG health status)
- `entropy_failover_count`: Counter (lifetime failovers)
- `entropy_bytes_generated`: Counter by source
- `entropy_health_check_failures`: Counter

## Testing Strategy

### Unit Tests

1. **Failover Logic**:
   - Mock QRNG device failures
   - Verify automatic transition to Tier 2
   - Verify correct status reporting

2. **Health Check Detection**:
   - Simulate health check failures
   - Verify failover triggers
   - Verify recovery when hardware restored

3. **Deterministic Mode**:
   - Verify reproducible output with fixed seed
   - Verify disabled in production builds

### Integration Tests

1. **End-to-End Kyber Operations**:
   - Generate keys with each entropy tier
   - Verify keys are valid
   - Verify encapsulation/decapsulation succeeds

2. **Failover During Operations**:
   - Trigger QRNG failure mid-operation
   - Verify seamless transition
   - Verify no data corruption

3. **Performance**:
   - Measure latency for each tier
   - Verify failover overhead <1ms

## Recommendations

### Production Deployments

1. **Hardware QRNG Required**:
   - Spec ID Quantique QRNG in BOM
   - Do not rely on OS fallback for production

2. **Monitoring**:
   - Enable real-time alerts for failover events
   - Track entropy source metrics
   - Investigate any Tier 2 usage in production

3. **Compliance**:
   - Document entropy source in security docs
   - Provide customers visibility into entropy tier
   - Maintain audit trail of failover events

### Development and Testing

1. **Use Tier 2 for Development**:
   - OS CSPRNG sufficient for daily development
   - Hardware QRNG optional (cost savings)

2. **Enable Tier 3 for Unit Tests**:
   - Reproducible test cases
   - Known test vectors validation
   - Clearly marked as insecure

3. **CI/CD**:
   - Run tests with all entropy tiers
   - Verify production builds have Tier 3 disabled
   - Performance benchmarks with Tier 1 and Tier 2

## Conclusion

The three-tier fallback strategy ensures Zipminator can operate in all deployment scenarios while maintaining security transparency. Hardware QRNG provides the highest assurance and market differentiation, OS CSPRNG provides practical fallback for software-only deployments, and deterministic PRNG enables testing workflows. Clear status reporting and monitoring ensure operators understand the security posture at all times.

**Key Principle**: Always use the highest-quality entropy source available, and make the current source transparent to operators and security auditors.
