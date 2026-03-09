# DARPA (Defence Advanced Research Projects Agency)

## Overview

DARPA funds high-risk, high-reward research and development for US national security. Several DARPA programmes are directly relevant to post-quantum cryptography, quantum networks, and cryptographic transition. While DARPA primarily funds US entities, foreign companies can participate as subcontractors or through US subsidiaries.

QDaria AS would need either a US-registered subsidiary, a US prime contractor partner, or to respond to specific BAAs (Broad Agency Announcements) that permit foreign participation.

**Website:** https://www.darpa.mil/
**Opportunities:** https://sam.gov/ (search for DARPA solicitations)

## Programme Details

### Relevant DARPA Offices and Programmes

**1. Information Innovation Office (I2O)**
- Cybersecurity, information assurance, network security
- Programmes on cryptographic agility and PQC transition

**2. Microsystems Technology Office (MTO)**
- Quantum information science
- Quantum networking and communication
- Post-quantum hardware security

**3. Defense Sciences Office (DSO)**
- Fundamental research in mathematics and cryptography
- Quantum computing foundations

### Funding Mechanisms

| Mechanism | Amount | Duration | Description |
|-----------|--------|----------|-------------|
| SBIR Phase I | $275,000 | 6-12 months | Feasibility study |
| SBIR Phase II | $1,000,000 | 24 months | Prototype development |
| SBIR Phase III | Varies | Varies | Commercialization (no SBIR funding; DoD contracts) |
| BAA (Broad Agency Announcement) | $500,000-$5,000,000+ | 1-5 years | Research proposal in response to specific programme |
| Office-Wide BAA | $500,000-$2,000,000 | 1-3 years | Open topic within office scope |
| Young Faculty Award | $500,000 | 2 years | Early-career researchers (academic) |

## Eligibility

### General Requirements
- **US entity preferred**: DARPA strongly prefers US-incorporated companies
- **Foreign participation**: Allowed as subcontractors under a US prime, or for specific BAAs that permit foreign entities
- **ITAR/EAR compliance**: Cryptographic technology is export-controlled; may require US entity for controlled work
- **Security clearance**: Some programmes require facility clearance (FCL) -- typically US entities only
- **Small business**: SBIR/STTR requires US small business (fewer than 500 employees) as prime

### Path for QDaria AS (Norwegian Company)
1. **Establish US subsidiary** (QDaria Inc.) registered in the US -- most viable long-term path
2. **Partner with US prime contractor** -- QDaria as foreign subcontractor
3. **Respond to BAAs permitting foreign participation** -- some DARPA BAAs explicitly allow foreign entities
4. **Norway-US bilateral agreements** -- NATO DIANA-adjacent, bilateral defense R&D agreements

### SBIR/STTR Eligibility (requires US entity)
- Organized for profit with place of business in the US
- At least 51% owned by US citizens or lawful permanent residents
- Fewer than 500 employees
- Principal investigator employed by the small business (SBIR) or affiliated research institution (STTR)

## Deadline

- **SBIR/STTR**: Periodic solicitations, typically 2-3 times per year. Check https://www.dodsbirsttr.mil/
- **BAAs**: Published on https://sam.gov/ with specific deadlines (varies by programme)
- **Office-Wide BAAs**: Rolling submissions; check each DARPA office
- **I2O Office-Wide BAA**: HR001125S0011 (check sam.gov for current status)
- **MTO Office-Wide BAA**: HR001125S0012 (check sam.gov for current status)

Monitor:
- https://sam.gov/ (search "DARPA" and filter by active solicitations)
- https://www.darpa.mil/work-with-us
- https://www.dodsbirsttr.mil/ (for SBIR/STTR)

## Amount

| Programme Type | Phase/Level | Amount (USD) | Duration |
|---------------|------------|-------------|----------|
| SBIR Phase I | Feasibility | $275,000 | 6-12 months |
| SBIR Phase II | Prototype | $1,000,000 | 24 months |
| BAA - Small | Research | $500,000-$1,000,000 | 12-24 months |
| BAA - Medium | Development | $1,000,000-$3,000,000 | 24-36 months |
| BAA - Large | Full programme | $3,000,000-$5,000,000+ | 36-60 months |

## Key Requirements

### For BAA Proposals
1. **Technical Volume** (varies by BAA, typically 15-25 pages):
   - Technical approach and innovation
   - Relevance to DARPA programme goals
   - Key technical risks and mitigation
   - Schedule and milestones
   - Deliverables
2. **Management Volume**:
   - Team qualifications and organizational chart
   - Facilities and equipment
   - Prior relevant experience
3. **Cost Volume**:
   - Detailed cost breakdown by task
   - Labor rates and hours
   - Materials, travel, subcontracts
   - Fee/profit structure
4. **Administrative**:
   - Representations and certifications
   - ITAR/EAR compliance
   - Data rights assertions
   - OCI (Organizational Conflict of Interest) disclosure

### For SBIR Phase I
1. **Technical Proposal** (max 20 pages):
   - Identification and significance of the problem
   - Technical objectives
   - Work plan and methodology
   - Related work and key personnel
   - Relationship with future R&D
2. **Cost Proposal**:
   - Budget with justification
   - Subcontractor budgets (if any)
3. **Company Commercialization Report** (via SBIR.gov)

## How Zipminator Fits

### Technical Alignment with DARPA Priorities
QDaria's Zipminator-PQC platform addresses several DARPA programme areas:

