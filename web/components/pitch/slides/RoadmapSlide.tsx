'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import type { Scenario } from '@/lib/pitch-data'
import { ROADMAP_PHASES, ROADMAP_MILESTONES } from '@/lib/pitch-data'
import {
  Map,
  CheckCircle2,
  Circle,
  Clock,
  Milestone,
  Banknote,
  FileText,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts'

import { fadeUp, chartEntrance } from '../slide-utils'
import { TOOLTIP_STYLE, AXIS_STYLE, CHART_ANIMATION_DURATION, PHASE_COLORS } from '../chart-config'

const GRANT_TRACK = [
  { name: 'Innovation Norway', timing: 'Q2 2026', status: 'progress' as const },
  { name: 'Research Council R&D', timing: 'Q3 2026', status: 'planned' as const },
  { name: 'NATO DIANA', timing: 'Q1 2027', status: 'planned' as const },
  { name: 'Horizon Europe', timing: 'Q2 2027', status: 'planned' as const },
]

const FUNDING_MARKERS = [
  { label: 'Seed Round', timing: 'Q2 2026', milestoneIndex: 0 },
  { label: 'Series A Trigger', timing: 'Q4 2026', milestoneIndex: 1 },
]

function StatusBadge({ status }: { status: 'done' | 'progress' | 'planned' }) {
  if (status === 'done') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase bg-green-500/20 text-green-400 border-green-500/30">
        <CheckCircle2 className="w-3 h-3" />
        Done
      </span>
    )
  }
  if (status === 'progress') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
        <Clock className="w-3 h-3" />
        In Progress
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase bg-gray-500/20 text-gray-400 border-gray-500/30">
      <Circle className="w-3 h-3" />
      Planned
    </span>
  )
}

