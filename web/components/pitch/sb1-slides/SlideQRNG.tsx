'use client';

import React, { useEffect, useRef, useState } from 'react';
import { SlideWrapper, SlideTitle } from '../pitch-ui/SB1SlideWrapper';
import { MetricCard, DataRow, Tag } from '../pitch-ui/MetricCard';
import { SpeakerNotes } from '../pitch-ui/SpeakerNotes';
import { type Scenario } from '@/lib/sb1-chart-data';
import { SPEAKER_NOTES } from '@/lib/sb1-speaker-notes';

// ─── Entropy Visualization ─────────────────────────────────────────────────

interface EntropyCell {
  value: number;  // 0 or 1
  opacity: number;
}

const COLS = 16;
const ROWS = 6;
const TOTAL = COLS * ROWS;

function randomCells(): EntropyCell[] {
  return Array.from({ length: TOTAL }, () => ({
    value: Math.random() > 0.5 ? 1 : 0,
    opacity: Math.random() * 0.6 + 0.2,
  }));
}

const EntropyGrid: React.FC = () => {
  const [cells, setCells] = useState<EntropyCell[]>(() => randomCells());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCells((prev) => {
        const next = [...prev];
        // Flip ~15% of cells each tick to simulate entropy stream
        const count = Math.floor(TOTAL * 0.15);
        for (let i = 0; i < count; i++) {
          const idx = Math.floor(Math.random() * TOTAL);
          next[idx] = {
            value: Math.random() > 0.5 ? 1 : 0,
            opacity: Math.random() * 0.6 + 0.2,
          };
        }
        return next;
      });
    }, 180);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="w-full">
      {/* Bit grid */}
      <div
        className="grid gap-1 w-full mb-3"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
      >
        {cells.map((cell, i) => (
          <div
            key={i}
            className="rounded-sm flex items-center justify-center select-none"
            style={{
              aspectRatio: '1',
              background: cell.value
                ? `rgba(34,211,238,${cell.opacity * 0.15})`
                : `rgba(167,139,250,${cell.opacity * 0.12})`,
              border: `1px solid ${cell.value ? 'rgba(34,211,238,' : 'rgba(167,139,250,'}${cell.opacity * 0.4})`,
              transition: 'all 0.15s ease',
            }}
          >
            <span
              className="text-[8px] font-mono leading-none"
              style={{
                color: cell.value ? `rgba(34,211,238,${cell.opacity})` : `rgba(167,139,250,${cell.opacity})`,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {cell.value}
            </span>
          </div>
        ))}
      </div>

      {/* Flowing hex stream below grid */}
      <EntropyHexStream />
    </div>
  );
};

const EntropyHexStream: React.FC = () => {
  const [stream, setStream] = useState<string[]>(() =>
    Array.from({ length: 24 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase())
  );

  useEffect(() => {
    const id = setInterval(() => {
      setStream((prev) => {
        const next = [...prev];
        const idx = Math.floor(Math.random() * next.length);
        next[idx] = Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
        return next;
      });
    }, 90);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-wrap gap-1">
      {stream.map((byte, i) => (
        <span
          key={i}
          className="text-[9px] font-mono px-1 py-0.5 rounded"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: 'rgba(34,211,238,0.7)',
            background: 'rgba(34,211,238,0.06)',
            border: '1px solid rgba(34,211,238,0.12)',
            transition: 'color 0.1s ease',
          }}
        >
          {byte}
        </span>
      ))}
    </div>
  );
};

// ─── Slide ─────────────────────────────────────────────────────────────────

interface SlideQRNGProps {
  scenario: Scenario;
}

