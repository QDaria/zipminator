'use client';

import React from 'react';
import { SlideWrapper, SlideTitle } from '../pitch-ui/SB1SlideWrapper';
import { MetricCard } from '../pitch-ui/MetricCard';

export const SlideGlobalBanks: React.FC = () => {
  const banks = [
    {
      bank: 'JPMorgan Chase',
      region: 'USA',
      highlight: '71 313 bits kvantum-entropi sertifisert i Nature (2025) · 1 000x speedup i porteføljeopt.',
      tag: 'Ledende',
      tagColor: '#22D3EE',
    },
    {
      bank: 'HSBC',
      region: 'UK',
      highlight: '+34% treffsikkerhet i obligasjonshandel med IBM Quantum Heron (sept. 2025) · PQC VPN-tunneler deployert',
      tag: 'Produksjon',
      tagColor: '#34D399',
    },
    {
      bank: 'BBVA',
      region: 'Spania',
      highlight: '52-asset portefølje optimalisert på sekunder vs. 2 dager klassisk (Multiverse Computing)',
      tag: 'Pilot',
      tagColor: '#F59E0B',
    },
    {
      bank: 'Danske Bank',
      region: 'Norden',
      highlight: 'Første kvantesikre datatransfer i Norden (2022) · DKK 22.5M CryptQ-prosjekt med DTU',
      tag: 'Nordisk #1',
      tagColor: '#FB7185',
    },
    {
      bank: 'Goldman Sachs',
      region: 'USA',
      highlight: 'Estimerer 1 000x teoretisk speedup for derivatprising via amplitude estimation',
      tag: 'Research',
      tagColor: '#A78BFA',
    },
    {
      bank: 'SpareBank 1',
      region: 'Norge',
      highlight: 'Ingen bekreftet kvantum-initiativ per mars 2026 — first-mover mulighet åpen',
      tag: 'Åpent vindu',
      tagColor: '#F59E0B',
      isTarget: true,
    },
  ];

  return (
    <SlideWrapper>
      <div className="flex flex-col h-full px-10 py-8">
        <SlideTitle
          eyebrow="Konkurransebilde · Global banksektor"
          title="80% av verdens 50 største banker er i gang."
          subtitle="Kvantum er ikke lenger et forskningsprosjekt — det er en produktiv investering. SpareBank 1 er ennå ikke på kartet. Det er et vindu."
          accentColor="#22D3EE"
        />

        <div className="grid grid-cols-2 gap-3 flex-1">
          {banks.map((b) => (
            <div
              key={b.bank}
              className="rounded-lg p-4 flex flex-col gap-2 relative overflow-hidden"
              style={{
                background: b.isTarget
                  ? 'rgba(245,158,11,0.06)'
                  : 'rgba(15,22,41,0.8)',
                border: b.isTarget
                  ? '1px solid rgba(245,158,11,0.4)'
                  : '1px solid rgba(34,211,238,0.1)',
              }}
            >
              {b.isTarget && (
                <div
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ background: 'linear-gradient(90deg, transparent, #F59E0B, transparent)' }}
                />
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="text-slate-200 text-sm font-semibold"
                    style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                  >
                    {b.bank}
                  </span>
                  <span
                    className="text-slate-600 text-xs font-mono"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {b.region}
                  </span>
                </div>
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded"
                  style={{
                    color: b.tagColor,
                    background: `${b.tagColor}15`,
                    border: `1px solid ${b.tagColor}40`,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {b.tag}
                </span>
              </div>
              <p
                className="text-xs leading-relaxed"
                style={{
                  color: b.isTarget ? '#D97706' : '#64748B',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {b.highlight}
              </p>
            </div>
          ))}
        </div>

        <div
          className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t"
          style={{ borderColor: 'rgba(34,211,238,0.1)' }}
        >
          <MetricCard value="80%" label="Av top-50 banker investerer" color="cyan" size="sm" source="Evident 2024" />
          <MetricCard value="10%" label="Vekst i kvantum-ansettelser" sublabel="Siden aug. 2024" color="emerald" size="sm" />
          <MetricCard value="15" label="Banker nevner kvantum i årsrapport" color="slate" size="sm" />
          <MetricCard value="0" label="Norske banker med bekreftet program" color="rose" size="sm" />
        </div>
      </div>
    </SlideWrapper>
  );
};
