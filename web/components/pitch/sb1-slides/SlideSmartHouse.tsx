'use client';

import React from 'react';
import { SlideWrapper, SlideTitle } from '../pitch-ui/SB1SlideWrapper';
import { MetricCard, Tag } from '../pitch-ui/MetricCard';
import { SpeakerNotes } from '../pitch-ui/SpeakerNotes';
import { type Scenario } from '@/lib/sb1-chart-data';
import { SPEAKER_NOTES } from '@/lib/sb1-speaker-notes';

interface SlideSmartHouseProps {
  scenario: Scenario;
}

const physicalCryptoLayers = [
  {
    name: 'WiFi DensePose',
    desc: 'Persondeteksjon, pust, hjerteslag og bevegelse gjennom vegger via WiFi CSI-signaler. Ingen kameraer, ingen wearables, intet internett.',
    color: '#22D3EE',
    icon: '◉',
  },
  {
    name: 'PUEK (Physical Unclonable Key)',
    desc: 'Krypteringsnokler derivert fra rommets elektromagnetiske egensignatur. Nokler er stedsbundne og ikke-kopierbare.',
    color: '#A78BFA',
    icon: '◈',
  },
  {
    name: 'Vital-Sign Auth',
    desc: 'Kontinuerlig autentisering via biometrisk profil (pust, puls). Automatisk sesjonskutt ved anomali.',
    color: '#34D399',
    icon: '♡',
  },
  {
    name: 'EM Canary',
    desc: 'Elektromagnetisk anomalideteksjon som trigger automatisk nokkelrotasjon ved avlyttingsforsok.',
    color: '#FB7185',
    icon: '▲',
  },
];

const useCases = [
  { sector: 'Helsevesen', use: 'Vitaltegnovervaking uten kameraer, falldeteksjon, pustemonitorering', icon: '♡' },
  { sector: 'Forsvar', use: 'Gjennom-vegg personellsporing, sikkerhetssoner, inntrengingsdeteksjon', icon: '◉' },
  { sector: 'Eldreomsorg', use: 'Sovnanalyse, aktivitetsmonitorering, medisinpaminnelser uten wearables', icon: '◈' },
  { sector: 'Smart bygg', use: 'Energioptimalisering, rombruk, sikkerhet uten IoT-enheter', icon: '▲' },
];

export const SlideSmartHouse: React.FC<SlideSmartHouseProps> = () => {
  return (
    <SlideWrapper>
      <div className="flex flex-col h-full px-12 py-10">
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-xs font-mono text-emerald-400 tracking-wider uppercase"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Spinoff · QDaria Smart House
          </span>
          <Tag color="emerald">RuView · Fysisk kryptografi · ESP32 Mesh</Tag>
        </div>

        <SlideTitle
          eyebrow="RuView × Zipminator — Physical Cryptography"
          title="WiFi-sensing + kvantumkrypto = usynlig sikkerhet."
          subtitle="RuView bruker ESP32-S3 mesh-nettverk til a se mennesker gjennom vegger via WiFi-signaler. Kombinert med Zipminator QRNG-entropi og PQC gir dette verdens forste Physical Cryptography Stack."
          accentColor="#34D399"
        />

        <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
          {/* Left: Physical Crypto Stack */}
          <div className="col-span-7 flex flex-col gap-3">
            <p
              className="text-emerald-400 text-xs font-mono tracking-wider uppercase"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Physical Cryptography Stack — 4 lag
            </p>
            <div className="space-y-2">
              {physicalCryptoLayers.map((layer) => (
                <div
                  key={layer.name}
                  className="rounded-lg p-3 flex gap-3 items-start"
                  style={{
                    background: `${layer.color}06`,
                    border: `1px solid ${layer.color}20`,
                    boxShadow: `0 0 12px ${layer.color}08`,
                  }}
                >
                  <span
                    className="text-lg mt-0.5 shrink-0"
                    style={{ color: layer.color }}
                  >
                    {layer.icon}
                  </span>
                  <div className="flex-1">
                    <span
                      className="text-xs font-mono font-semibold"
                      style={{ color: layer.color, fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {layer.name}
                    </span>
                    <p
                      className="text-xs text-slate-400 leading-snug mt-0.5"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {layer.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tech badges */}
            <div className="flex flex-wrap gap-1.5 mt-auto">
              {['ESP32-S3 CSI', 'WiFi 802.11n', 'QRNG Entropi', 'ML-KEM-768', 'HMAC-SHA256', 'SipHash-2-4', 'Mesh Protocol', '1300+ tester'].map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-mono px-2 py-1 rounded"
                  style={{
                    color: '#34D399',
                    background: 'rgba(52,211,153,0.08)',
                    border: '1px solid rgba(52,211,153,0.2)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Use cases + SB1 relevance + metrics */}
          <div className="col-span-5 flex flex-col gap-3">
            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2">
              <MetricCard value="$8B" label="Smart Home Security" sublabel="Mordor Intelligence 2030" color="emerald" />
              <MetricCard value="0" label="Kameraer krevet" sublabel="Kamerafri overvaking" color="cyan" />
            </div>

            {/* Use cases */}
            <div
              className="rounded-lg overflow-hidden flex-1"
              style={{ border: '1px solid rgba(52,211,153,0.3)', boxShadow: '0 0 20px rgba(52,211,153,0.08)' }}
            >
              <div
                className="px-4 py-2.5 border-b"
                style={{ background: 'rgba(52,211,153,0.06)', borderColor: 'rgba(52,211,153,0.15)' }}
              >
                <span
                  className="text-emerald-400 text-xs font-mono tracking-wider uppercase"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Bruksomrader
                </span>
              </div>
              <div className="p-3 space-y-2">
                {useCases.map((uc) => (
                  <div key={uc.sector} className="flex gap-2 items-start">
                    <span className="text-emerald-400 text-sm shrink-0">{uc.icon}</span>
                    <div>
                      <span
                        className="text-xs font-mono text-emerald-400"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {uc.sector}
                      </span>
                      <p
                        className="text-xs text-slate-400 leading-snug"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {uc.use}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SB1 connection — Geir's domain */}
            <div
              className="rounded-lg p-3"
              style={{
                background: 'linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(245,158,11,0.06) 100%)',
                border: '1px solid rgba(52,211,153,0.3)',
                boxShadow: '0 0 20px rgba(52,211,153,0.12)',
              }}
            >
              <p
                className="text-emerald-400 text-xs font-mono tracking-wider uppercase mb-1.5"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                SB1-relevans — eiendomsfinansiering
              </p>
              <p
                className="text-slate-300 text-xs leading-snug"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                SpareBank 1 Markets Real Estate (Geir) finansierer smarte bygg.
                QDaria Smart House leverer sikkerhet uten kameraer: vitaltegn,
                tilstedevarelse og inntrengingsdeteksjon via WiFi. Relevant for
                sykehjem, forsvarsobjekter og nybygde leiligheter.
              </p>
            </div>
          </div>
        </div>
      </div>

      <SpeakerNotes notes={SPEAKER_NOTES[103]} />
    </SlideWrapper>
  );
};
