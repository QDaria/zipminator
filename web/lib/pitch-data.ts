export type Scenario = 'base' | 'upside' | 'conservative'

export const SLIDE_TITLES = [
  'Zipminator-PQC',
  'The Threat',
  'Our Solution',
  'Product Suite',
  'Technology',
  'Market Opportunity',
  'Competitive Landscape',
  'Traction',
  'Business Model',
  'Team',
  'Financial Projections',
  'Funding Strategy',
  'Risk Analysis',
  'The Ask',
  'Contact',
]

export const THREAT_DATA = [
  {
    title: 'Salt Typhoon',
    detail: '200+ companies, 80 countries compromised (2024-2025)',
    source: 'FBI/CISA Joint Advisory',
    icon: 'Globe',
  },
  {
    title: 'SS7 Exploitation',
    detail: 'Ongoing attacks, new bypass discovered late 2024',
    source: 'DHS confirmed 4 nations exploiting',
    icon: 'Radio',
  },
  {
    title: 'Harvest Now, Decrypt Later',
    detail: 'Active data exfiltration for future quantum decryption',
    source: 'DHS, UK NCSC, ENISA, Federal Reserve',
    icon: 'Database',
  },
  {
    title: 'Quantum Breakthrough 2025',
    detail: 'Qubit requirements reduced 95% (20M \u2192 <1M physical qubits)',
    source: 'Multiple research groups',
    icon: 'Zap',
  },
  {
    title: 'CNSA 2.0 Deadline',
    detail: 'All new NSS equipment must be CNSA 2.0-compliant by 2027',
    source: 'NSA',
    icon: 'Shield',
  },
]

export const SUPER_APP_MODULES = [
  {
    name: 'PQC Messenger',
    icon: 'MessageSquare',
    description: 'End-to-end encrypted messaging with PQ Double Ratchet',
    tech: 'Kyber768 + X3DH',
  },
  {
    name: 'Quantum VoIP',
    icon: 'Phone',
    description: 'Voice/video calls with PQ-SRTP encryption',
    tech: 'ML-KEM + SRTP',
  },
  {
    name: 'Q-VPN',
    icon: 'Shield',
    description: 'Post-quantum VPN with kill switch',
    tech: 'WireGuard + Kyber768',
  },
  {
    name: 'ZipBrowser',
    icon: 'Globe',
    description: 'Privacy browser with PQC TLS inspection',
    tech: 'ML-KEM TLS 1.3',
  },
  {
    name: 'Quantum Mail',
    icon: 'Mail',
    description: 'Self-destructing emails with PII scanning',
    tech: 'Kyber768 + DoD 5220.22-M',
  },
  {
    name: 'QRNG Engine',
    icon: 'Cpu',
    description: '156-qubit IBM quantum random number generation',
    tech: 'IBM Marrakesh/Fez',
  },
  {
    name: 'PII Anonymizer',
    icon: 'Eye',
    description: 'Automatic PII detection and redaction',
    tech: 'NLP + regex patterns',
  },
  {
    name: 'AI Assistant',
    icon: 'Bot',
    description: 'Security-aware AI with quantum context',
    tech: 'LLM + PQC awareness',
  },
]

export const TECHNOLOGY_STACK = [
  {
    category: 'Cryptography',
    items: [
      'NIST FIPS 203 ML-KEM (Kyber768)',
      'NIST FIPS 204 ML-DSA (Dilithium)',
      'X25519 hybrid key exchange',
      'AES-256-GCM',
      'ChaCha20-Poly1305',
    ],
  },
  {
    category: 'Core Engine',
    items: [
      'Rust (constant-time crypto)',
      'PyO3/Maturin bindings',
      '156-qubit QRNG (IBM Quantum)',
      'WebAssembly compilation',
    ],
  },
  {
    category: 'Platforms',
    items: [
      'React Native (iOS/Android)',
      'Next.js 16 (Web)',
      'Tauri (Desktop)',
      'FastAPI (Backend)',
      'PostgreSQL + Redis',
    ],
  },
  {
    category: 'Standards',
    items: [
      'NIST SP 800-208',
      'CNSA 2.0',
      'ETSI QSC',
      'IETF RFC 9180 (HPKE)',
      'DoD 5220.22-M (secure delete)',
    ],
  },
]

