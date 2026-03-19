'use client';

import React from 'react';

interface ChartCardProps {
  title: string;
  source?: string;
  accentColor?: string;
  children: React.ReactNode;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  source,
  accentColor = '#22D3EE',
  children,
  className = '',
}) => {
  return (
    <div
      className={`rounded-lg overflow-hidden ${className}`}
      style={{
        background: `${accentColor}06`,
        border: `1px solid ${accentColor}25`,
      }}
    >
      <div
        className="px-4 py-2.5 flex items-center justify-between border-b"
        style={{
          borderColor: `${accentColor}20`,
          background: `${accentColor}08`,
        }}
      >
        <span
          className="text-xs font-mono tracking-wider uppercase"
          style={{ color: accentColor, fontFamily: "'JetBrains Mono', monospace" }}
        >
          {title}
        </span>
        {source && (
          <span
            className="text-slate-600 text-[10px] font-mono"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            src: {source}
          </span>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
};
