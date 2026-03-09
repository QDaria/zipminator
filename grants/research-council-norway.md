# Research Council of Norway (Forskningsradet)

## Overview

The Research Council of Norway (Norges forskningsrad) is the primary funder of research and innovation in Norway, allocating approximately NOK 10 billion annually. Two programs are directly relevant to Zipminator:

1. **IPN (Innovasjonsprosjekt i Naeringslivet):** Innovation Projects for the Industrial Sector. Industry-led R&D projects where a company leads and may partner with research institutions.
2. **KPN (Kompetanseprosjekt for Naeringslivet):** Competence Projects for the Industrial Sector. Research institution-led projects addressing industry needs, requiring industry co-financing.

**Website:** https://www.forskningsradet.no/en/

## Eligibility

### IPN (Innovation Project for Industry)
- Norwegian-registered company must be the project owner
- R&D activities must represent a significant portion of the project
- Must involve collaboration with at least one approved research institution (university, SINTEF, FFI, etc.)
- The project must address challenges relevant to Norwegian industry
- International partners are allowed but Norwegian project owner is mandatory
- SMEs receive higher aid intensity (up to 50% of eligible costs)

### KPN (Competence Project for Industry)
- A Norwegian research institution must be the project owner
- At least two industry partners must co-finance and participate
- Industry partners must collectively contribute minimum 20% of total budget
- Must address knowledge gaps relevant to industry

## Deadline

- **IPN:** Typically annual calls, usually opening in spring with deadline in September. Check https://www.forskningsradet.no/en/call-for-proposals/ for 2026 dates.
- **KPN:** Separate call cycle, often with similar timing.
- Processing time: approximately 4-6 months after deadline.

## Amount

| Program | Duration | Total Budget | NFR Contribution |
|---------|----------|-------------|-----------------|
| IPN | 1-4 years | Up to NOK 20M | Up to 50% for SMEs |
| KPN | 3-5 years | NOK 4-20M | Up to 80% of research costs |

- IPN: NFR covers up to 50% of eligible costs for SMEs (45% for large enterprises)
- KPN: NFR covers up to 80% of research institution costs; industry covers min 20%

## Application Requirements

### IPN Application Structure
1. **Project description** (max 10 pages):
   - Objectives, research questions, and hypotheses
   - State of the art and knowledge frontier
   - R&D activities and methodology
   - Project organization and management
   - Budget and financing plan
   - Value creation and societal impact
2. **CV of project manager** (max 4 pages)
3. **CVs of key personnel** (max 4 pages each)
4. **Partner letters of commitment**
5. **Collaboration agreement** (if consortium)
6. **Budget details in Forskningsradet's template**

### Evaluation Criteria (IPN)
- **Research quality and innovation** (weight varies)
- **Impact and value creation potential**
- **Implementation quality** (project plan, team, management)
- **Relevance** to the call's thematic priorities

### KPN Application Structure
- Similar to IPN but led by a research institution
- Must demonstrate clear industry relevance and engagement
- Industry partners provide binding co-financing letters

## Key Contacts / URLs

- **Main portal:** https://www.forskningsradet.no/en/
- **Current calls:** https://www.forskningsradet.no/en/call-for-proposals/
- **IPN info:** https://www.forskningsradet.no/en/call-for-proposals/2025/innovation-project-industrial-sector-industry-services/
- **My RCN (application portal):** https://www.forskningsradet.no/mitt-nfr/
- **Contact:** post@forskningsradet.no / +47 22 03 70 00
- **Thematic areas:** ICT, security, quantum technology

---

## Draft Application

### IPN: Post-Quantum Cryptographic Infrastructure for Norwegian Critical Systems

#### 1. Project Title

**Q-SAFE: Quantum-Secure Architecture for Enterprise (Kvantesikker arkitektur for norsk naeringslivsinfrastruktur)**

#### 2. Project Summary

Q-SAFE will advance the state of the art in post-quantum cryptographic deployment for Norwegian critical infrastructure. Building on QDaria's Zipminator platform (Kyber768 KEM engine, 300K+ LOC), this project will conduct R&D on:

- Hybrid classical/post-quantum key exchange protocols optimized for Norwegian telecom networks
- Quantum entropy harvesting from NISQ-era quantum processors for cryptographic seed generation
- Formal verification of constant-time Kyber768 implementations against side-channel attacks
- Scalable PQC key management for multi-tenant enterprise environments
- Performance benchmarking of PQC in latency-sensitive Norwegian infrastructure (oil/gas SCADA, maritime, defense)

#### 3. Research Questions

