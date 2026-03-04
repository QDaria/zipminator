'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { RISK_MATRIX } from '@/lib/pitch-data'
import type { Scenario } from '@/lib/pitch-data'
import { ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
})

const LEVEL_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  high: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-500' },
  medium: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', dot: 'bg-yellow-500' },
  low: { bg: 'bg-green-500/15', text: 'text-green-400', dot: 'bg-green-500' },
}

function Badge({ level, label }: { level: string; label: string }) {
  const style = LEVEL_STYLES[level] ?? LEVEL_STYLES.low
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  )
}

export default function RiskSlide({ scenario: _scenario = 'base' }: { scenario?: Scenario }) {
  const highRisks = RISK_MATRIX.filter((r) => r.impact === 'high').length
  const totalRisks = RISK_MATRIX.length

  return (
    <SlideWrapper>
      {/* Header */}
      <motion.div {...fadeUp()} className="text-center mb-10">
        <p className="text-quantum-400 font-mono text-sm tracking-widest uppercase mb-3">
          Risk Analysis
        </p>
        <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-3">
          Risks <span className="gradient-text">&amp; Mitigations</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Every risk has a concrete mitigation plan
        </p>
      </motion.div>

      {/* Summary Badges */}
      <motion.div {...fadeUp(0.05)} className="flex items-center justify-center gap-4 mb-10">
        <div className="card-quantum flex items-center gap-3 px-5 py-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <div>
            <p className="text-xl font-bold text-white font-mono">{highRisks}</p>
            <p className="text-xs text-gray-400">High-Impact</p>
          </div>
        </div>
        <div className="card-quantum flex items-center gap-3 px-5 py-3">
          <ShieldAlert className="w-5 h-5 text-yellow-400" />
          <div>
            <p className="text-xl font-bold text-white font-mono">{totalRisks}</p>
            <p className="text-xs text-gray-400">Risks Tracked</p>
          </div>
        </div>
        <div className="card-quantum flex items-center gap-3 px-5 py-3">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-xl font-bold text-white font-mono">{totalRisks}/{totalRisks}</p>
            <p className="text-xs text-gray-400">Mitigated</p>
          </div>
        </div>
      </motion.div>

      {/* Risk Cards */}
      <div className="space-y-3">
        {RISK_MATRIX.map((item, i) => (
          <motion.div
            key={item.risk}
            {...fadeUp(0.1 + i * 0.04)}
            className="card-quantum"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Risk Description */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge level={item.impact} label={`Impact: ${item.impact}`} />
                  <Badge level={item.probability} label={`Prob: ${item.probability}`} />
                </div>
                <h4 className="text-sm font-semibold text-white leading-snug">
                  {item.risk}
                </h4>
              </div>

              {/* Mitigation */}
              <div className="sm:w-[55%] shrink-0 rounded-lg bg-green-500/[0.06] border border-green-500/10 px-4 py-3">
                <p className="text-xs font-mono text-green-400/80 uppercase tracking-wider mb-1">
                  Mitigation
                </p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {item.mitigation}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom Note */}
      <motion.p
        {...fadeUp(0.4)}
        className="text-center text-xs text-gray-500 mt-6 font-mono"
      >
        Risk matrix reviewed quarterly. Crypto-agile architecture is the primary systemic hedge.
      </motion.p>
    </SlideWrapper>
  )
}
