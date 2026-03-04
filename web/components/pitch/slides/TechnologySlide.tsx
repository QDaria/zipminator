'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { TECHNOLOGY_STACK } from '@/lib/pitch-data'
import {
  Lock,
  Settings,
  Monitor,
  FileCheck,
  Cpu,
  CheckCircle2,
} from 'lucide-react'
import type { Scenario } from '@/lib/pitch-data'

const CATEGORY_ICONS: Record<string, typeof Lock> = {
  Cryptography: Lock,
  'Core Engine': Settings,
  Platforms: Monitor,
  Standards: FileCheck,
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Cryptography: {
    bg: 'bg-quantum-500/10',
    border: 'border-quantum-500/20',
    text: 'text-quantum-400',
  },
  'Core Engine': {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    text: 'text-orange-400',
  },
  Platforms: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
  },
  Standards: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    text: 'text-green-400',
  },
}

const KEY_CALLOUTS = [
  { label: '156-qubit QRNG', detail: 'IBM Marrakesh' },
  { label: 'NIST FIPS 203', detail: 'ML-KEM Kyber768' },
  { label: '26 Technologies', detail: 'Integrated stack' },
  { label: 'Constant-time', detail: 'Rust crypto engine' },
]

export default function TechnologySlide({ scenario: _scenario }: { scenario?: Scenario }) {
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
          <Cpu className="w-5 h-5 text-quantum-400" />
          <span className="text-xs font-mono uppercase tracking-widest text-quantum-400/80">
            Slide 5 / 15
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
          Built on{' '}
          <span className="gradient-text">Proven Standards</span>
        </h2>
        <p className="text-gray-400 max-w-2xl text-lg">
          Every layer of our stack is grounded in NIST-approved algorithms,
          battle-tested protocols, and constant-time implementations.
        </p>
      </motion.div>

      {/* Key callouts */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
      >
        {KEY_CALLOUTS.map((callout, i) => (
          <div
            key={i}
            className="flex flex-col items-center text-center py-3 px-2 rounded-xl bg-quantum-500/[0.04] border border-quantum-500/10"
          >
            <span className="text-sm font-mono font-semibold text-quantum-300">
              {callout.label}
            </span>
            <span className="text-[10px] text-gray-500 mt-0.5">
              {callout.detail}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Technology stack cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {TECHNOLOGY_STACK.map((category, index) => {
          const Icon = CATEGORY_ICONS[category.category] || Settings
          const colors = CATEGORY_COLORS[category.category] || CATEGORY_COLORS['Cryptography']

          return (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + index * 0.08 }}
              className="card-quantum"
            >
              {/* Category header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-9 h-9 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}
                >
                  <Icon className={`w-4 h-4 ${colors.text}`} />
                </div>
                <h3 className="font-semibold text-white text-sm">
                  {category.category}
                </h3>
              </div>

              {/* Items list */}
              <ul className="space-y-2">
                {category.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${colors.text}`}
                    />
                    <span className="text-xs text-gray-400 leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )
        })}
      </div>
    </SlideWrapper>
  )
}
