'use client';

import React, { useState } from 'react';

interface SlideTabsProps {
  tabs: string[];
  children: React.ReactNode[];
  accentColor?: string;
}

const COLORS: Record<string, { active: string; border: string; bg: string }> = {
  '#22D3EE': { active: 'rgba(34,211,238,1)', border: 'rgba(34,211,238,0.3)', bg: 'rgba(34,211,238,0.08)' },
  '#FB7185': { active: 'rgba(251,113,133,1)', border: 'rgba(251,113,133,0.3)', bg: 'rgba(251,113,133,0.08)' },
  '#F59E0B': { active: 'rgba(245,158,11,1)', border: 'rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.08)' },
  '#34D399': { active: 'rgba(52,211,153,1)', border: 'rgba(52,211,153,0.3)', bg: 'rgba(52,211,153,0.08)' },
  '#A78BFA': { active: 'rgba(167,139,250,1)', border: 'rgba(167,139,250,0.3)', bg: 'rgba(167,139,250,0.08)' },
};

export const SlideTabs: React.FC<SlideTabsProps> = ({
  tabs,
  children,
  accentColor = '#22D3EE',
}) => {
  const [active, setActive] = useState(0);
  const c = COLORS[accentColor] ?? COLORS['#22D3EE'];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Tab strip */}
      <div
        className="flex gap-1 mb-4 p-1 rounded-lg self-start"
        style={{ background: 'rgba(15,22,41,0.6)', border: `1px solid ${c.border}` }}
      >
        {tabs.map((label, i) => (
          <button
            key={label}
            onClick={() => setActive(i)}
            className="px-3 py-1.5 rounded text-xs font-mono transition-all duration-150"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: active === i ? '#020817' : '#94A3B8',
              background: active === i ? c.active : 'transparent',
              fontWeight: active === i ? 600 : 400,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0">
        {children[active]}
      </div>
    </div>
  );
};
