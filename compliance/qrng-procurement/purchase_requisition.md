# QRNG Hardware Purchase Requisition
**Date:** 2025-01-30
**Project:** Qdaria QRNG Integration
**Requisition ID:** QRNG-2025-001
**Priority:** High

---

## Executive Summary

This requisition requests approval for the purchase of ID Quantique Quantis USB Quantum Random Number Generator (QRNG) hardware to provide cryptographically secure entropy for the Qdaria quantum-resistant cryptography platform.

**Recommended Product:** Quantis USB QRNG
**Estimated Cost:** $1,500 USD
**Delivery Timeline:** 2-3 weeks from order
**Expected ROI:** Immediate security enhancement + FIPS 140-3 compliance pathway

---

## Product Specifications

### Primary Recommendation: Quantis USB QRNG

**Technical Specifications:**
- **Model:** Quantis USB (4 Mbit/s)
- **USB Identifiers:** VID: 0x0ABA, PID: 0x0101
- **Entropy Rate:** 4 Mbps (500 KB/s) true quantum entropy
- **Technology:** Quantum optics process (photon shot noise)
- **Form Factor:** USB 2.0/3.0 compatible device
- **Certifications:**
  - NIST Entropy Source Validation (ESV) Certificate #63
  - Eligible for FIPS 140-3 integration (prerequisite met)
  - Passes NIST SP800-22 and SP800-90B statistical tests
  - Dieharder test suite compliant
- **Operating Systems:** Linux, Windows, macOS (drivers included)
- **Physical Security:** Hardware-based entropy source with continuous self-monitoring
- **Status Monitoring:** Live verification with automatic failsafe shutdown

**Key Advantages:**
1. **True Quantum Randomness:** Exploits fundamental quantum uncertainty (photon behavior at semi-transparent mirror)
2. **Invulnerable to Environmental Attacks:** Quantum process resistant to side-channel attacks
3. **Continuous Monitoring:** Built-in health checks with automatic failover
4. **Industry Leading:** Most certified true RNG on the market (since 2001)
5. **Easy Integration:** Standard USB interface with comprehensive SDK
6. **Cost-Effective:** Entry-level pricing for enterprise-grade quantum entropy

---

## Vendor Information

### Primary Vendor: ID Quantique SA

**Company Details:**
- **Name:** ID Quantique SA
- **Address:** Chemin de la Marbrerie 3, 1227 Carouge/Geneva, Switzerland
- **Phone:** +41 22 301 83 71
- **Email:** info@idquantique.com
- **Website:** https://www.idquantique.com
- **Quote Request:** https://www.idquantique.com/random-number-generation/request-a-quote/

**Company Background:**
- Founded: 2001 (24 years in quantum security)
- Focus: Quantum-safe security solutions
- Market Position: Industry leader in QRNG technology
- Certifications: First quantum-based RNG with NIST ESV certification (IID track)

### Authorized Distributors (Alternative Sources)

1. **ATL - Advanced Telecommunications Laboratory**
   - URL: https://www.atl-fo.eu/en/products/id-quantique-quantum-encryption/
   - Region: Europe
   - Specialization: Quantum networking products

2. **Argocorp**
   - Specialization: PCIe high-throughput models
   - Region: International

3. **OptoScience**
   - Region: North America
   - URL: https://www.optoscience.com/our-vendors/idquantique/

---

## Pricing Structure

### Quantis USB (Recommended)
- **List Price:** $1,200 - $1,500 USD (estimated)
- **Academic Discount:** Potentially available (10-20% typical)
- **Volume Discount:** Available for orders of 3+ units
- **Support Package:** Included (basic), extended available
- **Software/Drivers:** Included at no additional cost

### Alternative Option: Quantis PCIe (If Higher Throughput Required)
- **Model:** Quantis PCIe-40M
- **Throughput:** 40 Mbps entropy (10x USB speed)
- **List Price:** $3,500 - $4,000 USD (estimated)
- **Recommendation:** Defer to future phase unless performance testing indicates USB insufficient

---

## Budget Allocation

| Item | Quantity | Unit Cost | Total |
|------|----------|-----------|-------|
| Quantis USB QRNG | 1 | $1,500 | $1,500 |
| Shipping (International) | 1 | $100 | $100 |
| Import Duties/Customs | 1 | $150 | $150 |
| Extended Support (Optional) | 1 | $250 | $250 |
| **Subtotal** | | | **$1,750** |
| **Contingency (10%)** | | | **$175** |
| **Total Requested** | | | **$1,925** |

**Approved Budget:** $1,500 (base unit) + $425 (contingency/shipping)

---

## Procurement Process

