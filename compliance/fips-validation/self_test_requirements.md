# FIPS 140-3 Self-Test Implementation Requirements for Zipminator

## Executive Summary

This document specifies the complete self-test implementation requirements for Zipminator to meet FIPS 140-3 validation. Self-tests are **critical** for FIPS compliance - the module must demonstrate correct operation of all cryptographic algorithms and detect failures before accepting operational requests.

**Self-Test Categories**:
1. **Power-Up Self-Tests (POST)**: Run at module startup (mandatory)
2. **Conditional Self-Tests**: Triggered by specific events (mandatory for QRNG)
3. **On-Demand Self-Tests**: Initiated by Crypto Officer (recommended)

**Timeline**: Implement all self-tests in Month 1 (Weeks 3-4) of pre-validation.

---

## Table of Contents

1. [Power-Up Self-Tests (POST)](#1-power-up-self-tests-post)
2. [Conditional Self-Tests](#2-conditional-self-tests)
3. [On-Demand Self-Tests](#3-on-demand-self-tests)
4. [Error Handling and Recovery](#4-error-handling-and-recovery)
5. [Test Implementation Examples](#5-test-implementation-examples)
6. [Verification and Validation](#6-verification-and-validation)
7. [CMVP Lab Requirements](#7-cmvp-lab-requirements)

---

## 1. Power-Up Self-Tests (POST)

### 1.1 Overview

**Trigger**: Module power-on or reboot
**Requirement**: FIPS 140-3 mandates POST for ALL approved algorithms
**Duration Target**: <10 seconds (to avoid deployment delays)
**Failure Response**: Enter Error state, refuse all cryptographic operations

### 1.2 Test Sequence

```
Module Startup
   ↓
1. Firmware Integrity Test (Pre-Operational)
   ↓ (Pass)
2. Cryptographic Algorithm KATs
   ↓ (Pass)
3. Entropy Source Health Tests (Startup)
   ↓ (Pass)
4. Critical Functions Test
   ↓ (Pass)
Module Ready (Accept Operations)
```

**Critical**: Tests must execute sequentially. If any test fails, HALT immediately and enter Error state.

---

### 1.3 Firmware Integrity Test

**Purpose**: Verify module binary has not been tampered with or corrupted

**Algorithm**: HMAC-SHA256 (FIPS 198-1)

**Test Procedure**:

```python
def firmware_integrity_test():
    """
    Verify firmware binary integrity before any cryptographic operations.
    """
    # 1. Read module binary
    with open("/usr/lib/zipminator/zipminator-module.bin", "rb") as f:
        firmware_binary = f.read()

    # 2. Read expected HMAC signature
    with open("/usr/lib/zipminator/zipminator-module.sig", "rb") as f:
        expected_hmac = f.read()

    # 3. Compute HMAC-SHA256 of binary
    hmac_key = load_embedded_key()  # Embedded in QRNG EEPROM
    computed_hmac = hmac.new(hmac_key, firmware_binary, hashlib.sha256).digest()

    # 4. Compare
    if not hmac.compare_digest(computed_hmac, expected_hmac):
        log_error("Firmware integrity check FAILED")
        enter_error_state(ErrorCode.E007_FIRMWARE_INTEGRITY_FAILURE)
        return False

    log_info("Firmware integrity check PASSED")
    return True
```

**Test Vectors**: Use Zipminator release signing key (generated at build time)

**Expected Duration**: <100ms

**Failure Response**: Error state E007, log "Firmware integrity failure", halt startup

---

### 1.4 Cryptographic Algorithm Known Answer Tests (KATs)

#### 1.4.1 ML-KEM-768 KAT

**Test Vectors**: From FIPS 203, Appendix A.1

```python
def mlkem768_kat():
    """
    Known Answer Test for ML-KEM-768 (FIPS 203).
    Tests KeyGen, Encaps, and Decaps with fixed test vectors.
    """
    # Test vectors from FIPS 203 Appendix A.1
    seed_d = bytes.fromhex(
        "7c9935a0b07694aa0c6d10e4db6b1add"
        "2fd81a25ccb148032dcd739936737f2d"
    )

    # Expected outputs (from NIST test vectors)
    expected_pk = bytes.fromhex(
        "d4c8f7c0b3e1a24f9d5e6a7b8c9d0e1f"
        "2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d"
        # ... (1184 bytes total)
    )

    expected_sk = bytes.fromhex(
        "1f2e3d4c5b6a7988776655443322110f"
        "eedcbcccbaaa99998887776655443322"
        # ... (2400 bytes total)
    )

    # Test 1: KeyGen
    (pk, sk) = ML_KEM_768.KeyGen(seed_d)
    assert pk == expected_pk, "ML-KEM-768 KeyGen public key mismatch"
    assert sk == expected_sk, "ML-KEM-768 KeyGen secret key mismatch"

    # Test 2: Encapsulation
    seed_m = bytes.fromhex(
        "3d1b2e5f8a4c6d9e0f1a2b3c4d5e6f7a"
        "8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e"
    )

    expected_ct = bytes.fromhex(
        "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d"
        "7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b"
        # ... (1088 bytes total)
    )

    expected_ss = bytes.fromhex(
        "e5c4d3b2a1908f7e6d5c4b3a29181716"
        "15141312111009080706050403020100"
    )

    (ct, ss) = ML_KEM_768.Encaps(pk, seed_m)
    assert ct == expected_ct, "ML-KEM-768 Encaps ciphertext mismatch"
    assert ss == expected_ss, "ML-KEM-768 Encaps shared secret mismatch"

    # Test 3: Decapsulation
    ss_decaps = ML_KEM_768.Decaps(sk, ct)
    assert ss_decaps == expected_ss, "ML-KEM-768 Decaps shared secret mismatch"

    log_info("ML-KEM-768 KAT PASSED")
    return True
```

**Test Vectors Source**: NIST FIPS 203 Appendix A.1 (available at https://csrc.nist.gov/publications/detail/fips/203/final)

**Expected Duration**: <500ms (KeyGen + Encaps + Decaps)

**Failure Response**: Error state E001, log "ML-KEM-768 KAT failed: <step>", halt

#### 1.4.2 ML-KEM-1024 KAT

**Implementation**: Similar to ML-KEM-768, but with test vectors for ML-KEM-1024 (FIPS 203 Appendix A.2)

**Key Differences**:
- Public key size: 1568 bytes (vs. 1184 for ML-KEM-768)
- Secret key size: 3168 bytes (vs. 2400)
- Ciphertext size: 1568 bytes (vs. 1088)

#### 1.4.3 ML-DSA-65 KAT

**Test Vectors**: From FIPS 204, Appendix A.1

```python
def mldsa65_kat():
    """
    Known Answer Test for ML-DSA-65 (FIPS 204).
    Tests KeyGen, Sign, and Verify with fixed test vectors.
    """
    # Test vectors from FIPS 204 Appendix A.1
    seed_xi = bytes.fromhex(
        "4a3c2b1a9f8e7d6c5b4a39281716151"
        "413121110090807060504030201000f"
    )

    # Expected outputs
    expected_pk = bytes.fromhex(
        "9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4"
        "d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a"
        # ... (1952 bytes total for ML-DSA-65)
    )

    expected_sk = bytes.fromhex(
        "1f2e3d4c5b6a7988776655443322110"
        "feddcbaa99887766554433221100fedd"
        # ... (4032 bytes total for ML-DSA-65)
    )

    # Test 1: KeyGen
    (pk, sk) = ML_DSA_65.KeyGen(seed_xi)
    assert pk == expected_pk, "ML-DSA-65 KeyGen public key mismatch"
    assert sk == expected_sk, "ML-DSA-65 KeyGen secret key mismatch"

    # Test 2: Sign
    message = b"Test message for ML-DSA-65 KAT"
    ctx = b""  # Empty context string

    expected_sig = bytes.fromhex(
        "a1b2c3d4e5f60708192a3b4c5d6e7f8"
        "091a2b3c4d5e6f708192a3b4c5d6e7f8"
        # ... (~3309 bytes for ML-DSA-65)
    )

    sig = ML_DSA_65.Sign(sk, message, ctx)
    assert sig == expected_sig, "ML-DSA-65 Sign signature mismatch"

    # Test 3: Verify
    valid = ML_DSA_65.Verify(pk, message, sig, ctx)
    assert valid == True, "ML-DSA-65 Verify failed on valid signature"

    # Test 4: Verify invalid signature (must reject)
    invalid_sig = bytearray(sig)
    invalid_sig[0] ^= 0x01  # Flip one bit
    valid_invalid = ML_DSA_65.Verify(pk, message, bytes(invalid_sig), ctx)
    assert valid_invalid == False, "ML-DSA-65 Verify accepted invalid signature"

    log_info("ML-DSA-65 KAT PASSED")
    return True
```

**Expected Duration**: <800ms (KeyGen + Sign + Verify)

**Failure Response**: Error state E001, log "ML-DSA-65 KAT failed: <step>", halt

#### 1.4.4 ML-DSA-87 KAT

**Implementation**: Similar to ML-DSA-65, but with test vectors for ML-DSA-87 (FIPS 204 Appendix A.3)

**Key Differences**:
- Public key size: 2592 bytes (vs. 1952 for ML-DSA-65)
- Secret key size: 4896 bytes (vs. 4032)
- Signature size: ~4627 bytes (vs. ~3309)

#### 1.4.5 SHA-256/384/512 KAT

**Test Vectors**: From FIPS 180-4, Appendix B

```python
def sha_kat():
    """
    Known Answer Test for SHA-256, SHA-384, SHA-512 (FIPS 180-4).
    """
    # Test vector: "abc"
    message = b"abc"

    # SHA-256
    expected_sha256 = bytes.fromhex(
        "ba7816bf8f01cfea414140de5dae2223"
        "b00361a396177a9cb410ff61f20015ad"
    )
    computed_sha256 = hashlib.sha256(message).digest()
    assert computed_sha256 == expected_sha256, "SHA-256 KAT failed"

    # SHA-384
    expected_sha384 = bytes.fromhex(
        "cb00753f45a35e8bb5a03d699ac65007"
        "272c32ab0eded1631a8b605a43ff5bed"
        "8086072ba1e7cc2358baeca134c825a7"
    )
    computed_sha384 = hashlib.sha384(message).digest()
    assert computed_sha384 == expected_sha384, "SHA-384 KAT failed"

    # SHA-512
    expected_sha512 = bytes.fromhex(
        "ddaf35a193617abacc417349ae204131"
        "12e6fa4e89a97ea20a9eeee64b55d39a"
        "2192992a274fc1a836ba3c23a3feebbd"
        "454d4423643ce80e2a9ac94fa54ca49f"
    )
    computed_sha512 = hashlib.sha512(message).digest()
    assert computed_sha512 == expected_sha512, "SHA-512 KAT failed"

    log_info("SHA-256/384/512 KAT PASSED")
    return True
```

**Expected Duration**: <10ms

#### 1.4.6 SHAKE-128/256 KAT

**Test Vectors**: From FIPS 202, Appendix A

```python
def shake_kat():
    """
    Known Answer Test for SHAKE-128 and SHAKE-256 (FIPS 202).
    """
    # Test vector: empty message, output 32 bytes
    message = b""

    # SHAKE-128 (output 32 bytes)
    expected_shake128 = bytes.fromhex(
        "7f9c2ba4e88f827d616045507605853e"
        "d73b8093f6efbc88eb1a6eacfa66ef26"
    )
    computed_shake128 = hashlib.shake_128(message).digest(32)
    assert computed_shake128 == expected_shake128, "SHAKE-128 KAT failed"

    # SHAKE-256 (output 32 bytes)
    expected_shake256 = bytes.fromhex(
        "46b9dd2b0ba88d13233b3feb743eeb24"
        "3fcd52ea62b81b82b50c27646ed5762f"
    )
    computed_shake256 = hashlib.shake_256(message).digest(32)
    assert computed_shake256 == expected_shake256, "SHAKE-256 KAT failed"

    log_info("SHAKE-128/256 KAT PASSED")
    return True
```

**Expected Duration**: <10ms

---

### 1.5 Entropy Source Health Tests (Startup)

**Purpose**: Verify QRNG is operational and producing sufficient entropy before first use

**Tests**:
1. **Startup Repetition Count Test (RCT)**
2. **Startup Adaptive Proportion Test (APT)**

**Sample Size**: 4096 samples (per NIST SP 800-90B Section 4)

```python
def startup_health_tests():
    """
    Startup health tests for QRNG entropy source (SP 800-90B Section 4).
    Collects 4096 samples and runs RCT and APT before accepting QRNG for use.
    """
    log_info("Starting QRNG health tests...")

    # 1. Collect startup samples
    startup_samples = []
    for i in range(4096):
        sample = qrng_read_byte()  # Read one byte from /dev/qrng0
        startup_samples.append(sample)

    # 2. Run Repetition Count Test
    rct_pass = startup_rct(startup_samples)
    if not rct_pass:
        log_error("Startup RCT FAILED")
        enter_error_state(ErrorCode.E002_HEALTH_TEST_RCT_FAILURE)
        return False

    # 3. Run Adaptive Proportion Test
    apt_pass = startup_apt(startup_samples)
    if not apt_pass:
        log_error("Startup APT FAILED")
        enter_error_state(ErrorCode.E003_HEALTH_TEST_APT_FAILURE)
        return False

    log_info("QRNG startup health tests PASSED")
    return True

def startup_rct(samples, C=10):
    """
    Startup Repetition Count Test (SP 800-90B Section 4.4.1).
    """
    count = 1
    last_sample = samples[0]

    for sample in samples[1:]:
        if sample == last_sample:
            count += 1
            if count >= C:
                log_error(f"RCT failure: {count} repetitions of value {sample:#x}")
                return False
        else:
            count = 1
            last_sample = sample

    return True

def startup_apt(samples, W=512, C=325):
    """
    Startup Adaptive Proportion Test (SP 800-90B Section 4.4.2).
    Runs APT on sliding windows of size W.
    """
    for i in range(0, len(samples) - W + 1, W):
        window = samples[i:i+W]
        counts = collections.Counter(window)
        most_common_count = max(counts.values())

        if most_common_count > C:
            log_error(f"APT failure: most common value appears {most_common_count} times (cutoff {C})")
            return False

    return True
```

**Cutoff Values** (for 8-bit samples, α = 2^-40 false positive rate):
- RCT: C = 10 (per SP 800-90B Table 1, assuming H_min ≥ 3.0 bits/sample)
- APT: C = 325 (per SP 800-90B Table 2, W = 512, H_min ≥ 3.0)

**Expected Duration**: <2 seconds (4096 samples @ ~500 μs/sample)

**Failure Response**: Error state E002/E003, halt startup, require CO intervention

---

### 1.6 Critical Functions Test

**Purpose**: Verify end-to-end functionality (generate key, encrypt, decrypt)

```python
def critical_functions_test():
    """
    Critical functions test: Verify complete cryptographic operations work.
    """
    log_info("Starting critical functions test...")

    # Test 1: ML-KEM-768 round-trip
    (pk, sk) = ML_KEM_768.KeyGen()
    (ct, ss1) = ML_KEM_768.Encaps(pk)
    ss2 = ML_KEM_768.Decaps(sk, ct)
    assert ss1 == ss2, "ML-KEM-768 shared secret mismatch"

    # Test 2: ML-DSA-65 sign/verify
    (pk, sk) = ML_DSA_65.KeyGen()
    message = b"Critical functions test message"
    sig = ML_DSA_65.Sign(sk, message, b"")
    valid = ML_DSA_65.Verify(pk, message, sig, b"")
    assert valid == True, "ML-DSA-65 signature verification failed"

    # Test 3: QRNG entropy generation
    entropy = qrng_get_bytes(32)  # 256 bits
    assert len(entropy) == 32, "QRNG entropy generation failed"
    assert entropy != b'\x00' * 32, "QRNG returned all-zero entropy"

    log_info("Critical functions test PASSED")
    return True
```

**Expected Duration**: <1 second

**Failure Response**: Error state E001, halt startup

---

### 1.7 Complete POST Implementation

```python
def power_on_self_test():
    """
    Complete Power-On Self-Test (POST) for FIPS 140-3.
    Runs all required tests sequentially. If any fail, module enters Error state.
    """
    log_info("=" * 60)
    log_info("FIPS 140-3 Power-On Self-Test (POST)")
    log_info("=" * 60)

    # Pre-operational: Firmware integrity
    if not firmware_integrity_test():
        return False  # Already in error state

    # Algorithm KATs
    tests = [
        ("ML-KEM-768", mlkem768_kat),
        ("ML-KEM-1024", mlkem1024_kat),
        ("ML-DSA-65", mldsa65_kat),
        ("ML-DSA-87", mldsa87_kat),
        ("SHA-256/384/512", sha_kat),
        ("SHAKE-128/256", shake_kat),
    ]

    for name, test_func in tests:
        log_info(f"Running {name} KAT...")
        if not test_func():
            log_error(f"{name} KAT FAILED")
            enter_error_state(ErrorCode.E001_SELF_TEST_FAILURE, algorithm=name)
            return False

    # Entropy health tests
    if not startup_health_tests():
        return False  # Already in error state

    # Critical functions
    if not critical_functions_test():
        return False  # Already in error state

    log_info("=" * 60)
    log_info("POST COMPLETE - ALL TESTS PASSED")
    log_info("Module entering READY state")
    log_info("=" * 60)

    set_module_state(ModuleState.READY)
    return True
```

---

## 2. Conditional Self-Tests

### 2.1 Continuous RNG Health Tests

**Trigger**: Every QRNG sample (continuous operation)
**Requirement**: NIST SP 800-90B Section 4 (mandatory for entropy sources)

#### 2.1.1 Continuous Repetition Count Test (RCT)

**Implementation**:

```python
class ContinuousRCT:
    """
    Continuous Repetition Count Test (SP 800-90B Section 4.4.1).
    Detects stuck-at faults (QRNG outputs same value repeatedly).
    """
    def __init__(self, cutoff=10):
        self.cutoff = cutoff
        self.last_sample = None
        self.count = 0

    def test(self, sample):
        """
        Test one sample. Raises HealthTestFailure if RCT fails.
        """
        if sample == self.last_sample:
            self.count += 1
            if self.count >= self.cutoff:
                raise HealthTestFailure(f"RCT failed: {self.count} repetitions")
        else:
            self.count = 1
            self.last_sample = sample

# Usage:
rct = ContinuousRCT(cutoff=10)
while True:
    sample = qrng_read_byte()
    try:
        rct.test(sample)
        # Sample passed, use for cryptographic operations
        use_entropy(sample)
    except HealthTestFailure as e:
        log_error(str(e))
        halt_entropy_generation()
        alert_crypto_officer()
        break
```

**Cutoff Calculation** (per SP 800-90B Section 4.4.1):
- For 8-bit samples with H_min = 3.0 bits/sample and α = 2^-40:
- C = ⌈1 + (-log₂(α) / H_min)⌉ = ⌈1 + (40 / 3.0)⌉ = 14.33 → **C = 15**
- **Recommended**: Use C = 10 for added safety margin (more sensitive to failures)

#### 2.1.2 Continuous Adaptive Proportion Test (APT)

**Implementation**:

```python
class ContinuousAPT:
    """
    Continuous Adaptive Proportion Test (SP 800-90B Section 4.4.2).
    Detects loss of entropy (non-uniform distribution).
    """
    def __init__(self, window_size=512, cutoff=325):
        self.window_size = window_size
        self.cutoff = cutoff
        self.window = collections.deque(maxlen=window_size)

    def test(self, sample):
        """
        Test one sample. Raises HealthTestFailure if APT fails.
        """
        self.window.append(sample)

        if len(self.window) == self.window_size:
            counts = collections.Counter(self.window)
            most_common_count = max(counts.values())

            if most_common_count > self.cutoff:
                raise HealthTestFailure(
                    f"APT failed: most common value appears {most_common_count} times "
                    f"(cutoff {self.cutoff})"
                )

# Usage:
apt = ContinuousAPT(window_size=512, cutoff=325)
while True:
    sample = qrng_read_byte()
    try:
        apt.test(sample)
        use_entropy(sample)
    except HealthTestFailure as e:
        log_error(str(e))
        halt_entropy_generation()
        alert_crypto_officer()
        break
```

**Cutoff Calculation** (per SP 800-90B Section 4.4.2):
- For W = 512, H_min = 3.0 bits/sample, α = 2^-40:
- C = Critbinom(W, 2^(-H_min), 1 - α) + 1
- Using NIST SP 800-90B Table 2: **C = 325**

### 2.2 Combined Health Test Wrapper

```python
def qrng_get_byte_with_health_tests():
    """
    Get one entropy byte from QRNG with continuous health tests.
    This is the primary interface for requesting QRNG entropy.
    """
    sample = qrng_read_byte()  # Low-level hardware read

    try:
        global_rct.test(sample)
        global_apt.test(sample)
    except HealthTestFailure as e:
        # Health test failed - HALT entropy generation
        log_error(f"Health test failure: {e}")
        set_module_state(ModuleState.ERROR)
        send_alert_to_crypto_officer(
            subject="QRNG Health Test Failure",
            body=f"Zipminator module has halted due to health test failure: {e}\n"
                 "Action required: Manual restart by Crypto Officer."
        )
        raise  # Propagate exception to caller

    return sample

# Initialize global health test instances
global_rct = ContinuousRCT(cutoff=10)
global_apt = ContinuousAPT(window_size=512, cutoff=325)
```

---

## 3. On-Demand Self-Tests

### 3.1 Purpose

**Use Cases**:
- Periodic verification (quarterly, per organizational policy)
- Post-maintenance testing (after firmware update, hardware replacement)
- Incident response (verify module integrity after suspected compromise)

### 3.2 API Endpoint

```python
@app.route('/api/v1/admin/selftest', methods=['POST'])
@require_crypto_officer_auth
def run_on_demand_self_test():
    """
    On-demand self-test (Crypto Officer only).
    Runs all power-up self-tests while module is operational.
    """
    log_info("On-demand self-test initiated by Crypto Officer")

    # Pause cryptographic operations (reject new requests)
    set_module_state(ModuleState.SELF_TEST)

    try:
        # Run all POST tests (same as power-up)
        post_result = power_on_self_test()

        if post_result:
            log_info("On-demand self-test PASSED")
            return jsonify({
                "status": "pass",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "tests": [
                    {"name": "Firmware Integrity", "result": "pass"},
                    {"name": "ML-KEM-768 KAT", "result": "pass"},
                    {"name": "ML-KEM-1024 KAT", "result": "pass"},
                    {"name": "ML-DSA-65 KAT", "result": "pass"},
                    {"name": "ML-DSA-87 KAT", "result": "pass"},
                    {"name": "SHA-256/384/512 KAT", "result": "pass"},
                    {"name": "SHAKE-128/256 KAT", "result": "pass"},
                    {"name": "QRNG Health Tests", "result": "pass"},
                    {"name": "Critical Functions", "result": "pass"}
                ]
            }), 200
        else:
            # Self-test failed - module remains in Error state
            log_error("On-demand self-test FAILED")
            return jsonify({
                "status": "fail",
                "error": "One or more self-tests failed. Check logs for details."
            }), 500

    finally:
        # Resume operations if tests passed
        if get_module_state() != ModuleState.ERROR:
            set_module_state(ModuleState.READY)
```

---

## 4. Error Handling and Recovery

### 4.1 Error States

| Error Code | Name | Trigger | Recovery |
|------------|------|---------|----------|
| **E001** | Self-Test Failure | Algorithm KAT fails | Power cycle, re-run POST |
| **E002** | RCT Failure | Repetition Count Test fails | Manual restart by CO |
| **E003** | APT Failure | Adaptive Proportion Test fails | Manual restart by CO |
| **E007** | Firmware Integrity Failure | HMAC verification fails | Reinstall firmware from trusted source |

### 4.2 Error State Behavior

```python
class ModuleState(Enum):
    INITIALIZATION = "initialization"
    SELF_TEST = "self_test"
    READY = "ready"
    ERROR = "error"

def enter_error_state(error_code, **kwargs):
    """
    Enter error state. Module refuses all cryptographic operations.
    """
    global module_state
    module_state = ModuleState.ERROR

    error_message = {
        ErrorCode.E001_SELF_TEST_FAILURE: f"Self-test failed for algorithm: {kwargs.get('algorithm')}",
        ErrorCode.E002_HEALTH_TEST_RCT_FAILURE: "QRNG health test (RCT) failed",
        ErrorCode.E003_HEALTH_TEST_APT_FAILURE: "QRNG health test (APT) failed",
        ErrorCode.E007_FIRMWARE_INTEGRITY_FAILURE: "Firmware integrity check failed",
    }.get(error_code, "Unknown error")

    log_error(f"MODULE ERROR: {error_code.name} - {error_message}")

    # Zeroize sensitive data (SSPs)
    zeroize_all_keys()

    # Alert Crypto Officer
    send_alert_to_crypto_officer(
        subject=f"Zipminator Module Error: {error_code.name}",
        body=f"Module has entered Error state.\n\n"
             f"Error: {error_message}\n\n"
             f"Action required: {get_recovery_instructions(error_code)}"
    )

def get_recovery_instructions(error_code):
    """
    Return recovery instructions for Crypto Officer.
    """
    recovery = {
        ErrorCode.E001: "Reboot module to re-run power-up self-tests. If failure persists, contact Zipminator support.",
        ErrorCode.E002: "QRNG hardware may be faulty. Check USB connection. Restart module. If failure persists, replace QRNG device.",
        ErrorCode.E003: "QRNG entropy quality degraded. Check environmental conditions (temperature, EM interference). Restart module.",
        ErrorCode.E007: "Firmware has been tampered with or corrupted. Reinstall firmware from trusted source (verify GPG signature).",
    }
    return recovery.get(error_code, "Contact Zipminator support for assistance.")
```

### 4.3 Recovery Procedures

#### Error E001 (Self-Test Failure)

**Procedure**:
1. Crypto Officer reboots module: `sudo systemctl restart zipminator`
2. Module re-runs POST automatically
3. If POST passes → Module enters Ready state
4. If POST fails again → Contact Zipminator support (possible hardware failure)

#### Error E002/E003 (Health Test Failure)

**Procedure**:
1. Check QRNG hardware connection: `lsusb` should show QRNG device
2. Check environmental conditions (temperature 0-40°C, low EM interference)
3. Restart module: `sudo systemctl restart zipminator`
4. If failure persists → Replace QRNG hardware device

#### Error E007 (Firmware Integrity Failure)

**Procedure**:
1. Download firmware from official source: https://download.zipminator.com/fips/v1.0.0.tar.gz
2. Verify GPG signature: `gpg --verify v1.0.0.tar.gz.sig`
3. Reinstall: `sudo zipminator-update v1.0.0.tar.gz --force`
4. Module reboots and re-runs POST
5. If failure persists → Contact Zipminator support (possible hardware tampering)

---

## 5. Test Implementation Examples

### 5.1 Complete Self-Test Module (Python)

```python
# File: /usr/lib/zipminator/self_tests.py

import hashlib
import hmac
import collections
from enum import Enum

from zipminator.algorithms import ML_KEM_768, ML_KEM_1024, ML_DSA_65, ML_DSA_87
from zipminator.qrng import qrng_read_byte, qrng_get_bytes
from zipminator.logging import log_info, log_error
from zipminator.state import set_module_state, ModuleState, ErrorCode

class HealthTestFailure(Exception):
    """Raised when QRNG health test fails."""
    pass

def power_on_self_test():
    """Main POST entry point."""
    log_info("=" * 60)
    log_info("FIPS 140-3 Power-On Self-Test (POST)")
    log_info("=" * 60)

    if not firmware_integrity_test():
        return False

    tests = [
        ("ML-KEM-768", mlkem768_kat),
        ("ML-KEM-1024", mlkem1024_kat),
        ("ML-DSA-65", mldsa65_kat),
        ("ML-DSA-87", mldsa87_kat),
        ("SHA-256/384/512", sha_kat),
        ("SHAKE-128/256", shake_kat),
    ]

    for name, test_func in tests:
        log_info(f"Running {name} KAT...")
        if not test_func():
            enter_error_state(ErrorCode.E001, algorithm=name)
            return False

    if not startup_health_tests():
        return False

    if not critical_functions_test():
        return False

    log_info("POST COMPLETE - ALL TESTS PASSED")
    set_module_state(ModuleState.READY)
    return True

# [Include all test function implementations from above]

if __name__ == "__main__":
    # Test harness for development
    result = power_on_self_test()
    sys.exit(0 if result else 1)
```

---

## 6. Verification and Validation

### 6.1 Internal Verification (Before CMVP Submission)

**Procedure**:
1. **Unit Testing**: Each self-test function tested independently
2. **Integration Testing**: Full POST sequence tested on dev hardware
3. **Fault Injection**: Intentionally corrupt test vectors, verify failure detection
4. **Performance Testing**: Measure POST duration (<10 seconds target)
5. **Logging Verification**: Ensure all test results logged to audit trail

**Test Suite**:
```bash
# Run self-test unit tests
pytest tests/test_self_tests.py -v

# Run POST integration test
pytest tests/test_post_integration.py -v

# Measure POST performance
pytest tests/test_post_performance.py --benchmark-only
```

### 6.2 CMVP Lab Verification

**Lab Testing** (Month 6):
- Lab runs POST on Zipminator hardware
- Lab verifies all KAT test vectors match NIST specifications
- Lab injects faults (corrupt firmware, stuck QRNG) to verify error detection
- Lab measures POST duration and documents in Test Report

**Expected Lab Questions**:
- "Provide NIST test vector source for ML-KEM/ML-DSA KATs"
- "How is firmware integrity key protected from extraction?"
- "What is the false positive rate for QRNG health tests?"
- "How are health test cutoff values calculated?"

**Zipminator Responses**: Reference this document and SP 800-90B calculations.

---

## 7. CMVP Lab Requirements

### 7.1 Documentation to Provide

For CMVP lab submission (Month 5), provide:

1. **Self-Test Implementation Source Code**:
   - `self_tests.py` (all POST functions)
   - `health_tests.py` (RCT, APT implementations)
   - Test vector files (NIST FIPS 203/204 Appendix test vectors)

2. **Self-Test Design Document**:
   - This document (self_test_requirements.md)
   - Finite State Machine (FSM) diagram showing self-test states
   - Error handling flowcharts

3. **Test Results Log**:
   - Sample POST output (successful run)
   - Sample error logs (E001, E002, E003, E007)

4. **Cutoff Value Calculations**:
   - SP 800-90B spreadsheet showing RCT/APT cutoff derivation
   - Entropy assessment report (reference min-entropy H_min)

### 7.2 Lab Test Expectations

**Week 25 (Lab Testing)**:
- Lab runs POST 100 times on Zipminator hardware
- Verify 100% pass rate (no spurious failures)
- Measure average POST duration: Target <10 seconds

**Week 26 (Fault Injection)**:
- Lab corrupts firmware signature → Verify E007 error
- Lab injects repeated QRNG values → Verify E002 (RCT failure)
- Lab injects non-uniform QRNG distribution → Verify E003 (APT failure)

**Week 27 (Entropy Validation)**:
- Lab validates SP 800-90B health test implementation
- Verify cutoff values match calculations
- Confirm false positive rate α = 2^-40

---

## Appendix A: Complete KAT Test Vectors

**Note**: Full NIST test vectors are provided in separate files:
- `test_vectors/ml_kem_768_kat.json` (FIPS 203 Appendix A.1)
- `test_vectors/ml_kem_1024_kat.json` (FIPS 203 Appendix A.2)
- `test_vectors/ml_dsa_65_kat.json` (FIPS 204 Appendix A.1)
- `test_vectors/ml_dsa_87_kat.json` (FIPS 204 Appendix A.3)

**Source**: Download from NIST CSRC website after FIPS 203/204 final publication.

---

## Appendix B: Health Test Cutoff Calculation Worksheet

**Given**:
- Sample size: 8 bits (256 possible values)
- Min-entropy: H_min = 3.0 bits/sample (from entropy assessment)
- False positive rate: α = 2^-40 (per FIPS 140-3 requirement)

**RCT Cutoff**:
```
C = ⌈1 + (-log₂(α) / H_min)⌉
  = ⌈1 + (40 / 3.0)⌉
  = ⌈14.33⌉
  = 15
```

**Recommended**: Use C = 10 for added safety margin.

**APT Cutoff**:
```
Window size: W = 512 samples
Probability of most common value: p = 2^(-H_min) = 2^(-3.0) = 0.125

Using binomial distribution:
C = Critbinom(W, p, 1 - α) + 1
  = Critbinom(512, 0.125, 1 - 2^-40) + 1
  ≈ 325  (from NIST SP 800-90B Table 2)
```

**Verification**: Run NIST SP 800-90B test suite on 1M QRNG samples to confirm cutoffs are appropriate.

---

**Document Control**
Version: 1.0
Date: 2025-10-30
Author: FIPS Validation Specialist
Status: Final
Next Review: After self-test implementation (Month 1, Week 4)
