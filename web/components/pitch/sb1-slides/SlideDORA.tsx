'use client';

import React from 'react';
import { SlideWrapper, SlideTitle } from '../pitch-ui/SB1SlideWrapper';
import { MetricCard, Tag } from '../pitch-ui/MetricCard';

export const SlideDORA: React.FC = () => {
  const timeline = [
    { date: '1. jan 2023',  label: 'DORA vedtatt i EU',        done: true  },
    { date: '17. jan 2025', label: 'DORA i kraft i EU',         done: true  },
    { date: '1. juli 2025', label: 'DORA norsk lov · Finanstilsynet tilsynsmyndighet', done: true, highlight: true },
    { date: 'Innen 2027',   label: 'NSA CNSA 2.0: alle nye systemer PQC-kompatible', done: false },
    { date: 'Innen 2030',   label: 'EU: Alle høyrisikosystemer migrert til PQC',      done: false },
    { date: 'Etter 2035',   label: 'NIST: RSA/ECC forbudt i alle systemer',           done: false, danger: true },
  ];

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

  return (
    <SlideWrapper>
      <div className="flex flex-col h-full px-10 py-8">
        <SlideTitle
          eyebrow="Regulatorisk ramme · DORA"
          title="Compliance er ikke valgfritt lenger."
          subtitle="DORA trådte i kraft som norsk lov 1. juli 2025. Finanstilsynet er tilsynsmyndighet. Bøtene kan utgjøre inntil 2% av global omsetning."
          accentColor="#F59E0B"
        />

        <div className="grid grid-cols-12 gap-5 flex-1">
          {/* Left: Timeline */}
          <div className="col-span-4 flex flex-col">
            <p
              className="text-amber-400 text-xs font-mono tracking-wider uppercase mb-4"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Regulatorisk tidslinje
            </p>
            <div className="flex flex-col gap-2 flex-1">
              {timeline.map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="flex flex-col items-center mt-1">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{
                        background: item.danger
                          ? '#FB7185'
                          : item.highlight
                          ? '#F59E0B'
                          : item.done
                          ? '#22D3EE'
                          : '#1E293B',
                        border: item.done
                          ? 'none'
                          : `1px solid ${item.danger ? '#FB7185' : '#475569'}`,
                        boxShadow: item.highlight ? '0 0 8px rgba(245,158,11,0.6)' : 'none',
                      }}
                    />
                    {i < timeline.length - 1 && (
                      <div
                        className="w-px flex-1 mt-1 min-h-[20px]"
                        style={{
                          background: item.done
                            ? 'rgba(34,211,238,0.3)'
                            : 'rgba(71,85,105,0.3)',
                        }}
                      />
                    )}
                  </div>
                  <div className="pb-3">
                    <p
                      className="text-xs font-mono"
                      style={{
                        color: item.highlight ? '#F59E0B' : item.done ? '#22D3EE' : '#64748B',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {item.date}
                    </p>
                    <p
                      className="text-sm leading-snug mt-0.5"
                      style={{
                        color: item.highlight ? '#F1F5F9' : item.done ? '#CBD5E1' : '#64748B',
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: item.highlight ? 600 : 400,
                      }}
                    >
                      {item.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: DORA articles + penalty */}
          <div className="col-span-8 flex flex-col gap-4">
            {/* Articles */}
            <div className="flex flex-col gap-3">
              {articles.map((a) => (
                <div
                  key={a.article}
                  className="rounded-lg p-4"
                  style={{
                    background: 'rgba(245,158,11,0.04)',
                    border: '1px solid rgba(245,158,11,0.15)',
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
                    className="text-slate-400 text-xs leading-relaxed"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {a.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Penalty + opportunity */}
            <div className="grid grid-cols-2 gap-4 mt-auto">
              <MetricCard
                value="2%"
                label="Maks bot av global omsetning"
                sublabel="Per DORA — eller €1M for enkeltpersoner"
                color="rose"
                source="DORA Art. 50"
              />
              <div
                className="rounded-lg p-4 flex flex-col justify-between"
                style={{
                  background: 'rgba(34,211,238,0.05)',
                  border: '1px solid rgba(34,211,238,0.2)',
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
                  Én implementering via <strong className="text-slate-100">SB1 Utvikling</strong> dekker alle{' '}
                  <strong className="text-cyan-400">14 banker</strong> i alliansen. Laveste kostnad-per-bank i sektoren.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
};
