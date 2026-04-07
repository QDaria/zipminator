'use client'

import { motion } from 'framer-motion'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from 'recharts'
import { IP_SCORES, IP_COMPOSITES, PORTFOLIO_VALUATION } from '@/lib/blueprint-data'

const ASSET_COLORS: Record<string, { stroke: string; opacity: number }> = {
  P1: { stroke: '#22D3EE', opacity: 0.15 },
  P2: { stroke: '#F59E0B', opacity: 0.2 },
  P3: { stroke: '#34D399', opacity: 0.15 },
  App: { stroke: '#A78BFA', opacity: 0.1 },
}

const ASSET_LABELS: Record<string, string> = {
  P1: 'P1: Anonymization',
  P2: 'P2: CSI/PUEK',
  P3: 'P3: CHE/ARE',
  App: 'Zipminator App',
}

const CustomTooltip = ({ active, payload, label }: {
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
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: entry.color }} />
          <span className="text-slate-400">{entry.name}:</span>{' '}
          <span className="font-mono" style={{ fontFamily: 'var(--font-jetbrains)' }}>{entry.value}/10</span>
        </p>
      ))}
    </div>
  )
}

const fmtVal = (v: number) => {
  if (v >= 1000) return `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}B`
  return `$${v}M`
}

export const SectionIPScoring = () => (
  <div className="space-y-12">
    {/* Intro */}
    <motion.p
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="text-slate-300 text-lg leading-relaxed max-w-3xl"
      style={{ fontFamily: 'var(--font-dm-sans)' }}
    >
      Each IP asset is scored across seven dimensions on a 1-10 scale. Patent 2 (CSI/PUEK)
      achieves the highest composite at 9.4/10, with perfect scores in novelty, defensibility,
      market reach, and revenue potential. This scoring methodology is derived from standard
      patent portfolio valuation frameworks.
    </motion.p>

    {/* Composite Score Cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {IP_COMPOSITES.map((item, i) => (
        <motion.div
          key={item.asset}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
          className="rounded-xl p-5 border text-center"
          style={{
            background: `linear-gradient(135deg, ${item.color}08, ${item.color}03)`,
            borderColor: `${item.color}33`,
          }}
        >
          <p className="text-xs uppercase tracking-wider mb-2 text-slate-500" style={{ fontFamily: 'var(--font-jetbrains)' }}>
            {item.asset.split(':')[0]}
          </p>
          <p className="text-3xl font-bold mb-1" style={{ color: item.color, fontFamily: 'var(--font-jetbrains)' }}>
            {item.composite}
          </p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">/10 composite</p>
          <p className="text-xs text-slate-400 mt-2 font-mono" style={{ fontFamily: 'var(--font-jetbrains)' }}>
            {item.value}
          </p>
        </motion.div>
      ))}
    </div>

    {/* 7-Dimension Radar */}
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-xl p-6 border"
      style={{ background: 'rgba(15,23,42,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <h3 className="text-lg font-semibold text-slate-100 mb-1" style={{ fontFamily: 'var(--font-fraunces)' }}>
        7-Dimension IP Assessment
      </h3>
      <p className="text-sm text-slate-400 mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
        Each dimension scored 1-10. Patent 2 dominates with four perfect 10s.
      </p>

      <ResponsiveContainer width="100%" height={440}>
        <RadarChart data={IP_SCORES} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="rgba(255,255,255,0.06)" />
          <PolarAngleAxis dataKey="dimension" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickCount={6} />
          <Tooltip content={<CustomTooltip />} />
          {Object.entries(ASSET_COLORS).map(([key, style]) => (
            <Radar
              key={key}
              name={ASSET_LABELS[key]}
              dataKey={key}
              stroke={style.stroke}
              fill={style.stroke}
              fillOpacity={style.opacity}
              strokeWidth={key === 'P2' ? 3 : 2}
            />
          ))}
          <Legend
            wrapperStyle={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11 }}
            iconType="line"
            formatter={(value: string) => <span className="text-slate-300">{value}</span>}
          />
        </RadarChart>
      </ResponsiveContainer>
    </motion.div>

    {/* Portfolio Valuation Range */}
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-xl p-6 border"
      style={{ background: 'rgba(15,23,42,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <h3 className="text-lg font-semibold text-slate-100 mb-1" style={{ fontFamily: 'var(--font-fraunces)' }}>
        Portfolio Valuation Waterfall
      </h3>
      <p className="text-sm text-slate-400 mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
        Individual patent and platform values combine with thicket synergy to yield
        a combined portfolio range of $10B-$100B.
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={PORTFOLIO_VALUATION} layout="vertical" margin={{ top: 5, right: 60, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={fmtVal} />
          <YAxis type="category" dataKey="asset" width={140} tick={{ fill: '#e2e8f0', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0', fontSize: 12 }}
            formatter={(value: number) => [fmtVal(value), '']}
          />
          <Bar dataKey="high" name="High" fill="#34D399" fillOpacity={0.3} radius={[0, 4, 4, 0]} barSize={24}>
            {PORTFOLIO_VALUATION.map((entry) => (
              <Cell key={entry.asset} fill={entry.color} fillOpacity={0.6} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>

    {/* Combined Portfolio Callout */}
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-xl p-6 border"
      style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(34,211,238,0.04))',
        borderColor: 'rgba(245,158,11,0.2)',
      }}
    >
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="text-center md:text-left">
          <p className="text-xs uppercase tracking-wider text-amber-400 mb-1 font-mono" style={{ fontFamily: 'var(--font-jetbrains)' }}>
            Combined Portfolio Value
          </p>
          <p className="text-4xl lg:text-5xl font-bold text-slate-50" style={{ fontFamily: 'var(--font-fraunces)' }}>
            $10B - $100B
          </p>
          <p className="text-sm text-slate-400 mt-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Floor set by thicket synergy; ceiling by standard-essential status
          </p>
        </div>
        <div className="flex-1 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg p-3" style={{ background: 'rgba(15,23,42,0.6)' }}>
            <p className="text-xs text-slate-500">Qualcomm comparison</p>
            <p className="text-sm font-mono text-slate-200" style={{ fontFamily: 'var(--font-jetbrains)' }}>~$6B/yr royalties</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'rgba(15,23,42,0.6)' }}>
            <p className="text-xs text-slate-500">ARM comparison</p>
            <p className="text-sm font-mono text-slate-200" style={{ fontFamily: 'var(--font-jetbrains)' }}>~$3B/yr licenses</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'rgba(15,23,42,0.6)' }}>
            <p className="text-xs text-slate-500">QDaria target base</p>
            <p className="text-sm font-mono text-slate-200" style={{ fontFamily: 'var(--font-jetbrains)' }}>18.2B WiFi devices</p>
          </div>
        </div>
      </div>
    </motion.div>
  </div>
)
