'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { TEAM_ROLES, TEAM_TOTAL } from '@/lib/pitch-data'
import type { Scenario } from '@/lib/pitch-data'
import { Users, Briefcase, Clock, GraduationCap, Building2, UserCheck } from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts'

import { fadeUp, useAnimatedCounter } from '../slide-utils'
import { TOOLTIP_STYLE } from '../chart-config'

const PRIORITY_STYLES: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  immediate: { label: 'Immediate', bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500/60' },
  year1: { label: 'Year 1', bg: 'bg-quantum-500/20', text: 'text-quantum-400', dot: 'bg-quantum-500/60' },
  year2: { label: 'Year 2', bg: 'bg-gray-500/20', text: 'text-gray-400', dot: 'bg-gray-500/60' },
}

const BAR_COLORS: Record<string, string> = {
  immediate: 'from-emerald-600 to-emerald-400',
  year1: 'from-quantum-600 to-quantum-400',
  year2: 'from-gray-600 to-gray-400',
}

const COST_COMPARISON = [
  { role: 'Senior Engineer', norway: '$120-160K', valley: '$200-350K', savings: '40-55%' },
  { role: 'Data Center (rack)', norway: '$800/mo', valley: '$2,500/mo', savings: '68%' },
  { role: 'Office Space (m\u00B2)', norway: '$350/mo', valley: '$1,200/mo', savings: '71%' },
]

const PRIORITY_CHART_DATA = [
  { name: 'Immediate', value: TEAM_ROLES.filter((r) => r.priority === 'immediate').reduce((s, r) => s + r.count, 0), color: '#22c55e' },
  { name: 'Year 1', value: TEAM_ROLES.filter((r) => r.priority === 'year1').reduce((s, r) => s + r.count, 0), color: '#6366f1' },
  { name: 'Year 2', value: TEAM_ROLES.filter((r) => r.priority === 'year2').reduce((s, r) => s + r.count, 0), color: '#6b7280' },
]
const TOTAL_HEADCOUNT = PRIORITY_CHART_DATA.reduce((s, d) => s + d.value, 0)

interface PieLabelProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  value: number
}

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, value }: PieLabelProps) {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 1.4
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="#d1d5db" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight={600}>
      {value}
    </text>
  )
}

