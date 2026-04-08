'use client'

import { motion } from 'framer-motion'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { COMPETITORS, COMPETITOR_FEATURES } from '@/lib/blueprint-data'
import { SECTION_PROSE } from '@/lib/blueprint-prose'
import { ProseBlock, CalloutBlock, Subsection } from '@/components/blueprint/BlueprintSection'

const DIMENSIONS = [
  { key: 'pqc', label: 'PQC' },
  { key: 'breadth', label: 'Breadth' },
  { key: 'qrng', label: 'QRNG' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'multiPlatform', label: 'Multi-Platform' },
  { key: 'anonymization', label: 'Anonymization' },
  { key: 'openSource', label: 'Open Source' },
] as const

type DimKey = (typeof DIMENSIONS)[number]['key']

const RADAR_DATA = DIMENSIONS.map(({ key, label }) => {
  const row: Record<string, string | number> = { dimension: label }
  for (const c of COMPETITORS) {
    row[c.name] = c[key as DimKey]
  }
  return row
})

const COMPETITOR_COLORS: Record<string, { stroke: string; opacity: number; width: number }> = {
  Zipminator: { stroke: '#22D3EE', opacity: 0.35, width: 3 },
  Signal: { stroke: '#9ca3af', opacity: 0.15, width: 1.5 },
  ProtonMail: { stroke: '#a855f7', opacity: 0.12, width: 1.5 },
  NordVPN: { stroke: '#3b82f6', opacity: 0.12, width: 1.5 },
  'Wickr (AWS)': { stroke: '#f59e0b', opacity: 0.12, width: 1.5 },
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
            {entry.value}/5
          </span>
        </p>
      ))}
    </div>
  )
}

const featureCell = (val: boolean | string) => {
  if (val === true) return <span className="text-emerald-400 font-bold text-base">&#10003;</span>
  if (val === false) return <span className="text-red-400 font-bold text-base">&#10007;</span>
  if (val === 'partial') return <span className="text-amber-400 font-bold text-base">~</span>
  return null
}

