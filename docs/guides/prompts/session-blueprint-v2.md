# Blueprint v2: IP Valuation Documentation — Enhancement Session

> **Launch**: `claude --effort max`
> Then paste everything below.

---

/effort max

## Pre-Read (MANDATORY — read ALL before writing anything)

```
CLAUDE.md
.claude/rules/01-stack.md
.claude/rules/02-security-pqc.md
.claude/rules/zero-hallucination.md
web/app/invest/blueprint/page.tsx
web/app/invest/blueprint/layout.tsx
web/lib/blueprint-data.ts
web/components/blueprint/BlueprintSection.tsx
web/components/blueprint/BlueprintSidebar.tsx
web/components/blueprint/BlueprintScenarioToggle.tsx
web/components/blueprint/sections/SectionPatentStack.tsx
web/components/blueprint/sections/SectionRegulatoryMoat.tsx
web/components/blueprint/sections/SectionPatentDeepDives.tsx
web/components/blueprint/sections/SectionNovelty.tsx
web/components/blueprint/sections/SectionValuation.tsx
web/components/blueprint/sections/SectionComparables.tsx
web/components/blueprint/sections/SectionCompanyVal.tsx
web/components/blueprint/sections/SectionUseCases.tsx
web/components/blueprint/sections/SectionPillars.tsx
web/components/blueprint/sections/SectionCompetitors.tsx
web/components/blueprint/sections/SectionMarketSize.tsx
web/components/blueprint/sections/SectionFloorMatters.tsx
web/components/pitch/pitch-ui/MetricCard.tsx
web/components/pitch/pitch-ui/AnimatedCounter.tsx
web/components/pitch/chart-config.ts
docs/guides/conversation.txt
docs/guides/FEATURES.md
```

---

## Task

Transform the existing IP Valuation Blueprint at `/invest/blueprint` from a chart-heavy dashboard into a **documentation-style investor document**. The page already has 12 sections with Recharts visualizations and a scenario toggle. It needs:

1. **Long-form prose** per section (3-6 paragraphs each, blog-documentation style)
2. **Deep patent elaborations** for all three patents with full technical explanations
3. **Embedded regulatory citations** matching the existing GDPR Recital 26 callout pattern
4. **Content from `docs/guides/conversation.txt`** fully integrated (ARE explanation, Merkle provenance analogy, corrected valuations, patent thicket analysis, floor vs ceiling argument)
5. **2 new sections** (Product Showcase + References)
6. **2 new reusable components** (BlueprintProseBlock + BlueprintCitationCallout)
7. **AnimatedCounter** imported from pitch-ui for headline numbers

**Style**: Blog-post documentation with embedded charts. NOT a pitch deck. NOT slides. Think technical whitepaper with a beautiful dark UI. The reader should be able to understand the entire IP story, product, and valuation without external links.

**Audience**: SpareBank 1 TMT analysts, seed investors, defense procurement officers.

---

## Design System (follow exactly)

### Fonts
- **Headings**: `fontFamily: 'var(--font-fraunces), Georgia, serif'`
- **Body prose**: `fontFamily: 'var(--font-dm-sans), sans-serif'`
- **Data/code/labels**: `fontFamily: 'var(--font-jetbrains), monospace'`

### Colors
- **Page bg**: `#020817`
- **Card bg**: `rgba(15,23,42,0.5)`
- **Subtle bg**: `rgba(255,255,255,0.03)`
- **Border**: `rgba(255,255,255,0.05)` or `rgba(255,255,255,0.06)`
- **Accent cyan**: `#22D3EE` (primary, P1)
- **Accent amber**: `#F59E0B` (secondary, P2)
- **Accent emerald**: `#34D399` (tertiary, P3)
- **Accent violet**: `#A78BFA` (brand/blueprint)
- **Accent rose**: `#FB7185` (alert)
- **Accent indigo**: `#6366f1` (citations)
- **Text**: `text-slate-50` (headings), `text-slate-200` (emphasis), `text-slate-300` (body), `text-slate-400` (secondary), `text-slate-500` (tertiary)

### Prose Block Pattern
Every section should have prose wrapped in this pattern:
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.5 }}
  className="space-y-4 max-w-3xl"
>
  <p className="text-slate-300 text-base leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
    {/* paragraph text */}
  </p>
</motion.div>
```

### Citation Callout Pattern (reuse from SectionRegulatoryMoat's GDPR block)
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.5 }}
  className="rounded-xl p-6 border"
  style={{ background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)' }}
>
  <div className="flex gap-3">
    <span className="flex-none text-2xl mt-0.5" aria-hidden>&#xA7;</span>
    <div>
      <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-2"
          style={{ fontFamily: 'var(--font-jetbrains)' }}>
        {/* e.g. "DORA Article 6.4" */}
      </h4>
      <blockquote className="text-slate-200 leading-relaxed italic"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}>
        &ldquo;{/* verbatim regulatory text */}&rdquo;
      </blockquote>
      <p className="mt-3 text-sm text-slate-400" style={{ fontFamily: 'var(--font-dm-sans)' }}>
        {/* explanation of how Zipminator satisfies this */}
      </p>
    </div>
  </div>
</motion.div>
```

