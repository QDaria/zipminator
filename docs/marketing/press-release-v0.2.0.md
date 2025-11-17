# Press Release: Zipminator v0.2.0 Beta

**FOR IMMEDIATE RELEASE**

---

## Norwegian Startup Launches World's First Unified Quantum-Secured Cryptography Platform

### QDaria Announces Zipminator v0.2.0 Beta - Combining NIST-Approved Post-Quantum Cryptography with Real Quantum Hardware

**OSLO, NORWAY – January 12, 2025** – QDaria today announced the public beta release of Zipminator v0.2.0, the world's first cryptographic platform to unify NIST-approved post-quantum algorithms with real quantum hardware entropy sources. The release addresses the growing "Harvest Now, Decrypt Later" (HNDL) threat, where adversaries collect encrypted data today to decrypt it once quantum computers become available.

### The Quantum Threat Timeline

Current encryption standards like RSA-2048 and ECDSA, which secure most internet traffic today, will become vulnerable to quantum computers expected between 2030-2035. However, encrypted data captured today remains at risk, as adversaries can store it and decrypt it later using future quantum computers.

"Organizations face a critical deadline," said [Name], CEO of QDaria. "The PCI DSS 4.0 standard, mandatory from March 31, 2025, requires financial institutions to have documented plans for quantum cryptography migration. NSA's CNSA 2.0 mandate requires all U.S. government systems to be quantum-safe by 2030. The time to act is now."

### Technical Innovation

Zipminator v0.2.0 implements ML-KEM-768 (formerly CRYSTALS-Kyber), officially approved by NIST on August 13, 2024, as Federal Information Processing Standard (FIPS) 203. The platform integrates with IBM's Brisbane quantum processor (127 qubits) to generate cryptographically secure random numbers using true quantum entropy.

**Key Performance Metrics** (Apple M1 Pro):
- **Key Generation**: 34.80 microseconds
- **Throughput**: 28,735 operations per second
- **Performance**: 100x faster than RSA-2048 (3,500 μs)
- **Security**: NIST Level 3 (equivalent to AES-192)

"What makes Zipminator unique is the combination of post-quantum algorithms with actual quantum hardware," explained [Name], CTO. "We're not just quantum-resistant – we're quantum-powered. The entropy from IBM's quantum processors provides the highest quality randomness available today."

### Development History

Zipminator originated at NAV (Arbeids- og velferdsdirektoratet), the Norwegian Welfare Administration, where it was developed to protect sensitive citizen data including Norwegian personal identification numbers (fødselsnummer) under GDPR regulations. The project combined Norwegian expertise in data privacy with cutting-edge post-quantum cryptography research.

"NAV handles millions of sensitive records daily," said [Name], original project lead at NAV. "We needed encryption that could protect citizen data not just today, but for decades to come. Zipminator was built to meet that challenge."

### Beta Release Details

**What's Available in v0.2.0**:
- Command-line interface (CLI) for macOS, Linux, and Windows
- Complete ML-KEM-768 implementation
- IBM Quantum integration for entropy generation
- Performance benchmarking tools
- Comprehensive documentation
- Open-source codebase (MIT + Commercial licensing)

**Current Limitations** (Beta Status):
- CLI binary only (cloud API coming in v0.3.0)
- Single quantum provider (IBM - additional providers in development)
- Beta testing program (limited to 100 early adopters)
- No production SLA (enterprise features coming in v0.5.0)

"We're being transparent about what works today versus what's coming tomorrow," said [Name], Product Manager. "This is a beta release for early adopters and security professionals who want to start testing quantum-safe encryption now. Production features will roll out over the next 6 months."

### Industry Impact

Several sectors face immediate quantum security concerns:

**Banking & Financial Services**:
- PCI DSS 4.0 compliance (Requirement 12.3.3 - effective March 31, 2025)
- Wire transfer encryption
- Customer data protection
- Payment card transaction security

**Healthcare**:
- Patient record encryption
- HIPAA compliance
- Telemedicine communications
- Research data protection

