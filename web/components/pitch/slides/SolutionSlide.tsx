'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { SUPER_APP_MODULES } from '@/lib/pitch-data'
import {
  MessageSquare,
  Phone,
  Shield,
  Globe,
  Mail,
  Cpu,
  Eye,
  Bot,
  Sparkles,
} from 'lucide-react'
import type { Scenario } from '@/lib/pitch-data'

const ICON_MAP: Record<string, typeof Shield> = {
  MessageSquare,
  Phone,
  Shield,
  Globe,
  Mail,
  Cpu,
  Eye,
  Bot,
}

export default function SolutionSlide({ scenario: _scenario }: { scenario?: Scenario }) {
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
          <Sparkles className="w-5 h-5 text-quantum-400" />
          <span className="text-xs font-mono uppercase tracking-widest text-quantum-400/80">
            Slide 3 / 15
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
          One App.{' '}
          <span className="gradient-text">Total Protection.</span>
        </h2>
        <p className="text-gray-400 max-w-2xl text-lg">
          Instead of juggling multiple security tools, Zipminator unifies every
          communication channel under one post-quantum encryption umbrella.
        </p>
      </motion.div>

      {/* Module grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        {SUPER_APP_MODULES.map((mod, index) => {
          const Icon = ICON_MAP[mod.icon] || Shield
          return (
            <motion.div
              key={mod.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + index * 0.06 }}
              className="card-quantum group flex flex-col items-center text-center p-5 hover:border-quantum-500/50"
            >
              <div className="w-12 h-12 rounded-xl bg-quantum-500/10 border border-quantum-500/20 flex items-center justify-center mb-3 group-hover:bg-quantum-500/20 transition-colors">
                <Icon className="w-6 h-6 text-quantum-400" />
              </div>
              <h3 className="font-semibold text-white text-sm mb-1.5">
                {mod.name}
              </h3>
              <p className="text-gray-500 text-xs leading-relaxed">
                {mod.description}
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* Center callout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex items-center justify-center gap-4 px-6 py-4 rounded-xl bg-quantum-500/[0.06] border border-quantum-500/15"
      >
        <Shield className="w-8 h-8 text-quantum-400 shrink-0" />
        <div>
          <p className="text-white font-semibold text-sm">
            Install once, secure everything.
          </p>
          <p className="text-gray-400 text-xs mt-0.5">
            8 integrated modules. One quantum-secure platform. Zero fragmentation.
          </p>
        </div>
      </motion.div>
    </SlideWrapper>
  )
}