### Chart Container Pattern (already established)
```tsx
<motion.div
  className="rounded-xl p-6 border"
  style={{ background: 'rgba(15,23,42,0.5)', borderColor: 'rgba(255,255,255,0.05)' }}
>
  <h3 className="text-lg font-semibold text-slate-100 mb-1"
      style={{ fontFamily: 'var(--font-fraunces)' }}>Title</h3>
  <p className="text-sm text-slate-400 mb-6"
     style={{ fontFamily: 'var(--font-dm-sans)' }}>Subtitle</p>
  <ResponsiveContainer width="100%" height={380}>
    {/* chart */}
  </ResponsiveContainer>
</motion.div>
```

### Mechanism Code Block Pattern (for patent technical descriptions)
```tsx
<div className="rounded-lg p-5 overflow-x-auto"
     style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.05)' }}>
  <pre className="text-sm text-slate-300 leading-relaxed"
       style={{ fontFamily: 'var(--font-jetbrains)' }}>
{`Input value
→ Step 1: NATURAL domain, ADD 42 (wrapping mod n)
→ Step 2: COMPLEX domain, MUL (7+3i) (take real part)
→ Step 3: INTEGER domain, EXP 5 (bounded)
→ ...
→ Final: abs(result) mod prime`}
  </pre>
</div>
```

---

## Reusable Components to Create

### 1. `web/components/blueprint/BlueprintProseBlock.tsx`

A wrapper that applies DM Sans font, slate-300 color, relaxed leading, max-w-3xl, Framer Motion fade-in, and `space-y-4` for paragraphs. Accepts `children: ReactNode` and optional `className`.

### 2. `web/components/blueprint/BlueprintCitationCallout.tsx`

Props: `{ regulation: string; article: string; text: string; explanation: string; color?: string }`

Renders the citation callout pattern above. Default color is indigo. Use amber for financial regulations, emerald for security, violet for PQC.

---

## Data Additions to `web/lib/blueprint-data.ts`

Add these 7 new exports after the existing ones:

### 1. VALUATION_PROGRESSION
```ts
export const VALUATION_PROGRESSION: ValRow[] = [
  { method: '1 Patent (P1 alone)',     conservative: 25,  moderate: 50,   optimistic: 100,  unit: 'M' },
  { method: '2 Patents (P1 + P2)',     conservative: 35,  moderate: 65,   optimistic: 150,  unit: 'M' },
  { method: '3 Patents (full stack)',   conservative: 50,  moderate: 100,  optimistic: 200,  unit: 'M' },
]
```

### 2. ARE_EXTRACTOR_COMPARISON
```ts
export const ARE_EXTRACTOR_COMPARISON = [
  { family: 'Universal Hashing',  year: 1979, mechanism: 'Multiply-add over GF(2)',       limitation: 'Linear, single binary domain',     domain: 'GF(2)' },
  { family: 'Trevisan',           year: 2001, mechanism: 'Error-correcting codes + bit extraction', limitation: 'Near-linear, binary',    domain: 'GF(2)' },
  { family: 'Leftover Hash Lemma',year: 1999, mechanism: 'Any universal hash family',      limitation: 'Hash-based, single domain',        domain: 'GF(2)' },
  { family: 'Cryptomite',         year: 2024, mechanism: 'Hash-based (latest library)',     limitation: 'Still hash-based',                 domain: 'GF(2)' },
  { family: 'ARE (Zipminator)',    year: 2026, mechanism: 'Algebraic programs over 5 domains (N,Z,Q,R,C) × 6 ops', limitation: 'Needs formal security reduction', domain: 'N/Z/Q/R/C' },
]
```

