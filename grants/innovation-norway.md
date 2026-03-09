# Innovation Norway (Innovasjon Norge)

## Overview

Innovation Norway is the Norwegian government's instrument for innovation and development of Norwegian enterprises and industry. They offer startup grants (Oppstartstilskudd) in phases, as well as Innovation Contracts (formerly IFU/OFU) for collaborative R&D with pilot customers.

**Website:** https://en.innovasjonnorge.no/
**Portal:** https://www.innovasjonnorge.no/ (Norwegian)

### Relevant Programs

1. **Startup Grant Phase 1 (Market Clarification):** Up to NOK 150,000 (100% funding) for validating customer demand and market research.
2. **Startup Grant Phase 2 (Commercialization):** Up to NOK 1,000,000 (50% co-financing required from private capital).
3. **Innovation Contracts (Innovasjonskontrakter):** Co-finances R&D when developing a solution for a demanding "pilot customer." Covers up to 45-50% of development costs for SMEs. Pilot customer must cover at least 20% of total project costs.
4. **Funding for Innovation Projects:** For companies with growth strategy based on innovation, strengthening competitiveness and sustainable growth.

## Eligibility

- Norwegian-registered company (AS or equivalent)
- Startup grants: company registered for less than 3-5 years
- Innovation Contracts: Norwegian SME developing new products/services with a pilot customer
- Must demonstrate international growth potential
- Innovation must be new to the market (not just new to the company)
- For Innovation Contracts: contractual cooperation between supplier and pilot customer required

## Deadline

- **Rolling applications** -- no fixed deadlines for startup grants
- Innovation Contracts: rolling, but processing time is 4-8 weeks
- Apply via Innovasjon Norge's digital portal

## Amount

| Program | Amount | Co-financing |
|---------|--------|-------------|
| Phase 1 - Market Clarification | Up to NOK 150,000 | 100% funded |
| Phase 2 - Commercialization | Up to NOK 1,000,000 | 50% private co-financing |
| Innovation Contracts | NOK 1-10M+ | Up to 45-50% of dev costs |
| Innovation Projects | NOK 1-5M | Varies by project |

## Application Requirements

### Startup Grants
- Company registration documentation
- Business plan with market analysis
- Description of the innovation and its market novelty
- Budget and financing plan
- Team CVs and competence overview
- Customer validation evidence (Phase 2)
- Private co-financing documentation (Phase 2)

### Innovation Contracts
- Signed Letter of Intent with pilot customer
- Detailed project plan with milestones and deliverables
- R&D description and technical risk assessment
- Budget with cost breakdown (developer costs, pilot customer costs)
- Market potential analysis with export ambitions
- Description of IPR strategy
- Pilot customer commitment (minimum 20% of total costs)

## Key Contacts / URLs

- **Main portal:** https://en.innovasjonnorge.no/
- **Startup grants:** https://en.innovasjonnorge.no/article/startups
- **Innovation Contracts:** https://en.innovasjonnorge.no/article/innovation-contracts
- **Innovation projects:** https://en.innovasjonnorge.no/article/funding-for-innovation-projects
- **Regional office (Oslo):** +47 22 00 25 00
- **Contact form:** https://www.innovasjonnorge.no/kontakt

---

## Draft Application

### For Innovation Contracts (Primary Target)

#### 1. Company Description

**QDaria AS** is a Norwegian deep-tech startup developing Zipminator, a post-quantum cryptography (PQC) platform built on NIST-standardized Kyber768 lattice-based key encapsulation. The platform comprises 300K+ lines of code across 8 product modules, delivering quantum-resistant encryption for enterprise, government, and critical infrastructure.

**Founded:** [YEAR]
**Org.nr:** [TBD]
**Employees:** [NUMBER]
**Location:** [CITY], Norway

#### 2. The Innovation

Zipminator addresses the "harvest now, decrypt later" quantum threat by providing:

- **Kyber768 KEM Engine:** Rust-native implementation with constant-time operations, exposed via PyO3 bindings
- **Quantum Entropy Pool:** Real quantum random number generation from IBM/Rigetti/qBraid quantum hardware (156 qubits)
- **8 Product Modules:** Encrypted messaging, file vault, VPN, browser, VoIP, email encryption, device shield, key management
- **Post-Quantum PKI Transition Tools:** Drop-in replacement for classical TLS/PKI infrastructure

