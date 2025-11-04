# Quantum Hardware Providers Comparison for QRNG

**Document Version:** 1.0
**Last Updated:** 2025-10-30
**Purpose:** Comprehensive comparison of free quantum hardware providers for quantum random number generation (QRNG)

---

## Executive Summary

This document provides a detailed comparison of quantum hardware providers offering free or low-cost access suitable for quantum random number generation (QRNG). The analysis focuses on providers accessible through qBraid platform integration and direct API access, with emphasis on free tier availability, QRNG suitability, and cost-effectiveness.

**Key Finding:** qBraid emerges as the optimal multi-provider access point with 1000 credits (~$10 USD value) and unified API access to 24+ quantum devices from IBM, IonQ, Rigetti, AWS Braket, Azure Quantum, and others.

---

## Provider Comparison Matrix

| Provider | Free Tier | Qubit Count | QRNG Suitability | Queue Time | API Support | qBraid Access |
|----------|-----------|-------------|------------------|------------|-------------|---------------|
| **qBraid Platform** | 1000 credits + free simulators | 1-256 qubits | ⭐⭐⭐⭐⭐ Excellent | Variable by backend | Unified API | Native |
| **IBM Quantum** | 10 min/month | 5-127 qubits | ⭐⭐⭐⭐ Very Good | Medium-High | Qiskit | ✅ Via qBraid |
| **Xanadu Borealis** | $1000 credits (5M shots) | 216 qubits | ⭐⭐⭐⭐⭐ Excellent | Low | PennyLane | ✅ Via qBraid |
| **IonQ** | Free simulator | 29 qubits | ⭐⭐⭐⭐ Very Good | Low | Native + Qiskit | ✅ Via qBraid |
| **Azure Quantum** | $500/provider (students) | Varies | ⭐⭐⭐⭐ Very Good | Medium | Q#, Qiskit | ✅ Via qBraid |
| **AWS Braket** | Free simulator only | Varies | ⭐⭐⭐ Good | Low-Medium | Braket SDK | ✅ Via qBraid |
| **Rigetti** | Via AWS/Azure only | 80 qubits | ⭐⭐⭐ Good | Medium | PyQuil, Qiskit | ✅ Via qBraid |
| **Google Quantum AI** | Restricted access | 72 qubits | ⭐⭐⭐⭐ Very Good | N/A | Cirq | ❌ No public access |
| **OQC Lucy** | Via AWS only | 8 qubits | ⭐⭐ Fair | Low | OQC SDK | ⚠️ Limited access |

---

## Detailed Provider Analysis

### 1. qBraid Platform (⭐ RECOMMENDED PRIMARY ACCESS)

**Overview:**
- Unified access to 24+ quantum devices and 10+ simulators
- Single API key for multi-provider access
- Cross-framework conversion (18+ SDKs)

**Free Tier Details:**
- **Initial Credits:** 1000 qBraid credits (~$10 USD value)
- **Credit Value:** 1 credit = $0.01 USD
- **QPU Pricing:** 1-8 credits per shot (varies by device)
- **Simulators:** Free access to IonQ and other simulators
- **Platform Features:** Unlimited Jupyter Lab environment access

**QRNG Suitability:** ⭐⭐⭐⭐⭐
- **Pros:**
  - Multi-provider fallback built-in
  - Access to diverse qubit technologies (superconducting, trapped-ion, photonic)
  - Unified API reduces integration complexity
  - Real-time device availability status
  - Free simulators for testing
- **Cons:**
  - Credits-based system requires monitoring
  - Some providers have limited availability windows

**Hardware Access via qBraid:**
- IBM Quantum (5-127 qubits, superconducting)
- IonQ (29 qubits, trapped-ion)
- Rigetti (80 qubits, superconducting)
- IQM Garnet (20 qubits, superconducting)
- QuEra Aquila (256 qubits, neutral atom)
- Xanadu Borealis (216 qubits, photonic)
- AWS Braket devices
- Azure Quantum devices

**Authentication:**
```python
import os
os.environ['QBRAID_API_KEY'] = 'your-api-key'

from qbraid import QbraidProvider
provider = QbraidProvider()
devices = provider.get_devices()
```

**Cost Estimate for QRNG:**
- 1000 credits ≈ 125-1000 shots (depending on device)
- For 1KB random data (8000 bits): ~100-800 credits
- **Recommendation:** Use free simulators for development, real QPUs for production validation

