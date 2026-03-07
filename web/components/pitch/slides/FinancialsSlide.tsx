'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { REVENUE_PROJECTIONS, REVENUE_MODULES } from '@/lib/pitch-data'
import type { Scenario } from '@/lib/pitch-data'
import { BarChart3, Users, DollarSign, TrendingUp, Gift, Layers, Award } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

import { fadeUpInView as fadeUp } from '../slide-utils'

const SCENARIO_META: Record<Scenario, { label: string; accent: string }> = {
  all: { label: 'All Scenarios', accent: 'bg-purple-500' },
  conservative: { label: 'Conservative', accent: 'bg-gray-500' },
  base: { label: 'Base', accent: 'bg-quantum-500' },
  upside: { label: 'Upside', accent: 'bg-green-500' },
}

const SCENARIO_COLORS: Record<string, string> = {
  base: '#6366f1',
  upside: '#22c55e',
  conservative: '#3b82f6',
}

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#22c55e', '#3b82f6', '#a855f7', '#6b7280']

function formatUsers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

export default function FinancialsSlide({ scenario = 'base' }: { scenario?: Scenario }) {
  const effectiveScenario: Exclude<Scenario, 'all'> = scenario === 'all' ? 'base' : scenario
  const data = REVENUE_PROJECTIONS[effectiveScenario]
  const maxRevenue = Math.max(...data.map((d) => d.revenue))
  const totalRevenue5yr = data.reduce((sum, d) => sum + d.revenue, 0)
  const yr5Revenue = data[data.length - 1].revenue
  const yr5Users = data[data.length - 1].users

  // Prepare chart data: merge all scenarios by year for overlay
  const chartData = REVENUE_PROJECTIONS.base.map((d, i) => ({
    year: d.year,
    base: REVENUE_PROJECTIONS.base[i].revenue,
    upside: REVENUE_PROJECTIONS.upside[i].revenue,
    conservative: REVENUE_PROJECTIONS.conservative[i].revenue,
    baseUsers: REVENUE_PROJECTIONS.base[i].users,
    upsideUsers: REVENUE_PROJECTIONS.upside[i].users,
    conservativeUsers: REVENUE_PROJECTIONS.conservative[i].users,
  }))

  return (
    <SlideWrapper>
      {/* Header */}
      <motion.div {...fadeUp()} className="text-center mb-8">
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

      {/* Non-Dilutive Funding Callout */}
      <motion.div
        {...fadeUp(0.03)}
        className="mb-8 flex items-center gap-4 px-5 py-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15"
      >
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
          <Gift className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-emerald-400 mb-0.5">Non-Dilutive Funding First</p>
          <p className="text-xs text-gray-400">
            Grants-first strategy: Innovation Norway, Research Council, NATO DIANA, and Horizon Europe
            fund R&amp;D before equity rounds. Preserves founder equity through critical early stages.
          </p>
        </div>
      </motion.div>

      {/* Scenario Selector Tabs */}
      <motion.div {...fadeUp(0.05)} className="flex items-center justify-center gap-2 mb-8">
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
      <motion.div {...fadeUp(0.1)} className="grid grid-cols-3 gap-4 mb-8">
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

      {/* Area Chart */}
      <motion.div {...fadeUp(0.15)} className="card-quantum mb-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-quantum-400" />
          <h3 className="text-lg font-semibold text-white">
            Annual Revenue &mdash; {SCENARIO_META[scenario].label}
          </h3>
        </div>

        <ResponsiveContainer width="100%" height={256}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="year" tick={{ fill: '#9ca3af', fontSize: 12, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 12, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickFormatter={(v: number) => `$${v}M`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontFamily: 'monospace', fontSize: 12 }}
              labelStyle={{ color: '#fff', fontWeight: 600 }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => [`$${value}M`, SCENARIO_META[name as Scenario]?.label ?? name]}
              labelFormatter={(label: any) => `Year ${label}`}
            />
            {scenario === 'all' ? (
              <>
                <Area type="monotone" dataKey="conservative" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.08} strokeWidth={2} animationDuration={1200} />
                <Area type="monotone" dataKey="base" stroke="#6366f1" fill="#6366f1" fillOpacity={0.12} strokeWidth={2} animationDuration={1200} />
                <Area type="monotone" dataKey="upside" stroke="#22c55e" fill="#22c55e" fillOpacity={0.08} strokeWidth={2} animationDuration={1200} />
              </>
            ) : (
              <Area type="monotone" dataKey={effectiveScenario} stroke={SCENARIO_COLORS[effectiveScenario]} fill={SCENARIO_COLORS[effectiveScenario]} fillOpacity={0.15} strokeWidth={2} animationDuration={1200} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Revenue per Module Donut */}
      <motion.div {...fadeUp(0.2)} className="card-quantum mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-quantum-400" />
          <h4 className="text-sm font-semibold text-white">Revenue per Module (Year 5 Target)</h4>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={REVENUE_MODULES}
                  dataKey="share"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  animationDuration={1200}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={({ share }: any) => `${share}%`}
                >
                  {REVENUE_MODULES.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontFamily: 'monospace', fontSize: 12 }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => [`${value}%`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[11px] font-mono text-gray-400 text-center leading-tight">Revenue<br/>Mix</span>
            </div>
          </div>
          <div className="flex-1 space-y-1.5">
            {REVENUE_MODULES.map((mod, idx) => (
              <div key={mod.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                <span className="text-xs text-gray-300 flex-1">{mod.name}</span>
                <span className="text-xs font-mono font-bold text-white">{mod.share}%</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Market Context Callout */}
      <motion.div
        {...fadeUp(0.22)}
        className="mb-6 flex items-center gap-4 px-5 py-3 rounded-xl bg-quantum-500/[0.06] border border-quantum-500/15"
      >
        <Award className="w-5 h-5 text-quantum-400 shrink-0" />
        <p className="text-xs text-gray-400">
          <span className="text-quantum-400 font-semibold">Market context:</span>{' '}
          SandboxAQ reached $5.75B valuation. PQC market growing{' '}
          <span className="text-white font-semibold">39-46% CAGR</span> through 2030.
          NIST mandate deadline (2035) creates guaranteed demand curve.
        </p>
      </motion.div>

      {/* Key Assumptions */}
      <motion.div {...fadeUp(0.25)} className="grid sm:grid-cols-2 gap-4">
        <div className="card-quantum">
          <h4 className="text-sm font-semibold text-quantum-400 mb-2">Revenue Drivers</h4>
          <ul className="text-sm text-gray-400 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-quantum-500 mt-2 shrink-0" />
              QCaaS subscriptions: Messenger, VPN, Browser, Email
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-quantum-500 mt-2 shrink-0" />
              QCaaP licensing: API/SDK, Enterprise Vault integrations
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-quantum-500 mt-2 shrink-0" />
              Enterprise: consumption-based billing + annual contracts
            </li>
          </ul>
        </div>
        <div className="card-quantum">
          <h4 className="text-sm font-semibold text-quantum-400 mb-2">Key Assumptions</h4>
          <ul className="text-sm text-gray-400 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-quantum-500 mt-2 shrink-0" />
              PQC mandate adoption accelerates post-2027 (NIST deadline)
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-quantum-500 mt-2 shrink-0" />
              70%+ gross margins; 40-55% cost advantage (Norway base)
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-quantum-500 mt-2 shrink-0" />
              NOK 5-15M in grants de-risk first 18 months of R&amp;D
            </li>
          </ul>
        </div>
      </motion.div>
    </SlideWrapper>
  )
}
