'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import SlideWrapper from '../SlideWrapper'
import { Shield, Lock, Cpu, Leaf, MapPin } from 'lucide-react'
import type { Scenario } from '@/lib/pitch-data'

const QuantumParticleField = dynamic(() => import('../QuantumParticleField'), { ssr: false })

const floatingIcons = [
  { Icon: Shield, delay: 0, x: -120, y: -80 },
  { Icon: Lock, delay: 0.2, x: 140, y: -60 },
  { Icon: Cpu, delay: 0.4, x: -80, y: 100 },
]

export default function TitleSlide({ scenario: _scenario }: { scenario?: Scenario }) {
  return (
    <SlideWrapper className="items-center text-center relative">
      {/* Three.js quantum particle field */}
      <QuantumParticleField />

      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-quantum-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-purple-600/8 rounded-full blur-[80px]" />
      </div>

      {/* Floating icons */}
      {floatingIcons.map(({ Icon, delay, x, y }, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.15, scale: 1, y: [y, y - 15, y] }}
          transition={{
            opacity: { delay: 0.5 + delay, duration: 0.6 },
            scale: { delay: 0.5 + delay, duration: 0.6 },
            y: { delay: 1 + delay, duration: 4, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="absolute top-1/2 left-1/2 text-quantum-400"
          style={{ marginLeft: x, marginTop: y }}
        >
          <Icon className="w-10 h-10" strokeWidth={1} />
        </motion.div>
      ))}

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="relative z-10"
      >
        {/* QDaria badge + Norwegian trust */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-quantum-500/30 bg-quantum-500/10">
            <div className="w-2 h-2 rounded-full bg-quantum-400 animate-pulse" />
            <span className="text-xs font-medium text-quantum-300 tracking-wider uppercase">
              QDaria
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04]">
            <MapPin className="w-3 h-3 text-red-400" />
            <span className="text-[11px] font-medium text-gray-400 tracking-wide">
              Norwegian-Built
            </span>
          </div>
        </motion.div>

        {/* Title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight mb-6 flex items-end justify-center gap-1">
          <Image
            src="/logos/Zipminator_0_gradient.svg"
            alt="Zipminator"
            width={500}
            height={83}
            className="h-[0.75em] w-auto"
            priority
          />
          <span className="text-white/40 font-light leading-none">-PQC</span>
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8"
        >
          World&apos;s First{' '}
          <span className="text-white font-medium">Post-Quantum Encryption</span>{' '}
          Super-App
        </motion.p>

        {/* Key stats row */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm"
        >
          {[
            { label: 'NIST FIPS 203', desc: 'Kyber768' },
            { label: '156 Qubits', desc: 'QRNG' },
            { label: '300K+ LOC', desc: 'Production Code' },
            { label: '9 Modules', desc: 'Super-App' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-white font-mono font-semibold text-sm">
                {stat.label}
              </div>
              <div className="text-gray-500 text-xs mt-0.5">{stat.desc}</div>
            </div>
          ))}
        </motion.div>

        {/* Green badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/[0.07]"
        >
          <Leaf className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-medium text-emerald-300/90 tracking-wide">
            Powered by 98% Renewable Energy
          </span>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-8 text-sm text-gray-500 font-mono tracking-wider"
        >
          SEED ROUND 2026 &middot; QUANTUM-SAFE FROM DAY ONE
        </motion.p>
      </motion.div>
    </SlideWrapper>
  )
}
