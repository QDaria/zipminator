export type BpScenario = 'conservative' | 'moderate' | 'optimistic'

// ---------------------------------------------------------------------------
// S1: Patent Stack
// ---------------------------------------------------------------------------
export const PATENT_STACK = [
  { id: 'P1', name: 'Quantum Anonymization', layer: 'Consumption', color: '#22D3EE', filing: '20260384', status: 'FILED', claims: 15, desc: 'QRNG-OTP-Destroy: information-theoretically irreversible anonymization via Born rule' },
  { id: 'P2', name: 'CSI Entropy + PUEK', layer: 'Generation', color: '#F59E0B', filing: 'TO FILE', status: 'DRAFTED', claims: 13, desc: 'Unilateral WiFi entropy harvesting + location-locked keys via RF eigenstructure' },
  { id: 'P3', name: 'CHE + ARE', layer: 'Composition', color: '#34D399', filing: 'TO FILE', status: 'DRAFTED', claims: 12, desc: 'Algebraic Randomness Extraction over N/Z/Q/R/C + Merkle provenance certificates' },
]

export const STACK_FLOW = [
  { from: 'P2', to: 'P3', label: 'CSI entropy bytes' },
  { from: 'P3', to: 'P1', label: 'Certified entropy' },
  { from: 'P2', to: 'P1', label: 'QRNG pool' },
]

// ---------------------------------------------------------------------------
// S2: Regulatory Moat
// ---------------------------------------------------------------------------
export const REGULATIONS = [
  { id: 'gdpr', name: 'GDPR', citation: 'Recital 26', requirement: 'Anonymous data = not identifiable → falls outside regulation scope entirely', deadline: '2018-05-25', region: 'EU', patent: 'P1', penalty: '4% global turnover or €20M', color: '#6366f1' },
  { id: 'dora', name: 'DORA', citation: 'Art. 6.1, 6.4, 7', requirement: 'Crypto policy documentation + periodic updates based on cryptanalysis + full key lifecycle audit trail', deadline: '2025-07-01', region: 'EU/NO', patent: 'P3', penalty: '2% global turnover', color: '#22D3EE' },
  { id: 'hipaa', name: 'HIPAA', citation: '§164.514(a)', requirement: 'Safe Harbor de-identification (18 identifiers) or Expert Determination method', deadline: '1996-08-21', region: 'US', patent: 'P1', penalty: '$1.9M per violation category', color: '#a855f7' },
  { id: 'ccpa', name: 'CCPA/CPRA', citation: '§1798.140(h)', requirement: 'De-identification with technical safeguards + re-identification prohibition', deadline: '2023-01-01', region: 'US-CA', patent: 'P1', penalty: '$7,500 per intentional violation', color: '#f59e0b' },
  { id: 'nis2', name: 'NIS2', citation: 'Art. 21(2)(e)', requirement: 'Crypto & encryption policies for critical infrastructure operators', deadline: '2024-10-17', region: 'EU', patent: 'P2+P3', penalty: '€10M or 2% turnover', color: '#3b82f6' },
  { id: 'nist', name: 'NIST PQC', citation: 'FIPS 203/204/205', requirement: 'ML-KEM mandatory; RSA/ECC deprecated 2030, disallowed 2035', deadline: '2024-08-13', region: 'Global', patent: 'P2', penalty: 'Federal procurement exclusion', color: '#22c55e' },
  { id: 'eo14028', name: 'EO 14028', citation: 'Sec. 4', requirement: 'Federal zero-trust architecture + software supply chain integrity', deadline: '2021-05-12', region: 'US', patent: 'P3', penalty: 'Contract disqualification', color: '#ef4444' },
  { id: 'cnsa', name: 'NSA CNSA 2.0', citation: '—', requirement: 'All National Security Systems must use ML-KEM by 2027', deadline: '2027-01-01', region: 'US/NATO', patent: 'P2', penalty: 'NSS decertification', color: '#fb7185' },
]

