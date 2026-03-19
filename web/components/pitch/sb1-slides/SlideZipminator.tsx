'use client';

import React from 'react';
import { SlideWrapper, SlideTitle } from '../pitch-ui/SB1SlideWrapper';
import { MetricCard, DataRow, Tag } from '../pitch-ui/MetricCard';

export const SlideZipminator: React.FC = () => {
  const phases = [
    { phase: 'Fase 1', label: 'Kryptografisk inventar og risikovurdering', duration: '2–4 mnd.', icon: '◈' },
    { phase: 'Fase 2', label: 'Hybrid PQC-overgang (klassisk + NIST PQC parallelt)', duration: '6–12 mnd.', icon: '◐' },
    { phase: 'Fase 3', label: 'Full NIST-standardisert PQC-infrastruktur', duration: '12–24 mnd.', icon: '●' },
  ];

  return (
    <SlideWrapper>
      <div className="flex flex-col h-full px-10 py-8">
        {/* Header with BC number */}
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-xs font-mono text-rose-400 tracking-wider uppercase"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Business Case 01 av 05
          </span>
          <Tag color="rose">DORA-Compliance · Zipminator</Tag>
        </div>

        <SlideTitle
          eyebrow="Post-Kvantum Kryptografi"
          title="Zipminator: Kvantesikker infrastruktur for hele alliansen."
          subtitle="SB1 Utvikling sin sentraliserte Azure-plattform er én arkitektur for 14 banker. Én Zipminator-implementering beskytter alle 14 — til én brøkdel av individuelle kostnader."
          accentColor="#FB7185"
        />

        <div className="grid grid-cols-12 gap-5 flex-1">
          {/* Left: phases */}
          <div className="col-span-5 flex flex-col gap-3">
            <p
              className="text-rose-400 text-xs font-mono tracking-wider uppercase"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Implementeringsplan
            </p>
            {phases.map((p, i) => (
              <div
                key={i}
                className="rounded-lg p-4 flex gap-4 items-start"
                style={{
                  background: `rgba(251,113,133,${0.04 + i * 0.02})`,
                  border: '1px solid rgba(251,113,133,0.15)',
                }}
              >
                <div
                  className="text-rose-400 text-xl shrink-0 mt-0.5"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {p.icon}
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-rose-400 text-xs font-mono"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {p.phase}
                    </span>
                    <span
                      className="text-slate-500 text-xs font-mono"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {p.duration}
                    </span>
                  </div>
                  <p
                    className="text-slate-300 text-sm"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {p.label}
                  </p>
                </div>
              </div>
            ))}

            {/* NIST standards */}
            <div
              className="rounded-lg p-4 mt-auto"
              style={{
                background: 'rgba(34,211,238,0.04)',
                border: '1px solid rgba(34,211,238,0.15)',
              }}
            >
              <p
                className="text-cyan-400 text-xs font-mono tracking-wider uppercase mb-2"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                NIST-standardisert aug. 2024
              </p>
              <div className="space-y-1">
                {[
                  { std: 'FIPS 203 · ML-KEM', desc: 'Nøkkelinnkapsling (erstatter RSA)' },
                  { std: 'FIPS 204 · ML-DSA', desc: 'Digitale signaturer (erstatter ECC)' },
                  { std: 'FIPS 205 · SLH-DSA', desc: 'Hash-baserte signaturer' },
                ].map((s) => (
                  <div key={s.std} className="flex justify-between items-center">
                    <span
                      className="text-cyan-400 text-xs font-mono"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {s.std}
                    </span>
                    <span
                      className="text-slate-500 text-xs"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {s.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: metrics + ROI */}
          <div className="col-span-7 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                value="$2.84B"
                label="PQC markedsstørrelse innen 2030"
                sublabel="46.2% CAGR · MarketsandMarkets"
                color="rose"
                source="MnM 2025"
              />
              <MetricCard
                value="2035"
                label="NIST-frist: RSA/ECC forbudt"
                sublabel="2030 deadline for høyrisikosystemer"
                color="amber"
                source="NIST IR 8547"
              />
            </div>

            {/* ROI table */}
            <div
              className="rounded-lg overflow-hidden flex-1"
              style={{ border: '1px solid rgba(251,113,133,0.2)' }}
            >
              <div
                className="px-4 py-2.5 border-b"
                style={{
                  background: 'rgba(251,113,133,0.08)',
                  borderColor: 'rgba(251,113,133,0.2)',
                }}
              >
                <span
                  className="text-rose-400 text-xs font-mono tracking-wider uppercase"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Business Case · ROI-estimat
                </span>
              </div>
              <div className="p-1">
                <DataRow label="Implementeringskostnad (estimat)" value="NOK 8–15M" />
                <DataRow label="Beskyttet forvaltningskapital" value="NOK 625 mrd." />
                <DataRow label="Potensielt bot ved DORA-brudd" value="≤ NOK 1.3 mrd." />
                <DataRow label="Unngåtte kostnad per datalekkasje" value="NOK 65M+" />
                <DataRow label="Banker sikret per implementering" value="14" accent="#22D3EE" highlight />
                <DataRow label="Estimert ROI (5-årshorisont)" value=">400%" accent="#34D399" highlight />
              </div>
            </div>

            {/* Key differentiator */}
            <div
              className="rounded-lg p-4"
              style={{
                background: 'rgba(245,158,11,0.05)',
                border: '1px solid rgba(245,158,11,0.2)',
              }}
            >
              <p
                className="text-amber-400 text-xs font-mono mb-1 uppercase tracking-wider"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Rigetti-fordel
              </p>
              <p
                className="text-slate-300 text-sm leading-relaxed"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Rigetti har aktive prosjekter med <strong className="text-slate-100">HSBC</strong>,{' '}
                <strong className="text-slate-100">Standard Chartered</strong> og{' '}
                <strong className="text-slate-100">Nasdaq</strong>. QDaria bringer denne
                kompetansen direkte inn i SpareBank 1-alliansen som eneste norske aktør.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
};
