'use client';

import React from 'react';
import Image from 'next/image';
import { SlideWrapper, SlideTitle } from '../pitch-ui/SB1SlideWrapper';
import { Tag } from '../pitch-ui/MetricCard';
import { SpeakerNotes } from '../pitch-ui/SpeakerNotes';
import { type Scenario } from '@/lib/sb1-chart-data';
import { SPEAKER_NOTES } from '@/lib/sb1-speaker-notes';

interface SlideSpinoffsProps {
  scenario: Scenario;
}

const spinoffs = [
  {
    name: 'Zipminator',
    logo: true,
    status: 'Beta',
    statusColor: '#FB7185',
    seed: '$2M',
    market: '$2.84B PQC',
    marketSource: 'MarketsandMarkets 2030',
    sb1: 'DORA-compliance, krypteringsinfrastruktur for 14 banker',
    color: '#FB7185',
  },
  {
    name: 'QCaaS / QCaaP',
    logo: false,
    status: 'Live',
    statusColor: '#34D399',
    seed: '$3M',
    market: '$72B Quantum Computing',
    marketSource: 'BCG 2035',
    sb1: 'Porteføljeoptimalisering, VaR, Monte Carlo for SB1 Markets',
    color: '#22D3EE',
  },
  {
    name: 'Qm9 (Fintech)',
    logo: false,
    status: 'Utvikling',
    statusColor: '#F59E0B',
    seed: '$1.5M',
    market: '$19B Quantum Finance',
    marketSource: 'Deloitte 2032',
    sb1: 'Derivatprising, risikomodellering, stresstest',
    color: '#F59E0B',
  },
  {
    name: 'QDiana (Edtech)',
    logo: false,
    status: 'Live',
    statusColor: '#34D399',
    seed: '$0.5M',
    market: 'Kompetansemarked',
    marketSource: '',
    sb1: 'Kvantumkompetanse og opplaring for SB1-ansatte',
    color: '#A78BFA',
  },
  {
    name: 'QDaria Smart House',
    logo: false,
    status: 'Planlagt',
    statusColor: '#94A3B8',
    seed: '$2M',
    market: '$8B Smart Home Security',
    marketSource: 'Mordor Intelligence 2030',
    sb1: 'Eiendomsfinansiering, smart bygg-sikkerhet (Geir!)',
    color: '#34D399',
  },
];

export const SlideSpinoffs: React.FC<SlideSpinoffsProps> = () => {
  return (
    <SlideWrapper>
      <div className="flex flex-col h-full px-12 py-10">
        <div className="flex items-center justify-between mb-1">
          <Image src="/logos/QDwordmark2.svg" alt="QDaria" width={120} height={30} className="object-contain" />
          <Tag color="cyan">Holding · 5 Spinoffs · 6 Jurisdiksjoner</Tag>
        </div>

        <SlideTitle
          eyebrow="Produktportefolje & Spinoffs"
          title="Fem selskaper. Ett kvantum-okosystem."
          subtitle="QDaria AS er et holdingselskap med fem spinoffs som dekker hele kvantum-verdikjeden: fra kryptering og beregning til fintech, utdanning og smart hjem. Hver spinoff har eget marked, egen seed-runde og direkte SB1-relevans."
          accentColor="#22D3EE"
        />

        {/* Spinoff table */}
        <div
          className="rounded-lg overflow-hidden flex-1"
          style={{ border: '1px solid rgba(34,211,238,0.3)', boxShadow: '0 0 20px rgba(34,211,238,0.08)' }}
        >
          {/* Header */}
          <div
            className="grid px-4 py-2.5"
            style={{
              gridTemplateColumns: '1fr 80px 70px 140px 1fr',
              background: 'rgba(34,211,238,0.06)',
              borderBottom: '1px solid rgba(34,211,238,0.15)',
            }}
          >
            {['Spinoff', 'Status', 'Seed', 'Marked 2030+', 'SB1-relevans'].map((h) => (
              <span
                key={h}
                className="text-xs font-mono text-cyan-400 tracking-wider uppercase"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {spinoffs.map((s) => (
            <div
              key={s.name}
              className="grid px-4 py-3 items-center border-b"
              style={{
                gridTemplateColumns: '1fr 80px 70px 140px 1fr',
                borderColor: 'rgba(34,211,238,0.08)',
                background: 'rgba(2,8,23,0.3)',
              }}
            >
              {/* Name */}
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: s.color }}
                />
                {s.logo ? (
                  <Image src="/logos/Zipminator_0_light.svg" alt="Zipminator" width={100} height={18} className="object-contain" />
                ) : (
                  <span
                    className="text-sm font-semibold text-slate-100"
                    style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                  >
                    {s.name}
                  </span>
                )}
              </div>

              {/* Status */}
              <span
                className="text-xs font-mono px-2 py-0.5 rounded w-fit"
                style={{
                  color: s.statusColor,
                  background: `${s.statusColor}15`,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {s.status}
              </span>

              {/* Seed */}
              <span
                className="text-sm font-mono text-emerald-400"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {s.seed}
              </span>

              {/* Market */}
              <div className="flex flex-col">
                <span
                  className="text-xs font-mono text-amber-400"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {s.market}
                </span>
                {s.marketSource && (
                  <span
                    className="text-[10px] text-slate-500"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {s.marketSource}
                  </span>
                )}
              </div>

              {/* SB1-relevans */}
              <p
                className="text-xs text-slate-300 leading-snug"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {s.sb1}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom summary strip */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="rounded-lg p-3" style={{ background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.15)' }}>
            <span className="text-cyan-400 text-xs font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Total seed-runde</span>
            <p className="text-2xl font-bold text-cyan-400 font-mono mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>$9M</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <span className="text-amber-400 text-xs font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>TAM (samlet)</span>
            <p className="text-2xl font-bold text-amber-400 font-mono mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>$100B+</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)' }}>
            <span className="text-emerald-400 text-xs font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Live spinoffs</span>
            <p className="text-2xl font-bold text-emerald-400 font-mono mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>2 av 5</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'rgba(251,113,133,0.05)', border: '1px solid rgba(251,113,133,0.15)' }}>
            <span className="text-rose-400 text-xs font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>SB1-overlap</span>
            <p className="text-2xl font-bold text-rose-400 font-mono mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>5/5</p>
          </div>
        </div>
      </div>

      <SpeakerNotes notes={SPEAKER_NOTES[100]} />
    </SlideWrapper>
  );
};