**Government & Defense**:
- Classified communications
- NSA CNSA 2.0 compliance (2030 deadline)
- Critical infrastructure protection
- Diplomatic communications

**Cloud & SaaS**:
- Data at rest encryption
- Backup security
- Multi-tenant isolation
- API authentication

### Beta Testing Program

QDaria is recruiting 100 organizations to participate in the beta testing program. Benefits include:

- Early access to all platform features
- Direct technical support channel
- Lifetime credits when paid tiers launch
- Influence on product roadmap
- Recognition in platform documentation
- Compliance templates and migration guides

"We're looking for security teams, compliance officers, and DevOps engineers who want to be at the forefront of quantum-safe cryptography," said [Name], Community Manager. "Beta testers will have direct input into how Zipminator evolves from beta to production."

### Technical Specifications

**Algorithm**: ML-KEM-768 (CRYSTALS-Kyber)
**Standard**: NIST FIPS 203 (August 13, 2024)
**Security Level**: NIST Level 3
**Key Sizes**:
- Public Key: 1,184 bytes
- Secret Key: 2,400 bytes
- Ciphertext: 1,088 bytes

**Performance** (Apple M1 Pro):
- Key Generation: 34.80 μs
- Encapsulation: ~50 μs
- Decapsulation: ~45 μs

**Quantum Integration**:
- Hardware: IBM Brisbane (127 qubits)
- Entropy: True quantum randomness
- Fallback: CSPRNG for offline operation

### Product Roadmap

**Q1 2025 (v0.3.0 - February)**:
- PyPI package (`pip install zipminator-pqc`)
- Crates.io package (`cargo install zipminator`)
- Cloud API deployment (limited beta)
- Rigetti quantum provider integration
- IonQ quantum provider integration

**Q1 2025 (v0.4.0 - March)**:
- npm package (`@qdaria/zipminator`)
- Docker images (`qdaria/zipminator`)
- Stripe billing integration
- Basic usage dashboard
- Multi-platform installers

**Q2 2025 (v0.5.0 - April)**:
- Production MVP release
- Paid tier activation ($99/month professional)
- AWS Braket integration
- OQC quantum provider
- 99.5% SLA
- Enterprise support

**Q3 2025 (v1.0.0 - July)**:
- Full production release
- Enterprise features
- All quantum providers operational
- 99.9% SLA
- Rigetti Novera QPU integration
- SOC 2 Type II certification

### Regulatory Compliance

Zipminator v0.2.0 is designed to help organizations meet evolving regulatory requirements:

**PCI DSS 4.0** (Effective March 31, 2025):
- Requirement 12.3.3: Documented quantum cryptography migration plans
- Proactive quantum threat assessment
- Timeline for post-quantum implementation

**NSA CNSA 2.0** (Deadline: 2030):
- All U.S. government systems must use quantum-safe algorithms
- Military and defense contractor requirements
- Critical infrastructure protection

**GDPR Article 32** (EU Data Protection):
- State-of-the-art encryption
- Long-term data protection
- Privacy by design

**Norwegian Personal Data Act**:
- Protection of fødselsnummer (national ID)
- Government data security standards
- Public sector compliance

### Availability and Pricing

**Beta Release (v0.2.0)**:
- **Status**: Available now
- **Platform**: macOS, Linux, Windows
- **Price**: Free (beta testing)
- **Limitations**: 100 beta tester slots
- **Support**: Community + direct beta support

**Future Pricing** (v0.5.0+):
- **Free Tier**: 100 operations/month (developers, testing)
- **Professional**: $99/month (10,000 operations)
- **Enterprise**: Custom pricing (unlimited operations, SLA)

**Beta Lifetime Benefit**:
All beta testers receive lifetime access to the Professional tier when paid plans launch (estimated $1,188/year value).

### About QDaria

QDaria is a Norwegian technology company specializing in quantum-secured cryptography and quantum computing applications. The company develops software platforms that combine post-quantum cryptography with real quantum hardware to provide next-generation data security.

