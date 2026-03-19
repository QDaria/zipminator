# Quantum-safe banking: the QDaria pitch intelligence brief for SpareBank 1

**Norwegian banks face a ticking cryptographic clock — and SpareBank 1 has no visible quantum defense program.** With DORA now in force, NIST post-quantum standards finalized, and state actors already harvesting encrypted financial data for future quantum decryption, SpareBank 1's shared Azure platform serving 14 banks represents both a concentrated vulnerability and a centralized modernization opportunity. QDaria, as Norway's only quantum computing company following NQCG's dissolution in December 2024, is uniquely positioned to deliver post-quantum cryptography and quantum computing capabilities to the alliance. This brief assembles the intelligence — market data, regulatory timelines, competitive landscape, and tailored business cases — needed to make a compelling pitch to SpareBank 1 Markets' TMT analysts.

---

## SpareBank 1's tech stack creates a single quantum attack surface

SpareBank 1 is Norway's second-largest financial services group: an alliance of **13 independent savings banks** with combined assets of ~**NOK 625 billion** and ~6,500 employees. Technology decisions flow through **SpareBank 1 Utvikling DA**, the alliance's shared IT development and operations entity with **~530 employees** in Oslo and Trondheim, led by CEO Espen Kjølberg.

The alliance built a **custom Azure cloud platform** starting in late 2021 after finding existing infrastructure "based on outdated technology and full of technical debt." This centralized platform serves all 14 banks — meaning a single cryptographic modernization program could protect the entire alliance, but also meaning a single point of quantum vulnerability. The alliance's other technology pillars include Norway's top-rated mobile banking app (millions of daily transactions relying on public-key cryptography), **BankID** authentication, a **25% stake in Vipps** (1.52 billion transactions in 2024), and a new **multi-year digital mortgage partnership with Tietoevry** announced February 2026.

SpareBank 1 SMN committed **NOK 40 million over five years** to an NTNU AI Lab partnership (June 2024), demonstrating appetite for frontier technology investment. SMN also created a new "Technology and Development" division effective January 2025. SpareBank 1 SR-Bank (now Sør-Norge) tested AI-powered financial advisory in Finanstilsynet's regulatory sandbox. Despite these forward-looking tech initiatives, **no public mention exists of quantum computing, post-quantum cryptography, or cryptographic modernization** anywhere across the SpareBank 1 alliance — a significant gap that represents a direct sales opportunity.

SpareBank 1 Markets, now a **~270-person pan-Nordic investment bank** following Swedbank's **20% acquisition** in March 2025, was named Norway's Financial Adviser of the Year 2023. While it covers energy, renewables, healthcare, maritime, and seafood, no dedicated TMT desk was identified — meaning Peder and Jostein's coverage of tech-adjacent opportunities likely includes emerging quantum technology. SB1 Markets could serve as both a customer and a potential distribution/advisory partner for QDaria.

---

## Regulatory pressure is intensifying on three fronts simultaneously

Three regulatory forces are converging to make PQC migration unavoidable for Norwegian banks:

**DORA is now Norwegian law.** The Digital Operational Resilience Act took effect in Norway on **July 1, 2025**, with Finanstilsynet as the supervising authority. DORA's Regulatory Technical Standards contain specific cryptographic mandates: **Article 6** requires documented encryption policies covering data at rest, in transit, and in use, with cryptographic techniques selected based on "leading practices and standards." Critically, **Article 6.4** requires **periodic updates to cryptographic technology to ensure resilience against evolving threats, including cryptanalysis developments** — this is effectively a quantum-readiness clause. Article 7 mandates full cryptographic key lifecycle management. Non-compliance penalties reach **up to 2% of total annual worldwide turnover** or €1 million for individuals.

**NIST finalized PQC standards in August 2024.** Three algorithms are now standardized: **ML-KEM** (FIPS 203, for key encapsulation), **ML-DSA** (FIPS 204, for digital signatures), and **SLH-DSA** (FIPS 205, hash-based signatures). NIST's draft IR 8547 proposes **deprecating RSA and ECC after 2030 and disallowing all quantum-vulnerable asymmetric cryptography after 2035**. The NSA's CNSA 2.0 timeline requires all new national security system acquisitions to be PQC-compliant by **January 2027**, with full migration by **2035**. The UK NCSC sets milestones of cryptographic discovery by 2028, high-priority upgrades by 2031, and **complete PQC migration by 2035**. The EU's June 2025 coordinated roadmap requires national PQC strategies by end of 2026 and high-risk system migration by **end of 2030**.

