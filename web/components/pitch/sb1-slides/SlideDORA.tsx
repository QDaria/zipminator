'use client';

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { SlideWrapper, SlideTitle } from '../pitch-ui/SB1SlideWrapper';
import { MetricCard, Tag } from '../pitch-ui/MetricCard';
import { ScenarioToggle } from '../pitch-ui/ScenarioToggle';
import { SpeakerNotes } from '../pitch-ui/SpeakerNotes';
import { SPEAKER_NOTES } from '@/lib/sb1-speaker-notes';
import {
  regulatoryTimeline,
  doraFineScenarios,
  type Scenario,
} from '@/lib/sb1-chart-data';

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#0F1629',
    border: '1px solid rgba(34,211,238,0.2)',
    borderRadius: 8,
  },
  labelStyle: { color: '#94A3B8' },
  itemStyle: { color: '#F1F5F9' },
};

// Category colors for timeline bar
const CATEGORY_COLORS: Record<string, string> = {
  dora: '#F59E0B',
  nist: '#22D3EE',
  cnsa: '#A78BFA',
  eu:   '#34D399',
  uk:   '#94A3B8',
};

const CATEGORY_LABELS: Record<string, string> = {
  dora: 'DORA',
  nist: 'NIST',
  cnsa: 'CNSA',
  eu:   'EU',
  uk:   'UK',
};

const articles = [
  {
    article: 'Art. 6.1',
    title: 'Krypteringspolicy',
    text: 'Finansinstitusjoner må dokumentere kryptografiske kontrolltiltak for data i hvile, transit og bruk',
    tag: 'Påkrevd nå',
    tagColor: 'rose' as const,
  },
  {
    article: 'Art. 6.4',
    title: 'Kvanterobusthet',
    text: 'Kryptografi skal oppdateres periodisk basert på utvikling innen kryptoanalyse — inkl. kvanteangrep',
    tag: 'Kvantekrav',
    tagColor: 'amber' as const,
  },
  {
    article: 'Art. 7',
    title: 'Nøkkelhåndtering',
    text: 'Full livssyklusstyring av kryptografiske nøkler, inkludert rotasjon og sikker destruksjon',
    tag: 'Operasjonelt',
    tagColor: 'cyan' as const,
  },
];

// Parse date string "YYYY-MM" to a sortable number for positioning
function dateToX(dateStr: string): number {
  const [year, month] = dateStr.split('-').map(Number);
  return year + (month - 1) / 12;
}

interface SlideDORAProps {
  scenario: Scenario;
}

