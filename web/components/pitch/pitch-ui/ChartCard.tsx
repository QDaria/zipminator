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
        background: `${accentColor}0A`,
        border: `1px solid ${accentColor}40`,
        boxShadow: `0 0 16px ${accentColor}10`,
      }}
    >
      <div
        className="px-4 py-3 flex items-center justify-between border-b"
        style={{
          borderColor: `${accentColor}30`,
          background: `${accentColor}0C`,
        }}
      >
        <span
          className="text-sm font-mono tracking-wider uppercase"
          style={{ color: accentColor, fontFamily: "'JetBrains Mono', monospace" }}
        >
          {title}
        </span>
        {source && (
          <span
            className="text-slate-500 text-xs font-mono"
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
