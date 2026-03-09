# Horizon Europe -- Post-Quantum Cryptography Calls (HORIZON-CL3)

## Overview

Horizon Europe Cluster 3 (Civil Security for Society) includes dedicated calls for post-quantum cryptography research and innovation, managed by the European Cybersecurity Competence Centre (ECCC). The 2025 work programme allocated EUR 90.55 million for cybersecurity R&I, with three PQC-specific calls.

Norway participates in Horizon Europe as an EEA/EFTA associated country with full eligibility for grants.

**ECCC Portal:** https://cybersecurity-centre.europa.eu/
**Horizon Europe:** https://ec.europa.eu/info/funding-tenders/opportunities/portal/

### Three PQC-Specific Calls (2025)

1. **Security evaluations of PQC primitives** -- EUR 4M total (EUR 2-3M per project). Research and Innovation Action (RIA).
2. **Security of implementations of PQC algorithms** -- EUR 6M total (EUR 2-3M per project). RIA.
3. **Integration of PQC algorithms into high-level protocols** -- EUR 6M total (EUR 2-3M per project). RIA.

## Eligibility

- Minimum consortium of **3 independent legal entities from 3 different EU/associated countries**
- Norway is an associated country (full eligibility)
- SMEs, universities, research institutes, and large enterprises all eligible
- Project coordinator can be any eligible entity
- RIA funding rate: **100% of eligible costs** (no co-financing required for RIA)
- At least one partner from an EU member state recommended

### Consortium Building
Zipminator/QDaria should form a consortium with partners such as:
- A university/research lab in Germany, France, or Netherlands (strong PQC research)
- An SME or large enterprise in another EU/associated country
- Potentially a national cybersecurity agency or CERT as end-user

## Deadline

- **HORIZON-CL3-2025-02-CS-ECCC:** Deadline was **12 November 2025** at 17:00 CET
- **2026 calls:** Expected to be published in Horizon Europe Work Programme 2025-2027 updates. Monitor the Funding & Tenders Portal.
- Next PQC-relevant calls likely in late 2026 or early 2027

## Amount

| Call | Total Budget | Per Project | Type | Funding Rate |
|------|-------------|------------|------|-------------|
| PQC primitives security evaluation | EUR 4M | EUR 2-3M | RIA | 100% |
| PQC implementation security | EUR 6M | EUR 2-3M | RIA | 100% |
| PQC integration into protocols | EUR 6M | EUR 2-3M | RIA | 100% |

## Application Requirements

### Proposal Structure (RIA -- Part B)

**Section 1: Excellence (max ~20 pages for full proposal)**
- 1.1 Objectives and ambition
- 1.2 Methodology (approach, WPs, tasks, deliverables, milestones)
- 1.3 Interdisciplinary and intersectoral approach

**Section 2: Impact**
- 2.1 Project results and their contribution to expected outcomes
- 2.2 Communication, dissemination, and exploitation
- 2.3 Summary of measures to maximise impact (impact plan)

**Section 3: Implementation**
- 3.1 Work plan (WP descriptions, Gantt chart, PERT diagram)
- 3.2 Management structure, milestones, and deliverables
- 3.3 Consortium description and capability
- 3.4 Resources (budget per partner, person-months per WP)

**Annexes:**
- CVs of key personnel (Section 4)
- Ethics and security self-assessment (Section 5)
- Letters of support from associated partners
- Gender equality plan references

### Evaluation Criteria
- **Excellence:** 5/5 threshold, weight 50%
- **Impact:** 5/5 threshold, weight 30%
- **Implementation:** 5/5 threshold, weight 20%
- Overall threshold: 10/15

## Key Contacts / URLs

- **Funding & Tenders Portal:** https://ec.europa.eu/info/funding-tenders/opportunities/portal/
- **ECCC calls:** https://cybersecurity-centre.europa.eu/funding-opportunities/calls-proposals/
- **PQC integration call details:** https://eufundingportal.eu/integration-of-post-quantum-cryptography-pqc-algorithms-into-high-level-protocols/
- **Norway NCP for Security:** Contact Research Council of Norway / Innovation Norway EU advisory
- **NKCS (German NCC):** https://www.nkcs.bund.de/en/ (example national coordination centre)

---

## Draft Application

### Target Call: Integration of PQC Algorithms into High-Level Protocols

#### 1. Project Acronym and Title

**PQ-TRANSIT: Post-Quantum TRansition of Applications, Networks, and Security Infrastructure Technologies**

#### 2. Project Summary

PQ-TRANSIT will develop, validate, and demonstrate the integration of NIST-standardized post-quantum cryptographic algorithms (ML-KEM/Kyber768, ML-DSA/Dilithium) into production-grade high-level protocols including TLS 1.3, IPsec/IKEv2, S/MIME, and Signal Protocol. Building on QDaria's Zipminator platform (870K+ LOC, Kyber768 engine), the project will deliver open-source hybrid PQC transition tools, performance benchmarks for European network infrastructure, and pilot deployments in telecom, healthcare, and government environments across 4 European countries.

