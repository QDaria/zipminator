'use client'

import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { REGULATIONS, REGULATORY_TIMELINE } from '@/lib/blueprint-data'

/* -------------------------------------------------------------------------- */
/*  Build cumulative stacked-area data from REGULATORY_TIMELINE               */
/* -------------------------------------------------------------------------- */
const CATEGORY_COLORS: Record<string, string> = {
  privacy: '#6366f1',
  security: '#ef4444',
  pqc: '#22D3EE',
  compliance: '#34D399',
}

const CATEGORY_LABELS: Record<string, string> = {
  privacy: 'Privacy',
  security: 'Security',
  pqc: 'Post-Quantum',
  compliance: 'Compliance',
}

const years = Array.from({ length: 2035 - 2018 + 1 }, (_, i) => 2018 + i)

const cumulativeData = years.map((year) => {
  const counts: Record<string, number> = { privacy: 0, security: 0, pqc: 0, compliance: 0 }
  REGULATORY_TIMELINE.forEach((evt) => {
    if (evt.year <= year) counts[evt.category] += 1
  })
  return { year, ...counts }
})

/* -------------------------------------------------------------------------- */
/*  Shared tooltip                                                             */
/* -------------------------------------------------------------------------- */
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>
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
        <p key={entry.dataKey} className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm"
            style={{ background: entry.color }}
          />
          <span className="text-slate-400">
            {CATEGORY_LABELS[entry.dataKey] ?? entry.name}:
          </span>{' '}
          <span className="font-mono" style={{ fontFamily: 'var(--font-jetbrains)' }}>
            {entry.value}
          </span>
        </p>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */
export const SectionRegulatoryMoat = () => {
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
        The regulatory landscape is not optional context; it is the demand engine.
        Eight overlapping regulations across privacy, security, post-quantum
        cryptography, and compliance create a monotonically increasing pressure
        curve. Every deadline that passes without action raises the penalty floor
        for non-compliant organizations and deepens the moat around solutions that
        already satisfy those requirements.
      </motion.p>

      {/* Area chart: regulatory pressure over time */}
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
          Cumulative Regulatory Pressure (2018\u20132035)
        </h3>
        <p
          className="text-sm text-slate-400 mb-6"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          Each active regulation adds one unit of pressure. The stack never
          decreases.
        </p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={cumulativeData}
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
                interval={2}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 13, color: '#9ca3af' }}
                iconType="square"
              />
              <Area
                type="stepAfter"
                dataKey="privacy"
                name="Privacy"
                stackId="1"
                stroke={CATEGORY_COLORS.privacy}
                fill={CATEGORY_COLORS.privacy}
                fillOpacity={0.35}
              />
              <Area
                type="stepAfter"
                dataKey="security"
                name="Security"
                stackId="1"
                stroke={CATEGORY_COLORS.security}
                fill={CATEGORY_COLORS.security}
                fillOpacity={0.35}
              />
              <Area
                type="stepAfter"
                dataKey="pqc"
                name="Post-Quantum"
                stackId="1"
                stroke={CATEGORY_COLORS.pqc}
                fill={CATEGORY_COLORS.pqc}
                fillOpacity={0.35}
              />
              <Area
                type="stepAfter"
                dataKey="compliance"
                name="Compliance"
                stackId="1"
                stroke={CATEGORY_COLORS.compliance}
                fill={CATEGORY_COLORS.compliance}
                fillOpacity={0.35}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Regulation table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: 'rgba(34,211,238,0.15)', boxShadow: '0 0 24px rgba(34,211,238,0.06), 0 4px 20px rgba(0,0,0,0.3)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            <thead>
              <tr style={{ background: 'rgba(15,23,42,0.8)' }}>
                {['Regulation', 'Citation', 'Requirement', 'Deadline', 'Patent', 'Penalty'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400"
                      style={{ fontFamily: 'var(--font-jetbrains)' }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {REGULATIONS.map((reg, i) => (
                <tr
                  key={reg.id}
                  className="transition-colors hover:bg-white/[0.02]"
                  style={{
                    background: i % 2 === 0 ? 'rgba(15,23,42,0.4)' : 'rgba(15,23,42,0.2)',
                    borderLeft: `3px solid ${reg.color}`,
                  }}
                >
                  <td className="px-4 py-3 font-semibold text-slate-100 whitespace-nowrap">
                    {reg.name}
                  </td>
                  <td
                    className="px-4 py-3 text-slate-300 font-mono whitespace-nowrap"
                    style={{ fontFamily: 'var(--font-jetbrains)' }}
                  >
                    {reg.citation}
                  </td>
                  <td className="px-4 py-3 text-slate-400 max-w-xs">{reg.requirement}</td>
                  <td
                    className="px-4 py-3 text-slate-300 font-mono whitespace-nowrap"
                    style={{ fontFamily: 'var(--font-jetbrains)' }}
                  >
                    {reg.deadline}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className="text-xs font-bold font-mono px-2 py-0.5 rounded"
                      style={{
                        background: 'rgba(34,211,238,0.12)',
                        color: '#22D3EE',
                        fontFamily: 'var(--font-jetbrains)',
                      }}
                    >
                      {reg.patent}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3 text-slate-300 font-mono whitespace-nowrap"
                    style={{ fontFamily: 'var(--font-jetbrains)' }}
                  >
                    {reg.penalty}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* GDPR Recital 26 callout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="rounded-xl p-6 border"
        style={{
          background: 'rgba(99,102,241,0.06)',
          borderColor: 'rgba(99,102,241,0.2)',
        }}
      >
        <div className="flex gap-3">
          <span className="flex-none text-2xl mt-0.5" aria-hidden>
            &#xA7;
          </span>
          <div>
            <h4
              className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-2"
              style={{ fontFamily: 'var(--font-jetbrains)' }}
            >
              GDPR Recital 26
            </h4>
            <blockquote
              className="text-slate-200 leading-relaxed italic"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              &ldquo;The principles of data protection should therefore not apply
              to anonymous information, namely information which does not relate to
              an identified or identifiable natural person or to personal data
              rendered anonymous in such a manner that the data subject is not or
              no longer identifiable.&rdquo;
            </blockquote>
            <p
              className="mt-3 text-sm text-slate-400"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              P1&apos;s quantum-OTP anonymization produces data that satisfies this
              definition by physics, not computation. The mapping cannot be
              reversed because the QRNG source bits no longer exist.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