export const REGULATORY_TIMELINE = [
  { year: 2018, label: 'GDPR enforced', category: 'privacy' },
  { year: 2021, label: 'EO 14028 signed', category: 'security' },
  { year: 2023, label: 'CCPA/CPRA enforced', category: 'privacy' },
  { year: 2024, label: 'NIST PQC finalized + NIS2 deadline', category: 'pqc' },
  { year: 2025, label: 'DORA enforced (Jul)', category: 'compliance' },
  { year: 2027, label: 'CNSA 2.0 deadline', category: 'pqc' },
  { year: 2030, label: 'RSA/ECC deprecated', category: 'pqc' },
  { year: 2035, label: 'RSA/ECC disallowed', category: 'pqc' },
]

// ---------------------------------------------------------------------------
// S3: Patent Deep Dives
// ---------------------------------------------------------------------------
export const PATENT_DETAILS = {
  P1: {
    title: 'Method and System for Irreversible Data Anonymization Using Quantum Random Number Generation',
    inventor: 'Daniel Mo Houshmand',
    assignee: 'QDaria AS',
    filingNo: '20260384',
    filingDate: '2026-03-24',
    jurisdiction: 'Norway (Patentstyret)',
    independentClaims: 3,
    dependentClaims: 12,
    totalClaims: 15,
    priorArtCount: 0,
    noveltyScore: 98,
    keyInnovation: 'Information-theoretic irreversibility via Born rule — holds even if P=NP',
    mechanism: 'QRNG → OTP mapping → anonymize → destroy mapping (DoD 5220.22-M 3-pass)',
    monetization: [
      { path: 'Standards-essential licensing', value: { conservative: 500, moderate: 2000, optimistic: 5000 } },
      { path: 'GDPR compliance SaaS', value: { conservative: 200, moderate: 800, optimistic: 2000 } },
      { path: 'Defensive / cross-license', value: { conservative: 100, moderate: 300, optimistic: 500 } },
    ],
  },
  P2: {
    title: 'Method and System for Unilateral Entropy Harvesting from Wireless CSI with Post-Quantum Key Derivation',
    inventor: 'Daniel Mo Houshmand',
    assignee: 'QDaria AS',
    filingNo: 'TO FILE',
    filingDate: '—',
    jurisdiction: 'Norway (Patentstyret)',
    independentClaims: 3,
    dependentClaims: 10,
    totalClaims: 13,
    priorArtCount: 0,
    noveltyScore: 99,
    keyInnovation: 'First unilateral CSI entropy — all prior art bilateral. PUEK fingerprints environment, not hardware.',
    mechanism: 'Phase LSB extraction → Von Neumann debiasing → XOR with QRNG → HKDF-SHA256 → ML-KEM-768 mesh keys',
    monetization: [
      { path: 'IoT/mesh licensing', value: { conservative: 400, moderate: 1500, optimistic: 4000 } },
      { path: 'Military PUEK geofencing', value: { conservative: 600, moderate: 2000, optimistic: 6000 } },
      { path: 'Telecom 5G integration', value: { conservative: 300, moderate: 1000, optimistic: 3000 } },
    ],
  },
  P3: {
    title: 'Certified Heterogeneous Entropy Composition with Algebraic Randomness Extraction and Cryptographic Provenance',
    inventor: 'Daniel Mo Houshmand',
    assignee: 'QDaria AS',
    filingNo: 'TO FILE',
    filingDate: '—',
    jurisdiction: 'Norway (Patentstyret)',
    independentClaims: 3,
    dependentClaims: 9,
    totalClaims: 12,
    priorArtCount: 0,
    noveltyScore: 95,
    keyInnovation: 'ARE: first algebraic extractor family (N/Z/Q/R/C × 6 ops). Merkle provenance = auditable entropy.',
    mechanism: 'SHAKE-256 seed → ARE program → XOR fusion → SP 800-90B health → Merkle certificate',
    monetization: [
      { path: 'DORA compliance platform', value: { conservative: 300, moderate: 1200, optimistic: 3000 } },
      { path: 'Entropy-as-a-Service API', value: { conservative: 200, moderate: 800, optimistic: 2000 } },
      { path: 'Audit/GRC integration', value: { conservative: 150, moderate: 500, optimistic: 1500 } },
    ],
  },
}