---

### 2. IBM Quantum Platform

**Overview:**
- Most mature quantum cloud platform
- Public and premium access tiers
- 12+ quantum processors online (5-127 qubits)

**Free Tier Details:**
- **Monthly Allocation:** 10 minutes quantum compute time
- **Hardware Access:** 5-qubit and 16-qubit systems publicly accessible
- **Queue Priority:** Low (behind premium users)
- **Simulator:** Free unlimited access to cloud simulator (32 qubits)

**QRNG Suitability:** ⭐⭐⭐⭐
- **Pros:**
  - Well-documented QRNG implementations
  - High gate fidelity on newer systems
  - Mature Qiskit ecosystem
  - Active research community
- **Cons:**
  - 10 min/month limit is restrictive
  - High queue times on free tier
  - Requires careful job batching

**QRNG Performance:**
- Single-qubit Hadamard circuits for QRNG
- IBM Sherbrooke: ~90,563 unbiased bits/second
- Cost: ~$17.67 per million unbiased bits (research study)
- Gate fidelity impacts randomness quality

**Authentication:**
```python
from qiskit import IBMQ
IBMQ.save_account('YOUR_IBM_QUANTUM_TOKEN')
IBMQ.load_account()
```

**Best Practices:**
- Use multi-qubit circuits to maximize efficiency
- Batch jobs to reduce queue overhead
- Cache generated entropy locally
- Monitor monthly credit consumption

---

### 3. Xanadu Quantum Cloud (Borealis)

**Overview:**
- First photonic quantum computer with computational advantage
- 216 squeezed-state qubits
- Available via Xanadu Cloud and AWS Braket

**Free Tier Details:**
- **Initial Credits:** $1000 USD in computing credits
- **Borealis Access:** 5 million shots free
- **X-Series Access:** 10 million shots free
- **Simulators:** Unlimited free access
- **PennyLane:** Open-source framework included

**QRNG Suitability:** ⭐⭐⭐⭐⭐
- **Pros:**
  - Highest qubit count (216 qubits)
  - Photonic technology offers unique entropy source
  - Demonstrated quantum computational advantage
  - 36 microsecond sample generation
  - PennyLane integration for QRNG
- **Cons:**
  - Gaussian boson sampling architecture (different from gate-based)
  - Cost: ~$200 per million unbiased bits (research study)
  - More expensive than IBM for QRNG

**QRNG Implementation:**
- Gaussian boson sampling provides inherent randomness
- Post-processing required for unbiased bits
- Suitable for high-entropy applications
- Can generate large random datasets quickly

**Authentication:**
```python
import pennylane as qml
dev = qml.device('xanadu.cloud', wires=216, shots=1000)
```

---

### 4. IonQ Quantum Cloud

**Overview:**
- Trapped-ion quantum computers
- High gate fidelity (99.5%+ for single-qubit gates)
- Available via IonQ Cloud, AWS Braket, Azure Quantum, and qBraid

**Free Tier Details:**
- **Free Signup:** Available via Google Cloud Marketplace
- **Simulator Access:** Free unlimited 29-qubit simulator
- **Hardware Access:** Pay-as-you-go for Aria (25 qubits)
- **Trial Credits:** Occasional promotional credits

**QRNG Suitability:** ⭐⭐⭐⭐
- **Pros:**
  - Excellent gate fidelity improves randomness quality
  - All-to-all qubit connectivity
  - Low noise for QRNG circuits
  - Multiple access paths (direct, AWS, Azure, qBraid)
- **Cons:**
  - No free hardware access (simulator only)
  - Pay-per-shot pricing for real QPU

**QRNG Implementation:**
- Simple Hadamard + measurement circuits
- Azure Quantum Q# example available
- Bell's theorem certified QRNG demonstrated on Aria-1
- Certified randomness using trapped-ion quantum processor (Nature 2025)

**Authentication:**
```python
# Via qBraid
from qbraid import QbraidProvider
provider = QbraidProvider()
ionq_device = provider.get_device("aws_ionq_aria")

# Via IonQ Cloud
import os
os.environ['IONQ_API_KEY'] = 'your-api-key'
```

---

### 5. Microsoft Azure Quantum

**Overview:**
- Hybrid classical-quantum cloud platform
- Access to IonQ, Quantinuum, Rigetti hardware
- Strong educational program focus

