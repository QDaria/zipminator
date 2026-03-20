'use client';

import React, { useState } from 'react';

interface SpeakerNotesProps {
  notes: string;
}

export const SpeakerNotes: React.FC<SpeakerNotesProps> = ({ notes }) => {
  const [open, setOpen] = useState(true);

  if (!notes) return null;

  const renderNotes = (text: string) => {
    return text.split('\n\n').map((para, i) => {
      const parts = para.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p
          key={i}
          className="text-slate-300 text-sm leading-relaxed mb-2 last:mb-0"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={j} className="text-cyan-300 font-semibold">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <React.Fragment key={j}>{part}</React.Fragment>;
          })}
        </p>
      );
    });
  };

  return (
    <div
      className="border-t shrink-0"
      style={{
        borderColor: 'rgba(34,211,238,0.2)',
        background: 'rgba(15,22,41,0.6)',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-8 py-3 transition-colors hover:bg-slate-800/30"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-5 h-5 rounded flex items-center justify-center text-[10px]"
            style={{
              background: 'rgba(34,211,238,0.15)',
              border: '1px solid rgba(34,211,238,0.4)',
              color: '#22D3EE',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            N
          </div>
          <span
            className="text-sm font-mono tracking-wider uppercase font-medium"
            style={{
              color: '#22D3EE',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Foredragsnotater
          </span>
        </div>
        <span
          className="text-lg transition-transform duration-200"
          style={{
            color: '#22D3EE',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▾
        </span>
      </button>
      {open && (
        <div
          className="px-8 pb-5 max-h-64 overflow-y-auto"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(34,211,238,0.3) transparent',
          }}
        >
          {renderNotes(notes)}
        </div>
      )}
    </div>
  );
};
