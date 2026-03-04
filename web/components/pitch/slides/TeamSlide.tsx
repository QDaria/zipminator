'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { TEAM_ROLES, TEAM_TOTAL } from '@/lib/pitch-data'
import type { Scenario } from '@/lib/pitch-data'
import { Users, Briefcase, Clock } from 'lucide-react'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
})

const PRIORITY_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  immediate: { label: 'Immediate', bg: 'bg-green-500/20', text: 'text-green-400' },
  year1: { label: 'Year 1', bg: 'bg-quantum-500/20', text: 'text-quantum-400' },
  year2: { label: 'Year 2', bg: 'bg-gray-500/20', text: 'text-gray-400' },
}

const BAR_COLORS: Record<string, string> = {
  immediate: 'from-green-600 to-green-400',
  year1: 'from-quantum-600 to-quantum-400',
  year2: 'from-gray-600 to-gray-400',
}

export default function TeamSlide({ scenario: _scenario }: { scenario?: Scenario }) {
  const immediateCount = TEAM_ROLES.filter((r) => r.priority === 'immediate').reduce(
    (sum, r) => sum + r.count,
    0
  )
  const maxCount = Math.max(...TEAM_ROLES.map((r) => r.count))

  return (
    <SlideWrapper>
      {/* Header */}
      <motion.div {...fadeUp()} className="text-center mb-10">
        <p className="text-quantum-400 font-mono text-sm tracking-widest uppercase mb-3">
          Team
        </p>
        <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-3">
          Building a <span className="gradient-text">World-Class</span> Team
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          {TEAM_TOTAL.headcount} people across cryptography, systems engineering, mobile, and security
        </p>
      </motion.div>

      {/* Key Stats */}
      <motion.div {...fadeUp(0.05)} className="grid grid-cols-3 gap-4 mb-10">
        {[
          { icon: Users, label: 'Target Headcount', value: TEAM_TOTAL.headcount },
          { icon: Briefcase, label: 'Annual Cost', value: TEAM_TOTAL.annualCost },
          { icon: Clock, label: 'Immediate Hires', value: `${immediateCount}` },
        ].map((s) => (
          <div key={s.label} className="card-quantum text-center">
            <s.icon className="w-5 h-5 text-quantum-400 mx-auto mb-2" />
            <p className="text-2xl font-bold gradient-text font-mono">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Role Breakdown */}
      <motion.div {...fadeUp(0.1)} className="card-quantum">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-quantum-400" />
          <h3 className="text-lg font-semibold text-white">Team Composition</h3>
        </div>
        <div className="space-y-3">
          {TEAM_ROLES.map((role, i) => {
            const priority = PRIORITY_STYLES[role.priority]
            const barWidth = (role.count / maxCount) * 100
            return (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
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
                    whileInView={{ width: `${barWidth}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.04 }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Hiring Legend + Build Cost */}
      <motion.div {...fadeUp(0.2)} className="flex flex-wrap items-center justify-between gap-4 mt-6">
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          {Object.entries(PRIORITY_STYLES).map(([key, style]) => (
            <span key={key} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${style.bg.replace('/20', '/60')}`} />
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