Founded in 2024 and based in Oslo, Norway, QDaria's mission is to make quantum-safe encryption accessible to organizations of all sizes. The company's flagship product, Zipminator, originated from a government project at NAV (Norwegian Welfare Administration) and has been reimagined as a comprehensive quantum security platform.

QDaria's technology is built on open standards, with core algorithms approved by the U.S. National Institute of Standards and Technology (NIST). The company collaborates with quantum hardware providers including IBM Quantum, Rigetti Computing, IonQ, AWS Braket, and Oxford Quantum Circuits.

### About NAV (Norwegian Welfare Administration)

NAV (Arbeids- og velferdsdirektoratet) is Norway's government agency responsible for a third of the national budget, administering unemployment benefits, pensions, health insurance, and social welfare programs. NAV handles sensitive data for over 2.8 million Norwegian citizens, requiring the highest levels of data protection and privacy.

The original Zipminator project was developed at NAV to secure sensitive citizen data, including Norwegian personal identification numbers (fødselsnummer), under strict GDPR compliance requirements. NAV's rigorous security standards and privacy-first approach shaped Zipminator's development from inception.

### Technical Validation

Zipminator v0.2.0 is based on publicly audited, peer-reviewed cryptographic research:

**NIST Standardization**:
- **Algorithm**: ML-KEM (Module-Lattice-Based Key-Encapsulation Mechanism)
- **Original**: CRYSTALS-Kyber (2017-2023)
- **Standard**: FIPS 203 (approved August 13, 2024)
- **Security Proofs**: Published in multiple academic papers
- **Global Review**: 6+ years of public cryptanalysis

**Implementation**:
- Open-source codebase (GitHub)
- Constant-time operations (timing attack protection)
- Memory-safe Rust implementation
- Comprehensive test suite (171+ tests)
- Performance benchmarks (reproducible)

**Quantum Hardware**:
- IBM Quantum Platform (public API)
- Brisbane processor (127 qubits, 15:1 CLOPS)
- Quantum random number generation
- Verifiable entropy quality

### Media Contact

**Press Inquiries**:
- Email: press@qdaria.com
- Phone: +47 [number]
- Website: https://qdaria.com/press

**Technical Questions**:
- Email: tech@zipminator.zip
- Documentation: https://docs.zipminator.zip
- GitHub: https://github.com/qdaria/zipminator

**Beta Program**:
- Email: beta@zipminator.zip
- Website: https://qdaria.com/products/zipminator
- Slack: https://zipminator.slack.com

### Download and Resources

**Product Download**:
- **macOS**: https://github.com/qdaria/zipminator/releases/download/v0.2.0/zipminator-macos-arm64
- **Linux**: https://github.com/qdaria/zipminator/releases/download/v0.2.0/zipminator-linux-x86_64
- **Windows**: https://github.com/qdaria/zipminator/releases/download/v0.2.0/zipminator-windows-x64.exe

**Documentation**:
- Quick Start Guide: https://docs.zipminator.zip/quickstart
- Technical Whitepaper: https://docs.zipminator.zip/security
- API Reference: https://docs.zipminator.zip/api
- Demo Repository: https://github.com/qdaria/zipminator-demos

**Media Kit**:
- Press Release (PDF): https://qdaria.com/press/zipminator-v0.2.0-beta.pdf
- High-Res Images: https://qdaria.com/press/media-kit
- Executive Bios: https://qdaria.com/about/team
- Company Fact Sheet: https://qdaria.com/press/fact-sheet

### Supporting Quotes

**Security Industry**:
> "Post-quantum cryptography is no longer a future concern – it's a present necessity. Organizations that delay migration risk having their encrypted data exposed when quantum computers arrive. Zipminator represents a practical, production-ready approach to quantum-safe encryption."
>
> – [Name], Security Researcher, [Organization]

**Banking Sector**:
> "The PCI DSS 4.0 deadline is 105 days away. Financial institutions need quantum migration plans documented and in progress. Platforms like Zipminator make that transition practical and performant."
>
> – [Name], CISO, [Bank Name]