**Finanstilsynet's own data shows escalating threats.** The regulator recorded **365 serious ICT incidents** in Norwegian financial services in 2024, up from 353 in 2023. Fraud losses reached **NOK 928 million in 2023** — a **51% year-over-year increase** — with banks preventing additional attempts worth NOK 2,072 million. The Nordic Financial CERT assesses the cyber threat level as "high and stabilized." Finance and insurance is the **most targeted sector** in the Nordics at **15.32% of all threats**.

Yet **fewer than 20% of Norwegian bank executives** view quantum computing as a real future threat to their IT security, per a 2024 Finans Norge survey. This awareness gap is itself a pitch point: the threat is real, the regulations are arriving, and Norwegian banks are behind.

---

## The "harvest now, decrypt later" threat makes urgency concrete

The most compelling near-term argument for PQC is not a future quantum computer — it is data being stolen today. Nation-state actors and advanced persistent threat groups are **already harvesting encrypted financial data** for future quantum decryption. This "harvest now, decrypt later" (HNDL) attack vector means that any data with a useful shelf life beyond ~2032 is already at risk.

The numbers make the case. A **Citi Institute report (January 2026)** modeled a quantum-enabled attack on a single top-five U.S. bank's Fedwire access: the estimated indirect economic damage is **$2.0–$3.3 trillion** (10–17% of annual U.S. GDP), potentially triggering a six-month recession through cascading liquidity failures. The **Global Risk Institute's 2024 survey** of 32 quantum experts found a **19–34% probability** of a cryptographically relevant quantum computer within 10 years, up from 17–31% the previous year. Kalshi prediction markets put the probability of a useful quantum computer at **39% before 2030**.

Financial data is uniquely vulnerable because regulatory data retention requirements of **7–10 years** create a direct HNDL exposure window. Applying Mosca's Theorem — if migration time plus data shelf life exceeds time to Q-Day, data is already at risk — most banks are already inside the danger zone. The average financial services data breach costs **$6.08 million** (IBM 2024), but a quantum-enabled breach affecting cryptographic infrastructure would be categorically worse.

SpareBank 1's BankID-authenticated mobile banking, Vipps payment processing, and inter-bank communications all rely on public-key cryptography that quantum computers will break. **Public-key encryption secures 90% of all globally encrypted data.** The payments industry's migration from magnetic stripes to EMV chips "took the better part of two decades and cost billions" — PQC migration touches every layer simultaneously and needs to begin now.

---

## Global banks are already running quantum programs at scale

The pitch to SpareBank 1 must establish that quantum is not theoretical — the world's leading banks are actively investing. Here are the most compelling proof points:

**JPMorgan Chase** runs banking's largest quantum team, accounting for **two-thirds of quantum job postings** across 50 tracked banks and **100+ quantum patents filed**. In March 2025, JPMorgan published a certified quantum randomness result in *Nature* — **71,313 bits of entropy** using Quantinuum's 56-qubit system. Their portfolio optimization algorithms achieve results in **0.3 seconds versus 5 minutes classically**, a ~1,000x speedup. They have also deployed a quantum-secured key distribution network (Q-CAN) connecting data centers at **100 Gbps**.

**HSBC** achieved the strongest real-world result to date: in September 2025, using IBM Quantum Heron processors on **real production-scale trading data**, they demonstrated **up to 34% improvement** in predicting the probability of winning customer bond trade inquiries. HSBC has also deployed **PQC VPN tunnels**, tested **quantum-safe tokenized gold** on its Orion blockchain, and was the first bank to join the London Quantum Secure Metro Network.

**BBVA** with Multiverse Computing optimized a portfolio of **52 assets among 10,382 candidates** in seconds versus ~2 days classically. **Goldman Sachs** estimates a **1,000x theoretical speedup** for derivatives pricing via amplitude estimation. **Deutsche Bank's "Project Feynman"** with Pasqal develops quantum models for credit rating downgrades. **Crédit Agricole** achieved models that train **3.5x faster** using only 50 qubits. **Intesa Sanpaolo's** quantum ML fraud detection **outperformed traditional methods**.