export const SlideDORA: React.FC<SlideDORAProps> = ({ scenario: initialScenario }) => {
  const [fineScenario, setFineScenario] = useState<Scenario>(initialScenario);
  const fineData = doraFineScenarios[fineScenario];

  // Build timeline data for horizontal bar visualization
  const timelineItems = regulatoryTimeline.slice();
  const minX = dateToX('2022-12');
  const maxX = dateToX('2036-01');
  const range = maxX - minX;

  return (
    <SlideWrapper>
      <div className="flex flex-col h-full px-12 py-10">
        <SlideTitle
          eyebrow="Regulatorisk ramme · DORA"
          title="Compliance er ikke valgfritt lenger."
          subtitle="DORA trådte i kraft som norsk lov 1. juli 2025. Finanstilsynet er tilsynsmyndighet. Bøtene kan utgjøre inntil 2% av global omsetning."
          accentColor="#F59E0B"
        />

        {/* Horizontal regulatory timeline */}
        <div
          className="rounded-lg p-4 mb-5"
          style={{
            background: 'rgba(245,158,11,0.04)',
            border: '1px solid rgba(245,158,11,0.3)',
            boxShadow: '0 0 16px rgba(245,158,11,0.1)',
          }}
        >
          <p
            className="text-amber-400 text-xs font-mono tracking-wider uppercase mb-3"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Regulatorisk tidslinje 2023–2035
          </p>

          {/* Category legend */}
          <div className="flex gap-4 mb-3 flex-wrap">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: CATEGORY_COLORS[key] }}
                />
                <span
                  className="text-xs font-mono"
                  style={{ color: '#94A3B8', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Timeline bar */}
          <div className="relative" style={{ height: 64 }}>
            {/* Axis line */}
            <div
              className="absolute left-0 right-0"
              style={{ top: 28, height: 1, background: 'rgba(100,116,139,0.3)' }}
            />

            {/* Year labels */}
            {[2023, 2025, 2027, 2030, 2032, 2035].map((year) => {
              const pct = ((year - minX) / range) * 100;
              if (pct < 0 || pct > 100) return null;
              return (
                <div
                  key={year}
                  className="absolute"
                  style={{ left: `${pct}%`, top: 36, transform: 'translateX(-50%)' }}
                >
                  <span
                    className="text-xs font-mono"
                    style={{ color: '#94A3B8', fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {year}
                  </span>
                </div>
              );
            })}

            {/* Event markers */}
            {timelineItems.map((item, i) => {
              const x = dateToX(item.date);
              const pct = ((x - minX) / range) * 100;
              if (pct < 0 || pct > 102) return null;
              const color = CATEGORY_COLORS[item.category];
              const isTop = i % 2 === 0;

              return (
                <div
                  key={i}
                  className="absolute flex flex-col items-center"
                  style={{
                    left: `${Math.min(pct, 98)}%`,
                    top: isTop ? 0 : 16,
                    transform: 'translateX(-50%)',
                  }}
                >
                  {/* Label above/at */}
                  <div
                    className="text-xs font-mono whitespace-nowrap mb-0.5 px-1 rounded"
                    style={{
                      color: item.highlight ? '#F59E0B' : item.danger ? '#FB7185' : color,
                      fontFamily: "'JetBrains Mono', monospace",
                      maxWidth: 80,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      background: item.highlight
                        ? 'rgba(245,158,11,0.12)'
                        : item.danger
                        ? 'rgba(251,113,133,0.1)'
                        : 'transparent',
                    }}
                  >
                    {item.date.split('-')[0]}
                  </div>
                  {/* Dot */}
                  <div
                    className="rounded-full"
                    style={{
                      width: item.highlight || item.danger ? 10 : 7,
                      height: item.highlight || item.danger ? 10 : 7,
                      background: item.danger ? '#FB7185' : item.highlight ? '#F59E0B' : color,
                      boxShadow: item.highlight
                        ? '0 0 8px rgba(245,158,11,0.7)'
                        : item.danger
                        ? '0 0 6px rgba(251,113,133,0.6)'
                        : 'none',
                      opacity: item.done ? 1 : 0.6,
                    }}
                  />
                  {/* Tick line to axis */}
                  <div
                    style={{
                      width: 1,
                      height: isTop ? 6 : 4,
                      background: color,
                      opacity: 0.4,
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* First few milestone labels below */}
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
            {timelineItems.filter((e) => e.done || e.highlight).slice(0, 5).map((item, i) => (
              <span
                key={i}
                className="text-xs font-mono"
                style={{
                  color: item.highlight ? '#F59E0B' : CATEGORY_COLORS[item.category],
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {item.date} · {item.label}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-5 flex-1 min-h-0">
          {/* Left: DORA articles */}
          <div className="col-span-7 flex flex-col gap-3">
            {articles.map((a) => (
              <div
                key={a.article}
                className="rounded-lg p-4"
                style={{
                  background: 'rgba(245,158,11,0.04)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  boxShadow: '0 0 16px rgba(245,158,11,0.1)',
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-mono text-amber-500"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {a.article}
                    </span>
                    <span
                      className="text-slate-200 text-sm font-semibold"
                      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                    >
                      {a.title}
                    </span>
                  </div>
                  <Tag color={a.tagColor}>{a.tag}</Tag>
                </div>
                <p
                  className="text-slate-400 text-sm leading-relaxed"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {a.text}
                </p>
              </div>
            ))}
          </div>

          {/* Right: Penalty fine scenarios + opportunity */}
          <div className="col-span-5 flex flex-col gap-3">
            {/* Scenario toggle + fine bar chart */}
            <div
              className="rounded-lg p-4 flex flex-col"
              style={{
                background: 'rgba(251,113,133,0.04)',
                border: '1px solid rgba(251,113,133,0.15)',
                boxShadow: '0 0 16px rgba(251,113,133,0.1)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-rose-400 text-xs font-mono tracking-wider uppercase"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  DORA-bøter per enhet
                </span>
                <ScenarioToggle value={fineScenario} onChange={setFineScenario} />
              </div>

              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={fineData}
                  margin={{ top: 0, right: 4, left: -16, bottom: 0 }}
                  barCategoryGap="30%"
                >
                  <XAxis
                    dataKey="entity"
                    tick={{
                      fill: '#94A3B8',
                      fontSize: 11,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fill: '#64748B',
                      fontSize: 11,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${v}M`}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={(value: number) => [`NOK ${value} MNOK`, 'Maks bot']}
                    cursor={{ fill: 'rgba(251,113,133,0.05)' }}
                  />
                  <Bar dataKey="fineMax" radius={[3, 3, 0, 0]}>
                    {fineData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          index === fineData.length - 1
                            ? '#FB7185'
                            : index === 0
                            ? '#F59E0B'
                            : '#A78BFA'
                        }
                        opacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Penalty metric */}
            <MetricCard
              value="2%"
              label="Maks bot av global omsetning"
              sublabel="Per DORA — eller €1M for enkeltpersoner"
              color="rose"
              source="DORA Art. 50"
            />

            {/* SB1 advantage */}
            <div
              className="rounded-lg p-4 flex flex-col justify-between flex-1"
              style={{
                background: 'rgba(34,211,238,0.05)',
                border: '1px solid rgba(34,211,238,0.2)',
                boxShadow: '0 0 16px rgba(34,211,238,0.1)',
              }}
            >
              <span
                className="text-cyan-400 text-xs font-mono tracking-wider uppercase"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                SpareBank 1 Fordel
              </span>
              <p
                className="text-slate-300 text-sm leading-relaxed mt-2"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Én implementering via{' '}
                <strong className="text-slate-100">SB1 Utvikling</strong> dekker alle{' '}
                <strong className="text-cyan-400">14 banker</strong> i alliansen. Laveste
                kostnad-per-bank i sektoren.
              </p>
              <p
                className="text-amber-400/70 text-xs mt-2 leading-relaxed italic"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                &ldquo;Transitioning to PQC requires more extensive preparation than Y2K
                remediation.&rdquo;
                <span
                  className="text-slate-400 not-italic ml-1 font-mono text-xs"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  — Gartner 2025
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <SpeakerNotes notes={SPEAKER_NOTES[2]} />
    </SlideWrapper>
  );
};
