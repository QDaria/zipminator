# Zipminator Production Roadmap: Dual-Track C++/Rust Implementation

**Document Version**: 1.0
**Created**: 2025-10-30
**Project Duration**: 12 weeks (MVP in 5-6 weeks)
**Classification**: OPERATIONAL EXECUTION PLAN

---

## Roadmap Overview

This production roadmap details the week-by-week execution plan for delivering the Zipminator Post-Quantum Cryptography Platform MVP and achieving FIPS 140-3 submission within 12 weeks.

**Strategic Approach**: Dual-track parallel development with C++/AVX2 as primary high-performance path and Rust as memory-safe alternative.

---

## Phase 1: Foundation (Week 1)

**Objective**: Establish development infrastructure, procure hardware, set up tooling

### Week 1 Milestones

#### Day 1-2: Project Initialization
- [ ] **Setup Version Control**
  - Initialize Git repository with proper branching strategy (main, develop, feature/*)
  - Configure CI/CD pipeline (GitHub Actions)
  - Setup code review process (pull request templates, CODEOWNERS)

- [ ] **Team Onboarding**
  - Conduct project kickoff meeting (all stakeholders)
  - Assign roles and responsibilities
  - Establish communication channels (Slack, daily standups)
  - Review technical benchmarks and strategic objectives

#### Day 3-4: Development Environment Setup
- [ ] **C++/AVX2 Environment**
  - Install toolchains: GCC 11+, Clang 14+, CMake 3.20+
  - Configure AVX2/AVX-512 build flags (-mavx2, -mavx512f)
  - Setup OpenSSL 3.0 integration (SHA3/SHAKE)
  - Install validation tools: dudect, Valgrind, perf
  - Create project structure:
    ```
    src/cpp/
    ├── include/
    │   ├── kyber768.hpp
    │   ├── ntt_avx2.hpp
    │   ├── poly_avx2.hpp
    │   └── qrng.hpp
    ├── src/
    │   ├── kyber768.cpp
    │   ├── ntt_avx2.cpp
    │   ├── poly_avx2.cpp
    │   └── qrng.cpp
    ├── tests/
    │   └── kyber_tests.cpp
    └── CMakeLists.txt
    ```

- [ ] **Rust Environment**
  - Install Rust 1.70+ (rustup, cargo)
  - Configure dependencies in Cargo.toml:
    - `kyber = "0.x"` (reference implementation)
    - `sha3 = "0.10"` (Keccak hashing)
    - `subtle = "2.5"` (constant-time primitives)
    - `criterion` (benchmarking)
  - Install validation tools: cargo-dudect, Miri
  - Create project structure:
    ```
    src/rust/
    ├── src/
    │   ├── lib.rs
    │   ├── constants.rs
    │   ├── ntt.rs
    │   ├── poly.rs
    │   ├── kyber768.rs
    │   ├── qrng.rs
    │   └── utils.rs
    ├── tests/
    │   └── integration_tests.rs
    └── Cargo.toml
    ```

- [ ] **Benchmarking Infrastructure**
  - Setup cycle-accurate timing (RDTSC instruction access)
  - Configure performance counters (perf_event_open)
  - Create reproducible test environment (isolated CPU cores, disabled frequency scaling)
  - Document baseline system configuration

#### Day 5: Hardware Procurement
- [ ] **QRNG Hardware**
  - ✅ Order ID Quantique IDQ20MC1 QRNG modules (2 units)
    - Unit 1: Development integration
    - Unit 2: Redundancy and testing
  - Lead time: 2-3 weeks (track delivery)
  - Specifications:
    - Throughput: 20 Mbps
    - Interface: SPI / I2C
    - Certifications: NIST SP 800-90B, BSI AIS 31 PTG.3

- [ ] **Side-Channel Analysis Equipment** (Optional, for advanced validation)
  - Digital oscilloscope (power analysis)
  - Differential power analysis (DPA) probe
  - Budget: $X,XXX (if pursuing deep side-channel testing)

### Week 1 Deliverables
- ✅ Development environments operational (C++ and Rust)
- ✅ CI/CD pipeline configured (automated builds + tests)
- ✅ QRNG hardware on order (2-3 week delivery)
- ✅ Benchmarking infrastructure validated
- ✅ Team onboarded and aligned

### Week 1 Success Criteria (Gate 1)
- **GO**: All toolchains installed, CI/CD passing, QRNG order confirmed
- **NO-GO**: Cannot access AVX2 instructions, QRNG procurement blocked, critical tooling gaps

### Resource Assignments (Week 1)
| Role | Allocation | Primary Tasks |
|------|-----------|---------------|
| Principal Crypto Engineer | 100% | C++ environment setup, AVX2 validation |
| Senior Crypto Engineer | 100% | Rust environment setup, crate evaluation |
| Systems Integration Engineer | 100% | QRNG procurement, benchmarking setup |
| Security Validation Engineer | 50% | Tool installation (dudect, Valgrind) |
| Technical Product Manager | 100% | Kickoff, coordination, tracking |

---

## Phase 2: Core Implementation (Weeks 2-3)

**Objective**: Implement CRYSTALS-Kyber-768 in both C++/AVX2 and Rust with QRNG integration

### Week 2 Milestones

#### C++/AVX2 Implementation
- [ ] **Polynomial Arithmetic** (Day 1-2)
  - Implement `Poly` class with AVX2 intrinsics
  - Montgomery reduction (REDC) with SIMD
  - Coefficient-wise addition, subtraction, multiplication
  - Barrett reduction for modular arithmetic

- [ ] **Number Theoretic Transform (NTT)** (Day 3-4)
  - Cooley-Tukey FFT with AVX2 vectorization (16 parallel int16 operations)
  - Twiddle factor precomputation and caching
  - In-place NTT/INTT (memory efficiency)
  - Target performance: ≤ 3.3µs (30% of 11µs KeyGen time)

- [ ] **Sampling & Packing** (Day 5)
  - Centered Binomial Distribution (CBD) sampler
  - SHAKE-128 integration (OpenSSL EVP interface)
  - Efficient byte packing/unpacking for ciphertexts

#### Rust Implementation
- [ ] **Core Polynomial Module** (Day 1-2)
  - Define `Poly` struct with constant-time operations
  - Use `subtle` crate for conditional selection
  - Implement arithmetic with Montgomery reduction

- [ ] **NTT Implementation** (Day 3-4)
  - Cooley-Tukey FFT (reference implementation)
  - Optimize with in-place operations
  - Use `unsafe` only where necessary for performance (documented)

- [ ] **Sampling & Hashing** (Day 5)
  - CBD sampler with `sha3` crate (SHAKE-128)
  - Ensure constant-time sampling
  - Serialization and deserialization

### Week 2 Deliverables
- ✅ Polynomial arithmetic complete (C++ and Rust)
- ✅ NTT implementation functional (both languages)
- ✅ Sampling and hashing integrated
- ⏳ QRNG hardware delivery in progress (Week 3-4)

### Week 2 Resource Assignments
| Role | Allocation | Primary Tasks |
|------|-----------|---------------|
| Principal Crypto Engineer | 100% | C++ NTT optimization with AVX2 |
| Senior Crypto Engineer | 100% | Rust NTT and constant-time primitives |
| Security Validation Engineer | 50% | Code review for constant-time patterns |
| Systems Integration Engineer | 50% | QRNG delivery tracking, integration planning |

---

### Week 3 Milestones

#### Kyber-768 Key Generation
- [ ] **C++/AVX2 KeyGen** (Day 1-2)
  - Generate public key matrix A (via SHAKE-128 seed expansion)
  - Sample secret key vectors s, e from CBD
  - Compute public key: pk = A·s + e (NTT-based multiplication)
  - Target performance: ≤ 0.011ms

- [ ] **Rust KeyGen** (Day 1-2)
  - Implement KeyGen following NIST FIPS 203 specification
  - Use `subtle::ConstantTimeEq` for comparisons
  - Target performance: ≤ 0.015ms (acceptable)

#### Kyber-768 Encapsulation
- [ ] **C++/AVX2 Encaps** (Day 3)
  - Sample ephemeral randomness (via QRNG, simulated until hardware arrives)
  - Compute ciphertext: ct = A^T·r + e1, v = s^T·r + e2 + μ
  - Derive shared secret via KDF (SHA3-256)
  - Target performance: ≤ 0.011ms

- [ ] **Rust Encaps** (Day 3)
  - Implement Encaps with constant-time guarantees
  - FFI preparation for QRNG (Week 4)
  - Target performance: ≤ 0.015ms

#### Kyber-768 Decapsulation
- [ ] **C++/AVX2 Decaps** (Day 4)
  - Decrypt ciphertext using secret key
  - Constant-time ciphertext comparison (mask-based)
  - Re-encapsulation for implicit rejection
  - Target performance: ≤ 0.012ms

- [ ] **Rust Decaps** (Day 4)
  - Implement Decaps with `subtle::ConstantTimeEq`
  - Ensure no secret-dependent branches
  - Target performance: ≤ 0.017ms

#### Testing & Validation
- [ ] **NIST Known Answer Tests (KATs)** (Day 5)
  - Run official NIST test vectors for Kyber-768
  - Validate correctness: 100% pass rate required
  - Test all three operations: KeyGen, Encaps, Decaps

- [ ] **Unit Tests** (Day 5)
  - C++: gtest framework (9+ test cases)
  - Rust: cargo test (16+ test cases)
  - Coverage: ≥ 90% (measure with gcov/tarpaulin)

#### QRNG Integration (if hardware arrives)
- [ ] **C++ QRNG Binding** (Day 5)
  - FFI to ID Quantique C library
  - Replace simulated RNG with hardware calls
  - Error handling and health checks

- [ ] **Rust QRNG FFI** (Day 5)
  - `extern "C"` bindings to QRNG library
  - Safe Rust wrapper around unsafe FFI
  - Integration tests

### Week 3 Deliverables
- ✅ Complete Kyber-768 implementation (C++ and Rust)
- ✅ NIST KAT validation (100% pass rate)
- ✅ Unit tests passing (≥ 90% coverage)
- ⚠️ QRNG integration (if hardware delivered, else Week 4)

### Week 3 Success Criteria (Gate 2)
- **GO**: Both implementations functional, KAT passing, initial benchmarks < 0.05ms
- **NO-GO**: KAT failures, performance >2x slower than target, critical bugs

### Week 3 Resource Assignments
| Role | Allocation | Primary Tasks |
|------|-----------|---------------|
| Principal Crypto Engineer | 100% | C++ KeyGen/Encaps/Decaps optimization |
| Senior Crypto Engineer | 100% | Rust KeyGen/Encaps/Decaps implementation |
| Security Validation Engineer | 100% | NIST KAT validation, test coverage analysis |
| Systems Integration Engineer | 100% | QRNG hardware integration (C++ and Rust) |

---

## Phase 3: Security Validation (Week 4)

**Objective**: Validate constant-time execution and side-channel resistance

### Week 4 Milestones

#### Constant-Time Analysis
- [ ] **C++/AVX2 dudect Testing** (Day 1-2)
  - Setup dudect framework with 1M+ measurement samples
  - Test critical operations:
    - NTT core loops
    - Montgomery reduction
    - Ciphertext comparison (Decaps)
  - Target: t-statistic < 1.0 (constant-time PASS)
  - Document any detected leaks and fix immediately

- [ ] **Rust cargo-dudect Testing** (Day 1-2)
  - Run constant-time analysis on all secret-dependent operations
  - Validate `subtle` crate usage (ConstantTimeEq, ConditionallySelectable)
  - Ensure no compiler optimizations introduce timing leaks (-C opt-level=3)
  - Target: t-statistic < 1.0 (constant-time PASS)

#### Side-Channel Analysis
- [ ] **Cache Timing Analysis** (Day 3)
  - Use Cachegrind (Valgrind) to analyze memory access patterns
  - Identify any secret-dependent cache behavior
  - Flush+Reload attack simulation (if equipment available)

- [ ] **Power Analysis Preparation** (Day 3, Optional)
  - If DPA equipment available, capture power traces during Decaps
  - Look for correlation with secret key bits
  - Note: Full power analysis may be deferred to external auditor

#### Algorithm Validation
- [ ] **Extended NIST Testing** (Day 4)
  - Run comprehensive NIST CAVP test vectors (not just KATs)
  - Test edge cases: all-zero keys, maximum entropy inputs
  - Fuzz testing with random inputs (100K+ iterations)

- [ ] **Interoperability Testing** (Day 4)
  - Test C++ ↔ Rust interoperability (same ciphertexts decrypt correctly)
  - Compare outputs against reference implementation (liboqs)

#### Security Audit
- [ ] **Third-Party Security Audit** (Day 5, Optional but Recommended)
  - Engage external cryptographic auditor (e.g., NCC Group, Trail of Bits)
  - Focus areas:
    - Constant-time implementation review
    - Memory safety (especially C++ manual management)
    - Cryptographic correctness
  - Budget: $XX,XXX (1 week engagement)
  - Deliverable: Security audit report with findings

### Week 4 Deliverables
- ✅ Constant-time validation PASS (C++ and Rust)
- ✅ Side-channel analysis complete (no critical leaks)
- ✅ Extended NIST testing PASS (100% correctness)
- ✅ Security audit report (if engaged, else deferred)

### Week 4 Success Criteria (Gate 3)
- **GO**: Constant-time PASS, no critical security issues, NIST tests 100%
- **NO-GO**: Timing leaks detected, KAT failures, critical vulnerabilities found

### Week 4 Resource Assignments
| Role | Allocation | Primary Tasks |
|------|-----------|---------------|
| Security Validation Engineer | 100% | dudect testing, side-channel analysis |
| Principal Crypto Engineer | 50% | Fix any timing leaks in C++ |
| Senior Crypto Engineer | 50% | Fix any timing leaks in Rust |
| External Auditor (Contract) | 5 days | Third-party security review |

---

## Phase 4: Performance Optimization (Weeks 2-4, Parallel)

**Objective**: Achieve gold standard performance targets (0.034ms for Kyber-768)

**Note**: This phase runs **in parallel** with Weeks 2-4 implementation/validation.

### Optimization Workstreams

#### NTT Optimization (Target: ≤ 3.3µs, 30% of runtime)
- [ ] **Week 2-3: AVX2 Vectorization**
  - Fully vectorize butterfly operations (16 parallel int16 ops)
  - Optimize twiddle factor loading (cache-friendly)
  - Loop unrolling for reduced overhead

- [ ] **Week 3-4: Memory Optimization**
  - Ensure L1 cache residency for working set (~1KB per poly)
  - Minimize cache line evictions
  - Prefetch instructions for predictable access patterns

#### Matrix Multiplication (Target: ≤ 4.4µs, 40% of runtime)
- [ ] **Week 2-3: NTT-Based Multiplication**
  - Leverage NTT for O(n log n) instead of O(n²)
  - Batch operations where possible (multiple polys in parallel)

- [ ] **Week 3-4: SIMD Optimization**
  - Full AVX2 utilization for coefficient-wise operations
  - Explore AVX-512 if available (16 → 32 parallel ops)

#### Sampling & Hashing (Target: ≤ 3.3µs, 30% of runtime)
- [ ] **Week 2-3: SHAKE Integration**
  - Use OpenSSL's optimized SHAKE implementation (C++)
  - Ensure `sha3` crate uses platform-optimized code (Rust)

- [ ] **Week 3-4: CBD Sampling**
  - Optimize bit manipulation for binomial sampling
  - Minimize memory allocations

#### Compiler Optimizations
- [ ] **Profile-Guided Optimization (PGO)**
  - Collect profiling data from typical workloads
  - Recompile with PGO flags (-fprofile-use)
  - Expected gain: 10-20% performance improvement

- [ ] **Link-Time Optimization (LTO)**
  - Enable LTO for whole-program optimization
  - C++: -flto, Rust: lto = "fat" in Cargo.toml
  - Expected gain: 5-15% performance improvement

### Optimization Deliverables (End of Week 4)
- ✅ C++/AVX2 performance: ≤ 0.034ms (meets gold standard)
- ✅ Rust performance: ≤ 0.047ms (within 1.4x of baseline, acceptable)
- ✅ NTT bottleneck: ≤ 3.3µs (30% of runtime verified)
- ✅ Performance documentation: Detailed profiling reports

### Optimization Resource Assignments
| Role | Allocation | Primary Tasks |
|------|-----------|---------------|
| Principal Crypto Engineer | 50% (parallel) | C++ AVX2 optimization, PGO |
| Senior Crypto Engineer | 30% (parallel) | Rust optimization, LTO |

---

## Phase 5: Integration & Testing (Weeks 5-6) **[MVP COMPLETE]**

**Objective**: Integrate with TLS/IPSec, create developer-friendly API, deliver MVP

### Week 5 Milestones

#### TLS 1.3 Integration
- [ ] **OpenSSL/BoringSSL Integration** (Day 1-3)
  - Implement custom TLS 1.3 key exchange with Kyber-768
  - Replace default ECDHE with hybrid ECDHE+Kyber
  - Ensure backward compatibility (fallback to ECDHE-only)
  - Test with popular TLS clients (curl, browsers)

- [ ] **Performance Testing** (Day 3)
  - Measure TLS handshake latency (with/without QRNG overhead)
  - Target: < 10^-5 overhead from QRNG integration
  - Benchmark throughput: connections per second

#### IPSec Integration
- [ ] **strongSwan/Libreswan Integration** (Day 4-5)
  - Integrate Kyber-768 for IKEv2 key exchange
  - Test VPN establishment (site-to-site and remote-access)
  - Measure tunnel setup time

#### API Documentation
- [ ] **Developer-Friendly API** (Day 5)
  - C++ API: Header files with comprehensive comments
  - Rust API: cargo doc generation with examples
  - RESTful API wrapper (optional, for language-agnostic access)

### Week 5 Deliverables
- ✅ TLS 1.3 integration working (hybrid ECDHE+Kyber)
- ✅ IPSec integration functional (VPN tunnel establishment)
- ✅ API documentation complete (C++ and Rust)

### Week 5 Resource Assignments
| Role | Allocation | Primary Tasks |
|------|-----------|---------------|
| Systems Integration Engineer | 100% | TLS/IPSec integration |
| Principal Crypto Engineer | 30% | C++ API design |
| Senior Crypto Engineer | 30% | Rust API design |
| Technical Writer | 100% | API documentation |

---

### Week 6 Milestones (**MVP COMPLETION**)

#### Example Applications
- [ ] **TLS Server Example** (Day 1-2)
  - Simple HTTPS server using Kyber-768
  - Demonstrate handshake with browser client
  - Include performance metrics (handshake time, throughput)

- [ ] **VPN Gateway Example** (Day 3)
  - IPSec VPN gateway with Kyber-768 key exchange
  - Configuration guide for admins
  - Interoperability test with standard IPSec clients

#### Integration Testing
- [ ] **End-to-End Testing** (Day 4)
  - Full workflow: KeyGen → Encaps → Decaps → TLS handshake
  - Test with real QRNG hardware (if available)
  - Stress testing: 10K+ connections, measure stability

- [ ] **Compatibility Testing** (Day 4)
  - Test on multiple platforms: Linux (Ubuntu, RHEL), macOS, Windows
  - Verify AVX2 detection and fallback behavior
  - Rust cross-compilation (if targeting embedded)

#### Release Preparation
- [ ] **Version 1.0 Release Candidate** (Day 5)
  - Tag Git repository: v1.0.0-rc1
  - Create release notes (features, known issues, roadmap)
  - Package binaries for distribution (tar.gz, .deb, .rpm)

- [ ] **MVP Demo** (Day 5)
  - Prepare demonstration for stakeholders
  - Showcase performance metrics vs competitors
  - Highlight QRNG integration and CNSA 2.0 compliance

### Week 6 Deliverables (**MVP LAUNCH**)
- ✅ Example applications (TLS server, VPN gateway)
- ✅ End-to-end integration tests passing
- ✅ Release Candidate 1.0.0-rc1 published
- ✅ MVP demo prepared for stakeholders

### Week 6 Success Criteria (Gate 4: **MVP GO/NO-GO**)
- **GO**: TLS integration working, API stable, example apps functional, RC published
- **NO-GO**: Integration failures, API instability, critical bugs blocking production use

### Week 6 Resource Assignments
| Role | Allocation | Primary Tasks |
|------|-----------|---------------|
| Systems Integration Engineer | 100% | Example apps, integration testing |
| Principal Crypto Engineer | 50% | Bug fixes, performance validation |
| Senior Crypto Engineer | 50% | Bug fixes, Rust API refinement |
| Technical Product Manager | 100% | Release coordination, MVP demo prep |
| Technical Writer | 50% | Release notes, user guides |

---

## Phase 6: Compliance & Certification (Weeks 7-12)

**Objective**: FIPS 140-3 validation submission and CNSA 2.0 certification pathway

### Week 7-8: FIPS 140-3 Preparation

#### Cryptographic Module Definition
- [ ] **Week 7, Day 1-2: Module Boundary**
  - Define cryptographic module scope (Kyber-768 + QRNG + SHA3)
  - Document module interfaces (API, data inputs/outputs)
  - Identify security-relevant components

- [ ] **Week 7, Day 3-5: Security Policy**
  - Write FIPS 140-3 Security Policy document
  - Define roles, services, authentication (if applicable)
  - Document approved security functions

- [ ] **Week 8, Day 1-3: Self-Tests**
  - Implement power-on self-tests (POST)
    - Known Answer Tests (KAT) for Kyber-768
    - Pairwise consistency test for key generation
    - Continuous random number generator test (for QRNG)
  - Conditional self-tests (on demand)

#### CAVP Algorithm Validation
- [ ] **Week 8, Day 4-5: CAVP Submission**
  - Register with NIST CAVP (Cryptographic Algorithm Validation Program)
  - Submit Kyber-768 algorithm for validation
  - Provide test vectors and implementation details
  - Expected timeline: 4-6 weeks for CAVP certificate

### Week 9-10: FIPS 140-3 Lab Engagement

#### Lab Selection
- [ ] **Week 9, Day 1: Choose FIPS Lab**
  - Research accredited CMVP labs (e.g., Acumen Security, atsec, Leidos)
  - Request quotes and timelines
  - Budget: $XX,XXX - $XXX,XXX (depending on level)

- [ ] **Week 9, Day 2-5: Pre-Assessment**
  - Submit module documentation to lab
  - Conduct pre-assessment review
  - Identify any gaps or non-conformities

#### FIPS Testing
- [ ] **Week 10: Testing Engagement**
  - Ship module to lab (if physical testing required)
  - Lab conducts conformance testing:
    - Algorithm implementation correctness
    - Entropy source validation (QRNG)
    - Physical security (if Level 2+)
    - Side-channel resistance (conditional)
  - Address any findings from lab

### Week 11-12: Certification Finalization

#### BSI AIS 31 Certification (QRNG)
- [ ] **Week 11: QRNG Certification**
  - Leverage ID Quantique's existing BSI AIS 31 certification
  - Document integration in FIPS Security Policy
  - Ensure QRNG health monitoring is operational

#### NIST Submission
- [ ] **Week 12, Day 1-3: FIPS 140-3 Submission**
  - Compile all test results, documentation, Security Policy
  - Submit to NIST CMVP for validation
  - Expected queue time: 6-12 months for certificate issuance

- [ ] **Week 12, Day 4-5: CNSA 2.0 Compliance Statement**
  - Draft compliance statement document
  - Highlight FIPS 203 (Kyber) conformance
  - Document roadmap for FIPS 204 (Dilithium) - Phase 2

#### Commercial Launch Preparation
- [ ] **Week 12: Go-to-Market Planning**
  - Finalize pricing strategy (per-seat, per-device, enterprise license)
  - Prepare marketing materials (whitepapers, case studies)
  - Identify early adopter customers (NSS, DIB, critical infrastructure)
  - Plan launch event or webinar

### Weeks 7-12 Deliverables
- ✅ FIPS 140-3 submission complete (Week 12)
- ✅ CAVP algorithm validation in progress (4-6 week queue)
- ✅ BSI AIS 31 certification documented (QRNG)
- ✅ CNSA 2.0 compliance statement published
- ✅ Commercial launch materials prepared

### Week 12 Success Criteria (Gate 5: **COMMERCIAL LAUNCH**)
- **GO**: FIPS submitted, CAVP validation in progress, commercial docs complete
- **NO-GO**: FIPS submission rejected, critical certification gaps

### Weeks 7-12 Resource Assignments
| Role | Allocation | Primary Tasks |
|------|-----------|---------------|
| FIPS Validation Specialist | 100% | Security Policy, CAVP submission, lab coordination |
| Security Validation Engineer | 50% | Self-tests implementation, testing support |
| Technical Writer | 100% | FIPS documentation, compliance statements |
| Technical Product Manager | 50% | Lab coordination, launch planning |
| Marketing/Sales (External) | TBD | Go-to-market strategy |

---

## Resource Allocation Summary

### Full 12-Week Team Composition

| Role | Weeks 1-6 | Weeks 7-12 | Total Effort |
|------|-----------|------------|--------------|
| **Principal Cryptographic Engineer** | 100% (6 weeks) | 30% (6 weeks) | 7.8 FTE-weeks |
| **Senior Cryptographic Engineer** | 100% (6 weeks) | 30% (6 weeks) | 7.8 FTE-weeks |
| **Security Validation Engineer** | 75% (6 weeks) | 50% (6 weeks) | 7.5 FTE-weeks |
| **Systems Integration Engineer** | 100% (6 weeks) | 20% (6 weeks) | 7.2 FTE-weeks |
| **FIPS Validation Specialist** | 0% (0 weeks) | 100% (6 weeks) | 6.0 FTE-weeks |
| **Technical Product Manager** | 100% (6 weeks) | 50% (6 weeks) | 9.0 FTE-weeks |
| **Technical Writer** | 30% (6 weeks) | 100% (6 weeks) | 7.8 FTE-weeks |
| **Hardware Engineer (Part-Time)** | 20% (6 weeks) | 0% (0 weeks) | 1.2 FTE-weeks |
| **External Security Auditor** | 5 days (Week 4) | 0 | 1.0 FTE-weeks |
| **TOTAL** | - | - | **55.3 FTE-weeks** |

### Budget Breakdown by Phase

| Phase | Duration | Personnel Cost | Hardware/Tooling | External Services | Phase Total |
|-------|----------|----------------|------------------|-------------------|-------------|
| **Foundation** | Week 1 | $XX,XXX | $XX,XXX (QRNG, tools) | $0 | **$XX,XXX** |
| **Core Dev** | Weeks 2-3 | $XX,XXX | $X,XXX | $0 | **$XX,XXX** |
| **Security Validation** | Week 4 | $XX,XXX | $X,XXX | $XX,XXX (audit) | **$XX,XXX** |
| **Optimization** | Weeks 2-4 (parallel) | (included above) | $X,XXX | $0 | **(included)** |
| **Integration & MVP** | Weeks 5-6 | $XX,XXX | $X,XXX | $0 | **$XX,XXX** |
| **FIPS Certification** | Weeks 7-12 | $XX,XXX | $X,XXX | $XX,XXX (FIPS lab) | **$XXX,XXX** |
| **Contingency** | - | $XX,XXX | $X,XXX | $X,XXX | **$XX,XXX** |
| **GRAND TOTAL** | **12 weeks** | **$XXX,XXX** | **$XX,XXX** | **$XX,XXX** | **$XXX,XXX** |

---

## Critical Path Analysis

### Critical Path (Cannot Be Parallelized)

```
Week 1: Foundation → Week 2-3: Core Implementation → Week 4: Security Validation → Week 5-6: Integration (MVP) → Week 7-12: FIPS Submission
```

**Total Critical Path Duration**: 12 weeks

**Slack/Buffer**:
- CNSA 2.0 mandate: Jan 1, 2027 (13 months from now)
- MVP delivery: Week 6 (6 months before mandate)
- FIPS submission: Week 12 (12 months before mandate)
- **Buffer**: 1 month cushion after FIPS submission

### Parallel Workstreams (Can Overlap)

- **Optimization** (Weeks 2-4): Runs in parallel with implementation/validation
- **Documentation** (Weeks 1-12): Continuous throughout project
- **QRNG Procurement** (Weeks 1-3): Delivery expected Week 3-4
- **FIPS Preparation** (Weeks 5-8): Can begin while finalizing MVP

---

## Dependencies & Blockers

### External Dependencies

| Dependency | Timeline | Risk Level | Mitigation |
|------------|----------|------------|------------|
| **QRNG Hardware Delivery** | Week 3-4 (2-3 week lead time) | MEDIUM | Order immediately (Week 1), use simulated RNG until arrival |
| **FIPS Lab Availability** | Week 9-10 engagement | MEDIUM | Early engagement (Week 7), book capacity in advance |
| **NIST CAVP Queue** | 4-6 weeks after submission | MEDIUM | Submit early (Week 8), accept 6-12 month certificate wait |
| **OpenSSL 3.0 Stability** | Available now | LOW | Stable release, widely deployed |
| **Rust Crates Maturity** | Available now | LOW | `kyber`, `sha3`, `subtle` all stable |

### Internal Dependencies

| Dependency | Blocks | Risk Level | Mitigation |
|------------|--------|------------|------------|
| **C++ Implementation Complete** | Security validation (Week 4) | LOW | Well-understood technology |
| **Rust Implementation Complete** | Security validation (Week 4) | LOW | Strong ecosystem support |
| **Constant-Time Validation** | MVP release (Week 6) | MEDIUM | Budget extra time in Week 4 for fixes |
| **QRNG Integration** | Full MVP functionality | MEDIUM | Fallback to simulated RNG for testing |
| **MVP Stability** | FIPS submission (Week 7+) | LOW | 2-week buffer (Weeks 5-6) |

---

## Risk Mitigation Strategies

### Technical Risks

1. **Performance Shortfall** (C++ or Rust slower than target)
   - **Mitigation**: Aggressive optimization in Weeks 2-4, PGO, LTO
   - **Fallback**: Accept 1.5x slower performance if constant-time validated
   - **Probability**: MEDIUM → **Mitigated to LOW**

2. **Side-Channel Vulnerability Detected**
   - **Mitigation**: dudect validation in Week 4, third-party audit
   - **Fallback**: Delay MVP by 1 week to fix timing leaks
   - **Probability**: MEDIUM → **Mitigated to LOW**

3. **QRNG Integration Failure**
   - **Mitigation**: Early hardware procurement (Week 1), FFI testing in Week 3
   - **Fallback**: Use temporary PRNG with clear warning (not for production)
   - **Probability**: LOW

### Schedule Risks

1. **FIPS Lab Queue Delay**
   - **Mitigation**: Early booking (Week 7), flexible lab selection
   - **Fallback**: Accept 6-12 month validation timeline (still meets CNSA 2.0)
   - **Probability**: MEDIUM → **Acceptable**

2. **Team Member Unavailability**
   - **Mitigation**: Comprehensive documentation, cross-training, code reviews
   - **Fallback**: Extend timeline by 1-2 weeks if critical role absent
   - **Probability**: MEDIUM → **Mitigated to LOW**

3. **Scope Creep**
   - **Mitigation**: Strict phase-gate approach, defer non-critical features to v1.1
   - **Fallback**: Timebox each phase, escalate blockers immediately
   - **Probability**: MEDIUM → **Mitigated to LOW**

---

## Success Metrics (Recap from Executive Decision)

### Technical KPIs

| Metric | Target | Current Status |
|--------|--------|----------------|
| **Kyber-768 Performance (C++)** | ≤ 0.034ms | ⏳ Week 3 |
| **Kyber-768 Performance (Rust)** | ≤ 0.047ms | ⏳ Week 3 |
| **Constant-Time Validation** | t-statistic < 1.0 | ⏳ Week 4 |
| **NIST KAT Pass Rate** | 100% | ⏳ Week 3 |
| **Test Coverage** | ≥ 90% | ⏳ Week 3 |
| **QRNG Latency Overhead** | < 10^-5 in TLS | ⏳ Week 5 |

### Business KPIs (Post-MVP)

| Metric | Target (Year 1) | Tracking Method |
|--------|-----------------|-----------------|
| **MVP Launch Date** | Week 6 (on track) | ✅ Roadmap adherence |
| **FIPS Submission** | Week 12 (on track) | ⏳ In progress |
| **Early Adopters** | XX customers | Sales pipeline |
| **Revenue** | $XXM+ | Contracts signed |
| **Market Share** | XX% | Industry analysis |

---

## Communication & Reporting

### Daily Standups
- **Time**: 9:00 AM (15 minutes)
- **Format**: Standup (in-person or Zoom)
- **Agenda**:
  - What did you accomplish yesterday?
  - What are you working on today?
  - Any blockers or risks?

### Weekly Status Reports
- **Frequency**: Every Friday, 4:00 PM
- **Audience**: Executive team, stakeholders
- **Format**: Written summary + metrics dashboard
- **Content**:
  - Progress vs. plan (on track, at risk, blocked)
  - Key accomplishments
  - Upcoming milestones
  - Risks and mitigation actions

### Phase-Gate Reviews
- **Gates**: End of Weeks 1, 3, 4, 6, 12
- **Participants**: Full project team + executive sponsor
- **Format**: 60-minute review meeting
- **Decision**: GO / NO-GO / CONDITIONAL (with remediation plan)

---

## Appendix: Detailed Task Breakdown

### C++/AVX2 Task List (Granular)

**Week 2: Core Implementation**
- [ ] Create `Poly` class with AVX2 intrinsics (`_mm256_*` instructions)
- [ ] Implement Montgomery reduction (`__m256i reduce_montgomery(__m256i a)`)
- [ ] Implement coefficient-wise addition (`poly_add`, vectorized)
- [ ] Implement coefficient-wise subtraction (`poly_sub`, vectorized)
- [ ] Implement coefficient-wise multiplication (`poly_mul`, using NTT)
- [ ] Implement Barrett reduction (for modulo Q operations)
- [ ] Write unit tests for polynomial arithmetic (gtest)

**Week 3: NTT & Kyber-768**
- [ ] Implement Cooley-Tukey NTT (`ntt_avx2`)
- [ ] Implement inverse NTT (`intt_avx2`)
- [ ] Precompute and cache twiddle factors (zeta values)
- [ ] Optimize NTT for L1 cache residency
- [ ] Implement KeyGen (matrix A generation, secret key sampling, pk computation)
- [ ] Implement Encaps (ciphertext generation, shared secret derivation)
- [ ] Implement Decaps (decryption, constant-time comparison, re-encapsulation)
- [ ] Integrate SHAKE-128 via OpenSSL EVP
- [ ] Write NIST KAT tests (validate against official test vectors)

**Week 4: Optimization & Validation**
- [ ] Profile NTT with perf (identify hotspots)
- [ ] Optimize twiddle factor loading (cache-friendly access)
- [ ] Loop unrolling for reduced overhead
- [ ] Profile-guided optimization (PGO) compilation
- [ ] Link-time optimization (LTO) compilation
- [ ] Run dudect on NTT, Montgomery reduction, Decaps comparison
- [ ] Fix any detected timing leaks

### Rust Task List (Granular)

**Week 2: Core Implementation**
- [ ] Define `Poly` struct with `[i16; 256]` coefficients
- [ ] Implement `Add`, `Sub` traits for `Poly` (arithmetic)
- [ ] Implement Montgomery reduction (constant-time)
- [ ] Implement Barrett reduction
- [ ] Use `subtle::ConstantTimeEq` for comparisons
- [ ] Write unit tests (cargo test)

**Week 3: NTT & Kyber-768**
- [ ] Implement Cooley-Tukey NTT (in-place)
- [ ] Implement inverse NTT (in-place)
- [ ] Twiddle factor precomputation
- [ ] Implement KeyGen (matrix A, secret key, public key)
- [ ] Implement Encaps (ciphertext, shared secret via KDF)
- [ ] Implement Decaps (decrypt, constant-time comparison with `subtle`)
- [ ] Integrate `sha3` crate for SHAKE-128
- [ ] Write NIST KAT tests (validate against official test vectors)

**Week 4: Optimization & Validation**
- [ ] Enable LTO in Cargo.toml (`lto = "fat"`)
- [ ] Profile with `cargo flamegraph` (identify hotspots)
- [ ] Optimize NTT for memory access patterns
- [ ] Run cargo-dudect on secret-dependent operations
- [ ] Ensure no compiler optimizations introduce timing leaks (`-C opt-level=3`)
- [ ] Fix any detected timing leaks

---

## Document Control

- **Version**: 1.0
- **Created**: 2025-10-30
- **Author**: Production Roadmap Team
- **Reviewed By**: CTO, Technical Product Manager
- **Next Review**: End of Week 1 (Gate 1 review)
- **Status**: ✅ **APPROVED - EXECUTION IN PROGRESS**

---

**END OF PRODUCTION ROADMAP**
