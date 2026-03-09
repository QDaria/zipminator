'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { GRANT_OPPORTUNITIES, COMPARABLE_RAISES, GRANT_AMOUNTS_NUMERIC } from '@/lib/pitch-data'
import type { Scenario } from '@/lib/pitch-data'
import {
  Award,
  Landmark,
  Rocket,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flag,
  Globe,
  GraduationCap,
  TrendingUp,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
  LabelList,
} from 'recharts'

import { fadeUpInView as fadeUp, useAnimatedCounter } from '../slide-utils'
import { TOOLTIP_STYLE, GRADIENT_DEFS } from '../chart-config'

const REGION_COLORS: Record<string, string> = {
  norway: '#22c55e',
  eu: '#6366f1',
  nato: '#3b82f6',
  us: '#a855f7',
}

function getStatusBadge(status: string): { bg: string; text: string } {
  const lower = status.toLowerCase()
  if (lower.includes('active') || lower.includes('confirmed') || lower.includes('ongoing'))
    return { bg: 'bg-green-500/20', text: 'text-green-400' }
  return { bg: 'bg-quantum-500/20', text: 'text-quantum-400' }
}

const NOR_GRANTS = GRANT_OPPORTUNITIES.slice(0, 3)
const INTL_GRANTS = GRANT_OPPORTUNITIES.slice(3)

const NOR_HIGHLIGHTS = [
  {
    icon: Landmark,
    title: 'PM Store\'s Quantum Initiative',
    detail: 'NOK 1.75B commitment personally launched by Norway\'s Prime Minister',
  },
  {
    icon: GraduationCap,
    title: '4 New Quantum Research Centres',
    detail: 'NOK 244M over 5 years (announced 2025)',
  },
  {
    icon: CheckCircle2,
    title: 'NorPQC Project (Simula)',
    detail: 'Institutional validation of Norwegian PQC research capacity',
  },
]

const INTL_CONTEXT = [
  {
    icon: Flag,
    label: 'US Migration Budget',
    value: '$7.1B',
    detail: 'Federal PQC migration (2025-2035)',
  },
  {
    icon: Globe,
    label: 'EU Quantum Flagship',
    value: 'EUR 400M+',
    detail: 'Phase 2 ongoing, broad quantum tech',
  },
]