### 3. REGULATION_CITATIONS
```ts
export const REGULATION_CITATIONS = [
  {
    id: 'dora-6-1',
    regulation: 'DORA',
    article: 'Article 6.1',
    text: 'Financial entities shall have in place a sound, comprehensive and well-documented ICT risk management framework, including strategies, policies, procedures, ICT protocols and tools necessary to duly and adequately protect all relevant information assets and ICT assets.',
    explanation: 'Zipminator\'s PQC key management, entropy provenance certificates, and audit-ready Merkle trees satisfy the documentation and tooling requirements directly.',
    color: '#22D3EE',
  },
  {
    id: 'dora-6-4',
    regulation: 'DORA',
    article: 'Article 6.4',
    text: 'Financial entities shall include in the ICT risk management framework mechanisms to detect, prevent and resolve incidents promptly, and to allow a rapid and effective response, including those related to cryptographic keys.',
    explanation: 'P3\'s health monitoring and graceful degradation detect entropy source failures in real-time, exclude compromised sources, and record all events in the provenance certificate. No silent fallback, no hidden weakness.',
    color: '#22D3EE',
  },
  {
    id: 'dora-7',
    regulation: 'DORA',
    article: 'Article 7',
    text: 'Financial entities shall have in place a policy on the classification and management of ICT assets, including cryptographic keys throughout their entire lifecycle.',
    explanation: 'Merkle provenance certificates track each key from entropy generation through composition, derivation, and destruction. The full lifecycle is auditable and tamper-evident.',
    color: '#22D3EE',
  },
  {
    id: 'hipaa-164-514',
    regulation: 'HIPAA',
    article: '§164.514(a)',
    text: 'Health information that does not identify an individual and with respect to which there is no reasonable basis to believe that the information can be used to identify an individual is not individually identifiable health information.',
    explanation: 'P1\'s QRNG-OTP anonymization satisfies this via physics: the mapping between original and anonymized data is destroyed using DoD 5220.22-M 3-pass overwrite. "No reasonable basis" is guaranteed by the Born rule, not by computational hardness.',
    color: '#a855f7',
  },
  {
    id: 'ccpa-1798-140',
    regulation: 'CCPA/CPRA',
    article: '§1798.140(h)',
    text: '"Deidentified" means information that cannot reasonably identify, relate to, describe, be capable of being associated with, or be linked, directly or indirectly, to a particular consumer, provided that a business implements technical safeguards and business processes that specifically prohibit reidentification.',
    explanation: 'P1 implements the strongest possible technical safeguard: the re-identification mapping is physically destroyed. The business process requirement is satisfied by the self-destruct audit log.',
    color: '#f59e0b',
  },
  {
    id: 'nis2-21-2e',
    regulation: 'NIS2',
    article: 'Article 21(2)(e)',
    text: 'Measures shall include policies on the use of cryptography and, where appropriate, encryption.',
    explanation: 'Zipminator provides the cryptographic policy engine: PQC key derivation (P2), certified entropy composition (P3), and provenance-auditable key lifecycle (P3). NIS2 essential entities can point to Zipminator as their crypto policy implementation.',
    color: '#3b82f6',
  },
  {
    id: 'nist-fips-203',
    regulation: 'NIST PQC',
    article: 'FIPS 203 (ML-KEM)',
    text: 'This standard specifies the Module-Lattice-Based Key-Encapsulation Mechanism (ML-KEM). NIST recommends that agencies begin planning for the transition to post-quantum cryptography. RSA and ECC will be deprecated by 2030 and disallowed by 2035.',
    explanation: 'Zipminator\'s Rust crypto core implements ML-KEM-768 (FIPS 203), verified against all NIST KAT test vectors. P2\'s CSI entropy feeds directly into ML-KEM key generation. The 2030/2035 deadlines create a forced migration event.',
    color: '#22c55e',
  },
  {
    id: 'eo-14028',
    regulation: 'EO 14028',
    article: 'Section 4',
    text: 'The Federal Government shall employ all appropriate resources and authorities to maximize the early detection, prevention, and remediation of cyber incidents, including the use of zero trust architecture.',
    explanation: 'P3\'s Merkle provenance enables zero-trust entropy: every cryptographic operation can prove which entropy sources contributed, when, and at what quality. No trust assumption is hidden.',
    color: '#ef4444',
  },
]
```

### 4. APP_PLATFORMS
```ts
export const APP_PLATFORMS = [
  { name: 'iOS',        tech: 'Flutter + FRB v2',     status: 'TestFlight',  users: 'Mobile professionals, executives',         color: '#22D3EE' },
  { name: 'macOS',      tech: 'Flutter desktop',       status: 'Alpha',       users: 'Developers, security researchers',          color: '#F59E0B' },
  { name: 'Android',    tech: 'Flutter + FRB v2',     status: 'APK',         users: 'Enterprise BYOD, field operatives',         color: '#34D399' },
  { name: 'Windows',    tech: 'Flutter desktop',       status: 'Alpha',       users: 'Enterprise workstations, gov networks',     color: '#A78BFA' },
  { name: 'Linux',      tech: 'Flutter desktop',       status: 'Alpha',       users: 'Servers, data centers, research labs',       color: '#6366f1' },
  { name: 'Web App',    tech: 'Next.js 16 + React',   status: 'Production',  users: 'Browser access, SaaS customers',            color: '#FB7185' },
  { name: 'JupyterLab', tech: 'PyPI SDK + widget',    status: 'PyPI 0.5.0',  users: 'Data scientists, ML engineers, researchers', color: '#f97316' },
]
```

### 5. APP_VALUATION (scenario-based)
```ts
export const APP_VALUATION: ValRow[] = [
  { method: 'Super-app (all platforms)',     conservative: 20, moderate: 50,  optimistic: 120, unit: 'M' },
  { method: 'PyPI SDK (developer ecosystem)',conservative: 5,  moderate: 15,  optimistic: 40,  unit: 'M' },
  { method: 'Enterprise SaaS (API)',         conservative: 10, moderate: 30,  optimistic: 80,  unit: 'M' },
  { method: 'Defense/Gov (custom deploy)',   conservative: 15, moderate: 40,  optimistic: 100, unit: 'M' },
]
```

