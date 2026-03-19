'use client';

import React from 'react';
import { SlideWrapper, SlideTitle } from '../pitch-ui/SB1SlideWrapper';
import { MetricCard } from '../pitch-ui/MetricCard';

export const SlideThreat: React.FC = () => {
  return (
    <SlideWrapper>
      <div className="flex flex-col h-full px-10 py-8">
        <SlideTitle
          eyebrow="Trusselbilde · Q-Day"
          title="RSA er allerede kompromittert."
          subtitle="Statlige aktører høster krypterte data i dag — med plan om å dekryptere dem når en kraftig nok kvantedatamaskin er klar. Det kalles 'Harvest Now, Decrypt Later', og det pågår nå."
          accentColor="#FB7185"
        />

        <div className="grid grid-cols-3 gap-5 mb-6">
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
        </div>

        <div className="grid grid-cols-2 gap-5 flex-1">
          {/* Left: The attack explained */}
          <div
            className="rounded-lg p-5"
            style={{
              background: 'rgba(251,113,133,0.05)',
              border: '1px solid rgba(251,113,133,0.2)',
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"
              />
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
                { step: '01', text: 'Statlig aktør fanger opp kryptert nettbanktrafikk, BankID-sesjoner og inter-bankdokumenter' },
                { step: '02', text: 'Dataene lagres i kryptert form — ubrukelige i dag, men beregnet for fremtidig dekryptering' },
                { step: '03', text: 'Rundt 2030–2035 brukes en kvantedatamaskin til å bryte RSA/ECC og lese alt historisk data' },
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
          </div>

          {/* Right: Exposure window */}
          <div
            className="rounded-lg p-5"
            style={{
              background: 'rgba(245,158,11,0.05)',
              border: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            <span
              className="text-amber-400 text-xs font-mono tracking-wider uppercase"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Mosca's Theorem · SpareBank 1
            </span>
            <h3
              className="text-slate-200 text-lg font-semibold mt-2 mb-4"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Eksponeringsvinduet er åpent nå
            </h3>
            <div className="space-y-2.5">
              {[
                { label: 'Regulatorisk datalagringsplikt', value: '7–10 år', highlight: true },
                { label: 'PQC-migrasjonstid (estimat)', value: '3–5 år', highlight: false },
                { label: 'Tid til Q-Day (median expert)', value: '~8 år', highlight: false },
                { label: 'Gap: data allerede i fare', value: 'JA', highlight: true, danger: true },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between items-center py-2 px-3 rounded"
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
            <p
              className="text-slate-500 text-xs mt-4 leading-relaxed"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Finanstilsynet registrerte <strong className="text-slate-400">365 alvorlige IKT-hendelser</strong> i norsk finanssektor i 2024. Svindelanmeldelser +51% i 2023 til NOK 928 mill.
            </p>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
};
