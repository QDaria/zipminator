'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import {
  FUNDING_ASK,
  COMPARABLE_RAISES,
  REVENUE_PROJECTIONS,
} from '@/lib/pitch-data'
import type { Scenario } from '@/lib/pitch-data'
import {
  Target,
  DollarSign,
  Layers,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Users,
  FileCheck,
  TrendingUp,
  MapPin,
} from 'lucide-react'

import { fadeUp } from '../slide-utils'

const PIE_COLORS = [
  '#22c55e', // Engineering -- green-500
  '#6366f1', // Security -- quantum-500
  '#a78bfa', // Go-to-Market -- purple-400
  '#f59e0b', // Infrastructure -- amber-500
  '#818cf8', // Operations -- indigo-400
]

function buildConicGradient(
  segments: ReadonlyArray<{ percentage: number }>
): string {
  const stops: string[] = []
  let cumulative = 0
  segments.forEach((seg, i) => {
    const start = cumulative
    cumulative += seg.percentage
    stops.push(`${PIE_COLORS[i]} ${start}% ${cumulative}%`)
  })
  return `conic-gradient(from 0deg, ${stops.join(', ')})`
}

const MILESTONES = [
  {
    phase: 'Phase 1',
    timeline: '0-12 months',
    items: [
      'Secure government grants',
      'MVP launch (Messenger + VPN)',
      'Beta program launch',
      'SOC 2 readiness assessment planned',
    ],
  },
  {
    phase: 'Phase 2',
    timeline: '12-24 months',
    items: [
      'Revenue ramp to $1M+ ARR',
      'Product-market fit validation',
      'Enterprise pilot program',
      'Full super-app launch',
    ],
  },
  {
    phase: 'Phase 3',
    timeline: '24-36 months',
    items: [
      'Scale to $5M+ ARR',
      'Strategic partnerships',
      'International expansion',
      'Evaluate strategic raise',
    ],
  },
]

const SEED_DELIVERABLES = [
  { icon: Users, label: 'MVP launch with public beta program' },
  { icon: ShieldCheck, label: 'SOC 2 readiness assessment' },
  { icon: FileCheck, label: 'Enterprise pilot program initiated' },
  { icon: Sparkles, label: 'FIPS 203 (ML-KEM) KAT verified' },
  { icon: Smartphone, label: 'Full mobile app (iOS + Android)' },
]

