'use client';

import React from 'react';

export const SlideTitle: React.FC = () => {
  return (
    <div className="flex flex-col h-full px-10 py-10 justify-between">
      {/* Top bar */}
      <div className="flex justify-between items-start">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded"
          style={{
            background: 'rgba(225,29,72,0.1)',
            border: '1px solid rgba(225,29,72,0.3)',
          }}
        >
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span
            className="text-rose-400 text-xs font-mono tracking-wider"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            KONFIDENSIELT · TMT INVESTMENT BANKING
          </span>
        </div>
        <div className="text-right">
          <p
            className="text-slate-500 text-xs font-mono"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Mars 2026
          </p>
          <p
            className="text-slate-600 text-xs font-mono"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            SpareBank 1 Markets
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-start">
        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="h-px w-12"
            style={{ background: '#22D3EE' }}
          />
          <span
            className="text-xs font-mono tracking-widest uppercase"
            style={{ color: '#22D3EE', fontFamily: "'JetBrains Mono', monospace" }}
          >
            Kvanteteknologi for finanssektoren
          </span>
        </div>

        {/* Title */}
        <h1
          className="text-5xl lg:text-7xl font-semibold text-slate-50 leading-[1.05] mb-4"
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          Norges{' '}
          <span style={{ color: '#22D3EE' }}>kvantesprong</span>
          <br />
          begynner her.
        </h1>

        {/* Subtitle */}
        <p
          className="text-slate-400 text-lg leading-relaxed max-w-2xl mb-8"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Fem business cases der QDaria og SpareBank 1 skriver norsk
          finanshistorie — og hvorfor compliance allerede teller ned.
        </p>

        {/* Companies */}
        <div className="flex items-center gap-6">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded"
            style={{
              background: 'rgba(34,211,238,0.08)',
              border: '1px solid rgba(34,211,238,0.25)',
            }}
          >
            <div
              className="w-7 h-7 rounded flex items-center justify-center font-bold text-sm"
              style={{
                background: 'rgba(34,211,238,0.2)',
                color: '#22D3EE',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Q
            </div>
            <span
              className="text-slate-200 text-sm font-medium"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              QDaria AS
            </span>
          </div>
          <div
            className="text-slate-600 text-lg"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            ×
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded"
            style={{
              background: 'rgba(225,29,72,0.08)',
              border: '1px solid rgba(225,29,72,0.25)',
            }}
          >
            <div
              className="w-7 h-7 rounded flex items-center justify-center font-bold text-sm"
              style={{
                background: 'rgba(225,29,72,0.2)',
                color: '#FB7185',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              SB
            </div>
            <span
              className="text-slate-200 text-sm font-medium"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              SpareBank 1
            </span>
          </div>
        </div>
      </div>

      {/* Bottom stats */}
      <div
        className="grid grid-cols-3 gap-4 pt-6 border-t"
        style={{ borderColor: 'rgba(34,211,238,0.12)' }}
      >
        {[
          { value: '5', label: 'Business cases', sub: 'spesialtilpasset SB1' },
          { value: '1. juli 2025', label: 'DORA i kraft', sub: 'Norsk regulatorisk deadline' },
          { value: 'NOK 625 mrd.', label: 'SB1 forvaltningskapital', sub: '13 banker · 14 systemer' },
        ].map((s) => (
          <div key={s.value} className="flex flex-col">
            <span
              className="text-xl font-bold"
              style={{ color: '#22D3EE', fontFamily: "'JetBrains Mono', monospace" }}
            >
              {s.value}
            </span>
            <span
              className="text-slate-300 text-xs font-medium"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {s.label}
            </span>
            <span
              className="text-slate-600 text-[10px]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {s.sub}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
