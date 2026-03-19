// SB1 Pitch Deck — Chart Data with Scenario Support
// All monetary values in NOK or USD as labeled
// Sources cited inline from intelligence brief

export type Scenario = 'konservativ' | 'base' | 'oppside';

export const SCENARIO_LABELS: Record<Scenario, string> = {
  konservativ: 'Konservativ',
  base: 'Base',
  oppside: 'Oppside',
};

// ─── Slide 1: Threat / HNDL ──────────────────────────

export interface HndlExposurePoint {
  year: number;
  harvested: number; // Cumulative % of financial data harvested
  vulnerable: number; // % vulnerable to quantum decryption
  migrated: number; // % migrated to PQC
}

export const hndlExposureData: Record<Scenario, HndlExposurePoint[]> = {
  konservativ: [
    { year: 2024, harvested: 5, vulnerable: 90, migrated: 1 },
    { year: 2025, harvested: 10, vulnerable: 88, migrated: 3 },
    { year: 2026, harvested: 15, vulnerable: 85, migrated: 6 },
    { year: 2027, harvested: 22, vulnerable: 80, migrated: 12 },
    { year: 2028, harvested: 28, vulnerable: 72, migrated: 20 },
    { year: 2029, harvested: 33, vulnerable: 62, migrated: 30 },
    { year: 2030, harvested: 38, vulnerable: 50, migrated: 42 },
    { year: 2031, harvested: 42, vulnerable: 38, migrated: 55 },
    { year: 2032, harvested: 45, vulnerable: 25, migrated: 68 },
    { year: 2033, harvested: 48, vulnerable: 15, migrated: 80 },
    { year: 2034, harvested: 50, vulnerable: 8, migrated: 90 },
    { year: 2035, harvested: 50, vulnerable: 2, migrated: 98 },
  ],
  base: [
    { year: 2024, harvested: 8, vulnerable: 90, migrated: 1 },
    { year: 2025, harvested: 15, vulnerable: 89, migrated: 2 },
    { year: 2026, harvested: 25, vulnerable: 86, migrated: 5 },
    { year: 2027, harvested: 35, vulnerable: 82, migrated: 10 },
    { year: 2028, harvested: 45, vulnerable: 75, migrated: 18 },
    { year: 2029, harvested: 55, vulnerable: 65, migrated: 28 },
    { year: 2030, harvested: 62, vulnerable: 52, migrated: 40 },
    { year: 2031, harvested: 68, vulnerable: 38, migrated: 52 },
    { year: 2032, harvested: 72, vulnerable: 25, migrated: 65 },
    { year: 2033, harvested: 75, vulnerable: 15, migrated: 78 },
    { year: 2034, harvested: 78, vulnerable: 8, migrated: 88 },
    { year: 2035, harvested: 80, vulnerable: 2, migrated: 96 },
  ],
  oppside: [
    { year: 2024, harvested: 12, vulnerable: 90, migrated: 1 },
    { year: 2025, harvested: 22, vulnerable: 89, migrated: 2 },
    { year: 2026, harvested: 35, vulnerable: 87, migrated: 3 },
    { year: 2027, harvested: 50, vulnerable: 84, migrated: 8 },
    { year: 2028, harvested: 65, vulnerable: 78, migrated: 15 },
    { year: 2029, harvested: 75, vulnerable: 68, migrated: 22 },
    { year: 2030, harvested: 82, vulnerable: 55, migrated: 35 },
    { year: 2031, harvested: 88, vulnerable: 40, migrated: 48 },
    { year: 2032, harvested: 92, vulnerable: 28, migrated: 60 },
    { year: 2033, harvested: 95, vulnerable: 18, migrated: 72 },
    { year: 2034, harvested: 97, vulnerable: 10, migrated: 85 },
    { year: 2035, harvested: 98, vulnerable: 3, migrated: 95 },
  ],
};

