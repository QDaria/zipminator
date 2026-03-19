'use client';

import React, { useState } from 'react';

interface SpeakerNotesProps {
  notes: string;
}

export const SpeakerNotes: React.FC<SpeakerNotesProps> = ({ notes }) => {
  const [open, setOpen] = useState(false);

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
                <strong key={j} className="text-slate-100 font-semibold">
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
      style={{ borderColor: 'rgba(34,211,238,0.15)' }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-8 py-3 transition-colors"
        style={{
          background: open ? 'rgba(34,211,238,0.05)' : 'transparent',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: open ? '#22D3EE' : '#475569' }}
          />
          <span
            className="text-sm font-mono tracking-wider uppercase"
            style={{
              color: open ? '#22D3EE' : '#64748B',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Foredragsnotater
          </span>
        </div>
        <span
          className="text-base transition-transform duration-200"
          style={{
            color: open ? '#22D3EE' : '#64748B',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▾
        </span>
      </button>
      {open && (
        <div
          className="px-8 pb-4 max-h-56 overflow-y-auto"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(34,211,238,0.2) transparent',
            background: 'rgba(15,22,41,0.5)',
          }}
        >
          {renderNotes(notes)}
        </div>
      )}
    </div>
  );
};