export default function FundingStrategySlide({ scenario: _scenario = 'base' }: { scenario?: Scenario }) {
  const { display: animatedTotal, ref: totalRef } = useAnimatedCounter(12, { suffix: 'M+', decimals: 0 })

  return (
    <SlideWrapper>
      {/* Header */}
      <motion.div {...fadeUp()} className="text-center mb-10">
        <p className="text-quantum-400 font-mono text-sm tracking-widest uppercase mb-3">
          Funding Strategy
        </p>
        <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-3">
          Grants-First, <span className="gradient-text">Equity-Preserving</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Non-dilutive funding first, revenue validation second, strategic raise from strength
        </p>
      </motion.div>

      {/* 3-Tier Visual Timeline */}
      <motion.div {...fadeUp(0.05)} className="grid sm:grid-cols-3 gap-4 mb-10">
        {[
          {
            icon: Landmark,
            tier: 'Tier 1',
            title: 'Grants',
            value: '$2-5M',
            desc: 'Non-dilutive government and institutional grants',
            timeline: 'Year 1-2',
            color: 'text-green-400',
            border: 'border-green-500/30',
          },
          {
            icon: Rocket,
            tier: 'Tier 2',
            title: 'Revenue',
            value: '$5M+ ARR',
            desc: 'QCaaS and QCaaP subscription ramp',
            timeline: 'Year 2-3',
            color: 'text-quantum-400',
            border: 'border-quantum-500/30',
          },
          {
            icon: Award,
            tier: 'Tier 3',
            title: 'Strategic Raise',
            value: '$15-25M',
            desc: 'If/when taking equity, from a position of strength',
            timeline: 'Year 3+',
            color: 'text-purple-400',
            border: 'border-purple-500/30',
          },
        ].map((phase, i) => (
          <div
            key={phase.tier}
            className={`card-quantum border-t-2 ${phase.border} relative`}
          >
            {i < 2 && (
              <ArrowRight className="hidden sm:block absolute -right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-600 z-20" />
            )}
            <div className="flex items-center gap-2 mb-3">
              <phase.icon className={`w-5 h-5 ${phase.color}`} />
              <span className="text-xs font-mono text-gray-500">{phase.tier}</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{phase.title}</h3>
            <p className="text-2xl font-bold gradient-text font-mono mb-2">
              {phase.value}
            </p>
            <p className="text-sm text-gray-400 mb-3">{phase.desc}</p>
            <span className="inline-flex items-center gap-1 text-xs font-mono text-gray-500">
              <Clock className="w-3 h-3" />
              {phase.timeline}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Norwegian Ecosystem Highlights */}
      <motion.div {...fadeUp(0.08)} className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Flag className="w-4 h-4 text-red-400" />
          <h3 className="text-lg font-semibold text-white">Norwegian Quantum Ecosystem</h3>
          <span className="text-sm" role="img" aria-label="Norwegian flag">
            &#x1F1F3;&#x1F1F4;
          </span>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          {NOR_HIGHLIGHTS.map((item) => (
            <div key={item.title} className="rounded-xl bg-green-500/[0.04] border border-green-500/15 p-4">
              <item.icon className="w-5 h-5 text-green-400 mb-2" />
              <h4 className="text-sm font-semibold text-white mb-1">{item.title}</h4>
              <p className="text-xs text-gray-400">{item.detail}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Grant Amounts Chart */}
      <motion.div {...fadeUp(0.09)} className="card-quantum mb-8">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-quantum-400" />
          Grant Program Amounts ($M)
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart layout="vertical" data={GRANT_AMOUNTS_NUMERIC} margin={{ left: 10, right: 40 }}>
            <defs>
              {Object.entries(REGION_COLORS).map(([region, color]) => (
                <linearGradient key={region} id={`gradRegion-${region}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="5%" stopColor={color} stopOpacity={0.9} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.5} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis type="number" stroke="#6b7280" fontSize={12} tickFormatter={(v: number) => `$${v}M`} />
            <YAxis type="category" dataKey="name" width={160} stroke="#6b7280" tick={{ fontSize: 11 }} />
            <Tooltip
              {...TOOLTIP_STYLE}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`$${value}M`]}
            />
            <ReferenceLine x={3} stroke="#ef4444" strokeDasharray="5 5" label={{ value: '$3M Target', fill: '#ef4444', fontSize: 11, position: 'top' }} />
            <Bar dataKey="amount" radius={[0, 4, 4, 0]} animationDuration={1200}>
              {GRANT_AMOUNTS_NUMERIC.map((entry, index) => (
                <Cell key={index} fill={`url(#gradRegion-${entry.region})`} />
              ))}
              <LabelList dataKey="amount" position="right" style={{ fill: '#d1d5db', fontSize: 11, fontFamily: 'monospace' }} formatter={(v: number) => `$${v}M`} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap items-center justify-between gap-4 mt-3">
          <div className="flex flex-wrap gap-4">
            {Object.entries(REGION_COLORS).map(([region, color]) => (
              <span key={region} className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                {region === 'norway' ? 'Norway' : region === 'eu' ? 'EU' : region === 'nato' ? 'NATO' : 'US'}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-mono">Total Potential:</span>
            <span ref={totalRef as React.RefObject<HTMLSpanElement>} className="text-lg font-bold gradient-text font-mono">${animatedTotal}</span>
          </div>
        </div>
      </motion.div>

      {/* Grant Opportunities */}
      <motion.div {...fadeUp(0.1)} className="mb-10">
        {/* Norwegian Grants */}
        <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-green-400" />
          Norwegian Grant Programs
        </h3>
        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          {NOR_GRANTS.map((grant) => {
            const badge = getStatusBadge(grant.status)
            return (
              <div key={grant.name} className="card-quantum">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
                  >
                    {grant.status}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">{grant.name}</h4>
                <p className="text-xl font-bold gradient-text font-mono mb-1">
                  {grant.amount}
                </p>
                <p className="text-xs text-gray-500">{grant.focus}</p>
              </div>
            )
          })}
        </div>

        {/* International Grants */}
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Landmark className="w-4 h-4 text-quantum-400" />
          EU / NATO / US Programs
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {INTL_GRANTS.map((grant) => {
            const badge = getStatusBadge(grant.status)
            return (
              <div key={grant.name} className="card-quantum">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
                  >
                    {grant.status}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">{grant.name}</h4>
                <p className="text-xl font-bold gradient-text font-mono mb-1">
                  {grant.amount}
                </p>
                <p className="text-xs text-gray-500">{grant.focus}</p>
              </div>
            )
          })}
        </div>

        {/* International Context Callouts */}
        <div className="grid sm:grid-cols-2 gap-3">
          {INTL_CONTEXT.map((ctx) => (
            <div key={ctx.label} className="rounded-xl bg-quantum-500/[0.05] border border-quantum-500/20 p-4 flex items-center gap-4">
              <ctx.icon className="w-8 h-8 text-quantum-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 font-mono">{ctx.label}</p>
                <p className="text-xl font-bold gradient-text font-mono">{ctx.value}</p>
                <p className="text-xs text-gray-500">{ctx.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Total Available Non-Dilutive Funding */}
      <motion.div {...fadeUp(0.15)} className="mb-8">
        <div className="rounded-xl bg-gradient-to-r from-green-500/[0.08] to-quantum-500/[0.08] border border-green-500/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-base font-semibold text-white">Total Available Non-Dilutive Funding</h3>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-400 font-mono mb-1">Norwegian Programs</p>
              <p className="text-2xl font-bold text-green-400 font-mono">NOK 2B+</p>
              <p className="text-xs text-gray-500">($200M+ accessible pool)</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 font-mono mb-1">EU / NATO Programs</p>
              <p className="text-2xl font-bold text-quantum-400 font-mono">EUR 425M+</p>
              <p className="text-xs text-gray-500">Horizon, Digital Europe, DIANA, Flagship</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 font-mono mb-1">US Federal Programs</p>
              <p className="text-2xl font-bold text-purple-400 font-mono">$7.1B</p>
              <p className="text-xs text-gray-500">PQC migration budget (2025-2035)</p>
            </div>
          </div>
          <p className="text-center text-xs text-gray-500 font-mono mt-4 pt-3 border-t border-white/5">
            Our target: capture $2-5M from this combined pool in Year 1-2
          </p>
        </div>
      </motion.div>

      {/* Comparable Raises */}
      <motion.div {...fadeUp(0.2)} className="card-quantum">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-quantum-400" />
          Market Context &mdash; Comparable Raises
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {COMPARABLE_RAISES.map((comp) => (
            <div
              key={comp.company}
              className="rounded-xl bg-white/[0.03] border border-white/5 p-4"
            >
              <h4 className="text-sm font-semibold text-white mb-1">{comp.company}</h4>
              <p className="text-xl font-bold gradient-text font-mono">{comp.raised}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Valuation: {comp.valuation}
              </p>
              <p className="text-xs text-gray-400 mt-1">{comp.focus}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </SlideWrapper>
  )
}