#### 3. Consortium

| # | Partner | Country | Type | Role |
|---|---------|---------|------|------|
| 1 | QDaria AS | Norway | SME | Coordinator. Zipminator PQC platform, TLS/VPN integration |
| 2 | [University -- e.g., TU Darmstadt, KU Leuven, or CWI] | Germany/Belgium/Netherlands | University | Cryptographic protocol analysis, formal verification |
| 3 | [SME -- e.g., post-quantum.com, cryptonext-security.com] | UK/France | SME | PQC library development, PKI transition tools |
| 4 | [Large enterprise -- e.g., Deutsche Telekom, Orange, Ericsson] | Germany/France/Sweden | Large Enterprise | Network infrastructure testing, pilot deployment |
| 5 | [National CERT or cybersecurity agency] | Any EU country | Public Body | End-user validation, policy recommendations |

#### 4. Work Packages

| WP | Title | Lead | Person-Months | Budget |
|----|-------|------|--------------|--------|
| WP1 | PQC-TLS 1.3: Hybrid Key Exchange | QDaria (NO) | 24 PM | EUR [AMT] |
| WP2 | PQC-IPsec/IKEv2: VPN Transition | [Partner 3] | 18 PM | EUR [AMT] |
| WP3 | PQC-S/MIME & Secure Messaging | QDaria (NO) | 18 PM | EUR [AMT] |
| WP4 | Formal Protocol Verification | [Partner 2] | 24 PM | EUR [AMT] |
| WP5 | Pilot Deployment & Benchmarking | [Partner 4] | 18 PM | EUR [AMT] |
| WP6 | Dissemination, Exploitation & Standardization | QDaria (NO) | 12 PM | EUR [AMT] |
| WP7 | Project Management | QDaria (NO) | 6 PM | EUR [AMT] |

#### 5. Excellence

**Objectives:**
1. Integrate ML-KEM (Kyber768) and ML-DSA (Dilithium) into TLS 1.3 with hybrid mode, achieving less than 10% handshake latency overhead
2. Develop PQC-IPsec/IKEv2 for enterprise VPN with backwards compatibility
3. Deliver PQC-secured S/MIME and messaging protocol implementations
4. Formally verify protocol security properties using automated tools
5. Pilot in 3+ operational environments and publish open benchmarks

**Beyond state of the art:**
- Zipminator already has a production Kyber768 engine; this project integrates it into standard protocols (not starting from algorithmic scratch)
- Quantum entropy integration provides unique security margin beyond what mathematical PQC alone offers
- Full-stack approach: from TLS handshake through VPN tunnel to application-layer messaging

#### 6. Impact

**Expected outcomes:**
- Open-source PQC transition toolkit used by 100+ organizations within 2 years of project end
- Input to IETF, ETSI, and ISO standardization (3+ contributions)
- Policy recommendations for EU PQC roadmap implementation
- Training materials for 500+ European cybersecurity professionals
- Direct support for EU mandate: PQC transition to begin by end of 2026

**Exploitation plan:**
- QDaria: commercial Zipminator enterprise licenses
- University partners: research publications and follow-on projects
- Industry partners: PQC-enabled product lines
- Open-source tools: community maintenance under Apache 2.0

#### 7. Budget

| Partner | Personnel | Travel | Equipment | Subcontracting | Other | Total |
|---------|-----------|--------|-----------|---------------|-------|-------|
| QDaria (NO) | EUR [AMT] | EUR [AMT] | EUR [AMT] | EUR [AMT] | EUR [AMT] | EUR [AMT] |
| [University] | EUR [AMT] | EUR [AMT] | EUR [AMT] | -- | EUR [AMT] | EUR [AMT] |
| [SME] | EUR [AMT] | EUR [AMT] | EUR [AMT] | -- | EUR [AMT] | EUR [AMT] |
| [Large Ent.] | EUR [AMT] | EUR [AMT] | EUR [AMT] | -- | EUR [AMT] | EUR [AMT] |
| [Public Body] | EUR [AMT] | EUR [AMT] | -- | -- | EUR [AMT] | EUR [AMT] |
| **Total** | | | | | | **EUR 2.8M** |

Funding rate: 100% (RIA)

#### 8. Timeline

- **Duration:** 36 months
- **Start:** M1 (estimated Q2 2027 for next call cycle)
- **Key milestones:**
  - M6: PQC-TLS 1.3 prototype
  - M12: PQC-IPsec prototype, first formal verification results
  - M18: Mid-term review, pilot deployment begins
  - M24: All protocol integrations complete
  - M30: Pilot evaluation complete
  - M36: Final deliverables, standardization contributions, exploitation