### 6. REFERENCES
```ts
export const REFERENCES = [
  { id: 'gdpr-recital-26', citation: 'European Parliament. General Data Protection Regulation (GDPR), Recital 26. Official Journal of the European Union, L 119/1, 2016.', type: 'regulation' },
  { id: 'dora', citation: 'European Parliament. Digital Operational Resilience Act (DORA), Regulation (EU) 2022/2554. Official Journal of the European Union, L 333, 2022.', type: 'regulation' },
  { id: 'hipaa', citation: 'U.S. Department of Health and Human Services. HIPAA Privacy Rule, 45 CFR §164.514. Federal Register, 2000.', type: 'regulation' },
  { id: 'ccpa', citation: 'California Legislature. California Consumer Privacy Act, Cal. Civ. Code §1798.140. 2018, amended 2023 (CPRA).', type: 'regulation' },
  { id: 'nis2', citation: 'European Parliament. NIS2 Directive, Directive (EU) 2022/2555, Article 21(2)(e). Official Journal of the European Union, L 333, 2022.', type: 'regulation' },
  { id: 'fips-203', citation: 'NIST. FIPS 203: Module-Lattice-Based Key-Encapsulation Mechanism Standard. August 2024.', type: 'standard' },
  { id: 'fips-204', citation: 'NIST. FIPS 204: Module-Lattice-Based Digital Signature Standard (ML-DSA). August 2024.', type: 'standard' },
  { id: 'fips-205', citation: 'NIST. FIPS 205: Stateless Hash-Based Digital Signature Standard (SLH-DSA). August 2024.', type: 'standard' },
  { id: 'eo-14028', citation: 'Executive Order 14028: Improving the Nation\'s Cybersecurity. The White House, May 12, 2021.', type: 'regulation' },
  { id: 'cnsa-2', citation: 'NSA. CNSA 2.0: Commercial National Security Algorithm Suite 2.0. September 2022.', type: 'standard' },
  { id: 'sp-800-90b', citation: 'NIST SP 800-90B: Recommendation for the Entropy Sources Used for Random Bit Generation. January 2018.', type: 'standard' },
  { id: 'dod-5220', citation: 'DoD 5220.22-M: National Industrial Security Program Operating Manual, Chapter 8. Department of Defense.', type: 'standard' },
  { id: 'mathur-2008', citation: 'Mathur, S., Miller, R., Varshavsky, A., Trappe, W., Mandayam, N. ProxiMate: Proximity-Based Secure Pairing Using Ambient Wireless Signals. MobiSys 2011. (Based on bilateral CSI key agreement, Mathur et al. MobiCom 2008.)', type: 'academic' },
  { id: 'jana-2009', citation: 'Jana, S., Premnath, S.N., Clark, M., Kasera, S.K., Patwari, N., Krishnamurthy, S.V. On the Effectiveness of Secret Key Extraction from Wireless Signal Strength in Real Environments. MobiCom 2009.', type: 'academic' },
  { id: 'carter-wegman-1979', citation: 'Carter, J.L., Wegman, M.N. Universal Classes of Hash Functions. Journal of Computer and System Sciences, 18(2):143-154, 1979.', type: 'academic' },
  { id: 'trevisan-2001', citation: 'Trevisan, L. Extractors and Pseudorandom Generators. Journal of the ACM, 48(4):860-879, 2001.', type: 'academic' },
  { id: 'vadhan-survey', citation: 'Vadhan, S. Pseudorandomness. Foundations and Trends in Theoretical Computer Science, 7(1-3):1-336, 2012.', type: 'academic' },
  { id: 'born-rule', citation: 'Born, M. Zur Quantenmechanik der Stoßvorgange. Zeitschrift fur Physik, 37(12):863-867, 1926.', type: 'academic' },
]
```

