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
} from 'recharts'
import { NOVELTY_RADAR, PRIOR_ART_COMPARISON } from '@/lib/blueprint-data'
import { SECTION_PROSE } from '@/lib/blueprint-prose'
import { ProseBlock, CalloutBlock, Subsection } from '@/components/blueprint/BlueprintSection'

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(17,24,39,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: 12,
  fontFamily: 'var(--font-dm-sans), sans-serif',
}

const LEGEND_STYLE = {
  fontFamily: 'var(--font-jetbrains), monospace',
  fontSize: 11,
}

export const SectionNovelty = () => {
  const prose = SECTION_PROSE.novelty

  return (
    <div className="space-y-12">
      {/* Radar chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="rounded-xl p-6"
        style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h3
          className="text-lg font-semibold text-slate-100 mb-6"
          style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
        >
          Patent Novelty vs. Prior Art
        </h3>

        <ResponsiveContainer width="100%" height={420}>
          <RadarChart data={NOVELTY_RADAR} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="rgba(255,255,255,0.06)" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'var(--font-dm-sans)' }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#475569', fontSize: 10 }}
              axisLine={false}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />

            {/* Prior Art dashed gray */}
            <Radar
              name="Prior Art"
              dataKey="priorArt"
              stroke="#64748b"
              fill="#64748b"
              fillOpacity={0.08}
              strokeDasharray="6 3"
              strokeWidth={1.5}
            />
            {/* P1 cyan */}
            <Radar
              name="P1: Quantum Anonymization"
              dataKey="P1"
              stroke="#22D3EE"
              fill="#22D3EE"
              fillOpacity={0.12}
              strokeWidth={2}
            />
            {/* P2 amber */}
            <Radar
              name="P2: CSI Entropy + PUEK"
              dataKey="P2"
              stroke="#F59E0B"
              fill="#F59E0B"
              fillOpacity={0.10}
              strokeWidth={2}
            />
            {/* P3 emerald */}
            <Radar
              name="P3: CHE + ARE"
              dataKey="P3"
              stroke="#34D399"
              fill="#34D399"
              fillOpacity={0.10}
              strokeWidth={2}
            />

            <Legend
              wrapperStyle={LEGEND_STYLE}
              iconType="line"
              formatter={(value: string) => (
                <span className="text-slate-300">{value}</span>
              )}
            />
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Prior Art Comparison Table */}
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
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium text-xs uppercase tracking-wider">
                  Area
                </th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium text-xs uppercase tracking-wider">
                  Prior Art Approach
                </th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium text-xs uppercase tracking-wider">
                  Limitation
                </th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium text-xs uppercase tracking-wider">
                  Zipminator Advantage
                </th>
              </tr>
            </thead>
            <tbody>
              {PRIOR_ART_COMPARISON.map((row, i) => (
                <tr
                  key={row.area}
                  style={{
                    background: i % 2 === 0 ? 'rgba(15,23,42,0.5)' : 'rgba(15,23,42,0.3)',
                  }}
                >
                  <td className="px-5 py-3.5 text-slate-100 font-medium whitespace-nowrap">
                    {row.area}
                  </td>
                  <td className="px-5 py-3.5 text-slate-300">{row.approach}</td>
                  <td className="px-5 py-3.5 text-slate-400">{row.limitation}</td>
                  <td className="px-5 py-3.5 font-medium" style={{ color: '#34D399' }}>
                    {row.zipAdvantage}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Prose content */}
      {prose && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Section intro */}
          <ProseBlock paragraphs={prose.intro} />

          {/* Subsections */}
          {prose.subsections.map((sub) => (
            <Subsection key={sub.id} heading={sub.heading}>
              <ProseBlock paragraphs={sub.body} />
              {sub.callout && (
                <CalloutBlock
                  type={sub.callout.type}
                  title={sub.callout.title}
                  text={sub.callout.text}
                />
              )}
            </Subsection>
          ))}

          {/* Section conclusion */}
          {prose.conclusion && (
            <div className="mt-10 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <ProseBlock paragraphs={prose.conclusion} />
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