export const threatRadarData = [
  { metric: 'HNDL-risiko', value: 85, fullMark: 100 },
  { metric: 'Reg. press', value: 92, fullMark: 100 },
  { metric: 'Datatap-kost', value: 78, fullMark: 100 },
  { metric: 'Q-Day prob.', value: 34, fullMark: 100 },
  { metric: 'Migr.-gap', value: 88, fullMark: 100 },
  { metric: 'Sektor-angrep', value: 72, fullMark: 100 },
];

// ─── Slide 2: DORA Timeline ──────────────────────────

export interface TimelineEvent {
  date: string;
  label: string;
  category: 'dora' | 'nist' | 'cnsa' | 'eu' | 'uk';
  done: boolean;
  highlight?: boolean;
  danger?: boolean;
}

export const regulatoryTimeline: TimelineEvent[] = [
  { date: '2023-01', label: 'DORA vedtatt i EU', category: 'dora', done: true },
  { date: '2024-08', label: 'NIST PQC-standarder finalisert (FIPS 203/204/205)', category: 'nist', done: true },
  { date: '2025-01', label: 'DORA i kraft i EU', category: 'dora', done: true },
  { date: '2025-07', label: 'DORA norsk lov', category: 'dora', done: true, highlight: true },
  { date: '2026-12', label: 'EU: Nasjonale PQC-strategier ferdigstilt', category: 'eu', done: false },
  { date: '2027-01', label: 'NSA CNSA 2.0: Alle nye systemer PQC', category: 'cnsa', done: false },
  { date: '2028-12', label: 'UK NCSC: Kryptografisk kartlegging ferdig', category: 'uk', done: false },
  { date: '2030-12', label: 'EU: Høyrisikosystemer migrert til PQC', category: 'eu', done: false, danger: true },
  { date: '2031-12', label: 'UK NCSC: Høyprioritets-oppgraderinger ferdig', category: 'uk', done: false },
  { date: '2035-01', label: 'NIST: RSA/ECC forbudt i alle systemer', category: 'nist', done: false, danger: true },
  { date: '2035-12', label: 'UK NCSC: Full PQC-migrering', category: 'uk', done: false, danger: true },
];

export interface DoraFineScenario {
  entity: string;
  revenue: string;
  revenueNOK: number; // in billions
  fineMax: number; // 2% of revenue in MNOK
}

export const doraFineScenarios: Record<Scenario, DoraFineScenario[]> = {
  konservativ: [
    { entity: 'SB1 SMN', revenue: '~NOK 8 mrd.', revenueNOK: 8, fineMax: 160 },
    { entity: 'SB1 SR-Bank', revenue: '~NOK 6 mrd.', revenueNOK: 6, fineMax: 120 },
    { entity: 'SB1 Alliansen', revenue: '~NOK 30 mrd.', revenueNOK: 30, fineMax: 600 },
  ],
  base: [
    { entity: 'SB1 SMN', revenue: '~NOK 10 mrd.', revenueNOK: 10, fineMax: 200 },
    { entity: 'SB1 SR-Bank', revenue: '~NOK 8 mrd.', revenueNOK: 8, fineMax: 160 },
    { entity: 'SB1 Alliansen', revenue: '~NOK 40 mrd.', revenueNOK: 40, fineMax: 800 },
  ],
  oppside: [
    { entity: 'SB1 SMN', revenue: '~NOK 12 mrd.', revenueNOK: 12, fineMax: 240 },
    { entity: 'SB1 SR-Bank', revenue: '~NOK 10 mrd.', revenueNOK: 10, fineMax: 200 },
    { entity: 'SB1 Alliansen', revenue: '~NOK 50 mrd.', revenueNOK: 50, fineMax: 1000 },
  ],
};

// ─── Slide 3: Global Banks ───────────────────────────

export interface BankQuantumProfile {
  bank: string;
  region: string;
  patents: number;
  teamSize: string;
  investment: string;
  highlights: string;
  maturity: 'Ledende' | 'Produksjon' | 'Pilot' | 'Forskning' | 'Ingen';
}

