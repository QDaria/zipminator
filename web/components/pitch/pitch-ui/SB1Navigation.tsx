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
      className="flex items-center justify-between px-6 py-3 border-t select-none shrink-0"
      style={{
        borderColor: 'rgba(34,211,238,0.12)',
        background: 'rgba(2,8,23,0.95)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Center: slide dots + title */}
      <div className="flex items-center gap-4 flex-1 justify-center">
        <span
          className="text-slate-400 text-xs font-mono hidden md:block"
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
                width: i === current ? '24px' : '8px',
                height: '8px',
                background: i === current
                  ? '#22D3EE'
                  : i < current
                  ? 'rgba(34,211,238,0.4)'
                  : 'rgba(148,163,184,0.25)',
                opacity: i === current ? 1 : 0.7,
                boxShadow: i === current ? '0 0 8px rgba(34,211,238,0.5)' : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-3">
        <span
          className="text-slate-400 text-sm font-mono"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        <div className="flex gap-1.5">
          <button
            onClick={onPrev}
            disabled={current === 0}
            className="w-9 h-9 rounded flex items-center justify-center transition-all duration-200 disabled:opacity-20 text-sm"
            style={{
              background: 'rgba(34,211,238,0.1)',
              border: '1px solid rgba(34,211,238,0.3)',
              color: '#22D3EE',
            }}
          >
            ←
          </button>
          <button
            onClick={onNext}
            disabled={current === total - 1}
            className="w-9 h-9 rounded flex items-center justify-center transition-all duration-200 disabled:opacity-20 text-sm"
            style={{
              background: 'rgba(34,211,238,0.1)',
              border: '1px solid rgba(34,211,238,0.3)',
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
