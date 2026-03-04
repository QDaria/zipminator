'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { THREAT_DATA } from '@/lib/pitch-data'
import {
  Globe,
  Radio,
  Database,
  Zap,
  Shield,
  AlertTriangle,
} from 'lucide-react'
import type { Scenario } from '@/lib/pitch-data'

const ICON_MAP: Record<string, typeof Globe> = {
  Globe,
  Radio,
  Database,
  Zap,
  Shield,
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
            Slide 2 / 15
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
        {THREAT_DATA.map((threat, index) => {
          const Icon = ICON_MAP[threat.icon] || Shield
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
          transition={{ delay: 0.6 }}
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

      {/* Bottom urgency callout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex items-center gap-3 px-5 py-3 rounded-xl bg-red-500/[0.06] border border-red-500/15"
      >
        <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
        <p className="text-sm text-gray-300">
          <span className="text-red-400 font-semibold">CNSA 2.0 deadline: 2027.</span>{' '}
          Every day of delay increases exposure to harvest-now-decrypt-later attacks.
        </p>
      </motion.div>
    </SlideWrapper>
  )
}