### 7. PATENT_PROSE (structured content from conversation.txt)
```ts
export const PATENT_PROSE = {
  P1: {
    mechanism: 'QRNG generates true random bytes via quantum measurement (Born rule). These bytes form a one-time pad (OTP) that maps each data record to its anonymized form. After anonymization, the OTP mapping is destroyed using DoD 5220.22-M 3-pass overwrite. Because the mapping was generated by quantum measurement, it is information-theoretically random. Because it was physically destroyed, no computation can recover it. This holds even if P=NP.',
    innovation: 'Every existing anonymization method (k-anonymity, differential privacy, tokenization, pseudonymization) relies on computational hardness. An adversary with sufficient compute, or a future quantum computer running Grover\'s algorithm, could theoretically reverse them. P1 is the first anonymization method whose irreversibility is guaranteed by physics, not computation. The Born rule states that quantum measurement outcomes are fundamentally random; there is no hidden variable that could be recovered.',
    implications: 'Under GDPR Recital 26, data that has been rendered truly anonymous falls entirely outside the regulation\'s scope. P1 provides the strongest possible claim to this exemption. Under HIPAA §164.514(a), "no reasonable basis to believe the information can be used to identify an individual" is satisfied by physical impossibility, not statistical improbability. Under CCPA §1798.140(h), the "technical safeguard that prohibits reidentification" is the destruction of the mapping.',
    caveats: 'P1 requires access to a QRNG source. In offline mode, the entropy pool must contain sufficient pre-harvested quantum bytes. The DoD 5220.22-M wipe assumes the storage medium supports overwrite (not valid for wear-leveling flash without TRIM).',
  },
  P2: {
    mechanism: 'A single WiFi-enabled device passively observes Channel State Information (CSI) from ambient WiFi signals. Phase components at the least-significant-bit level contain environmental randomness from multipath propagation. Von Neumann debiasing removes first-order bias. The debiased stream is XOR-fused with QRNG bytes, then fed through HKDF-SHA256 to derive keys compatible with ML-KEM-768 (FIPS 203). Location-locked keys (PUEK) are derived from the CSI eigenstructure of a specific physical location.',
    innovation: 'All prior CSI-based key generation requires two endpoints (bilateral): Alice and Bob both measure the channel between them and derive a shared secret from correlated observations. This has been the only approach since Mathur et al. (MobiCom 2008) and Jana et al. (MobiCom 2009). P2 is the first unilateral CSI entropy system: a single device extracts entropy from ambient signals without requiring a cooperative partner. PUEK (Physical Unclonable Environment Key) is also novel: PUFs fingerprint hardware, while PUEK fingerprints the RF environment of a specific location. The key changes if the device moves.',
    implications: 'Unilateral CSI entropy enables mesh networks, IoT devices, and mobile phones to harvest randomness from their environment without infrastructure support. PUEK enables geofencing at the cryptographic level: a key that only works in a specific room, building, or zone. Military and intelligence applications include tactical mesh encryption with location-locked keys that self-invalidate if the device is captured and moved.',
    caveats: 'CSI entropy rate depends on environmental richness (multipath density). In anechoic or RF-quiet environments, the entropy rate drops. The compositor (P3) handles this via health monitoring and graceful degradation.',
  },
  P3: {
    mechanism: 'ARE (Algebraic Randomness Extraction) runs each input value through a program of arithmetic operations across five number systems: natural numbers (N), integers (Z), rationals (Q), reals (R), and complex numbers (C). The program is generated deterministically from a seed via SHAKE-256. Each step consumes 34 bytes from the seed: 1 byte selects the domain (mod 5), 16 bytes for the operand value, 16 bytes for the imaginary component, 1 byte selects the operation (mod 6: ADD, SUB, MUL, DIV, EXP, MOD). The result passes through all steps, then abs(result) mod prime produces the output. Merkle provenance certificates record which entropy sources contributed, when, at what health status, and at what min-entropy rate. Each source record is hashed and assembled into a Merkle tree whose root serves as a tamper-evident fingerprint of the entire entropy lineage.',
    innovation: 'ARE is a genuinely new family of randomness extractors. All known extractors since Carter and Wegman (1979) use linear or near-linear operations in binary fields (GF(2)). Universal hashing, Trevisan extractors, and the Leftover Hash Lemma all operate in one algebraic domain. ARE uses nonlinear arithmetic across five algebraic structures. If the formal security proof holds, it becomes the third extractor family in 47 years. Merkle provenance is also novel: no existing system provides cryptographic proof of entropy lineage. NIST SP 800-90B defines health tests for single sources but says nothing about multi-source composition, provenance tracking, or certificates.',
    implications: 'DORA Article 7 requires full cryptographic key lifecycle management. Regulators can ask: "Where did the entropy for this key come from? Prove it." No existing system can answer this. Zipminator\'s Merkle certificates can. Graceful degradation is the third innovation: most multi-source systems either require all sources (fragile) or silently substitute a weaker source when one fails (dishonest). Zipminator\'s compositor excludes failed sources, includes degraded sources with warnings, drops the reported min-entropy bound to reflect only what actually contributed, and records everything in the certificate.',
    caveats: 'ARE currently relies on SHA-256 counter mode for final output expansion (are.py lines 496-506). A pure security proof showing ARE alone produces near-uniform output would make it a standalone primitive. That proof is the main contribution for Paper 3 and a collaboration target with Dodis (NYU), Vadhan (Harvard), or Renner (ETH Zurich).',
  },
}
```

### Update SECTION_LIST
Add two entries at the end:
```ts
{ id: 'product-showcase', title: 'Product Showcase' },
{ id: 'references', title: 'References & Citations' },
```

### Update PILLARS completion percentages
Sync with `docs/guides/FEATURES.md` (read it first). Update all `completion` values to match the code-verified percentages from FEATURES.md.

---

## Section-by-Section Enhancement Instructions

### Section 1: Three-Patent Stack

**Add prose (3-4 paragraphs):**
- Explain the vertical dependency: P2 generates entropy (CSI + QRNG), P3 certifies and composes it (ARE + Merkle), P1 consumes it for anonymization (QRNG-OTP-Destroy).
- Explain the patent thicket: "With one patent, a competitor can potentially design around it. With three, they need to simultaneously avoid unilateral CSI entropy harvesting (P2), certified composition with provenance (P3), and physics-guaranteed anonymization (P1). Designing around one is hard. Designing around all three simultaneously while still delivering quantum-safe, auditable, multi-source entropy with provable anonymization? Practically impossible without licensing."
- Use the "three locks on the door, not one" framing from conversation.txt.

**Keep:** existing patent stack cards and flow diagram.

---

### Section 2: Regulatory Moat

**Add prose (4-5 paragraphs):**
- Frame regulations as the demand engine that grows over time.
- Walk through the regulatory pressure curve: GDPR (2018) started the privacy wave, DORA (2025) adds financial crypto requirements, NIST PQC (2024) starts the quantum clock, CNSA 2.0 (2027) forces military migration, and the 2030/2035 RSA/ECC deprecation/disallowance creates a forced migration event for all remaining organizations.
- Explain that each regulation that takes effect deepens the moat around solutions that already satisfy those requirements.

