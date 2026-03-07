'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { TECHNOLOGY_STACK, GREEN_CREDENTIALS } from '@/lib/pitch-data'
import {
  Lock,
  Settings,
  Monitor,
  FileCheck,
  Cpu,
  CheckCircle2,
  Zap,
  Leaf,
  Calendar,
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
  { label: '~1000x less energy', detail: 'Kyber vs RSA-4096' },
]

const STANDARDS_TIMELINE = [
  { year: '2024', label: 'NIST FIPS 203', detail: 'ML-KEM standardized', done: true },
  { year: '2025', label: 'NIST FIPS 204/205', detail: 'ML-DSA + SLH-DSA', done: true },
  { year: '2027', label: 'CNSA 2.0', detail: 'NSA mandate for all NSS', done: false },
  { year: '2035', label: 'Full PQC', detail: 'Complete classical phase-out', done: false },
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
            Slide 8 / 20
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

      {/* Energy Efficiency section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="card-quantum mb-6"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-green-400" />
          </div>
          <h3 className="font-semibold text-white text-sm">Energy Efficiency</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {GREEN_CREDENTIALS.stats.slice(0, 3).map((stat, i) => (
            <div key={i} className="flex flex-col items-center text-center py-2 px-3 rounded-lg bg-green-500/[0.04] border border-green-500/10">
              <span className="text-lg font-mono font-bold text-green-400">{stat.value}</span>
              <span className="text-[10px] text-gray-400 mt-0.5">{stat.label}</span>
              <span className="text-[9px] text-gray-600 mt-0.5 leading-tight">{stat.detail}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Standards Compliance Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
        className="card-quantum mb-6"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-green-400" />
          </div>
          <h3 className="font-semibold text-white text-sm">Standards Compliance Timeline</h3>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STANDARDS_TIMELINE.map((step, i) => (
            <div key={i} className="flex items-center shrink-0">
              <div className={`flex flex-col items-center px-3 py-2 rounded-lg border ${step.done ? 'bg-green-500/[0.06] border-green-500/20' : 'bg-white/[0.02] border-white/10'}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${step.done ? 'text-green-400' : 'text-gray-600'}`} />
                  <span className={`text-xs font-mono font-semibold ${step.done ? 'text-green-400' : 'text-gray-400'}`}>{step.year}</span>
                </div>
                <span className={`text-[10px] font-medium ${step.done ? 'text-white' : 'text-gray-500'}`}>{step.label}</span>
                <span className="text-[9px] text-gray-600">{step.detail}</span>
              </div>
              {i < STANDARDS_TIMELINE.length - 1 && (
                <div className={`w-6 h-px mx-0.5 ${step.done ? 'bg-green-500/40' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>
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
              transition={{ delay: 0.3 + index * 0.08 }}
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
