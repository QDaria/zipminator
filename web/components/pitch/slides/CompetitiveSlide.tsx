'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { COMPETITORS } from '@/lib/pitch-data'
import type { Scenario } from '@/lib/pitch-data'
import { Swords, Check, X, Minus } from 'lucide-react'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
})

const FEATURES = [
  { key: 'messenger' as const, label: 'PQC Messenger' },
  { key: 'voip' as const, label: 'Quantum VoIP' },
  { key: 'vpn' as const, label: 'Q-VPN' },
  { key: 'browser' as const, label: 'Browser' },
  { key: 'email' as const, label: 'Quantum Mail' },
  { key: 'qrng' as const, label: 'QRNG' },
  { key: 'pqc' as const, label: 'Full PQC' },
  { key: 'superApp' as const, label: 'Super-App' },
]

function CellIcon({ value }: { value: boolean | 'partial' }) {
  if (value === true) {
    return <Check className="w-4 h-4 text-green-400 mx-auto" />
  }
  if (value === 'partial') {
    return <Minus className="w-4 h-4 text-yellow-400 mx-auto" />
  }
  return <X className="w-4 h-4 text-gray-600 mx-auto" />
}

export default function CompetitiveSlide({ scenario: _scenario }: { scenario?: Scenario }) {
  const zipminator = COMPETITORS[0]
  const others = COMPETITORS.slice(1)
  const zipFeatureCount = FEATURES.filter(
    (f) => zipminator[f.key] === true
  ).length

  return (
    <SlideWrapper>
      {/* Header */}
      <motion.div {...fadeUp()} className="text-center mb-8">
        <p className="text-quantum-400 font-mono text-sm tracking-widest uppercase mb-3">
          Competitive Landscape
        </p>
        <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-3">
          No One Else Does{' '}
          <span className="gradient-text">All {zipFeatureCount}</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Every competitor solves one piece. Zipminator is the first to unify
          messaging, VoIP, VPN, browser, email, and QRNG under post-quantum encryption.
        </p>
      </motion.div>

      {/* Comparison Table */}
      <motion.div {...fadeUp(0.1)} className="card-quantum overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 pr-4 text-xs font-mono text-gray-500 uppercase w-32">
                Platform
              </th>
              {FEATURES.map((f) => (
                <th
                  key={f.key}
                  className="py-3 px-2 text-center text-xs font-mono text-gray-500 uppercase"
                >
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Zipminator row */}
            <tr className="bg-quantum-500/[0.06] border-b border-quantum-500/20">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-quantum-500/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-quantum-400">Z</span>
                  </div>
                  <span className="font-semibold text-quantum-300">
                    {zipminator.name}
                  </span>
                </div>
              </td>
              {FEATURES.map((f) => (
                <td key={f.key} className="py-3 px-2 text-center">
                  <CellIcon value={zipminator[f.key]} />
                </td>
              ))}
            </tr>

            {/* Competitor rows */}
            {others.map((comp) => (
              <tr key={comp.name} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="py-3 pr-4">
                  <span className="text-gray-300">{comp.name}</span>
                </td>
                {FEATURES.map((f) => (
                  <td key={f.key} className="py-3 px-2 text-center">
                    <CellIcon value={comp[f.key]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Legend */}
      <motion.div {...fadeUp(0.15)} className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <Check className="w-3 h-3 text-green-400" /> Full support
        </span>
        <span className="flex items-center gap-1.5">
          <Minus className="w-3 h-3 text-yellow-400" /> Partial
        </span>
        <span className="flex items-center gap-1.5">
          <X className="w-3 h-3 text-gray-600" /> None
        </span>
      </motion.div>

      {/* Moat summary */}
      <motion.div {...fadeUp(0.2)} className="grid sm:grid-cols-3 gap-4 mt-6">
        {[
          {
            title: 'Integration Moat',
            detail:
              'No one ships all 8 modules. Each integration deepens the switching cost.',
          },
          {
            title: 'PQC-Native',
            detail:
              'Competitors bolt on PQC later. We built from NIST FIPS 203 from day one.',
          },
          {
            title: 'QRNG Hardware',
            detail:
              '156-qubit IBM entropy is a physical advantage no software-only competitor can match.',
          },
        ].map((m) => (
          <div key={m.title} className="card-quantum">
            <div className="flex items-center gap-2 mb-2">
              <Swords className="w-4 h-4 text-quantum-400" />
              <h4 className="text-sm font-semibold text-white">{m.title}</h4>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{m.detail}</p>
          </div>
        ))}
      </motion.div>
    </SlideWrapper>
  )
}
