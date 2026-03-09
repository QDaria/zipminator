'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { TRACTION_STATS, DEVELOPMENT_TIMELINE } from '@/lib/pitch-data'
import type { Scenario } from '@/lib/pitch-data'
import { Rocket, Code2, Smartphone, Layers, Languages, Shield, FlaskConical, Target, DollarSign, Github, Flag } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  LabelList,
} from 'recharts'

import { fadeUpInView as fadeUp } from '../slide-utils'
import { TOOLTIP_STYLE } from '../chart-config'

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

const DEVELOPMENT_TIMELINE_DETAILS = [
  { phase: 'Core Engine', detail: 'Rust Kyber768 + PyO3 bindings' },
  { phase: 'PQC Messenger', detail: 'End-to-end PQ Double Ratchet' },
  { phase: 'Quantum VoIP', detail: 'PQ-SRTP voice/video' },
  { phase: 'Q-VPN', detail: 'WireGuard + Kyber768' },
  { phase: 'ZipBrowser', detail: 'ML-KEM TLS inspection' },
  { phase: 'Quantum Mail', detail: 'Self-destruct + PII scan' },
  { phase: 'QRNG Engine', detail: '156-qubit IBM integration' },
  { phase: 'Web Dashboard', detail: 'Next.js 16 landing + admin' },
]

const STATUS_COLORS: Record<string, string> = {
  done: '#22c55e',
  progress: '#6366f1',
  planned: '#6b7280',
}

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
          {DEVELOPMENT_TIMELINE_DETAILS.map((item, i) => (
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

      {/* Development Phase Progress Chart */}
      <motion.div {...fadeUp(0.18)} className="card-quantum mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Phase Progress</h3>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={DEVELOPMENT_TIMELINE}
              layout="vertical"
              margin={{ top: 5, right: 40, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="gradDone" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.95} />
                </linearGradient>
                <linearGradient id="gradProgress" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.95} />
                </linearGradient>
                <linearGradient id="gradPlanned" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#4b5563" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#6b7280" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#374151' }}
                tickLine={false}
                label={{ value: 'Progress %', position: 'insideBottomRight', offset: -5, fill: '#6b7280', fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="phase"
                width={120}
                tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#374151' }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE.contentStyle}
                labelStyle={TOOLTIP_STYLE.labelStyle}
                itemStyle={TOOLTIP_STYLE.itemStyle}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [`${value}%`, 'Progress']}
              />
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: 11, color: '#9ca3af', paddingTop: 8 }}
                payload={[
                  { value: 'Complete', type: 'rect', color: '#22c55e' },
                  { value: 'In Progress', type: 'rect', color: '#6366f1' },
                  { value: 'Planned', type: 'rect', color: '#6b7280' },
                ]}
              />
              <Bar dataKey="progress" radius={[0, 6, 6, 0]} maxBarSize={28} animationDuration={1200}>
                {DEVELOPMENT_TIMELINE.map((entry, index) => {
                  const gradId = entry.status === 'done' ? 'url(#gradDone)' : entry.status === 'progress' ? 'url(#gradProgress)' : 'url(#gradPlanned)'
                  return <Cell key={index} fill={gradId} />
                })}
                <LabelList
                  dataKey="progress"
                  position="right"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => `${v}%`}
                  style={{ fill: '#d1d5db', fontSize: 10, fontFamily: 'monospace' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Market Traction & Partnerships */}
      <motion.div {...fadeUp(0.2)} className="card-quantum mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-quantum-400" />
          <h3 className="text-lg font-semibold text-white">Market Traction</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Innovation Norway Grant', status: 'Submitted', statusColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Flag },
            { label: 'NATO DIANA Trondheim', status: 'Pipeline', statusColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Shield },
            { label: 'Waitlist', status: 'Growing', statusColor: 'bg-green-500/20 text-green-400 border-green-500/30', icon: Rocket },
            { label: 'Norwegian Quantum Initiative', status: 'Aligned', statusColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Flag },
          ].map((item, i) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.25 + i * 0.04 }}
                className="flex items-center gap-3 rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2.5"
              >
                <div className="w-6 h-6 rounded-full bg-quantum-500/15 border border-quantum-500/25 flex items-center justify-center shrink-0">
                  <Icon className="w-3 h-3 text-quantum-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{item.label}</p>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 uppercase ${item.statusColor}`}>
                  {item.status}
                </span>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Build Cost & Community */}
      <motion.div {...fadeUp(0.28)} className="mt-4 grid sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-green-500/[0.06] border border-green-500/15">
          <DollarSign className="w-5 h-5 text-green-400 shrink-0" />
          <div>
            <p className="text-sm text-white font-semibold">$25M equivalent build value</p>
            <p className="text-xs text-gray-400">40-55% savings from Norwegian base vs Silicon Valley rates</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-quantum-500/[0.06] border border-quantum-500/15">
          <Github className="w-5 h-5 text-quantum-400 shrink-0" />
          <div>
            <p className="text-sm text-white font-semibold">Open Source Core</p>
            <p className="text-xs text-gray-400">MIT-licensed crypto primitives, community-auditable</p>
          </div>
        </div>
      </motion.div>

      {/* Bottom callout */}
      <motion.div {...fadeUp(0.32)} className="mt-4 flex items-center gap-3 px-5 py-3 rounded-xl bg-quantum-500/[0.06] border border-quantum-500/15">
        <Rocket className="w-5 h-5 text-quantum-400 shrink-0" />
        <p className="text-sm text-gray-300">
          <span className="text-quantum-400 font-semibold">Zero vaporware.</span>{' '}
          Every module listed has working code, tests, and cross-platform bindings.
        </p>
      </motion.div>
    </SlideWrapper>
  )
}
