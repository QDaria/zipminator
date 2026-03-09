# NSF SBIR/STTR (National Science Foundation Small Business Innovation Research)

## Overview

The NSF SBIR/STTR programmes fund US small businesses to conduct research and development with commercial potential. NSF focuses on scientific and engineering innovation, with specific interest in cybersecurity, quantum information science, and advanced cryptographic systems.

NSF uses the "America's Seed Fund" brand for its SBIR/STTR programmes. Unlike other federal SBIR agencies, NSF accepts proposals across all areas of science and engineering, making it suitable for post-quantum cryptography at the intersection of computer science, mathematics, and quantum physics.

**Website:** https://seedfund.nsf.gov/
**SBIR/STTR programme:** https://www.nsf.gov/funding/pgm_summ.jsp?pims_id=505867

## Programme Details

| Phase | Amount (USD) | Duration | Purpose |
|-------|-------------|----------|---------|
| Phase I | $275,000 | 6-12 months | Establish technical feasibility and commercial merit |
| Phase II | $1,000,000 | 24 months | Develop prototype, continue R&D, demonstrate market potential |
| Phase IIB (supplement) | Up to $500,000 | 12 months | Supplement for Phase II awardees showing strong commercial traction |
| STTR Phase I | $275,000 | 12 months | Same as SBIR but requires research institution partner |
| STTR Phase II | $1,000,000 | 24 months | Same as SBIR Phase II with research institution partner |

**Key difference between SBIR and STTR:**
- SBIR: company performs primary R&D (minimum 2/3 of work in Phase I)
- STTR: requires formal partnership with a US research institution (university, federal lab); research institution performs at least 30% of work

## Eligibility

### SBIR Requirements
- **US small business**: organized for profit, with place of business in the US
- **Size**: fewer than 500 employees
- **Ownership**: at least 51% owned and controlled by US citizens or permanent residents
- **PI employment**: Principal Investigator must be primarily employed by the small business during the award
- **R&D performance**: small business must perform at least 2/3 of Phase I and 1/2 of Phase II R&D

### STTR Requirements
- Same company requirements as SBIR
- **Research institution partner**: US nonprofit research institution (university, federal lab, FFRDC)
- **PI affiliation**: PI may be employed by either the company or the research institution
- **Work split**: small business performs at least 40% of R&D; research institution performs at least 30%

### Path for QDaria AS (Norwegian Company)
QDaria would need a US entity to apply:
1. **Establish QDaria Inc.** in the US (Delaware incorporation, US office)
2. **Hire US-based PI** with relevant cryptography/quantum expertise
3. **Partner with US university** for STTR (e.g., MIT, Stanford, CMU, Georgia Tech)
4. Norwegian parent company can own up to 49% of the US subsidiary
5. Alternatively, majority US ownership with licensing agreement from QDaria AS

## Deadline

NSF SBIR/STTR uses the **Project Pitch** system:

1. **Project Pitch** (3-page summary): accepted on a **rolling basis** year-round
2. NSF reviews within 3 weeks and provides "encouraged" or "discouraged" determination
3. If encouraged, **full proposal** is invited for the next submission window
4. Full proposal deadlines: typically 3 windows per year (check seedfund.nsf.gov)

| Step | Timeline |
|------|----------|
| Project Pitch submission | Rolling (any time) |
| NSF response to Pitch | Within 3 weeks |
| Full proposal (if encouraged) | Next open window (quarterly) |
| Award notification | 4-6 months after full proposal |
| Phase I duration | 6-12 months from award |

## Amount

| Award Type | Amount | Duration | Follow-on |
|-----------|--------|----------|-----------|
| Phase I | $275,000 | 6-12 months | Leads to Phase II invitation |
| Phase II | $1,000,000 | 24 months | Leads to Phase IIB or Phase III |
| Phase IIB supplement | Up to $500,000 | 12 months | Requires 3rd-party investment match |
| Total SBIR pipeline | Up to $1,775,000 | 3-4 years | Plus Phase III (unlimited, non-SBIR) |

Phase III: No SBIR/STTR funding, but the federal government can award sole-source contracts for the technology developed under SBIR/STTR. This is where major DoD/civilian agency contracts come in.

## Key Requirements

### Project Pitch (3 pages)
1. **Company overview**: name, location, size, stage
2. **Innovation**: what is being developed and why it is novel
3. **Technical objectives**: what will be demonstrated in Phase I
4. **Commercial potential**: target market, customers, revenue model
5. **Team**: key personnel and relevant expertise

