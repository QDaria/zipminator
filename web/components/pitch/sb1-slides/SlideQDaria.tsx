'use client';

import React from 'react';
import Image from 'next/image';
import { SlideWrapper, SlideTitle } from '../pitch-ui/SB1SlideWrapper';
import { MetricCard } from '../pitch-ui/MetricCard';
import { SpeakerNotes } from '../pitch-ui/SpeakerNotes';
import { type Scenario } from '@/lib/sb1-chart-data';
import { SPEAKER_NOTES } from '@/lib/sb1-speaker-notes';

interface SlideQDariaProps {
  scenario: Scenario;
}

export const SlideQDaria: React.FC<SlideQDariaProps> = () => {
  return (
    <SlideWrapper>
      <div className="flex flex-col h-full px-12 py-10">
        <Image src="/logos/QDwordmark2.svg" alt="QDaria" width={140} height={36} className="object-contain mb-2" />

        <SlideTitle
          eyebrow="QDaria AS · Selskap & Lederskap"
          title="Norges eneste kvanteselskap. Publisert forskning. Rigetti-partnerskap."
          subtitle="NQCG ble oppløst desember 2024, QDaria er nå uten direkte norsk konkurranse. Vi kombinerer kvantum-hardware, post-kvantum krypto og regulatorisk ekspertise i ett selskap."
          accentColor="#22D3EE"
        />

        <div className="grid grid-cols-5 gap-4 flex-1">
          {/* Left column: CEO + Product portfolio */}
          <div className="col-span-3 flex flex-col gap-3">
            {/* CEO Card */}
            <div
              className="rounded-xl p-5"
              style={{
                background: 'linear-gradient(135deg, rgba(34,211,238,0.06) 0%, rgba(34,211,238,0.02) 100%)',
                border: '1.5px solid rgba(34,211,238,0.4)',
                boxShadow: '0 0 24px rgba(34,211,238,0.15)',
              }}
            >
              <div className="flex items-start gap-4">
                {/* CEO initials avatar */}
                <div
                  className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'rgba(34,211,238,0.1)',
                    border: '1px solid rgba(34,211,238,0.3)',
                  }}
                >
                  <span
                    className="text-lg font-bold"
                    style={{ color: '#22D3EE', fontFamily: "'Fraunces', Georgia, serif" }}
                  >
                    DMH
                  </span>
                </div>
                <div className="flex-1">
                  <p
                    className="text-base font-semibold"
                    style={{ color: '#E2E8F0', fontFamily: "'Fraunces', Georgia, serif" }}
                  >
                    Daniel Mo Houshmand
                  </p>
                  <p
                    className="text-xs mb-3"
                    style={{ color: '#22D3EE', fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    CEO & Grunnlegger — PhD-nivå kvantefysikk + finansiell sektor
                  </p>
                  <div className="space-y-1.5">
                    {[
                      'Publisert forskning: Quantum Reservoir Computing (QRC) med eksperimenter pa Rigetti 156-qubit Heron-prosessor',
                      'Rigetti-partnerskap: Mike Piech (VP) deltar pa neste SB1-mote',
                      'Norges eneste: NQCG opplost des. 2024 — QDaria uten direkte norsk konkurranse',
                      'Forste kommersielle kvantemaskin-tilgang i Norge (via Rigetti QCaaS)',
                      'Dobbel kompetanse: PhD-niva kvantefysikk + finansiell sektor — ekstremt sjeldent globalt',
                      '"En av de mest kompetente i Skandinavia, om ikke Europa" — anerkjent i bransjen',
                      'Global IP-struktur: 6 jurisdiksjoner (Oslo HQ, Sveits IP, Delaware US, Singapore APAC, UAE MENA, Malta iGaming)',
                      'Gjor Norge kvanteklar: QDaria.com er visjonen om norsk kvantumledelse',
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2">
                        <span
                          className="text-xs mt-0.5 flex-shrink-0"
                          style={{ color: '#22D3EE' }}
                        >
                          &#9656;
                        </span>
                        <p
                          className="text-xs leading-snug"
                          style={{ color: '#CBD5E1', fontFamily: "'DM Sans', sans-serif" }}
                        >
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Product portfolio */}
            <div>
              <p
                className="text-xs font-mono tracking-widest uppercase mb-2 opacity-90"
                style={{ color: '#22D3EE', fontFamily: "'JetBrains Mono', monospace" }}
              >
                Produktportefølje
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { product: 'Zipminator', tag: 'Beta-klar', desc: 'PQC super-app — kryptering for App Store, Android og Desktop', color: '#FB7185' },
                  { product: 'QCaaS / QCaaP', tag: 'Live via Rigetti', desc: 'Quantum Computing as a Service — 156-qubit Heron-prosessor', color: '#22D3EE' },
                  { product: 'Qm9 (Fintech)', tag: 'Utvikling', desc: 'Kvantum-drevet portefølje, prising og risikovurdering', color: '#F59E0B' },
                  { product: 'QDiana (Edtech)', tag: 'Live', desc: 'Kvantumutdanning og kompetansebygging for norsk næringsliv', color: '#34D399' },
                ].map((p) => (
                  <div
                    key={p.product}
                    className="rounded p-2.5 flex flex-col gap-1"
                    style={{ background: `${p.color}06`, border: `1px solid ${p.color}20`, boxShadow: `0 0 12px ${p.color}08` }}
                  >
                    <div className="flex items-center gap-2">
                      {p.product === 'Zipminator' ? (
                        <Image src="/logos/Zipminator_0_light.svg" alt="Zipminator" width={120} height={20} className="object-contain" />
                      ) : (
                        <span
                          className="text-sm font-semibold"
                          style={{ color: '#E2E8F0', fontFamily: "'Fraunces', Georgia, serif" }}
                        >
                          {p.product}
                        </span>
                      )}
                      <span
                        className="text-xs font-mono px-1.5 py-0.5 rounded"
                        style={{ color: p.color, background: `${p.color}15`, fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {p.tag}
                      </span>
                    </div>
                    <p
                      className="text-slate-400 text-xs leading-snug"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {p.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: Competitive table + Key metrics */}
          <div className="col-span-2 flex flex-col gap-3">
            {/* Competitive advantage table */}
            <div className="flex-1">
              <p
                className="text-xs font-mono tracking-widest uppercase mb-2 opacity-90"
                style={{ color: '#22D3EE', fontFamily: "'JetBrains Mono', monospace" }}
              >
                Konkurransefortrinn
              </p>
              <div
                className="rounded-lg overflow-hidden"
                style={{ border: '1px solid rgba(34,211,238,0.3)', boxShadow: '0 0 20px rgba(34,211,238,0.08)' }}
              >
                {/* Header */}
                <div
                  className="grid grid-cols-3 px-3 py-1.5"
                  style={{ background: 'rgba(34,211,238,0.06)', borderBottom: '1px solid rgba(34,211,238,0.1)' }}
                >
                  <span className="text-xs font-mono text-slate-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Dimensjon</span>
                  <span className="text-xs font-mono text-cyan-400 text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>QDaria</span>
                  <span className="text-xs font-mono text-slate-300 text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Globale</span>
                </div>
                {[
                  { dim: 'Norsk regulatorisk', qdaria: '✓ DORA-ekspert', global: '✗' },
                  { dim: 'Kvantum-hardware', qdaria: '✓ Rigetti-partner', global: '✓ IBM/IonQ' },
                  { dim: 'PQC + QCaaS samlet', qdaria: '✓ Ett selskap', global: 'Sjelden' },
                  { dim: 'Publisert forskning', qdaria: '✓ QRC 156Q', global: 'Varierende' },
                  { dim: 'Tid til pilot', qdaria: '3 mnd.', global: '6-18 mnd.' },
                  { dim: 'CAPEX-krav', qdaria: 'NOK 0 (SaaS)', global: 'Varierende' },
                  { dim: 'CEO kvantum-PhD', qdaria: '✓', global: 'Sjelden' },
                ].map((row) => (
                  <div
                    key={row.dim}
                    className="grid grid-cols-3 px-3 py-1.5 border-b"
                    style={{ borderColor: 'rgba(34,211,238,0.2)' }}
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
                      className="text-slate-400 text-xs font-mono text-center"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {row.global}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key metrics strip */}
            <div className="grid grid-cols-2 gap-2">
              <MetricCard value="1" label="Norsk kvanteselskap" sublabel="NQCG oppløst des. 2024" color="cyan" />
              <MetricCard value="156Q" label="Rigetti Heron" sublabel="QRC publisert forskning" color="amber" />
              <MetricCard value="6" label="Jurisdiksjoner" sublabel="Global IP-struktur" color="emerald" />
              <MetricCard value="$12M" label="Seed-runde" sublabel="Intern verdsettelse" color="rose" />
            </div>
          </div>
        </div>
      </div>
      <SpeakerNotes notes={SPEAKER_NOTES[10]} />
    </SlideWrapper>
  );
};