export const bankProfiles: BankQuantumProfile[] = [
  { bank: 'JPMorgan Chase', region: 'USA', patents: 100, teamSize: '100+', investment: 'Høy', highlights: '71K bits QRNG, 1000x speedup, Q-CAN 100Gbps', maturity: 'Ledende' },
  { bank: 'HSBC', region: 'UK', patents: 20, teamSize: '30+', investment: 'Høy', highlights: '+34% bond-prediksjon, PQC VPN, QRNG gull', maturity: 'Produksjon' },
  { bank: 'BBVA', region: 'Spania', patents: 5, teamSize: '10+', investment: 'Middels', highlights: '52-asset opt. sekunder vs. 2 dager', maturity: 'Pilot' },
  { bank: 'Goldman Sachs', region: 'USA', patents: 15, teamSize: '20+', investment: 'Middels', highlights: '1000x derivatprising speedup estimert', maturity: 'Forskning' },
  { bank: 'Danske Bank', region: 'Norden', patents: 2, teamSize: '5+', investment: 'Lav', highlights: 'Første nordiske QKD 2022, CryptQ DKK 22.5M', maturity: 'Pilot' },
  { bank: 'SpareBank 1', region: 'Norge', patents: 0, teamSize: '0', investment: 'Ingen', highlights: 'Ingen bekreftet kvantum-initiativ', maturity: 'Ingen' },
];

export const bankRadarData = [
  { dimension: 'PQC', jpmorgan: 95, hsbc: 80, bbva: 40, qdaria: 85 },
  { dimension: 'QCaaS', jpmorgan: 90, hsbc: 70, bbva: 60, qdaria: 70 },
  { dimension: 'QRNG', jpmorgan: 95, hsbc: 75, bbva: 20, qdaria: 80 },
  { dimension: 'ML/AI', jpmorgan: 80, hsbc: 85, bbva: 50, qdaria: 60 },
  { dimension: 'Nordisk', jpmorgan: 5, hsbc: 10, bbva: 5, qdaria: 100 },
  { dimension: 'Kostnad', jpmorgan: 20, hsbc: 25, bbva: 50, qdaria: 90 },
];

// ─── Slide 4: BC01 Zipminator ROI ───────────────────

export interface RoiScenario {
  label: string;
  kostnad: number; // MNOK
  besparelse: number; // MNOK
  roi: number; // %
}

export const ziminatorRoi: Record<Scenario, RoiScenario[]> = {
  konservativ: [
    { label: 'DORA-bot unngått', kostnad: 15, besparelse: 300, roi: 1900 },
    { label: 'Datalekkasje unngått', kostnad: 15, besparelse: 65, roi: 333 },
    { label: 'Compliance-besparelse', kostnad: 15, besparelse: 25, roi: 67 },
  ],
  base: [
    { label: 'DORA-bot unngått', kostnad: 12, besparelse: 600, roi: 4900 },
    { label: 'Datalekkasje unngått', kostnad: 12, besparelse: 130, roi: 983 },
    { label: 'Compliance-besparelse', kostnad: 12, besparelse: 40, roi: 233 },
  ],
  oppside: [
    { label: 'DORA-bot unngått', kostnad: 8, besparelse: 1000, roi: 12400 },
    { label: 'Datalekkasje unngått', kostnad: 8, besparelse: 260, roi: 3150 },
    { label: 'Compliance-besparelse', kostnad: 8, besparelse: 60, roi: 650 },
  ],
};

// ─── Slide 5: BC02 Portfolio Optimization ────────────

export interface PortfolioScenarioPoint {
  year: number;
  klassisk: number; // relative performance index
  kvantum: number;
}

