export type Scenario = 'all' | 'base' | 'upside' | 'conservative'

export const SLIDE_TITLES = [
  'Zipminator-PQC',        // 1 - Title
  'QDaria',                // 2 - Company
  'The Threat',            // 3 - Problem
  'Why Now',               // 4 - Urgency
  'Our Solution',          // 5 - Solution
  'Product Suite',         // 6 - Products
  'Product Demo',          // 7 - Interactive demo
  'Technology',            // 8 - Tech stack
  'Use Cases',             // 9 - Industries
  'Market Opportunity',    // 10 - Market
  'Competitive Landscape', // 11 - Competition
  'Traction',              // 12 - Progress
  'Business Model',        // 13 - Revenue
  'Team',                  // 14 - People
  'Roadmap',               // 15 - Timeline
  'Financial Projections', // 16 - Financials
  'Funding Strategy',      // 17 - Grants/funding
  'Risk Analysis',         // 18 - Risks
  'Pricing',               // 19 - Pricing tiers
  'ESG & Sustainability',  // 20 - ESG
  'The Ask',               // 21 - What we need
  'Contact',               // 22 - Get in touch
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
  {
    name: 'Q-Sense Mesh',
    icon: 'Wifi',
    description: 'Quantum-secured WiFi sensing — presence, vitals, pose detection through walls',
    tech: 'RuView + ML-KEM-768 + QRNG',
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
  { label: 'Lines of Code', value: '300K+', detail: 'Production-quality codebase' },
  { label: 'Platforms', value: '5', detail: 'Web, iOS, Android, Desktop, API' },
  { label: 'Technologies', value: '26', detail: 'Integrated security stack' },
  { label: 'Languages', value: '7', detail: 'Rust, Python, TypeScript, Swift, Kotlin, Go, C' },
  { label: 'Security Modules', value: '8', detail: 'Full super-app coverage' },
  { label: 'NIST Algorithms', value: '3', detail: 'FIPS 203, 204, 205 implemented' },
]

export const PRICING_TIERS = [
  {
    name: 'Free',
    characterName: 'Amir',
    price: '$0',
    priceStandard: '$0',
    target: 'Individual users',
    levels: '1-3',
    features: [
      'Basic PQC messenger',
      'Anonymization levels 1-3',
      'Community support',
      '1 GB data limit',
    ],
    highlighted: false,
    earlyAdopter: false,
    cta: 'Star us on GitHub',
  },
  {
    name: 'Developer',
    characterName: 'Nils',
    price: '$9/mo',
    priceStandard: '$29/mo',
    target: 'Indie devs, small teams',
    levels: '1-5',
    features: [
      'PQC API access',
      'Anonymization levels 1-5',
      '10 GB data limit',
      'Email support',
      'SDK integration',
    ],
    highlighted: false,
    earlyAdopter: true,
    cta: 'Start Free Trial',
  },
  {
    name: 'Pro',
    characterName: 'Solveig',
    price: '$29/mo',
    priceStandard: '$99/mo',
    target: 'SMBs, security teams',
    levels: '1-7',
    features: [
      'Full super-app access',
      'Anonymization levels 1-7',
      '100 GB data limit',
      'Team management & SSO',
      'Priority support',
    ],
    highlighted: true,
    earlyAdopter: true,
    cta: 'Start Free Trial',
  },
  {
    name: 'Enterprise',
    characterName: 'Robindra',
    price: 'Custom',
    priceStandard: '$5K-$50K/mo',
    target: 'Government, military, banking',
    levels: '1-10',
    features: [
      'All anonymization levels + QRNG',
      'On-premise deployment',
      'HSM support & SLA 99.99%',
      'Workshops & certifications',
      'Dedicated CSM',
    ],
    highlighted: false,
    earlyAdopter: false,
    cta: 'Contact Sales',
  },
]

export const GITHUB_STAR_FEATURES = {
  headline: 'Star us on GitHub, unlock Developer features free',
  reward: 'GHSTAR-LEVEL5',
  unlockedFeatures: [
    'Anonymization levels 1-5 (normally $9/mo)',
    'PQC API access',
    '10 GB data limit',
    'Email support',
    'Star Supporter badge',
    'Share on LinkedIn for social proof',
  ],
  badgeColors: {
    background: '#92400E',
    border: '#FF6600',
    text: '#FFFFFF',
  },
}

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
  headcount: '34',
  annualCost: '$6-8M',
  buildCost: '~$25M over 24-36 months',
}