### Phase I Full Proposal
1. **Project Summary** (1 page)
2. **Project Description** (15 pages max):
   - Identification and significance of the problem or opportunity
   - Proposed innovation (technical approach)
   - Objectives and measurable milestones
   - Anticipated results
   - Commercial impact
3. **Biographical Sketches** of key personnel
4. **Budget and budget justification** ($275,000 max)
5. **Current and pending support** for all key personnel
6. **Data management plan**
7. **Postdoctoral mentoring plan** (if applicable)
8. **Letters of support** from potential customers/partners

### Phase II Proposal (invited only, after Phase I completion)
1. **Phase I results** and how they support Phase II
2. **Phase II research plan** (detailed technical approach for 24 months)
3. **Commercialization plan** (detailed market strategy, customer validation)
4. **Budget** ($1,000,000 max)

### NSF Merit Review Criteria
All NSF proposals are evaluated on two criteria:
- **Intellectual Merit**: How important and innovative is the proposed activity? Does the team have the expertise?
- **Broader Impacts**: What are the benefits to society? How will results be disseminated?

For SBIR/STTR, commercial potential is evaluated alongside these criteria.

## How Zipminator Fits

### NSF Topic Areas
QDaria's Zipminator-PQC platform aligns with multiple NSF research topics:

**1. Cybersecurity (C)**
- Post-quantum cryptographic infrastructure for enterprise and government
- Quantum-safe key management and certificate lifecycle
- Side-channel resistant cryptographic implementations

**2. Quantum Information Science (QIS)**
- Quantum entropy harvesting from NISQ-era processors (156 qubits)
- Integration of quantum random number generation into classical cryptographic systems
- Benchmarking quantum vs. classical entropy sources for cryptographic applications

**3. Advanced Computing (AC)**
- High-performance Rust implementation of lattice-based cryptography
- Constant-time Kyber768 with formal timing guarantees
- Cross-platform cryptographic libraries (Rust core, PyO3 bindings, WASM)

### Technical Innovation for NSF
What makes Zipminator novel from a research perspective:

1. **Quantum entropy integration**: No existing PQC platform combines NIST-standardized algorithms with real quantum entropy from NISQ hardware. This raises fundamental questions about entropy quality, characterization, and advantage over classical CSPRNGs.

2. **Full-stack PQC deployment**: Most PQC research addresses individual algorithms or protocols. Zipminator addresses the system-level challenge of transitioning 8 communication channels simultaneously.

3. **Constant-time Rust implementation**: Formal verification of constant-time properties in production Kyber768 code is an open research problem with practical security implications.

4. **Crypto-agile architecture**: Enabling algorithm substitution across a full product suite without service disruption is an engineering research challenge with broad applicability.

### Suggested Phase I Scope
Focus on the most research-novel aspect for NSF: **Quantum Entropy Characterization and Integration for Post-Quantum Cryptographic Systems**

Phase I would:
- Characterize entropy from 156-qubit quantum processors against NIST SP 800-90B
- Compare quantum entropy quality to classical CSPRNGs for Kyber768 key generation
- Develop and validate a hybrid quantum/classical entropy pipeline
- Publish results on entropy rate, min-entropy, and autocorrelation from NISQ sources
- Demonstrate integration with Zipminator's Kyber768 engine

### Suggested Phase II Scope
- Scale quantum entropy pipeline to production throughput
- Formal verification of constant-time Kyber768 implementation
- Enterprise deployment and benchmarking (100+ endpoints)
- Commercialization with US government pilot customers

## Application Checklist