export default function AskSlide({ scenario = 'base' }: { scenario?: Scenario }) {
  const key: Exclude<Scenario, 'all'> = scenario === 'all' ? 'base' : scenario
  const data = REVENUE_PROJECTIONS[key]
  const yr3Revenue = data[2].revenue
  const yr5Revenue = data[4].revenue

  return (
    <SlideWrapper>
      {/* Header */}
      <motion.div {...fadeUp()} className="text-center mb-8">
        <p className="text-xs font-mono uppercase tracking-widest text-quantum-400/80 mb-3">
          The Path Forward
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
          Building from <span className="gradient-text">Strength</span>
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Grants-first strategy preserves equity while validating product-market fit
        </p>
      </motion.div>

      {/* Three Funding Phases */}
      <motion.div {...fadeUp(0.05)} className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            icon: Target,
            label: 'Grants Target',
            value: FUNDING_ASK.grantsTarget,
            color: 'text-green-400',
          },
          {
            icon: DollarSign,
            label: 'Revenue Goal',
            value: `$${yr3Revenue}M ARR by Year 3`,
            color: 'text-quantum-400',
          },
          {
            icon: Layers,
            label: 'Strategic Raise',
            value: FUNDING_ASK.strategicRaise,
            color: 'text-purple-400',
          },
        ].map((item) => (
          <div key={item.label} className="card-quantum text-center">
            <item.icon className={`w-6 h-6 ${item.color} mx-auto mb-2`} />
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">{item.label}</p>
            <p className="text-base font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </motion.div>

      {/* What $3-5M Seed Gets You */}
      <motion.div {...fadeUp(0.08)} className="mb-8">
        <div className="rounded-xl bg-gradient-to-r from-green-500/[0.06] to-quantum-500/[0.06] border border-green-500/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-semibold text-white">What $3-5M Seed Gets You</h3>
          </div>
          <div className="grid sm:grid-cols-5 gap-3 mb-4">
            {SEED_DELIVERABLES.map((d) => (
              <div key={d.label} className="flex flex-col items-center text-center gap-2 p-3 rounded-lg bg-white/[0.02]">
                <d.icon className="w-5 h-5 text-green-400" />
                <p className="text-xs text-gray-300 leading-snug">{d.label}</p>
              </div>
            ))}
          </div>

          {/* Norwegian cost advantage */}
          <div className="flex items-center justify-center gap-3 pt-3 border-t border-white/5">
            <MapPin className="w-4 h-4 text-quantum-400" />
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-quantum-400">$3-5M in Norway = $6-10M equivalent in Silicon Valley</span>
              <span className="text-gray-500"> (40-55% lower costs across salaries, infrastructure, energy)</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Comparable Seed Rounds Callout */}
      <motion.div {...fadeUp(0.1)} className="mb-8">
        <div className="rounded-xl bg-purple-500/[0.05] border border-purple-500/15 p-4 flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-white mb-1">Market Context: Comparable Seed Rounds</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Cybersecurity median seed round: <span className="text-purple-400 font-semibold">$3-4M</span>.
              PQ-specific companies have raised significantly more: <span className="text-purple-400 font-semibold">PQShield $70M (Series B), SandboxAQ $950M total</span>.
              Our ask is at the conservative end with the highest product completeness.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Use of Funds + Pie Chart */}
      <div className="grid lg:grid-cols-2 gap-6 mb-10">
        {/* CSS Donut Chart */}
        <motion.div
          {...fadeUp(0.12)}
          className="card-quantum flex flex-col items-center justify-center py-8"
        >
          <h3 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-quantum-400" />
            Use of Funds
          </h3>
          <div className="relative w-52 h-52">
            <div
              className="w-full h-full rounded-full"
              style={{ background: buildConicGradient(FUNDING_ASK.useOfFunds) }}
            />
            <div className="absolute inset-[25%] rounded-full bg-gray-950 flex items-center justify-center">
              <div className="text-center">
                <p className="text-xs text-gray-400 font-mono">Total</p>
                <p className="text-lg font-bold gradient-text">$15-25M</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 w-full max-w-xs">
            {FUNDING_ASK.useOfFunds.map((seg, i) => (
              <div key={seg.category} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: PIE_COLORS[i] }}
                />
                <span className="text-xs text-gray-300 truncate">
                  {seg.category} ({seg.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Allocation Breakdown Bars */}
        <motion.div {...fadeUp(0.15)} className="card-quantum">
          <h3 className="text-sm font-semibold text-white mb-4">Allocation Breakdown</h3>
          <div className="space-y-3">
            {FUNDING_ASK.useOfFunds.map((seg, i) => (
              <div key={seg.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-300">{seg.category}</span>
                  <span className="text-sm font-mono text-white">
                    {seg.percentage}% &mdash; {seg.amount}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: PIE_COLORS[i] }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${seg.percentage}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 + i * 0.08 }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Scenario-aware bottom line */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-xs text-gray-500 font-mono">
              Projected Year 5 ARR ({scenario}):{' '}
              <span className="text-quantum-400 font-bold">${yr5Revenue}M</span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Timeline Milestones */}
      <motion.div {...fadeUp(0.2)} className="card-quantum">
        <h3 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
          <Clock className="w-4 h-4 text-quantum-400" />
          36-Month Roadmap
        </h3>
        <div className="grid sm:grid-cols-3 gap-6">
          {MILESTONES.map((m, idx) => (
            <div key={m.phase} className="relative">
              {idx < MILESTONES.length - 1 && (
                <ArrowRight className="hidden sm:block absolute -right-5 top-4 w-4 h-4 text-gray-600" />
              )}
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-quantum-500/20 border border-quantum-500/40 flex items-center justify-center text-xs font-mono text-quantum-400 font-bold">
                  {idx + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{m.phase}</p>
                  <p className="text-[11px] font-mono text-gray-500">{m.timeline}</p>
                </div>
              </div>
              <ul className="space-y-1.5 pl-9">
                {m.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-gray-400"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-quantum-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Comparable Raises Context */}
      <motion.div {...fadeUp(0.25)} className="grid sm:grid-cols-3 gap-4 mt-6">
        {COMPARABLE_RAISES.map((comp) => (
          <div key={comp.company} className="card-quantum text-center">
            <p className="text-xs text-gray-400 font-mono mb-1">{comp.company}</p>
            <p className="text-xl font-bold gradient-text font-mono">{comp.raised}</p>
            <p className="text-xs text-gray-500 mt-0.5">Val: {comp.valuation}</p>
            <p className="text-xs text-gray-400 mt-1">{comp.focus}</p>
          </div>
        ))}
      </motion.div>
    </SlideWrapper>
  )
}
