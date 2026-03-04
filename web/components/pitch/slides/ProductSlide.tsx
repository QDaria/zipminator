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
  Layers,
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
            Slide 4 / 15
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
          const Icon = ICON_MAP[mod.icon] || Shield
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