Across the industry, **~80% of the top 50 large banks** are doing something with quantum computing — hiring, research, patents, or investments. Fifteen banks now reference quantum in annual reports. Quantum team headcount at banks grew **10% since August 2024**.

In the Nordics specifically, **Danske Bank** completed the **first quantum-safe data transfer in the Nordics** in February 2022 using continuous-variable QKD with DTU and KPMG, followed by a DKK 22.5 million CryptQ project from Innovation Fund Denmark. SEB, Swedbank, and Nordea are "exploring quantum-safe encryption and portfolio risk modeling." **No Norwegian bank has any confirmed quantum initiative** — SpareBank 1 could be the first mover.

---

## The market is massive and growing at 40%+ CAGR

Investment banking-grade market data supports the opportunity:

- **Quantum computing in financial services** could create **$400–$600 billion** in value by 2035 (McKinsey Quantum Technology Monitor, June 2025). BCG estimates **$450–$850 billion** in total economic value by 2040 across industries.
- **Financial services quantum spending** is projected to grow **233x from $80 million in 2022 to $19 billion in 2032**, a **72% CAGR** (Deloitte Center for Financial Services). Defensive spending (PQC/cybersecurity) alone grows from $7 million to **$3.7 billion** over the same period.
- **The PQC market** is projected at **$420 million in 2025**, growing to **$2.84 billion by 2030** at a **46.2% CAGR** (MarketsandMarkets). Other estimates range higher, with Precedence Research projecting **$29.95 billion by 2034**.
- **Per large institution**, BCG estimates **$200–$450 million** in incremental near-term value from quantum-inspired optimization, scaling to **up to $900 million** with error-corrected quantum over the following 15 years.
- The total quantum technology market could reach **$97 billion by 2035** and **$198 billion by 2040** (McKinsey). Private investment in quantum startups reached **~$2.0 billion in 2024**, a 50% increase from 2023.
- **Only 5% of enterprises** have quantum-safe encryption in place today, while **48% acknowledge being unprepared** (Keyfactor 2025). This gap defines the addressable market for Zipminator.

For context, **global cybercrime damages** are projected at **$10.5 trillion annually** by 2025 (Cybersecurity Ventures). The average financial services data breach costs **$6.08 million** (IBM 2024). Nordic-specific data shows **145,613 DDoS attacks** recorded across the region in 2024, with Norway recording the highest throughput. In September 2024, Nordea suffered the **largest DDoS attack in Nordic banking history** — 400 attacks over ~40 days.

---

## Five quantum use cases tailored for SpareBank 1

Each of these can be framed as a specific business case for the alliance:

**Post-quantum cryptography migration (Zipminator).** SpareBank 1 Utvikling's centralized Azure platform means a single PQC deployment covers 14 banks. DORA Article 6.4's requirement for cryptographic updates based on "developments in cryptanalysis" creates regulatory urgency. The alliance's BankID integration, Vipps stake, and mobile banking leadership all depend on public-key cryptography that must be upgraded. Zipminator can provide cryptographic inventory, risk assessment, and hybrid classical/PQC transition — exactly what DORA demands and what Europol's Quantum Safe Financial Forum recommends as step one.

**Portfolio optimization via QCaaS.** SpareBank 1's ODIN Forvaltning manages investment funds across the alliance. Quantum algorithms have demonstrated 1,000x speedups for portfolio optimization (JPMorgan) and seconds-level performance for multi-asset optimization that takes days classically (BBVA). QDaria's Rigetti-based QCaaS platform could offer ODIN and SB1 Markets' trading desks access to quantum portfolio optimization without capital hardware investment.

**Risk modeling acceleration.** Norwegian banks run overnight Monte Carlo batches for VaR calculations under Basel III. Quantum amplitude estimation provides a **quadratic speedup** — improving convergence from O(M^(-1/2)) to approaching O(M^(-1)). Research demonstrates **5.6x faster** performance than HPC clusters for economic stress testing. For SpareBank 1's combined **NOK 249+ billion loan book** (SMN alone), faster and more accurate risk modeling directly improves capital allocation.