// ---------------------------------------------------------------------------
// S4: Novelty Assessment
// ---------------------------------------------------------------------------
export const NOVELTY_RADAR = [
  { dimension: 'Theoretical Novelty', P1: 95, P2: 99, P3: 92, priorArt: 30 },
  { dimension: 'Implementation Maturity', P1: 90, P2: 85, P3: 88, priorArt: 70 },
  { dimension: 'Standards Alignment', P1: 85, P2: 95, P3: 90, priorArt: 60 },
  { dimension: 'Market Readiness', P1: 80, P2: 75, P3: 78, priorArt: 65 },
  { dimension: 'Defensive Depth', P1: 88, P2: 92, P3: 85, priorArt: 40 },
]

export const PRIOR_ART_COMPARISON = [
  { area: 'CSI Key Agreement', approach: 'Bilateral (Mathur 2008, Jana 2009)', limitation: 'Requires 2 endpoints', zipAdvantage: 'Unilateral — single device (P2)' },
  { area: 'RF-PUF', approach: 'Hardware fingerprinting (Chatterjee 2018)', limitation: 'Key bound to device', zipAdvantage: 'PUEK — key bound to location (P2)' },
  { area: 'Randomness Extraction', approach: 'Hash-based (Carter-Wegman, Trevisan, LHL)', limitation: 'All linear/binary', zipAdvantage: 'ARE — algebraic over N/Z/Q/R/C (P3)' },
  { area: 'Entropy Provenance', approach: 'None', limitation: 'Black box — no audit trail', zipAdvantage: 'Merkle certificates (P3)' },
  { area: 'Data Anonymization', approach: 'k-anonymity, DP, tokenization', limitation: 'Computational hardness only', zipAdvantage: 'Information-theoretic via Born rule (P1)' },
]

// ---------------------------------------------------------------------------
// S5: Valuation
// ---------------------------------------------------------------------------
export interface ValRow { method: string; conservative: number; moderate: number; optimistic: number; unit: string }

export const VALUATION_METHODS: ValRow[] = [
  { method: 'R&D Replacement (3 patents)', conservative: 50, moderate: 75, optimistic: 100, unit: 'M' },
  { method: 'Lifetime (if standard-essential)', conservative: 1000, moderate: 3000, optimistic: 10000, unit: 'M' },
  { method: 'Pre-Revenue Portfolio', conservative: 15, moderate: 30, optimistic: 50, unit: 'M' },
  { method: 'P1 Anonymization', conservative: 15, moderate: 25, optimistic: 50, unit: 'M' },
  { method: 'P2 CSI + PUEK', conservative: 20, moderate: 35, optimistic: 80, unit: 'M' },
  { method: 'P3 CHE + ARE', conservative: 15, moderate: 25, optimistic: 50, unit: 'M' },
]

export const RD_COST_BREAKDOWN = [
  { category: 'Cryptographic Engineering (Rust)', amount: 18, color: '#22D3EE' },
  { category: 'QRNG Integration (IBM/qBraid)', amount: 8, color: '#F59E0B' },
  { category: 'Multi-Platform Dev (Flutter/Tauri/Next)', amount: 22, color: '#A78BFA' },
  { category: 'Testing & Compliance (NIST KAT/fuzz)', amount: 12, color: '#34D399' },
  { category: 'Security Audit & Certification', amount: 8, color: '#FB7185' },
  { category: 'Research & Patent Drafting', amount: 7, color: '#6366f1' },
]

// ---------------------------------------------------------------------------
// S6: Comparable Transactions
// ---------------------------------------------------------------------------
export const COMPARABLES = [
  { company: 'SandboxAQ', valuation: 5600, year: 2024, type: 'Quantum security', relevance: 'Direct PQC competitor, Google spinoff' },
  { company: 'OneTrust', valuation: 5300, year: 2021, type: 'Privacy/compliance', relevance: 'GDPR compliance platform leader' },
  { company: 'Quantinuum', valuation: 5000, year: 2023, type: 'Quantum computing', relevance: 'Honeywell + Cambridge Quantum' },
  { company: 'BigID', valuation: 1250, year: 2021, type: 'Data privacy AI', relevance: 'Automated PII discovery + anonymization' },
  { company: 'Virtru', valuation: 150, year: 2022, type: 'Data encryption', relevance: 'End-to-end encryption platform' },
  { company: 'Duality Technologies', valuation: 70, year: 2022, type: 'Privacy-preserving compute', relevance: 'Homomorphic encryption startup' },
  { company: 'Post-Quantum', valuation: 50, year: 2024, type: 'PQC algorithms', relevance: 'UK-based PQC, fewer patents' },
  { company: 'PQShield', valuation: 37, year: 2023, type: 'PQC hardware IP', relevance: 'PQC silicon IP licensing' },
]

