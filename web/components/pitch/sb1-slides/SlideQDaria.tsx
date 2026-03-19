'use client';

import React from 'react';
import { SlideWrapper, SlideTitle } from '../pitch-ui/SB1SlideWrapper';
import { MetricCard } from '../pitch-ui/MetricCard';
import { SpeakerNotes } from '../pitch-ui/SpeakerNotes';
import { qdariaOrg, type Scenario } from '@/lib/sb1-chart-data';
import { SPEAKER_NOTES } from '@/lib/sb1-speaker-notes';

interface SlideQDariaProps {
  scenario: Scenario;
}

// World map bounding box: lng -180..180 -> x 0..100, lat -60..85 -> y 0..100
function lngToX(lng: number): number {
  return ((lng + 180) / 360) * 100;
}
function latToY(lat: number): number {
  return ((85 - lat) / 145) * 100;
}

export const SlideQDaria: React.FC<SlideQDariaProps> = () => {
  const hq = qdariaOrg[0];
  const subsidiaries = qdariaOrg.slice(1);

  return (
    <SlideWrapper>
      <div className="flex flex-col h-full px-10 py-6">
        <SlideTitle
          eyebrow="QDaria AS · Posisjonering"
          title="Norges eneste kvanteselskap. Første kommersielle kvantedatamaskin."
          subtitle="NQCG ble oppløst i desember 2024. QDaria er nå uten direkte norsk konkurranse, med Rigetti-partnerskap, publisert forskning og produksjonsklar Zipminator-plattform."
          accentColor="#22D3EE"
        />

        <div className="grid grid-cols-3 gap-4 mb-4">
          <MetricCard value="1" label="Norsk kvanteselskap igjen" sublabel="NQCG oppløst des. 2024" color="cyan" />
          <MetricCard value="156Q" label="Rigetti Heron-prosessor" sublabel="QRC-eksperimenter publisert" color="amber" />
          <MetricCard value="$12M" label="Seed-runde pågående" sublabel="Intern verdsettelse" color="emerald" />
        </div>

        <div className="grid grid-cols-5 gap-4 flex-1">
          {/* Left: org tree + globe */}
          <div className="col-span-2 flex flex-col gap-3">
            {/* Org tree */}
            <div
              className="rounded-lg p-4 flex flex-col items-center"
              style={{ background: 'rgba(34,211,238,0.03)', border: '1px solid rgba(34,211,238,0.12)' }}
            >
              <p
                className="text-[10px] font-mono tracking-widest uppercase mb-3 self-start opacity-70"
                style={{ color: '#22D3EE', fontFamily: "'JetBrains Mono', monospace" }}
              >
                Konsernstruktur
              </p>
              {/* HQ node */}
              <div
                className="rounded-lg px-4 py-2 mb-1 text-center"
                style={{
                  background: `${hq.color}15`,
                  border: `1px solid ${hq.color}40`,
                }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ color: hq.color, fontFamily: "'Fraunces', Georgia, serif" }}
                >
                  {hq.name}
                </p>
                <p
                  className="text-[10px]"
                  style={{ color: '#94A3B8', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {hq.location}
                </p>
                <p
                  className="text-[10px]"
                  style={{ color: '#64748B', fontFamily: "'DM Sans', sans-serif" }}
                >
                  {hq.purpose}
                </p>
              </div>
              {/* Connector line */}
              <div className="w-px h-3" style={{ background: 'rgba(34,211,238,0.3)' }} />
              {/* Horizontal branch */}
              <div className="relative w-full flex justify-center">
                <div
                  className="absolute top-0 left-4 right-4 h-px"
                  style={{ background: 'rgba(34,211,238,0.2)' }}
                />
              </div>
              {/* Subsidiary nodes */}
              <div className="grid grid-cols-3 gap-1.5 w-full pt-1">
                {subsidiaries.map((node) => (
                  <div key={`${node.name}-${node.location}`} className="flex flex-col items-center">
                    <div className="w-px h-3" style={{ background: 'rgba(34,211,238,0.2)' }} />
                    <div
                      className="rounded p-1.5 text-center w-full"
                      style={{
                        background: `${node.color}10`,
                        border: `1px solid ${node.color}30`,
                      }}
                    >
                      <p
                        className="text-[9px] font-semibold leading-tight"
                        style={{ color: node.color, fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {node.location.split(',')[0]}
                      </p>
                      <p
                        className="text-[8px] leading-tight mt-0.5"
                        style={{ color: '#64748B', fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {node.purpose}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Globe / world map */}
            <div
              className="rounded-lg p-3 flex-1"
              style={{ background: 'rgba(34,211,238,0.02)', border: '1px solid rgba(34,211,238,0.1)' }}
            >
              <p
                className="text-[10px] font-mono tracking-widest uppercase mb-2 opacity-70"
                style={{ color: '#22D3EE', fontFamily: "'JetBrains Mono', monospace" }}
              >
                Globalt fotavtrykk — 6 jurisdiksjoner
              </p>
              <div className="relative w-full" style={{ height: 90, background: 'rgba(15,22,41,0.6)', borderRadius: 6, overflow: 'hidden' }}>
                {/* Simplified world outline via SVG */}
                <svg
                  viewBox="0 0 100 60"
                  className="absolute inset-0 w-full h-full"
                  preserveAspectRatio="none"
                >
                  {/* Very simplified continent silhouettes */}
                  {/* North America */}
                  <path d="M10,8 L22,6 L26,14 L24,22 L18,28 L12,26 L8,18 Z" fill="rgba(34,211,238,0.06)" stroke="rgba(34,211,238,0.12)" strokeWidth="0.3" />
                  {/* South America */}
                  <path d="M18,30 L26,28 L28,36 L24,46 L18,48 L14,40 Z" fill="rgba(34,211,238,0.06)" stroke="rgba(34,211,238,0.12)" strokeWidth="0.3" />
                  {/* Europe */}
                  <path d="M44,6 L52,5 L54,12 L50,16 L44,14 L42,10 Z" fill="rgba(34,211,238,0.06)" stroke="rgba(34,211,238,0.12)" strokeWidth="0.3" />
                  {/* Africa */}
                  <path d="M46,18 L54,16 L56,26 L54,38 L48,40 L44,32 L44,22 Z" fill="rgba(34,211,238,0.06)" stroke="rgba(34,211,238,0.12)" strokeWidth="0.3" />
                  {/* Asia */}
                  <path d="M54,4 L76,4 L80,10 L78,20 L70,22 L60,18 L54,12 Z" fill="rgba(34,211,238,0.06)" stroke="rgba(34,211,238,0.12)" strokeWidth="0.3" />
                  {/* SE Asia */}
                  <path d="M76,22 L84,20 L86,28 L80,30 L74,28 Z" fill="rgba(34,211,238,0.06)" stroke="rgba(34,211,238,0.12)" strokeWidth="0.3" />
                  {/* Australia */}
                  <path d="M76,36 L86,34 L88,42 L82,46 L74,44 Z" fill="rgba(34,211,238,0.06)" stroke="rgba(34,211,238,0.12)" strokeWidth="0.3" />
                  {/* Grid lines */}
                  <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(34,211,238,0.05)" strokeWidth="0.4" strokeDasharray="2,2" />
                  <line x1="50" y1="0" x2="50" y2="60" stroke="rgba(34,211,238,0.05)" strokeWidth="0.4" strokeDasharray="2,2" />

                  {/* Org node dots */}
                  {qdariaOrg.map((node) => {
                    const x = lngToX(node.lng) * 100 / 100;
                    const y = (latToY(node.lat) * 60) / 100;
                    return (
                      <g key={`dot-${node.location}`}>
                        <circle cx={x} cy={y} r={1.8} fill={node.color} opacity={0.9} />
                        <circle cx={x} cy={y} r={3.5} fill="none" stroke={node.color} strokeWidth="0.5" opacity={0.4} />
                      </g>
                    );
                  })}
                </svg>
                {/* Legend */}
                <div className="absolute bottom-1 right-2 flex flex-col gap-0.5">
                  {qdariaOrg.map((node) => (
                    <div key={`leg-${node.location}`} className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: node.color }} />
                      <span
                        className="text-[7px]"
                        style={{ color: '#64748B', fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {node.location.split(',')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: product portfolio + competitive table */}
          <div className="col-span-3 flex flex-col gap-3">
            <div>
              <p
                className="text-[10px] font-mono tracking-widest uppercase mb-2 opacity-70"
                style={{ color: '#22D3EE', fontFamily: "'JetBrains Mono', monospace" }}
              >
                QDaria produktportefølje
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { product: 'Zipminator', tag: 'Beta-klar', desc: 'Post-kvantum kryptografi platform — App Store + Android + Desktop', color: '#FB7185' },
                  { product: 'QCaaS / QCaaP', tag: 'Live via Rigetti', desc: 'Quantum Computing as a Service på Norges første kommersielle kvantemaskine', color: '#22D3EE' },
                  { product: 'Qm9 (Fintech)', tag: 'Development', desc: 'Quantum-drevet finansielle tjenester — portefølje, prising, risikovurdering', color: '#F59E0B' },
                  { product: 'QDiana (Edtech)', tag: 'Live', desc: 'Kvantumutdanning og kompetansebygging for norsk næringsliv', color: '#34D399' },
                ].map((p) => (
                  <div
                    key={p.product}
                    className="rounded p-3 flex flex-col gap-1"
                    style={{ background: `${p.color}06`, border: `1px solid ${p.color}20` }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: '#E2E8F0', fontFamily: "'Fraunces', Georgia, serif" }}
                      >
                        {p.product}
                      </span>
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                        style={{ color: p.color, background: `${p.color}15`, fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {p.tag}
                      </span>
                    </div>
                    <p
                      className="text-slate-500 text-xs leading-snug"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {p.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1">
              <p
                className="text-[10px] font-mono tracking-widest uppercase mb-2 opacity-70"
                style={{ color: '#22D3EE', fontFamily: "'JetBrains Mono', monospace" }}
              >
                Konkurransefortrinn vs. globale aktører
              </p>
              <div
                className="rounded-lg overflow-hidden"
                style={{ border: '1px solid rgba(34,211,238,0.12)' }}
              >
                {/* Header */}
                <div
                  className="grid grid-cols-3 px-3 py-1.5"
                  style={{ background: 'rgba(34,211,238,0.06)', borderBottom: '1px solid rgba(34,211,238,0.1)' }}
                >
                  <span className="text-[9px] font-mono text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Dimensjon</span>
                  <span className="text-[9px] font-mono text-cyan-400 text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>QDaria</span>
                  <span className="text-[9px] font-mono text-slate-500 text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Globale</span>
                </div>
                {[
                  { dim: 'Norsk regulatorisk ekspertise', qdaria: '✓✓✓', global: '✗' },
                  { dim: 'Rigetti-hardware tilgang', qdaria: '✓ Direkte partner', global: '✓ (IBM/IonQ)' },
                  { dim: 'PQC + QCaaS i ett selskap', qdaria: '✓', global: 'Sjelden' },
                  { dim: 'Norsk etablering', qdaria: 'Oslo-basert', global: 'London/NYC/Berlin' },
                  { dim: 'Tid til pilot', qdaria: '3 mnd.', global: '6–18 mnd.' },
                  { dim: 'CAPEX krav SB1', qdaria: 'NOK 0 (SaaS)', global: 'Varierende' },
                ].map((row) => (
                  <div
                    key={row.dim}
                    className="grid grid-cols-3 px-3 py-1.5 border-b"
                    style={{ borderColor: 'rgba(34,211,238,0.07)' }}
                  >
                    <span
                      className="text-slate-400 text-xs"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {row.dim}
                    </span>
                    <span
                      className="text-cyan-400 text-xs font-mono text-center"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {row.qdaria}
                    </span>
                    <span
                      className="text-slate-500 text-xs font-mono text-center"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {row.global}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <SpeakerNotes notes={SPEAKER_NOTES[10]} />
    </SlideWrapper>
  );
};
