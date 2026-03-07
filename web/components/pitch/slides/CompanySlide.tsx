'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import type { Scenario } from '@/lib/pitch-data'
import { GREEN_CREDENTIALS, COST_COMPARISON_NUMERIC } from '@/lib/pitch-data'
import {
  Building2,
  MapPin,
  ShieldCheck,
  Cpu,
  Layers,
  Rocket,
  Calendar,
  Package,
  Code2,
  Wrench,
  Leaf,
  Heart,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

import { fadeUp } from '../slide-utils'

const DIFFERENTIATORS = [
  {
    Icon: ShieldCheck,
    title: 'Norwegian Trust',
    description:
      'Built in one of the world\'s most trusted regulatory environments. Full GDPR compliance, strong data sovereignty laws, and a government actively investing in quantum security.',
  },
  {
    Icon: Cpu,
    title: 'Real Quantum Hardware',
    description:
      'Not simulated. Real 156-qubit IBM quantum computers (Marrakesh and Fez processors) generate the entropy seeds that power our encryption.',
  },
  {
    Icon: Layers,
    title: 'Full-Stack Security',
    description:
      'From the math (Rust constant-time crypto core) to the app (8 integrated security modules). One team owns the entire stack, top to bottom.',
  },
]

const STAT_BADGES = [
  { Icon: Calendar, label: 'Founded 2024', color: 'text-quantum-400' },
  { Icon: Package, label: '8 Products', color: 'text-purple-400' },
  { Icon: Code2, label: '870K+ LOC', color: 'text-cyan-400' },
  { Icon: Wrench, label: '26 Technologies', color: 'text-emerald-400' },
]

const PRODUCT_ROADMAP = [
  {
    name: 'Zipminator-PQC',
    status: 'Flagship',
    detail: 'World\'s first PQC super-app with 8 integrated security modules',
    statusColor: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  {
    name: 'QDaria Quantum Cloud',
    status: 'Planned',
    detail: 'PQC-as-a-Service API platform for developers and enterprises',
    statusColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  {
    name: 'QDaria Enterprise Suite',
    status: 'Planned',
    detail: 'On-premise quantum security for government, military, and banking',
    statusColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
]

export default function CompanySlide({ scenario: _scenario }: { scenario?: Scenario }) {
  return (
    <SlideWrapper>
      {/* Section header */}
      <motion.div {...fadeUp(0.1)} className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Building2 className="w-5 h-5 text-quantum-400" />
          <span className="text-xs font-mono uppercase tracking-widest text-quantum-400/80">
            Slide 2 / 20
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
          <span className="gradient-text">QDaria AS</span>
        </h2>
        <p className="text-gray-400 max-w-2xl text-lg">
          A Norwegian quantum security company on a mission to make quantum-secure
          communication accessible to everyone.
        </p>
      </motion.div>

      {/* Floating stat badges */}
      <motion.div
        {...fadeUp(0.2)}
        className="flex flex-wrap gap-3 mb-8"
      >
        {STAT_BADGES.map((badge, i) => (
          <motion.div
            key={badge.label}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: [0, -4, 0],
            }}
            transition={{
              opacity: { delay: 0.3 + i * 0.1, duration: 0.4 },
              scale: { delay: 0.3 + i * 0.1, duration: 0.4 },
              y: { delay: 1.2 + i * 0.15, duration: 3, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-sm"
          >
            <badge.Icon className={`w-4 h-4 ${badge.color}`} />
            <span className="text-sm font-mono text-white/90">{badge.label}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Location + founder callout with Norwegian flag */}
      <motion.div
        {...fadeUp(0.25)}
        className="flex items-start gap-3 mb-8 px-5 py-4 rounded-xl bg-quantum-500/[0.06] border border-quantum-500/15"
      >
        <MapPin className="w-5 h-5 text-quantum-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-white font-semibold text-sm flex items-center gap-2">
            <span className="inline-block text-base leading-none" aria-label="Norwegian flag">&#127475;&#127476;</span>
            Built in Norway &mdash; NATO, EU, and Arctic infrastructure hub
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Founder-led company with deep cryptographic engineering expertise.
            &ldquo;AS&rdquo; (Aksjeselskap) is the Norwegian equivalent of Inc.
            Positioned at the intersection of European data sovereignty and transatlantic defense.
          </p>
        </div>
      </motion.div>

      {/* 3-column differentiators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {DIFFERENTIATORS.map((diff, i) => (
          <motion.div
            key={diff.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="card-quantum group hover:border-quantum-500/50"
          >
            <div className="w-11 h-11 rounded-xl bg-quantum-500/10 border border-quantum-500/20 flex items-center justify-center mb-4 group-hover:bg-quantum-500/20 transition-colors">
              <diff.Icon className="w-5 h-5 text-quantum-400" />
            </div>
            <h3 className="text-white font-semibold text-base mb-2">{diff.title}</h3>
            <p className="text-gray-500 text-xs leading-relaxed">{diff.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Product roadmap */}
      <motion.div {...fadeUp(0.5)} className="space-y-2 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Rocket className="w-4 h-4 text-quantum-400" />
          <h3 className="text-sm font-semibold text-white">Product Portfolio</h3>
        </div>
        {PRODUCT_ROADMAP.map((product, i) => (
          <motion.div
            key={product.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55 + i * 0.06 }}
            className="flex items-center gap-3 rounded-lg bg-white/[0.03] border border-white/5 px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{product.name}</p>
              <p className="text-[11px] text-gray-500">{product.detail}</p>
            </div>
            <span
              className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border shrink-0 uppercase ${product.statusColor}`}
            >
              {product.status}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* Build Cost Comparison Chart */}
      <motion.div {...fadeUp(0.55)} className="card-quantum mb-8">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-400" />
          Build Cost: Norway vs Silicon Valley
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={COST_COMPARISON_NUMERIC} margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="category" stroke="#6b7280" fontSize={11} />
            <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v: number) => `$${v}K`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => [`$${value ?? 0}K`, name === 'norway' ? 'Norway' : 'Silicon Valley']}
            />
            <Legend formatter={(value: string) => (value === 'norway' ? 'Norway' : 'Silicon Valley')} />
            <Bar dataKey="norway" fill="#22c55e" radius={[4, 4, 0, 0]} animationDuration={1200} />
            <Bar dataKey="valley" fill="rgba(248, 113, 113, 0.5)" radius={[4, 4, 0, 0]} animationDuration={1200} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Green Credentials */}
      <motion.div {...fadeUp(0.65)} className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Leaf className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">{GREEN_CREDENTIALS.headline}</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {GREEN_CREDENTIALS.stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.06 }}
              className="rounded-xl bg-emerald-500/[0.05] border border-emerald-500/20 px-3 py-3 text-center"
            >
              <p className="text-lg font-bold text-emerald-400 font-mono">{stat.value}</p>
              <p className="text-[11px] font-semibold text-white/80 mt-0.5">{stat.label}</p>
              <p className="text-[9px] text-gray-500 mt-1 leading-tight">{stat.detail}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Social Impact callout */}
      <motion.div
        {...fadeUp(0.8)}
        className="flex items-start gap-3 px-5 py-4 rounded-xl bg-purple-500/[0.06] border border-purple-500/20"
      >
        <Heart className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-white font-semibold text-sm mb-1">
            Security as a Human Right
          </p>
          <p className="text-gray-400 text-xs leading-relaxed">
            Freemium tier ensures quantum-safe privacy for all users regardless of ability to pay.
            Healthcare and social services sectors receive priority pricing and onboarding support.
          </p>
        </div>
      </motion.div>
    </SlideWrapper>
  )
}