export default function TeamSlide({ scenario: _scenario }: { scenario?: Scenario }) {
  const immediateCount = TEAM_ROLES.filter((r) => r.priority === 'immediate').reduce(
    (sum, r) => sum + r.count,
    0
  )
  const maxCount = Math.max(...TEAM_ROLES.map((r) => r.count))
  const { display: animatedTotal, ref: counterRef } = useAnimatedCounter(TOTAL_HEADCOUNT)

  return (
    <SlideWrapper>
      {/* Header */}
      <motion.div {...fadeUp()} className="text-center mb-8">
        <p className="text-quantum-400 font-mono text-sm tracking-widest uppercase mb-3">
          Team
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
          Building a <span className="gradient-text">World-Class</span> Team
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          {TEAM_TOTAL.headcount} people across cryptography, systems engineering, mobile, and security
        </p>
      </motion.div>

      {/* Hiring by Priority Donut — moved to upper half */}
      <motion.div {...fadeUp(0.05)} className="card-quantum chart-glow mb-6">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-quantum-400" />
          Hiring Priority Breakdown
        </h3>
        <div className="flex items-center justify-center gap-8">
          <div className="relative">
            <ResponsiveContainer width={260} height={260}>
              <PieChart>
                <Pie
                  data={PRIORITY_CHART_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  dataKey="value"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={renderCustomLabel as any}
                  animationDuration={1200}
                >
                  {PRIORITY_CHART_DATA.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  {...TOOLTIP_STYLE}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => [`${value} people`, name]}
                />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 11, color: '#9ca3af', paddingTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center animated counter */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span ref={counterRef as React.RefObject<HTMLSpanElement>} className="text-2xl font-bold gradient-text font-mono">{animatedTotal}</span>
              <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Total</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {PRIORITY_CHART_DATA.map((d) => (
              <span key={d.name} className="flex items-center gap-2 text-sm text-gray-400 leading-relaxed">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Key Stats */}
      <motion.div {...fadeUp(0.08)} className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: Users, label: 'Target Headcount', value: TEAM_TOTAL.headcount },
          { icon: Briefcase, label: 'Annual Cost', value: TEAM_TOTAL.annualCost },
          { icon: Clock, label: 'Immediate Hires', value: `${immediateCount}` },
        ].map((s) => (
          <div key={s.label} className="card-quantum text-center">
            <s.icon className="w-5 h-5 text-quantum-400 mx-auto mb-2" />
            <p className="text-2xl font-bold gradient-text font-mono">{s.value}</p>
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Role Breakdown */}
      <motion.div {...fadeUp(0.1)} className="card-quantum mb-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-quantum-400" />
          <h3 className="text-sm font-semibold text-white">Team Composition</h3>
        </div>
        <div className="space-y-3">
          {TEAM_ROLES.map((role, i) => {
            const priority = PRIORITY_STYLES[role.priority]
            const barWidth = (role.count / maxCount) * 100
            return (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.04 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm text-gray-300 truncate">{role.title}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${priority.bg} ${priority.text}`}
                    >
                      {priority.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <span className="text-xs font-mono text-gray-500">{role.salary}</span>
                    <span className="text-sm font-bold text-white font-mono w-5 text-center">
                      {role.count}
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${BAR_COLORS[role.priority]}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.04 }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Norwegian Talent Pipeline + Cost Advantage */}
      <motion.div {...fadeUp(0.15)} className="grid sm:grid-cols-2 gap-4 mb-6">
        {/* Talent Pipeline */}
        <div className="card-quantum border-l-2 border-emerald-500/40">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-5 h-5 text-emerald-400" />
            <h4 className="text-sm font-semibold text-emerald-400">Norwegian Talent Pipeline</h4>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed mb-3">
            Norway is investing <span className="text-white font-semibold">NOK 244M</span> in 4 new quantum
            research centres, creating a deep talent pool for Zipminator to recruit from.
          </p>
          <div className="flex flex-wrap gap-2">
            {['NTNU Quantum', 'UiO Centre', 'SINTEF Digital', 'Simula Research'].map((centre) => (
              <span
                key={centre}
                className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20"
              >
                {centre}
              </span>
            ))}
          </div>
        </div>

        {/* Build Cost Advantage */}
        <div className="card-quantum border-l-2 border-quantum-500/40">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-5 h-5 text-quantum-400" />
            <h4 className="text-sm font-semibold text-quantum-400">Build Cost Advantage</h4>
          </div>
          <div className="space-y-2">
            {COST_COMPARISON.map((row) => (
              <div key={row.role} className="flex items-center justify-between text-xs">
                <span className="text-gray-400 truncate mr-2">{row.role}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-emerald-400">{row.norway}</span>
                  <span className="text-gray-600">vs</span>
                  <span className="font-mono text-gray-500 line-through">{row.valley}</span>
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    -{row.savings}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Advisory Board Placeholder */}
      <motion.div {...fadeUp(0.2)} className="card-quantum border border-dashed border-white/10 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <UserCheck className="w-4 h-4 text-gray-500" />
          <h4 className="text-sm font-semibold text-gray-400">Advisory Board</h4>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
            Forming
          </span>
        </div>
        <p className="text-xs text-gray-500">
          Actively recruiting advisors across quantum cryptography, Nordic venture capital, defense/NATO procurement,
          and enterprise security. Target: 4-6 advisors by Q3 2026.
        </p>
      </motion.div>

      {/* Hiring Legend + Build Cost */}
      <motion.div {...fadeUp(0.25)} className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          {Object.entries(PRIORITY_STYLES).map(([key, style]) => (
            <span key={key} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${style.dot}`} />
              {style.label}
            </span>
          ))}
        </div>
        <p className="text-xs font-mono text-gray-500">
          Total build cost: <span className="text-quantum-400 font-semibold">{TEAM_TOTAL.buildCost}</span>
        </p>
      </motion.div>
    </SlideWrapper>
  )
}
