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
import { COMPARABLES } from '@/lib/blueprint-data'

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(17,24,39,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: 12,
  fontFamily: 'var(--font-dm-sans), sans-serif',
}

const TYPE_COLORS: Record<string, string> = {
  'Quantum security': '#22D3EE',
  'Privacy/compliance': '#A78BFA',
  'Quantum computing': '#F59E0B',
  'Data privacy AI': '#34D399',
  'Data encryption': '#6366f1',
  'Privacy-preserving compute': '#FB7185',
  'PQC algorithms': '#f97316',
  'PQC hardware IP': '#3b82f6',
}

const sorted = [...COMPARABLES].sort((a, b) => b.valuation - a.valuation)

const fmtVal = (v: number) => {
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}B`
  return `$${v}M`
}

export const SectionComparables = () => (
  <div className="space-y-12">
    {/* Intro */}
    <motion.p
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="text-slate-300 leading-relaxed max-w-3xl"
      style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
    >
      Comparable transaction analysis benchmarks QDaria&apos;s IP portfolio against recent
      fundraising rounds and acquisitions in post-quantum cryptography, data privacy,
      and compliance technology. Valuations are drawn from publicly reported rounds
      between 2021 and 2024.
    </motion.p>

    {/* Horizontal BarChart */}
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
        Comparable Valuations
      </h3>

      <ResponsiveContainer width="100%" height={sorted.length * 52 + 40}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 5, right: 80, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickFormatter={fmtVal}
          />
          <YAxis
            type="category"
            dataKey="company"
            width={130}
            tick={{ fill: '#e2e8f0', fontSize: 12, fontFamily: 'var(--font-dm-sans)' }}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: number) => [fmtVal(value), 'Valuation']}
            labelStyle={{ color: '#f1f5f9', fontWeight: 600 }}
          />
          <Bar dataKey="valuation" radius={[0, 6, 6, 0]} barSize={28}>
            {sorted.map((entry) => (
              <Cell
                key={entry.company}
                fill={TYPE_COLORS[entry.type] ?? '#64748b'}
                fillOpacity={0.7}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Type legend */}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2 text-xs text-slate-400">
            <span
              className="w-3 h-3 rounded-sm flex-none"
              style={{ background: color, opacity: 0.7 }}
            />
            <span style={{ fontFamily: 'var(--font-dm-sans)' }}>{type}</span>
          </div>
        ))}
      </div>
    </motion.div>

    {/* Comparables Table */}
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}>
          <thead>
            <tr style={{ background: 'rgba(15,23,42,0.8)' }}>
              {['Company', 'Valuation', 'Year', 'Type', 'Relevance'].map((h) => (
                <th
                  key={h}
                  className="text-left px-5 py-3.5 text-slate-400 font-medium text-xs uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr
                key={row.company}
                className="transition-colors hover:bg-white/[0.03]"
                style={{
                  background: i % 2 === 0 ? 'rgba(15,23,42,0.5)' : 'rgba(15,23,42,0.3)',
                }}
              >
                <td className="px-5 py-3.5 text-slate-100 font-medium whitespace-nowrap">
                  {row.company}
                </td>
                <td
                  className="px-5 py-3.5 font-mono font-semibold"
                  style={{ color: TYPE_COLORS[row.type] ?? '#94a3b8' }}
                >
                  {fmtVal(row.valuation)}
                </td>
                <td className="px-5 py-3.5 text-slate-300">{row.year}</td>
                <td className="px-5 py-3.5 text-slate-300">{row.type}</td>
                <td className="px-5 py-3.5 text-slate-400">{row.relevance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>

    {/* Callout */}
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-xl p-6"
      style={{
        background: 'linear-gradient(135deg, rgba(34,211,238,0.08), rgba(245,158,11,0.06))',
        border: '1px solid rgba(34,211,238,0.2)',
      }}
    >
      <p
        className="text-slate-200 leading-relaxed mb-4"
        style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
      >
        <span className="font-semibold" style={{ color: '#22D3EE' }}>Positioning:</span>{' '}
        QDaria&apos;s three-patent portfolio (46 claims, all filed) positions it between PQShield ($37M, single-domain IP)
        and SandboxAQ ($5.6B, broad quantum security platform). The combination of
        physics-proven anonymization, unilateral CSI entropy, and algebraic randomness
        extraction creates a defensible position with no direct comparable.
      </p>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(15,23,42,0.6)' }}>
          <p className="text-xs text-slate-500">QDaria advantage</p>
          <p className="text-sm font-semibold text-cyan-300">3 patents, 9 pillars</p>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(15,23,42,0.6)' }}>
          <p className="text-xs text-slate-500">Closest comparable</p>
          <p className="text-sm font-semibold text-amber-400">SandboxAQ $5.6B</p>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(15,23,42,0.6)' }}>
          <p className="text-xs text-slate-500">Unique differentiator</p>
          <p className="text-sm font-semibold text-emerald-400">Zero prior art</p>
        </div>
      </div>
    </motion.div>
  </div>
)