**Add 7 citation callouts** using BlueprintCitationCallout (or the inline pattern):
Use the data from `REGULATION_CITATIONS` above. Place them after the regulation table. The GDPR Recital 26 callout already exists; add:
1. DORA Article 6.1
2. DORA Article 6.4
3. DORA Article 7
4. HIPAA §164.514(a)
5. CCPA/CPRA §1798.140(h)
6. NIS2 Article 21(2)(e)
7. NIST FIPS 203

Group them visually: privacy regulations (GDPR, HIPAA, CCPA) together, then compliance (DORA), then PQC (NIST, CNSA, EO 14028, NIS2).

**Keep:** existing AreaChart and regulation table unchanged.

---

### Section 3: Patent Deep Dives

**This section needs the most content.** Transform from tabbed-cards-with-bar-charts into deep documentation per patent.

**Per patent, add 5-6 paragraphs covering:**
1. Mechanism (from PATENT_PROSE above)
2. Innovation (what makes it novel, with prior art comparison)
3. Implications (regulatory and commercial)
4. Caveats (honest limitations)

**Add data tables:**
- For P3: Insert the ARE Extractor Family Comparison table from `ARE_EXTRACTOR_COMPARISON`. Style it like the existing regulation table (alternating rows, mono values, color-coded accent).
- For P2: Add a prior art comparison mini-table showing Mathur 2008, Jana 2009, Liu 2012, Avrahami 2023 as bilateral vs. Zipminator as unilateral.
- For P1: Add a comparison table showing k-anonymity, differential privacy, tokenization, pseudonymization, homomorphic encryption as computational vs. P1 as information-theoretic.

**Add mechanism code blocks** using the mechanism code block pattern for each patent's technical flow.

**Add the Merkle provenance analogy** for P3: "When you buy organic food, there is a chain-of-custody certificate: this apple came from this farm, picked on this date, inspected by this auditor. Merkle provenance does the same for entropy."

**Add the graceful degradation framing** for P3: "Most multi-source systems either require all sources (fragile) or silently substitute a weaker source when one fails (dishonest). Zipminator does neither."

**Keep:** the tabbed P1/P2/P3 interface and bar charts. Add prose ABOVE the charts within each tab.

---

### Section 4: Novelty Assessment

**Add prose (3-4 paragraphs):**
- Explain what "zero prior results" means in patent terms: a clean prosecution path with no blocking prior art.
- Explain the DIY prior art search: 9 web searches across Google Patents, Google Scholar, Espacenet. Zero blocking results for any of the three patents.
- Note that Patentstyret performs their own novelty search during examination (6-12 months, included in filing fee).

**Add a "World's Firsts" callout box** (cyan accent):
List all unique innovations:
1. First physics-proven anonymization (Born rule irreversibility)
2. First unilateral CSI entropy harvesting
3. First location-locked keys (PUEK, environment fingerprint)
4. First algebraic randomness extractor (ARE, 5 domains)
5. First Merkle-tree entropy provenance
6. First multi-source compositor with graceful degradation + honest bounds
7. First CSI + PQC combination (WiFi CSI → ML-KEM-768)
8. First 9-pillar PQC super-app

**Keep:** RadarChart and prior art comparison table unchanged.

---

### Section 5: Valuation Analysis

**Add prose (5-6 paragraphs). This is critical; do NOT hedge:**
- Start with the correction: "Patent 1 alone was previously valued at $25-50M R&D replacement cost and $500M-5B lifetime value. Three complementary patents cannot logically total less than one. The original single-patent analysis had it right."
- Explain the stack effect: "A patent portfolio is worth more than the sum of its parts when the patents are complementary. A competitor needs to license all three or design around each independently. This probability increase is where the real value multiplication happens."
- Walk through R&D replacement methodology: 40-55 cryptographic engineers for 2 years at $150-250K/year = $50-100M.
- Walk through standard-essential lifetime value: if any patent becomes referenced in NIST, ETSI, or ISO standards for quantum-safe crypto, GDPR compliance, or entropy management, licensing revenue over the 20-year patent term is $1-10B.
- Walk through pre-revenue methodology: comparable seed-stage deep-tech companies with filed patents.
- DO NOT write "I cannot give you a precise number" or similar hedge language. State the ranges directly with the methodology that produces them.

**Add the VALUATION_PROGRESSION table** (1-patent, 2-patent, 3-patent) from the new data export. Render as a styled data table.

**Add AnimatedCounter** for the three hero metrics (R&D Replacement, Lifetime Value, Pre-Revenue). Import from `@/components/pitch/pitch-ui/AnimatedCounter`.

**Keep:** existing BarChart, Treemap, and Lifetime callout box. The VALUATION_PROGRESSION table should go ABOVE the existing chart.

---

### Section 6: Comparable Transactions

**Add prose (3-4 paragraphs):**
- Position QDaria between PQShield ($37M, 2023) and SandboxAQ ($5.6B, 2024).
- Explain why no direct comparable exists: no company combines PQC + anonymization + QRNG + CSI entropy + 9-pillar super-app.
- Note that SandboxAQ ($5.6B) has no patent thicket covering entropy generation, composition, and consumption. OneTrust ($5.3B) addresses GDPR compliance but not PQC. Quantinuum ($5B) is quantum computing, not quantum security.

**Keep:** existing horizontal BarChart and table unchanged.

---

### Section 7: Company Valuation

