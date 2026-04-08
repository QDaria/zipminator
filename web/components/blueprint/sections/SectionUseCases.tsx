'use client'

import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { USE_CASES } from '@/lib/blueprint-data'

const sorted = [...USE_CASES].sort((a, b) => b.urgency - a.urgency)

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div
      className="max-w-xs rounded-lg px-4 py-3 text-xs shadow-xl"
      style={{
        background: 'rgba(17,24,39,0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <p className="mb-1 font-medium text-slate-200">{d.sector}</p>
      <p className="mb-1 text-slate-400">{d.useCase}</p>
      <div className="flex items-center gap-3">
        <span className="text-slate-400">
          Urgency: <span className="font-mono text-slate-100">{d.urgency}</span>
        </span>
        <span className="text-slate-400">
          TAM: <span className="font-mono text-slate-100">${d.tam}B</span>
        </span>
      </div>
    </div>
  )
}

const urgencyBadgeColor = (urgency: number): string => {
  if (urgency >= 90) return '#ef4444'
  if (urgency >= 75) return '#f59e0b'
  if (urgency >= 60) return '#3b82f6'
  return '#6b7280'
}

const urgencyLabel = (urgency: number): string => {
  if (urgency >= 90) return 'Critical'
  if (urgency >= 75) return 'High'
  if (urgency >= 60) return 'Medium'
  return 'Low'
}

export const SectionUseCases = () => (
  <div className="space-y-10">
    {/* --- Horizontal Bar Chart --- */}
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-xl p-6"
      style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(245,158,11,0.15)', boxShadow: '0 0 20px rgba(245,158,11,0.06), 0 4px 16px rgba(0,0,0,0.3)' }}
    >
      <h3 className="mb-6 text-sm font-mono uppercase tracking-wider text-slate-400">
        Urgency by Sector
      </h3>
      <ResponsiveContainer width="100%" height={sorted.length * 40 + 20}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
            horizontal={false}
          />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="sector"
            width={110}
            tick={{ fill: '#cbd5e1', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="urgency" radius={[0, 4, 4, 0]} barSize={20}>
            {sorted.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>

    {/* --- Use Case Cards --- */}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((uc, i) => (
        <motion.div
          key={uc.sector}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: i * 0.04 }}
          className="rounded-xl p-5 transition-colors hover:bg-white/[0.03]"
          style={{
            background: `linear-gradient(180deg, ${uc.color}08, rgba(15,23,42,0.6))`,
            borderTop: `3px solid ${uc.color}`,
          }}
        >
          {/* Sector */}
          <h4 className="mb-1 text-base font-semibold text-slate-100">
            {uc.sector}
          </h4>

          {/* Orgs */}
          <p className="mb-3 text-xs font-mono text-slate-500 leading-relaxed">
            {uc.orgs}
          </p>

          {/* Description */}
          <p className="mb-4 text-sm leading-relaxed text-slate-300">
            {uc.useCase}
          </p>

          {/* Footer: urgency + TAM */}
          <div className="flex items-center justify-between">
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wide"
              style={{
                background: `${urgencyBadgeColor(uc.urgency)}22`,
                color: urgencyBadgeColor(uc.urgency),
                border: `1px solid ${urgencyBadgeColor(uc.urgency)}33`,
              }}
            >
              {urgencyLabel(uc.urgency)} {uc.urgency}
            </span>
            <span className="text-xs font-mono text-slate-400">
              TAM ${uc.tam}B
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
)