function PhaseNode({
  phase,
  index,
  isLast,
}: {
  phase: (typeof ROADMAP_PHASES)[number]
  index: number
  isLast: boolean
}) {
  const dotColor =
    phase.status === 'done'
      ? 'bg-green-400 shadow-green-400/40'
      : phase.status === 'progress'
        ? 'bg-yellow-400 shadow-yellow-400/40'
        : 'bg-gray-600'

  const lineColor =
    phase.status === 'done'
      ? 'bg-green-500/40'
      : phase.status === 'progress'
        ? 'bg-gradient-to-b from-yellow-500/40 to-gray-700/30'
        : 'bg-gray-700/30'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 + index * 0.07, duration: 0.4 }}
      className="relative flex gap-4"
    >
      {/* Timeline spine */}
      <div className="flex flex-col items-center shrink-0">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 + index * 0.07, type: 'spring', stiffness: 300 }}
          className={`w-4 h-4 rounded-full ${dotColor} shadow-lg z-10`}
        />
        {!isLast && (
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.35 + index * 0.07, duration: 0.3 }}
            className={`w-0.5 flex-1 origin-top ${lineColor}`}
            style={{ minHeight: '100%' }}
          />
        )}
      </div>

      {/* Card */}
      <div className="pb-4 flex-1 min-w-0">
        <div className="rounded-lg bg-white/[0.03] border border-white/5 px-4 py-3 hover:border-quantum-500/30 transition-colors">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-mono text-quantum-400 bg-quantum-500/10 px-1.5 py-0.5 rounded shrink-0">
                P{phase.phase}
              </span>
              <h4 className="text-sm font-semibold text-white truncate">
                {phase.name}
              </h4>
            </div>
            <StatusBadge status={phase.status} />
          </div>

          <p className="text-xs text-gray-500 mb-2">{phase.description}</p>

          {/* Progress bar for in-progress items */}
          {phase.status === 'progress' && 'progress' in phase && (
            <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${phase.progress}%` }}
                transition={{ delay: 0.5 + index * 0.07, duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-400"
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function RoadmapSlide({ scenario: _scenario }: { scenario?: Scenario }) {
  const doneCount = ROADMAP_PHASES.filter((p) => p.status === 'done').length
  const progressCount = ROADMAP_PHASES.filter((p) => p.status === 'progress').length
  const activeCount = doneCount + progressCount
  const totalCount = ROADMAP_PHASES.length
  const completionPct = Math.round((activeCount / totalCount) * 100)

  return (
    <SlideWrapper>
      {/* Header */}
      <motion.div {...fadeUp(0.05)} className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Map className="w-5 h-5 text-quantum-400" />
            <span className="text-xs font-mono uppercase tracking-widest text-quantum-400/80">
              Slide 15 / 22
            </span>
          </div>
          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPct}%` }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="h-full rounded-full bg-gradient-to-r from-green-500 to-quantum-400"
              />
            </div>
            <span className="text-xs font-mono text-quantum-400">
              {activeCount}/{totalCount} active ({completionPct}%)
            </span>
          </div>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
          Development <span className="gradient-text">Roadmap</span>
        </h2>
        <p className="text-gray-400 max-w-2xl text-lg">
          Eight products. One quantum-secure super-app. Here is where each piece stands today.
        </p>
      </motion.div>

      {/* Gantt-style Progress Overview */}
      <motion.div {...chartEntrance(0.12)} className="card-quantum chart-glow mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Map className="w-4 h-4 text-quantum-400" />
          <h3 className="text-sm font-semibold text-white">Phase Progress Overview</h3>
        </div>
        <div style={{ height: 220 }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={ROADMAP_PHASES.map((p) => ({
                name: `P${p.phase} ${p.name}`,
                completed: p.status === 'done' ? 100 : (p.status === 'progress' ? (p.progress ?? 50) : 0),
                remaining: p.status === 'done' ? 0 : (p.status === 'progress' ? 100 - (p.progress ?? 50) : 100),
                status: p.status,
              }))}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="rmGradDone" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.5} />
                </linearGradient>
                <linearGradient id="rmGradRemain" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#374151" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#374151" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                {...AXIS_STYLE}
                tickFormatter={(v: number) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                {...AXIS_STYLE}
                width={130}
                tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'monospace' }}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value: number, name: string) => [
                  `${value}%`,
                  name === 'completed' ? 'Done' : 'Remaining',
                ]}
              />
              <ReferenceLine
                x={completionPct}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{ value: 'Now', fill: '#f59e0b', fontSize: 10, position: 'top' }}
              />
              <Bar
                dataKey="completed"
                stackId="progress"
                animationDuration={CHART_ANIMATION_DURATION}
                radius={[0, 0, 0, 0]}
              >
                {ROADMAP_PHASES.map((p) => (
                  <Cell
                    key={`c-${p.name}`}
                    fill={p.status === 'done' ? PHASE_COLORS.done : PHASE_COLORS.progress}
                  />
                ))}
              </Bar>
              <Bar
                dataKey="remaining"
                stackId="progress"
                fill="url(#rmGradRemain)"
                animationDuration={CHART_ANIMATION_DURATION}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-4 mt-1">
          <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PHASE_COLORS.done }} /> Shipped
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PHASE_COLORS.progress }} /> In Progress
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#374151' }} /> Remaining
          </span>
        </div>
      </motion.div>

      {/* Timeline - two columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
        <div>
          {ROADMAP_PHASES.slice(0, 4).map((phase, i) => (
            <PhaseNode
              key={phase.name}
              phase={phase}
              index={i}
              isLast={i === 3}
            />
          ))}
        </div>
        <div>
          {ROADMAP_PHASES.slice(4).map((phase, i) => (
            <PhaseNode
              key={phase.name}
              phase={phase}
              index={i + 4}
              isLast={i === 3}
            />
          ))}
        </div>
      </div>

      {/* Milestones bar with Funding Markers */}
      <motion.div {...fadeUp(0.6)} className="mt-6 card-quantum">
        <div className="flex items-center gap-2 mb-4">
          <Milestone className="w-4 h-4 text-quantum-400" />
          <h3 className="text-sm font-semibold text-white">Key Milestones</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ROADMAP_MILESTONES.map((ms, i) => {
            const funding = FUNDING_MARKERS.find((f) => f.milestoneIndex === i)
            return (
              <motion.div
                key={ms.date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.08 }}
                className={`text-center px-3 py-3 rounded-lg border ${
                  funding
                    ? 'bg-quantum-500/[0.06] border-quantum-500/20'
                    : 'bg-white/[0.03] border-white/5'
                }`}
              >
                {funding && (
                  <div className="flex items-center justify-center gap-1 mb-1.5">
                    <Banknote className="w-3 h-3 text-quantum-400" />
                    <span className="text-[9px] font-mono font-bold text-quantum-400 uppercase">
                      {funding.label}
                    </span>
                  </div>
                )}
                <p className="text-xs font-mono text-quantum-400 mb-1">{ms.date}</p>
                <p className="text-sm font-semibold text-white">{ms.label}</p>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Grant Milestones Track */}
      <motion.div {...fadeUp(0.7)} className="mt-4 card-quantum">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Grant &amp; Non-Dilutive Funding Track</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {GRANT_TRACK.map((grant, i) => (
            <motion.div
              key={grant.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + i * 0.08 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5"
            >
              {grant.status === 'progress' ? (
                <Clock className="w-3 h-3 text-yellow-400" />
              ) : (
                <Circle className="w-3 h-3 text-gray-500" />
              )}
              <div>
                <p className="text-xs font-semibold text-white">{grant.name}</p>
                <p className="text-[10px] font-mono text-gray-500">{grant.timing}</p>
              </div>
              {i < GRANT_TRACK.length - 1 && (
                <span className="text-gray-600 ml-1 hidden sm:inline">&rarr;</span>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Bottom callout */}
      <motion.div
        {...fadeUp(0.8)}
        className="mt-4 flex items-center gap-3 px-5 py-3 rounded-xl bg-quantum-500/[0.06] border border-quantum-500/15"
      >
        <Map className="w-5 h-5 text-quantum-400 shrink-0" />
        <p className="text-sm text-gray-300">
          <span className="text-quantum-400 font-semibold">24-36 months</span>{' '}
          to complete the full super-app. {doneCount} products shipped, {progressCount} in progress.
        </p>
      </motion.div>
    </SlideWrapper>
  )
}
