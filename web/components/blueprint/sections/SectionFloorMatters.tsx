'use client'

import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  FunnelChart,
  Funnel,
  LabelList,
  ResponsiveContainer,
} from 'recharts'
import { DESIGN_AROUND_DIFFICULTY, THICKET_FUNNEL } from '@/lib/blueprint-data'

const PATENT_COLORS: Record<string, string> = {
  'P1: Quantum Anonymization': '#22D3EE',
  'P2: CSI Entropy + PUEK': '#F59E0B',
  'P3: CHE + ARE': '#34D399',
}

const FUNNEL_COLORS = ['#6b7280', '#9ca3af', '#f59e0b', '#ef4444', '#dc2626']

const DIMENSIONS = ['Novelty', 'Complexity', 'Standards Lock-in', 'Network Effects'] as const
const DIM_KEYS: Record<(typeof DIMENSIONS)[number], keyof (typeof DESIGN_AROUND_DIFFICULTY)[number]> = {
  Novelty: 'novelty',
  Complexity: 'complexity',
  'Standards Lock-in': 'standardsLock',
  'Network Effects': 'network',
}

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
            {entry.value}/100
          </span>
        </p>
      ))}
    </div>
  )
}

const FunnelTooltip = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { stage: string; fill: string } }>
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
        <span className="text-slate-300">{entry.payload.stage}:</span>{' '}
        <span className="font-mono" style={{ fontFamily: 'var(--font-jetbrains)' }}>
          {entry.value}%
        </span>
      </p>
    </div>
  )
}

const CALLOUT_ITEMS = [
  { metric: '40-55 engineers x 2 years', detail: '$50-100M R&D replacement cost' },
  { metric: '3 patents', detail: '3 independent design-around challenges' },
  { metric: '2 regulatory deadlines', detail: 'DORA 2025, NIST 2030 = forced demand' },
  { metric: '8 world\'s firsts', detail: 'Compounding into an unreplicable moat' },
]

