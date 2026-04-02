'use client'

import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { PATENT_STACK, STACK_FLOW } from '@/lib/blueprint-data'

const COVERAGE_DATA = [
  { layer: 'Data Layer', P1: 90, P2: 30, P3: 60 },
  { layer: 'Infra Layer', P2: 85, P1: 20, P3: 70 },
  { layer: 'Foundation Layer', P3: 95, P2: 75, P1: 15 },
]

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
            {entry.value}%
          </span>
        </p>
      ))}
    </div>
  )
}

const ArrowDown = () => (
  <svg
    width="24"
    height="32"
    viewBox="0 0 24 32"
    fill="none"
    className="mx-auto"
  >
    <path
      d="M12 0 L12 26 M4 20 L12 28 L20 20"
      stroke="rgba(255,255,255,0.3)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const SectionPatentStack = () => {
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
        The three patents form a vertical stack where each layer feeds the next.
        P2 generates raw entropy from WiFi CSI and quantum sources. P3 certifies
        and composes that entropy with algebraic extraction and Merkle provenance.
        P1 consumes the certified entropy to produce information-theoretically
        irreversible anonymization. Together they create a closed system that is
        far harder to replicate than any single patent.
      </motion.p>

      {/* Stacked patent cards with flow arrows */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col items-center gap-0"
      >
        {PATENT_STACK.slice()
          .sort((a, b) => {
            const order = ['Consumption', 'Composition', 'Generation']
            return order.indexOf(a.layer) - order.indexOf(b.layer)
          })
          .map((patent, idx, arr) => {
            const flow = STACK_FLOW.find((f) => f.to === patent.id)
            return (
              <div key={patent.id} className="flex flex-col items-center w-full max-w-xl">
                {idx > 0 && (
                  <div className="flex flex-col items-center py-1">
                    <ArrowDown />
                    {flow && (
                      <span
                        className="text-xs text-slate-500 font-mono mt-0.5"
                        style={{ fontFamily: 'var(--font-jetbrains)' }}
                      >
                        {flow.label}
                      </span>
                    )}
                  </div>
                )}
                <div
                  className="w-full rounded-xl p-5 border"
                  style={{
                    background: 'rgba(15,23,42,0.7)',
                    borderColor: `${patent.color}33`,
                    borderLeftWidth: '4px',
                    borderLeftColor: patent.color,
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xs font-bold font-mono px-2 py-0.5 rounded"
                          style={{
                            background: `${patent.color}20`,
                            color: patent.color,
                            fontFamily: 'var(--font-jetbrains)',
                          }}
                        >
                          {patent.id}
                        </span>
                        <span
                          className="text-xs text-slate-500 font-mono"
                          style={{ fontFamily: 'var(--font-jetbrains)' }}
                        >
                          {patent.layer}
                        </span>
                      </div>
                      <h3
                        className="text-base font-semibold text-slate-100 mb-1"
                        style={{ fontFamily: 'var(--font-fraunces)' }}
                      >
                        {patent.name}
                      </h3>
                      <p
                        className="text-sm text-slate-400 leading-relaxed"
                        style={{ fontFamily: 'var(--font-dm-sans)' }}
                      >
                        {patent.desc}
                      </p>
                    </div>
                    <span
                      className="flex-none text-xs font-mono px-2 py-1 rounded"
                      style={{
                        background:
                          patent.status === 'FILED'
                            ? 'rgba(34,211,238,0.15)'
                            : 'rgba(245,158,11,0.15)',
                        color: patent.status === 'FILED' ? '#22D3EE' : '#F59E0B',
                        fontFamily: 'var(--font-jetbrains)',
                      }}
                    >
                      {patent.status}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
      </motion.div>

      {/* Security coverage bar chart */}
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
          Security Coverage by Layer
        </h3>
        <p
          className="text-sm text-slate-400 mb-6"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          Each patent contributes differently across the data, infrastructure, and
          foundation layers, creating overlapping coverage that is difficult to
          circumvent.
        </p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={COVERAGE_DATA}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
              />
              <XAxis
                dataKey="layer"
                tick={{ fill: '#9ca3af', fontSize: 13 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 13, color: '#9ca3af' }}
                iconType="square"
              />
              <Bar
                dataKey="P1"
                name="P1 Anonymization"
                fill="#22D3EE"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="P2"
                name="P2 CSI Entropy"
                fill="#F59E0B"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="P3"
                name="P3 CHE + ARE"
                fill="#34D399"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Key insight box */}
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
        <div className="flex gap-3">
          <span className="flex-none text-lg mt-0.5">&#x1f512;</span>
          <div>
            <h4
              className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-2"
              style={{ fontFamily: 'var(--font-jetbrains)' }}
            >
              Key Insight
            </h4>
            <p
              className="text-slate-200 leading-relaxed"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              A competitor needs licenses to all three patents. Designing around one
              is hard. Designing around all three simultaneously while still
              delivering quantum-safe, auditable, multi-source entropy with provable
              anonymization is practically impossible.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