**Add prose (4-5 paragraphs):**
- Walk through each stage trigger: pre-revenue (now, 3 patents + working product on PyPI), first enterprise customer (revenue signal + DORA compliance), gov/defense contract (military procurement validation), Series A (ARR + regulatory tailwind), post-2030 (RSA deprecated, forced PQC migration worldwide).
- Explain why the floor goes up with three patents: "the question investors ask is not 'what is the maximum?' but 'what is the defensibility?' One patent = one point of failure. Three complementary patents covering entropy generation, composition, and consumption = a stack that would take a well-funded competitor 3-5 years and $50-100M to replicate."

**Keep:** existing AreaChart and table unchanged.

---

### Section 8: Use Cases

**Add prose (2-3 paragraphs):**
- Frame the 12 sectors by urgency tier: Tier 1 (urgency >90): Intelligence, Military, Banking, Healthcare. Tier 2 (75-90): Law Enforcement, Government, Telecom, Enterprise, Exchanges. Tier 3 (<75): Research, Individual, Data Science.
- Explain the urgency scoring: composite of regulatory deadline pressure, adversary capability, data sensitivity, and procurement cycle length.

**Keep:** existing urgency BarChart and sector cards unchanged.

---

### Section 9: 9 Pillars

**Add prose (3-4 paragraphs):**
- Explain the super-app concept: "No competitor offers PQC messaging, VPN, email, vault, browser, anonymization, AI, video, and mesh from a single app with a single codebase. Signal does messaging. ProtonMail does email. NordVPN does VPN. Wickr does messaging. None of them does PQC. None of them does QRNG. None of them does all nine."
- Explain the "single codebase, 6 platforms" value: Flutter + Rust FFI means one engineering team covers iOS, macOS, Android, Windows, Linux, and web.

**Update PILLARS completion %** from FEATURES.md (read it, use current values).

**Keep:** existing 3x3 grid and stacked bar unchanged.

---

### Section 10: Competitor Analysis

**Add prose (3-4 paragraphs):**
- Walk through each competitor's specific gap.
- Signal: has PQC (PQXDH), no QRNG, no anonymization, messaging only.
- ProtonMail: no PQC, email + VPN only, no QRNG, limited anonymization.
- NordVPN: partial PQC experiments, VPN only, no QRNG, no anonymization.
- Wickr (AWS): deprecated by Amazon, no PQC, messaging + file sharing only.

**Keep:** RadarChart and feature table unchanged.

---

### Section 11: Market Size

**Add prose (3-4 paragraphs):**
- Identify the three market growth drivers: (1) NIST 2030 RSA deprecation forces every organization to migrate, (2) DORA July 2025 requires financial entities to document crypto policy, (3) CNSA 2.0 2027 deadline forces all National Security Systems to use ML-KEM.
- Note the exponential PQC market growth: $2B (2025) to $20B (2030) to $80B (2035), a 50% CAGR.

**Keep:** existing PieChart, AreaChart, and TAM/SAM/SOM table unchanged.

---

### Section 12: Why the Floor Matters

**Add prose (4-5 paragraphs). This is the closing argument:**
- "For seed conversations, the question is not 'what is the maximum?' but 'what is the floor?' One patent is one point of failure. Three patents close the design-around routes."
- "The floor is built on: $50-100M R&D replacement cost (40-55 engineers, 2 years), 3 independent design-around challenges (one per patent layer), 2 regulatory deadlines creating forced demand (DORA 2025, NIST 2030), and 8 world's firsts compounding into an unreplicable moat."
- Include the filing cost: "File Patents 2 and 3 before publishing the papers. NOK 2,763 per filing, NOK 5,526 total. The asymmetry between filing cost and IP value is extreme."
- Final paragraph: tie back to the thicket. "Three locks on the door. A competitor needs to license all three or replicate $50-100M in R&D across CSI hardware, algebraic cryptography, and quantum measurement theory, then design around each patent's claims independently. That is the floor."

**Keep:** existing BarChart, dimension table, FunnelChart, and callout box unchanged.

---

### Section 13: Product Showcase (NEW)

**Create `web/components/blueprint/sections/SectionProductShowcase.tsx`**

This section showcases Zipminator as a multiplatform product.

**Content:**
1. **Prose (5-6 paragraphs):**
   - Explain the multiplatform value: one Rust crypto core + Flutter UI = 6 native platforms from a single codebase.
   - Explain each distribution channel: App Store (iOS), Play Store (Android), DMG (macOS), MSI (Windows), Flatpak/AppImage (Linux), web app (Next.js), PyPI SDK (JupyterLab + Python pipelines).
   - Explain the SDK angle: `pip install zipminator` gives data scientists and ML engineers anonymization, PQC encryption, and quantum entropy in their notebooks. Free tier (L1-3), paid tier (L4+) with API key.
   - Explain the enterprise angle: on-premise deployment, air-gapped government networks, custom integration via REST API.
   - Explain the individual angle: personal PQC vault, quantum-safe messaging, zero-knowledge authentication.

2. **Platform grid** using APP_PLATFORMS data: 7 cards in a responsive grid (2-col mobile, 4-col desktop). Each card shows platform name, tech stack badge, status badge, and target user description.

3. **App valuation bar chart** using APP_VALUATION data: horizontal grouped bars with conservative/moderate/optimistic scenarios.