export const SlideQRNG: React.FC<SlideQRNGProps> = ({ scenario: _scenario }) => {
  return (
      <SlideWrapper>
        <div className="flex flex-col h-full px-12 py-10">
          {/* Header row */}
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-xs font-mono text-cyan-400 tracking-wider uppercase"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Business Case 05 av 05
            </span>
            <Tag color="cyan">QRNG · BankID · Vipps</Tag>
          </div>

          <SlideTitle
            eyebrow="Quantum Random Number Generation"
            title="Kryptografisk entropi som ikke kan manipuleres eller forutsies."
            subtitle="Klassiske PRNG-generatorer er deterministiske og kan kompromitteres. QRNG fra kvantemekanikken er fundamentalt uforutsigbar. JPMorgan sertifiserte 71 313 bits ekte kvantumentropi i Nature (2025). HSBC bruker QRNG for tokenisert gull. SpareBank 1 kan bruke det for BankID og Vipps."
            accentColor="#22D3EE"
          />

          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <MetricCard
              value="71 313"
              label="Bits sertifisert kvantum-entropi"
              sublabel="JPMorgan × Quantinuum · Nature 2025"
              color="cyan"
              size="sm"
              source="JPMorgan"
            />
            <MetricCard
              value="1.52B"
              label="Vipps-transaksjoner 2024"
              sublabel="Alle avhengig av kryptografisk entropi"
              color="amber"
              size="sm"
            />
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
            {/* Left: entropy visualization */}
            <div
              className="rounded-lg p-4 flex flex-col"
              style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.18)', boxShadow: '0 0 20px rgba(34,211,238,0.08)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <p
                  className="text-cyan-400 text-xs font-mono tracking-wider uppercase"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Live entropifeed — kvantum RNG
                </p>
                <span
                  className="flex items-center gap-1 text-[9px] font-mono text-emerald-400"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"
                    style={{ animation: 'pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite' }}
                  />
                  AKTIV
                </span>
              </div>
              <EntropyGrid />
              <p
                className="text-slate-400 text-[10px] font-mono mt-2"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Simulert QRNG-strøm · Rigetti hardware i produksjon
              </p>
            </div>

            {/* Right: use cases + commercial params + precedents */}
            <div className="flex flex-col gap-3">
              {/* Use cases */}
              <div
                className="rounded-lg p-4"
                style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.15)', boxShadow: '0 0 20px rgba(34,211,238,0.08)' }}
              >
                <p
                  className="text-cyan-400 text-xs font-mono tracking-wider uppercase mb-2"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  SB1 QRNG Use Cases
                </p>
                <div className="space-y-2">
                  {[
                    { app: 'BankID-autentisering', desc: 'Kvanteentropi for session keys — uknekbar av fremtidige QC' },
                    { app: 'Vipps betalingsprotokoll', desc: 'Quantum-genererte transaksjons-tokens' },
                    { app: 'Monte Carlo frøverdier', desc: 'Ekte tilfeldighet forbedrer modellkvalitet' },
                    { app: 'Kryptografiske nøkler (DORA Art. 7)', desc: 'Nøkkelgenerering som oppfyller post-kvantum krav' },
                    { app: 'HSM-integrasjon', desc: 'Drop-in i eksisterende Hardware Security Modules' },
                  ].map((u) => (
                    <div key={u.app} className="flex flex-col">
                      <span
                        className="text-cyan-400 text-xs font-mono"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {u.app}
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

              {/* Commercial params */}
              <div
                className="rounded-lg overflow-hidden"
                style={{ border: '1px solid rgba(34,211,238,0.15)' }}
              >
                <div
                  className="px-4 py-2 border-b"
                  style={{ background: 'rgba(34,211,238,0.07)', borderColor: 'rgba(34,211,238,0.15)' }}
                >
                  <span
                    className="text-cyan-400 text-[10px] font-mono tracking-wider uppercase"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Kommersielle parametre
                  </span>
                </div>
                <div className="p-1">
                  <DataRow label="Leveringsmodell" value="API / HSM-integrasjon" />
                  <DataRow label="Implementeringstid" value="1–3 mnd." accent="#22D3EE" />
                  <DataRow label="DORA Art. 7 compliance" value="✓ Oppfylt" accent="#34D399" highlight />
                  <DataRow label="Volum (Vipps+BankID/år)" value="~2 mrd. operasjoner" />
                  <DataRow label="Kostnad per million ops" value="NOK ~0.1" />
                  <DataRow label="Inkrementell sikkerhetspremie" value="Prishevingsgrunnlag" accent="#F59E0B" highlight />
                </div>
              </div>

              {/* Global precedents */}
              <div
                className="rounded-lg p-3"
                style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)' }}
              >
                <p
                  className="text-amber-400 text-[10px] font-mono mb-2 uppercase tracking-wider"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Globale presedenser
                </p>
                <div className="space-y-1">
                  {[
                    'HSBC: QRNG for tokenisert gull på Orion blockchain',
                    'JPMorgan: Sertifisert kvantum-tilfeldighet (Nature, 2025)',
                    'London Quantum Secure Metro Network',
                  ].map((p, i) => (
                    <p
                      key={i}
                      className="text-slate-500 text-xs leading-snug"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      ↗ {p}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <SpeakerNotes notes={SPEAKER_NOTES[8]} />
      </SlideWrapper>
  );
};
