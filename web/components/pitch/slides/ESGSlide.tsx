'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import type { Scenario } from '@/lib/pitch-data'
import { SDG_MAPPING, ENERGY_COMPARISON, CARBON_METRICS } from '@/lib/pitch-data'
import {
  Leaf,
  Globe,
  Zap,
  Shield,
  Users,
  Heart,
  BookOpen,
  Briefcase,
  Handshake,
  Thermometer,
  Scale,
  TreePine,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

import { fadeUp } from '../slide-utils'
import { TOOLTIP_STYLE } from '../chart-config'

const SDG_ICONS: Record<number, typeof Leaf> = {
  4: BookOpen,
  8: Briefcase,
  9: Zap,
  11: Globe,
  16: Shield,
  17: Handshake,
}

const SDG_COLORS: Record<number, string> = {
  4: 'text-red-400 bg-red-500/10 border-red-500/20',
  8: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  9: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  11: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  16: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  17: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
}

const SOCIAL_ITEMS = [
  {
    Icon: Scale,
    title: 'Norwegian Labor Standards',
    detail: 'Strongest worker protections in the world. Mandatory pension, 5-week vacation, parental leave.',
  },
  {
    Icon: Shield,
    title: 'GDPR++ Privacy',
    detail: 'Norwegian data protection exceeds EU minimum. EEA member with no Five Eyes jurisdiction exposure.',
  },
  {
    Icon: TreePine,
    title: 'Open Source Core',
    detail: 'Cryptographic primitives are Apache 2.0 licensed, enabling community audit and shared security.',
  },
  {
    Icon: Heart,
    title: 'Privacy as Human Right',
    detail: 'Freemium tier ensures quantum-safe privacy for all users, not just enterprises that can pay.',
  },
]

export default function ESGSlide({ scenario: _scenario }: { scenario?: Scenario }) {
  return (
    <SlideWrapper>
      {/* Section header */}
      <motion.div {...fadeUp(0.1)} className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Leaf className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400/80">
            Slide 20 / 22
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
          ESG &amp; <span className="gradient-text">Sustainability</span>
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl">
          Built green from day one. Norwegian hydropower, world-class labor standards,
          and privacy as a fundamental right.
        </p>
      </motion.div>

      {/* UN SDG Mapping */}
      <motion.div {...fadeUp(0.15)} className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">UN Sustainable Development Goals</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SDG_MAPPING.map((sdg, i) => {
            const SdgIcon = SDG_ICONS[sdg.number] || Globe
            const colorClasses = SDG_COLORS[sdg.number] || 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            return (
              <motion.div
                key={sdg.number}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                className={`rounded-xl border px-4 py-3 ${colorClasses}`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <SdgIcon className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold">SDG {sdg.number}</span>
                </div>
                <p className="text-sm font-semibold text-white mb-0.5">{sdg.name}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{sdg.relevance}</p>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Green Energy Comparison Chart */}
      <motion.div {...fadeUp(0.3)} className="card-quantum mb-8 relative">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          Renewable Energy: Zipminator vs Industry
        </h3>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="absolute top-3 right-4 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold"
        >
          98% Renewable
        </motion.div>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={ENERGY_COMPARISON}
            layout="vertical"
            margin={{ left: 10, right: 30, top: 5, bottom: 5 }}
          >
            <defs>
              <linearGradient id="gradEnergy" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis
              type="number"
              stroke="#6b7280"
              fontSize={11}
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#6b7280"
              fontSize={11}
              width={140}
              tick={{ fill: '#d1d5db' }}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE.contentStyle}
              labelStyle={TOOLTIP_STYLE.labelStyle}
              formatter={(value: number) => [`${value}%`, 'Renewable Energy']}
            />
            <Bar
              dataKey="renewable"
              fill="url(#gradEnergy)"
              radius={[0, 4, 4, 0]}
              animationDuration={1200}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Carbon Footprint Metrics */}
      <motion.div {...fadeUp(0.4)} className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Thermometer className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Carbon &amp; Efficiency Advantage</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CARBON_METRICS.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 + i * 0.06 }}
              className="rounded-xl bg-emerald-500/[0.05] border border-emerald-500/20 px-3 py-3 text-center"
            >
              <p className="text-2xl font-bold text-emerald-400 font-mono">{metric.value}</p>
              <p className="text-[11px] font-semibold text-white/80 mt-0.5">{metric.label}</p>
              <p className="text-[9px] text-gray-500 mt-1 leading-tight">{metric.detail}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Social Responsibility */}
      <motion.div {...fadeUp(0.55)} className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Social Responsibility</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SOCIAL_ITEMS.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.06 }}
              className="flex items-start gap-3 rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <item.Icon className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-gray-400 leading-relaxed mt-0.5">{item.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Bottom callout */}
      <motion.div
        {...fadeUp(0.7)}
        className="flex items-start gap-3 px-5 py-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20"
      >
        <Leaf className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-white font-semibold text-sm mb-1">
            The Greenest PQC Platform on Earth
          </p>
          <p className="text-gray-400 text-xs leading-relaxed">
            Norwegian hydroelectric power, Arctic natural cooling, and lattice-based cryptography
            that uses ~1000x less energy than RSA. Security without compromise, sustainability without sacrifice.
          </p>
        </div>
      </motion.div>
    </SlideWrapper>
  )
}
