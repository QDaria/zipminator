'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { PRICING_TIERS, REVENUE_PROJECTIONS, REVENUE_MODULES } from '@/lib/pitch-data'
import type { Scenario } from '@/lib/pitch-data'
import { CreditCard, CheckCircle2, Star, Zap, TrendingUp, MapPin } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'

import { fadeUpInView as fadeUp } from '../slide-utils'
import { TOOLTIP_STYLE, GRADIENT_DEFS } from '../chart-config'

const MODULE_COLORS = ['#6366f1', '#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899']

const SCENARIO_COLORS: Record<string, string> = {
  base: '#6366f1',
  upside: '#22c55e',
  conservative: '#3b82f6',
}

const REVENUE_STREAMS = [
  {
    name: 'QCaaS',
    full: 'Quantum Cryptography as a Service',
    detail: 'Subscription access to PQC-protected communications suite',
    icon: Zap,
  },
  {
    name: 'QCaaP',
    full: 'Quantum Cryptography as a Platform',
    detail: 'API/SDK licensing for developers building PQC into their products',
    icon: CreditCard,
  },
]

const MARKET_GAP = [
  { label: 'Free CDN/WAF', example: 'Cloudflare, Let\'s Encrypt', price: '$0', position: 0 },
  { label: 'Zipminator', example: '$0-99/mo', price: '$0-99', position: 35, highlight: true },
  { label: 'Enterprise PQC', example: 'PQ Solutions, ISARA', price: '$100K+/yr', position: 85 },
]

