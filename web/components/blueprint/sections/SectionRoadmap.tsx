'use client'

import { motion } from 'framer-motion'
import { ROADMAP_ITEMS } from '@/lib/blueprint-data'

const STATUS_STYLES: Record<string, { bg: string; label: string; dot: string }> = {
  active: { bg: 'rgba(239,68,68,0.08)', label: 'In Progress', dot: '#ef4444' },
  upcoming: { bg: 'rgba(34,211,238,0.06)', label: 'Upcoming', dot: '#22D3EE' },
  planned: { bg: 'rgba(100,116,139,0.06)', label: 'Planned', dot: '#64748b' },
}

export const SectionRoadmap = () => (
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
      QDaria's roadmap from academic validation through enterprise adoption to
      global licensing. The regulatory timeline (DORA 2025, CNSA 2.0 by 2027, NIST RSA
      deprecation 2030) creates non-optional demand windows that coincide with key milestones.
    </motion.p>

    {/* Timeline */}
    <div className="relative">
      {/* Vertical line */}
      <div
        className="absolute left-6 top-0 bottom-0 w-px"
        style={{ background: 'linear-gradient(to bottom, rgba(34,211,238,0.3), rgba(100,116,139,0.1))' }}
      />

      <div className="space-y-1">
        {ROADMAP_ITEMS.map((item, i) => {
          const style = STATUS_STYLES[item.status]
          return (
            <motion.div
              key={`${item.phase}-${item.title}`}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="relative pl-16"
            >
              {/* Dot */}
              <div
                className="absolute left-[18px] top-6 w-3 h-3 rounded-full border-2"
                style={{
                  borderColor: item.color,
                  background: item.status === 'active' ? item.color : 'rgba(2,8,23,0.95)',
                  boxShadow: item.status === 'active' ? `0 0 12px ${item.color}60` : 'none',
                }}
              />

              <div
                className="rounded-xl p-5 mb-2 border transition-colors hover:bg-white/[0.02]"
                style={{
                  background: style.bg,
                  borderColor: `${item.color}15`,
                  borderLeftWidth: '3px',
                  borderLeftColor: item.color,
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-mono font-bold"
                      style={{ color: item.color, fontFamily: 'var(--font-jetbrains)' }}
                    >
                      {item.phase}
                    </span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-mono uppercase tracking-wider"
                      style={{
                        background: `${style.dot}15`,
                        color: style.dot,
                        fontFamily: 'var(--font-jetbrains)',
                      }}
                    >
                      {style.label}
                    </span>
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-slate-100 mb-1" style={{ fontFamily: 'var(--font-fraunces)' }}>
                  {item.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  {item.desc}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>

    {/* PCT Deadlines Callout */}
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-xl p-6 border"
      style={{
        background: 'rgba(99,102,241,0.05)',
        borderColor: 'rgba(99,102,241,0.2)',
      }}
    >
      <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-3" style={{ fontFamily: 'var(--font-jetbrains)' }}>
        PCT International Filing Timeline
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg p-4" style={{ background: 'rgba(15,23,42,0.6)' }}>
          <p className="text-xs text-slate-500 mb-1">Patent 1 PCT Deadline</p>
          <p className="text-base font-bold text-cyan-300 font-mono" style={{ fontFamily: 'var(--font-jetbrains)' }}>March 24, 2027</p>
          <p className="text-[10px] text-slate-500 mt-1">12 months from priority date</p>
        </div>
        <div className="rounded-lg p-4" style={{ background: 'rgba(15,23,42,0.6)' }}>
          <p className="text-xs text-slate-500 mb-1">Patent 2 PCT Deadline</p>
          <p className="text-base font-bold text-amber-400 font-mono" style={{ fontFamily: 'var(--font-jetbrains)' }}>April 5, 2027</p>
          <p className="text-[10px] text-slate-500 mt-1">12 months from priority date</p>
        </div>
        <div className="rounded-lg p-4" style={{ background: 'rgba(15,23,42,0.6)' }}>
          <p className="text-xs text-slate-500 mb-1">Patent 3 PCT Deadline</p>
          <p className="text-base font-bold text-emerald-400 font-mono" style={{ fontFamily: 'var(--font-jetbrains)' }}>April 5, 2027</p>
          <p className="text-[10px] text-slate-500 mt-1">12 months from priority date</p>
        </div>
      </div>
    </motion.div>

    {/* Corporate Structure */}
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="rounded-xl p-6 border"
      style={{ background: 'rgba(251,113,133,0.04)', borderColor: 'rgba(251,113,133,0.15)' }}
    >
      <h4 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-3" style={{ fontFamily: 'var(--font-jetbrains)' }}>
        Planned Corporate Structure
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
        <div className="rounded-lg p-4" style={{ background: 'rgba(15,23,42,0.6)' }}>
          <p className="font-semibold text-slate-200 mb-1">Swiss AG (Zug)</p>
          <p className="text-slate-400 text-xs">IP holding entity; 90% patent box tax reduction; ideal for licensing revenue</p>
        </div>
        <div className="rounded-lg p-4" style={{ background: 'rgba(15,23,42,0.6)' }}>
          <p className="font-semibold text-slate-200 mb-1">Delaware Inc.</p>
          <p className="text-slate-400 text-xs">US operational entity for VC fundraising; standard Silicon Valley structure</p>
        </div>
      </div>
    </motion.div>
  </div>
)
