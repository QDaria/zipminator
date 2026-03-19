'use client';

import React from 'react';
import { SlideWrapper, SlideTitle } from '../pitch-ui/SB1SlideWrapper';
import { MetricCard } from '../pitch-ui/MetricCard';

// ─────────────────────────────────────────
// Market Size
// ─────────────────────────────────────────
export const SlideMarketSize: React.FC = () => {
  const markets = [
    { label: 'Quantum fintech spending', value2032: '$19B', cagr: '72%', note: 'Deloitte CFS', color: '#22D3EE' },
    { label: 'Post-Quantum Cryptography', value2030: '$2.84B', cagr: '46.2%', note: 'MarketsandMarkets', color: '#F59E0B' },
    { label: 'Quantum value creation finans', value: '$400–600B', horizon: 'innen 2035', note: 'McKinsey 2025', color: '#34D399' },
    { label: 'PQC markedet (high-end)', value2034: '$29.95B', cagr: '40%+', note: 'Precedence Research', color: '#A78BFA' },
  ];

  return (
    <SlideWrapper>
      <div className="flex flex-col h-full px-10 py-8">
        <SlideTitle
          eyebrow="Markedsstørrelse · Investmentcase"
          title="$450 milliarder i vei. Norge mangler sin aktør."
          subtitle="Quantum computing og PQC vokser i finanssektoren med 40–72% CAGR. McKinsey anslår $400–600B i verdiskapning innen 2035. QDaria er Norges eneste selskap posisjonert til å levere dette til nordisk finanssektor."
          accentColor="#22D3EE"
        />

        <div className="grid grid-cols-4 gap-4 mb-5">
          {markets.map((m) => (
            <div
              key={m.label}
              className="rounded-lg p-4 flex flex-col gap-1.5 relative overflow-hidden"
              style={{
                background: `${m.color}08`,
                border: `1px solid ${m.color}25`,
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${m.color}, transparent)` }} />
              <span className="text-2xl font-bold" style={{ color: m.color, fontFamily: "'JetBrains Mono', monospace" }}>
                {m.value2032 || m.value2030 || m.value || m.value2034}
              </span>
              <span className="text-slate-300 text-xs font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>{m.label}</span>
              <span className="text-xs font-mono" style={{ color: m.color, fontFamily: "'JetBrains Mono', monospace" }}>
                {m.cagr ? `${m.cagr} CAGR` : m.horizon}
              </span>
              <span className="text-slate-600 text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{m.note}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-5 flex-1">
          {/* Defensive vs offensive */}
          <div className="rounded-lg p-5" style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.15)' }}>
            <p className="text-cyan-400 text-xs font-mono tracking-wider uppercase mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Defensiv vs. Offensiv verdi</p>
            <div className="space-y-3">
              {[
                { type: 'Defensiv (PQC)', y2025: '$7M', y2032: '$3.7B', color: '#FB7185', desc: 'PQC-sikkerhet, DORA-compliance, datavern' },
                { type: 'Offensiv (QCaaS)', y2025: '$73M', y2032: '$15.3B', color: '#22D3EE', desc: 'Portefølje, risiko, fraud, QRNG' },
              ].map((row) => (
                <div key={row.type} className="flex flex-col gap-1 p-3 rounded" style={{ background: `${row.color}08` }}>
                  <div className="flex justify-between">
                    <span className="text-xs font-semibold" style={{ color: row.color, fontFamily: "'DM Sans', sans-serif" }}>{row.type}</span>
                    <span className="text-xs font-mono" style={{ color: row.color, fontFamily: "'JetBrains Mono', monospace" }}>2025: {row.y2025} → 2032: {row.y2032}</span>
                  </div>
                  <p className="text-slate-500 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>{row.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Nordic opportunity */}
          <div className="rounded-lg p-5" style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <p className="text-amber-400 text-xs font-mono tracking-wider uppercase mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Nordisk first-mover landscape</p>
            <div className="space-y-3">
              {[
                { bank: 'Danske Bank', country: 'DK', status: 'QKD pilot 2022 · CryptQ prosjekt', done: true },
                { bank: 'Nordea / SEB / Swedbank', country: 'SE/FI', status: 'Utforsker PQC og risikomodellering', done: false },
                { bank: 'DNB', country: 'NO', status: 'Ingen bekreftet quantum-program', done: false },
                { bank: 'SpareBank 1', country: 'NO', status: '← Åpent vindu · First-mover mulighet', done: false, highlight: true },
              ].map((row) => (
                <div key={row.bank} className="flex items-center justify-between py-2 px-3 rounded"
                  style={{ background: row.highlight ? 'rgba(245,158,11,0.1)' : 'transparent', border: row.highlight ? '1px solid rgba(245,158,11,0.3)' : 'none' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{row.country}</span>
                    <span className="text-slate-300 text-sm" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: row.highlight ? 600 : 400 }}>{row.bank}</span>
                  </div>
                  <span className="text-xs" style={{ color: row.done ? '#34D399' : row.highlight ? '#F59E0B' : '#64748B', fontFamily: "'DM Sans', sans-serif" }}>
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
};

// ─────────────────────────────────────────
// QDaria Positioning
// ─────────────────────────────────────────
export const SlideQDaria: React.FC = () => (
  <SlideWrapper>
    <div className="flex flex-col h-full px-10 py-8">
      <SlideTitle
        eyebrow="QDaria AS · Posisjonering"
        title="Norges eneste kvanteselskap. Første kommersielle kvantedatamaskin."
        subtitle="NQCG ble oppløst i desember 2024. QDaria er nå uten direkte norsk konkurranse, med Rigetti-partnerskap, publisert forskning og produksjonsklar Zipminator-plattform."
        accentColor="#22D3EE"
      />

      <div className="grid grid-cols-3 gap-5 mb-5">
        <MetricCard value="1" label="Norsk kvanteselskap igjen" sublabel="NQCG oppløst des. 2024" color="cyan" />
        <MetricCard value="156Q" label="Rigetti Heron-prosessor" sublabel="QRC-eksperimenter publisert" color="amber" />
        <MetricCard value="$12M" label="Seed-runde pågående" sublabel="Intern verdsettelse" color="emerald" />
      </div>

      <div className="grid grid-cols-2 gap-5 flex-1">
        <div className="flex flex-col gap-3">
          <p className="text-cyan-400 text-xs font-mono tracking-wider uppercase" style={{ fontFamily: "'JetBrains Mono', monospace" }}>QDaria produktportefølje</p>
          {[
            { product: 'Zipminator', tag: 'Beta-klar', desc: 'Post-kvantum kryptografi platform (App Store + Android + Desktop innen neste fredag)', color: '#FB7185' },
            { product: 'QCaaS / QCaaP', tag: 'Live via Rigetti', desc: 'Quantum Computing as a Service på Norges første kommersielle kvantedatamaskin', color: '#22D3EE' },
            { product: 'Qm9 (Fintech)', tag: 'Development', desc: 'Quantum-drevet finansielle tjenester — portefølje, prising, risikovurdering', color: '#F59E0B' },
            { product: 'QDiana (Edtech)', tag: 'Live', desc: 'Kvantumutdanning og kompetansebygging for norsk næringsliv', color: '#34D399' },
          ].map((p) => (
            <div key={p.product} className="rounded-lg p-3.5 flex gap-3 items-start" style={{ background: `${p.color}06`, border: `1px solid ${p.color}20` }}>
              <div className="flex flex-col gap-0.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-200 text-sm font-semibold" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>{p.product}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ color: p.color, background: `${p.color}15`, fontFamily: "'JetBrains Mono', monospace" }}>{p.tag}</span>
                </div>
                <p className="text-slate-500 text-xs leading-snug" style={{ fontFamily: "'DM Sans', sans-serif" }}>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-cyan-400 text-xs font-mono tracking-wider uppercase" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Konkurransefortrinn vs. globale aktører</p>
          <div className="rounded-lg overflow-hidden flex-1" style={{ border: '1px solid rgba(34,211,238,0.15)' }}>
            {[
              { dim: 'Norsk regulatorisk ekspertise', qdaria: '✓✓✓', global: '✗' },
              { dim: 'Rigetti-hardware tilgang', qdaria: '✓ Direkte partner', global: '✓ (IBM/IonQ)' },
              { dim: 'PQC + QCaaS i ett selskap', qdaria: '✓', global: 'Sjelden' },
              { dim: 'Norsk etablering', qdaria: 'Oslo-basert', global: 'London/NYC/Berlin' },
              { dim: 'Tid til pilot', qdaria: '3 mnd.', global: '6–18 mnd.' },
              { dim: 'Aktiv forskning (arXiv)', qdaria: '2 papers 2025', global: 'Varierende' },
              { dim: 'CAPEX krav SB1', qdaria: 'NOK 0 (SaaS)', global: 'Varierende' },
            ].map((row) => (
              <div key={row.dim} className="flex items-center border-b" style={{ borderColor: 'rgba(34,211,238,0.08)' }}>
                <div className="flex-1 px-3 py-2">
                  <span className="text-slate-400 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>{row.dim}</span>
                </div>
                <div className="w-24 px-3 py-2 border-l text-center" style={{ borderColor: 'rgba(34,211,238,0.08)', background: 'rgba(34,211,238,0.05)' }}>
                  <span className="text-cyan-400 text-xs font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{row.qdaria}</span>
                </div>
                <div className="w-24 px-3 py-2 border-l text-center" style={{ borderColor: 'rgba(34,211,238,0.08)' }}>
                  <span className="text-slate-500 text-xs font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{row.global}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </SlideWrapper>
);

// ─────────────────────────────────────────
// Next Steps
// ─────────────────────────────────────────
export const SlideNextSteps: React.FC = () => (
  <SlideWrapper>
    <div className="flex flex-col h-full px-10 py-8">
      <SlideTitle
        eyebrow="Veien videre · Call to Action"
        title="Tre steg til Norges første kvantebank."
        subtitle="Vi ønsker ikke å selge et produkt til SpareBank 1. Vi ønsker å bygge et historisk partnerskap — og vi mener SpareBank 1 er den rette partneren til å vise at norsk finanssektor er klar for kvantumtiden."
        accentColor="#22D3EE"
      />

      <div className="grid grid-cols-3 gap-5 mb-5">
        {[
          {
            step: '01',
            phase: 'Proof of Concept',
            time: '3 måneder',
            title: 'Pilot Zipminator + QRNG',
            items: [
              'Kryptografisk inventar av SB1 Utvikling sin Azure-plattform',
              'QRNG-integrasjon i BankID testmiljø',
              'DORA Art. 6 gap-analyse',
            ],
            color: '#22D3EE',
          },
          {
            step: '02',
            phase: 'Expanded Partnership',
            time: '6–12 måneder',
            title: 'QCaaS pilot + Fraud ML',
            items: [
              'Porteføljeoptimalisering på SB1 Markets / ODIN reelle data',
              'Quantum ML fraud detection i sandkasse',
              'Mike Piech (Rigetti VP) formell samarbeidsavtale',
            ],
            color: '#F59E0B',
          },
          {
            step: '03',
            phase: 'Strategic Alliance',
            time: '12–24 måneder',
            title: 'SpareBank 1 = Nordens kvantebank',
            items: [
              'Full PQC-migrering for alle 14 banker',
              'QDaria × SB1 felles pressemelding og Rigetti endorsement',
              'Nasjonal presedens — regulatorisk, kommersiell, akademisk',
            ],
            color: '#34D399',
          },
        ].map((s) => (
          <div key={s.step} className="rounded-lg p-5 flex flex-col gap-3" style={{ background: `${s.color}06`, border: `1px solid ${s.color}25` }}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-4xl font-bold" style={{ color: `${s.color}30`, fontFamily: "'JetBrains Mono', monospace" }}>{s.step}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color: s.color, background: `${s.color}15`, fontFamily: "'JetBrains Mono', monospace" }}>{s.time}</span>
              </div>
              <p className="text-xs font-mono" style={{ color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.phase}</p>
              <h3 className="text-slate-200 text-base font-semibold mt-1" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>{s.title}</h3>
            </div>
            <div className="space-y-1.5 flex-1">
              {s.items.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span style={{ color: s.color, fontFamily: "'JetBrains Mono', monospace" }} className="text-xs mt-0.5 shrink-0">▸</span>
                  <p className="text-slate-400 text-xs leading-snug" style={{ fontFamily: "'DM Sans', sans-serif" }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="rounded-lg p-5" style={{ background: 'rgba(225,29,72,0.05)', border: '1px solid rgba(225,29,72,0.2)' }}>
          <p className="text-rose-400 text-xs font-mono tracking-wider uppercase mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Hva SpareBank 1 får</p>
          <div className="space-y-1">
            {[
              'Nordens første post-kvantum sikrede bank-infrastruktur',
              'DORA Art. 6 compliance-dokumentasjon',
              'Eksklusiv tilgang til Norges eneste kommersielle kvantedatamaskin',
              'Konkurransefortrinn i en sektor som ikke har begynt',
              'Historisk førstemann-posisjon — et narrativ SB1 Markets kan eie',
            ].map((i, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-rose-400 text-xs mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>✓</span>
                <p className="text-slate-400 text-xs leading-snug" style={{ fontFamily: "'DM Sans', sans-serif" }}>{i}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg p-5 flex flex-col justify-between" style={{ background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.25)' }}>
          <p className="text-cyan-400 text-xs font-mono tracking-wider uppercase mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Kontakt</p>
          <div className="space-y-2 flex-1 justify-center flex flex-col">
            <p className="text-slate-200 text-lg font-semibold" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>Daniel Mo Houshmand</p>
            <p className="text-slate-400 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>CEO & Co-founder · QDaria AS</p>
            <p className="text-cyan-400 text-sm font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>mo@qdaria.com</p>
            <p className="text-slate-500 text-xs font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>qdaria.com · Oslo, Norge</p>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Mike Piech (Rigetti VP) — invitert til neste møte
            </span>
          </div>
        </div>
      </div>
    </div>
  </SlideWrapper>
);
