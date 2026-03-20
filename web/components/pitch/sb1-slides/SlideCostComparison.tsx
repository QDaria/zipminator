'use client';

import React from 'react';
import { SlideWrapper, SlideTitle } from '../pitch-ui/SB1SlideWrapper';
import { Tag } from '../pitch-ui/MetricCard';
import { SpeakerNotes } from '../pitch-ui/SpeakerNotes';
import { type Scenario } from '@/lib/sb1-chart-data';
import { SPEAKER_NOTES } from '@/lib/sb1-speaker-notes';

interface SlideCostComparisonProps {
  scenario: Scenario;
}

const options = [
  {
    title: 'Med QDaria',
    subtitle: 'Partnerskap & SaaS',
    color: '#34D399',
    icon: '◈',
    rows: [
      { label: 'Implementeringskostnad', value: 'NOK 8–15M' },
      { label: 'Tidsramme', value: '12–24 mnd.' },
      { label: 'Dekker antall banker', value: '14 (hele alliansen)' },
      { label: 'Kostnad per bank', value: 'NOK 570K–1.1M' },
      { label: 'DORA-compliance', value: 'Inkludert' },
      { label: 'Kvantumeksperter krevet', value: '0 (QDaria leverer)' },
      { label: 'Hardware CAPEX', value: 'NOK 0 (SaaS)' },
      { label: 'Tid til pilot', value: '3 mnd.' },
    ],
    verdict: 'Lavest risiko, raskest i produksjon',
  },
  {
    title: 'Egenutviklet',
    subtitle: 'Intern utvikling',
    color: '#F59E0B',
    icon: '◐',
    rows: [
      { label: 'Estimert kostnad', value: 'NOK 80–150M' },
      { label: 'Tidsramme', value: '3–5 ar' },
      { label: 'Kvantumspesialister', value: '10+ (finnes ikke i Norge)' },
      { label: 'Rekrutteringsrisiko', value: 'Ekstremt hoy' },
      { label: 'NIST PQC-kompetanse', value: 'Ma bygges fra null' },
      { label: 'Rigetti-hardware', value: 'Ingen tilgang' },
      { label: 'DORA-frist', value: 'Allerede gjeldende' },
      { label: 'Sannsynlighet for suksess', value: 'Lav' },
    ],
    verdict: 'Hoyst risiko, lang leveransetid',
  },
  {
    title: 'Gjor ingenting',
    subtitle: 'Status quo',
    color: '#FB7185',
    icon: '✗',
    rows: [
      { label: 'DORA-bøter (2% omsetning)', value: 'NOK 600M–1.3B' },
      { label: 'Datatap (snitt finans)', value: '$6.08M per hendelse' },
      { label: 'HNDL-eksponering', value: '100% av kryptert data' },
      { label: 'Konkurranseposisjon', value: 'Sakker etter' },
      { label: 'Regulatorisk status', value: 'Non-compliant' },
      { label: 'Q-Day tidsvindu', value: '~8 ar (median)' },
      { label: 'Omdømmerisiko', value: 'Ekstrem ved datalekkasje' },
      { label: 'Reell kostnad', value: 'Ukalkulerbar' },
    ],
    verdict: 'Dyrest. Uakseptabelt for 14 banker.',
  },
];

export const SlideCostComparison: React.FC<SlideCostComparisonProps> = () => {
  return (
    <SlideWrapper>
      <div className="flex flex-col h-full px-12 py-10">
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-xs font-mono text-amber-400 tracking-wider uppercase"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Kostnadsbilde
          </span>
          <Tag color="amber">Beslutningsgrunnlag · Tre scenarier</Tag>
        </div>

        <SlideTitle
          eyebrow="Hva koster det a IKKE handle?"
          title="Tre veier. Bare en gir mening."
          subtitle="Sammenligning av kostnad, risiko og tidsramme for kvantum-beredskap. DORA er allerede gjeldende norsk lov. Migreringsvinduet lukker seg."
          accentColor="#F59E0B"
        />

        {/* Three columns */}
        <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
          {options.map((opt) => (
            <div
              key={opt.title}
              className="rounded-xl flex flex-col overflow-hidden"
              style={{
                border: `1.5px solid ${opt.color}40`,
                boxShadow: `0 0 24px ${opt.color}12`,
                background: `linear-gradient(180deg, ${opt.color}08 0%, rgba(2,8,23,0.4) 100%)`,
              }}
            >
              {/* Column header */}
              <div
                className="px-4 py-3 border-b"
                style={{ borderColor: `${opt.color}20` }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg" style={{ color: opt.color }}>{opt.icon}</span>
                  <span
                    className="text-base font-semibold"
                    style={{ color: opt.color, fontFamily: "'Fraunces', Georgia, serif" }}
                  >
                    {opt.title}
                  </span>
                </div>
                <p
                  className="text-xs text-slate-400"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {opt.subtitle}
                </p>
              </div>

              {/* Rows */}
              <div className="flex-1 p-2 space-y-0">
                {opt.rows.map((row) => (
                  <div
                    key={row.label}
                    className="flex flex-col py-2 px-2 border-b"
                    style={{ borderColor: `${opt.color}10` }}
                  >
                    <span
                      className="text-[10px] text-slate-500 uppercase tracking-wider"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {row.label}
                    </span>
                    <span
                      className="text-sm font-mono font-medium"
                      style={{ color: opt.color, fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Verdict */}
              <div
                className="px-4 py-3 mt-auto"
                style={{ background: `${opt.color}10`, borderTop: `1px solid ${opt.color}20` }}
              >
                <p
                  className="text-xs font-semibold"
                  style={{ color: opt.color, fontFamily: "'DM Sans', sans-serif" }}
                >
                  {opt.verdict}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <SpeakerNotes notes={SPEAKER_NOTES[102]} />
    </SlideWrapper>
  );
};
