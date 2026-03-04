'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { GRANT_OPPORTUNITIES, COMPARABLE_RAISES } from '@/lib/pitch-data'
import type { Scenario } from '@/lib/pitch-data'
import {
  Award,
  Landmark,
  Rocket,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flag,
} from 'lucide-react'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
})

function getStatusBadge(status: string): { bg: string; text: string } {
  const lower = status.toLowerCase()
  if (lower.includes('active') || lower.includes('confirmed') || lower.includes('ongoing'))
    return { bg: 'bg-green-500/20', text: 'text-green-400' }
  return { bg: 'bg-quantum-500/20', text: 'text-quantum-400' }
}

const NOR_GRANTS = GRANT_OPPORTUNITIES.slice(0, 3)
const INTL_GRANTS = GRANT_OPPORTUNITIES.slice(3)

export default function FundingStrategySlide({ scenario: _scenario = 'base' }: { scenario?: Scenario }) {
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

      {/* Grant Opportunities */}
      <motion.div {...fadeUp(0.1)} className="mb-10">
        {/* Norwegian Grants */}
        <div className="flex items-center gap-2 mb-4">
          <Flag className="w-4 h-4 text-red-400" />
          <h3 className="text-lg font-semibold text-white">Norwegian Grants</h3>
          <span className="text-sm" role="img" aria-label="Norwegian flag">
            &#x1F1F3;&#x1F1F4;
          </span>
        </div>
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
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Landmark className="w-4 h-4 text-quantum-400" />
          EU / NATO / US Programs
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
