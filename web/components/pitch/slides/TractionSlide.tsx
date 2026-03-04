'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { TRACTION_STATS } from '@/lib/pitch-data'
import type { Scenario } from '@/lib/pitch-data'
import { Rocket, Code2, Smartphone, Layers, Languages, Shield, FlaskConical } from 'lucide-react'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
})

const STAT_ICONS: Record<string, typeof Code2> = {
  'Lines of Code': Code2,
  Platforms: Smartphone,
  Technologies: Layers,
  Languages: Languages,
  'Security Modules': Shield,
  'NIST Algorithms': FlaskConical,
}

function AnimatedCounter({ target }: { target: string }) {
  const [display, setDisplay] = useState('0')
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (hasAnimated.current) return

    const numeric = parseInt(target.replace(/[^0-9]/g, ''))
    if (isNaN(numeric)) {
      setDisplay(target)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const duration = 1200
          const start = performance.now()

          function tick(now: number) {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            const current = Math.floor(eased * numeric)

            if (target.includes('K') && current >= 1000) {
              setDisplay(`${Math.floor(current / 1000)}K`)
            } else {
              setDisplay(current.toString())
            }

            if (progress < 1) {
              requestAnimationFrame(tick)
            } else {
              setDisplay(target)
            }
          }

          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{display}</span>
}

const DEVELOPMENT_TIMELINE = [
  { phase: 'Core Engine', detail: 'Rust Kyber768 + PyO3 bindings' },
  { phase: 'PQC Messenger', detail: 'End-to-end PQ Double Ratchet' },
  { phase: 'Quantum VoIP', detail: 'PQ-SRTP voice/video' },
  { phase: 'Q-VPN', detail: 'WireGuard + Kyber768' },
  { phase: 'ZipBrowser', detail: 'ML-KEM TLS inspection' },
  { phase: 'Quantum Mail', detail: 'Self-destruct + PII scan' },
  { phase: 'QRNG Engine', detail: '156-qubit IBM integration' },
  { phase: 'Web Dashboard', detail: 'Next.js 16 landing + admin' },
]

export default function TractionSlide({ scenario: _scenario }: { scenario?: Scenario }) {
  return (
    <SlideWrapper>
      {/* Header */}
      <motion.div {...fadeUp()} className="text-center mb-10">
        <p className="text-quantum-400 font-mono text-sm tracking-widest uppercase mb-3">
          Traction
        </p>
        <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-3">
          <span className="gradient-text">870K+ Lines</span> of Production Code
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Not a whitepaper. A working system across 5 platforms, 7 languages, and 26 integrated technologies.
        </p>
      </motion.div>

      {/* Animated Counter Grid */}
      <motion.div {...fadeUp(0.05)} className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {TRACTION_STATS.map((stat, i) => {
          const Icon = STAT_ICONS[stat.label] || Code2
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="card-quantum text-center group"
            >
              <Icon className="w-5 h-5 text-quantum-400 mx-auto mb-2 group-hover:text-quantum-300 transition-colors" />
              <p className="text-3xl sm:text-4xl font-bold gradient-text font-mono">
                <AnimatedCounter target={stat.value} />
              </p>
              <p className="text-sm font-semibold text-white mt-1">{stat.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.detail}</p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Development Timeline */}
      <motion.div {...fadeUp(0.15)} className="card-quantum">
        <div className="flex items-center gap-2 mb-5">
          <Rocket className="w-5 h-5 text-quantum-400" />
          <h3 className="text-lg font-semibold text-white">Development Progress</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DEVELOPMENT_TIMELINE.map((item, i) => (
            <motion.div
              key={item.phase}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.04 }}
              className="flex items-center gap-3 rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2.5"
            >
              <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0">
                <div className="w-2 h-2 rounded-full bg-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{item.phase}</p>
                <p className="text-[11px] text-gray-500">{item.detail}</p>
              </div>
              <span className="text-[10px] font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full shrink-0 uppercase">
                Built
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Bottom callout */}
      <motion.div {...fadeUp(0.25)} className="mt-6 flex items-center gap-3 px-5 py-3 rounded-xl bg-quantum-500/[0.06] border border-quantum-500/15">
        <Rocket className="w-5 h-5 text-quantum-400 shrink-0" />
        <p className="text-sm text-gray-300">
          <span className="text-quantum-400 font-semibold">Zero vaporware.</span>{' '}
          Every module listed has working code, tests, and cross-platform bindings.
        </p>
      </motion.div>
    </SlideWrapper>
  )
}