**Free Tier Details:**
- **Students:** $500 credits per hardware provider
- **Researchers:** Up to $10,000 credits (application required)
- **Educators:** $500 per student per provider
- **Azure for Students:** Additional $100 Azure credits
- **Simulators:** Free access to resource estimator

**QRNG Suitability:** ⭐⭐⭐⭐
- **Pros:**
  - Best free tier for students/researchers
  - Multi-provider access (IonQ, Quantinuum, Rigetti)
  - Q# language for QRNG implementation
  - Integration with Azure cloud resources
- **Cons:**
  - Requires educational affiliation for best credits
  - Approval process for researcher grants
  - Credits expire after period

**QRNG Implementation:**
- Q# 2-bit random number generator examples
- Integration with .NET libraries
- Hybrid quantum-classical workflows
- Resource estimation for QRNG circuits

**Authentication:**
```python
from azure.quantum import Workspace
workspace = Workspace(
    resource_id="/subscriptions/.../resourceGroups/.../providers/...",
    location="East US"
)
```

---

### 6. AWS Amazon Braket

**Overview:**
- Fully managed quantum computing service
- Access to IonQ, Rigetti, IQM, QuEra, Xanadu hardware
- Integrated with AWS cloud ecosystem

**Free Tier Details:**
- **Simulators:** Free tier available (1 hour/month for new users)
- **QPU Access:** Pay-as-you-go (no free hardware access)
- **Research Credits:** Available through AWS Cloud Credits for Research program
- **Student Access:** Via AWS Educate program

**QRNG Suitability:** ⭐⭐⭐
- **Pros:**
  - Multiple hardware providers in one platform
  - Well-documented QRNG examples
  - Integration with AWS Lambda for automation
  - Qiskit provider available (Qiskit → Braket conversion)
- **Cons:**
  - No free QPU access (simulator only)
  - Per-task + per-shot pricing
  - Higher cost for QRNG compared to specialized hardware

**QRNG Implementation:**
- AWS blog post: "Generating quantum randomness with Amazon Braket"
- Support for Hadamard-based QRNG circuits
- Integration with IonQ, Rigetti, Xanadu for diverse entropy sources
- Can use multiple providers as fallback

**Authentication:**
```python
from braket.aws import AwsDevice
device = AwsDevice("arn:aws:braket:us-east-1::device/qpu/ionq/Aria-1")
```

---

### 7. Rigetti Quantum Cloud Services (QCS)

**Overview:**
- Superconducting quantum processors
- 80-qubit Ankaa-2 system
- Available via direct QCS, AWS Braket, Azure Quantum

**Free Tier Details:**
- **Direct Access:** Request-based (no public free tier)
- **Historical:** $5000 promotional credits during beta (2019)
- **AWS Braket:** Free simulator access (1 hour/month)
- **Azure Quantum:** Student credits apply

**QRNG Suitability:** ⭐⭐⭐
- **Pros:**
  - 80-qubit Ankaa-2 available via AWS
  - Fast gate operations
  - OpenQAOA integration for quantum algorithms
- **Cons:**
  - No direct free access
  - Must use AWS or Azure for free tier
  - Limited documentation for QRNG specifically

**Access Methods:**
1. Via AWS Braket (pay-per-use)
2. Via Azure Quantum (student credits)
3. Via qBraid platform (unified access)
4. Direct QCS (request account)

---

### 8. Google Quantum AI (Restricted)

**Overview:**
- 72-qubit Sycamore processor (quantum supremacy demonstration)
- Research-focused platform
- Cirq open-source framework

**Free Tier Details:**
- **Public Access:** Not available
- **Academic Partners:** Granted on approval basis
- **Simulators:** Free Cirq simulators (unlimited)
- **QVM (Quantum Virtual Machine):** Free for simulation

**QRNG Suitability:** ⭐⭐⭐⭐ (if access granted)
- **Pros:**
  - High-fidelity gates
  - 72 qubits available
  - Strong research backing
  - Cirq framework mature
- **Cons:**
  - No public access (restricted preview)
  - Approval required
  - Not suitable for immediate deployment

**Status:** Not recommended for production QRNG due to access restrictions. Monitor for future public access.

---

### 9. Oxford Quantum Circuits (OQC)

**Overview:**
- 8-qubit Lucy processor (Gen2 available)
- Superconducting qubit technology
- Available via AWS Braket (previously)