**Fraud detection with quantum ML.** SpareBank 1 SMN already uses AI for fraud detection and invested NOK 40 million in NTNU's AI Lab. Quantum ML fraud detection achieves **F1-scores of 0.88–0.98** in pilot settings and McKinsey estimates **up to 40% reduction in false positives**. With Norwegian fraud losses at **NOK 928 million** in 2023 (up 51%), even marginal improvement translates to tens of millions in avoided losses.

**Quantum random number generation.** QRNG provides certified entropy for cryptographic key generation, trading operations, and Monte Carlo simulation seeding. JPMorgan's March 2025 *Nature* publication certified 71,313 bits of quantum entropy. HSBC uses QRNG to protect tokenized gold transactions. For SpareBank 1's BankID authentication and payment infrastructure, QRNG offers an immediate security upgrade.

---

## QDaria has a narrow but real competitive window

The competitive landscape reveals both the threat from well-funded global players and the opportunity created by their absence in Norway:

**SandboxAQ** (Google spin-off) has raised **~$950 million** at a **~$5.6 billion valuation**, with its AQtive Guard platform achieving FedRAMP Ready status. **PQShield** ($65 million raised) co-authored all four NIST PQC standards. **Thales** and **Entrust** are incumbent HSM vendors already shipping PQC-ready hardware to European banks. **Eviden** (Atos) offers end-to-end PQC migration consulting for banking. These are formidable competitors — but **none has established a Nordic banking presence**. No Nordic bank is a member of Europol's Quantum Safe Financial Forum.

QDaria's differentiators are real but must be framed carefully for sophisticated TMT analysts:

- **Norway's only quantum computing company** following NQCG's dissolution in December 2024. No competitor has a Norwegian presence or Norwegian regulatory expertise.
- **Rigetti partnership** connects QDaria to a vendor with proven financial services credentials: Rigetti has active partnerships with **HSBC**, **Standard Chartered**, **Nasdaq**, and a new **financial fraud detection program** with Algorithmiq (February 2026).
- **Dual capability** — both quantum computing (QCaaS via Rigetti hardware) and quantum-safe cybersecurity (Zipminator) — mirrors the full-stack approach of SandboxAQ but with local market advantage.
- **Norway's first commercially available quantum computer** is a powerful narrative: it transforms Norway from a "slow starter" (the government's own admission) into a participant in the quantum economy.
- **Topological quantum computing** roadmap (Fibonacci anyons) represents a long-term bet on the approach that Microsoft and others have validated with recent breakthroughs.

The honest challenge: QDaria is pre-seed stage in a market where competitors have raised hundreds of millions. The pitch to SB1 Markets should frame this as an **investment opportunity** in Norway's quantum capability — not just a vendor relationship. SpareBank 1 has the infrastructure (SB1 Markets for deal advisory, Utvikling for deployment) to be both a customer and a strategic partner.

---

## Conclusion: the case distilled for TMT analysts

Three facts make this pitch timely and compelling. First, **DORA is now law in Norway** with explicit cryptographic update requirements — every Norwegian bank must evaluate its quantum readiness or face regulatory risk. Second, **fewer than 20% of Norwegian bank executives** recognize the quantum threat, while **19–34% of experts** estimate a cryptographically relevant quantum computer within a decade — this awareness gap will close, and banks that move early gain competitive and regulatory advantage. Third, **SpareBank 1's centralized technology architecture** means one decision by Utvikling could protect 14 banks, making the cost-per-bank equation uniquely favorable.

The global data is unambiguous: **$19 billion in financial services quantum spending by 2032** (Deloitte), **$400–$600 billion in value creation by 2035** (McKinsey), and **$2.84 billion in PQC market size by 2030** (MarketsandMarkets). Every major global bank is investing. The only Nordic bank with a confirmed quantum pilot is Danske Bank. Norwegian banks have yet to begin — and QDaria can change that.

For Peder and Jostein at SB1 Markets, the framing should be dual: QDaria represents both a **procurement opportunity** for the SpareBank 1 alliance (PQC migration via Zipminator, QCaaS for quantitative finance) and a **coverage opportunity** for SB1 Markets' investment banking practice in an emerging Nordic tech sector projected to grow at **40%+ CAGR** for the next decade.