// ---------------------------------------------------------------------------
// S7: Company Valuation
// ---------------------------------------------------------------------------
export const COMPANY_STAGES = [
  { stage: 'Pre-revenue (now)', conservative: 15, moderate: 30, optimistic: 50, trigger: '3 patents + working product + PyPI' },
  { stage: 'First enterprise customer', conservative: 40, moderate: 80, optimistic: 150, trigger: 'Revenue signal + DORA compliance' },
  { stage: 'Gov/defense contract', conservative: 100, moderate: 250, optimistic: 500, trigger: 'Validated by military procurement' },
  { stage: 'Series A (post-DORA)', conservative: 150, moderate: 400, optimistic: 1000, trigger: 'Regulatory tailwind + ARR' },
  { stage: 'Post-2030 (RSA deprecated)', conservative: 500, moderate: 2000, optimistic: 10000, trigger: 'Forced PQC migration worldwide' },
]

// ---------------------------------------------------------------------------
// S8: Use Cases
// ---------------------------------------------------------------------------
export const USE_CASES = [
  { sector: 'Intelligence', orgs: 'CIA, NSA, MI6, BND', useCase: 'Quantum-safe SIGINT, classified comms, PUEK geofencing', urgency: 98, tam: 15, icon: 'Shield', color: '#ef4444' },
  { sector: 'Military', orgs: 'DARPA, NATO, DoD, FFI', useCase: 'Tactical mesh encryption, field-deployed PUEK', urgency: 96, tam: 25, icon: 'Radio', color: '#f59e0b' },
  { sector: 'Law Enforcement', orgs: 'FBI, Europol, Interpol, Kripos', useCase: 'Evidence anonymization, witness protection data', urgency: 88, tam: 8, icon: 'Eye', color: '#a855f7' },
  { sector: 'Banking', orgs: 'SpareBank 1, DNB, JPMorgan, HSBC', useCase: 'DORA-compliant key lifecycle, PII anonymization', urgency: 92, tam: 40, icon: 'Database', color: '#22D3EE' },
  { sector: 'Healthcare', orgs: 'Helse Sør-Øst, NHS, Kaiser, Mayo', useCase: 'HIPAA de-identification, patient data for research', urgency: 90, tam: 30, icon: 'Cpu', color: '#34D399' },
  { sector: 'Government', orgs: 'Datatilsynet, ENISA, CISA, BSI', useCase: 'Sovereign crypto infrastructure, GDPR compliance', urgency: 85, tam: 20, icon: 'Globe', color: '#6366f1' },
  { sector: 'Telecom', orgs: 'Telenor, AT&T, Vodafone, T-Mobile', useCase: 'Q-VPN for 5G backhaul, CSI entropy harvesting', urgency: 78, tam: 35, icon: 'Wifi', color: '#3b82f6' },
  { sector: 'Enterprise', orgs: 'SAP, Salesforce, Oracle, Microsoft', useCase: 'Data anonymization pipelines, PQC key management', urgency: 75, tam: 50, icon: 'Zap', color: '#f97316' },
  { sector: 'Research', orgs: 'CERN, NTNU, MIT, ETH Zürich', useCase: 'Quantum-safe research data sharing', urgency: 65, tam: 5, icon: 'Bot', color: '#8b5cf6' },
  { sector: 'Exchanges', orgs: 'NYSE, OSE, LSE, NASDAQ', useCase: 'Transaction anonymization, audit-ready entropy', urgency: 80, tam: 15, icon: 'Database', color: '#ec4899' },
  { sector: 'Individual', orgs: 'Privacy-conscious users', useCase: 'Personal PQC vault, quantum-safe messaging', urgency: 50, tam: 10, icon: 'Shield', color: '#14b8a6' },
  { sector: 'Data Science', orgs: 'Jupyter/notebook users, ML teams', useCase: 'PyPI SDK, anonymization in ML pipelines', urgency: 55, tam: 8, icon: 'Cpu', color: '#64748b' },
]

