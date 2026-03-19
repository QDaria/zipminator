'use client';

import React from 'react';
import type { Scenario } from '@/lib/sb1-chart-data';
import { AnimatedCounter } from '../pitch-ui/AnimatedCounter';
import { SpeakerNotes } from '../pitch-ui/SpeakerNotes';
import { SPEAKER_NOTES } from '@/lib/sb1-speaker-notes';

interface SlideTitleProps {
  scenario: Scenario;
}

export const SlideTitle: React.FC<SlideTitleProps> = ({ scenario: _scenario }) => {
  return (
    <div className="flex flex-col h-full justify-between" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Particle/grid background */}
      <style>{`
        @keyframes float-dot-1 {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.25; }
          50% { transform: translateY(-18px) translateX(8px); opacity: 0.5; }
        }
        @keyframes float-dot-2 {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.15; }
          33% { transform: translateY(12px) translateX(-10px); opacity: 0.35; }
          66% { transform: translateY(-8px) translateX(6px); opacity: 0.2; }
        }
        @keyframes float-dot-3 {
          0%, 100% { transform: translateY(0px); opacity: 0.2; }
          50% { transform: translateY(-24px); opacity: 0.45; }
        }
        @keyframes pulse-line {
          0%, 100% { opacity: 0.04; }
          50% { opacity: 0.09; }
        }
        .particle-dot-1 { animation: float-dot-1 6s ease-in-out infinite; }
        .particle-dot-2 { animation: float-dot-2 9s ease-in-out infinite; }
        .particle-dot-3 { animation: float-dot-3 7s ease-in-out infinite; }
        .particle-dot-4 { animation: float-dot-1 11s ease-in-out infinite 2s; }
        .particle-dot-5 { animation: float-dot-2 8s ease-in-out infinite 1s; }
        .particle-dot-6 { animation: float-dot-3 10s ease-in-out infinite 3s; }
        .bg-grid-pulse { animation: pulse-line 4s ease-in-out infinite; }
      `}</style>

      {/* Animated grid */}
      <div
        className="absolute inset-0 pointer-events-none bg-grid-pulse"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34,211,238,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,211,238,0.8) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          opacity: 0.04,
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Row 1 */}
        <div className="particle-dot-1 absolute w-1.5 h-1.5 rounded-full" style={{ background: '#22D3EE', top: '12%', left: '8%' }} />
        <div className="particle-dot-2 absolute w-1 h-1 rounded-full" style={{ background: '#F59E0B', top: '18%', left: '25%' }} />
        <div className="particle-dot-3 absolute w-2 h-2 rounded-full" style={{ background: '#22D3EE', top: '8%', left: '55%' }} />
        <div className="particle-dot-4 absolute w-1 h-1 rounded-full" style={{ background: '#A78BFA', top: '15%', left: '75%' }} />
        <div className="particle-dot-5 absolute w-1.5 h-1.5 rounded-full" style={{ background: '#FB7185', top: '10%', left: '90%' }} />
        {/* Row 2 */}
        <div className="particle-dot-6 absolute w-1 h-1 rounded-full" style={{ background: '#34D399', top: '35%', left: '15%' }} />
        <div className="particle-dot-1 absolute w-2 h-2 rounded-full" style={{ background: '#22D3EE', top: '40%', left: '45%' }} />
        <div className="particle-dot-2 absolute w-1 h-1 rounded-full" style={{ background: '#F59E0B', top: '38%', left: '82%' }} />
        {/* Row 3 */}
        <div className="particle-dot-3 absolute w-1.5 h-1.5 rounded-full" style={{ background: '#22D3EE', top: '65%', left: '5%' }} />
        <div className="particle-dot-4 absolute w-1 h-1 rounded-full" style={{ background: '#A78BFA', top: '70%', left: '35%' }} />
        <div className="particle-dot-5 absolute w-2 h-2 rounded-full" style={{ background: '#34D399', top: '62%', left: '65%' }} />
        <div className="particle-dot-6 absolute w-1 h-1 rounded-full" style={{ background: '#FB7185', top: '68%', left: '92%' }} />
        {/* Row 4 */}
        <div className="particle-dot-1 absolute w-1 h-1 rounded-full" style={{ background: '#22D3EE', top: '85%', left: '18%' }} />
        <div className="particle-dot-2 absolute w-1.5 h-1.5 rounded-full" style={{ background: '#F59E0B', top: '88%', left: '50%' }} />
        <div className="particle-dot-3 absolute w-1 h-1 rounded-full" style={{ background: '#22D3EE', top: '82%', left: '78%' }} />
      </div>

      {/* Radial glows */}
      <div
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)' }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full px-10 py-10 justify-between">
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
            <div className="h-px w-12" style={{ background: '#22D3EE' }} />
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
          <div className="flex flex-col">
            <AnimatedCounter
              end={5}
              duration={1200}
              className="text-xl font-bold"
              style={{ color: '#22D3EE', fontFamily: "'JetBrains Mono', monospace" }}
            />
            <span
              className="text-slate-300 text-xs font-medium"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Business cases
            </span>
            <span
              className="text-slate-600 text-[10px]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              spesialtilpasset SB1
            </span>
          </div>
          {[
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

      {/* Speaker notes */}
      <div className="relative z-10">
        <SpeakerNotes notes={SPEAKER_NOTES[0]} />
      </div>
    </div>
  );
};