export const REVENUE_PROJECTIONS: Record<
  Exclude<Scenario, 'all'>,
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
    mitigation: 'First-mover advantage; 300K LOC head start; super-app integration moat',
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

export const COMPANY_STATS = [
  { label: 'Founded', value: '2024' },
  { label: 'Products', value: '8' },
  { label: 'Code Base', value: '300K+ LOC' },
  { label: 'Technologies', value: '26' },
]

// --- Green & Sustainability Credentials ---
export const GREEN_CREDENTIALS = {
  headline: 'Built Green from Day One',
  subtitle: 'Norwegian hydropower meets quantum-efficient cryptography',
  stats: [
    { label: 'Renewable Energy', value: '98%', detail: 'Norway\'s grid is 98% renewable hydropower (IEA 2024)' },
    { label: 'PQC vs RSA Energy', value: '~1000x', detail: 'Kyber768 key generation uses ~1000x less energy than RSA-4096 (NIST benchmark)' },
    { label: 'Data Center PUE', value: '1.08', detail: 'Norwegian data centers rank among world\'s most efficient (Digiplex, Green Mountain)' },
    { label: 'Carbon Intensity', value: '29g CO₂/kWh', detail: 'Norway: 29g vs EU avg 230g vs US avg 390g CO₂/kWh (EEA 2024)' },
  ],
  pillars: [
    {
      title: 'Norwegian Green Infrastructure',
      items: [
        '98% renewable electricity (hydropower dominant)',
        'Natural cooling from Arctic climate reduces PUE to 1.08',
        'EU\'s cleanest grid carbon intensity: 29g CO₂/kWh',
        'Green Mountain & Digiplex certified carbon-neutral data centers',
      ],
    },
    {
      title: 'Quantum-Efficient Cryptography',
      items: [
        'Lattice-based crypto (Kyber) is inherently energy-efficient vs RSA',
        'No prime factorization: constant-time operations, lower CPU cycles',
        'QRNG harvesting reuses existing quantum hardware (no dedicated infrastructure)',
        'Rust engine: zero-overhead abstractions, minimal memory footprint',
      ],
    },
    {
      title: 'Sustainable by Design',
      items: [
        'Single super-app replaces 5-8 separate security tools (less total compute)',
        'Edge-first architecture minimizes cloud round-trips',
        'On-device AI processing: no data center inference costs',
        'Open-source core: shared innovation, reduced industry duplication',
      ],
    },
  ],
}

// --- Social Responsibility & ESG ---
export const SOCIAL_RESPONSIBILITY = {
  headline: 'Security as a Human Right',
  commitments: [
    {
      title: 'Privacy as a Fundamental Right',
      icon: 'Shield',
      description: 'GDPR Article 8 enshrines data protection as a human right. Zipminator makes post-quantum privacy accessible to everyone, not just enterprises.',
      impact: 'Freemium tier ensures quantum-safe messaging for all users regardless of ability to pay',
    },
    {
      title: 'Protecting Vulnerable Data',
      icon: 'Heart',
      description: 'Healthcare records, children\'s data, and elderly care information require decades of confidentiality. Current encryption won\'t survive quantum decryption.',
      impact: 'Healthcare and social services sectors get priority pricing and onboarding support',
    },
    {
      title: 'Digital Sovereignty for Europe',
      icon: 'Flag',
      description: 'European citizens deserve encryption infrastructure owned and operated within European jurisdiction, free from foreign surveillance mandates.',
      impact: 'Norwegian-owned, GDPR-native, no Five Eyes jurisdiction exposure',
    },
    {
      title: 'Open Source & Community',
      icon: 'GitBranch',
      description: 'Core cryptographic primitives are open-source (MIT licensed), enabling community audit, academic verification, and industry-wide security improvement.',
      impact: '300K+ LOC of security infrastructure contributed to the global commons',
    },
    {
      title: 'Ethical AI Commitment',
      icon: 'Brain',
      description: 'On-device AI with zero telemetry. No user data is harvested for model training. AI serves the user, not the platform.',
      impact: 'Zero-knowledge AI architecture: your prompts never leave your device',
    },
    {
      title: 'Critical Infrastructure Protection',
      icon: 'Building',
      description: 'Power grids, water systems, and hospitals are increasingly targeted. Quantum-safe encryption protects the systems society depends on.',
      impact: 'Government and infrastructure pricing subsidized through grant funding',
    },
  ],
}

