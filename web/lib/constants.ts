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
    github: 'https://github.com/QDaria/zipminator',
    docs: '/docs',
    api: '/docs#api',
    // Switch to 'https://docs.zipminator.zip' after DNS CNAME is configured
    jupyterBook: 'https://qdaria.github.io/zipminator/',
    qdaria: 'https://qdaria.com',
    qdariaProducts: '/technology',
    qdariaZipminator: '/',
    // Release milestone links (April 2026)
    pypi: 'https://pypi.org/project/zipminator/',
    testflight: 'https://testflight.apple.com/join/XXXXXXXX',  // user to fill
    signaling: 'wss://zipminator-signaling.fly.dev',
    paper1: 'https://github.com/QDaria/quantum-certified-anonymization',
    paper2: 'https://github.com/QDaria/unilateral-csi-entropy',
    paper3: 'https://github.com/QDaria/certified-heterogeneous-entropy',
    patentstyret: 'https://www.patentstyret.no/',
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
    qubits: 156,
    type: 'Superconducting',
    processor: 'IBM Marrakesh',
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
  qubits: 156,
  securityLevel: 'NIST Level 3',
  testsPassing: '287+',
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
  { name: 'Features', href: '/features' },
  { name: 'Technology', href: '/technology' },
  { name: 'Demo', href: '/demo' },
  { name: 'Docs', href: '/docs' },
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Invest', href: '/invest' },
  { name: 'GitHub', href: SITE_CONFIG.links.github },
]

export const FOOTER_SECTIONS = [
  {
    title: 'Product',
    links: [
      { name: 'Features', href: '/features' },
      { name: 'Pricing', href: '/invest' },
      { name: 'Documentation', href: '/docs' },
      { name: 'API Reference', href: '/docs#api' },
      { name: 'Changelog', href: `${SITE_CONFIG.links.github}/releases` },
    ],
  },
  {
    title: 'Company',
    links: [
      { name: 'About QDaria', href: '/impact' },
      { name: 'Careers', href: 'mailto:careers@qdaria.com' },
      { name: 'Blog', href: `${SITE_CONFIG.links.github}/releases` },
      { name: 'Contact', href: 'mailto:contact@qdaria.com' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { name: 'Getting Started', href: '/docs' },
      { name: 'Community', href: `${SITE_CONFIG.links.github}/discussions` },
      { name: 'Technology', href: '/technology' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Cookie Policy', href: '#' },
    ],
  },
]
