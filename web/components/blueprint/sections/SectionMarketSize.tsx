'use client'

import { motion } from 'framer-motion'
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  MARKET_SEGMENTS,
  TAM_SAM_SOM,
  MARKET_GROWTH,
  type BpScenario,
} from '@/lib/blueprint-data'

interface Props {
  scenario: BpScenario
}

const fmt = (n: number) => {
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}B`
  if (n < 1) return `$${(n * 1000).toFixed(0)}M`
  return `$${n}B`
}

const SCENARIO_COLOR: Record<BpScenario, string> = {
  conservative: '#22D3EE',
  moderate: '#F59E0B',
  optimistic: '#34D399',
}

const INNER_RING_COLORS = ['#22D3EE', '#F59E0B', '#34D399']

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg px-4 py-3 text-sm shadow-xl"
      style={{
        background: 'rgba(17,24,39,0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#f9fafb',
      }}
    >
      <p className="font-semibold mb-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
        {label}
      </p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm"
            style={{ background: entry.color }}
          />
          <span className="text-slate-400">{entry.name}:</span>{' '}
          <span className="font-mono" style={{ fontFamily: 'var(--font-jetbrains)' }}>
            ${entry.value}B
          </span>
        </p>
      ))}
    </div>
  )
}

const PieTooltip = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>
}) => {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div
      className="rounded-lg px-4 py-3 text-sm shadow-xl"
      style={{
        background: 'rgba(17,24,39,0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#f9fafb',
      }}
    >
      <p className="flex items-center gap-2">
        <span
          className="inline-block w-2.5 h-2.5 rounded-sm"
          style={{ background: entry.payload.fill }}
        />
        <span className="text-slate-300">{entry.name}:</span>{' '}
        <span className="font-mono" style={{ fontFamily: 'var(--font-jetbrains)' }}>
          ${entry.value}B
        </span>
      </p>
    </div>
  )
}

const HeroMetric = ({
  label,
  value,
  color,
  delay,
}: {
  label: string
  value: number
  color: string
  delay: number
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="rounded-xl p-6 border text-center flex-1 min-w-[160px]"
    style={{
      background: `linear-gradient(135deg, ${color}08, ${color}03)`,
      borderColor: `${color}33`,
    }}
  >
    <p
      className="text-xs uppercase tracking-wider mb-2 font-medium"
      style={{ color, fontFamily: 'var(--font-jetbrains)' }}
    >
      {label}
    </p>
    <p
      className="text-3xl lg:text-4xl font-bold text-slate-50"
      style={{ fontFamily: 'var(--font-fraunces)' }}
    >
      {fmt(value)}
    </p>
  </motion.div>
)

export const SectionMarketSize = ({ scenario }: Props) => {
  const market = TAM_SAM_SOM[scenario]
  const scenarioColor = SCENARIO_COLOR[scenario]

  const innerRingData = [
    { name: 'TAM', value: market.tam },
    { name: 'SAM', value: market.sam },
    { name: 'SOM', value: market.som },
  ]

  const outerRingData = MARKET_SEGMENTS.map((seg) => ({
    name: seg.name,
    value: seg.tam2025,
    color: seg.color,
  }))

  return (
    <div className="space-y-10">
      {/* Hero Metrics */}
      <div className="flex flex-wrap gap-4">
        <HeroMetric label="TAM" value={market.tam} color="#6366f1" delay={0} />
        <HeroMetric label="SAM" value={market.sam} color={scenarioColor} delay={0.1} />
        <HeroMetric label="SOM" value={market.som} color="#34D399" delay={0.2} />
      </div>

      {/* Nested Donut */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-xl p-6 border"
        style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(34,211,238,0.15)', boxShadow: '0 0 24px rgba(34,211,238,0.06), 0 4px 20px rgba(0,0,0,0.3)' }}
      >
        <h3
          className="text-lg font-semibold text-slate-100 mb-1"
          style={{ fontFamily: 'var(--font-fraunces)' }}
        >
          Market Composition
        </h3>
        <p
          className="text-sm text-slate-400 mb-6"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          Outer ring: addressable market segments (2025 TAM). Inner ring:
          TAM/SAM/SOM for the {scenario} scenario.
        </p>
        <div className="h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<PieTooltip />} />
              {/* Outer ring: market segments */}
              <Pie
                data={outerRingData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={140}
                innerRadius={105}
                paddingAngle={2}
                strokeWidth={0}
              >
                {outerRingData.map((seg, i) => (
                  <Cell key={i} fill={seg.color} fillOpacity={0.7} />
                ))}
              </Pie>
              {/* Inner ring: TAM/SAM/SOM */}
              <Pie
                data={innerRingData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={55}
                paddingAngle={3}
                strokeWidth={0}
              >
                {innerRingData.map((_, i) => (
                  <Cell key={i} fill={INNER_RING_COLORS[i]} fillOpacity={0.9} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Legends */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center mt-2">
          {outerRingData.map((seg) => (
            <div key={seg.name} className="flex items-center gap-2 text-xs text-slate-400">
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ background: seg.color, opacity: 0.7 }}
              />
              {seg.name}
            </div>
          ))}
          <span className="text-slate-600">|</span>
          {innerRingData.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2 text-xs text-slate-400">
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ background: INNER_RING_COLORS[i] }}
              />
              {d.name}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Stacked Area Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-xl p-6 border"
        style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(34,211,238,0.15)', boxShadow: '0 0 24px rgba(34,211,238,0.06), 0 4px 20px rgba(0,0,0,0.3)' }}
      >
        <h3
          className="text-lg font-semibold text-slate-100 mb-1"
          style={{ fontFamily: 'var(--font-fraunces)' }}
        >
          Market Growth 2024-2035
        </h3>
        <p
          className="text-sm text-slate-400 mb-6"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          Combined addressable markets grow from $200B to $900B+, driven by PQC mandates
          and compliance deadlines.
        </p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={MARKET_GROWTH}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
              />
              <XAxis
                dataKey="year"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
                tickFormatter={(v: number) => `$${v}B`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 13, color: '#9ca3af' }}
                iconType="square"
              />
              {MARKET_SEGMENTS.map((seg) => {
                const key = seg.name.toLowerCase().replace(/[^a-z]/g, '').replace('dataprivacy', 'privacy').replace('postquantumcrypto', 'pqc').replace('compliancegrc', 'compliance').replace('quantumsafevpn', 'vpn')
                const dataKey =
                  key === 'privacy' ? 'privacy' :
                  key === 'pqc' ? 'pqc' :
                  key === 'compliance' ? 'compliance' :
                  'vpn'
                return (
                  <Area
                    key={seg.name}
                    type="monotone"
                    dataKey={dataKey}
                    name={seg.name}
                    stackId="1"
                    stroke={seg.color}
                    fill={seg.color}
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                )
              })}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Summary Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="rounded-xl border overflow-hidden"
        style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(34,211,238,0.15)', boxShadow: '0 0 24px rgba(34,211,238,0.06), 0 4px 20px rgba(0,0,0,0.3)' }}
      >
        <div className="p-6 pb-2">
          <h3
            className="text-lg font-semibold text-slate-100 mb-1"
            style={{ fontFamily: 'var(--font-fraunces)' }}
          >
            Market Size Summary
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th
                  className="text-left px-6 py-3 text-slate-400 font-medium"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  Market
                </th>
                <th
                  className="text-right px-4 py-3 text-slate-400 font-medium"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  2025
                </th>
                <th
                  className="text-right px-4 py-3 text-slate-400 font-medium"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  2030
                </th>
                <th
                  className="text-right px-6 py-3 text-slate-400 font-medium"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  CAGR
                </th>
              </tr>
            </thead>
            <tbody>
              {MARKET_SEGMENTS.map((seg, i) => (
                <tr
                  key={seg.name}
                  className="border-b border-white/[0.03]"
                  style={{
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                  }}
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-sm"
                        style={{ background: seg.color }}
                      />
                      <span className="text-slate-300" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                        {seg.name}
                      </span>
                    </div>
                  </td>
                  <td
                    className="text-right px-4 py-3 text-slate-200 font-mono"
                    style={{ fontFamily: 'var(--font-jetbrains)' }}
                  >
                    ${seg.tam2025}B
                  </td>
                  <td
                    className="text-right px-4 py-3 text-slate-200 font-mono"
                    style={{ fontFamily: 'var(--font-jetbrains)' }}
                  >
                    ${seg.tam2030}B
                  </td>
                  <td
                    className="text-right px-6 py-3 font-mono"
                    style={{ color: seg.color, fontFamily: 'var(--font-jetbrains)' }}
                  >
                    {seg.cagr}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
