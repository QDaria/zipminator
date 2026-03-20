'use client';

import React from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { SlideWrapper, SlideTitle } from '../pitch-ui/SB1SlideWrapper';
import { MetricCard } from '../pitch-ui/MetricCard';
import { SpeakerNotes } from '../pitch-ui/SpeakerNotes';
import { bankRadarData } from '@/lib/sb1-chart-data';
import { SPEAKER_NOTES } from '@/lib/sb1-speaker-notes';
import type { Scenario } from '@/lib/sb1-chart-data';

interface SlideGlobalBanksProps {
  scenario: Scenario;
}

const banks = [
  {
    bank: 'JPMorgan Chase',
    region: 'USA',
    highlight: '71 313 bits kvantum-entropi · 1 000x speedup porteføljeopt.',
    tag: 'Ledende',
    tagColor: '#22D3EE',
  },
  {
    bank: 'HSBC',
    region: 'UK',
    highlight: '+34% treffsikkerhet obligasjonshandel · PQC VPN deployert',
    tag: 'Produksjon',
    tagColor: '#34D399',
  },
  {
    bank: 'BBVA',
    region: 'Spania',
    highlight: '52-asset opt. sekunder vs. 2 dager (Multiverse Computing)',
    tag: 'Pilot',
    tagColor: '#F59E0B',
  },
  {
    bank: 'Danske Bank',
    region: 'Norden',
    highlight: 'Første kvantesikre datatransfer Norden 2022 · DKK 22.5M CryptQ',
    tag: 'Nordisk #1',
    tagColor: '#FB7185',
  },
  {
    bank: 'Goldman Sachs',
    region: 'USA',
    highlight: '1 000x teoretisk speedup derivatprising via amplitude estimation',
    tag: 'Forskning',
    tagColor: '#A78BFA',
  },
  {
    bank: 'SpareBank 1',
    region: 'Norge',
    highlight: 'Ingen bekreftet kvantum-initiativ mars 2026 — first-mover mulighet åpen',
    tag: 'Åpent vindu',
    tagColor: '#F59E0B',
    isTarget: true,
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

export const SlideGlobalBanks: React.FC<SlideGlobalBanksProps> = ({ scenario: _scenario }) => {
  return (
    <SlideWrapper>
      <div className="flex flex-col h-full px-12 py-10">
        <SlideTitle
          eyebrow="Konkurransebilde · Global banksektor"
          title="80% av verdens 50 største banker er i gang."
          subtitle="Kvantum er ikke lenger et forskningsprosjekt — det er en produktiv investering. SpareBank 1 er ennå ikke på kartet. Det er et vindu."
          accentColor="#22D3EE"
        />

        <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
          {/* Left: compact bank cards */}
          <div className="col-span-5 flex flex-col gap-2">
            {banks.map((b) => (
              <div
                key={b.bank}
                className="rounded-lg px-3 py-2.5 flex items-start gap-2.5 relative overflow-hidden"
                style={{
                  background: b.isTarget ? 'rgba(245,158,11,0.06)' : 'rgba(15,22,41,0.8)',
                  border: b.isTarget
                    ? '1px solid rgba(245,158,11,0.4)'
                    : '1px solid rgba(34,211,238,0.3)',
                  boxShadow: b.isTarget
                    ? '0 0 16px rgba(245,158,11,0.15)'
                    : '0 0 12px rgba(34,211,238,0.06)',
                }}
              >
                {b.isTarget && (
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{
                      background: 'linear-gradient(90deg, transparent, #F59E0B, transparent)',
                    }}
                  />
                )}
                <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="text-slate-200 text-xs font-semibold truncate"
                        style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                      >
                        {b.bank}
                      </span>
                      <span
                        className="text-slate-400 text-xs font-mono shrink-0"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {b.region}
                      </span>
                    </div>
                    <span
                      className="text-xs font-mono px-1.5 py-0.5 rounded shrink-0"
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
                    className="text-sm leading-snug"
                    style={{
                      color: b.isTarget ? '#D97706' : '#94A3B8',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {b.highlight}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: radar chart */}
          <div
            className="col-span-7 rounded-lg flex flex-col"
            style={{
              background: 'rgba(15,22,41,0.6)',
              border: '1px solid rgba(34,211,238,0.3)',
              boxShadow: '0 0 16px rgba(34,211,238,0.08)',
            }}
          >
            <div
              className="px-4 py-2 border-b"
              style={{ borderColor: 'rgba(34,211,238,0.1)' }}
            >
              <span
                className="text-cyan-400 text-xs font-mono tracking-wider uppercase"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Kvantum-modenhetsprofil · Konkurrentanalyse
              </span>
            </div>
            <div className="flex-1 min-h-0 p-2">
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={bankRadarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid
                    stroke="rgba(34,211,238,0.1)"
                    gridType="polygon"
                  />
                  <PolarAngleAxis
                    dataKey="dimension"
                    tick={{
                      fill: '#94A3B8',
                      fontSize: 11,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    tickCount={4}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{
                      fontSize: 11,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: '#94A3B8',
                    }}
                  />
                  <Radar
                    name="JPMorgan"
                    dataKey="jpmorgan"
                    stroke="#22D3EE"
                    fill="#22D3EE"
                    fillOpacity={0.08}
                    strokeWidth={1.5}
                  />
                  <Radar
                    name="HSBC"
                    dataKey="hsbc"
                    stroke="#34D399"
                    fill="#34D399"
                    fillOpacity={0.08}
                    strokeWidth={1.5}
                  />
                  <Radar
                    name="BBVA"
                    dataKey="bbva"
                    stroke="#F59E0B"
                    fill="#F59E0B"
                    fillOpacity={0.06}
                    strokeWidth={1.5}
                  />
                  <Radar
                    name="QDaria"
                    dataKey="qdaria"
                    stroke="#FB7185"
                    fill="#FB7185"
                    fillOpacity={0.12}
                    strokeWidth={2}
                    strokeDasharray="4 2"
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom metric strip */}
        <div
          className="grid grid-cols-4 gap-3 mt-3 pt-3 border-t"
          style={{ borderColor: 'rgba(34,211,238,0.1)' }}
        >
          <MetricCard
            value="80%"
            label="Av top-50 banker investerer"
            color="cyan"
            size="sm"
            source="Evident 2024"
          />
          <MetricCard
            value="~40%"
            label="Av store bedrifter planlegger kvantum-initiativ"
            sublabel="Gartner prediksjon innen 2025"
            color="emerald"
            size="sm"
            source="Gartner"
          />
          <MetricCard
            value="15"
            label="Banker nevner kvantum i årsrapport"
            color="slate"
            size="sm"
          />
          <MetricCard
            value="0"
            label="Norske banker med bekreftet program"
            color="rose"
            size="sm"
          />
        </div>
      </div>

      <SpeakerNotes notes={SPEAKER_NOTES[3]} />
    </SlideWrapper>
  );
};
