'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { SlideWrapper, SlideTitle } from '../pitch-ui/SB1SlideWrapper';
import { ScenarioToggle } from '../pitch-ui/ScenarioToggle';
import { SpeakerNotes } from '../pitch-ui/SpeakerNotes';
import {
  marketProjections,
  defensiveVsOffensive,
  cagrComparison,
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

interface SlideMarketSizeProps {
  scenario: Scenario;
}

export const SlideMarketSize: React.FC<SlideMarketSizeProps> = ({ scenario: scenarioProp }) => {
  const [scenario, setScenario] = useState<Scenario>(scenarioProp);
  const projData = marketProjections[scenario];

  return (
    <SlideWrapper>
      <div className="flex flex-col h-full px-12 py-10">
        <div className="flex items-start justify-between mb-1">
          <SlideTitle
            eyebrow="Markedsstørrelse · Investmentcase"
            title="$450 milliarder i vei. Norge mangler sin aktør."
            subtitle="Quantum computing og PQC vokser i finanssektoren med 40–72% CAGR. BCG anslår opptil $850B i verdiskapning innen 2040; McKinsey estimerer $97B totalmarked innen 2035, der QC alene er $72B. QDaria er Norges eneste selskap posisjonert til å levere dette til nordisk finanssektor."
            accentColor="#22D3EE"
          />
          <div className="pt-1 shrink-0">
            <ScenarioToggle value={scenario} onChange={setScenario} />
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-3 gap-4 mb-4" style={{ height: 240 }}>
          {/* Stacked area chart */}
          <div
            className="col-span-2 rounded-lg p-3 flex flex-col"
            style={{ background: 'rgba(34,211,238,0.03)', border: '1px solid rgba(34,211,238,0.3)', boxShadow: '0 0 20px rgba(34,211,238,0.08)' }}
          >
            <p
              className="text-xs font-mono tracking-widest uppercase mb-2 opacity-90"
              style={{ color: '#22D3EE', fontFamily: "'JetBrains Mono', monospace" }}
            >
              PQC + QCaaS markedsstørrelse — {scenario} ($B)
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={projData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradPqc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FB7185" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FB7185" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradQcaas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,211,238,0.07)" />
                <XAxis
                  dataKey="year"
                  tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${v}B`}
                />
                <Tooltip
                  {...TOOLTIP_STYLE}
                  formatter={(value: number, name: string) => [`$${value}B`, name === 'pqc' ? 'PQC' : 'QCaaS']}
                />
                <Area
                  type="monotone"
                  dataKey="pqc"
                  stackId="1"
                  stroke="#FB7185"
                  strokeWidth={1.5}
                  fill="url(#gradPqc)"
                  name="pqc"
                />
                <Area
                  type="monotone"
                  dataKey="qcaas"
                  stackId="1"
                  stroke="#22D3EE"
                  strokeWidth={1.5}
                  fill="url(#gradQcaas)"
                  name="qcaas"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Donut chart */}
          <div
            className="rounded-lg p-3 flex flex-col"
            style={{ background: 'rgba(251,113,133,0.03)', border: '1px solid rgba(251,113,133,0.15)', boxShadow: '0 0 20px rgba(251,113,133,0.08)' }}
          >
            <p
              className="text-xs font-mono tracking-widest uppercase mb-1 opacity-90"
              style={{ color: '#FB7185', fontFamily: "'JetBrains Mono', monospace" }}
            >
              Defensiv vs. offensiv 2032 (MNOK)
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={defensiveVsOffensive}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={58}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {defensiveVsOffensive.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} opacity={0.85} />
                  ))}
                </Pie>
                <Tooltip
                  {...TOOLTIP_STYLE}
                  formatter={(value: number) => [`$${(value / 1000).toFixed(1)}B`, '']}
                />
                <Legend
                  iconType="circle"
                  iconSize={7}
                  wrapperStyle={{
                    fontSize: 11,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#94A3B8',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CAGR horizontal bar + Nordic table */}
        <div className="grid grid-cols-2 gap-4 flex-1">
          {/* CAGR comparison */}
          <div
            className="rounded-lg p-3 flex flex-col"
            style={{ background: 'rgba(245,158,11,0.03)', border: '1px solid rgba(245,158,11,0.3)', boxShadow: '0 0 20px rgba(245,158,11,0.08)' }}
          >
            <p
              className="text-xs font-mono tracking-widest uppercase mb-2 opacity-90"
              style={{ color: '#F59E0B', fontFamily: "'JetBrains Mono', monospace" }}
            >
              CAGR-sammenligning etter segment
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                layout="vertical"
                data={cagrComparison}
                margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,158,11,0.07)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                  domain={[0, 80]}
                />
                <YAxis
                  type="category"
                  dataKey="segment"
                  width={90}
                  tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  {...TOOLTIP_STYLE}
                  formatter={(value: number) => [`${value}% CAGR`, 'CAGR']}
                />
                <Bar dataKey="cagr" radius={[0, 4, 4, 0]}>
                  {cagrComparison.map((entry, index) => (
                    <Cell key={`cagr-${index}`} fill={entry.color} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Nordic first-mover table */}
          <div
            className="rounded-lg p-4 flex flex-col"
            style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.2)', boxShadow: '0 0 20px rgba(245,158,11,0.08)' }}
          >
            <p
              className="text-xs font-mono tracking-widest uppercase mb-3 opacity-90"
              style={{ color: '#F59E0B', fontFamily: "'JetBrains Mono', monospace" }}
            >
              Nordisk first-mover landscape
            </p>
            <p
              className="text-amber-400/60 text-[10px] font-mono mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Kvantum-investeringer: $2.0 mrd. i 2024 (+50% YoY) — McKinsey 2025
            </p>
            <div className="space-y-2 flex-1">
              {[
                { bank: 'Danske Bank', country: 'DK', status: 'QKD pilot 2022 · CryptQ prosjekt', done: true },
                { bank: 'Nordea / SEB / Swedbank', country: 'SE/FI', status: 'Utforsker PQC og risikomodellering', done: false },
                { bank: 'DNB', country: 'NO', status: 'Ingen bekreftet quantum-program', done: false },
                { bank: 'SpareBank 1', country: 'NO', status: '← Åpent vindu · First-mover mulighet', done: false, highlight: true },
              ].map((row) => (
                <div
                  key={row.bank}
                  className="flex items-center justify-between py-1.5 px-3 rounded"
                  style={{
                    background: row.highlight ? 'rgba(245,158,11,0.1)' : 'transparent',
                    border: row.highlight ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-mono"
                      style={{ color: '#94A3B8', fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {row.country}
                    </span>
                    <span
                      className="text-slate-300 text-xs"
                      style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: row.highlight ? 600 : 400 }}
                    >
                      {row.bank}
                    </span>
                  </div>
                  <span
                    className="text-xs"
                    style={{
                      color: row.done ? '#34D399' : row.highlight ? '#F59E0B' : '#64748B',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <SpeakerNotes notes={SPEAKER_NOTES[9]} />
    </SlideWrapper>
  );
};
