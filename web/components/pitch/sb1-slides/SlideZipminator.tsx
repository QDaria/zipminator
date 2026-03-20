'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
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
import { MetricCard, DataRow, Tag } from '../pitch-ui/MetricCard';
import { ScenarioToggle } from '../pitch-ui/ScenarioToggle';
import { SpeakerNotes } from '../pitch-ui/SpeakerNotes';
import { ziminatorRoi } from '@/lib/sb1-chart-data';
import { SPEAKER_NOTES } from '@/lib/sb1-speaker-notes';
import type { Scenario } from '@/lib/sb1-chart-data';

interface SlideZiminatorProps {
  scenario: Scenario;
}

const phases = [
  {
    phase: 'Fase 1',
    label: 'Kryptografisk inventar og risikovurdering',
    duration: '2–4 mnd.',
    icon: '◈',
  },
  {
    phase: 'Fase 2',
    label: 'Hybrid PQC-overgang (klassisk + NIST PQC parallelt)',
    duration: '6–12 mnd.',
    icon: '◐',
  },
  {
    phase: 'Fase 3',
    label: 'Full NIST-standardisert PQC-infrastruktur',
    duration: '12–24 mnd.',
    icon: '●',
  },
];

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#0F1629',
    border: '1px solid rgba(34,211,238,0.2)',
    borderRadius: 8,
  },
  labelStyle: { color: '#94A3B8' },
  itemStyle: { color: '#F1F5F9' },
};