export const MARKET_ANALYSTS = [
  { firm: 'MarketsandMarkets', tam2025: '$2.1B', tam2034: '$17.3B', cagr: '30%' },
  { firm: 'ABI Research', tam2025: '$0.4B', tam2034: '$13.2B', cagr: '46%' },
  { firm: 'Global Market Insights', tam2025: '$0.7B', tam2034: '$16.1B', cagr: '35%' },
  { firm: 'Precedence Research', tam2025: '$1.7B', tam2034: '$30.0B', cagr: '33%' },
  { firm: 'Fortune Business Insights', tam2025: '$0.5B', tam2034: '$15.8B', cagr: '38%' },
  { firm: 'Grand View Research', tam2025: '$0.6B', tam2034: '$20.1B', cagr: '41%' },
  { firm: 'Mordor Intelligence', tam2025: '$1.2B', tam2034: '$18.7B', cagr: '32%' },
]

export const TAM_SAM_SOM = {
  tam: '$13-30B',
  tamDesc: 'Total PQC market by 2034-35',
  sam: '$3-8B',
  samDesc: 'Consumer + SMB PQC security tools',
  som: '$100-500M',
  somDesc: 'PQC super-app for privacy-conscious users',
}

export const COMPETITORS = [
  {
    name: 'Zipminator',
    messenger: true,
    voip: true,
    vpn: true,
    browser: true,
    email: true,
    qrng: true,
    pqc: true,
    superApp: true,
  },
  {
    name: 'Signal',
    messenger: true,
    voip: true,
    vpn: false,
    browser: false,
    email: false,
    qrng: false,
    pqc: 'partial' as const,
    superApp: false,
  },
  {
    name: 'ProtonMail',
    messenger: false,
    voip: false,
    vpn: true,
    browser: false,
    email: true,
    qrng: false,
    pqc: 'partial' as const,
    superApp: false,
  },
  {
    name: 'NordVPN',
    messenger: false,
    voip: false,
    vpn: true,
    browser: false,
    email: false,
    qrng: false,
    pqc: false,
    superApp: false,
  },
  {
    name: 'Brave',
    messenger: false,
    voip: false,
    vpn: true,
    browser: true,
    email: false,
    qrng: false,
    pqc: false,
    superApp: false,
  },
  {
    name: 'Wire',
    messenger: true,
    voip: true,
    vpn: false,
    browser: false,
    email: false,
    qrng: false,
    pqc: false,
    superApp: false,
  },
  {
    name: 'SandboxAQ',
    messenger: false,
    voip: false,
    vpn: false,
    browser: false,
    email: false,
    qrng: false,
    pqc: true,
    superApp: false,
  },
  {
    name: 'PQShield',
    messenger: false,
    voip: false,
    vpn: false,
    browser: false,
    email: false,
    qrng: false,
    pqc: true,
    superApp: false,
  },
]

export const TRACTION_STATS = [
  { label: 'Lines of Code', value: '870K+', detail: 'Production-quality codebase' },
  { label: 'Platforms', value: '5', detail: 'Web, iOS, Android, Desktop, API' },
  { label: 'Technologies', value: '26', detail: 'Integrated security stack' },
  { label: 'Languages', value: '7', detail: 'Rust, Python, TypeScript, Swift, Kotlin, Go, C' },
  { label: 'Security Modules', value: '8', detail: 'Full super-app coverage' },
  { label: 'NIST Algorithms', value: '3', detail: 'FIPS 203, 204, 205 implemented' },
]