### Step 1: Quote Request (Week 1)
1. Submit quote request via IDQ website form
2. Specify:
   - Product: Quantis USB (4 Mbit/s)
   - Quantity: 1 unit
   - Purpose: Research & development, cryptographic entropy
   - Academic/research discount eligibility
   - Shipping destination: [Your Location]
   - Required delivery date: Within 3 weeks

### Step 2: Quote Review & PO Approval (Week 1-2)
1. Review formal quote from IDQ sales team
2. Verify:
   - Part numbers match specifications
   - Delivery timeline acceptable (2-3 weeks standard)
   - Support/warranty terms
   - Return policy (30 days typical)
3. Obtain internal purchase order approval
4. Finance department processes payment

### Step 3: Order Placement (Week 2)
1. Submit purchase order to IDQ
2. Provide:
   - Shipping address
   - Technical contact information
   - Billing details
3. Confirm order acknowledgment with tracking number

### Step 4: Delivery & Acceptance Testing (Week 3-4)
1. Receive hardware shipment
2. Verify physical condition
3. Run acceptance tests:
   - USB device recognition (VID/PID verification)
   - Driver installation (Linux/Windows)
   - Entropy quality testing (NIST suite)
   - Integration with existing test harness
4. Document installation and initial results

---

## Installation Requirements

### Hardware Requirements
- **USB Port:** USB 2.0 or higher (USB 3.0 recommended)
- **Power:** Bus-powered (no external power required)
- **Operating System:** Linux (primary), Windows/macOS (testing)
- **Disk Space:** 500 MB for drivers and utilities

### Software Requirements
- **Drivers:** Quantis driver package (provided by IDQ)
- **SDK:** libQuantis API for C/C++/Python integration
- **Testing Tools:** EasyQuantis GUI (included), NIST test suite
- **Integration:** Rust FFI bindings (custom development required)

### Development Integration
- **Phase 1:** Standalone testing and validation (1 week)
- **Phase 2:** Rust FFI wrapper development (1 week)
- **Phase 3:** Integration with Qdaria entropy pool (1 week)
- **Phase 4:** Performance benchmarking vs. /dev/urandom (1 week)
- **Phase 5:** Production deployment (after validation)

---

## Security & Compliance Benefits

### Immediate Security Improvements
1. **True Quantum Entropy:** Eliminates PRNG predictability vulnerabilities
2. **Side-Channel Resistance:** Quantum process immune to classical attacks
3. **Continuous Verification:** Hardware self-monitoring prevents entropy failure
4. **Cryptographic Quality:** NIST-validated entropy for key generation

### Compliance Pathway
1. **FIPS 140-3 Eligibility:** ESV-certified entropy source (prerequisite met)
2. **NIST SP800-90B:** Min-entropy estimation validated
3. **Common Criteria:** Suitable for EAL4+ evaluations
4. **Industry Standards:** Meets NIST, BSI, ANSSI requirements

### Risk Mitigation
- **Supply Chain Security:** Hardware-verified entropy (no software backdoors)
- **Long-Term Security:** Quantum-based process remains secure vs. quantum computers
- **Audit Trail:** Hardware provides verifiable randomness source
- **Disaster Recovery:** USB form factor enables easy backup/replacement

---

## Return on Investment (ROI)

### Quantitative Benefits
| Metric | Current State | With QRNG | Improvement |
|--------|---------------|-----------|-------------|
| Entropy Quality | PRNG (OS) | True QRNG | Cryptographic guarantee |
| Kyber768 Keygen | ~5,200 ops/sec | ~5,200 ops/sec | No performance loss |
| Entropy Rate | 128 MB/s (/dev/urandom) | 4 Mbps (500 KB/s) | Sufficient for workload |
| FIPS 140-3 Ready | No | Yes | Compliance pathway |
| Audit Cost | High (PRNG validation) | Low (HW certified) | 50-70% reduction |

### Qualitative Benefits
1. **Market Differentiation:** "Quantum-powered entropy" marketing advantage
2. **Customer Confidence:** Hardware-verified security for enterprise clients
3. **Regulatory Approval:** Faster certification for government/financial sectors
4. **Future-Proofing:** Quantum-safe entropy for next 20+ years
5. **Research Publications:** Academic credibility for quantum security claims

### Cost Avoidance
- **Certification Costs:** $50,000 - $150,000 saved (FIPS 140-3 faster path)
- **Security Incidents:** Unmeasurable (prevents potential PRNG exploitation)
- **Re-architecture:** $20,000+ saved (no redesign for entropy source later)

**Payback Period:** Immediate (compliance benefits) + 6-12 months (market differentiation)

