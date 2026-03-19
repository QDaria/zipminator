'use client';

import React, { useState } from 'react';

interface SpeakerNotesProps {
  notes: string;
}

export const SpeakerNotes: React.FC<SpeakerNotesProps> = ({ notes }) => {
  const [open, setOpen] = useState(false);

  if (!notes) return null;

  // Simple markdown-ish rendering: **bold** and line breaks
  const renderNotes = (text: string) => {
    return text.split('\n\n').map((para, i) => {
      const parts = para.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p
          key={i}
          className="text-slate-400 text-xs leading-relaxed mb-2 last:mb-0"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={j} className="text-slate-200 font-semibold">
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
      className="border-t transition-all duration-300"
      style={{ borderColor: 'rgba(34,211,238,0.1)' }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-2 hover:bg-slate-800/30 transition-colors"
      >
        <span
          className="text-slate-500 text-[10px] font-mono tracking-wider uppercase"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Foredragsnotater
        </span>
        <span
          className="text-slate-600 text-xs transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▾
        </span>
      </button>
      {open && (
        <div
          className="px-6 pb-4 max-h-48 overflow-y-auto"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(34,211,238,0.2) transparent' }}
        >
          {renderNotes(notes)}
        </div>
      )}
    </div>
  );
};
