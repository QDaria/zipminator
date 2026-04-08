'use client'

import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { PILLARS } from '@/lib/blueprint-data'
import { SECTION_PROSE } from '@/lib/blueprint-prose'
import { ProseBlock, CalloutBlock, Subsection } from '@/components/blueprint/BlueprintSection'

const completePillars = PILLARS.filter((p) => p.completion === 100).length
const avgCompletion = Math.round(
  PILLARS.reduce((sum, p) => sum + p.completion, 0) / PILLARS.length
)

const stackData = [
  {
    name: 'Pillars',
    ...Object.fromEntries(PILLARS.map((p, i) => [`p${i}`, p.completion / 9])),
  },
]

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const idx = Number(payload[0].dataKey.replace('p', ''))
  const pillar = PILLARS[idx]
  if (!pillar) return null
  return (
    <div
      className="rounded-lg px-4 py-3 text-xs shadow-xl"
      style={{
        background: 'rgba(17,24,39,0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <p className="mb-1 font-medium text-slate-200">{pillar.name}</p>
      <p className="font-mono text-slate-300">{pillar.completion}% complete</p>
    </div>
  )
}

export const SectionPillars = () => {
  const prose = SECTION_PROSE['pillars']

  return (
  <div className="space-y-10">
    {/* --- Prose Introduction --- */}
    {prose && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <ProseBlock paragraphs={prose.intro} />
      </motion.div>
    )}

    {/* --- 3x3 Pillar Grid --- */}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {PILLARS.map((pillar, i) => (
        <motion.div
          key={pillar.name}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: i * 0.05 }}
          className="rounded-xl p-5 transition-all duration-300 hover:scale-[1.02]"
          style={{
            background: `linear-gradient(135deg, ${pillar.color}08, rgba(15,23,42,0.7))`,
            border: `1px solid ${pillar.color}30`,
            borderLeft: `3px solid ${pillar.color}`,
            boxShadow: `0 0 20px ${pillar.color}10, 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)`,
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* Name */}
          <h4 className="mb-1 text-base font-semibold text-slate-100">
            {pillar.name}
          </h4>

          {/* Description */}
          <p className="mb-4 text-sm leading-relaxed text-slate-400">
            {pillar.desc}
          </p>

          {/* Completion + Tests */}
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-500">
                {pillar.completion}% complete
              </span>
              {'tests' in pillar && (
                <span className="text-[10px] font-mono" style={{ color: pillar.color }}>
                  {(pillar as typeof pillar & { tests: number }).tests} tests
                </span>
              )}
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pillar.completion}%`,
                  background: pillar.color,
                  opacity: 0.85,
                }}
              />
            </div>
          </div>

          {/* Comparable valuation */}
          {'compVal' in pillar && (
            <div className="mb-3 flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Comparable: {(pillar as typeof pillar & { comparable: string }).comparable}</span>
              <span className="font-mono font-semibold" style={{ color: pillar.color }}>
                {(pillar as typeof pillar & { compVal: string }).compVal}
              </span>
            </div>
          )}

          {/* Tech tags */}
          <div className="flex flex-wrap gap-1.5">
            {pillar.tech.map((t) => (
              <span
                key={t}
                className="rounded-full px-2 py-0.5 text-[10px] font-mono"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: '#94a3b8',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </motion.div>
      ))}
    </div>

    {/* --- Stacked Horizontal Bar --- */}
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="rounded-xl p-6"
      style={{
        background: 'linear-gradient(135deg, rgba(34,211,238,0.04), rgba(15,23,42,0.6))',
        border: '1px solid rgba(34,211,238,0.15)',
        boxShadow: '0 0 30px rgba(34,211,238,0.08), 0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      <h3 className="mb-6 text-sm font-mono uppercase tracking-wider text-slate-400">
        Platform Completion
      </h3>
      <ResponsiveContainer width="100%" height={60}>
        <BarChart
          data={stackData}
          layout="vertical"
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          barSize={28}
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            hide
          />
          <YAxis
            type="category"
            dataKey="name"
            hide
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          {PILLARS.map((pillar, i) => (
            <Bar
              key={pillar.name}
              dataKey={`p${i}`}
              stackId="pillars"
              radius={
                i === 0
                  ? [4, 0, 0, 4]
                  : i === PILLARS.length - 1
                    ? [0, 4, 4, 0]
                    : [0, 0, 0, 0]
              }
            >
              <Cell fill={pillar.color} fillOpacity={0.8} />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
        {PILLARS.map((p) => (
          <div key={p.name} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: p.color, opacity: 0.8 }}
            />
            <span className="text-[11px] text-slate-400">{p.name}</span>
          </div>
        ))}
      </div>
    </motion.div>

    {/* --- Summary Stats --- */}
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="grid grid-cols-3 gap-4"
    >
      {[
        { label: 'Complete', value: `${completePillars}/9`, sub: 'pillars at 100%' },
        { label: 'Average', value: `${avgCompletion}%`, sub: 'completion' },
        { label: 'Platforms', value: '6', sub: 'macOS, Win, Linux, iOS, Android, Web' },
      ].map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl p-5 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(167,139,250,0.06), rgba(15,23,42,0.6))',
            border: '1px solid rgba(167,139,250,0.2)',
            boxShadow: '0 0 20px rgba(167,139,250,0.08), 0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          <p className="text-2xl font-bold text-slate-100 font-mono">
            {stat.value}
          </p>
          <p className="mt-1 text-xs text-slate-400">{stat.sub}</p>
        </div>
      ))}
    </motion.div>

    {/* --- Detailed Pillar Analysis (prose subsections) --- */}
    {prose?.subsections?.map((sub, i) => (
      <motion.div
        key={sub.id}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.05 }}
      >
        <Subsection heading={sub.heading}>
          <ProseBlock paragraphs={sub.body} />
          {sub.callout && (
            <CalloutBlock
              type={sub.callout.type}
              title={sub.callout.title}
              text={sub.callout.text}
            />
          )}
        </Subsection>
      </motion.div>
    ))}

    {/* --- Prose Conclusion --- */}
    {prose?.conclusion && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <Subsection heading="Platform Integration Premium">
          <ProseBlock paragraphs={prose.conclusion} />
        </Subsection>
      </motion.div>
    )}
  </div>
  )
}
