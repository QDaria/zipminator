'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { SUPER_APP_MODULES } from '@/lib/pitch-data'
import { Shield, Sparkles, Leaf, DollarSign } from 'lucide-react'
import type { Scenario } from '@/lib/pitch-data'
import { MODULE_ICON_MAP, chartEntrance } from '../slide-utils'
import { TOOLTIP_STYLE, CHART_ANIMATION_DURATION } from '../chart-config'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const MODULE_WEIGHTS = [
  { name: 'Messenger', value: 18, color: '#6366f1' },
  { name: 'VoIP', value: 14, color: '#8b5cf6' },
  { name: 'VPN', value: 16, color: '#3b82f6' },
  { name: 'Browser', value: 12, color: '#06b6d4' },
  { name: 'Email', value: 12, color: '#22c55e' },
  { name: 'QRNG', value: 10, color: '#f59e0b' },
  { name: 'PII', value: 8, color: '#ec4899' },
  { name: 'AI', value: 10, color: '#a855f7' },
]

const RADIAN = Math.PI / 180
function renderCustomLabel({
  cx,
  cy,
  midAngle,
  outerRadius,
  name,
  percent,
}: {
  cx: number
  cy: number
  midAngle: number
  outerRadius: number
  name: string
  percent: number
}) {
  const radius = outerRadius + 18
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text
      x={x}
      y={y}
      fill="#9ca3af"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={10}
      fontFamily="monospace"
    >
      {name} ({(percent * 100).toFixed(0)}%)
    </text>
  )
}

export default function SolutionSlide({ scenario: _scenario }: { scenario?: Scenario }) {
  return (
    <SlideWrapper>
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="w-5 h-5 text-quantum-400" />
          <span className="text-xs font-mono uppercase tracking-widest text-quantum-400/80">
            Slide 5 / 22
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
          One App.{' '}
          <span className="gradient-text">Total Protection.</span>
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl">
          Instead of juggling multiple security tools, Zipminator unifies every
          communication channel under one post-quantum encryption umbrella.
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-quantum-500/10 border border-quantum-500/20 text-sm text-quantum-300 font-medium">
            <DollarSign className="w-4 h-4" />
            Single App, 5-8 Tools Replaced
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-sm text-green-400 font-medium">
            <Leaf className="w-3.5 h-3.5" />
            Single app = less compute = smaller carbon footprint
          </span>
        </div>
      </motion.div>

      {/* Module Weight Donut */}
      <motion.div {...chartEntrance(0.15)} className="card-quantum chart-glow mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-quantum-400" />
          <h3 className="text-sm font-semibold text-white">Platform Architecture</h3>
        </div>
        <div style={{ height: 240 }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {MODULE_WEIGHTS.map((m) => (
                  <linearGradient key={m.name} id={`grad-${m.name}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={m.color} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={m.color} stopOpacity={0.5} />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={MODULE_WEIGHTS}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                animationDuration={CHART_ANIMATION_DURATION}
                label={renderCustomLabel}
                labelLine={false}
              >
                {MODULE_WEIGHTS.map((m) => (
                  <Cell key={m.name} fill={`url(#grad-${m.name})`} stroke={m.color} strokeWidth={1} />
                ))}
              </Pie>
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value: number, name: string) => [`${value}%`, name]}
              />
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: 10, fontFamily: 'monospace', color: '#9ca3af' }}
              />
              {/* Center text */}
              <text x="50%" y="48%" textAnchor="middle" fill="#fff" fontSize={18} fontWeight={700}>
                8
              </text>
              <text x="50%" y="58%" textAnchor="middle" fill="#9ca3af" fontSize={10} fontFamily="monospace">
                Modules
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Module grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        {SUPER_APP_MODULES.map((mod, index) => {
          const Icon = MODULE_ICON_MAP[mod.icon] || Shield
          return (
            <motion.div
              key={mod.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + index * 0.06 }}
              className="card-quantum group flex flex-col items-center text-center p-5 hover:border-quantum-500/50"
            >
              <div className="w-12 h-12 rounded-xl bg-quantum-500/10 border border-quantum-500/20 flex items-center justify-center mb-3 group-hover:bg-quantum-500/20 transition-colors">
                <Icon className="w-6 h-6 text-quantum-400" />
              </div>
              <h3 className="font-semibold text-white text-sm mb-1.5">
                {mod.name}
              </h3>
              <p className="text-gray-500 text-xs leading-relaxed">
                {mod.description}
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* Center callout with cost comparison */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4 px-6 py-4 rounded-xl bg-quantum-500/[0.06] border border-quantum-500/15"
      >
        <Shield className="w-8 h-8 text-quantum-400 shrink-0" />
        <div className="text-center sm:text-left">
          <p className="text-white font-semibold text-sm">
            Install once, secure everything.
          </p>
          <p className="text-gray-400 text-xs mt-0.5">
            9 integrated modules. One quantum-secure platform. Zero fragmentation.
          </p>
        </div>
        <div className="shrink-0 h-px sm:h-10 w-full sm:w-px bg-white/10" />
        <div className="text-center sm:text-left shrink-0">
          <p className="text-xs text-gray-500">
            <span className="line-through">5-8 separate tools: $200-500/mo</span>
          </p>
          <p className="text-sm font-semibold text-green-400 mt-0.5">
            Zipminator Pro: $99/mo
          </p>
        </div>
      </motion.div>
    </SlideWrapper>
  )
}
