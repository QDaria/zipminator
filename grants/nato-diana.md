# NATO DIANA (Defence Innovation Accelerator for the North Atlantic)

## Overview

NATO DIANA is NATO's innovation accelerator for dual-use deep technologies that address critical defense and security challenges. In December 2025, DIANA announced its largest-ever cohort of 150 innovators from 24 NATO countries for the 2026 Challenge Programme, which kicked off in January 2026.

DIANA provides funding, access to 16 accelerator sites and 200+ test centres across NATO's 32 member states, mentorship from scientists, engineers, industry experts, end-users and government procurement experts, and connections to trusted investors.

**Website:** https://www.diana.nato.int/
**Accelerator Programme:** https://www.diana.nato.int/accelerator-programme.html

## Eligibility

- Company must be registered in a **NATO member state** (Norway is a founding member)
- Must address one of DIANA's designated **challenge areas**
- Technology must be **dual-use** (civilian and defense applications)
- Startups, SMEs, and small teams of innovators eligible
- Must be willing to participate in the full accelerator programme (6-12 months)
- No restrictions on company age or revenue stage

### 2026 Challenge Areas (10 total)
1. Advanced Communications and Contested Electromagnetic Environments
2. Autonomy and Unmanned Systems
3. Energy and Power
4. Biotech and Human Resilience
5. Critical Infrastructure and Logistics
6. Sensing and Surveillance
7. Advanced Materials
8. Space Technologies
9. Cyber Defence and Information Security
10. Quantum Technologies

**Zipminator fits:** #1 (Advanced Communications), #5 (Critical Infrastructure), #9 (Cyber Defence), #10 (Quantum Technologies)

## Deadline

- The 2026 cohort was selected in December 2025 (applications closed earlier in 2025)
- **Next cohort (2027):** Application window expected to open in mid-2026
- Monitor: https://www.diana.nato.int/challenges.html
- Sign up for DIANA newsletter for early notification

## Amount

- **EUR 100,000** contractual funding per selected company (paid in full before Phase 1)
- Funding covers: solution development, travel to mandatory training/events
- **Non-financial value** is substantial:
  - Access to 200+ test centres across NATO
  - Mentorship network
  - Government procurement connections
  - Trusted investor community
  - Potential follow-on contracts with NATO and allied defense ministries

## Application Requirements

Based on 2025/2026 cycle:

1. **Online application form** via DIANA portal
2. **Technology description:** What the solution is and how it works
3. **Challenge relevance:** How the technology addresses the specific challenge area
4. **Dual-use justification:** Both civilian and defense applications
5. **Team description:** Key team members and their expertise
6. **Development stage:** Current TRL and roadmap
7. **Pitch video** (typically 3-5 minutes)
8. **IP ownership confirmation**
9. **No conflict of interest / foreign control declaration**

### Selection Process
- Initial screening by DIANA staff
- Expert panel evaluation
- Interview/pitch round
- Cohort announcement

## Key Contacts / URLs

- **DIANA Home:** https://www.diana.nato.int/
- **Challenges:** https://www.diana.nato.int/challenges.html
- **Accelerator Programme:** https://www.diana.nato.int/accelerator-programme.html
- **2026 Cohort Announcement:** https://www.nato.int/en/news-and-events/articles/news/2025/12/10/nato-defence-innovation-accelerator-announces-largest-ever-cohort-of-150-innovators-to-work-on-ten-defence-and-security-challenges-in-2026
- **Norway DIANA accelerator site:** Check for Norwegian host (VTT runs one in Finland; Norwegian Defence Research Establishment (FFI) may host)

---

## Draft Application

### For Next DIANA Challenge Cycle (2027 Cohort)

#### 1. Solution Name

**Zipminator** -- Post-Quantum Cryptographic Platform for NATO-Grade Secure Communications

#### 2. Challenge Area

