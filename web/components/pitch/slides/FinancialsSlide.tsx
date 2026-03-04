'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { REVENUE_PROJECTIONS } from '@/lib/pitch-data'
import type { Scenario } from '@/lib/pitch-data'
import { BarChart3, Users, DollarSign, TrendingUp } from 'lucide-react'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
})

const SCENARIO_META: Record<Scenario, { label: string; accent: string }> = {
  conservative: { label: 'Conservative', accent: 'bg-gray-500' },
  base: { label: 'Base', accent: 'bg-quantum-500' },
  upside: { label: 'Upside', accent: 'bg-green-500' },
}

function formatUsers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

export default function FinancialsSlide({ scenario = 'base' }: { scenario?: Scenario }) {
  const data = REVENUE_PROJECTIONS[scenario]
  const maxRevenue = Math.max(...data.map((d) => d.revenue))
  const totalRevenue5yr = data.reduce((sum, d) => sum + d.revenue, 0)
  const yr5Revenue = data[data.length - 1].revenue
  const yr5Users = data[data.length - 1].users

  return (
    <SlideWrapper>
      {/* Header */}
      <motion.div {...fadeUp()} className="text-center mb-10">
        <p className="text-quantum-400 font-mono text-sm tracking-widest uppercase mb-3">
          Revenue Projections
        </p>
        <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-3">
          Path to <span className="gradient-text">${yr5Revenue}M</span> ARR
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Five-year financial model across three scenarios
        </p>
      </motion.div>

      {/* Scenario Selector Tabs */}
      <motion.div {...fadeUp(0.05)} className="flex items-center justify-center gap-2 mb-10">
        {(['conservative', 'base', 'upside'] as Scenario[]).map((s) => {
          const meta = SCENARIO_META[s]
          const isActive = s === scenario
          return (
            <div
              key={s}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                isActive
                  ? 'bg-white/10 border border-white/20 text-white'
                  : 'bg-white/[0.03] border border-transparent text-gray-500'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${meta.accent}`} />
              {meta.label}
            </div>
          )
        })}
      </motion.div>

      {/* Headline Metrics */}
      <motion.div {...fadeUp(0.1)} className="grid grid-cols-3 gap-4 mb-10">
        {[
          { icon: DollarSign, label: '5-Year Cumulative', value: `$${totalRevenue5yr.toFixed(1)}M` },
          { icon: TrendingUp, label: 'Year 5 ARR', value: `$${yr5Revenue}M` },
          { icon: Users, label: 'Year 5 Users', value: formatUsers(yr5Users) },
        ].map((stat) => (
          <div key={stat.label} className="card-quantum text-center">
            <stat.icon className="w-5 h-5 text-quantum-400 mx-auto mb-2" />
            <p className="text-2xl sm:text-3xl font-bold gradient-text font-mono">
              {stat.value}
            </p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Bar Chart */}
      <motion.div {...fadeUp(0.15)} className="card-quantum">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-quantum-400" />
          <h3 className="text-lg font-semibold text-white">
            Annual Revenue &mdash; {SCENARIO_META[scenario].label} Scenario
          </h3>
        </div>

        <div className="flex items-end justify-between gap-3 sm:gap-6 h-64 px-2">
          {data.map((d, i) => {
            const heightPct = maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0
            return (
              <motion.div
                key={d.year}
                className="flex flex-col items-center flex-1"
                initial={{ opacity: 0, scaleY: 0 }}
                whileInView={{ opacity: 1, scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.08 }}
                style={{ transformOrigin: 'bottom' }}
              >
                {/* Revenue Label */}
                <span className="text-sm sm:text-base font-bold text-white font-mono mb-2">
                  ${d.revenue}M
                </span>

                {/* Bar */}
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-quantum-700 to-quantum-400 relative group transition-all duration-300 hover:brightness-110"
                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-900 border border-white/10 rounded-lg px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      <p className="text-xs text-white font-mono">
                        {formatUsers(d.users)} users
                      </p>
                    </div>
                  </div>
                </div>

                {/* Users Label */}
                <span className="text-[11px] text-gray-500 font-mono mt-1.5">
                  {formatUsers(d.users)}
                </span>

                {/* Year Label */}
                <span className="text-sm text-gray-300 font-mono mt-0.5 font-medium">
                  {d.year}
                </span>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Key Assumptions */}
      <motion.div {...fadeUp(0.25)} className="mt-6 grid sm:grid-cols-2 gap-4">
        <div className="card-quantum">
          <h4 className="text-sm font-semibold text-quantum-400 mb-2">Revenue Drivers</h4>
          <ul className="text-sm text-gray-400 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-quantum-500 mt-2 shrink-0" />
              QCaaS (Quantum Cryptography as a Service) subscriptions
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-quantum-500 mt-2 shrink-0" />
              QCaaP (Quantum Cryptography as a Platform) licensing
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-quantum-500 mt-2 shrink-0" />
              Enterprise API consumption-based billing
            </li>
          </ul>
        </div>
        <div className="card-quantum">
          <h4 className="text-sm font-semibold text-quantum-400 mb-2">Key Assumptions</h4>
          <ul className="text-sm text-gray-400 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-quantum-500 mt-2 shrink-0" />
              PQC mandate adoption accelerates post-2027
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-quantum-500 mt-2 shrink-0" />
              70%+ gross margins from software-native model
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-quantum-500 mt-2 shrink-0" />
              Government grants de-risk first 18 months
            </li>
          </ul>
        </div>
      </motion.div>
    </SlideWrapper>
  )
}
