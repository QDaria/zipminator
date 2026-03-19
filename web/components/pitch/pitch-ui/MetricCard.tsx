'use client';

import React from 'react';

interface MetricCardProps {
  value: string;
  label: string;
  sublabel?: string;
  color?: 'cyan' | 'amber' | 'rose' | 'emerald' | 'slate';
  size?: 'sm' | 'md' | 'lg';
  source?: string;
}

const colorMap = {
  cyan:    { text: '#22D3EE', border: 'rgba(34,211,238,0.2)',  bg: 'rgba(34,211,238,0.05)'  },
  amber:   { text: '#F59E0B', border: 'rgba(245,158,11,0.2)', bg: 'rgba(245,158,11,0.05)' },
  rose:    { text: '#FB7185', border: 'rgba(251,113,133,0.2)',bg: 'rgba(251,113,133,0.05)' },
  emerald: { text: '#34D399', border: 'rgba(52,211,153,0.2)', bg: 'rgba(52,211,153,0.05)'  },
  slate:   { text: '#94A3B8', border: 'rgba(148,163,184,0.2)',bg: 'rgba(148,163,184,0.05)' },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  value,
  label,
  sublabel,
  color = 'cyan',
  size = 'md',
  source,
}) => {
  const c = colorMap[color];
  const valueSize = size === 'lg' ? 'text-4xl lg:text-5xl' : size === 'md' ? 'text-3xl lg:text-4xl' : 'text-2xl';

  return (
    <div
      className="rounded-lg p-5 flex flex-col gap-1 relative overflow-hidden"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${c.text}, transparent)` }}
      />
      <span
        className={`${valueSize} font-bold tracking-tight leading-none`}
        style={{ color: c.text, fontFamily: "'JetBrains Mono', monospace" }}
      >
        {value}
      </span>
      <span
        className="text-slate-300 text-sm font-medium leading-snug mt-1"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {label}
      </span>
      {sublabel && (
        <span
          className="text-slate-500 text-xs leading-snug"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {sublabel}
        </span>
      )}
      {source && (
        <span
          className="text-slate-600 text-[10px] mt-1 font-mono"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          src: {source}
        </span>
      )}
    </div>
  );
};

interface DataRowProps {
  label: string;
  value: string;
  accent?: string;
  highlight?: boolean;
}

export const DataRow: React.FC<DataRowProps> = ({
  label,
  value,
  accent = '#22D3EE',
  highlight = false,
}) => (
  <div
    className={`flex justify-between items-center py-2.5 px-4 rounded ${
      highlight ? 'bg-slate-800/60' : 'border-b border-slate-800/50'
    }`}
  >
    <span
      className="text-slate-400 text-sm"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {label}
    </span>
    <span
      className="text-sm font-mono font-semibold"
      style={{ color: highlight ? accent : '#F1F5F9', fontFamily: "'JetBrains Mono', monospace" }}
    >
      {value}
    </span>
  </div>
);

interface TagProps {
  children: React.ReactNode;
  color?: 'cyan' | 'amber' | 'rose' | 'emerald';
}

export const Tag: React.FC<TagProps> = ({ children, color = 'cyan' }) => {
  const c = colorMap[color];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-medium"
      style={{
        color: c.text,
        background: c.bg,
        border: `1px solid ${c.border}`,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {children}
    </span>
  );
};
