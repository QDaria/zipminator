'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { SlideWrapper, SlideTitle } from '../pitch-ui/SB1SlideWrapper';
import { DataRow, Tag } from '../pitch-ui/MetricCard';
import { ScenarioToggle } from '../pitch-ui/ScenarioToggle';
import { SpeakerNotes } from '../pitch-ui/SpeakerNotes';
import { portfolioPerformance, speedupComparisons } from '@/lib/sb1-chart-data';
import { SPEAKER_NOTES } from '@/lib/sb1-speaker-notes';
import type { Scenario } from '@/lib/sb1-chart-data';

interface SlidePortfolioProps {
  scenario: Scenario;
}

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#0F1629',
    border: '1px solid rgba(34,211,238,0.2)',
    borderRadius: 8,
  },
  labelStyle: { color: '#94A3B8' },
  itemStyle: { color: '#F1F5F9' },
};

const useCases = [
  'Multi-asset allokering med kombinatorisk QA (QUBO)',
  'Markowitz mean-variance på 100+ aktiva i real-time',
  'Derivatprising via quantum amplitude estimation',
  'Stress-testing av AUM-scenarier (Basel IV)',
  'ESG-optimalisert porteføljebygging',
];

export const SlidePortfolio: React.FC<SlidePortfolioProps> = ({ scenario: initialScenario }) => {
  const [scenario, setScenario] = useState<Scenario>(initialScenario);
  const perfData = portfolioPerformance[scenario];

  return (
    <SlideWrapper>
      <div className="flex flex-col h-full px-12 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-xs font-mono text-amber-400 tracking-wider uppercase"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Business Case 02 av 05
          </span>
          <div className="flex items-center gap-3">
            <ScenarioToggle value={scenario} onChange={setScenario} />
            <Tag color="amber">QCaaS · ODIN Forvaltning & SB1 Markets</Tag>
          </div>
        </div>

        <SlideTitle
          eyebrow="Kvantum Porteføljeoptimalisering"
          title="1 000x raskere porteføljeoptimalisering for ODIN og SB1 Markets."
          subtitle="JPMorgan løste porteføljeoptimalisering på 0,3 sek. vs. klassisk 5 min. BBVA optimaliserte 52 aktiva blant 10 382 kandidater på sekunder vs. 2 dager. QDaria leverer via QCaaS — uten CAPEX."
          accentColor="#F59E0B"
        />

        <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
          {/* Left column: area chart + use case list */}
          <div className="col-span-7 flex flex-col gap-4">
            {/* Area chart: klassisk vs kvantum performance */}
            <div
              className="rounded-lg overflow-hidden flex-1 flex flex-col"
              style={{ border: '1px solid rgba(245,158,11,0.2)' }}
            >
              <div
                className="px-4 py-2.5 border-b shrink-0"
                style={{
                  background: 'rgba(245,158,11,0.08)',
                  borderColor: 'rgba(245,158,11,0.2)',
                }}
              >
                <span
                  className="text-amber-400 text-xs font-mono tracking-wider uppercase"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Porteføljeytelse 2025–2030 · indeks 100 = baseline · scenario: {scenario}
                </span>
              </div>
              <div className="flex-1 p-3 min-h-0">
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart
                    data={perfData}
                    margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
                  >
                    <defs>
                      <linearGradient id="gradKlassisk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#64748B" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#64748B" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradKvantum" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(34,211,238,0.06)" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="year"
                      tick={{
                        fill: '#64748B',
                        fontSize: 10,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(34,211,238,0.1)' }}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{
                        fill: '#64748B',
                        fontSize: 10,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                      tickLine={false}
                      axisLine={false}
                      width={36}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE.contentStyle}
                      labelStyle={TOOLTIP_STYLE.labelStyle}
                      itemStyle={TOOLTIP_STYLE.itemStyle}
                      formatter={(value: number, name: string) => [
                        `${value}`,
                        name === 'klassisk' ? 'Klassisk forvaltning' : 'Kvantum-optimalisert',
                      ]}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{
                        fontSize: 10,
                        fontFamily: "'JetBrains Mono', monospace",
                        color: '#94A3B8',
                      }}
                      formatter={(value) =>
                        value === 'klassisk' ? 'Klassisk' : 'Kvantum'
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="klassisk"
                      stroke="#64748B"
                      strokeWidth={1.5}
                      fill="url(#gradKlassisk)"
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="kvantum"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      fill="url(#gradKvantum)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Speedup bar chart */}
            <div
              className="rounded-lg overflow-hidden"
              style={{ border: '1px solid rgba(34,211,238,0.12)' }}
            >
              <div
                className="px-4 py-2 border-b"
                style={{
                  background: 'rgba(34,211,238,0.05)',
                  borderColor: 'rgba(34,211,238,0.1)',
                }}
              >
                <span
                  className="text-cyan-400 text-xs font-mono tracking-wider uppercase"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Dokumentert speedup (x kvantum vs. klassisk) · globale banker
                </span>
              </div>
              <div className="p-3">
                <ResponsiveContainer width="100%" height={90}>
                  <BarChart
                    data={speedupComparisons}
                    margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
                    barCategoryGap="30%"
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="rgba(34,211,238,0.06)"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{
                        fill: '#94A3B8',
                        fontSize: 10,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(34,211,238,0.1)' }}
                    />
                    <YAxis
                      tick={{
                        fill: '#64748B',
                        fontSize: 9,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                      tickLine={false}
                      axisLine={false}
                      width={36}
                      tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}K` : String(v))}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE.contentStyle}
                      labelStyle={TOOLTIP_STYLE.labelStyle}
                      itemStyle={TOOLTIP_STYLE.itemStyle}
                      formatter={(value: number) => [`${value}x speedup`, 'Dokumentert']}
                    />
                    <Bar dataKey="speedup" name="Speedup" radius={[3, 3, 0, 0]}>
                      {speedupComparisons.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right column: use cases + commercial params */}
          <div className="col-span-5 flex flex-col gap-4">
            <div
              className="rounded-lg p-4 flex-1"
              style={{
                background: 'rgba(245,158,11,0.05)',
                border: '1px solid rgba(245,158,11,0.2)',
              }}
            >
              <p
                className="text-amber-400 text-xs font-mono tracking-wider uppercase mb-3"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                SB1 Markets / ODIN Use Case
              </p>
              <div className="space-y-2">
                {useCases.map((u, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span
                      className="text-amber-500 text-xs mt-0.5 shrink-0"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      ▸
                    </span>
                    <p
                      className="text-slate-400 text-sm leading-snug"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {u}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-lg overflow-hidden"
              style={{ border: '1px solid rgba(245,158,11,0.15)' }}
            >
              <div
                className="px-4 py-2.5 border-b"
                style={{
                  background: 'rgba(245,158,11,0.08)',
                  borderColor: 'rgba(245,158,11,0.2)',
                }}
              >
                <span
                  className="text-amber-400 text-xs font-mono tracking-wider uppercase"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Kommersielle parametre
                </span>
              </div>
              <div className="p-1">
                <DataRow label="Leveringsmodell" value="QCaaS (SaaS)" accent="#F59E0B" />
                <DataRow label="Hardware-CAPEX SB1" value="NOK 0" accent="#34D399" highlight />
                <DataRow label="Første pilot (estimat)" value="3 mnd." />
                <DataRow
                  label="Estimert AUM-forbedring"
                  value="0.3–1.2% p.a."
                  accent="#F59E0B"
                  highlight
                />
                <DataRow
                  label="ROI (3-årshorisont, 5B AUM)"
                  value="NOK 15–60M"
                  accent="#34D399"
                  highlight
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <SpeakerNotes notes={SPEAKER_NOTES[5]} />
    </SlideWrapper>
  );
};
