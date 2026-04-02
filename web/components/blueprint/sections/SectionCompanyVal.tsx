'use client'

import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { COMPANY_STAGES, fmt, type BpScenario } from '@/lib/blueprint-data'

interface Props {
  scenario: BpScenario
}

const SCENARIOS: { key: BpScenario; label: string; color: string }[] = [
  { key: 'conservative', label: 'Conservative', color: '#22D3EE' },
  { key: 'moderate', label: 'Moderate', color: '#F59E0B' },
  { key: 'optimistic', label: 'Optimistic', color: '#34D399' },
]

const chartData = COMPANY_STAGES.map((s) => ({
  name: s.stage,
  conservative: s.conservative,
  moderate: s.moderate,
  optimistic: s.optimistic,
}))

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg px-4 py-3 text-xs shadow-xl"
      style={{
        background: 'rgba(17,24,39,0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <p className="mb-2 font-medium text-slate-200">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-slate-400 capitalize">{p.dataKey}:</span>
          <span className="font-mono text-slate-100">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export const SectionCompanyVal = ({ scenario }: Props) => (
  <div className="space-y-10">
    {/* --- Area Chart --- */}
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-xl p-6"
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      <h3 className="mb-6 text-sm font-mono uppercase tracking-wider text-slate-400">
        Funding Trajectory
      </h3>
      <ResponsiveContainer width="100%" height={360}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {SCENARIOS.map((s) => (
              <linearGradient
                key={s.key}
                id={`grad-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={70}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
            tickFormatter={(v: number) => fmt(v)}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          {SCENARIOS.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={scenario === s.key ? 3 : 1.5}
              strokeOpacity={scenario === s.key ? 1 : 0.4}
              fill={`url(#grad-${s.key})`}
              fillOpacity={scenario === s.key ? 1 : 0.15}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>

    {/* --- Valuation Table --- */}
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="overflow-x-auto rounded-xl"
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5">
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-slate-400">
              Stage
            </th>
            {SCENARIOS.map((s) => (
              <th
                key={s.key}
                className="px-4 py-3 text-right font-mono text-xs uppercase tracking-wider"
                style={{
                  color: s.color,
                  background:
                    scenario === s.key ? `${s.color}0a` : 'transparent',
                }}
              >
                {s.label}
              </th>
            ))}
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-slate-400">
              Trigger
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPANY_STAGES.map((row, i) => (
            <tr
              key={i}
              className="border-b border-white/5 transition-colors hover:bg-white/[0.02]"
            >
              <td className="px-4 py-3 font-medium text-slate-200">
                {row.stage}
              </td>
              {SCENARIOS.map((s) => {
                const val = row[s.key]
                return (
                  <td
                    key={s.key}
                    className="px-4 py-3 text-right font-mono"
                    style={{
                      color: scenario === s.key ? s.color : '#cbd5e1',
                      background:
                        scenario === s.key ? `${s.color}0a` : 'transparent',
                      fontWeight: scenario === s.key ? 600 : 400,
                    }}
                  >
                    {fmt(val)}
                  </td>
                )
              })}
              <td className="px-4 py-3 text-slate-400 text-xs max-w-[220px]">
                {row.trigger}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>

    {/* --- Floor Callout --- */}
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-xl p-6"
      style={{
        background: 'linear-gradient(135deg, rgba(34,211,238,0.08), rgba(34,211,238,0.02))',
        border: '1px solid rgba(34,211,238,0.15)',
      }}
    >
      <h4 className="mb-3 text-sm font-semibold text-cyan-300">
        Why the Floor Matters
      </h4>
      <p className="text-sm leading-relaxed text-slate-300">
        Patent thicket = 3 locks on the door. Even if one patent is challenged,
        two remain. The floor ($15-50M pre-revenue) represents the minimum R&amp;D
        cost a competitor would need to replicate the technology without
        infringing.
      </p>
    </motion.div>
  </div>
)