- [ ] Establish US entity (QDaria Inc.) -- Delaware incorporation recommended
- [ ] Register on SAM.gov with US entity (required for federal awards)
- [ ] Register on Research.gov (NSF's proposal submission system)
- [ ] Obtain DUNS/UEI number for US entity
- [ ] Identify and hire US-based PI with cryptography/quantum expertise
- [ ] For STTR: establish formal partnership with US research institution
- [ ] Submit Project Pitch via seedfund.nsf.gov (3 pages, rolling acceptance)
- [ ] If encouraged, prepare full Phase I proposal (15-page project description)
- [ ] Prepare budget justification for $275,000
- [ ] Gather letters of support from potential US customers
- [ ] Prepare biographical sketches of key personnel
- [ ] Draft data management plan
- [ ] Review NSF SBIR/STTR solicitation for current-year specifics
- [ ] Submit full proposal through Research.gov by deadline

## Key Contacts / URLs

- **NSF Seed Fund (SBIR/STTR):** https://seedfund.nsf.gov/
- **Project Pitch submission:** https://seedfund.nsf.gov/project-pitch/
- **NSF SBIR programme:** https://www.nsf.gov/funding/pgm_summ.jsp?pims_id=505867
- **Research.gov (submission):** https://www.research.gov/
- **SBIR.gov (cross-agency):** https://www.sbir.gov/
- **NSF CISE directorate (cybersecurity):** https://www.nsf.gov/dir/index.jsp?org=CISE
- **NSF OMA (quantum):** https://www.nsf.gov/mps/quantum/
- **SAM.gov (registration):** https://sam.gov/
- **NSF SBIR/STTR FAQ:** https://seedfund.nsf.gov/resources/applicant/faq/

---

## Draft Application

### Project Pitch: Quantum Entropy-Enhanced Post-Quantum Cryptographic Platform

#### Company
**QDaria Inc.** (US subsidiary of QDaria AS, Norway)
Location: [US City, State]
Employees: [Number]
Stage: Pre-revenue, product-ready

#### Innovation

Zipminator-PQC is the first cryptographic platform to integrate NIST-standardized post-quantum algorithms (ML-KEM/Kyber768, FIPS 203) with true quantum entropy harvested from NISQ-era quantum processors (156 qubits). While NIST has standardized PQC algorithms, the quality and advantage of quantum entropy for cryptographic key generation remains an open scientific question with significant practical implications.

Our Phase I research will:
1. Rigorously characterize quantum entropy from 156-qubit processors against NIST SP 800-90B criteria
2. Compare quantum vs. classical entropy sources for Kyber768 key generation (security margin, randomness quality, min-entropy rate)
3. Develop a validated hybrid quantum/classical entropy pipeline suitable for production deployment
4. Publish open benchmarks enabling the broader community to evaluate quantum entropy for cryptographic use

#### Technical Objectives (Phase I)

**Objective 1:** Harvest and characterize entropy from IBM, Rigetti, and qBraid quantum processors. Measure min-entropy, autocorrelation, and bias using NIST SP 800-90B test suite. Target: min-entropy rate exceeding 0.9 bits/bit for processed output.

**Objective 2:** Implement and benchmark three entropy integration modes for Kyber768 key generation: (a) pure quantum entropy, (b) hybrid quantum/classical, (c) classical CSPRNG baseline. Measure key generation throughput, statistical quality, and side-channel exposure.

**Objective 3:** Develop a production-grade quantum entropy conditioning pipeline with health monitoring, entropy estimation, and automatic fallback. Target: 99.99% availability with sub-millisecond key generation latency.

**Objective 4:** Publish results in a peer-reviewed venue (CRYPTO, USENIX Security, or similar). Release open-source entropy characterization tools.

#### Commercial Potential

- **Market**: Global PQC market projected at USD 17.2B by 2030
- **Customers**: US federal agencies (DoD, DHS, NSA), critical infrastructure operators, financial institutions
- **Revenue model**: SaaS licensing, enterprise site licenses, managed PQC-as-a-Service
- **Competitive advantage**: Only integrated PQC platform with quantum entropy; Rust-native Kyber768 with 300K+ LOC across 8 modules
- **Phase III path**: DoD adoption via CNSA 2.0 mandate; DHS critical infrastructure protection

#### Team

| Name | Role | Expertise |
|------|------|-----------|
| [PI Name] | Principal Investigator | Post-quantum cryptography, quantum information science |
| [CTO] | Technical Lead | Rust systems programming, Kyber768 implementation |
| [CEO] | Business Lead | Defense technology, commercialization |
| [University PI] | Research Partner (STTR) | Quantum entropy, randomness testing |

#### Budget Summary (Phase I: $275,000)

| Category | Amount |
|----------|--------|
| Senior personnel (PI + technical leads) | $130,000 |
| Research institution subaward (STTR) | $60,000 |
| Quantum compute access (IBM, Rigetti, qBraid) | $35,000 |
| Equipment and cloud infrastructure | $20,000 |
| Travel (conferences, NSF meetings) | $10,000 |
| Indirect costs | $20,000 |
| **Total** | **$275,000** |