**Free Tier Details:**
- **AWS Braket:** Lucy system removed June 2024
- **Architect Platform:** New educational platform with Lucy Gen2
- **Access:** Limited availability

**QRNG Suitability:** ⭐⭐
- **Pros:**
  - 98% uptime demonstrated
  - OpenPulse support for low-level control
  - Educational platform integration
- **Cons:**
  - Only 8 qubits (limited throughput)
  - No longer available on AWS Braket
  - Access restricted to Architect platform

**Status:** Not recommended for QRNG due to limited qubit count and restricted access.

---

## Academic & Research Programs

### 1. IBM Quantum Open Challenge (IQOC)
- **Access:** Periodic challenges with temporary hardware access
- **Duration:** Event-based (typically 2-4 weeks)
- **Hardware:** Full access to IBM Quantum systems
- **Cost:** Free during challenge period

### 2. Qiskit Global Summer School (QGSS) 2025
- **Dates:** July 7-22, 2025
- **Platform:** qBraid Lab (official host)
- **Access:** Dedicated IBM quantum hardware access
- **Registration:** Open to all (capacity limited)
- **Features:**
  - Pre-configured Jupyter Lab environment
  - Seamless Qiskit code execution
  - Direct submission to IBM QPUs
  - Educational materials included

### 3. AWS Cloud Credits for Research
- **Access:** Application-based
- **Amount:** Varies (typically $1000-$5000)
- **Duration:** 12 months
- **Eligibility:** Academic researchers, students

### 4. Azure Quantum Credits (Detailed)
- **Students:** $500/provider automatically
- **Researchers:** Up to $10,000 (application)
- **Educators:** $500 per student per provider
- **Project Teams:** Up to $10,000

---

## Cost Analysis for QRNG

### Per-Bit Cost Comparison (Research Data)

| Provider | Cost per Million Unbiased Bits | Throughput | Data Source |
|----------|-------------------------------|------------|-------------|
| **IBM Sherbrooke** | $17.67 | 90,563 bits/sec | Research study (2025) |
| **Xanadu Borealis** | $200 | High (photonic) | Research study (2025) |
| **ID Quantique Quantis** | ~$0.001 | 16 Mbps | Commercial QRNG |
| **Dedicated QRNG Hardware** | $0.0001-$0.01 | 1-16 Mbps | Commercial baseline |

**Key Insight:** Cloud quantum computers are 1000-10000x more expensive per bit than dedicated QRNG hardware. Use cloud QPUs for:
- Research validation
- Proof-of-concept
- Small entropy seeds
- Redundancy/diversity

---

## Gate Fidelity Impact on QRNG Quality

### Single-Qubit Gate Fidelity

| Provider | Technology | Gate Fidelity | QRNG Impact |
|----------|------------|---------------|-------------|
| IonQ Aria | Trapped-ion | 99.5%+ | Excellent quality |
| IBM Quantum | Superconducting | 99.9%+ | Excellent quality |
| Rigetti Ankaa-2 | Superconducting | 99%+ | Very good quality |
| Xanadu Borealis | Photonic | N/A (boson sampling) | Excellent quality |
| Google Sycamore | Superconducting | 99.9%+ | Excellent quality |

**Impact on QRNG:**
- Higher fidelity = better randomness quality
- Post-processing can compensate for lower fidelity
- Statistical tests required to validate output
- Hardware noise introduces temporal correlation

---

## Queue Time Analysis

### Typical Queue Times (Free Tier)

| Provider | Peak Hours | Off-Peak | Weekends |
|----------|------------|----------|----------|
| IBM Quantum (free) | 2-6 hours | 30-90 min | 10-30 min |
| IonQ (via qBraid) | 10-30 min | 5-15 min | 5-10 min |
| Xanadu Borealis | Low | Low | Low |
| AWS Braket | Variable | Variable | Variable |

**Optimization Strategies:**
1. Submit jobs during off-peak hours (nights, weekends)
2. Use job batching to reduce queue overhead
3. Maintain local entropy cache
4. Implement multi-provider fallback

---

## Recommendations by Use Case

### Research & Development
**Primary:** qBraid (1000 credits)
**Secondary:** IBM Quantum (10 min/month)
**Tertiary:** Xanadu Borealis ($1000 credits)

**Rationale:** qBraid provides multi-provider access with single integration point.

