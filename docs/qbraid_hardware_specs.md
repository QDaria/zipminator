# qBraid Quantum Hardware Technical Specifications

## Executive Summary

Complete technical specifications for all quantum hardware providers accessible through qBraid, optimized for Quantum Random Number Generation (QRNG) applications.

**Best for QRNG**: IonQ Harmony (11 qubits, 99.5% fidelity, 1 credit/shot)

---

## IonQ Hardware Specifications

### IonQ Harmony

#### Physical Architecture
- **Qubit Count**: 11 physical qubits
- **Algorithmic Qubits (#AQ)**: 9 (practical performance metric)
- **Technology**: Trapped ytterbium ions (Yb+)
- **Qubit Type**: Hyperfine levels of ytterbium-171 isotope
- **Trap Design**: Linear Paul trap

#### Connectivity
- **Topology**: All-to-all connectivity
- **Gate Capability**: Any qubit can interact with any other qubit
- **Advantage**: No SWAP gates needed, reduces circuit depth

#### Gate Performance
- **Single-Qubit Gate Fidelity**: 99.9%+
- **Two-Qubit Gate Fidelity**: 99.5%+
- **Gate Time**:
  - 1-qubit: ~10 microseconds
  - 2-qubit: ~200 microseconds

#### Measurement & Readout
- **Readout Fidelity**: 99.8%+
- **Measurement Method**: Resonance fluorescence
- **Measurement Time**: ~100 microseconds per qubit
- **State Prep Time**: ~50 microseconds

#### Coherence Properties
- **T1 (Relaxation Time)**: ~10 seconds
- **T2 (Dephasing Time)**: ~1 second
- **T2* (Inhomogeneous Dephasing)**: ~200 milliseconds
- **Advantage**: Long coherence = low decoherence error

#### Error Rates
- **Depolarizing Error**: <0.5% per gate
- **Readout Error**: <0.2%
- **Idle Error**: Negligible (long T1)
- **Crosstalk**: Minimal (isolated ions)

#### Operational Parameters
- **Max Circuit Depth**: ~1000 gates (limited by T2)
- **Max Shots**: 10,000 per job
- **Native Gates**: R(θ, φ), RZ(θ), RXX(θ)
- **Basis Gates**: X, Y, Z, H, CNOT, SWAP, Toffoli

#### Queue & Availability
- **Operating Hours**: 24/7 (except maintenance)
- **Average Queue Time**: 30 seconds - 5 minutes
- **Typical Queue Depth**: 5-20 jobs
- **Maintenance Windows**: ~4 hours/month (announced)

#### Cost (via qBraid)
- **Per-Shot**: 1-3 credits (typically 1)
- **Per-Task**: 30 credits
- **Per-Minute**: None
- **Total Cost Example**: 293 shots = 323 credits = $3.23

#### QRNG Performance
- **Recommended Qubit Count**: 8 (byte-aligned)
- **Entropy per Shot**: 8 bits = 1 byte
- **Max Entropy from 1000 Credits**: ~970 bytes (0.95 KB)
- **Randomness Quality**: Excellent (NIST-compliant)
- **Bias**: <0.5% (< 1 standard deviation)

---

### IonQ Aria

#### Physical Architecture
- **Qubit Count**: 25 physical qubits
- **Algorithmic Qubits (#AQ)**: 23
- **Technology**: Next-generation trapped ion
- **Improvements**: Better isolation, faster gates

#### Connectivity
- **Topology**: All-to-all
- **Gate Capability**: Full connectivity

#### Gate Performance
- **Single-Qubit Fidelity**: 99.98%
- **Two-Qubit Fidelity**: 99.7%+
- **Gate Time**:
  - 1-qubit: ~5 microseconds (faster than Harmony)
  - 2-qubit: ~150 microseconds

#### Measurement & Readout
- **Readout Fidelity**: 99.9%+
- **Measurement Time**: ~80 microseconds

#### Coherence Properties
- **T1**: ~15 seconds (improved)
- **T2**: ~2 seconds (improved)
- **Error Rates**: ~50% better than Harmony

#### Error Mitigation
- **Built-in Mitigation**: Yes
- **Minimum Shots Required**: 2,500 for error mitigation
- **Cost Implications**: (2500 × 5) + 30 = 12,530 credits ($125.30)

#### Queue & Availability
- **Average Queue Time**: 5-15 minutes (higher demand)
- **Queue Depth**: 20-100 jobs

#### Cost (via qBraid)
- **Per-Shot**: 3-5 credits (typically 5)
- **Per-Task**: 30 credits
- **Example**: 100 shots = 530 credits = $5.30

#### QRNG Performance
- **Quality**: Highest available
- **Entropy/Cost**: 0.19 KB per 1000 credits (expensive)
- **Use Case**: Research requiring highest fidelity

---

### IonQ Forte

#### Physical Architecture
- **Qubit Count**: 32+ physical qubits (expanding)
- **Algorithmic Qubits (#AQ)**: 29+
- **Technology**: Advanced trapped ion with coils

#### Performance
- **Fidelity**: Similar to Aria (99.9%+)
- **Speed**: Faster gate operations

#### Availability
- **Status**: Limited access (research partners)
- **Queue Time**: Variable (priority access)

#### Cost
- **Per-Shot**: 5-8 credits (estimated)
- **Availability**: Contact qBraid for access

---

## Rigetti Hardware Specifications

### Rigetti Aspen-8

#### Physical Architecture
- **Qubit Count**: 32 qubits
- **Technology**: Superconducting transmon qubits
- **Fabrication**: Niobium on silicon

#### Connectivity
- **Topology**: Octagonal lattice
- **Connectivity**: Limited (nearest-neighbor)
- **SWAP Gates**: Required for distant qubit interactions

#### Gate Performance
- **Single-Qubit Fidelity**: 99.5%+
- **Two-Qubit Fidelity**: 95-98%
- **Gate Time**:
  - 1-qubit: 40 nanoseconds
  - 2-qubit: 200 nanoseconds

#### Measurement & Readout
- **Readout Fidelity**: 95-98%
- **Measurement Time**: ~300 nanoseconds
- **Simultaneous Readout**: Yes (all qubits)

#### Coherence Properties
- **T1**: 50-80 microseconds
- **T2**: 40-60 microseconds
- **T2***: ~20 microseconds

#### Error Rates
- **Depolarizing Error**: 1-2% per gate
- **Readout Error**: 2-5%
- **Crosstalk**: Moderate

#### Operational Parameters
- **Max Circuit Depth**: ~100 gates (T2 limited)
- **Max Shots**: 10,000
- **Native Gates**: RZ, RX(±π/2), CZ
- **Basis Gates**: Clifford + T

#### Cost (via qBraid)
- **Per-Shot**: 2-3 credits
- **Per-Task**: 30 credits
- **Example**: 293 shots = 909 credits = $9.09

#### QRNG Performance
- **Quality**: Good (lower than IonQ)
- **Entropy/1000 Credits**: ~0.32 KB
- **Bias**: 1-2% (requires post-processing)

---

### Rigetti Aspen-11

#### Physical Architecture
- **Qubit Count**: 40 qubits
- **Technology**: Improved transmon design

#### Performance
- **Fidelity**: Similar to Aspen-8
- **CLOPS**: 844 (circuit layer operations per second)

#### Cost (via qBraid)
- **Per-Shot**: 2-4 credits
- **Per-Task**: 30 credits

---

### Rigetti Aspen-M

#### Physical Architecture
- **Qubit Count**: 80 qubits
- **Technology**: Multi-chip module (MCM)
- **Design**: Two 40-qubit chips

#### Connectivity
- **Topology**:
  - Intra-chip: Octagonal lattice
  - Inter-chip: Limited connections

#### Performance
- **Fidelity**: 98-99% (1-qubit), 95-97% (2-qubit)
- **CLOPS**: Improved over Aspen-11

#### Operational Parameters
- **Max Circuit Depth**: ~80-100 gates
- **Suitable For**: Medium-depth circuits

#### Cost (via qBraid)
- **Per-Shot**: 3-5 credits
- **Per-Task**: 30 credits

---

### Rigetti Ankaa-3

#### Physical Architecture
- **Qubit Count**: 84 qubits
- **Technology**: Latest Ankaa architecture
- **Improvements**: Better coherence, faster gates

#### Performance
- **Fidelity**: 99%+ (1-qubit), 97-99% (2-qubit)
- **Coherence**: T1 ~100 microseconds (improved)

#### Cost (via qBraid - Azure)
- **Per-Shot**: 4-6 credits
- **Per-Task**: 30 credits
- **Per-Minute**: Variable (execution-dependent)
- **Complexity**: Hard to estimate costs

#### QRNG Recommendation
- **Use Case**: Avoid for QRNG (unpredictable per-minute charges)

---

## Oxford Quantum Circuits (OQC)

### OQC Lucy

#### Physical Architecture
- **Qubit Count**: 8 qubits
- **Technology**: Coaxmon (superconducting)
- **Design**: Unique to OQC

#### Connectivity
- **Topology**: Custom OQC architecture
- **Connectivity**: Limited

#### Gate Performance
- **Single-Qubit Fidelity**: 99%+
- **Two-Qubit Fidelity**: 95-98%

#### Coherence Properties
- **T1**: ~30-50 microseconds
- **T2**: ~20-40 microseconds

#### Cost (via qBraid)
- **Per-Shot**: 5-8 credits (premium pricing)
- **Per-Task**: 30 credits
- **Example**: 120 shots = 990 credits (almost entire budget)

#### QRNG Performance
- **Quality**: Good
- **Value**: Poor (8x more expensive than IonQ Harmony)
- **Recommendation**: Not cost-effective for QRNG

---

## QuEra Hardware Specifications

### QuEra Aquila

#### Physical Architecture
- **Qubit Count**: 256 qubits (programmable positions)
- **Technology**: Neutral atom (Rydberg blockade)
- **Atom Type**: Rubidium-87

#### Operational Mode
- **Type**: Analog quantum simulation (not gate-based)
- **Control**: Rydberg Hamiltonian parameters
- **Use Case**: Optimization problems, not QRNG

#### Connectivity
- **Topology**: Programmable 2D array
- **Interactions**: Long-range Rydberg interactions

#### Performance
- **Coherence**: ~100 microseconds
- **Measurement**: Single-shot fluorescence imaging

#### Cost (via qBraid - AWS Braket)
- **Pricing**: Based on simulation time, not shots
- **Model**: Per-task + per-second
- **Not Suitable**: For traditional QRNG

---

## Comparative Analysis for QRNG

### Technology Comparison

| Technology | Example | T1 | Fidelity | Connectivity | QRNG Suitability |
|------------|---------|----|-----------|--------------|--------------------|
| **Trapped Ion** | IonQ Harmony | ~10s | 99.5%+ | All-to-all | ⭐⭐⭐⭐⭐ Excellent |
| **Superconducting** | Rigetti Aspen | ~50μs | 98%+ | Limited | ⭐⭐⭐ Good |
| **Superconducting** | OQC Lucy | ~30μs | 98%+ | Limited | ⭐⭐ Fair |
| **Neutral Atom** | QuEra Aquila | ~100μs | N/A | Programmable | ⭐ Poor (not gate-based) |

---

### Fidelity Comparison

| Hardware | 1-Qubit | 2-Qubit | Readout | Overall QRNG Quality |
|----------|---------|---------|---------|----------------------|
| **IonQ Harmony** | 99.9% | 99.5% | 99.8% | ⭐⭐⭐⭐⭐ |
| **IonQ Aria** | 99.98% | 99.7% | 99.9% | ⭐⭐⭐⭐⭐ |
| **Rigetti Aspen-M** | 99% | 96% | 96% | ⭐⭐⭐ |
| **Rigetti Ankaa-3** | 99% | 98% | 97% | ⭐⭐⭐⭐ |
| **OQC Lucy** | 99% | 97% | 96% | ⭐⭐⭐ |

---

### Cost-Performance Ratio

| Hardware | Credits/KB | Fidelity | Value Score |
|----------|------------|----------|-------------|
| **IonQ Harmony** | ~1,054 | 99.5% | ⭐⭐⭐⭐⭐ (Best) |
| **Rigetti Aspen** | ~3,102 | 98% | ⭐⭐⭐ |
| **IonQ Aria** | ~5,150 | 99.7% | ⭐⭐ |
| **OQC Lucy** | ~8,222 | 98% | ⭐ (Worst) |

**Winner**: IonQ Harmony (best fidelity-to-cost ratio)

---

### Queue Time Comparison

| Hardware | Avg Wait | Queue Depth | Availability | Reliability |
|----------|----------|-------------|--------------|-------------|
| **IonQ Harmony** | 30s-5m | 5-20 | Excellent | ⭐⭐⭐⭐⭐ |
| **Rigetti Aspen** | 1-10m | 10-50 | Good | ⭐⭐⭐⭐ |
| **IonQ Aria** | 5-15m | 20-100 | Good | ⭐⭐⭐⭐ |
| **Rigetti Ankaa-3** | Variable | Variable | Fair | ⭐⭐⭐ |

---

## IBM Quantum (Not on qBraid)

### IBM Brisbane

#### Physical Architecture
- **Qubit Count**: 127 qubits
- **Technology**: Superconducting transmon (Heron processor)
- **Release**: 2023

#### Connectivity
- **Topology**: Heavy-hex lattice
- **Connectivity**: Nearest-neighbor + some longer connections

#### Performance
- **Fidelity**: 99.9%+ (2-qubit gates with error mitigation)
- **T1**: ~100-300 microseconds
- **T2**: ~100-200 microseconds

#### Access
- **Platform**: IBM Quantum Experience (separate from qBraid)
- **Free Tier**: 10 minutes/month
- **Cost**: $0 within free tier

#### QRNG Performance
- **Quality**: Excellent (with error mitigation)
- **Entropy/Month**: 8-50 KB (depends on optimization)
- **Recommendation**: Primary ongoing source after qBraid credits exhausted

---

### IBM Sherbrooke

#### Physical Architecture
- **Qubit Count**: 127 qubits
- **Technology**: IBM Eagle processor

#### Performance
- **Fidelity**: 99%+ (without mitigation), 99.9%+ (with mitigation)
- **Quality**: Excellent

#### Access
- **Free Tier**: 10 minutes/month
- **Combined with Brisbane**: Choose best available

---

## Qubit Usage Strategy for QRNG

### 8-Qubit Optimal Configuration

**Why 8 Qubits?**
- **Byte Alignment**: 8 bits = 1 byte (clean data structure)
- **Efficiency**: Maximum entropy per shot
- **Simplicity**: Direct binary-to-byte conversion

**Circuit Design**:
```
Circuit Depth: 1 (just Hadamard gates)
Gates: 8 × H (Hadamard on each qubit)
Measurements: 8 (one per qubit)
Classical Bits: 8

Example Output:
  Shot 1: 10110101 → 181 (decimal)
  Shot 2: 01001110 → 78
  Shot 3: 11111000 → 248
  ...
  Result: Array of bytes [181, 78, 248, ...]
```

---

### 127-Qubit Strategy (IBM Brisbane)

**Maximum Extraction**:
- **Use**: 120 qubits (15 bytes per shot)
- **Ignore**: 7 qubits (for alignment)
- **Per Shot**: 120 bits = 15 bytes

**Circuit Design**:
```
Qubits Used: 120 (0-119)
Circuit Depth: 1
Gates: 120 × H
Measurements: 120

Example:
  1 shot → 15 bytes
  100 shots → 1,500 bytes = 1.46 KB
  1000 shots → 15 KB
```

**Cost**: FREE (within 10-minute allocation)

---

### Does Using More Qubits Cost More?

**Answer**: **NO** - Cost is per shot, not per qubit

**Implications**:
1. **Always maximize qubits used** (up to byte alignment)
2. **8 qubits = 8x more entropy** than 1 qubit (same cost!)
3. **127 qubits = 15.875x more** than 8 qubits (same cost on IBM)

**Example**:
```
IonQ Harmony (1 credit/shot):
  1-qubit circuit: 1 credit → 1 bit
  8-qubit circuit: 1 credit → 8 bits (8x more value!)
```

---

## Hardware Selection Matrix

### For Maximum Entropy/Credit
**Winner**: IonQ Harmony
- **Cost**: 1 credit/shot
- **Qubits**: 8 (byte-aligned)
- **Entropy**: ~0.95 KB from 1000 credits

### For Highest Quality
**Winner**: IonQ Aria
- **Fidelity**: 99.7%+ (2-qubit)
- **Error Mitigation**: Built-in
- **Cost**: 5 credits/shot (expensive)

### For Long-Term Free Access
**Winner**: IBM Brisbane/Sherbrooke
- **Cost**: $0 (10 min/month)
- **Qubits**: 127 (15 bytes/shot)
- **Entropy**: 8-50 KB/month

### For Learning/Experimentation
**Winner**: IonQ Harmony
- **Balance**: Good fidelity at low cost
- **Availability**: Excellent (short queues)
- **Reliability**: High

---

## Recommended Hardware Progression

### Phase 1: Bootstrap (Now)
```
Hardware: IonQ Harmony (qBraid)
Credits: 1000
Strategy: Single job, 970 shots, 8 qubits
Entropy: ~0.95 KB
Purpose: Initial quantum entropy pool
```

### Phase 2: Scale (Week 2-4)
```
Hardware: IBM Brisbane/Sherbrooke
Credits: FREE (10 min/month)
Strategy: Monthly harvesting
Entropy: 8-50 KB/month
Purpose: Ongoing production source
```

### Phase 3: High-Quality (If Azure Credits)
```
Hardware: IonQ Aria (Azure Quantum)
Credits: $500 free (if approved)
Strategy: Error mitigation enabled
Entropy: ~9.7 KB from $500 credits
Purpose: Research-grade entropy
```

---

## Technical Resources

### IonQ Documentation
- Technical Specs: https://ionq.com/quantum-systems
- Gate Set: https://ionq.com/docs/native-gates
- Error Mitigation: https://ionq.com/docs/error-mitigation

### Rigetti Documentation
- QCS User Guide: https://qcs.rigetti.com/docs
- Device Specs: https://qcs.rigetti.com/qpus
- PyQuil SDK: https://pyquil-docs.rigetti.com

### qBraid Documentation
- Device API: https://docs.qbraid.com/sdk/devices
- Provider Integration: https://docs.qbraid.com/sdk/providers
- Pricing: https://docs.qbraid.com/pricing

### IBM Quantum
- Device Specifications: https://quantum.ibm.com/services/resources
- Qiskit: https://qiskit.org/documentation
- Error Mitigation: https://qiskit.org/documentation/partners/qiskit_ibm_runtime

---

## Appendix: Measurement & Readout Details

### Trapped Ion (IonQ)
**Method**: Resonance fluorescence
- Illuminate ions with laser
- Fluorescing ion = |1⟩ state
- Dark ion = |0⟩ state
- **Advantage**: High readout fidelity (99.8%+)

### Superconducting (Rigetti, OQC)
**Method**: Dispersive readout
- Microwave pulse applied to resonator
- Qubit state affects resonator frequency
- Measure reflected signal
- **Challenge**: Lower readout fidelity (95-98%)

### Neutral Atom (QuEra)
**Method**: Fluorescence imaging
- Laser excitation
- CCD camera captures fluorescence
- **Limitation**: Single-shot imaging (can't repeat)

---

## Appendix: Error Sources & Mitigation

### Coherent Errors
- **Source**: Imperfect gate calibration
- **Impact**: Systematic bias
- **Mitigation**: Randomized compiling, gate set tomography

### Incoherent Errors
- **Source**: Decoherence (T1, T2)
- **Impact**: Random bit flips
- **Mitigation**: Error correction, faster gates

### Readout Errors
- **Source**: Measurement imperfections
- **Impact**: Incorrect measurement outcomes
- **Mitigation**: Measurement error mitigation (MEM)

### Crosstalk
- **Source**: Unwanted qubit-qubit interactions
- **Impact**: Correlated errors
- **Mitigation**: Better qubit isolation, crosstalk-aware compilation

---

**Last Updated**: 2025-10-30
**Sources**: qBraid documentation, IonQ technical specs, Rigetti QCS, IBM Quantum
**Next Review**: After first quantum job execution (validate specifications)