// --- Competitive Pricing & Funding Details ---
export const COMPETITOR_DETAILS = [
  {
    name: 'SandboxAQ',
    funding: '$950M+ (Series A-E)',
    valuation: '$5.75B',
    pricing: 'Enterprise-only, custom contracts ($500K+ annually)',
    target: 'Fortune 500, Government',
    weakness: 'No consumer products, no messaging/VPN/browser',
  },
  {
    name: 'PQShield',
    funding: '$70M (Series B, June 2024)',
    valuation: 'Undisclosed',
    pricing: 'IP licensing per chip ($0.01-0.10/unit at volume)',
    target: 'Semiconductor, IoT',
    weakness: 'Hardware IP only, no software products for end users',
  },
  {
    name: 'ISARA',
    funding: '$50M+ (acquired by Thales 2023)',
    valuation: 'N/A (acquired)',
    pricing: 'Enterprise SDK licensing ($100K-500K/year)',
    target: 'PKI migration, certificate management',
    weakness: 'PKI-only focus, no consumer tools',
  },
  {
    name: 'Signal',
    funding: 'Non-profit ($50M+ in donations)',
    valuation: 'N/A (non-profit)',
    pricing: 'Free (donation-supported)',
    target: 'Privacy-conscious consumers',
    weakness: 'Only PQXDH for messaging; no VPN, browser, email, or QRNG',
  },
  {
    name: 'ProtonMail',
    funding: '$100M+ (self-funded + equity)',
    valuation: '$1B+ estimated',
    pricing: '$4-24/mo consumer; enterprise custom',
    target: 'Privacy consumers, SMBs',
    weakness: 'Classical crypto only, PQC announced but not shipped',
  },
  {
    name: 'NordVPN (Nord Security)',
    funding: '$100M (Warburg Pincus, 2022)',
    valuation: '$1.6B',
    pricing: '$3-15/mo consumer',
    target: 'Mass market VPN',
    weakness: 'VPN only, no PQC, no messaging, Panama jurisdiction concerns',
  },
]

// --- Norwegian Ecosystem Context ---
export const NORWEGIAN_ECOSYSTEM = {
  headline: 'Norway: The Ideal PQC Launchpad',
  advantages: [
    { title: 'NOK 1.75B Quantum Initiative', detail: 'PM Store personally launched Norway\'s quantum commitment (2025)', icon: 'Landmark' },
    { title: 'NATO DIANA Hub in Trondheim', detail: 'Direct access to NATO defense procurement pipeline', icon: 'Shield' },
    { title: '98% Renewable Energy Grid', detail: 'World\'s cleanest computing infrastructure (hydropower)', icon: 'Leaf' },
    { title: 'GDPR Gold Standard', detail: 'EEA membership + strongest privacy enforcement in Europe', icon: 'Lock' },
    { title: 'Nordic Cyber Market: $13.8B', detail: 'Fastest growing in EU at 10.1% CAGR (Mordor Intelligence)', icon: 'TrendingUp' },
    { title: 'Four New Quantum Research Centres', detail: 'NOK 244M over 5 years, announced 2025', icon: 'GraduationCap' },
  ],
  buildCostComparison: {
    title: 'Build Cost: Norway vs Silicon Valley',
    rows: [
      { category: 'Senior Engineer Salary', norway: '$120-160K', valley: '$200-350K', savings: '40-55%' },
      { category: 'Office Space (per desk/year)', norway: '$8K', valley: '$18-25K', savings: '55-68%' },
      { category: 'Energy Cost (per kWh)', norway: '$0.05', valley: '$0.20', savings: '75%' },
      { category: 'Data Center (per rack/mo)', norway: '$800', valley: '$2,500', savings: '68%' },
    ],
  },
}

