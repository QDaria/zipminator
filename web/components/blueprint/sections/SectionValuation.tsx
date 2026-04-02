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
  Treemap,
} from 'recharts'
import {
  VALUATION_METHODS,
  RD_COST_BREAKDOWN,
  fmt,
  type BpScenario,
} from '@/lib/blueprint-data'

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(17,24,39,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: 12,
  fontFamily: 'var(--font-dm-sans), sans-serif',
}

const HERO_METRICS: {
  label: string
  index: number
  accent: string
}[] = [
  { label: 'R&D Replacement', index: 0, accent: '#22D3EE' },
  { label: 'Lifetime Value', index: 1, accent: '#F59E0B' },
  { label: 'Pre-Revenue', index: 2, accent: '#34D399' },
]

interface TreemapContentProps {
  x: number
  y: number
  width: number
  height: number
  name: string
  color: string
  amount: number
}

const TreemapContent = ({ x, y, width, height, name, color, amount }: TreemapContentProps) => {
  const showLabel = width > 70 && height > 40
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        fill={color}
        fillOpacity={0.25}
        stroke={color}
        strokeWidth={1.5}
        strokeOpacity={0.5}
      />
      {showLabel && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 8}
            textAnchor="middle"
            fill="#e2e8f0"
            fontSize={11}
            fontFamily="var(--font-dm-sans)"
          >
            {name.length > 22 ? name.slice(0, 20) + '...' : name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 10}
            textAnchor="middle"
            fill={color}
            fontSize={13}
            fontWeight={600}
            fontFamily="var(--font-jetbrains)"
          >
            ${amount}M
          </text>
        </>
      )}
    </g>
  )
}

interface Props {
  scenario: BpScenario
}

export const SectionValuation = ({ scenario }: Props) => {
  const rows = VALUATION_METHODS

  return (
    <div className="space-y-12">
      {/* Hero metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {HERO_METRICS.map((m, i) => {
          const row = rows[m.index]
          const value = row[scenario]
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-xl p-6 text-center"
              style={{
                background: 'rgba(15,23,42,0.5)',
                border: `1px solid ${m.accent}33`,
              }}
            >
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                {m.label}
              </p>
              <p
                className="text-3xl lg:text-4xl font-bold"
                style={{ color: m.accent, fontFamily: 'var(--font-jetbrains), monospace' }}
              >
                {fmt(value, row.unit)}
              </p>
              <p className="text-slate-500 text-xs mt-1 font-mono">
                {fmt(row.conservative, row.unit)} - {fmt(row.optimistic, row.unit)}
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* Grouped BarChart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="rounded-xl p-6"
        style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h3
          className="text-lg font-semibold text-slate-100 mb-6"
          style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
        >
          Valuation by Method
        </h3>

        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={rows} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="method"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'var(--font-dm-sans)' }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickFormatter={(v: number) => fmt(v)}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value: number, name: string) => [fmt(value), name]}
            />
            <Legend
              wrapperStyle={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11 }}
              formatter={(value: string) => (
                <span className="text-slate-300">{value}</span>
              )}
            />
            <Bar dataKey="conservative" name="Conservative" fill="#22D3EE" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
            <Bar dataKey="moderate" name="Moderate" fill="#F59E0B" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
            <Bar dataKey="optimistic" name="Optimistic" fill="#34D399" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* R&D Cost Breakdown Treemap */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-xl p-6"
        style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h3
          className="text-lg font-semibold text-slate-100 mb-6"
          style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
        >
          R&D Cost Breakdown (Replacement Value)
        </h3>

        <ResponsiveContainer width="100%" height={280}>
          <Treemap
            data={RD_COST_BREAKDOWN.map((d) => ({
              name: d.category,
              size: d.amount,
              color: d.color,
              amount: d.amount,
            }))}
            dataKey="size"
            aspectRatio={4 / 3}
            content={<TreemapContent x={0} y={0} width={0} height={0} name="" color="" amount={0} />}
          />
        </ResponsiveContainer>

        {/* Legend below treemap */}
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          {RD_COST_BREAKDOWN.map((d) => (
            <div key={d.category} className="flex items-center gap-2 text-xs text-slate-400">
              <span
                className="w-3 h-3 rounded-sm flex-none"
                style={{ background: d.color, opacity: 0.7 }}
              />
              <span style={{ fontFamily: 'var(--font-dm-sans)' }}>
                {d.category} &mdash; ${d.amount}M
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
