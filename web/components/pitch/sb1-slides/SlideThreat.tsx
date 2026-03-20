'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  Legend,
} from 'recharts';
import { SlideWrapper, SlideTitle } from '../pitch-ui/SB1SlideWrapper';
import { MetricCard } from '../pitch-ui/MetricCard';
import { SpeakerNotes } from '../pitch-ui/SpeakerNotes';
import { SPEAKER_NOTES } from '@/lib/sb1-speaker-notes';
import {
  hndlExposureData,
  threatRadarData,
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

interface SlideThreatProps {
  scenario: Scenario;
}

export const SlideThreat: React.FC<SlideThreatProps> = ({ scenario }) => {
  const chartData = hndlExposureData[scenario];

  return (
    <SlideWrapper>
      <div className="flex flex-col h-full px-12 py-10">
        <SlideTitle
          eyebrow="Trusselbilde · Q-Day"
          title="RSA er allerede kompromittert."
          subtitle="Statlige aktører høster krypterte data i dag — med plan om å dekryptere dem når en kraftig nok kvantedatamaskin er klar. Det kalles 'Harvest Now, Decrypt Later', og det pågår nå."
          accentColor="#FB7185"
        />

        {/* Metrics row with radar chart */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          <MetricCard
            value="19–34%"
            label="Sannsynlighet for Q-Day innen 10 år"
            sublabel="Global Risk Institute · 32 eksperter · 2024"
            color="rose"
            source="GRI 2024"
          />
          <MetricCard
            value="$6.08M"
            label="Gjennomsnittlig datalekkasje-kostnad, finans"
            sublabel="IBM Cost of Data Breach 2024"
            color="amber"
            source="IBM 2024"
          />
          <MetricCard
            value="90%"
            label="Av globalt kryptert data er RSA/ECC-basert"
            sublabel="Shor's algoritme bryter begge"
            color="rose"
            source="NIST 2024"
          />

          {/* Mini radar chart */}
          <div
            className="rounded-lg p-3 flex flex-col"
            style={{
              background: 'rgba(251,113,133,0.04)',
              border: '1px solid rgba(251,113,133,0.15)',
              boxShadow: '0 0 16px rgba(251,113,133,0.1)',
            }}
          >
            <span
              className="text-rose-400 text-xs font-mono tracking-wider uppercase mb-1"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Risikoradar
            </span>
            <div className="flex-1 min-h-0" style={{ height: 120 }}>
              <ResponsiveContainer width="100%" height={120}>
                <RadarChart data={threatRadarData} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                  <PolarGrid stroke="rgba(251,113,133,0.2)" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{
                      fill: '#94A3B8',
                      fontSize: 11,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  />
                  <Radar
                    name="Risiko"
                    dataKey="value"
                    stroke="#FB7185"
                    fill="#FB7185"
                    fillOpacity={0.25}
                    dot={false}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom panels */}
        <div className="grid grid-cols-2 gap-5 flex-1 min-h-0">
          {/* Left: HNDL attack steps */}
          <div
            className="rounded-lg p-5 flex flex-col"
            style={{
              background: 'rgba(251,113,133,0.05)',
              border: '1px solid rgba(251,113,133,0.2)',
              boxShadow: '0 0 16px rgba(251,113,133,0.1)',
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span
                className="text-rose-400 text-xs font-mono tracking-wider uppercase"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Aktiv trussel i dag
              </span>
            </div>
            <h3
              className="text-slate-200 text-lg font-semibold mb-3"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Harvest Now, Decrypt Later
            </h3>
            <div className="space-y-3">
              {[
                {
                  step: '01',
                  text: 'Statlig aktør fanger opp kryptert nettbanktrafikk, BankID-sesjoner og inter-bankdokumenter',
                },
                {
                  step: '02',
                  text: 'Dataene lagres i kryptert form — ubrukelige i dag, men beregnet for fremtidig dekryptering',
                },
                {
                  step: '03',
                  text: 'Rundt 2030–2035 brukes en kvantedatamaskin til å bryte RSA/ECC og lese alt historisk data',
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-3">
                  <span
                    className="text-rose-500 text-xs font-mono mt-0.5 shrink-0"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {item.step}
                  </span>
                  <p
                    className="text-slate-400 text-sm leading-relaxed"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
            <p
              className="text-rose-400/70 text-xs mt-3 leading-relaxed italic"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              &ldquo;By 2029, advances in quantum computing will make most conventional asymmetric
              cryptography unsafe to use.&rdquo;
              <span
                className="text-slate-400 not-italic ml-1 font-mono text-xs"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                — Gartner, Top 10 Strategic Technology Trends 2025
              </span>
            </p>
            <p
              className="text-slate-400 text-sm mt-auto pt-3 leading-relaxed"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Finanstilsynet registrerte{' '}
              <strong className="text-slate-400">365 alvorlige IKT-hendelser</strong> i norsk
              finanssektor i 2024. Svindelanmeldelser +51% i 2023 til NOK 928 mill.
            </p>
          </div>

          {/* Right: HNDL exposure area chart */}
          <div
            className="rounded-lg p-5 flex flex-col"
            style={{
              background: 'rgba(245,158,11,0.05)',
              border: '1px solid rgba(245,158,11,0.2)',
              boxShadow: '0 0 16px rgba(245,158,11,0.1)',
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-amber-400 text-xs font-mono tracking-wider uppercase"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                HNDL-eksponering over tid
              </span>
            </div>
            <h3
              className="text-slate-200 text-base font-semibold mb-3"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Eksponeringsvinduet er åpent nå
            </h3>

            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradHarvested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FB7185" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#FB7185" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="gradVulnerable" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="gradMigrated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34D399" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#34D399" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="year"
                    tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                    axisLine={false}
                    tickLine={false}
                    interval={2}
                  />
                  <YAxis
                    tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={(value: number, name: string) => {
                      const labels: Record<string, string> = {
                        harvested: 'Høstet',
                        vulnerable: 'Sårbar',
                        migrated: 'Migrert',
                      };
                      return [`${value}%`, labels[name] ?? name];
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{
                      fontSize: 11,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: '#94A3B8',
                      paddingTop: 4,
                    }}
                    formatter={(value: string) => {
                      const labels: Record<string, string> = {
                        harvested: 'Høstet',
                        vulnerable: 'Sårbar',
                        migrated: 'Migrert',
                      };
                      return labels[value] ?? value;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="harvested"
                    stroke="#FB7185"
                    strokeWidth={1.5}
                    fill="url(#gradHarvested)"
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="vulnerable"
                    stroke="#F59E0B"
                    strokeWidth={1.5}
                    fill="url(#gradVulnerable)"
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="migrated"
                    stroke="#34D399"
                    strokeWidth={1.5}
                    fill="url(#gradMigrated)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Mosca summary rows */}
            <div className="mt-3 space-y-1.5">
              {[
                { label: 'Regulatorisk datalagringsplikt', value: '7–10 år', highlight: true },
                { label: 'PQC-migrasjonstid (estimat)', value: '3–5 år', highlight: false },
                { label: 'Tid til Q-Day (median ekspert)', value: '~8 år', highlight: false },
                { label: 'Gap: data allerede i fare', value: 'JA', highlight: true, danger: true },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between items-center py-1.5 px-3 rounded"
                  style={{
                    background: row.danger
                      ? 'rgba(251,113,133,0.1)'
                      : row.highlight
                      ? 'rgba(245,158,11,0.08)'
                      : 'transparent',
                    border: row.danger ? '1px solid rgba(251,113,133,0.3)' : 'none',
                  }}
                >
                  <span
                    className="text-slate-400 text-sm"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {row.label}
                  </span>
                  <span
                    className="text-sm font-mono font-semibold"
                    style={{
                      color: row.danger ? '#FB7185' : row.highlight ? '#F59E0B' : '#F1F5F9',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SpeakerNotes notes={SPEAKER_NOTES[1]} />
    </SlideWrapper>
  );
};