// ---------------------------------------------------------------------------
// S9: 9 Pillars
// ---------------------------------------------------------------------------
export const PILLARS = [
  { name: 'Quantum Vault', completion: 100, tech: ['Rust', 'ML-KEM-768', 'DoD 5220.22-M'], desc: 'AES-256-GCM + PQC key agreement, zero telemetry, self-destruct', color: '#22D3EE' },
  { name: 'Q-Messenger', completion: 50, tech: ['WebRTC', 'Double Ratchet', 'ML-KEM'], desc: 'Quantum-secure messaging with live signaling server', color: '#F59E0B' },
  { name: 'VoIP & Video', completion: 50, tech: ['WebRTC', 'PQ-SRTP', 'Flutter'], desc: 'End-to-end quantum-secure voice/video communication', color: '#34D399' },
  { name: 'Q-VPN', completion: 50, tech: ['PQ-WireGuard', 'PUEK', 'Mesh'], desc: 'Quantum-safe VPN with location-locked keys', color: '#A78BFA' },
  { name: 'Anonymization', completion: 100, tech: ['10-Level', 'QRNG-OTP', 'k-Anon', 'DP'], desc: '10-level anonymization from regex to quantum OTP', color: '#FB7185' },
  { name: 'Q-AI', completion: 100, tech: ['Privacy ML', 'RuView', 'CSI'], desc: 'Quantum-aware AI with privacy-preserving inference', color: '#6366f1' },
  { name: 'Q-Email', completion: 90, tech: ['PQC SMTP/IMAP', 'PII Scanner', 'Self-Destruct'], desc: 'Quantum-secure email with automatic PII detection', color: '#22c55e' },
  { name: 'ZipBrowser', completion: 75, tech: ['Tauri 2.x', 'ML-KEM HTTPS', 'Kill Switch'], desc: 'PQC desktop browser with 7 privacy subsystems', color: '#f97316' },
  { name: 'Q-Mesh', completion: 15, tech: ['ESP32-S3', 'CSI Entropy', 'RuView'], desc: 'WiFi mesh with CSI entropy harvesting and PUEK', color: '#ef4444' },
]

// ---------------------------------------------------------------------------
// S10: Competitors
// ---------------------------------------------------------------------------
export const COMPETITORS = [
  { name: 'Zipminator', pqc: 5, breadth: 5, qrng: 5, compliance: 5, multiPlatform: 5, anonymization: 5, openSource: 4 },
  { name: 'Signal', pqc: 3, breadth: 2, qrng: 0, compliance: 1, multiPlatform: 4, anonymization: 0, openSource: 5 },
  { name: 'ProtonMail', pqc: 2, breadth: 3, qrng: 0, compliance: 3, multiPlatform: 4, anonymization: 1, openSource: 3 },
  { name: 'NordVPN', pqc: 1, breadth: 2, qrng: 0, compliance: 2, multiPlatform: 4, anonymization: 0, openSource: 0 },
  { name: 'Wickr (AWS)', pqc: 2, breadth: 2, qrng: 0, compliance: 4, multiPlatform: 3, anonymization: 0, openSource: 0 },
]

export const COMPETITOR_FEATURES = [
  { feature: 'ML-KEM-768 (FIPS 203)', zip: true, signal: 'partial', proton: false, nord: false, wickr: false },
  { feature: 'QRNG Entropy', zip: true, signal: false, proton: false, nord: false, wickr: false },
  { feature: 'Physics-proven Anonymization', zip: true, signal: false, proton: false, nord: false, wickr: false },
  { feature: 'DORA Art. 7 Audit Trail', zip: true, signal: false, proton: false, nord: false, wickr: false },
  { feature: 'Location-Locked Keys (PUEK)', zip: true, signal: false, proton: false, nord: false, wickr: false },
  { feature: 'CSI Entropy Harvesting', zip: true, signal: false, proton: false, nord: false, wickr: false },
  { feature: '9-Pillar Super-App', zip: true, signal: false, proton: false, nord: false, wickr: false },
  { feature: '6-Platform Flutter', zip: true, signal: false, proton: false, nord: false, wickr: false },
  { feature: 'Quantum VPN', zip: true, signal: false, proton: false, nord: 'partial', wickr: false },
  { feature: 'Self-Destruct (DoD 5220.22-M)', zip: true, signal: 'partial', proton: false, nord: false, wickr: true },
]