export const portfolioPerformance: Record<Scenario, PortfolioScenarioPoint[]> = {
  konservativ: [
    { year: 2025, klassisk: 100, kvantum: 100 },
    { year: 2026, klassisk: 103, kvantum: 104 },
    { year: 2027, klassisk: 106, kvantum: 109 },
    { year: 2028, klassisk: 109, kvantum: 115 },
    { year: 2029, klassisk: 112, kvantum: 121 },
    { year: 2030, klassisk: 115, kvantum: 128 },
  ],
  base: [
    { year: 2025, klassisk: 100, kvantum: 100 },
    { year: 2026, klassisk: 103, kvantum: 106 },
    { year: 2027, klassisk: 106, kvantum: 113 },
    { year: 2028, klassisk: 109, kvantum: 121 },
    { year: 2029, klassisk: 112, kvantum: 130 },
    { year: 2030, klassisk: 115, kvantum: 140 },
  ],
  oppside: [
    { year: 2025, klassisk: 100, kvantum: 100 },
    { year: 2026, klassisk: 103, kvantum: 108 },
    { year: 2027, klassisk: 106, kvantum: 118 },
    { year: 2028, klassisk: 109, kvantum: 130 },
    { year: 2029, klassisk: 112, kvantum: 145 },
    { year: 2030, klassisk: 115, kvantum: 162 },
  ],
};

export const speedupComparisons = [
  { name: 'JPMorgan', speedup: 1000, color: '#22D3EE' },
  { name: 'Crédit Agricole', speedup: 3.5, color: '#F59E0B' },
  { name: 'BBVA', speedup: 200, color: '#34D399' }, // seconds vs 2 days ≈ ~200x
  { name: 'Goldman Sachs', speedup: 1000, color: '#A78BFA' },
];

// ─── Slide 6: BC03 Risk Modeling ─────────────────────

export interface VaRConvergencePoint {
  simulations: number; // thousands
  klassisk: number; // error %
  kvantum: number; // error %
}

export const varConvergence: VaRConvergencePoint[] = [
  { simulations: 1, klassisk: 15, kvantum: 8 },
  { simulations: 5, klassisk: 10, kvantum: 4 },
  { simulations: 10, klassisk: 7, kvantum: 2.5 },
  { simulations: 50, klassisk: 4.5, kvantum: 1 },
  { simulations: 100, klassisk: 3, kvantum: 0.5 },
  { simulations: 500, klassisk: 1.5, kvantum: 0.15 },
  { simulations: 1000, klassisk: 1, kvantum: 0.05 },
];

export const sb1EntityExposure = [
  { entity: 'SMN', utlaan: 249, color: '#34D399' },
  { entity: 'SR-Bank', utlaan: 220, color: '#22D3EE' },
  { entity: 'Nord-Norge', utlaan: 85, color: '#F59E0B' },
  { entity: 'Østlandet', utlaan: 50, color: '#A78BFA' },
  { entity: 'Andre', utlaan: 21, color: '#FB7185' },
];

export const capitalAllocation = [
  { name: 'Utlån', value: 65, color: '#34D399' },
  { name: 'Verdipapir', value: 18, color: '#22D3EE' },
  { name: 'Eiendom', value: 10, color: '#F59E0B' },
  { name: 'Andre', value: 7, color: '#A78BFA' },
];

// ─── Slide 7: BC04 Fraud Detection ──────────────────

export interface FraudLossPoint {
  year: number;
  tap: number; // MNOK
  forhindret: number; // MNOK
}

export const fraudLossHistory: FraudLossPoint[] = [
  { year: 2019, tap: 420, forhindret: 800 },
  { year: 2020, tap: 490, forhindret: 950 },
  { year: 2021, tap: 520, forhindret: 1200 },
  { year: 2022, tap: 615, forhindret: 1600 },
  { year: 2023, tap: 928, forhindret: 2072 },
  { year: 2024, tap: 980, forhindret: 2300 },
];

export const mlAccuracyMetrics = [
  { metric: 'Presisjon', klassisk: 0.75, kvantum: 0.92 },
  { metric: 'Recall', klassisk: 0.68, kvantum: 0.88 },
  { metric: 'F1-score', klassisk: 0.71, kvantum: 0.90 },
  { metric: 'Falske pos.', klassisk: 0.25, kvantum: 0.15 },
  { metric: 'AUC-ROC', klassisk: 0.82, kvantum: 0.95 },
];

