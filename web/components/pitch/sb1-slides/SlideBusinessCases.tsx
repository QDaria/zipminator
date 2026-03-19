'use client';

import React from 'react';
import { SlideWrapper, SlideTitle } from '../pitch-ui/SB1SlideWrapper';
import { MetricCard, DataRow, Tag } from '../pitch-ui/MetricCard';

// ─────────────────────────────────────────
// BC 02: Portfolio Optimization
// ─────────────────────────────────────────
export const SlidePortfolio: React.FC = () => (
  <SlideWrapper>
    <div className="flex flex-col h-full px-10 py-8">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono text-amber-400 tracking-wider uppercase" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Business Case 02 av 05
        </span>
        <Tag color="amber">QCaaS · ODIN Forvaltning & SB1 Markets</Tag>
      </div>

      <SlideTitle
        eyebrow="Kvantum Porteføljeoptimalisering"
        title="1 000x raskere porteføljeoptimalisering for ODIN og SB1 Markets."
        subtitle="JPMorgan løser porteføljeoptimalisering på 0,3 sekunder klassisk tid: 5 minutter. BBVA optimaliserte 52 aktiva blant 10 382 kandidater på sekunder vs. 2 dager. QDaria tilbyr dette via QCaaS på Rigetti-hardware — uten CAPEX."
        accentColor="#F59E0B"
      />

      <div className="grid grid-cols-3 gap-4 mb-5">
        <MetricCard value="1 000x" label="Speedup porteføljeopt." sublabel="JPMorgan vs. klassisk" color="amber" source="JPMorgan 2025" />
        <MetricCard value="3.5x" label="Raskere modelltrening" sublabel="Crédit Agricole · 50 qubits" color="cyan" source="CA 2025" />
        <MetricCard value="$400–600B" label="Verdi kvantum finanssektor" sublabel="McKinsey Quantum Monitor 2025" color="emerald" source="McKinsey" />
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        <div className="rounded-lg p-5" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <p className="text-amber-400 text-xs font-mono tracking-wider uppercase mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>SB1 Markets / ODIN Use Case</p>
          <div className="space-y-2">
            {[
              'Multi-asset allokering med kombinatorisk QA (QUBO)',
              'Markowitz mean-variance på 100+ aktiva i real-time',
              'Derivatprising via quantum amplitude estimation',
              'Stress-testing av AUM-scenarier (Basel IV)',
              'ESG-optimalisert porteføljebygging',
            ].map((u, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-amber-500 text-xs mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>▸</span>
                <p className="text-slate-400 text-sm leading-snug" style={{ fontFamily: "'DM Sans', sans-serif" }}>{u}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(245,158,11,0.15)' }}>
          <div className="px-4 py-2.5 border-b" style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)' }}>
            <span className="text-amber-400 text-xs font-mono tracking-wider uppercase" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Kommersielle parametre</span>
          </div>
          <div className="p-1">
            <DataRow label="Leveringsmodell" value="QCaaS (SaaS)" accent="#F59E0B" />
            <DataRow label="Hardware-CAPEX SB1" value="NOK 0" accent="#34D399" highlight />
            <DataRow label="Første pilot (estimat)" value="3 mnd." />
            <DataRow label="Estimert AUM-forbedring" value="0.3–1.2% p.a." accent="#F59E0B" highlight />
            <DataRow label="ROI (3-årshorisont, 5B AUM)" value="NOK 15–60M" accent="#34D399" highlight />
          </div>
        </div>
      </div>
    </div>
  </SlideWrapper>
);

// ─────────────────────────────────────────
// BC 03: Risk Modeling
// ─────────────────────────────────────────
export const SlideRiskModeling: React.FC = () => (
  <SlideWrapper>
    <div className="flex flex-col h-full px-10 py-8">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono text-emerald-400 tracking-wider uppercase" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Business Case 03 av 05
        </span>
        <Tag color="emerald">Monte Carlo · Basel III/IV · VaR</Tag>
      </div>

      <SlideTitle
        eyebrow="Kvantum Risikomodellering"
        title="Kvadratisk speedup for VaR og Basel-beregninger."
        subtitle="Norske banker kjører nattbatcher for Value-at-Risk under Basel III. Quantum amplitude estimation gir kvadratisk speedup — O(M^-½) til O(M^-1). For SpareBank 1 SMN sitt lånebok på NOK 249+ mrd. betyr dette dramatisk bedre presisjon og kapitallokering."
        accentColor="#34D399"
      />

      <div className="grid grid-cols-2 gap-5 flex-1">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <MetricCard value="5.6x" label="Raskere enn HPC-klynge" sublabel="Kvantum Monte Carlo benchmark" color="emerald" source="arXiv 2024" />
            <MetricCard value="Q²" label="Kvadratisk speedup" sublabel="Amplitude estimation vs. klassisk" color="cyan" />
          </div>
          <div className="rounded-lg p-5 flex-1" style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <p className="text-emerald-400 text-xs font-mono tracking-wider uppercase mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Teknisk use case</p>
            <div className="space-y-3">
              {[
                { label: 'VaR (Value-at-Risk)', desc: 'Intradag-beregning i stedet for nattbatch — bedre kapitalstyring' },
                { label: 'Stressed VaR', desc: 'FRTB IMA-krav oppfylt med quantum MC-presisjon' },
                { label: 'Kredittrisiko (CVA/DVA)', desc: 'Simulering av 10 000+ scenarier i real-time' },
                { label: 'ILAAP / ICAAP stress-tester', desc: 'Finanstilsynet-rapportering med høyere presisjon' },
              ].map((u) => (
                <div key={u.label} className="flex flex-col">
                  <span className="text-emerald-400 text-xs font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{u.label}</span>
                  <p className="text-slate-400 text-xs leading-snug" style={{ fontFamily: "'DM Sans', sans-serif" }}>{u.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(52,211,153,0.15)' }}>
            <div className="px-4 py-2.5 border-b" style={{ background: 'rgba(52,211,153,0.08)', borderColor: 'rgba(52,211,153,0.15)' }}>
              <span className="text-emerald-400 text-xs font-mono tracking-wider uppercase" style={{ fontFamily: "'JetBrains Mono', monospace" }}>SB1 eksponeringer</span>
            </div>
            <div className="p-1">
              <DataRow label="SMN utlånsvolum" value="NOK 249 mrd." accent="#34D399" highlight />
              <DataRow label="SR-Bank (Sør-Norge) utlån" value="NOK 220+ mrd." />
              <DataRow label="Alliance total forvaltning" value="NOK 625 mrd." accent="#34D399" highlight />
              <DataRow label="Kapitalforbedring (estimat)" value="0.1–0.5%" />
              <DataRow label="NOK-verdi kapitaleffekt" value="625M–3.1B" accent="#34D399" highlight />
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <p className="text-amber-400 text-xs font-mono mb-2 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Regulatorisk driver</p>
            <p className="text-slate-300 text-sm leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Basel IV (CRR3) krever mer granulære risikomodeller fra 2025. Quantum MC gir SpareBank 1 en strukturell presisjonsmarginal over konkurrentene.
            </p>
          </div>
        </div>
      </div>
    </div>
  </SlideWrapper>
);

// ─────────────────────────────────────────
// BC 04: Fraud Detection
// ─────────────────────────────────────────
export const SlideFraudDetection: React.FC = () => (
  <SlideWrapper>
    <div className="flex flex-col h-full px-10 py-8">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono text-violet-400 tracking-wider uppercase" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Business Case 04 av 05
        </span>
        <Tag color="cyan">Quantum ML · Svindeldeteksjon</Tag>
      </div>

      <SlideTitle
        eyebrow="Quantum Machine Learning"
        title="Svindeltap NOK 928M i 2023. Quantum ML endrer ligningen."
        subtitle="Finanstilsynet dokumenterte NOK 928M i faktiske svindeltap i 2023 — en økning på 51%. Intesa Sanpaolo sin Quantum ML-løsning overpresterer tradisjonelle metoder. SB1 SMN investerte allerede NOK 40M i NTNU AI Lab. Neste steg er kvantum."
        accentColor="#A78BFA"
      />

      <div className="grid grid-cols-3 gap-4 mb-5">
        <MetricCard value="NOK 928M" label="Svindeltap norske banker 2023" sublabel="+51% fra 2022 · Finanstilsynet" color="rose" source="Finanstilsynet 2024" />
        <MetricCard value="0.88–0.98" label="F1-score Quantum ML" sublabel="Mot svindel i pilot-studier" color="cyan" source="Nature QI" />
        <MetricCard value="40%" label="Reduksjon falske positiver" sublabel="McKinsey quantum fraud estimate" color="emerald" source="McKinsey" />
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        <div className="rounded-lg p-5" style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.2)' }}>
          <p className="text-violet-400 text-xs font-mono tracking-wider uppercase mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Quantum ML-arkitektur</p>
          <div className="space-y-2.5">
            {[
              'Quantum kernel methods for anomalideteksjon i transaksjonsstrømmer',
              'QRC (Quantum Reservoir Computing) for tidsserieanalyse av betalingsmønstre',
              'Hybride klassisk/kvantemodeller (NISQ-kompatibelt i dag)',
              'Rigetti-basert trening — QDaria has Innovate UK-finansiert fraud-program via Rigetti+Algorithmiq',
              'Integrasjon med eksisterende SB1 AI-infrastruktur (NTNU Lab)',
            ].map((u, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-violet-400 text-xs mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>▸</span>
                <p className="text-slate-400 text-sm leading-snug" style={{ fontFamily: "'DM Sans', sans-serif" }}>{u}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(167,139,250,0.15)' }}>
          <div className="px-4 py-2.5 border-b" style={{ background: 'rgba(167,139,250,0.08)', borderColor: 'rgba(167,139,250,0.15)' }}>
            <span className="text-violet-400 text-xs font-mono tracking-wider uppercase" style={{ fontFamily: "'JetBrains Mono', monospace" }}>ROI-scenario</span>
          </div>
          <div className="p-1">
            <DataRow label="Faktiske tap SB1 (estimert andel)" value="NOK 80–150M" />
            <DataRow label="Forhindrede forsøk (SB1 andel)" value="NOK 200M+" />
            <DataRow label="Forbedring deteksjonsrate" value="+15–40%" accent="#A78BFA" highlight />
            <DataRow label="Reduksjon kostnad per undersøkelse" value="−30%" />
            <DataRow label="Estimert netto gevinst (år 1)" value="NOK 20–50M" accent="#34D399" highlight />
            <DataRow label="Implementeringstid" value="6–9 mnd." />
          </div>
        </div>
      </div>
    </div>
  </SlideWrapper>
);

// ─────────────────────────────────────────
// BC 05: QRNG
// ─────────────────────────────────────────
export const SlideQRNG: React.FC = () => (
  <SlideWrapper>
    <div className="flex flex-col h-full px-10 py-8">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono text-cyan-400 tracking-wider uppercase" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Business Case 05 av 05
        </span>
        <Tag color="cyan">QRNG · BankID · Vipps</Tag>
      </div>

      <SlideTitle
        eyebrow="Quantum Random Number Generation"
        title="Kryptografisk entropi som ikke kan manipuleres eller forutsies."
        subtitle="Klassiske PRNG-generatorer er deterministiske og kan kompromitteres. QRNG fra kvantemekanikken er fundamentalt uforutsigbar. JPMorgan sertifiserte 71 313 bits ekte kvantumentropi i Nature (2025). HSBC bruker QRNG for tokenisert gull. SpareBank 1 kan bruke det for BankID og Vipps."
        accentColor="#22D3EE"
      />

      <div className="grid grid-cols-2 gap-5 flex-1">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <MetricCard value="71 313" label="Bits sertifisert kvantum-entropi" sublabel="JPMorgan × Quantinuum · Nature 2025" color="cyan" size="sm" source="JPMorgan" />
            <MetricCard value="1.52B" label="Vipps-transaksjoner 2024" sublabel="Alle avhengig av kryptografisk entropi" color="amber" size="sm" />
          </div>
          <div className="rounded-lg p-5 flex-1" style={{ background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.2)' }}>
            <p className="text-cyan-400 text-xs font-mono tracking-wider uppercase mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>SB1 QRNG Use Cases</p>
            <div className="space-y-2.5">
              {[
                { app: 'BankID-autentisering', desc: 'Kvanteentropi for session keys — uknekbar av fremtidige QC' },
                { app: 'Vipps betalingsprotokoll', desc: 'Quantum-genererte transaksjons-tokens' },
                { app: 'Monte Carlo frøverdier', desc: 'Ekte tilfeldighet forbedrer modellkvalitet' },
                { app: 'Kryptografiske nøkler (DORA Art. 7)', desc: 'Nøkkelgenerering som oppfyller post-kvantum krav' },
                { app: 'HSM-integrasjon', desc: 'Drop-in i eksisterende Hardware Security Modules' },
              ].map((u) => (
                <div key={u.app} className="flex flex-col">
                  <span className="text-cyan-400 text-xs font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{u.app}</span>
                  <p className="text-slate-500 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>{u.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(34,211,238,0.15)' }}>
            <div className="px-4 py-2.5 border-b" style={{ background: 'rgba(34,211,238,0.08)', borderColor: 'rgba(34,211,238,0.15)' }}>
              <span className="text-cyan-400 text-xs font-mono tracking-wider uppercase" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Kommersielle parametre</span>
            </div>
            <div className="p-1">
              <DataRow label="Leveringsmodell" value="API / HSM-integrasjon" />
              <DataRow label="Implementeringstid" value="1–3 mnd." accent="#22D3EE" />
              <DataRow label="DORA Art. 7 compliance" value="✓ Oppfylt" accent="#34D399" highlight />
              <DataRow label="Volum (Vipps+BankID/år)" value="~2 mrd. operasjoner" />
              <DataRow label="Kostnad per million ops" value="NOK ~0.1" />
              <DataRow label="Inkrementell sikkerhetspremie" value="Prishevingsgrunnlag" accent="#F59E0B" highlight />
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <p className="text-amber-400 text-xs font-mono mb-2 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Globale presedenser</p>
            <div className="space-y-1.5">
              {[
                'HSBC: QRNG for tokenisert gull på Orion blockchain',
                'JPMorgan: Sertifisert kvantum-tilfeldighet (Nature, 2025)',
                'London Quantum Secure Metro Network',
              ].map((p, i) => (
                <p key={i} className="text-slate-500 text-xs leading-snug" style={{ fontFamily: "'DM Sans', sans-serif" }}>↗ {p}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </SlideWrapper>
);