This innovation is new to the global market. While NIST published PQC standards in August 2024, no integrated platform exists that combines Kyber768 KEM with quantum-sourced entropy and a full product suite for enterprise deployment.

#### 3. Pilot Customer Cooperation

**Pilot Customer:** [NAME OF PILOT CUSTOMER -- e.g., a Norwegian government agency, defense contractor, telecom, or critical infrastructure operator]

**Cooperation Description:**
- Pilot customer will deploy Zipminator in [SPECIFIC USE CASE]
- Joint development of [SPECIFIC FEATURES] tailored to pilot customer's requirements
- Testing and validation in pilot customer's production environment
- Feedback loop for product refinement over [DURATION] months

**Pilot Customer Contribution:** NOK [AMOUNT] (minimum 20% of total project costs)

#### 4. Project Plan

| Phase | Duration | Activities | Cost (NOK) |
|-------|----------|-----------|------------|
| 1. Requirements & Architecture | 3 months | Joint requirements analysis, system architecture for pilot deployment | [AMOUNT] |
| 2. Core Development | 6 months | Kyber768 integration, API development, pilot-specific features | [AMOUNT] |
| 3. Integration & Testing | 3 months | Deployment in pilot environment, security testing, performance validation | [AMOUNT] |
| 4. Validation & Scale | 3 months | Production validation, documentation, scale-up preparation | [AMOUNT] |
| **Total** | **15 months** | | **NOK [TOTAL]** |

#### 5. Market Potential

- **Global PQC market:** Projected to reach USD 17.2B by 2030 (CAGR 44.2%)
- **EU PQC mandate:** All EU member states must begin PQC transition by end of 2026
- **Norwegian defense/government:** Subject to NATO quantum-safe requirements
- **Export potential:** Direct applicability to all NATO/EU markets
- **Competitive advantage:** First-to-market integrated PQC platform with quantum entropy

#### 6. Team

| Name | Role | Key Competence |
|------|------|---------------|
| [CEO NAME] | CEO / Founder | [BACKGROUND] |
| [CTO NAME] | CTO | [BACKGROUND] |
| [LEAD DEV] | Lead Developer | Rust, cryptography, quantum computing |
| [ADDITIONAL] | [ROLE] | [BACKGROUND] |

#### 7. Budget Summary

| Cost Category | Developer (QDaria) | Pilot Customer | Total |
|--------------|-------------------|----------------|-------|
| Personnel | NOK [AMOUNT] | NOK [AMOUNT] | NOK [AMOUNT] |
| Equipment/Infrastructure | NOK [AMOUNT] | NOK [AMOUNT] | NOK [AMOUNT] |
| External Services | NOK [AMOUNT] | -- | NOK [AMOUNT] |
| Other Costs | NOK [AMOUNT] | NOK [AMOUNT] | NOK [AMOUNT] |
| **Total** | **NOK [AMOUNT]** | **NOK [AMOUNT]** | **NOK [TOTAL]** |

**Requested from Innovation Norway:** NOK [AMOUNT] (45% of developer costs)
**Pilot Customer Contribution:** NOK [AMOUNT] (20%+ of total)
**Own Financing:** NOK [AMOUNT]

#### 8. IPR Strategy

- Zipminator core IP is owned 100% by QDaria AS
- Patents: [FILED/PLANNED for specific innovations]
- Open-source components use permissive licenses (MIT/Apache 2.0)
- Proprietary enterprise features under commercial license
- Trade secrets protected for quantum entropy harvesting methods

#### 9. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Pilot customer delays | Medium | Medium | Milestone-based contract with clear deliverables |
| Technical complexity in integration | Low | High | Modular architecture allows incremental deployment |
| Regulatory changes to PQC standards | Low | Medium | Built on NIST-standardized Kyber768 (FIPS 203) |
| Competitive pressure | Medium | Medium | First-mover advantage + quantum entropy differentiation |