### Student Projects
**Primary:** Azure Quantum ($500/provider)
**Secondary:** qBraid (1000 credits)
**Tertiary:** QGSS 2025 (July 7-22)

**Rationale:** Students get maximum free credits via Azure.

### Production Validation
**Primary:** qBraid (purchase additional credits)
**Secondary:** AWS Braket (pay-as-you-go)
**Tertiary:** Xanadu Cloud (photonic diversity)

**Rationale:** Need reliable access with predictable costs.

### High-Assurance Environments
**Primary:** Dedicated QRNG hardware (ID Quantique)
**Fallback:** Cloud QPUs via qBraid rotation
**Compliance:** NIST SP 800-90B certified devices

**Rationale:** Compliance requires certified devices; cloud for redundancy.

---

## Provider Priority List (Zipminator Project)

### Tier 1: Primary Access (Free)
1. **qBraid Platform** - 1000 credits, multi-provider, unified API
2. **Xanadu Borealis** - $1000 credits (5M shots), 216 qubits
3. **IBM Quantum** - 10 min/month, proven QRNG implementation

### Tier 2: Student/Academic Access
4. **Azure Quantum** - $500/provider (student verification required)
5. **QGSS 2025** - July 7-22 hardware access (registration required)

### Tier 3: Simulator Fallback
6. **IonQ Simulator** - Free unlimited, 29 qubits
7. **IBM QASM Simulator** - Free unlimited, 32 qubits
8. **Cirq QVM** - Free unlimited, local

### Tier 4: Pay-As-You-Go
9. **AWS Braket** - Multiple providers, integrated with AWS
10. **Direct Provider APIs** - IonQ, Rigetti, Xanadu

### Tier 5: Production Hardware (Recommended)
11. **ID Quantique Quantis** - USB/PCIe/Chip, NIST certified
12. **Hardware QRNG** - Compliance baseline

---

## Integration Architecture

### Recommended Multi-Provider Stack

```
┌─────────────────────────────────────────────┐
│         Zipminator Application              │
│            (Kyber-768 KEM)                  │
└────────────────┬────────────────────────────┘
                 │
         ┌───────▼────────┐
         │  Entropy Pool  │
         │  (4-64 KB)     │
         └───────┬────────┘
                 │
    ┌────────────▼───────────────┐
    │   Multi-Provider Manager   │
    │   (Rotation & Fallback)    │
    └─────┬──────────────────────┘
          │
    ┌─────▼──────────────────────────────────┐
    │         qBraid Unified API             │
    │  (Single authentication, 24+ devices)  │
    └─────┬──────────────────────────────────┘
          │
    ┌─────▼─────────────────────────────────────┐
    │   Provider Rotation (Cost Optimization)    │
    ├────────────────┬──────────────┬────────────┤
    │ IBM Quantum    │ Xanadu       │ IonQ       │
    │ (Supercond.)   │ (Photonic)   │ (Ion-trap) │
    └────────────────┴──────────────┴────────────┘
```

---

## Next Steps

1. **Register for qBraid** - Primary access point (1000 credits)
2. **Setup IBM Quantum Account** - 10 min/month free
3. **Create Xanadu Cloud Account** - $1000 free credits
4. **Apply for Azure Quantum Credits** - If student/researcher
5. **Register for QGSS 2025** - July 7-22 hardware access
6. **Implement qBraid SDK Integration** - Python library
7. **Build Multi-Provider Fallback** - Rotation strategy
8. **Test QRNG Implementation** - Statistical validation
9. **Benchmark Providers** - Cost, throughput, quality
10. **Document Production Strategy** - Compliance requirements

---

## References

1. qBraid Platform: https://www.qbraid.com
2. IBM Quantum: https://quantum.ibm.com
3. Xanadu Quantum Cloud: https://cloud.xanadu.ai
4. IonQ Quantum Cloud: https://ionq.com/quantum-cloud
5. Microsoft Azure Quantum: https://azure.microsoft.com/quantum
6. AWS Amazon Braket: https://aws.amazon.com/braket
7. Research: "A Study of Gate-Based and Boson Sampling QRNG" (arXiv 2025)
8. QGSS 2025: https://www.qbraid.com/blog-posts/qiskit-global-summer-school-2025

---

**Document Maintenance:**
- Review quarterly for provider updates
- Update credit allocations as announced
- Monitor new provider integrations via qBraid
- Track QGSS 2025 registration opening
