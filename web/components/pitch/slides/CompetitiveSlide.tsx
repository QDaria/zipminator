'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { COMPETITORS, COMPETITOR_DETAILS } from '@/lib/pitch-data'
import type { Scenario } from '@/lib/pitch-data'
import { Swords, Check, X, Minus, DollarSign, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'

import { fadeUp } from '../slide-utils'
import { TOOLTIP_STYLE } from '../chart-config'

const FEATURES = [
  { key: 'messenger' as const, label: 'PQC Messenger' },
  { key: 'voip' as const, label: 'Quantum VoIP' },
  { key: 'vpn' as const, label: 'Q-VPN' },
  { key: 'browser' as const, label: 'Browser' },
  { key: 'email' as const, label: 'Quantum Mail' },
  { key: 'qrng' as const, label: 'QRNG' },
  { key: 'pqc' as const, label: 'Full PQC' },
  { key: 'quantumAnon' as const, label: 'Quantum Anonymization' },
  { key: 'superApp' as const, label: 'Super-App' },
]

function CellIcon({ value }: { value: boolean | 'partial' }) {
  if (value === true) {
    return <Check className="w-4 h-4 text-green-400 mx-auto" />
  }
  if (value === 'partial') {
    return <Minus className="w-4 h-4 text-yellow-400 mx-auto" />
  }
  return <X className="w-4 h-4 text-gray-600 mx-auto" />
}

export default function CompetitiveSlide({ scenario: _scenario }: { scenario?: Scenario }) {
  const zipminator = COMPETITORS[0]
  const others = COMPETITORS.slice(1)
  const zipFeatureCount = FEATURES.filter(
    (f) => zipminator[f.key] === true
  ).length

  return (
    <SlideWrapper>
      {/* Header */}
      <motion.div {...fadeUp()} className="text-center mb-8">
        <p className="text-quantum-400 font-mono text-sm tracking-widest uppercase mb-3">
          Competitive Landscape
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
          No One Else Does{' '}
          <span className="gradient-text">All {zipFeatureCount}</span>
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Every competitor solves one piece. Zipminator is the first to unify
          messaging, VoIP, VPN, browser, email, and QRNG under post-quantum encryption.
        </p>
      </motion.div>

      {/* Comparison Table */}
      <motion.div {...fadeUp(0.1)} className="card-quantum overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 pr-4 text-xs font-mono text-gray-500 uppercase w-32">
                Platform
              </th>
              {FEATURES.map((f) => (
                <th
                  key={f.key}
                  className="py-3 px-2 text-center text-xs font-mono text-gray-500 uppercase"
                >
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Zipminator row */}
            <tr className="bg-quantum-500/[0.06] border-b border-quantum-500/20">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-quantum-500/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-quantum-400">Z</span>
                  </div>
                  <span className="font-semibold text-quantum-300">
                    {zipminator.name}
                  </span>
                </div>
              </td>
              {FEATURES.map((f) => (
                <td key={f.key} className="py-3 px-2 text-center">
                  <CellIcon value={zipminator[f.key]} />
                </td>
              ))}
            </tr>

            {/* Competitor rows */}
            {others.map((comp) => (
              <tr key={comp.name} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="py-3 pr-4">
                  <span className="text-gray-300">{comp.name}</span>
                </td>
                {FEATURES.map((f) => (
                  <td key={f.key} className="py-3 px-2 text-center">
                    <CellIcon value={comp[f.key]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Legend */}
      <motion.div {...fadeUp(0.15)} className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <Check className="w-3 h-3 text-green-400" /> Full support
        </span>
        <span className="flex items-center gap-1.5">
          <Minus className="w-3 h-3 text-yellow-400" /> Partial
        </span>
        <span className="flex items-center gap-1.5">
          <X className="w-3 h-3 text-gray-600" /> None
        </span>
      </motion.div>

      {/* Feature Score Chart */}
      <motion.div {...fadeUp(0.16)} className="card-quantum chart-glow mt-6">
        <h4 className="text-sm font-semibold text-white mb-4">Feature Coverage Score</h4>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            layout="vertical"
            data={COMPETITORS.map(comp => ({
              name: comp.name,
              score: FEATURES.reduce((sum, f) => sum + (comp[f.key] === true ? 1 : comp[f.key] === 'partial' ? 0.5 : 0), 0),
            }))}
            margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradZipminator" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="gradCompetitor" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#4b5563" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#6b7280" stopOpacity={0.4} />
              </linearGradient>
              <filter id="glowZip">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis type="number" domain={[0, 8]} tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
            <YAxis type="category" dataKey="name" width={90} tick={{ fill: '#d1d5db', fontSize: 11, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE.contentStyle}
              labelStyle={TOOLTIP_STYLE.labelStyle}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`${value} / 8 features`, 'Score']}
            />
            <Legend
              verticalAlign="bottom"
              wrapperStyle={{ fontSize: 11, color: '#9ca3af', paddingTop: 8 }}
              payload={[
                { value: 'Zipminator', type: 'rect', color: '#6366f1' },
                { value: 'Competitors', type: 'rect', color: '#4b5563' },
              ]}
            />
            <Bar dataKey="score" radius={[0, 4, 4, 0]} animationDuration={1200}>
              {COMPETITORS.map((comp) => (
                <Cell
                  key={comp.name}
                  fill={comp.name === 'Zipminator' ? 'url(#gradZipminator)' : 'url(#gradCompetitor)'}
                  filter={comp.name === 'Zipminator' ? 'url(#glowZip)' : undefined}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Heatmap Grid */}
      <motion.div {...fadeUp(0.19)} className="card-quantum mt-4">
        <h4 className="text-sm font-semibold text-white mb-4">Feature Heatmap</h4>
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            {/* Header row */}
            <div className="grid gap-px mb-px" style={{ gridTemplateColumns: `120px repeat(${FEATURES.length}, 1fr)` }}>
              <div className="text-[10px] font-mono text-gray-600 px-1 py-1" />
              {FEATURES.map((f) => (
                <div key={f.key} className="text-[9px] font-mono text-gray-500 text-center px-1 py-1 truncate">
                  {f.label}
                </div>
              ))}
            </div>
            {/* Data rows */}
            {COMPETITORS.map((comp, ri) => (
              <div
                key={comp.name}
                className="grid gap-px mb-px"
                style={{ gridTemplateColumns: `120px repeat(${FEATURES.length}, 1fr)` }}
              >
                <div className={`text-[11px] font-mono px-2 py-1.5 truncate ${comp.name === 'Zipminator' ? 'text-quantum-400 font-semibold' : 'text-gray-400'}`}>
                  {comp.name}
                </div>
                {FEATURES.map((f, ci) => {
                  const val = comp[f.key]
                  const bg = val === true ? 'bg-green-500/30' : val === 'partial' ? 'bg-yellow-500/25' : 'bg-red-500/15'
                  return (
                    <motion.div
                      key={f.key}
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + ri * 0.03 + ci * 0.02, duration: 0.3 }}
                      className={`rounded-sm ${bg} h-7`}
                    />
                  )
                })}
              </div>
            ))}
            {/* Heatmap legend */}
            <div className="flex items-center justify-end gap-4 mt-2 text-[10px] text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500/30" /> Full</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-500/25" /> Partial</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500/15" /> None</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quantum Anonymization Monopoly */}
      <motion.div {...fadeUp(0.17)} className="mt-6 flex items-center gap-3 px-5 py-3 rounded-xl bg-quantum-500/[0.06] border border-quantum-500/15">
        <ShieldCheck className="w-5 h-5 text-quantum-400 shrink-0" />
        <p className="text-sm text-gray-300">
          <span className="text-quantum-400 font-semibold">Zipminator L10</span> is the world&apos;s first
          quantum-certified anonymization. Patent pending. Irreversible by physics (Born rule), not computational
          hardness. Secure even if P=NP.
        </p>
      </motion.div>

      {/* Market Gap callout */}
      <motion.div {...fadeUp(0.18)} className="mt-4 flex items-center gap-3 px-5 py-3 rounded-xl bg-orange-500/[0.06] border border-orange-500/15">
        <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0" />
        <p className="text-sm text-gray-300">
          <span className="text-orange-400 font-semibold">Market Gap:</span>{' '}
          Between free (Cloudflare TLS) and enterprise ($100K+/year). Zipminator fills it at $0&ndash;99/mo.
        </p>
      </motion.div>

      {/* Funding Comparison */}
      <motion.div {...fadeUp(0.22)} className="mt-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-quantum-400" />
          <h3 className="text-sm font-semibold text-white">Competitor Funding &amp; Pricing</h3>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {COMPETITOR_DETAILS.slice(0, 6).map((comp) => (
            <div key={comp.name} className="rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-white">{comp.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-quantum-500/10 text-quantum-400 border border-quantum-500/20">
                  {comp.funding.split('(')[0].trim()}
                </span>
              </div>
              <p className="text-[11px] text-gray-500">{comp.pricing}</p>
              <p className="text-[11px] text-gray-600 mt-0.5 italic">{comp.weakness}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Funding validation badges */}
      <motion.div {...fadeUp(0.26)} className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-quantum-400" />
          <span className="text-xs font-semibold text-white">Market Validated by:</span>
        </div>
        {[
          { name: 'SandboxAQ', amount: '$950M raised', valuation: '$5.75B' },
          { name: 'PQShield', amount: '$70M raised', valuation: 'Series B' },
          { name: 'Zipminator', amount: 'Seed stage', valuation: '300K LOC built' },
        ].map((badge) => (
          <div
            key={badge.name}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono ${
              badge.name === 'Zipminator'
                ? 'bg-quantum-500/10 border-quantum-500/30 text-quantum-400'
                : 'bg-white/[0.03] border-white/10 text-gray-400'
            }`}
          >
            <span className="font-semibold text-white">{badge.name}</span>
            <span>{badge.amount}</span>
            <span className="text-gray-600">|</span>
            <span>{badge.valuation}</span>
          </div>
        ))}
      </motion.div>

      {/* Moat summary */}
      <motion.div {...fadeUp(0.3)} className="grid sm:grid-cols-3 gap-4 mt-6">
        {[
          {
            title: 'Integration Moat',
            detail:
              'No one ships all 9 modules. Each integration deepens the switching cost.',
          },
          {
            title: 'PQC-Native',
            detail:
              'Competitors bolt on PQC later. We built from NIST FIPS 203 from day one.',
          },
          {
            title: 'QRNG Hardware',
            detail:
              '156-qubit IBM entropy is a physical advantage no software-only competitor can match.',
          },
        ].map((m) => (
          <div key={m.title} className="card-quantum">
            <div className="flex items-center gap-2 mb-2">
              <Swords className="w-4 h-4 text-quantum-400" />
              <h4 className="text-sm font-semibold text-white">{m.title}</h4>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{m.detail}</p>
          </div>
        ))}
      </motion.div>
    </SlideWrapper>
  )
}
