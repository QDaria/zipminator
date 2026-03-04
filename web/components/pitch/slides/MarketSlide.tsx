'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import {
  MARKET_ANALYSTS,
  TAM_SAM_SOM,
} from '@/lib/pitch-data'
import type { Scenario } from '@/lib/pitch-data'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { TrendingUp, Target, BarChart3 } from 'lucide-react'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
})

type Tab = 'consensus' | 'tam-sam-som'

const chartData = MARKET_ANALYSTS.map((a) => ({
  firm: a.firm.replace(' Research', '').replace(' Intelligence', ''),
  tam2025: parseFloat(a.tam2025.replace('$', '').replace('B', '')),
  tam2034: parseFloat(a.tam2034.replace('$', '').replace('B', '')),
  cagr: parseInt(a.cagr),
}))

const BAR_COLORS = [
  '#6366f1', '#818cf8', '#a78bfa', '#c084fc',
  '#8b5cf6', '#7c3aed', '#6d28d9',
]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-white mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-xs text-gray-300">
          {p.dataKey === 'tam2025' ? '2025' : '2034'}: ${p.value}B
        </p>
      ))}
    </div>
  )
}

export default function MarketSlide({ scenario: _scenario }: { scenario?: Scenario }) {
  const [tab, setTab] = useState<Tab>('consensus')

  const avgTam2034 =
    chartData.reduce((sum, d) => sum + d.tam2034, 0) / chartData.length
  const avgCagr =
    chartData.reduce((sum, d) => sum + d.cagr, 0) / chartData.length

  return (
    <SlideWrapper>
      {/* Header */}
      <motion.div {...fadeUp()} className="text-center mb-8">
        <p className="text-quantum-400 font-mono text-sm tracking-widest uppercase mb-3">
          Market Opportunity
        </p>
        <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-3">
          A <span className="gradient-text">${avgTam2034.toFixed(0)}B+</span> Market by 2034
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Seven independent analyst firms converge on 30-46% CAGR for post-quantum cryptography
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div {...fadeUp(0.05)} className="flex items-center justify-center gap-2 mb-8">
        {([
          { key: 'consensus' as Tab, label: '7-Firm Consensus', icon: BarChart3 },
          { key: 'tam-sam-som' as Tab, label: 'TAM / SAM / SOM', icon: Target },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-all ${
              tab === key
                ? 'bg-white/10 border border-white/20 text-white'
                : 'bg-white/[0.03] border border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </motion.div>

      {tab === 'consensus' ? (
        <>
          {/* Summary Stats */}
          <motion.div {...fadeUp(0.1)} className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Avg TAM 2034', value: `$${avgTam2034.toFixed(1)}B` },
              { label: 'Avg CAGR', value: `${avgCagr.toFixed(0)}%` },
              { label: 'Analyst Firms', value: '7' },
            ].map((s) => (
              <div key={s.label} className="card-quantum text-center">
                <p className="text-2xl font-bold gradient-text font-mono">{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Recharts Bar Chart */}
          <motion.div {...fadeUp(0.15)} className="card-quantum">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-quantum-400" />
              <h3 className="text-lg font-semibold text-white">
                PQC Market Size by Analyst Firm (2034 TAM, $B)
              </h3>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <XAxis
                    dataKey="firm"
                    tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'monospace' }}
                    axisLine={{ stroke: '#374151' }}
                    tickLine={false}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'monospace' }}
                    axisLine={{ stroke: '#374151' }}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${v}B`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="tam2034" radius={[6, 6, 0, 0]} maxBarSize={50}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Per-Firm Detail Table */}
          <motion.div {...fadeUp(0.2)} className="card-quantum mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs font-mono uppercase border-b border-white/10">
                    <th className="text-left py-2 pr-4">Firm</th>
                    <th className="text-right py-2 px-2">2025</th>
                    <th className="text-right py-2 px-2">2034</th>
                    <th className="text-right py-2 pl-2">CAGR</th>
                  </tr>
                </thead>
                <tbody>
                  {MARKET_ANALYSTS.map((a, i) => (
                    <tr key={a.firm} className="border-b border-white/5">
                      <td className="py-2 pr-4 text-gray-300 flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: BAR_COLORS[i] }}
                        />
                        {a.firm}
                      </td>
                      <td className="py-2 px-2 text-right text-gray-400 font-mono">{a.tam2025}</td>
                      <td className="py-2 px-2 text-right text-white font-mono font-semibold">{a.tam2034}</td>
                      <td className="py-2 pl-2 text-right text-quantum-400 font-mono">{a.cagr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      ) : (
        /* TAM / SAM / SOM Tab */
        <motion.div {...fadeUp(0.1)}>
          {/* Concentric rings visual */}
          <div className="flex flex-col lg:flex-row items-center gap-10 mb-8">
            <div className="relative w-72 h-72 shrink-0">
              {/* TAM ring */}
              <div className="absolute inset-0 rounded-full border-2 border-quantum-500/30 bg-quantum-500/5 flex items-center justify-center">
                <span className="absolute top-3 text-[10px] font-mono text-quantum-400/60 uppercase">TAM</span>
              </div>
              {/* SAM ring */}
              <div className="absolute inset-10 rounded-full border-2 border-quantum-400/40 bg-quantum-400/8 flex items-center justify-center">
                <span className="absolute top-3 text-[10px] font-mono text-quantum-300/60 uppercase">SAM</span>
              </div>
              {/* SOM ring */}
              <div className="absolute inset-20 rounded-full border-2 border-quantum-300/50 bg-quantum-300/10 flex items-center justify-center">
                <span className="text-[10px] font-mono text-quantum-200/60 uppercase">SOM</span>
              </div>
            </div>

            <div className="space-y-6 flex-1">
              {[
                {
                  label: 'TAM',
                  title: 'Total Addressable Market',
                  value: TAM_SAM_SOM.tam,
                  desc: TAM_SAM_SOM.tamDesc,
                  color: 'text-quantum-400',
                  bg: 'bg-quantum-500/10',
                },
                {
                  label: 'SAM',
                  title: 'Serviceable Addressable Market',
                  value: TAM_SAM_SOM.sam,
                  desc: TAM_SAM_SOM.samDesc,
                  color: 'text-quantum-300',
                  bg: 'bg-quantum-400/10',
                },
                {
                  label: 'SOM',
                  title: 'Serviceable Obtainable Market',
                  value: TAM_SAM_SOM.som,
                  desc: TAM_SAM_SOM.somDesc,
                  color: 'text-quantum-200',
                  bg: 'bg-quantum-300/10',
                },
              ].map((m) => (
                <div key={m.label} className="flex items-start gap-4">
                  <div
                    className={`shrink-0 w-12 h-12 rounded-xl ${m.bg} flex items-center justify-center`}
                  >
                    <span className={`text-lg font-bold font-mono ${m.color}`}>
                      {m.label}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-mono uppercase">{m.title}</p>
                    <p className={`text-2xl font-bold font-mono ${m.color}`}>{m.value}</p>
                    <p className="text-sm text-gray-400">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Government Spend Context */}
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: 'US Gov Spend', value: '$7.1B', detail: 'PQC migration budget' },
              { label: 'Norway', value: '$175M', detail: 'Quantum Initiative' },
              { label: 'EU Investment', value: 'EUR 400M+', detail: 'Quantum Flagship Phase 2' },
            ].map((g) => (
              <div key={g.label} className="card-quantum text-center">
                <p className="text-xs text-gray-500 font-mono mb-1">{g.label}</p>
                <p className="text-xl font-bold gradient-text font-mono">{g.value}</p>
                <p className="text-xs text-gray-400 mt-1">{g.detail}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Bottom context */}
      <motion.div {...fadeUp(0.25)} className="mt-6 flex items-center gap-3 px-5 py-3 rounded-xl bg-quantum-500/[0.06] border border-quantum-500/15">
        <TrendingUp className="w-5 h-5 text-quantum-400 shrink-0" />
        <p className="text-sm text-gray-300">
          <span className="text-quantum-400 font-semibold">Cybersecurity TAM:</span>{' '}
          $228B (2025) growing to $500-700B by 2030-34. PQC is the fastest-growing segment.
        </p>
      </motion.div>
    </SlideWrapper>
  )
}