// ---------------------------------------------------------------------------
// S11: Market Size
// ---------------------------------------------------------------------------
export const MARKET_SEGMENTS = [
  { name: 'Data Privacy', tam2025: 177, tam2030: 350, cagr: 15, color: '#6366f1' },
  { name: 'Post-Quantum Crypto', tam2025: 2, tam2030: 20, cagr: 50, color: '#22D3EE' },
  { name: 'Compliance/GRC', tam2025: 50, tam2030: 100, cagr: 15, color: '#34D399' },
  { name: 'Quantum-Safe VPN', tam2025: 5, tam2030: 25, cagr: 35, color: '#F59E0B' },
]

export const TAM_SAM_SOM: Record<BpScenario, { tam: number; sam: number; som: number }> = {
  conservative: { tam: 234, sam: 12, som: 0.3 },
  moderate: { tam: 234, sam: 25, som: 1.5 },
  optimistic: { tam: 495, sam: 50, som: 5 },
}

export const MARKET_GROWTH = [
  { year: 2024, privacy: 155, pqc: 1.2, compliance: 42, vpn: 3.5 },
  { year: 2025, privacy: 177, pqc: 2, compliance: 50, vpn: 5 },
  { year: 2026, privacy: 200, pqc: 3.5, compliance: 58, vpn: 7 },
  { year: 2027, privacy: 225, pqc: 5.5, compliance: 67, vpn: 10 },
  { year: 2028, privacy: 255, pqc: 8, compliance: 75, vpn: 14 },
  { year: 2029, privacy: 290, pqc: 12, compliance: 85, vpn: 18 },
  { year: 2030, privacy: 350, pqc: 20, compliance: 100, vpn: 25 },
  { year: 2035, privacy: 600, pqc: 80, compliance: 180, vpn: 60 },
]

// ---------------------------------------------------------------------------
// S12: Floor Matters
// ---------------------------------------------------------------------------
export const DESIGN_AROUND_DIFFICULTY = [
  { patent: 'P1: Quantum Anonymization', novelty: 95, complexity: 90, standardsLock: 85, network: 70, total: 85 },
  { patent: 'P2: CSI Entropy + PUEK', novelty: 99, complexity: 88, standardsLock: 90, network: 75, total: 88 },
  { patent: 'P3: CHE + ARE', novelty: 92, complexity: 85, standardsLock: 82, network: 65, total: 81 },
]

export const THICKET_FUNNEL = [
  { stage: 'Total PQC approaches', value: 100 },
  { stage: 'Non-bilateral CSI', value: 5 },
  { stage: 'With certified provenance', value: 2 },
  { stage: 'With physics-proven anonymization', value: 1 },
  { stage: 'Viable without QDaria license', value: 0 },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export const fmt = (n: number, unit = 'M') => {
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}B`
  return `$${n}${unit}`
}

export const SECTION_LIST = [
  { id: 'patent-stack', title: 'Three-Patent Stack' },
  { id: 'regulatory-moat', title: 'Regulatory Moat' },
  { id: 'patent-deep-dives', title: 'Patent Deep Dives' },
  { id: 'novelty', title: 'Novelty Assessment' },
  { id: 'valuation', title: 'Valuation Analysis' },
  { id: 'comparables', title: 'Comparable Transactions' },
  { id: 'company-valuation', title: 'Company Valuation' },
  { id: 'use-cases', title: 'Use Cases' },
  { id: 'pillars', title: '9 Pillars' },
  { id: 'competitors', title: 'Competitor Analysis' },
  { id: 'market-size', title: 'Market Size' },
  { id: 'floor-matters', title: 'Why the Floor Matters' },
]
