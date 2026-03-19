'use client';

import React from 'react';

interface NavigationProps {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (index: number) => void;
  slideTitle: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  current,
  total,
  onPrev,
  onNext,
  onGoTo,
  slideTitle,
}) => {
  return (
    <div
      className="flex items-center justify-between px-8 py-4 border-t select-none"
      style={{
        borderColor: 'rgba(34,211,238,0.12)',
        background: 'rgba(2,8,23,0.9)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Left: branding */}
      <div className="flex items-center gap-3">
        <div
          className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
          style={{
            background: 'rgba(34,211,238,0.15)',
            border: '1px solid rgba(34,211,238,0.4)',
            color: '#22D3EE',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Q
        </div>
        <span
          className="text-slate-500 text-xs font-mono hidden sm:block"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          QDaria × SpareBank 1 · Konfidensielt
        </span>
      </div>

      {/* Center: slide dots + title */}
      <div className="flex flex-col items-center gap-1.5">
        <span
          className="text-slate-500 text-[10px] font-mono text-center hidden md:block"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {slideTitle}
        </span>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              onClick={() => onGoTo(i)}
              className="rounded-full transition-all duration-300 hover:opacity-100"
              style={{
                width: i === current ? '20px' : '6px',
                height: '6px',
                background: i === current
                  ? '#22D3EE'
                  : i < current
                  ? 'rgba(34,211,238,0.4)'
                  : 'rgba(148,163,184,0.2)',
                opacity: i === current ? 1 : 0.7,
              }}
            />
          ))}
        </div>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-3">
        <span
          className="text-slate-600 text-xs font-mono"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        <div className="flex gap-1">
          <button
            onClick={onPrev}
            disabled={current === 0}
            className="w-8 h-8 rounded flex items-center justify-center transition-all duration-200 disabled:opacity-20"
            style={{
              background: 'rgba(34,211,238,0.1)',
              border: '1px solid rgba(34,211,238,0.2)',
              color: '#22D3EE',
            }}
          >
            ←
          </button>
          <button
            onClick={onNext}
            disabled={current === total - 1}
            className="w-8 h-8 rounded flex items-center justify-center transition-all duration-200 disabled:opacity-20"
            style={{
              background: 'rgba(34,211,238,0.1)',
              border: '1px solid rgba(34,211,238,0.2)',
              color: '#22D3EE',
            }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};