export const ROADMAP_PHASES = [
  { name: 'Quantum Vault', phase: 1, status: 'done' as const, progress: 95, description: 'Core encryption engine' },
  { name: 'Secure Messenger', phase: 2, status: 'progress' as const, progress: 85, description: 'E2E encrypted chat' },
  { name: 'Quantum VoIP', phase: 3, status: 'progress' as const, progress: 80, description: 'Encrypted calls & video' },
  { name: 'Q-VPN', phase: 4, status: 'progress' as const, progress: 90, description: 'Quantum-safe VPN tunnel' },
  { name: 'Anonymizer', phase: 5, status: 'done' as const, progress: 100, description: '10-level data protection' },
  { name: 'AI Assistant', phase: 6, status: 'progress' as const, progress: 85, description: 'On-device PQC AI' },
  { name: 'Quantum Email', phase: 7, status: 'progress' as const, progress: 90, description: 'PQC-encrypted secure email' },
  { name: 'ZipBrowser', phase: 8, status: 'progress' as const, progress: 75, description: 'Quantum-safe AI browser' },
  { name: 'Q-Sense Mesh', phase: 9, status: 'progress' as const, progress: 30, description: 'Quantum-secured WiFi sensing' },
]

export const ROADMAP_MILESTONES = [
  { date: 'Q2 2026', label: 'MVP Launch' },
  { date: 'Q4 2026', label: 'Mobile Apps' },
  { date: 'Q2 2027', label: 'Enterprise' },
  { date: 'Q4 2027', label: 'Full Super-App' },
]

export const REVENUE_MODULES = [
  { name: 'PQC Messenger', share: 25 },
  { name: 'Q-VPN', share: 20 },
  { name: 'Enterprise API', share: 20 },
  { name: 'Quantum Mail', share: 15 },
  { name: 'ZipBrowser', share: 10 },
  { name: 'QRNG Engine', share: 10 },
]

export const COST_COMPARISON_NUMERIC = [
  { category: 'Engineer Salary', norway: 140, valley: 275, unit: 'K/yr' },
  { category: 'Office Space', norway: 8, valley: 21.5, unit: 'K/desk/yr' },
  { category: 'Energy Cost', norway: 0.05, valley: 0.20, unit: '$/kWh' },
  { category: 'Data Center', norway: 0.8, valley: 2.5, unit: 'K/rack/mo' },
]

export const GRANT_AMOUNTS_NUMERIC = [
  { name: 'Norwegian Quantum Initiative', amount: 17.5, region: 'norway' },
  { name: 'Research Council of Norway', amount: 7, region: 'norway' },
  { name: 'National Budget 2026', amount: 15, region: 'norway' },
  { name: 'NATO DIANA', amount: 0.11, region: 'nato' },
  { name: 'Horizon Europe PQC', amount: 17.6, region: 'eu' },
  { name: 'Digital Europe', amount: 16.5, region: 'eu' },
  { name: 'Quantum Flagship', amount: 44, region: 'eu' },
  { name: 'DARPA', amount: 5, region: 'us' },
]

export const THREAT_SEVERITY = [
  { threat: 'HNDL Attacks', severity: 95, urgency: 90 },
  { threat: 'SS7 Exploits', severity: 85, urgency: 95 },
  { threat: 'Quantum Decrypt', severity: 100, urgency: 70 },
  { threat: 'Supply Chain', severity: 75, urgency: 80 },
  { threat: 'Insider Threat', severity: 65, urgency: 60 },
  { threat: 'Zero-Day PQC', severity: 80, urgency: 50 },
]

