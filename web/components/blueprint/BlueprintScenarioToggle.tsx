'use client'

export type BpScenario = 'conservative' | 'moderate' | 'optimistic'

const OPTIONS: { value: BpScenario; label: string; color: string }[] = [
  { value: 'conservative', label: 'Conservative', color: '#22D3EE' },
  { value: 'moderate', label: 'Moderate', color: '#F59E0B' },
  { value: 'optimistic', label: 'Optimistic', color: '#34D399' },
]

interface Props {
  value: BpScenario
  onChange: (v: BpScenario) => void
}

export const BlueprintScenarioToggle = ({ value, onChange }: Props) => (
  <div data-scenario-toggle className="flex gap-1 rounded-lg p-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
    {OPTIONS.map((opt) => {
      const active = value === opt.value
      return (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="px-3 py-1.5 text-xs font-mono rounded-md transition-all duration-200"
          style={{
            background: active ? `${opt.color}22` : 'transparent',
            color: active ? opt.color : '#9ca3af',
            border: active ? `1px solid ${opt.color}44` : '1px solid transparent',
          }}
        >
          {opt.label}
        </button>
      )
    })}
  </div>
)