export const SectionCompetitors = () => {
  const prose = SECTION_PROSE['competitors']

  // Helper to find a prose subsection by id
  const sub = (id: string) => prose?.subsections.find((s) => s.id === id)

  return (
    <div className="space-y-10">
      {/* Intro prose */}
      {prose && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <ProseBlock paragraphs={prose.intro} />
        </motion.div>
      )}

      {/* Radar Chart */}
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
          7-Dimension Competitive Radar
        </h3>
        <p
          className="text-sm text-slate-400 mb-6"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          Each axis scored 0-5. Zipminator is the only platform scoring 4+ across all
          dimensions simultaneously.
        </p>
        <div className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={RADAR_DATA}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fill: '#cbd5e1', fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 5]}
                tick={{ fill: '#6b7280', fontSize: 10 }}
                tickCount={6}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {COMPETITORS.map((c) => {
                const style = COMPETITOR_COLORS[c.name] ?? {
                  stroke: '#6b7280',
                  opacity: 0.1,
                  width: 1,
                }
                return (
                  <Radar
                    key={c.name}
                    name={c.name}
                    dataKey={c.name}
                    stroke={style.stroke}
                    fill={style.stroke}
                    fillOpacity={style.opacity}
                    strokeWidth={style.width}
                  />
                )
              })}
            </RadarChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 justify-center">
          {COMPETITORS.map((c) => {
            const style = COMPETITOR_COLORS[c.name] ?? { stroke: '#6b7280' }
            return (
              <div key={c.name} className="flex items-center gap-2 text-xs text-slate-400">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{ background: style.stroke }}
                />
                {c.name}
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* A. Competitive Landscape Overview */}
      {sub('competitive-landscape-overview') && (
        <Subsection heading={sub('competitive-landscape-overview')!.heading}>
          <ProseBlock paragraphs={sub('competitive-landscape-overview')!.body} />
          {sub('competitive-landscape-overview')!.callout && (
            <CalloutBlock {...sub('competitive-landscape-overview')!.callout!} />
          )}
        </Subsection>
      )}

      {/* B. Signal Analysis */}
      {sub('signal-analysis') && (
        <Subsection heading={sub('signal-analysis')!.heading}>
          <ProseBlock paragraphs={sub('signal-analysis')!.body} />
          {sub('signal-analysis')!.callout && (
            <CalloutBlock {...sub('signal-analysis')!.callout!} />
          )}
        </Subsection>
      )}

      {/* C. ProtonMail Analysis */}
      {sub('protonmail-analysis') && (
        <Subsection heading={sub('protonmail-analysis')!.heading}>
          <ProseBlock paragraphs={sub('protonmail-analysis')!.body} />
          {sub('protonmail-analysis')!.callout && (
            <CalloutBlock {...sub('protonmail-analysis')!.callout!} />
          )}
        </Subsection>
      )}

      {/* D. NordVPN Analysis */}
      {sub('nordvpn-analysis') && (
        <Subsection heading={sub('nordvpn-analysis')!.heading}>
          <ProseBlock paragraphs={sub('nordvpn-analysis')!.body} />
          {sub('nordvpn-analysis')!.callout && (
            <CalloutBlock {...sub('nordvpn-analysis')!.callout!} />
          )}
        </Subsection>
      )}

      {/* E. Wickr Analysis */}
      {sub('wickr-analysis') && (
        <Subsection heading={sub('wickr-analysis')!.heading}>
          <ProseBlock paragraphs={sub('wickr-analysis')!.body} />
          {sub('wickr-analysis')!.callout && (
            <CalloutBlock {...sub('wickr-analysis')!.callout!} />
          )}
        </Subsection>
      )}

      {/* Feature Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-xl border overflow-hidden"
        style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(34,211,238,0.15)', boxShadow: '0 0 24px rgba(34,211,238,0.06), 0 4px 20px rgba(0,0,0,0.3)' }}
      >
        <div className="p-6 pb-2">
          <h3
            className="text-lg font-semibold text-slate-100 mb-1"
            style={{ fontFamily: 'var(--font-fraunces)' }}
          >
            Feature-by-Feature Comparison
          </h3>
          <p
            className="text-sm text-slate-400"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            Zipminator is the only platform with all 10 capabilities.
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
                  Feature
                </th>
                <th
                  className="px-4 py-3 text-center font-semibold"
                  style={{ color: '#22D3EE', fontFamily: 'var(--font-dm-sans)' }}
                >
                  Zipminator
                </th>
                <th className="px-4 py-3 text-center text-slate-400 font-medium">Signal</th>
                <th className="px-4 py-3 text-center text-slate-400 font-medium">ProtonMail</th>
                <th className="px-4 py-3 text-center text-slate-400 font-medium">NordVPN</th>
                <th className="px-4 py-3 text-center text-slate-400 font-medium">Wickr</th>
              </tr>
            </thead>
            <tbody>
              {COMPETITOR_FEATURES.map((row, i) => (
                <tr
                  key={row.feature}
                  className="border-b border-white/[0.03]"
                  style={{
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                  }}
                >
                  <td
                    className="px-6 py-3 text-slate-300 whitespace-nowrap"
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                  >
                    {row.feature}
                  </td>
                  <td
                    className="px-4 py-3 text-center"
                    style={{ background: 'rgba(34,211,238,0.04)' }}
                  >
                    {featureCell(row.zip)}
                  </td>
                  <td className="px-4 py-3 text-center">{featureCell(row.signal)}</td>
                  <td className="px-4 py-3 text-center">{featureCell(row.proton)}</td>
                  <td className="px-4 py-3 text-center">{featureCell(row.nord)}</td>
                  <td className="px-4 py-3 text-center">{featureCell(row.wickr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* F. The Breadth Moat */}
      {sub('breadth-moat') && (
        <Subsection heading={sub('breadth-moat')!.heading}>
          <ProseBlock paragraphs={sub('breadth-moat')!.body} />
          {sub('breadth-moat')!.callout && (
            <CalloutBlock {...sub('breadth-moat')!.callout!} />
          )}
        </Subsection>
      )}

      {/* Conclusion */}
      {prose?.conclusion && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mt-10"
        >
          <ProseBlock paragraphs={prose.conclusion} />
        </motion.div>
      )}
    </div>
  )
}
