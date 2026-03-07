/**
 * Site configuration constants
 */

export const SITE_CONFIG = {
  name: 'Zipminator-PQC',
  title: 'Zipminator-PQC | Quantum-Secure Encryption Platform',
  description: 'Real quantum entropy + NIST FIPS 203 cryptography. Secure your data against quantum threats.',
  url: 'https://zipminator.zip',
  ogImage: 'https://zipminator.zip/og-image.png',
  keywords: [
    'post-quantum cryptography',
    'quantum encryption',
    'NIST FIPS 203',
    'Kyber768',
    'quantum security',
    'PQC',
    'quantum-resistant',
    'lattice-based cryptography',
  ],
  links: {
    github: 'https://github.com/qdaria/zipminator-pqc',
    docs: 'https://docs.zipminator.zip',
    api: 'https://docs.zipminator.zip/api',
    qdaria: 'https://qdaria.com',
    qdariaProducts: 'https://qdaria.com/technology/products',
    qdariaZipminator: 'https://qdaria.com/technology/products/zipminator',
  },
  company: {
    name: 'QDaria',
    url: 'https://qdaria.com',
    email: 'contact@qdaria.com',
    twitter: '@qdaria',
    linkedin: 'company/qdaria',
  },
}

export const QUANTUM_PROVIDERS = [
  {
    name: 'IBM Quantum',
    qubits: 127,
    type: 'Superconducting',
    processor: 'IBM Brisbane',
  },
  {
    name: 'IonQ',
    qubits: 11,
    type: 'Trapped-ion',
    processor: 'IonQ Harmony',
  },
  {
    name: 'Rigetti',
    qubits: 79,
    type: 'Superconducting',
    processor: 'Rigetti Aspen-M-2',
  },
  {
    name: 'AWS Braket',
    qubits: null,
    type: 'Multi-provider',
    processor: 'Multiple backends',
  },
  {
    name: 'OQC',
    qubits: 8,
    type: 'Superconducting',
    processor: 'OQC Lucy',
  },
]

export const PERFORMANCE_STATS = {
  encryptionSpeed: '0.034ms',
  qubits: 127,
  securityLevel: 'NIST Level 3',
  testCoverage: '95%+',
  costReduction: '15x',
  memoryReduction: '32.3%',
}

export const NIST_COMPLIANCE = {
  standard: 'FIPS 203',
  algorithm: 'Kyber768',
  securityLevel: 'Level 3',
  equivalentSecurity: 'AES-192',
  approved: true,
  approvalDate: '2024',
}

export const NAVIGATION_ITEMS = [
  { name: 'Features', href: '#features' },
  { name: 'How It Works', href: '#how-it-works' },
  { name: 'Use Cases', href: '#use-cases' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'Documentation', href: SITE_CONFIG.links.docs },
  { name: 'GitHub', href: SITE_CONFIG.links.github },
]

export const FOOTER_SECTIONS = [
  {
    title: 'Product',
    links: [
      { name: 'Features', href: '#features' },
      { name: 'Pricing', href: '#pricing' },
      { name: 'Documentation', href: SITE_CONFIG.links.docs },
      { name: 'API Reference', href: SITE_CONFIG.links.api },
      { name: 'Changelog', href: `${SITE_CONFIG.links.github}/releases` },
    ],
  },
  {
    title: 'Company',
    links: [
      { name: 'About QDaria', href: `${SITE_CONFIG.company.url}/about` },
      { name: 'Careers', href: `${SITE_CONFIG.company.url}/careers` },
      { name: 'Blog', href: `${SITE_CONFIG.company.url}/blog` },
      { name: 'Press Kit', href: `${SITE_CONFIG.company.url}/press` },
      { name: 'Contact', href: `${SITE_CONFIG.company.url}/contact` },
    ],
  },
  {
    title: 'Resources',
    links: [
      { name: 'Getting Started', href: `${SITE_CONFIG.links.docs}/getting-started` },
      { name: 'Tutorials', href: `${SITE_CONFIG.links.docs}/tutorials` },
      { name: 'Community', href: `${SITE_CONFIG.links.github}/discussions` },
      { name: 'Support', href: `${SITE_CONFIG.company.url}/support` },
      { name: 'Status', href: 'https://status.zipminator.zip' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { name: 'Privacy Policy', href: `${SITE_CONFIG.company.url}/privacy` },
      { name: 'Terms of Service', href: `${SITE_CONFIG.company.url}/terms` },
      { name: 'Cookie Policy', href: `${SITE_CONFIG.company.url}/cookies` },
      { name: 'GDPR', href: `${SITE_CONFIG.company.url}/gdpr` },
      { name: 'Security', href: `${SITE_CONFIG.company.url}/security` },
    ],
  },
]