export const PRICING_TIERS = [
  {
    name: 'Freemium',
    price: '$0',
    target: 'Consumers',
    features: ['Basic PQC messenger', 'Limited VPN (1GB/mo)', 'Community support'],
    highlighted: false,
  },
  {
    name: 'Developer',
    price: '$29/mo',
    target: 'Indie devs, small teams',
    features: ['PQC API access', 'SDK integration', '10GB VPN', 'Priority support'],
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$99/mo',
    target: 'SMBs, security teams',
    features: [
      'Full super-app access',
      'Unlimited VPN',
      'QRNG entropy',
      'Team management',
      'SLA guarantee',
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    target: 'Government, military, banking',
    features: [
      'On-premise deployment',
      'Custom integrations',
      'Dedicated support',
      'Compliance reporting',
      'FIPS 140-3 validation',
    ],
    highlighted: false,
  },
]

export const TEAM_ROLES = [
  {
    title: 'Cryptography Engineers',
    count: 4,
    salary: '$180-220K',
    priority: 'immediate' as const,
  },
  {
    title: 'Rust/Systems Engineers',
    count: 4,
    salary: '$160-200K',
    priority: 'immediate' as const,
  },
  {
    title: 'Mobile Developers (iOS/Android)',
    count: 4,
    salary: '$150-190K',
    priority: 'immediate' as const,
  },
  {
    title: 'Full-Stack Engineers',
    count: 4,
    salary: '$140-180K',
    priority: 'year1' as const,
  },
  {
    title: 'Security Researchers',
    count: 3,
    salary: '$170-210K',
    priority: 'year1' as const,
  },
  {
    title: 'DevOps/Infrastructure',
    count: 2,
    salary: '$150-190K',
    priority: 'year1' as const,
  },
  {
    title: 'QA Engineers',
    count: 3,
    salary: '$120-160K',
    priority: 'year1' as const,
  },
  {
    title: 'Product/Design',
    count: 3,
    salary: '$130-170K',
    priority: 'year2' as const,
  },
  {
    title: 'Business/Marketing',
    count: 4,
    salary: '$120-160K',
    priority: 'year2' as const,
  },
  {
    title: 'Leadership (CTO, VP Eng, CISO)',
    count: 3,
    salary: '$200-280K',
    priority: 'immediate' as const,
  },
]

export const TEAM_TOTAL = {
  headcount: '21-50',
  annualCost: '$6-8M',
  buildCost: '~$25M over 24-36 months',
}

export const REVENUE_PROJECTIONS: Record<
  Scenario,
  Array<{ year: number; revenue: number; users: number }>
> = {
  base: [
    { year: 2026, revenue: 0.2, users: 5000 },
    { year: 2027, revenue: 1.5, users: 25000 },
    { year: 2028, revenue: 5, users: 80000 },
    { year: 2029, revenue: 15, users: 200000 },
    { year: 2030, revenue: 40, users: 500000 },
  ],
  upside: [
    { year: 2026, revenue: 0.5, users: 10000 },
    { year: 2027, revenue: 3, users: 50000 },
    { year: 2028, revenue: 12, users: 150000 },
    { year: 2029, revenue: 35, users: 400000 },
    { year: 2030, revenue: 80, users: 1000000 },
  ],
  conservative: [
    { year: 2026, revenue: 0.1, users: 2000 },
    { year: 2027, revenue: 0.8, users: 12000 },
    { year: 2028, revenue: 2.5, users: 40000 },
    { year: 2029, revenue: 8, users: 100000 },
    { year: 2030, revenue: 20, users: 250000 },
  ],
}

export const GRANT_OPPORTUNITIES = [
  {
    name: 'Norwegian Quantum Initiative',
    amount: 'NOK 1.75B ($175M) total',
    status: 'Active from 2025',
    focus: 'Quantum technology development',
  },
  {
    name: 'Research Council of Norway',
    amount: 'NOK 70M/year',
    status: 'Annual calls open',
    focus: 'Industry R&D',
  },
  {
    name: 'National Budget 2026',
    amount: 'NOK 150M/year \u00d7 5 years',
    status: 'Confirmed',
    focus: 'Quantum industry support',
  },
  {
    name: 'NATO DIANA 2026',
    amount: 'EUR 100K/company',
    status: 'Applications open',
    focus: 'Dual-use defense tech',
  },
  {
    name: 'Horizon Europe PQC',
    amount: 'EUR 4M + 6M + 6M',
    status: 'Open topics',
    focus: 'PQC evaluation, implementation, protocols',
  },
  {
    name: 'Digital Europe',
    amount: 'EUR 15M',
    status: 'Active',
    focus: 'Post-quantum PKI transition',
  },
  {
    name: 'Quantum Flagship Phase 2',
    amount: 'EUR 400M+',
    status: 'Ongoing',
    focus: 'Broad quantum technologies',
  },
  {
    name: 'DARPA',
    amount: 'Varies',
    status: 'BAA opportunities',
    focus: 'Advanced cryptographic solutions',
  },
]

export const RISK_MATRIX = [
  {
    risk: 'Quantum timeline accelerates faster than expected',
    impact: 'high' as const,
    probability: 'medium' as const,
    mitigation: 'Already PQC-native; accelerated timeline validates our approach',
  },
  {
    risk: 'Big tech enters PQC consumer market',
    impact: 'high' as const,
    probability: 'medium' as const,
    mitigation: 'First-mover advantage; 870K LOC head start; super-app integration moat',
  },
  {
    risk: 'NIST algorithm vulnerabilities discovered',
    impact: 'high' as const,
    probability: 'low' as const,
    mitigation: 'Hybrid encryption (classical + PQC); crypto-agile architecture',
  },
  {
    risk: 'Key person dependency',
    impact: 'medium' as const,
    probability: 'high' as const,
    mitigation: 'Documentation-first culture; knowledge sharing; competitive compensation',
  },
  {
    risk: 'Regulatory changes',
    impact: 'high' as const,
    probability: 'low' as const,
    mitigation: 'Built on NIST standards; compliance-first architecture',
  },
  {
    risk: 'Open source sustainability',
    impact: 'medium' as const,
    probability: 'medium' as const,
    mitigation: 'Dual licensing (MIT + commercial); enterprise tier revenue',
  },
  {
    risk: 'User adoption challenges',
    impact: 'medium' as const,
    probability: 'medium' as const,
    mitigation: 'Freemium model; familiar UX patterns; network effects',
  },
]

export const FUNDING_ASK = {
  grantsTarget: '$2-5M in non-dilutive grants (Year 1-2)',
  revenueTimeline: '$5M+ ARR by Year 3 (Pro + Enterprise tiers)',
  strategicRaise: '$15-25M if/when taking equity (justified by build cost + comparable raises)',
  useOfFunds: [
    { category: 'Engineering', percentage: 55, amount: '$8.3-13.8M' },
    { category: 'Security & Compliance', percentage: 15, amount: '$2.3-3.8M' },
    { category: 'Go-to-Market', percentage: 15, amount: '$2.3-3.8M' },
    { category: 'Infrastructure', percentage: 10, amount: '$1.5-2.5M' },
    { category: 'Operations', percentage: 5, amount: '$0.8-1.3M' },
  ],
}

export const CONTACT_INFO = {
  email: 'invest@qdaria.com',
  website: 'https://zipminator.zip',
  github: 'https://github.com/qdaria',
  linkedin: 'https://linkedin.com/company/qdaria',
}

export const COMPARABLE_RAISES = [
  {
    company: 'SandboxAQ',
    raised: '$950M',
    valuation: '$5.75B',
    focus: 'Enterprise PQC + AI',
  },
  {
    company: 'PQShield',
    raised: '$70M',
    valuation: 'Undisclosed',
    focus: 'PQC IP cores',
  },
  {
    company: 'Quantum VC Market',
    raised: '$2.0B (2024)',
    valuation: '50% YoY growth',
    focus: 'Quantum technologies',
  },
]