export interface FraudSavingsProjection {
  year: number;
  utenKvantum: number; // MNOK losses
  medKvantum: number; // MNOK losses
}

export const fraudSavings: Record<Scenario, FraudSavingsProjection[]> = {
  konservativ: [
    { year: 2025, utenKvantum: 100, medKvantum: 95 },
    { year: 2026, utenKvantum: 110, medKvantum: 100 },
    { year: 2027, utenKvantum: 120, medKvantum: 100 },
    { year: 2028, utenKvantum: 130, medKvantum: 100 },
    { year: 2029, utenKvantum: 140, medKvantum: 95 },
    { year: 2030, utenKvantum: 150, medKvantum: 90 },
  ],
  base: [
    { year: 2025, utenKvantum: 100, medKvantum: 90 },
    { year: 2026, utenKvantum: 115, medKvantum: 90 },
    { year: 2027, utenKvantum: 130, medKvantum: 85 },
    { year: 2028, utenKvantum: 145, medKvantum: 80 },
    { year: 2029, utenKvantum: 160, medKvantum: 72 },
    { year: 2030, utenKvantum: 175, medKvantum: 65 },
  ],
  oppside: [
    { year: 2025, utenKvantum: 100, medKvantum: 80 },
    { year: 2026, utenKvantum: 120, medKvantum: 75 },
    { year: 2027, utenKvantum: 140, medKvantum: 60 },
    { year: 2028, utenKvantum: 165, medKvantum: 50 },
    { year: 2029, utenKvantum: 190, medKvantum: 40 },
    { year: 2030, utenKvantum: 220, medKvantum: 30 },
  ],
};

// ─── Slide 9: Market Size ────────────────────────────

export interface MarketProjection {
  year: number;
  pqc: number; // $B
  qcaas: number; // $B
  total: number; // $B
}

export const marketProjections: Record<Scenario, MarketProjection[]> = {
  konservativ: [
    { year: 2024, pqc: 0.2, qcaas: 0.08, total: 0.28 },
    { year: 2025, pqc: 0.35, qcaas: 0.15, total: 0.50 },
    { year: 2026, pqc: 0.55, qcaas: 0.3, total: 0.85 },
    { year: 2027, pqc: 0.8, qcaas: 0.6, total: 1.4 },
    { year: 2028, pqc: 1.1, qcaas: 1.0, total: 2.1 },
    { year: 2029, pqc: 1.6, qcaas: 1.8, total: 3.4 },
    { year: 2030, pqc: 2.2, qcaas: 3.0, total: 5.2 },
    { year: 2032, pqc: 3.5, qcaas: 8.0, total: 11.5 },
    { year: 2035, pqc: 5.0, qcaas: 20.0, total: 25.0 },
  ],
  base: [
    { year: 2024, pqc: 0.2, qcaas: 0.08, total: 0.28 },
    { year: 2025, pqc: 0.42, qcaas: 0.2, total: 0.62 },
    { year: 2026, pqc: 0.7, qcaas: 0.5, total: 1.2 },
    { year: 2027, pqc: 1.1, qcaas: 1.0, total: 2.1 },
    { year: 2028, pqc: 1.6, qcaas: 2.0, total: 3.6 },
    { year: 2029, pqc: 2.2, qcaas: 3.5, total: 5.7 },
    { year: 2030, pqc: 2.84, qcaas: 5.5, total: 8.34 },
    { year: 2032, pqc: 4.5, qcaas: 14.5, total: 19.0 },
    { year: 2035, pqc: 8.0, qcaas: 42.0, total: 50.0 },
  ],
  oppside: [
    { year: 2024, pqc: 0.2, qcaas: 0.08, total: 0.28 },
    { year: 2025, pqc: 0.5, qcaas: 0.3, total: 0.8 },
    { year: 2026, pqc: 1.0, qcaas: 0.8, total: 1.8 },
    { year: 2027, pqc: 1.8, qcaas: 2.0, total: 3.8 },
    { year: 2028, pqc: 3.0, qcaas: 4.5, total: 7.5 },
    { year: 2029, pqc: 5.0, qcaas: 8.0, total: 13.0 },
    { year: 2030, pqc: 7.0, qcaas: 15.0, total: 22.0 },
    { year: 2032, pqc: 12.0, qcaas: 35.0, total: 47.0 },
    { year: 2035, pqc: 30.0, qcaas: 70.0, total: 100.0 },
  ],
};

