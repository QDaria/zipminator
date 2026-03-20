'use client';

import React from 'react';
import Image from 'next/image';

interface SB1SidebarProps {
  slides: { id: number; title: string }[];
  current: number;
  onGoTo: (index: number) => void;
}

export const SB1Sidebar: React.FC<SB1SidebarProps> = ({ slides, current, onGoTo }) => {
  return (
    <div
      className="w-[220px] shrink-0 flex flex-col border-r overflow-y-auto select-none"
      style={{
        background: 'rgba(2,8,23,0.95)',
        borderColor: 'rgba(34,211,238,0.12)',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(34,211,238,0.2) transparent',
      }}
    >
      {/* Brand header */}
      <div
        className="px-4 py-4 border-b shrink-0"
        style={{ borderColor: 'rgba(34,211,238,0.1)' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Image src="/logos/QDwordmark2.svg" alt="QDaria" width={90} height={23} className="object-contain" />
          <p
            className="text-slate-500 text-[10px] font-mono leading-tight"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            × SpareBank 1
          </p>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          <span
            className="text-rose-400 text-[9px] font-mono tracking-wider"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            KONFIDENSIELT
          </span>
        </div>
      </div>

      {/* Slide list */}
      <div className="flex-1 py-2">
        {slides.map((slide) => {
          const isActive = slide.id === current;
          return (
            <button
              key={slide.id}
              onClick={() => onGoTo(slide.id)}
              className="w-full text-left px-4 py-2.5 flex items-start gap-2.5 transition-all duration-200 hover:bg-slate-800/40"
              style={{
                background: isActive ? 'rgba(34,211,238,0.08)' : 'transparent',
                borderLeft: isActive
                  ? '2px solid #22D3EE'
                  : '2px solid transparent',
              }}
            >
              <span
                className="text-[10px] font-mono mt-0.5 shrink-0 w-4 text-right"
                style={{
                  color: isActive ? '#22D3EE' : '#475569',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {String(slide.id + 1).padStart(2, '0')}
              </span>
              <span
                className="text-xs leading-snug"
                style={{
                  color: isActive ? '#E2E8F0' : '#94A3B8',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {slide.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="px-4 py-3 border-t shrink-0"
        style={{ borderColor: 'rgba(34,211,238,0.08)' }}
      >
        <p
          className="text-slate-600 text-[9px] font-mono"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Mars 2026 · TMT Investment Banking
        </p>
      </div>
    </div>
  );
};
