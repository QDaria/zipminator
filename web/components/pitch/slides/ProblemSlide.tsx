'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { THREAT_DATA, THREAT_SEVERITY } from '@/lib/pitch-data'
import { AlertTriangle, Shield } from 'lucide-react'
import type { Scenario } from '@/lib/pitch-data'
import { MODULE_ICON_MAP, staggerItem } from '../slide-utils'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const EXTRA_THREAT = {
  title: '91% Unprotected',
  detail: '91% of businesses have no quantum-safe migration roadmap in place',
  source: 'Trusted Computing Group 2025',
  icon: 'AlertTriangle',
}

export default function ProblemSlide({ scenario: _scenario }: { scenario?: Scenario }) {
  return (
    <SlideWrapper>
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <span className="text-xs font-mono uppercase tracking-widest text-red-400/80">
            Slide 3 / 20
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
          The Threat is Real{' '}
          <span className="text-red-400">&mdash; and Accelerating</span>
        </h2>
        <p className="text-gray-400 max-w-2xl text-lg">
          State-sponsored actors are already harvesting encrypted data today,
          betting on quantum computers to break it tomorrow.
        </p>
      </motion.div>

      {/* Threat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[...THREAT_DATA, EXTRA_THREAT].map((threat, index) => {
          const Icon = MODULE_ICON_MAP[threat.icon] || Shield
          return (
            <motion.div
              key={threat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.08 }}
              className="card-quantum group relative overflow-hidden"
            >
              {/* Red accent top border */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-red-500/60 via-orange-500/40 to-transparent" />

              <div className="flex items-start gap-3">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-red-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-white text-sm mb-1.5">
                    {threat.title}
                  </h3>
                  <p className="text-gray-400 text-xs leading-relaxed mb-2">
                    {threat.detail}
                  </p>
                  <p className="text-[10px] text-gray-600 font-mono">
                    Source: {threat.source}
                  </p>
                </div>
              </div>
            </motion.div>
          )
        })}

        {/* Key stat card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="card-quantum relative overflow-hidden border-orange-500/20 bg-orange-500/[0.03]"
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-orange-500/60 via-yellow-500/40 to-transparent" />

          <div className="flex flex-col items-center justify-center h-full text-center py-2">
            <span className="text-3xl font-display font-bold text-orange-400 mb-1">
              $7.1B
            </span>
            <span className="text-sm text-gray-300 font-medium mb-1">
              US Government Migration Budget
            </span>
            <span className="text-[10px] text-gray-600 font-mono">
              Source: White House PQC Migration Estimate
            </span>
          </div>
        </motion.div>
      </div>

      {/* Threat Severity Radar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="card-quantum mb-4"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Threat Severity Assessment</h3>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={THREAT_SEVERITY}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis
                dataKey="threat"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: '#6b7280', fontSize: 10 }}
              />
              <Radar
                name="Severity"
                dataKey="severity"
                stroke="#ef4444"
                fill="rgba(239, 68, 68, 0.35)"
                fillOpacity={0.35}
                animationDuration={1200}
              />
              <Radar
                name="Urgency"
                dataKey="urgency"
                stroke="#f97316"
                fill="rgba(249, 115, 22, 0.25)"
                fillOpacity={0.25}
                animationDuration={1200}
              />
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: 12, color: '#9ca3af' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Floating stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {[
          { value: '2030-2035', label: 'Q-Day Estimate', color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/[0.06]' },
          { value: 'Active NOW', label: 'HNDL Attacks', color: 'text-orange-400', border: 'border-orange-500/20', bg: 'bg-orange-500/[0.06]' },
          { value: '$4.88M', label: 'Avg Breach Cost', color: 'text-yellow-400', border: 'border-yellow-500/20', bg: 'bg-yellow-500/[0.06]' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            {...staggerItem(i, 0.75)}
            className={`rounded-xl border ${stat.border} ${stat.bg} px-4 py-3 text-center`}
          >
            <p className={`text-xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Bottom urgency callout with pulsing red border */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="relative mb-4 rounded-xl overflow-hidden"
      >
        {/* Pulsing red border glow */}
        <div className="absolute inset-0 rounded-xl border border-red-500/30 animate-pulse" />
        <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-red-500/20 via-transparent to-red-500/20 animate-pulse opacity-50" />

        <div className="relative flex items-center gap-3 px-5 py-3 rounded-xl bg-red-500/[0.08]">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse shrink-0" />
          <p className="text-sm text-gray-300">
            <span className="text-red-400 font-semibold">CNSA 2.0 deadline: 2027.</span>{' '}
            Every day of delay increases exposure to harvest-now-decrypt-later attacks.
          </p>
        </div>
      </motion.div>

      {/* Cost of inaction footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.85 }}
        className="text-center"
      >
        <p className="text-[11px] text-gray-500 font-mono">
          Average data breach:{' '}
          <span className="text-orange-400 font-semibold">$4.88M</span>
          <span className="text-gray-600"> (IBM 2024)</span>
          {' '}&middot;{' '}
          Quantum decryption:{' '}
          <span className="text-red-400 font-semibold">Priceless</span>
        </p>
      </motion.div>
    </SlideWrapper>
  )
}