1. How can hybrid PQC/classical key exchange be deployed in existing Norwegian telecom infrastructure with less than 5% latency overhead?
2. What is the achievable entropy rate from NISQ quantum processors for cryptographic applications, and how does it compare to classical CSPRNG?
3. Can formal verification methods prove the absence of timing side-channels in production Kyber768 implementations?
4. What are the performance characteristics of PQC key management at scale (10K+ concurrent endpoints)?

#### 4. State of the Art

NIST published the first PQC standards in August 2024 (FIPS 203 ML-KEM/Kyber, FIPS 204 ML-DSA/Dilithium, FIPS 205 SLH-DSA/SPHINCS+). The EU has mandated PQC transition to begin by end of 2026. Norway's national quantum initiative (NOK 1.75B) signals strategic priority. However, significant R&D gaps remain:

- No validated hybrid deployment models for Nordic telecom infrastructure
- Quantum entropy harvesting for cryptographic use is largely unexplored in production
- Formal verification of PQC implementations is nascent (limited to academic prototypes)
- Enterprise-scale PQC key management lacks benchmarking data

#### 5. Project Consortium

| Partner | Role | Contribution |
|---------|------|-------------|
| **QDaria AS** (Project Owner) | Industry lead, Zipminator platform, integration, deployment | NOK [AMOUNT] |
| **[UNIVERSITY -- e.g., NTNU, UiO]** | Formal verification, cryptographic analysis | NOK [AMOUNT] |
| **[RESEARCH INSTITUTE -- e.g., SINTEF Digital, FFI]** | Infrastructure testing, security evaluation | NOK [AMOUNT] |
| **[INDUSTRY PARTNER -- e.g., Telenor, Equinor, Kongsberg]** | Pilot deployment, domain expertise | NOK [AMOUNT] |

#### 6. Work Packages

| WP | Title | Lead | Duration | Budget |
|----|-------|------|----------|--------|
| WP1 | Hybrid PQC Key Exchange for Telecom | QDaria | M1-M18 | NOK [AMOUNT] |
| WP2 | Quantum Entropy Harvesting & Validation | [University] | M1-M24 | NOK [AMOUNT] |
| WP3 | Formal Verification of Kyber768 | [University] | M6-M30 | NOK [AMOUNT] |
| WP4 | Enterprise PQC Key Management at Scale | QDaria | M12-M36 | NOK [AMOUNT] |
| WP5 | Pilot Deployment & Benchmarking | [Industry Partner] | M24-M36 | NOK [AMOUNT] |
| WP6 | Project Management & Dissemination | QDaria | M1-M36 | NOK [AMOUNT] |

#### 7. Budget

| Cost Category | QDaria | Research Partners | Industry Partners | Total |
|--------------|--------|-------------------|-------------------|-------|
| Personnel | NOK [AMOUNT] | NOK [AMOUNT] | NOK [AMOUNT] | NOK [AMOUNT] |
| Equipment | NOK [AMOUNT] | NOK [AMOUNT] | -- | NOK [AMOUNT] |
| Quantum compute access | NOK [AMOUNT] | NOK [AMOUNT] | -- | NOK [AMOUNT] |
| Travel/dissemination | NOK [AMOUNT] | NOK [AMOUNT] | NOK [AMOUNT] | NOK [AMOUNT] |
| Other | NOK [AMOUNT] | NOK [AMOUNT] | NOK [AMOUNT] | NOK [AMOUNT] |
| **Total** | **NOK [AMOUNT]** | **NOK [AMOUNT]** | **NOK [AMOUNT]** | **NOK [TOTAL]** |

**Requested from NFR:** NOK [AMOUNT] (50% of QDaria's costs + 80% of research partner costs)
**Industry co-financing:** NOK [AMOUNT]

#### 8. Value Creation and Impact

**For Norwegian industry:**
- Enables Norwegian companies to meet EU PQC mandate ahead of 2030 deadline
- Strengthens Norway's position in quantum-safe defense and critical infrastructure
- Creates exportable PQC technology and competence

**For society:**
- Protects Norwegian citizens' data against "harvest now, decrypt later" attacks
- Secures critical infrastructure (energy, telecom, maritime, defense)
- Contributes to Norway's sovereignty in cryptographic infrastructure

**Scientific impact:**
- 4-6 peer-reviewed publications in top-tier venues (CRYPTO, EUROCRYPT, ACM CCS)
- Open-source tools for PQC formal verification
- PhD/postdoc training in PQC (2-3 candidates)

#### 9. Relevance to National Priorities

- Directly aligned with Norway's National Quantum Initiative (NOK 1.75B)
- Supports the EU's Coordinated Implementation Roadmap for PQC Transition
- Addresses NSM (Nasjonal sikkerhetsmyndighet) recommendations for quantum-safe government communications
- Contributes to NATO's quantum-safe interoperability objectives
