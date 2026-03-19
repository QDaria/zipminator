'use client';

import React from 'react';
import { SlideWrapper, SlideTitle } from '../pitch-ui/SB1SlideWrapper';
import { SpeakerNotes } from '../pitch-ui/SpeakerNotes';
import { nextStepsPhases, type Scenario } from '@/lib/sb1-chart-data';
import { SPEAKER_NOTES } from '@/lib/sb1-speaker-notes';

interface SlideNextStepsProps {
  scenario: Scenario;
}

const TOTAL_MONTHS = 24;

export const SlideNextSteps: React.FC<SlideNextStepsProps> = () => {
  return (
    <SlideWrapper>
      <div className="flex flex-col h-full px-10 py-6">
        <SlideTitle
          eyebrow="Veien videre · Call to Action"
          title="Tre steg til Norges første kvantebank."
          subtitle="Vi ønsker ikke å selge et produkt til SpareBank 1. Vi ønsker å bygge et historisk partnerskap — og vi mener SpareBank 1 er den rette partneren til å vise at norsk finanssektor er klar for kvantumtiden."
          accentColor="#22D3EE"
        />

        {/* Gantt timeline */}
        <div
          className="rounded-lg p-4 mb-4"
          style={{ background: 'rgba(34,211,238,0.02)', border: '1px solid rgba(34,211,238,0.1)' }}
        >
          <p
            className="text-[10px] font-mono tracking-widest uppercase mb-3 opacity-70"
            style={{ color: '#22D3EE', fontFamily: "'JetBrains Mono', monospace" }}
          >
            Fremdriftsplan — måneder fra oppstart
          </p>
          {/* Month ruler */}
          <div className="relative mb-2" style={{ paddingLeft: 100 }}>
            <div className="flex" style={{ height: 16 }}>
              {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((m) => (
                <div
                  key={m}
                  className="absolute text-[9px]"
                  style={{
                    left: `calc(100px + ${(m / TOTAL_MONTHS) * 100}%)`,
                    color: '#475569',
                    fontFamily: "'JetBrains Mono', monospace",
                    transform: 'translateX(-50%)',
                  }}
                >
                  {m}m
                </div>
              ))}
            </div>
            <div className="absolute inset-y-0" style={{ left: 100, right: 0, top: 12 }}>
              <div className="w-full h-px" style={{ background: 'rgba(34,211,238,0.1)' }} />
            </div>
          </div>
          {/* Phase bars */}
          <div className="space-y-2.5">
            {nextStepsPhases.map((phase) => {
              const startPct = (phase.startMonth / TOTAL_MONTHS) * 100;
              const widthPct = ((phase.endMonth - phase.startMonth) / TOTAL_MONTHS) * 100;
              return (
                <div key={phase.phase} className="flex items-center" style={{ height: 28 }}>
                  {/* Label */}
                  <div
                    className="shrink-0 text-right pr-3"
                    style={{ width: 100 }}
                  >
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: phase.color, fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Fase {phase.phase}
                    </span>
                  </div>
                  {/* Track */}
                  <div className="flex-1 relative h-6 rounded" style={{ background: 'rgba(15,22,41,0.6)' }}>
                    {/* Bar */}
                    <div
                      className="absolute top-1 bottom-1 rounded flex items-center px-2"
                      style={{
                        left: `${startPct}%`,
                        width: `${widthPct}%`,
                        background: `${phase.color}25`,
                        border: `1px solid ${phase.color}50`,
                      }}
                    >
                      <span
                        className="text-[9px] font-semibold truncate"
                        style={{ color: phase.color, fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {phase.title}
                      </span>
                    </div>
                    {/* Tick lines */}
                    {[3, 6, 9, 12, 15, 18, 21].map((m) => (
                      <div
                        key={m}
                        className="absolute top-0 bottom-0 w-px"
                        style={{
                          left: `${(m / TOTAL_MONTHS) * 100}%`,
                          background: 'rgba(34,211,238,0.07)',
                        }}
                      />
                    ))}
                  </div>
                  {/* Duration badge */}
                  <span
                    className="ml-2 text-[9px] font-mono shrink-0"
                    style={{ color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {phase.duration}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Phase detail cards */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {nextStepsPhases.map((phase) => (
            <div
              key={phase.phase}
              className="rounded-lg p-4 flex flex-col gap-2"
              style={{ background: `${phase.color}06`, border: `1px solid ${phase.color}25` }}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-3xl font-bold"
                    style={{ color: `${phase.color}30`, fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {String(phase.phase).padStart(2, '0')}
                  </span>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded"
                    style={{ color: phase.color, background: `${phase.color}15`, fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {phase.duration}
                  </span>
                </div>
                <h3
                  className="text-slate-200 text-sm font-semibold"
                  style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                >
                  {phase.title}
                </h3>
              </div>
              <div className="space-y-1.5 flex-1">
                {phase.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span
                      className="text-xs mt-0.5 shrink-0"
                      style={{ color: phase.color, fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      ▸
                    </span>
                    <p
                      className="text-slate-400 text-xs leading-snug"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom section: what SB1 gets + contact */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-lg p-4"
            style={{ background: 'rgba(251,113,133,0.05)', border: '1px solid rgba(251,113,133,0.2)' }}
          >
            <p
              className="text-[10px] font-mono tracking-widest uppercase mb-2 opacity-80"
              style={{ color: '#FB7185', fontFamily: "'JetBrains Mono', monospace" }}
            >
              Hva SpareBank 1 får
            </p>
            <div className="space-y-1">
              {[
                'Nordens første post-kvantum sikrede bank-infrastruktur',
                'DORA Art. 6 compliance-dokumentasjon',
                'Eksklusiv tilgang til Norges eneste kommersielle kvantedatamaskin',
                'Konkurransefortrinn i en sektor som ikke har begynt',
                'Historisk førstemann-posisjon — et narrativ SB1 Markets kan eie',
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span
                    className="text-xs mt-0.5 shrink-0"
                    style={{ color: '#FB7185', fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    ✓
                  </span>
                  <p
                    className="text-slate-400 text-xs leading-snug"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-lg p-4 flex flex-col justify-between"
            style={{ background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.25)' }}
          >
            <p
              className="text-[10px] font-mono tracking-widest uppercase mb-2 opacity-80"
              style={{ color: '#22D3EE', fontFamily: "'JetBrains Mono', monospace" }}
            >
              Kontakt
            </p>
            <div className="space-y-1.5 flex-1 flex flex-col justify-center">
              <p
                className="text-slate-200 text-lg font-semibold"
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              >
                Daniel Mo Houshmand
              </p>
              <p
                className="text-slate-400 text-sm"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                CEO & Co-founder · QDaria AS
              </p>
              <p
                className="text-cyan-400 text-sm font-mono"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                mo@qdaria.com
              </p>
              <p
                className="text-slate-500 text-xs font-mono"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                qdaria.com · Oslo, Norge
              </p>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span
                className="text-emerald-400 text-xs font-mono"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Mike Piech (Rigetti VP) — invitert til neste møte
              </span>
            </div>
          </div>
        </div>
      </div>
      <SpeakerNotes notes={SPEAKER_NOTES[11]} />
    </SlideWrapper>
  );
};
