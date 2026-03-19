'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { SlideWrapper, SlideTitle } from '../pitch-ui/SB1SlideWrapper';
import { MetricCard, Tag } from '../pitch-ui/MetricCard';
import { ScenarioToggle } from '../pitch-ui/ScenarioToggle';
import { SpeakerNotes } from '../pitch-ui/SpeakerNotes';
import {
  fraudLossHistory,
  mlAccuracyMetrics,
  fraudSavings,
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

// Radar data for recharts needs numeric values — normalise mlAccuracyMetrics to 0-100
const radarData = mlAccuracyMetrics.map((d) => ({
  metric: d.metric,
  Klassisk: Math.round(d.klassisk * 100),
  Kvantum: Math.round(d.kvantum * 100),
  fullMark: 100,
}));

interface SlideFraudDetectionProps {
  scenario: Scenario;
}

export const SlideFraudDetection: React.FC<SlideFraudDetectionProps> = ({
  scenario: initialScenario,
}) => {
  const [scenario, setScenario] = useState<Scenario>(initialScenario);

  return (
      <SlideWrapper>
        <div className="flex flex-col h-full px-12 py-10">
          {/* Header row */}
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-xs font-mono text-violet-400 tracking-wider uppercase"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Business Case 04 av 05
            </span>
            <div className="flex items-center gap-3">
              <ScenarioToggle value={scenario} onChange={setScenario} />
              <Tag color="cyan">Quantum ML · Svindeldeteksjon</Tag>
            </div>
          </div>

          <SlideTitle
            eyebrow="Quantum Machine Learning"
            title="Svindeltap NOK 928M i 2023. Quantum ML endrer ligningen."
            subtitle="Finanstilsynet dokumenterte NOK 928M i faktiske svindeltap i 2023 — en økning på 51%. Intesa Sanpaolo sin Quantum ML-løsning overpresterer tradisjonelle metoder. SB1 SMN investerte allerede NOK 40M i NTNU AI Lab. Neste steg er kvantum."
            accentColor="#A78BFA"
          />

          {/* Metric cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <MetricCard
              value="NOK 928M"
              label="Svindeltap norske banker 2023"
              sublabel="+51% fra 2022 · Finanstilsynet"
              color="rose"
              source="Finanstilsynet 2024"
            />
            <MetricCard
              value="0.88–0.98"
              label="F1-score Quantum ML"
              sublabel="Mot svindel i pilot-studier"
              color="cyan"
              source="Nature QI"
            />
            <MetricCard
              value="40%"
              label="Reduksjon falske positiver"
              sublabel="McKinsey quantum fraud estimate"
              color="emerald"
              source="McKinsey"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
            {/* Fraud loss history: two lines */}
            <div
              className="rounded-lg p-4 flex flex-col"
              style={{ background: 'rgba(251,113,133,0.04)', border: '1px solid rgba(251,113,133,0.18)', boxShadow: '0 0 20px rgba(251,113,133,0.08)' }}
            >
              <p
                className="text-rose-400 text-xs font-mono tracking-wider uppercase mb-3"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Svindel tap vs. forhindret (MNOK)
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={fraudLossHistory}
                  margin={{ top: 4, right: 8, bottom: 4, left: -10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="year"
                    tick={{ fill: '#64748B', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
                  />
                  <YAxis
                    tick={{ fill: '#64748B', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
                    tickFormatter={(v: number) => `${v}`}
                  />
                  <Tooltip
                    {...TOOLTIP_STYLE}
                    formatter={(value: number, name: string) => [
                      `NOK ${value}M`,
                      name === 'tap' ? 'Tap' : 'Forhindret',
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="tap"
                    stroke="#FB7185"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#FB7185' }}
                    name="tap"
                  />
                  <Line
                    type="monotone"
                    dataKey="forhindret"
                    stroke="#34D399"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#34D399' }}
                    name="forhindret"
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
                    formatter={(value: string) => value === 'tap' ? 'Tap' : 'Forhindret'}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* ML Accuracy Radar */}
            <div
              className="rounded-lg p-4 flex flex-col"
              style={{ background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.18)', boxShadow: '0 0 20px rgba(167,139,250,0.08)' }}
            >
              <p
                className="text-violet-400 text-xs font-mono tracking-wider uppercase mb-3"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                ML-nøyaktighet: Klassisk vs. Kvantum
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={55}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: '#94A3B8', fontSize: 8, fontFamily: "'JetBrains Mono', monospace" }}
                  />
                  <Radar
                    name="Klassisk"
                    dataKey="Klassisk"
                    stroke="#64748B"
                    fill="#64748B"
                    fillOpacity={0.2}
                    strokeWidth={1.5}
                  />
                  <Radar
                    name="Kvantum"
                    dataKey="Kvantum"
                    stroke="#A78BFA"
                    fill="#A78BFA"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
                  />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => `${v}%`} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Fraud savings scenario: area chart */}
            <div
              className="rounded-lg p-4 flex flex-col"
              style={{ background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.18)', boxShadow: '0 0 20px rgba(52,211,153,0.08)' }}
            >
              <p
                className="text-emerald-400 text-xs font-mono tracking-wider uppercase mb-3"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Svindeltap-prognose — {scenario.charAt(0).toUpperCase() + scenario.slice(1)} (MNOK)
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={fraudSavings[scenario]}
                  margin={{ top: 4, right: 8, bottom: 4, left: -10 }}
                >
                  <defs>
                    <linearGradient id="gradUten" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FB7185" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FB7185" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradMed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34D399" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#34D399" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="year"
                    tick={{ fill: '#64748B', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
                  />
                  <YAxis
                    tick={{ fill: '#64748B', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
                    tickFormatter={(v: number) => `${v}`}
                  />
                  <Tooltip
                    {...TOOLTIP_STYLE}
                    formatter={(value: number, name: string) => [
                      `NOK ${value}M`,
                      name === 'utenKvantum' ? 'Uten kvantum' : 'Med kvantum',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="utenKvantum"
                    stroke="#FB7185"
                    strokeWidth={2}
                    fill="url(#gradUten)"
                    name="utenKvantum"
                  />
                  <Area
                    type="monotone"
                    dataKey="medKvantum"
                    stroke="#34D399"
                    strokeWidth={2}
                    fill="url(#gradMed)"
                    name="medKvantum"
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
                    formatter={(value: string) => value === 'utenKvantum' ? 'Uten kvantum' : 'Med kvantum'}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <SpeakerNotes notes={SPEAKER_NOTES[7]} />
      </SlideWrapper>
  );
};
