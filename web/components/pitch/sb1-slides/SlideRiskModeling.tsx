'use client';

import React from 'react';
import {
  ComposedChart,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { SlideWrapper, SlideTitle } from '../pitch-ui/SB1SlideWrapper';
import { MetricCard, DataRow, Tag } from '../pitch-ui/MetricCard';
import { SpeakerNotes } from '../pitch-ui/SpeakerNotes';
import {
  varConvergence,
  sb1EntityExposure,
  capitalAllocation,
  type Scenario,
} from '@/lib/sb1-chart-data';
import { SPEAKER_NOTES } from '@/lib/sb1-speaker-notes';

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#0F1629',
    border: '1px solid rgba(34,211,238,0.2)',
    borderRadius: 8,
  },
  labelStyle: { color: '#94A3B8' },
  itemStyle: { color: '#F1F5F9' },
};

interface SlideRiskModelingProps {
  scenario: Scenario;
}

export const SlideRiskModeling: React.FC<SlideRiskModelingProps> = ({ scenario: _scenario }) => {
  return (
      <SlideWrapper>
        <div className="flex flex-col h-full px-12 py-10">
          {/* Header row */}
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-xs font-mono text-emerald-400 tracking-wider uppercase"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
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

          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <MetricCard
              value="5.6x"
              label="Raskere enn HPC-klynge"
              sublabel="Kvantum Monte Carlo benchmark"
              color="emerald"
              source="arXiv 2024"
            />
            <MetricCard
              value="Q²"
              label="Kvadratisk speedup"
              sublabel="Amplitude estimation vs. klassisk"
              color="cyan"
            />
          </div>

          {/* Charts grid */}
          <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
            {/* VaR Convergence: ComposedChart with log X-axis */}
            <div
              className="rounded-lg p-4 flex flex-col"
              style={{ background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.18)', boxShadow: '0 0 20px rgba(52,211,153,0.08)' }}
            >
              <p
                className="text-emerald-400 text-xs font-mono tracking-wider uppercase mb-3"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                VaR Konvergensrate (feil %)
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={varConvergence} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="simulations"
                    scale="log"
                    domain={['auto', 'auto']}
                    type="number"
                    tickFormatter={(v: number) => `${v}K`}
                    tick={{ fill: '#64748B', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
                    label={{ value: 'Simuleringer (K)', position: 'insideBottom', offset: -2, fill: '#475569', fontSize: 8 }}
                  />
                  <YAxis
                    tick={{ fill: '#64748B', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    {...TOOLTIP_STYLE}
                    formatter={(value: number, name: string) => [
                      `${value}%`,
                      name === 'klassisk' ? 'Klassisk' : 'Kvantum',
                    ]}
                    labelFormatter={(label: number) => `${label}K simuleringer`}
                  />
                  <Line
                    type="monotone"
                    dataKey="klassisk"
                    stroke="#FB7185"
                    strokeWidth={2}
                    dot={false}
                    name="klassisk"
                  />
                  <Line
                    type="monotone"
                    dataKey="kvantum"
                    stroke="#34D399"
                    strokeWidth={2}
                    dot={false}
                    name="kvantum"
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
                    formatter={(value: string) => value === 'klassisk' ? 'Klassisk' : 'Kvantum'}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* SB1 Entity Exposure: horizontal bar chart */}
            <div
              className="rounded-lg p-4 flex flex-col"
              style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.15)', boxShadow: '0 0 20px rgba(34,211,238,0.08)' }}
            >
              <p
                className="text-cyan-400 text-xs font-mono tracking-wider uppercase mb-3"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                SB1 Utlånsvolum (mrd. NOK)
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={sb1EntityExposure}
                  layout="vertical"
                  margin={{ top: 4, right: 12, bottom: 4, left: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: '#64748B', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
                    tickFormatter={(v: number) => `${v}`}
                  />
                  <YAxis
                    dataKey="entity"
                    type="category"
                    width={58}
                    tick={{ fill: '#94A3B8', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
                  />
                  <Tooltip
                    {...TOOLTIP_STYLE}
                    formatter={(value: number) => [`NOK ${value} mrd.`, 'Utlån']}
                  />
                  <Bar dataKey="utlaan" radius={[0, 3, 3, 0]}>
                    {sb1EntityExposure.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Capital Allocation: donut PieChart */}
            <div
              className="rounded-lg p-4 flex flex-col"
              style={{ background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.15)', boxShadow: '0 0 20px rgba(167,139,250,0.08)' }}
            >
              <p
                className="text-violet-400 text-xs font-mono tracking-wider uppercase mb-3"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Kapitalallokering (%)
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={capitalAllocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={58}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {capitalAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Pie>
                  <Tooltip
                    {...TOOLTIP_STYLE}
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: '#94A3B8' }}
                    iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom content: technical use cases + regulatory driver */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div
              className="rounded-lg p-4"
              style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.18)', boxShadow: '0 0 20px rgba(52,211,153,0.08)' }}
            >
              <p
                className="text-emerald-400 text-xs font-mono tracking-wider uppercase mb-2"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Teknisk use case
              </p>
              <div className="space-y-1.5">
                {[
                  { label: 'VaR (Value-at-Risk)', desc: 'Intradag-beregning i stedet for nattbatch' },
                  { label: 'Stressed VaR', desc: 'FRTB IMA-krav oppfylt med quantum MC-presisjon' },
                  { label: 'Kredittrisiko (CVA/DVA)', desc: 'Simulering av 10 000+ scenarier i real-time' },
                  { label: 'ILAAP / ICAAP stress-tester', desc: 'Finanstilsynet-rapportering med høyere presisjon' },
                ].map((u) => (
                  <div key={u.label} className="flex flex-col">
                    <span
                      className="text-emerald-400 text-xs font-mono"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {u.label}
                    </span>
                    <p
                      className="text-slate-400 text-sm leading-snug"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {u.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-lg overflow-hidden"
              style={{ border: '1px solid rgba(245,158,11,0.15)', boxShadow: '0 0 20px rgba(245,158,11,0.08)' }}
            >
              <div
                className="px-4 py-2.5 border-b"
                style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.15)' }}
              >
                <span
                  className="text-amber-400 text-xs font-mono tracking-wider uppercase"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  SB1 eksponeringer + regulatorisk driver
                </span>
              </div>
              <div className="p-1">
                <DataRow label="SMN utlånsvolum" value="NOK 249 mrd." accent="#34D399" highlight />
                <DataRow label="SR-Bank (Sør-Norge) utlån" value="NOK 220+ mrd." />
                <DataRow label="Alliance total forvaltning" value="NOK 625 mrd." accent="#34D399" highlight />
                <DataRow label="NOK-verdi kapitaleffekt" value="625M–3.1B" accent="#34D399" highlight />
              </div>
              <div className="px-4 py-2">
                <p
                  className="text-slate-400 text-sm leading-relaxed"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Basel IV (CRR3) krever mer granulære risikomodeller fra 2025. Quantum MC gir SpareBank 1 en strukturell presisjonsmarginal over konkurrentene.
                </p>
              </div>
            </div>
          </div>
        </div>

        <SpeakerNotes notes={SPEAKER_NOTES[6]} />
      </SlideWrapper>
  );
};