**Primary:** Cyber Defence and Information Security
**Secondary:** Advanced Communications and Contested Electromagnetic Environments; Quantum Technologies

#### 3. Problem Statement

NATO forces and allied nations face an imminent cryptographic threat: adversaries with access to quantum computing (expected within 5-10 years) will be able to decrypt all communications secured with current RSA/ECC cryptography. The "harvest now, decrypt later" strategy means that classified communications intercepted today can be stored and decrypted once quantum computers mature. NATO must transition to quantum-resistant cryptography before this window closes.

Current challenges:
- No integrated PQC platform exists for defense deployment across multiple communication channels
- Classical-to-PQC migration is complex and error-prone without purpose-built tools
- Quantum entropy (true randomness from quantum hardware) is not yet integrated into defense cryptographic systems
- Interoperability across NATO allies requires standardized PQC implementations

#### 4. Solution Description

Zipminator is a production-grade post-quantum cryptography platform built on NIST-standardized algorithms:

**Core Technology:**
- Kyber768 KEM (FIPS 203 ML-KEM) implemented in Rust with constant-time guarantees
- Quantum entropy harvesting from NISQ quantum processors (IBM, Rigetti, qBraid -- 156 qubits)
- 300K+ lines of code across 8 integrated modules

**Defense-Relevant Modules:**
1. **Encrypted Messaging:** Quantum-safe messaging for command and control
2. **File Vault:** Classified document encryption with PQC and quantum entropy
3. **VPN:** Post-quantum VPN tunnel for secure battlefield communications
4. **Browser:** Quantum-safe web access for intelligence operations
5. **VoIP:** Encrypted voice communications resistant to quantum decryption
6. **Email Encryption:** PQC-secured email for inter-agency communications
7. **Device Shield:** Endpoint protection with quantum-resistant key management
8. **Key Management:** Centralized PQC key lifecycle management for large deployments

**Dual-Use:**
- Defense: NATO secure communications, classified document handling, tactical networks
- Civilian: Enterprise encryption, healthcare data protection, financial services, critical infrastructure

#### 5. Technology Readiness

- **Current TRL:** 6 (system demonstrated in relevant environment)
- **Target TRL after DIANA:** 7-8 (system prototype in operational environment)
- Kyber768 engine: fully functional and tested
- Product modules: functional prototypes with demo deployments
- Quantum entropy pipeline: operational with multiple quantum hardware providers

#### 6. Team

| Name | Role | Relevant Experience |
|------|------|-------------------|
| [CEO] | CEO / Founder | [Defense/security background] |
| [CTO] | CTO | [Cryptography/quantum computing expertise] |
| [LEAD] | Lead Engineer | Rust, systems security, PQC implementation |
| [ADVISOR] | Defense Advisor | [NATO/military experience] |

#### 7. NATO Value Proposition

- **Interoperability:** Standards-based (NIST FIPS 203/204/205) ensures cross-ally compatibility
- **Sovereignty:** Norwegian-developed, NATO-ally owned IP -- no foreign dependency
- **Speed to deployment:** 300K+ LOC already built; not starting from scratch
- **Scalability:** Modular architecture deploys from single-user to theater-wide
- **Quantum entropy:** Unique differentiator -- true quantum randomness for key generation

#### 8. Requested DIANA Support

- EUR 100,000 contractual funding for defense-specific adaptation
- Access to NATO test centres for interoperability testing
- Mentorship from defense procurement experts
- Connection to NATO Communications and Information Agency (NCIA)
- Investor introductions for Series A defense-tech round

#### 9. 6-Month Development Plan (Phase 1)

| Month | Milestone |
|-------|-----------|
| 1 | Defense requirements analysis with NATO end-users |
| 2-3 | STANAG compliance assessment and adaptation |
| 4 | Prototype deployment at DIANA test centre |
| 5 | Interoperability testing with allied PQC systems |
| 6 | Demo to NATO stakeholders and procurement pipeline entry |