- **Cryptographic agility**: Zipminator's modular Rust Kyber768 engine enables rapid algorithm transition across 8 communication modules -- directly relevant to DARPA's interest in crypto-agile infrastructure
- **Post-quantum networks**: VPN, messaging, VoIP, and browser modules provide end-to-end PQC for tactical and enterprise networks
- **Quantum entropy**: 156-qubit quantum random number generation provides entropy sourcing that surpasses classical CSPRNG -- relevant to DARPA quantum information programmes
- **ML-KEM (FIPS 203)**: NIST-standardized Kyber768 implementation in Rust with constant-time guarantees
- **Side-channel resistance**: Constant-time Rust implementation designed against timing and power analysis attacks

### Relevant DARPA Programme Areas
1. **Cryptographic transition tools** -- Zipminator enables organizations to migrate from RSA/ECC to Kyber768 across all communication channels
2. **Quantum-resistant tactical communications** -- VPN, VoIP, messaging modules for defense use
3. **Quantum random number generation** -- 156-qubit entropy harvesting for cryptographic seed
4. **Zero-trust architecture with PQC** -- Device shield and key management modules

### US Market Entry Strategy
- Establish QDaria Inc. (US subsidiary) in a defense-tech hub (e.g., Arlington VA, San Diego CA)
- Partner with US defense prime for initial BAA proposals (e.g., Northrop Grumman, Raytheon, Leidos)
- SBIR Phase I through US subsidiary as a proof of concept
- Leverage NATO DIANA participation for US defense connections

## Application Checklist

- [ ] Determine entity structure: US subsidiary or US prime contractor partnership
- [ ] Register on SAM.gov (requires US entity or NATO CAGE code)
- [ ] Obtain DUNS/UEI number for the US entity
- [ ] Register on DSBS (Dynamic Small Business Search) if pursuing SBIR
- [ ] Monitor sam.gov for relevant DARPA BAAs (search: "post-quantum", "cryptographic", "quantum")
- [ ] Identify relevant DARPA programme manager (I2O or MTO) and request a meeting
- [ ] Prepare 2-page white paper for BAA submission (abstract + technical approach)
- [ ] If white paper is encouraged, await DARPA invitation for full proposal
- [ ] Prepare ITAR/EAR classification assessment for Zipminator technology
- [ ] Engage US defense counsel for export control compliance
- [ ] Prepare Commercialization Report (for SBIR via SBIR.gov)
- [ ] Identify US-based PI (Principal Investigator) if required
- [ ] Draft technical proposal following BAA-specific instructions

## Key Contacts / URLs

- **DARPA main:** https://www.darpa.mil/
- **DARPA opportunities:** https://www.darpa.mil/work-with-us
- **SAM.gov (solicitations):** https://sam.gov/
- **DoD SBIR/STTR:** https://www.dodsbirsttr.mil/
- **DARPA I2O:** https://www.darpa.mil/about/offices/i2o
- **DARPA MTO:** https://www.darpa.mil/about/offices/mto
- **DARPA Small Business Programs:** https://www.darpa.mil/work-with-us/for-small-businesses
- **Norway NATO CAGE code:** Check with Norwegian MoD for NATO entity registration

---

## Draft Application

### White Paper for DARPA I2O Office-Wide BAA

#### Title
**Quantum-Resilient Cryptographic Platform with Integrated Quantum Entropy for DoD Network Transition**

#### Technical Area
Post-Quantum Cryptography / Cryptographic Transition / Quantum Information Science

#### Problem Statement
The US Department of Defense operates millions of endpoints across tactical and enterprise networks, all secured with cryptographic algorithms vulnerable to quantum attack. NSA's Commercial National Security Algorithm Suite 2.0 (CNSA 2.0) mandates PQC transition beginning 2025, with full implementation by 2033. Current approaches address individual protocols (TLS, IPsec) in isolation. No integrated platform exists that transitions all communication channels simultaneously while maintaining operational continuity.

#### Technical Approach
QDaria has developed Zipminator, a production-grade PQC platform with:

1. **Kyber768 KEM engine** -- Rust implementation with formal constant-time guarantees (FIPS 203 ML-KEM compliant)
2. **8 communication modules** -- simultaneous PQC transition for messaging, file encryption, VPN, browser, VoIP, email, device protection, and key management
3. **Quantum entropy pipeline** -- real quantum random number generation from 156-qubit quantum processors (IBM, Rigetti, qBraid), exceeding NIST SP 800-90B entropy requirements
4. **Crypto-agile architecture** -- algorithm-swappable design allows transition to future NIST standards without platform replacement
5. **870,000+ lines of production code** -- not a prototype; ready for operational testing

#### Key Innovation
Integration of quantum-sourced entropy into a full-stack PQC platform. While classical CSPRNGs are computationally secure, true quantum randomness from physical quantum processes provides information-theoretic security guarantees for key generation. This is unique among PQC implementations.

#### Deliverables (Phase I -- 12 months, $500K)
- Deploy Zipminator in DoD-representative test network (100+ endpoints)
- Benchmark Kyber768 performance across all 8 modules vs. baseline RSA/ECC
- Validate quantum entropy pipeline against NIST SP 800-90B
- Deliver technical report on PQC transition methodology for DoD networks
- Prototype crypto-agility framework for future algorithm updates

#### Team
- QDaria AS (Norway) / QDaria Inc. (US subsidiary, to be established)
- [US academic partner -- e.g., university cryptography lab]
- [US defense integrator -- subcontractor for DoD network expertise]

#### Cost Estimate
- Phase I: $500,000 (12 months)
- Phase II (if awarded): $2,000,000 (24 months, full DoD pilot)

#### Foreign Participation Justification
QDaria AS is a Norwegian company (NATO founding member). Norway and the US have bilateral defense cooperation agreements. Zipminator technology addresses shared NATO quantum-security requirements. US subsidiary establishment is underway to ensure ITAR compliance and facilitate future DoD contracting.
