'use client';

import React from 'react';
import type { Scenario } from '@/lib/sb1-chart-data';

interface ScenarioToggleProps {
  value: Scenario;
  onChange: (scenario: Scenario) => void;
}

const scenarios: { key: Scenario; label: string; color: string }[] = [
  { key: 'konservativ', label: 'Konservativ', color: '#22D3EE' },
  { key: 'base', label: 'Base', color: '#F59E0B' },
  { key: 'oppside', label: 'Oppside', color: '#34D399' },
];

export const ScenarioToggle: React.FC<ScenarioToggleProps> = ({ value, onChange }) => {
  return (
    <div
      className="inline-flex items-center rounded-lg p-0.5 gap-0.5"
      style={{
        background: 'rgba(15,22,41,0.8)',
        border: '1px solid rgba(34,211,238,0.25)',
        boxShadow: '0 0 12px rgba(34,211,238,0.06)',
      }}
    >
      {scenarios.map((s) => {
        const active = value === s.key;
        return (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            className="px-3 py-1.5 rounded-md text-sm font-mono transition-all duration-200"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              background: active ? `${s.color}20` : 'transparent',
              color: active ? s.color : '#64748B',
              border: active ? `1px solid ${s.color}40` : '1px solid transparent',
            }}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
};