4. **Integration callout box** (cyan accent): "Every platform shares the same Rust cryptographic core. A vulnerability fixed in the Rust crate propagates to all 6 platforms simultaneously. No platform-specific crypto implementations. No divergence."

**Add to `page.tsx`:**
```tsx
<BlueprintSection id="product-showcase" number={13} title="Product Showcase">
  <SectionProductShowcase scenario={scenario} />
</BlueprintSection>
```

---

### Section 14: References & Citations (NEW)

**Create `web/components/blueprint/sections/SectionReferences.tsx`**

This section lists all references in academic format.

**Content:**
1. **Prose (1-2 paragraphs):** "This document cites regulatory text, academic publications, and industry standards. All citations have been verified against primary sources."

2. **Reference list** from REFERENCES data, grouped by type:
   - **Regulations** (GDPR, DORA, HIPAA, CCPA, NIS2, EO 14028)
   - **Standards** (FIPS 203/204/205, CNSA 2.0, SP 800-90B, DoD 5220.22-M)
   - **Academic** (Mathur 2008, Jana 2009, Carter-Wegman 1979, Trevisan 2001, Vadhan survey, Born 1926)

3. **Style:** numbered list, monospace IDs, DM Sans citation text. Each entry has an `id` anchor for deep linking.

**Add to `page.tsx`:**
```tsx
<BlueprintSection id="references" number={14} title="References & Citations">
  <SectionReferences />
</BlueprintSection>
```

---

## Optional Enhancement: Three.js 3D Hero

If time permits, create `web/components/blueprint/BlueprintHero3D.tsx`:

```tsx
'use client'
import dynamic from 'next/dynamic'

const Hero3D = dynamic(() => import('./BlueprintHero3DCanvas'), { ssr: false })

export const BlueprintHero3D = () => (
  <div className="absolute inset-0 -z-10 opacity-30">
    <Hero3D />
  </div>
)
```

The canvas should render:
- Three particle clusters (cyan, amber, emerald) representing P1, P2, P3
- Lines connecting them (representing the patent thicket)
- Slow orbit animation
- Mouse-responsive parallax

Mark this as OPTIONAL. The page should work without it.

---

## Execution Phases

### Phase 1: Data Layer
1. Add all 7 new exports to `web/lib/blueprint-data.ts`
2. Update `SECTION_LIST` with entries 13-14
3. Update `PILLARS` completion percentages from FEATURES.md

### Phase 2: Shared Components
1. Create `BlueprintProseBlock.tsx`
2. Create `BlueprintCitationCallout.tsx`

### Phase 3: Enhance Existing Sections (batch in groups)
- Batch A: Sections 1-3 (Patent Stack, Regulatory Moat, Patent Deep Dives)
- Batch B: Sections 4-6 (Novelty, Valuation, Comparables)
- Batch C: Sections 7-9 (Company Val, Use Cases, Pillars)
- Batch D: Sections 10-12 (Competitors, Market Size, Floor Matters)

### Phase 4: New Sections
1. Create SectionProductShowcase.tsx
2. Create SectionReferences.tsx
3. Register both in page.tsx

### Phase 5: Polish
1. Add AnimatedCounter to Section 5 hero metrics
2. Verify `cd web && npx next build` compiles
3. Run `cd web && npm run dev` and visually verify at `localhost:3099/invest/blueprint`
4. Take Playwright screenshot as proof

---

## Quality Gates (ALL must pass)

1. [ ] Every section has 3+ paragraphs of DM Sans prose
2. [ ] All 8 regulations have verbatim citation callouts (GDPR + 7 new)
3. [ ] ARE extractor family comparison table present in Section 3
4. [ ] Merkle provenance "organic food" analogy present in Section 3
5. [ ] Graceful degradation "fragile vs dishonest" framing present in Section 3
6. [ ] VALUATION_PROGRESSION table (1/2/3-patent) present in Section 5
7. [ ] No hedge language ("I cannot give you a number", "Anyone who does is making it up")
8. [ ] AnimatedCounter used for at least 3 headline numbers
9. [ ] Scenario toggle updates all valuation numbers live (preserve existing behavior)
10. [ ] All headings use Fraunces font
11. [ ] All body prose uses DM Sans font
12. [ ] All data values use JetBrains Mono font
13. [ ] Section 13 (Product Showcase) exists with platform grid and app valuation chart
14. [ ] Section 14 (References) exists with grouped reference list
15. [ ] `cd web && npx next build` completes without errors
16. [ ] Page renders at `localhost:3099/invest/blueprint` with all 14 sections visible

---

## IMPORTANT RULES

- Do NOT create a pitch deck. This is documentation with embedded visualizations.
- Do NOT use hedge language. State valuations directly with the methodology that produces them.
- Do NOT add mock data. All numbers come from the data exports or conversation.txt.
- Do NOT break existing functionality. The scenario toggle, sidebar nav, and IntersectionObserver must continue working.
- PRESERVE the existing chart implementations. Add prose around them, do not replace them.
- Follow CLAUDE.md rules: banned words, no em dashes, zero hallucination protocol.
- Every citation must be verifiable. Use REGULATION_CITATIONS data verbatim.
- Files must be under 500 lines each. If a section component exceeds 500, split helpers into a separate file.
