'use client'

import { BlueprintScenarioToggle, type BpScenario } from './BlueprintScenarioToggle'

export interface SidebarSection {
  id: string
  title: string
}

interface Props {
  sections: SidebarSection[]
  activeId: string
  scenario: BpScenario
  onScenarioChange: (v: BpScenario) => void
}

export const BlueprintSidebar = ({ sections, activeId, scenario, onScenarioChange }: Props) => (
  <aside
    data-blueprint-sidebar
    className="fixed left-0 top-0 h-screen w-60 hidden lg:flex flex-col border-r border-white/5 z-50"
    style={{ background: 'rgba(2,8,23,0.95)', backdropFilter: 'blur(12px)' }}
  >
    {/* Brand */}
    <div className="px-5 pt-6 pb-4 border-b border-white/5">
      <p className="text-[10px] font-mono tracking-[0.2em] uppercase" style={{ color: '#A78BFA' }}>
        QDaria · IP Analysis
      </p>
      <h1
        className="text-base font-semibold text-slate-100 mt-1"
        style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
      >
        Valuation Blueprint
      </h1>
      <span
        className="inline-block mt-2 px-2 py-0.5 text-[9px] font-mono rounded"
        style={{ background: 'rgba(251,113,133,0.15)', color: '#FB7185' }}
      >
        CONFIDENTIAL
      </span>
    </div>

    {/* Nav */}
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
      {sections.map((s, i) => {
        const active = activeId === s.id
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors duration-150"
            style={{
              background: active ? 'rgba(34,211,238,0.08)' : 'transparent',
              color: active ? '#22D3EE' : '#6b7280',
            }}
          >
            <span className="font-mono text-[10px] w-5 text-right opacity-60">{i + 1}</span>
            <span className="truncate">{s.title}</span>
          </a>
        )
      })}
    </nav>

    {/* Scenario toggle */}
    <div className="px-4 py-4 border-t border-white/5">
      <p className="text-[10px] font-mono text-gray-500 mb-2 uppercase tracking-wider">Scenario</p>
      <BlueprintScenarioToggle value={scenario} onChange={onScenarioChange} />
    </div>
  </aside>
)