export const SlideZipminator: React.FC<SlideZiminatorProps> = ({ scenario: initialScenario }) => {
  const [scenario, setScenario] = useState<Scenario>(initialScenario);
  const roiData = ziminatorRoi[scenario];

  return (
    <SlideWrapper>
      <div className="flex flex-col h-full px-12 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-xs font-mono text-rose-400 tracking-wider uppercase"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Business Case 01 av 05
          </span>
          <div className="flex items-center gap-3">
            <ScenarioToggle value={scenario} onChange={setScenario} />
            <Tag color="rose">DORA-Compliance · Zipminator</Tag>
          </div>
        </div>

        <Image src="/logos/Zipminator_0_light.svg" alt="Zipminator" width={200} height={33} className="object-contain mb-2" />

        <SlideTitle
          eyebrow="Post-Kvantum Kryptografi"
          title="Kvantesikker infrastruktur for hele alliansen."
          subtitle="SB1 Utvikling sin sentraliserte Azure-plattform er én arkitektur for 14 banker. Én Zipminator-implementering beskytter alle 14 — til én brøkdel av individuelle kostnader."
          accentColor="#FB7185"
        />

        <div className="grid grid-cols-12 gap-5 flex-1 min-h-0">
          {/* Left: phases + NIST */}
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
                className="rounded-lg p-3 flex gap-3 items-start"
                style={{
                  background: `rgba(251,113,133,${0.04 + i * 0.02})`,
                  border: '1px solid rgba(251,113,133,0.15)',
                  boxShadow: '0 0 16px rgba(251,113,133,0.1)',
                }}
              >
                <div
                  className="text-rose-400 text-lg shrink-0 mt-0.5"
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
                      className="text-slate-400 text-xs font-mono"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {p.duration}
                    </span>
                  </div>
                  <p
                    className="text-slate-300 text-sm leading-snug"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {p.label}
                  </p>
                </div>
              </div>
            ))}

            {/* NIST standards */}
            <div
              className="rounded-lg p-3 mt-auto"
              style={{
                background: 'rgba(34,211,238,0.04)',
                border: '1px solid rgba(34,211,238,0.15)',
                boxShadow: '0 0 16px rgba(34,211,238,0.1)',
              }}
            >
              <p
                className="text-cyan-400 text-xs font-mono tracking-wider uppercase mb-2"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                NIST-standardisert aug. 2024
              </p>
              <div className="space-y-1.5">
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
                      className="text-slate-400 text-xs"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {s.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: metrics + ROI bar chart */}
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

            {/* Horizontal bar chart: kostnad vs besparelse per kategori */}
            <div
              className="rounded-lg overflow-hidden flex-1 flex flex-col"
              style={{ border: '1px solid rgba(251,113,133,0.2)', boxShadow: '0 0 16px rgba(251,113,133,0.1)' }}
            >
              <div
                className="px-4 py-2.5 border-b shrink-0"
                style={{
                  background: 'rgba(251,113,133,0.08)',
                  borderColor: 'rgba(251,113,133,0.2)',
                }}
              >
                <span
                  className="text-rose-400 text-xs font-mono tracking-wider uppercase"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Business Case · ROI-estimat (MNOK) · Scenario: {scenario}
                </span>
              </div>
              <div className="flex-1 p-3 min-h-0">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={roiData}
                    layout="vertical"
                    margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
                    barCategoryGap="25%"
                  >
                    <CartesianGrid
                      horizontal={false}
                      stroke="rgba(34,211,238,0.08)"
                    />
                    <XAxis
                      type="number"
                      tick={{
                        fill: '#94A3B8',
                        fontSize: 11,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(34,211,238,0.1)' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={130}
                      tick={{
                        fill: '#94A3B8',
                        fontSize: 11,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE.contentStyle}
                      labelStyle={TOOLTIP_STYLE.labelStyle}
                      itemStyle={TOOLTIP_STYLE.itemStyle}
                      formatter={(value: number, name: string) => [
                        `${value} MNOK`,
                        name === 'kostnad' ? 'Implementeringskostnad' : 'Besparelse/gevinst',
                      ]}
                    />
                    <Legend
                      iconType="square"
                      iconSize={8}
                      wrapperStyle={{
                        fontSize: 11,
                        fontFamily: "'JetBrains Mono', monospace",
                        color: '#94A3B8',
                      }}
                    />
                    <Bar dataKey="kostnad" name="Kostnad" radius={[0, 3, 3, 0]}>
                      {roiData.map((_, index) => (
                        <Cell key={`kostnad-${index}`} fill="#FB7185" fillOpacity={0.7} />
                      ))}
                    </Bar>
                    <Bar dataKey="besparelse" name="Besparelse" radius={[0, 3, 3, 0]}>
                      {roiData.map((_, index) => (
                        <Cell key={`besparelse-${index}`} fill="#34D399" fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* ROI summary rows below chart */}
                <div className="mt-1 border-t pt-1" style={{ borderColor: 'rgba(251,113,133,0.1)' }}>
                  {roiData.map((row) => (
                    <div key={row.label} className="flex justify-between items-center py-1 px-2">
                      <span
                        className="text-slate-400 text-xs"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {row.label}
                      </span>
                      <span
                        className="text-emerald-400 text-xs font-mono"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        ROI: {row.roi.toLocaleString('nb-NO')}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Investment & ROI */}
            <div
              className="rounded-lg overflow-hidden"
              style={{ border: '1px solid rgba(34,211,238,0.25)', boxShadow: '0 0 16px rgba(34,211,238,0.1)' }}
            >
              <div
                className="px-4 py-2.5 border-b"
                style={{
                  background: 'rgba(34,211,238,0.08)',
                  borderColor: 'rgba(34,211,238,0.2)',
                }}
              >
                <span
                  className="text-cyan-400 text-xs font-mono tracking-wider uppercase"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Investering og avkastning
                </span>
              </div>
              <div className="p-1">
                <DataRow label="Implementeringskostnad" value="NOK 8–15M" accent="#34D399" highlight />
                <DataRow label="Dekker antall banker" value="14 (hele alliansen)" />
                <DataRow label="Kostnad per bank" value="NOK 570K–1.1M" />
                <DataRow label="Beskytter forvaltningskapital" value="NOK 625 mrd." accent="#22D3EE" highlight />
                <DataRow label="Estimert ROI (5 år)" value=">400%" accent="#34D399" highlight />
                <DataRow label="Tid til full implementering" value="12–24 mnd." />
              </div>
            </div>
          </div>
        </div>
      </div>

      <SpeakerNotes notes={SPEAKER_NOTES[4]} />
    </SlideWrapper>
  );
};
