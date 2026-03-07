'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { SUPER_APP_MODULES, ROADMAP_PHASES } from '@/lib/pitch-data'
import { Shield, Layers } from 'lucide-react'
import type { Scenario } from '@/lib/pitch-data'
import { MODULE_ICON_MAP } from '../slide-utils'

// Style presets for each roadmap status
const STATUS_STYLES: Record<string, { color: string; bgColor: string; borderColor: string }> = {
  done:     { color: 'text-green-400',  bgColor: 'bg-green-500/10',  borderColor: 'border-green-500/20' },
  progress: { color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/20' },
  planned:  { color: 'text-gray-500',   bgColor: 'bg-gray-500/10',   borderColor: 'border-gray-500/20' },
}

function statusLabel(phase: (typeof ROADMAP_PHASES)[number]): string {
  switch (phase.status) {
    case 'done':     return 'Shipped'
    case 'progress': return `${phase.progress ?? 50}% Built`
    default:         return 'Planned'
  }
}

// Map module names to ROADMAP_PHASES for status display
const MODULE_STATUS_MAP: Record<string, { status: string; label: string; color: string; bgColor: string; borderColor: string }> = (() => {
  const map: Record<string, { status: string; label: string; color: string; bgColor: string; borderColor: string }> = {}
  for (const phase of ROADMAP_PHASES) {
    const styles = STATUS_STYLES[phase.status] ?? STATUS_STYLES.planned
    map[phase.name] = { status: phase.status, label: statusLabel(phase), ...styles }
  }
  return map
})()

// Map SUPER_APP_MODULES names to ROADMAP_PHASES names
const MODULE_NAME_TO_ROADMAP: Record<string, string> = {
  'PQC Messenger': 'Secure Messenger',
  'Quantum VoIP': 'VoIP & Q-VPN',
  'Q-VPN': 'VoIP & Q-VPN',
  'ZipBrowser': 'ZipBrowser',
  'Quantum Mail': 'Quantum Email',
  'QRNG Engine': 'MCP Server',
  'PII Anonymizer': 'Anonymizer',
  'AI Assistant': 'AI Assistant',
}

function getModuleStatus(moduleName: string) {
  const roadmapName = MODULE_NAME_TO_ROADMAP[moduleName]
  if (roadmapName && MODULE_STATUS_MAP[roadmapName]) {
    return MODULE_STATUS_MAP[roadmapName]
  }
  // Default to Quantum Vault (done) for unmatched
  return MODULE_STATUS_MAP['Quantum Vault'] || { status: 'done', label: 'Shipped', color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20' }
}

export default function ProductSlide({ scenario: _scenario }: { scenario?: Scenario }) {
  return (
    <SlideWrapper>
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-3">
          <Layers className="w-5 h-5 text-quantum-400" />
          <span className="text-xs font-mono uppercase tracking-widest text-quantum-400/80">
            Slide 6 / 20
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
          Product{' '}
          <span className="gradient-text">Suite</span>
        </h2>
        <p className="text-gray-400 max-w-2xl text-lg">
          Eight deeply integrated modules, each built on NIST-approved
          post-quantum cryptography from the ground up.
        </p>
      </motion.div>

      {/* Product cards: 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {SUPER_APP_MODULES.map((mod, index) => {
          const Icon = MODULE_ICON_MAP[mod.icon] || Shield
          return (
            <motion.div
              key={mod.name}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 + index * 0.06 }}
              className="card-quantum group flex items-start gap-4 hover:border-quantum-500/40"
            >
              <div className="shrink-0 w-11 h-11 rounded-xl bg-quantum-500/10 border border-quantum-500/20 flex items-center justify-center group-hover:bg-quantum-500/20 transition-colors">
                <Icon className="w-5 h-5 text-quantum-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white text-sm">
                    {mod.name}
                  </h3>
                  {(() => {
                    const st = getModuleStatus(mod.name)
                    return (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${st.color} ${st.bgColor} border ${st.borderColor}`}>
                        {st.status === 'done' ? '\u2713 ' : ''}{st.label}
                      </span>
                    )
                  })()}
                </div>
                <p className="text-gray-400 text-xs leading-relaxed mb-2">
                  {mod.description}
                </p>
                <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-quantum-600/10 border border-quantum-600/15">
                  <code className="text-[10px] text-quantum-300 font-mono">
                    {mod.tech}
                  </code>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </SlideWrapper>
  )
}