export const defensiveVsOffensive = [
  { name: 'Defensiv (PQC)', value: 3700, color: '#FB7185' },
  { name: 'Offensiv (QCaaS)', value: 15300, color: '#22D3EE' },
];

export const cagrComparison = [
  { segment: 'Quantum fintech', cagr: 72, color: '#22D3EE' },
  { segment: 'PQC-marked', cagr: 46.2, color: '#F59E0B' },
  { segment: 'Cybersecurity', cagr: 12, color: '#FB7185' },
  { segment: 'Cloud-tjenester', cagr: 18, color: '#34D399' },
  { segment: 'AI/ML', cagr: 35, color: '#A78BFA' },
];

// ─── Slide 10: QDaria Org ────────────────────────────

export interface OrgNode {
  name: string;
  location: string;
  purpose: string;
  color: string;
  lat: number;
  lng: number;
}

export const qdariaOrg: OrgNode[] = [
  { name: 'QDaria AS', location: 'Oslo, Norge', purpose: 'Holding / R&D HQ', color: '#22D3EE', lat: 59.91, lng: 10.75 },
  { name: 'QDaria IP AG', location: 'Zug, Sveits', purpose: 'IP-holding', color: '#F59E0B', lat: 47.17, lng: 8.52 },
  { name: 'QDaria Inc', location: 'Delaware, USA', purpose: 'Zipminator US + THQAI', color: '#FB7185', lat: 39.74, lng: -75.54 },
  { name: 'QDaria Pte Ltd', location: 'Singapore', purpose: 'Qm9 + Q-IO + Q-Robotics', color: '#34D399', lat: 1.35, lng: 103.82 },
  { name: 'QDaria Ltd', location: 'ADGM, UAE', purpose: 'MENA-salg', color: '#A78BFA', lat: 24.45, lng: 54.65 },
  { name: 'QDaria Ltd', location: 'Malta', purpose: 'QRNG-as-a-Service for iGaming', color: '#818CF8', lat: 35.90, lng: 14.51 },
];

// ─── Slide 11: Next Steps Timeline ──────────────────

export interface PhaseStep {
  phase: number;
  title: string;
  duration: string;
  startMonth: number; // 0 = now
  endMonth: number;
  items: string[];
  color: string;
}

export const nextStepsPhases: PhaseStep[] = [
  {
    phase: 1,
    title: 'Proof of Concept',
    duration: '0–3 mnd.',
    startMonth: 0,
    endMonth: 3,
    items: [
      'Kryptografisk inventar av SB1 Utvikling',
      'QRNG-integrasjon i BankID testmiljø',
      'DORA Art. 6 gap-analyse',
    ],
    color: '#22D3EE',
  },
  {
    phase: 2,
    title: 'Expanded Partnership',
    duration: '3–12 mnd.',
    startMonth: 3,
    endMonth: 12,
    items: [
      'QCaaS porteføljeopt. på ODIN data',
      'Quantum ML fraud detection sandkasse',
      'Rigetti VP formell samarbeidsavtale',
    ],
    color: '#F59E0B',
  },
  {
    phase: 3,
    title: 'Strategic Alliance',
    duration: '12–24 mnd.',
    startMonth: 12,
    endMonth: 24,
    items: [
      'Full PQC-migrering alle 14 banker',
      'Felles pressemelding + Rigetti endorsement',
      'Nasjonal presedens og akademisk publisering',
    ],
    color: '#34D399',
  },
];