---

## Alternatives Considered

### Option 1: Continue with /dev/urandom (Rejected)
- **Cost:** $0
- **Cons:**
  - No quantum entropy guarantee
  - FIPS 140-3 certification difficult/impossible
  - Market differentiation lost
  - Long-term security concerns (quantum computing advances)
- **Decision:** Insufficient for production cryptographic system

### Option 2: Software-Based Entropy Enhancement (Rejected)
- **Examples:** HAVEGE, jitterentropy
- **Cost:** $0 (open source)
- **Cons:**
  - Not true quantum entropy
  - Vulnerable to side-channel attacks
  - Limited certification pathways
  - Academic credibility concerns
- **Decision:** Doesn't meet security objectives

### Option 3: Alternative QRNG Vendors (Considered)
- **Examples:** Quintessence Labs, QuantumCTek
- **Pros:** Potential cost savings
- **Cons:**
  - Less mature certification (no NIST ESV)
  - Fewer integration resources
  - Unknown long-term support
- **Decision:** ID Quantique offers best certification + ecosystem

### Option 4: PCIe High-Throughput Model (Deferred)
- **Model:** Quantis PCIe-40M (40 Mbps)
- **Cost:** $3,500 - $4,000
- **Pros:** 10x throughput
- **Cons:**
  - 2.5x cost increase
  - Current workload doesn't require high throughput
  - Less portable (PCIe vs. USB)
- **Decision:** Defer to Phase 2 if USB proves insufficient

---

## Risk Assessment

### Technical Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| USB driver compatibility issues | Low | Medium | Test on multiple platforms; vendor support |
| Insufficient entropy rate | Very Low | High | 4 Mbps exceeds current needs (32 KB key = 0.05s) |
| Integration complexity | Medium | Medium | Allow 4 weeks integration timeline |
| Hardware failure | Low | Medium | 2-year warranty; consider spare unit |

### Procurement Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Delivery delay (>3 weeks) | Medium | Low | Order early; maintain /dev/urandom fallback |
| Price increase | Low | Low | Budget includes 10% contingency |
| Export restrictions | Very Low | High | Verify Swiss export controls; provide documentation |
| Payment issues | Low | Medium | Use institutional purchase order |

### Operational Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Learning curve (integration) | Medium | Low | Comprehensive SDK documentation available |
| Performance regression | Very Low | High | Benchmark thoroughly before production |
| Compliance audit failure | Very Low | High | Use vendor's certified configuration |

---

## Approval Chain

### Required Approvals

1. **Technical Lead (Principal Investigator)**
   - Name: _________________________
   - Signature: ____________________ Date: __________
   - Approval: Technical specifications and integration plan

2. **Financial Officer (Budget Authority)**
   - Name: _________________________
   - Signature: ____________________ Date: __________
   - Approval: Budget allocation and procurement process

3. **Security Officer (Compliance)**
   - Name: _________________________
   - Signature: ____________________ Date: __________
   - Approval: Security requirements and risk assessment

4. **Department Head (Final Authority)**
   - Name: _________________________
   - Signature: ____________________ Date: __________
   - Approval: Project alignment and resource allocation

---

## Next Steps

Upon approval:

1. **Immediate (Week 1):**
   - Submit quote request to ID Quantique
   - Prepare purchase order documentation
   - Assign technical lead for integration

2. **Short-Term (Week 2-4):**
   - Process payment and place order
   - Monitor delivery status
   - Prepare test environment

3. **Medium-Term (Week 5-8):**
   - Conduct acceptance testing
   - Develop Rust integration layer
   - Performance benchmarking

4. **Long-Term (Week 9-12):**
   - Production integration
   - Documentation updates
   - FIPS 140-3 pre-validation planning

---

## Supporting Documentation

- Vendor technical datasheets (Appendix A)
- NIST ESV Certificate #63 (Appendix B)
- Compliance roadmap (see `compliance/qrng-procurement/integration_plan.md`)
- Budget justification details (see `compliance/qrng-procurement/budget_justification.md`)
- Vendor comparison matrix (see `compliance/qrng-procurement/vendor_comparison.md`)

---

## Contact Information

**Requisition Prepared By:**
[Your Name]
[Title]
[Email]
[Phone]
[Date]

**Vendor Contact:**
ID Quantique SA
info@idquantique.com
+41 22 301 83 71
https://www.idquantique.com/random-number-generation/request-a-quote/

**Internal Procurement Contact:**
[Procurement Officer Name]
[Email]
[Phone]

---

**Requisition Status:** PENDING APPROVAL
**Last Updated:** 2025-01-30
**Version:** 1.0
