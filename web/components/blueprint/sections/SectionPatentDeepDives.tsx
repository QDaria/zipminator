'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
import { PATENT_DETAILS, PATENT_STACK, type BpScenario } from '@/lib/blueprint-data'

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */
type PatentId = 'P1' | 'P2' | 'P3'

interface SectionPatentDeepDivesProps {
  scenario: BpScenario
}

/* -------------------------------------------------------------------------- */
/*  Palette                                                                    */
/* -------------------------------------------------------------------------- */
const PATENT_COLORS: Record<PatentId, string> = {
  P1: '#22D3EE',
  P2: '#F59E0B',
  P3: '#34D399',
}

const SCENARIO_COLORS: Record<BpScenario, string> = {
  conservative: '#94a3b8',
  moderate: '#60a5fa',
  optimistic: '#34d399',
}

/* -------------------------------------------------------------------------- */
/*  Shared tooltip                                                             */
/* -------------------------------------------------------------------------- */
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
            ${entry.value}M
          </span>
        </p>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Metric card                                                                */
/* -------------------------------------------------------------------------- */
const MetricCard = ({
  label,
  value,
  color,
}: {
  label: string
  value: string | number
  color: string
}) => (
  <div
    className="rounded-lg p-4 border"
    style={{
      background: 'rgba(15,23,42,0.6)',
      borderColor: `${color}20`,
    }}
  >
    <p
      className="text-xs uppercase tracking-wider text-slate-500 mb-1"
      style={{ fontFamily: 'var(--font-jetbrains)' }}
    >
      {label}
    </p>
    <p
      className="text-2xl font-bold"
      style={{ color, fontFamily: 'var(--font-jetbrains)' }}
    >
      {value}
    </p>
  </div>
)

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */
export const SectionPatentDeepDives = ({ scenario }: SectionPatentDeepDivesProps) => {
  const [activeTab, setActiveTab] = useState<PatentId>('P1')
  const patent = PATENT_DETAILS[activeTab]
  const color = PATENT_COLORS[activeTab]

  const stackEntry = PATENT_STACK.find((p) => p.id === activeTab)

  // Build chart data for monetization paths (horizontal bars, grouped by scenario)
  const chartData = patent.monetization.map((m) => ({
    path: m.path,
    conservative: m.value.conservative,
    moderate: m.value.moderate,
    optimistic: m.value.optimistic,
  }))

  return (
    <div className="space-y-8">
      {/* Tab buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="flex gap-2"
      >
        {(['P1', 'P2', 'P3'] as PatentId[]).map((id) => {
          const isActive = id === activeTab
          const tabColor = PATENT_COLORS[id]
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="relative px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              style={{
                fontFamily: 'var(--font-jetbrains)',
                background: isActive ? `${tabColor}15` : 'rgba(15,23,42,0.4)',
                color: isActive ? tabColor : '#94a3b8',
                border: `1px solid ${isActive ? `${tabColor}40` : 'rgba(255,255,255,0.05)'}`,
              }}
            >
              {id}: {PATENT_STACK.find((p) => p.id === id)?.name ?? id}
              {isActive && (
                <motion.div
                  layoutId="patent-tab-underline"
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                  style={{ background: tabColor }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </motion.div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          {/* Title & filing info */}
          <div
            className="rounded-xl p-6 border"
            style={{
              background: 'rgba(15,23,42,0.5)',
              borderColor: `${color}20`,
              borderLeftWidth: '4px',
              borderLeftColor: color,
            }}
          >
            <h3
              className="text-xl font-semibold text-slate-100 mb-3"
              style={{ fontFamily: 'var(--font-fraunces)' }}
            >
              {patent.title}
            </h3>
            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              <div>
                <span className="text-slate-500">Inventor</span>
                <p className="text-slate-200">{patent.inventor}</p>
              </div>
              <div>
                <span className="text-slate-500">Assignee</span>
                <p className="text-slate-200">{patent.assignee}</p>
              </div>
              <div>
                <span className="text-slate-500">Filing</span>
                <p
                  className="text-slate-200 font-mono"
                  style={{ fontFamily: 'var(--font-jetbrains)' }}
                >
                  {patent.filingNo}
                  {patent.filingDate !== '—' && ` (${patent.filingDate})`}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Jurisdiction</span>
                <p className="text-slate-200">{patent.jurisdiction}</p>
              </div>
            </div>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Total Claims" value={patent.totalClaims} color={color} />
            <MetricCard label="Novelty Score" value={`${patent.noveltyScore}%`} color={color} />
            <MetricCard label="Prior Art Count" value={patent.priorArtCount} color={color} />
            <MetricCard
              label="Filing Status"
              value={stackEntry?.status ?? '—'}
              color={color}
            />
          </div>

          {/* Key Innovation + Technical Mechanism */}
          <div className="grid md:grid-cols-2 gap-4">
            <div
              className="rounded-xl p-5 border"
              style={{
                background: 'rgba(15,23,42,0.5)',
                borderColor: 'rgba(255,255,255,0.05)',
              }}
            >
              <h4
                className="text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color, fontFamily: 'var(--font-jetbrains)' }}
              >
                Key Innovation
              </h4>
              <p
                className="text-slate-300 text-sm leading-relaxed"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                {patent.keyInnovation}
              </p>
            </div>
            <div
              className="rounded-xl p-5 border"
              style={{
                background: 'rgba(15,23,42,0.5)',
                borderColor: 'rgba(255,255,255,0.05)',
              }}
            >
              <h4
                className="text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color, fontFamily: 'var(--font-jetbrains)' }}
              >
                Technical Mechanism
              </h4>
              <p
                className="text-slate-300 text-sm leading-relaxed font-mono"
                style={{ fontFamily: 'var(--font-jetbrains)' }}
              >
                {patent.mechanism}
              </p>
            </div>
          </div>

          {/* Monetization horizontal bar chart */}
          <div
            className="rounded-xl p-6 border"
            style={{
              background: 'rgba(15,23,42,0.5)',
              borderColor: 'rgba(255,255,255,0.05)',
            }}
          >
            <h4
              className="text-lg font-semibold text-slate-100 mb-1"
              style={{ fontFamily: 'var(--font-fraunces)' }}
            >
              Monetization Paths
            </h4>
            <p
              className="text-sm text-slate-400 mb-6"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              Estimated lifetime licensing revenue ($M) across three scenario
              assumptions. Current scenario:{' '}
              <span
                className="font-semibold capitalize"
                style={{ color: SCENARIO_COLORS[scenario] }}
              >
                {scenario}
              </span>
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.06)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${v}M`}
                  />
                  <YAxis
                    type="category"
                    dataKey="path"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                    tickLine={false}
                    width={160}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 13, color: '#9ca3af' }}
                    iconType="square"
                  />
                  <Bar
                    dataKey="conservative"
                    name="Conservative"
                    fill={SCENARIO_COLORS.conservative}
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="moderate"
                    name="Moderate"
                    fill={SCENARIO_COLORS.moderate}
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="optimistic"
                    name="Optimistic"
                    fill={SCENARIO_COLORS.optimistic}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
