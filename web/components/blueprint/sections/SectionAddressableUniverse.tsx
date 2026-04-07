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
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { ADDRESSABLE_SECTORS, CHIPMAKER_REVENUE } from '@/lib/blueprint-data'

const CustomTooltip = ({ active, payload }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { chipmaker: string; volume: number; revenue: number; color: string } }>
}) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div
      className="rounded-lg px-4 py-3 text-xs shadow-xl"
      style={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      <p className="mb-1 font-medium text-slate-200">{d.chipmaker}</p>
      <p className="text-slate-400">Volume: <span className="font-mono text-slate-100">{d.volume}M chips/yr</span></p>
      <p className="text-slate-400">Revenue at $0.05/chip: <span className="font-mono text-slate-100">${d.revenue}M/yr</span></p>
    </div>
  )
}

export const SectionAddressableUniverse = () => {
  const [activeSector, setActiveSector] = useState(0)

  return (
    <div className="space-y-10">
      {/* Intro */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-slate-300 text-lg leading-relaxed max-w-3xl"
        style={{ fontFamily: 'var(--font-dm-sans)' }}
      >
        The QDaria patent portfolio addresses organizations across seven sectors,
        from intelligence agencies to WiFi chipmakers. Patent 2 alone covers 18.2 billion
        WiFi-enabled devices. At $0.05 per chip, that is $300M per year from chipmakers alone.
      </motion.p>

      {/* Chipmaker Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="rounded-xl p-6 border"
        style={{ background: 'rgba(15,23,42,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <h3 className="text-lg font-semibold text-slate-100 mb-1" style={{ fontFamily: 'var(--font-fraunces)' }}>
          Patent 2: Per-Chipmaker Licensing Revenue
        </h3>
        <p className="text-sm text-slate-400 mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Annual licensing at $0.05/WiFi chip. Total: ~6B chips/year = ~$300M/year.
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={CHIPMAKER_REVENUE} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v: number) => `$${v}M`} />
            <YAxis type="category" dataKey="chipmaker" width={100} tick={{ fill: '#e2e8f0', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="revenue" name="Revenue" radius={[0, 6, 6, 0]} barSize={24}>
              {CHIPMAKER_REVENUE.map((entry) => (
                <Cell key={entry.chipmaker} fill={entry.color} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Sector Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-wrap gap-2 mb-6">
          {ADDRESSABLE_SECTORS.map((sec, i) => (
            <button
              key={sec.sector}
              onClick={() => setActiveSector(i)}
              className="px-3 py-2 rounded-lg text-xs font-mono transition-all"
              style={{
                fontFamily: 'var(--font-jetbrains)',
                background: activeSector === i ? `${sec.color}15` : 'rgba(15,23,42,0.4)',
                color: activeSector === i ? sec.color : '#94a3b8',
                border: `1px solid ${activeSector === i ? `${sec.color}40` : 'rgba(255,255,255,0.05)'}`,
              }}
            >
              {sec.sector}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeSector}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <div
              className="px-6 py-4 flex items-center gap-3"
              style={{ background: `${ADDRESSABLE_SECTORS[activeSector].color}08` }}
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ background: ADDRESSABLE_SECTORS[activeSector].color }}
              />
              <h4 className="text-base font-semibold text-slate-100" style={{ fontFamily: 'var(--font-fraunces)' }}>
                {ADDRESSABLE_SECTORS[activeSector].sector}
              </h4>
              <span className="text-xs font-mono text-slate-500" style={{ fontFamily: 'var(--font-jetbrains)' }}>
                {ADDRESSABLE_SECTORS[activeSector].orgs.length} organizations
              </span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'rgba(15,23,42,0.8)' }}>
                  <th className="text-left px-6 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Organization</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Country</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Relevance</th>
                </tr>
              </thead>
              <tbody>
                {ADDRESSABLE_SECTORS[activeSector].orgs.map((org, i) => (
                  <tr
                    key={org.name}
                    className="transition-colors hover:bg-white/[0.02]"
                    style={{ background: i % 2 === 0 ? 'rgba(15,23,42,0.5)' : 'rgba(15,23,42,0.3)' }}
                  >
                    <td className="px-6 py-3 text-slate-100 font-medium whitespace-nowrap">{org.name}</td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap font-mono text-xs" style={{ fontFamily: 'var(--font-jetbrains)' }}>{org.country}</td>
                    <td className="px-4 py-3 text-slate-400">{org.relevance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Key Insight */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-xl p-6 border"
        style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.15)' }}
      >
        <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3" style={{ fontFamily: 'var(--font-jetbrains)' }}>
          Norway Advantage
        </h4>
        <p className="text-slate-200 leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          QDaria is the only commercially available quantum/PQC company in Norway.
          NQCG shut down in December 2024. Zipminator is the only PQC super-app in Scandinavia.
          First-mover advantage in a market with NOK 1.75B in government quantum funding.
        </p>
      </motion.div>
    </div>
  )
}