export const DEVELOPMENT_TIMELINE = [
  { phase: 'Quantum Vault', status: 'done', progress: 95 },
  { phase: 'PQC Messenger', status: 'progress', progress: 85 },
  { phase: 'Quantum VoIP', status: 'progress', progress: 80 },
  { phase: 'Q-VPN', status: 'progress', progress: 90 },
  { phase: 'Anonymizer', status: 'done', progress: 100 },
  { phase: 'AI Assistant', status: 'progress', progress: 85 },
  { phase: 'Quantum Email', status: 'progress', progress: 90 },
  { phase: 'ZipBrowser', status: 'progress', progress: 75 },
  { phase: 'Q-Sense Mesh', status: 'progress', progress: 30 },
]

export const USE_CASE_INDUSTRIES = [
  { name: 'Government & Defense', icon: 'Shield', color: 'blue', description: 'Protect classified communications from harvest-now-decrypt-later attacks', compliance: ['CNSA 2.0', 'FedRAMP', 'NATO DIANA'] },
  { name: 'Healthcare', icon: 'Heart', color: 'red', description: 'Patient records with 50+ year confidentiality requirements', compliance: ['HIPAA', 'GDPR', 'NHD Act'] },
  { name: 'Finance & Banking', icon: 'Landmark', color: 'green', description: 'Transaction data and trading algorithms quantum-proofed', compliance: ['PCI-DSS', 'SOX', 'SWIFT PQC'] },
  { name: 'Critical Infrastructure', icon: 'Zap', color: 'orange', description: 'Power grids, water systems, telecom. SS7 attacks stop here', compliance: ['NERC CIP', 'ICS-CERT', 'EU NIS2'] },
  { name: 'Legal & IP', icon: 'Scale', color: 'purple', description: 'Attorney-client privilege and trade secrets protected for decades', compliance: ['ABA Rules', 'GDPR', 'IP Law'] },
  { name: 'Enterprise Tech', icon: 'Server', color: 'cyan', description: 'API security, code signing, and DevOps secrets with PQC', compliance: ['NIST FIPS 203', 'PQC-Ready', '3-Line SDK'] },
]

// --- ESG: UN SDG Mapping ---
export const SDG_MAPPING = [
  {
    number: 9,
    name: 'Industry, Innovation & Infrastructure',
    relevance: 'PQC encryption infrastructure for the post-quantum era. NIST FIPS 203 implementation.',
  },
  {
    number: 11,
    name: 'Sustainable Cities & Communities',
    relevance: 'Secure smart city communications, IoT protection, and resilient urban infrastructure.',
  },
  {
    number: 16,
    name: 'Peace, Justice & Strong Institutions',
    relevance: 'Privacy as a human right. Anti-surveillance tools. Protecting democratic processes.',
  },
  {
    number: 17,
    name: 'Partnerships for the Goals',
    relevance: 'Open standards (NIST), open source core (Apache 2.0), NATO DIANA collaboration.',
  },
  {
    number: 4,
    name: 'Quality Education',
    relevance: 'Secure academic networks and research data. Free tier for students and educators.',
  },
  {
    number: 8,
    name: 'Decent Work & Economic Growth',
    relevance: 'Norwegian HQ with strongest labor protections. Fair wages, 5-week vacation, full benefits.',
  },
]

// --- ESG: Green Energy Comparison ---
export const ENERGY_COMPARISON = [
  { name: 'Zipminator (Norway)', renewable: 98 },
  { name: 'US Big Tech Avg', renewable: 52 },
  { name: 'Global Cloud Avg', renewable: 30 },
]

// --- ESG: Carbon & Efficiency Metrics ---
export const CARBON_METRICS = [
  {
    label: 'Carbon Intensity',
    value: '29g',
    detail: 'CO\u2082/kWh (Norway) vs 390g (US avg)',
  },
  {
    label: 'Data Center PUE',
    value: '1.1',
    detail: 'Norway avg vs 1.6 global avg',
  },
  {
    label: 'Cooling Savings',
    value: '40-60%',
    detail: 'Arctic climate = natural cooling',
  },
  {
    label: 'PQC vs RSA Energy',
    value: '~1000x',
    detail: 'Less energy for key generation',
  },
]