export const SectionFloorMatters = () => {
  // Prepare bar chart data (horizontal) -- each patent as a row with total score
  const barData = DESIGN_AROUND_DIFFICULTY.map((d) => ({
    patent: d.patent.replace(/^P\d: /, ''),
    total: d.total,
    fullLabel: d.patent,
  }))

  // Funnel data with fill colors
  const funnelData = THICKET_FUNNEL.map((item, i) => ({
    ...item,
    fill: FUNNEL_COLORS[i] ?? '#6b7280',
    // Funnel requires non-zero value for the last item to render
    value: item.value === 0 ? 0.5 : item.value,
    originalValue: item.value,
  }))

  return (
    <div className="space-y-10">
      {/* Intro */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-slate-300 text-lg leading-relaxed max-w-3xl"
        style={{ fontFamily: 'var(--font-dm-sans)' }}
      >
        The floor valuation is what matters for seed conversations. It represents the
        minimum defensible value even under pessimistic assumptions. Everything above
        the floor is upside from regulatory tailwinds, enterprise adoption, and standard
        essentiality.
      </motion.p>

      {/* Horizontal Bar Chart: Design-Around Difficulty */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-xl p-6 border"
        style={{ background: 'rgba(15,23,42,0.5)', borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <h3
          className="text-lg font-semibold text-slate-100 mb-1"
          style={{ fontFamily: 'var(--font-fraunces)' }}
        >
          Design-Around Difficulty Score
        </h3>
        <p
          className="text-sm text-slate-400 mb-6"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          Higher = harder for a competitor to design around without infringing.
          Aggregated across novelty, complexity, standards lock-in, and network effects.
        </p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
                tickFormatter={(v: number) => `${v}`}
              />
              <YAxis
                type="category"
                dataKey="patent"
                tick={{ fill: '#cbd5e1', fontSize: 13 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
                width={170}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Total Difficulty" radius={[0, 6, 6, 0]} barSize={32}>
                {barData.map((entry) => (
                  <Cell
                    key={entry.fullLabel}
                    fill={PATENT_COLORS[entry.fullLabel] ?? '#6b7280'}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Dimension Breakdown Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="rounded-xl border overflow-hidden"
        style={{ background: 'rgba(15,23,42,0.5)', borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <div className="p-6 pb-2">
          <h3
            className="text-lg font-semibold text-slate-100 mb-1"
            style={{ fontFamily: 'var(--font-fraunces)' }}
          >
            Per-Dimension Breakdown
          </h3>
          <p
            className="text-sm text-slate-400"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            Scores out of 100 across four moat dimensions.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th
                  className="text-left px-6 py-3 text-slate-400 font-medium"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  Patent
                </th>
                {DIMENSIONS.map((dim) => (
                  <th
                    key={dim}
                    className="text-center px-4 py-3 text-slate-400 font-medium"
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                  >
                    {dim}
                  </th>
                ))}
                <th
                  className="text-center px-6 py-3 text-slate-400 font-medium"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {DESIGN_AROUND_DIFFICULTY.map((row, i) => {
                const color = PATENT_COLORS[row.patent] ?? '#6b7280'
                return (
                  <tr
                    key={row.patent}
                    className="border-b border-white/[0.03]"
                    style={{
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                    }}
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-sm"
                          style={{ background: color }}
                        />
                        <span className="text-slate-300" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                          {row.patent}
                        </span>
                      </div>
                    </td>
                    {DIMENSIONS.map((dim) => {
                      const val = row[DIM_KEYS[dim]] as number
                      return (
                        <td
                          key={dim}
                          className="text-center px-4 py-3 font-mono"
                          style={{ fontFamily: 'var(--font-jetbrains)', color: '#e2e8f0' }}
                        >
                          {val}
                        </td>
                      )
                    })}
                    <td
                      className="text-center px-6 py-3 font-mono font-bold"
                      style={{ fontFamily: 'var(--font-jetbrains)', color }}
                    >
                      {row.total}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Patent Thicket Funnel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-xl p-6 border"
        style={{ background: 'rgba(15,23,42,0.5)', borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <h3
          className="text-lg font-semibold text-slate-100 mb-1"
          style={{ fontFamily: 'var(--font-fraunces)' }}
        >
          Patent Thicket Funnel
        </h3>
        <p
          className="text-sm text-slate-400 mb-6"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          Starting from 100% of all PQC approaches, each filter eliminates options until
          zero remain without a QDaria license.
        </p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip content={<FunnelTooltip />} />
              <Funnel
                dataKey="value"
                nameKey="stage"
                data={funnelData}
                isAnimationActive
              >
                {funnelData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} fillOpacity={0.8} stroke="none" />
                ))}
                <LabelList
                  dataKey="stage"
                  position="center"
                  style={{
                    fill: '#f9fafb',
                    fontSize: 12,
                    fontFamily: 'var(--font-dm-sans)',
                  }}
                />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>
        {/* Funnel legend */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center mt-4">
          {THICKET_FUNNEL.map((item, i) => (
            <div key={item.stage} className="flex items-center gap-2 text-xs text-slate-400">
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ background: FUNNEL_COLORS[i], opacity: 0.8 }}
              />
              {item.stage}: {item.value}%
            </div>
          ))}
        </div>
      </motion.div>

      {/* Callout Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="rounded-xl p-6 border"
        style={{
          background: 'rgba(34,211,238,0.05)',
          borderColor: 'rgba(34,211,238,0.15)',
        }}
      >
        <h4
          className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4"
          style={{ fontFamily: 'var(--font-jetbrains)' }}
        >
          The Floor in Numbers
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CALLOUT_ITEMS.map((item) => (
            <div
              key={item.metric}
              className="rounded-lg p-4 border"
              style={{
                background: 'rgba(15,23,42,0.6)',
                borderColor: 'rgba(255,255,255,0.05)',
              }}
            >
              <p
                className="text-lg font-bold text-slate-100 mb-1"
                style={{ fontFamily: 'var(--font-fraunces)' }}
              >
                {item.metric}
              </p>
              <p
                className="text-sm text-slate-400 leading-relaxed"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