export default function BusinessModelSlide({ scenario = 'all' }: { scenario?: Scenario }) {
  const scenarios: Array<'base' | 'upside' | 'conservative'> = ['base', 'upside', 'conservative']
  const activeScenarios = scenario === 'all' ? scenarios : [scenario as 'base' | 'upside' | 'conservative']

  // For 'all' mode: 3 total revenue lines
  const allData = REVENUE_PROJECTIONS.base.map((d, i) => ({
    year: d.year,
    base: REVENUE_PROJECTIONS.base[i].revenue,
    upside: REVENUE_PROJECTIONS.upside[i].revenue,
    conservative: REVENUE_PROJECTIONS.conservative[i].revenue,
  }))

  // For single scenario: stacked areas by module
  const singleScenario = scenario === 'all' ? 'base' : (scenario as 'base' | 'upside' | 'conservative')
  const stackedData = REVENUE_PROJECTIONS[singleScenario].map((d) => {
    const result: Record<string, number | string> = { year: d.year }
    REVENUE_MODULES.forEach((mod) => {
      result[mod.name] = +(d.revenue * mod.share / 100).toFixed(2)
    })
    return result
  })

  return (
    <SlideWrapper>
      {/* Header */}
      <motion.div {...fadeUp()} className="text-center mb-8">
        <p className="text-quantum-400 font-mono text-sm tracking-widest uppercase mb-3">
          Business Model
        </p>
        <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-3">
          <span className="gradient-text">QCaaS + QCaaP</span> Dual Engine
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Two complementary revenue streams: consumer subscriptions and developer platform licensing
        </p>
      </motion.div>

      {/* Gross Margin Headline + Norwegian Advantage */}
      <motion.div {...fadeUp(0.03)} className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="card-quantum flex items-center gap-4 border-l-2 border-quantum-500/50">
          <div className="w-14 h-14 rounded-xl bg-quantum-500/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-7 h-7 text-quantum-400" />
          </div>
          <div>
            <p className="text-3xl font-bold gradient-text font-mono">70%+</p>
            <p className="text-sm text-gray-300">Gross Margins</p>
            <p className="text-xs text-gray-500 mt-0.5">Software-native model, minimal COGS</p>
          </div>
        </div>
        <div className="card-quantum flex items-center gap-4 border-l-2 border-emerald-500/50">
          <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <MapPin className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-400 mb-0.5">Norwegian Cost Advantage</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Norwegian engineering base provides <span className="text-white font-semibold">40-55% cost savings</span> vs US,
              with access to Europe&apos;s top quantum talent pipeline
            </p>
          </div>
        </div>
      </motion.div>

      {/* Revenue Streams */}
      <motion.div {...fadeUp(0.05)} className="grid sm:grid-cols-2 gap-4 mb-8">
        {REVENUE_STREAMS.map((rs) => (
          <div key={rs.name} className="card-quantum border-t-2 border-quantum-500/30">
            <div className="flex items-center gap-3 mb-3">
              <rs.icon className="w-5 h-5 text-quantum-400" />
              <div>
                <span className="text-lg font-bold text-white font-mono">{rs.name}</span>
                <span className="text-xs text-gray-500 ml-2">{rs.full}</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">{rs.detail}</p>
          </div>
        ))}
      </motion.div>

      {/* Market Gap Visualization */}
      <motion.div {...fadeUp(0.08)} className="card-quantum mb-8">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-quantum-400" />
          Market Pricing Gap
        </h3>
        <div className="relative h-16">
          {/* Track */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-white/5 rounded-full" />
          <div className="absolute top-6 left-[30%] right-[20%] h-1 bg-quantum-500/20 rounded-full" />

          {/* Markers */}
          {MARKET_GAP.map((item) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="absolute flex flex-col items-center"
              style={{ left: `${item.position}%`, transform: 'translateX(-50%)' }}
            >
              <div
                className={`w-3 h-3 rounded-full ${
                  item.highlight
                    ? 'bg-quantum-400 shadow-lg shadow-quantum-400/40 ring-2 ring-quantum-400/30'
                    : 'bg-gray-500'
                }`}
                style={{ marginTop: '18px' }}
              />
              <p className={`text-[10px] font-mono mt-1.5 ${item.highlight ? 'text-quantum-400 font-bold' : 'text-gray-500'}`}>
                {item.price}
              </p>
              <p className={`text-[9px] ${item.highlight ? 'text-gray-300' : 'text-gray-600'}`}>
                {item.label}
              </p>
            </motion.div>
          ))}

          {/* Gap Arrow */}
          <div className="absolute top-1 left-[35%] right-[20%] flex items-center justify-center">
            <span className="text-[9px] font-mono text-quantum-400/70 bg-quantum-500/10 px-2 py-0.5 rounded-full">
              Massive gap -- Zipminator fills it
            </span>
          </div>
        </div>
      </motion.div>

      {/* Revenue Projection Chart */}
      <motion.div {...fadeUp(0.09)} className="card-quantum mb-8">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-quantum-400" />
          {scenario === 'all' ? 'Revenue Projections by Scenario ($M)' : `Revenue Breakdown: ${singleScenario} ($M)`}
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          {scenario === 'all' ? (
            <LineChart data={allData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="year" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v: number) => `$${v}M`} />
              <Tooltip
                {...TOOLTIP_STYLE}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any, name: any) => [`$${value}M`, String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
              />
              <Legend
                verticalAlign="bottom"
                height={30}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => <span style={{ color: '#d1d5db', fontSize: 12 }}>{String(value).charAt(0).toUpperCase() + String(value).slice(1)}</span>}
              />
              <ReferenceLine x={2028} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Break-even', fill: '#ef4444', fontSize: 11, position: 'top' }} />
              {activeScenarios.map((s) => (
                <Line
                  key={s}
                  type="monotone"
                  dataKey={s}
                  stroke={SCENARIO_COLORS[s]}
                  strokeWidth={2}
                  strokeDasharray={s === 'conservative' ? '6 3' : undefined}
                  dot={{ r: 4, fill: SCENARIO_COLORS[s], strokeWidth: 2, stroke: '#111827' }}
                  animationDuration={1200}
                />
              ))}
            </LineChart>
          ) : (
            <AreaChart data={stackedData}>
              <defs>
                {REVENUE_MODULES.map((mod, i) => (
                  <linearGradient key={mod.name} id={`gradModule${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={MODULE_COLORS[i]} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={MODULE_COLORS[i]} stopOpacity={0.05} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="year" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v: number) => `$${v}M`} />
              <Tooltip
                {...TOOLTIP_STYLE}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [`$${value}M`]}
              />
              <Legend
                verticalAlign="bottom"
                height={30}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => <span style={{ color: '#d1d5db', fontSize: 12 }}>{value}</span>}
              />
              <ReferenceLine x={2028} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Break-even', fill: '#ef4444', fontSize: 11, position: 'top' }} />
              {REVENUE_MODULES.map((mod, i) => (
                <Area
                  key={mod.name}
                  type="monotone"
                  dataKey={mod.name}
                  stackId="1"
                  stroke={MODULE_COLORS[i]}
                  fill={`url(#gradModule${i})`}
                  animationDuration={1200}
                />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </motion.div>

      {/* Pricing Tiers */}
      <motion.div {...fadeUp(0.1)}>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-quantum-400" />
          Four-Tier Pricing
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRICING_TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + i * 0.06 }}
              className={`card-quantum relative flex flex-col ${
                tier.highlighted
                  ? 'border-quantum-500/40 ring-1 ring-quantum-500/20 shadow-lg shadow-quantum-500/10'
                  : ''
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-quantum-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-quantum-500/30">
                    <Star className="w-3 h-3" />
                    Popular
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-white mb-1">{tier.name}</h4>
                <p className="text-xs text-gray-500">{tier.target}</p>
              </div>

              <div className="mb-4">
                <span className={`text-3xl font-bold font-mono ${tier.highlighted ? 'gradient-text' : 'gradient-text'}`}>
                  {tier.price}
                </span>
                {tier.price !== '$0' && tier.price !== 'Custom' && !tier.price.includes('/mo') && (
                  <span className="text-xs text-gray-500 ml-1">/mo</span>
                )}
              </div>

              <ul className="space-y-2 flex-1">
                {tier.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-xs text-gray-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-quantum-500 mt-0.5 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Unit Economics */}
      <motion.div {...fadeUp(0.2)} className="grid sm:grid-cols-3 gap-4 mt-8">
        {[
          { label: 'LTV:CAC Target', value: '3:1+', detail: 'Network effects drive organic growth' },
          { label: 'Payback Period', value: '<12 mo', detail: 'Annual contracts for Pro/Enterprise' },
          { label: 'Net Revenue Retention', value: '120%+', detail: 'Expansion via tier upgrades + API usage' },
        ].map((m) => (
          <div key={m.label} className="card-quantum text-center">
            <p className="text-2xl font-bold gradient-text font-mono">{m.value}</p>
            <p className="text-sm font-semibold text-white mt-1">{m.label}</p>
            <p className="text-xs text-gray-400 mt-1">{m.detail}</p>
          </div>
        ))}
      </motion.div>
    </SlideWrapper>
  )
}