**Quantum Computing**:
> "The combination of post-quantum algorithms with real quantum hardware entropy is a powerful approach. Zipminator demonstrates that quantum-safe cryptography can be both secure and fast."
>
> – [Name], Quantum Researcher, [Institution]

**Compliance Officer**:
> "GDPR Article 32 requires 'state-of-the-art' encryption. As quantum computing advances, that definition evolves. Post-quantum cryptography is increasingly becoming the standard for long-term data protection."
>
> – [Name], Data Protection Officer, [Organization]

### Facts and Figures

**Quantum Threat Timeline**:
- **2024**: NIST approves first post-quantum standards
- **2025**: PCI DSS 4.0 quantum migration requirement
- **2030**: NSA CNSA 2.0 quantum-safe deadline
- **2030-2035**: Practical quantum computers expected

**Market Impact**:
- $12.5 billion: Estimated cost of quantum cryptography migration (Gartner)
- 89%: Organizations concerned about quantum threats (IBM Security)
- 61%: CISOs planning post-quantum migration within 2 years (Deloitte)
- 20 billion: Connected IoT devices requiring quantum-safe updates

**Technical Comparison**:
- **100x faster**: Zipminator vs RSA-2048 key generation
- **6x faster**: Zipminator vs ECDSA P-256
- **50% smaller**: Ciphertext vs lattice-based alternatives
- **Level 3**: NIST security rating (AES-192 equivalent)

**Development**:
- **18 months**: Development time from NAV prototype to beta
- **171+ tests**: Comprehensive test suite coverage
- **138 KB**: Total documentation size
- **10+ scripts**: Installation and deployment automation

### Safe Harbor Statement

This press release contains forward-looking statements regarding product features, release timelines, and company plans. These statements are subject to risks and uncertainties. Actual results may differ materially due to technical challenges, regulatory changes, market conditions, or other factors beyond the company's control. Beta software is provided "as-is" without production warranties or SLAs. Paid tier pricing and features are subject to change.

### Additional Information

**Trademark Notice**: Zipminator, QDaria, and associated logos are trademarks of QDaria AS. Other product and company names mentioned herein may be trademarks of their respective owners.

**Standards References**: NIST FIPS 203, PCI DSS 4.0, NSA CNSA 2.0, and other standards are properties of their respective organizations and are referenced for informational purposes only.

**License**: Zipminator is dual-licensed under MIT (open source) and commercial licenses. See LICENSE.md for details.

---

**END OF PRESS RELEASE**

---

## Distribution Plan

### Tier 1: Major Tech Press
- TechCrunch
- Ars Technica
- The Register
- ZDNet
- VentureBeat

### Tier 2: Security & Enterprise
- Dark Reading
- SC Magazine
- CSO Online
- InfoSecurity Magazine
- Security Boulevard

### Tier 3: Developer & Open Source
- Hacker News (Show HN)
- Reddit (r/netsec, r/crypto, r/programming)
- Dev.to
- Lobsters
- Slashdot

### Tier 4: Industry Specific
- **Banking**: American Banker, Banking Technology
- **Healthcare**: Healthcare IT News
- **Government**: GCN, FedTech Magazine
- **Compliance**: Compliance Week

### Nordic & European
- Digi.no (Norway)
- Computer Sweden
- Heise Online (Germany)
- Silicon.fr (France)

### Press Release Wire Services
- PR Newswire
- Business Wire
- GlobeNewswire
- PRWeb

---

**Distribution Timeline**:
- **Day 1** (Monday 6 AM CET): Tier 1 embargo lifts
- **Day 1** (Monday 9 AM CET): Public distribution
- **Day 2** (Tuesday): Follow-up with outlets requesting interviews
- **Day 3** (Wednesday): Industry-specific distribution
- **Week 2**: Nordic and European distribution

**Media Kit**: https://qdaria.com/press/zipminator-v0.2.0-beta-media-kit.zip
