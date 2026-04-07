'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface BlueprintSectionProps {
  id: string
  number: number
  title: string
  children: ReactNode
}

export const BlueprintSection = ({ id, number, title, children }: BlueprintSectionProps) => (
  <section
    id={id}
    data-blueprint-section
    className="relative px-6 py-16 lg:py-24 max-w-6xl mx-auto"
  >
    {/* Radial glow */}
    <div
      className="pointer-events-none absolute inset-0 opacity-20"
      style={{
        background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(34,211,238,0.12), transparent)',
      }}
    />

    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative z-10"
    >
      {/* Section header */}
      <div className="flex items-center gap-4 mb-10">
        <span
          className="flex-none w-12 h-12 rounded-xl flex items-center justify-center text-sm font-mono font-bold"
          style={{
            background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(167,139,250,0.15))',
            color: '#22D3EE',
            boxShadow: '0 0 20px rgba(34,211,238,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
            border: '1px solid rgba(34,211,238,0.25)',
          }}
        >
          {String(number).padStart(2, '0')}
        </span>
        <h2
          className="text-2xl lg:text-3xl font-semibold text-slate-50"
          style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
        >
          {title}
        </h2>
      </div>

      {children}
    </motion.div>

    {/* Divider */}
    <div className="mt-16 border-t border-white/5" />
  </section>
)

/* ───────────────────────────────────────────────────────
   Shared presentational primitives for blueprint sections
   ─────────────────────────────────────────────────────── */

interface GlowCardProps {
  children: ReactNode
  accent?: string
  className?: string
}

/** Card with glowing amber/cyan border + soft shadow */
export const GlowCard = ({ children, accent = '#F59E0B', className = '' }: GlowCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4 }}
    className={`rounded-2xl p-6 ${className}`}
    style={{
      background: 'rgba(15,23,42,0.6)',
      border: `1px solid ${accent}35`,
      boxShadow: `0 0 30px ${accent}12, 0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`,
      backdropFilter: 'blur(12px)',
    }}
  >
    {children}
  </motion.div>
)

interface MetricCardProps {
  label: string
  value: string
  sub?: string
  accent?: string
}

/** Small KPI card with glowing top border */
export const MetricCard = ({ label, value, sub, accent = '#22D3EE' }: MetricCardProps) => (
  <div
    className="rounded-xl p-5 text-center"
    style={{
      background: `linear-gradient(180deg, ${accent}08 0%, rgba(15,23,42,0.5) 100%)`,
      borderTop: `2px solid ${accent}`,
      boxShadow: `0 -4px 20px ${accent}15, 0 4px 16px rgba(0,0,0,0.2)`,
    }}
  >
    <p
      className="text-3xl font-bold text-slate-50 mb-1"
      style={{ fontFamily: 'var(--font-jetbrains)' }}
    >
      {value}
    </p>
    <p className="text-xs font-medium text-slate-300 uppercase tracking-wider">{label}</p>
    {sub && <p className="text-[11px] text-slate-500 mt-1">{sub}</p>}
  </div>
)

interface DataTableProps {
  headers: string[]
  rows: string[][]
  accent?: string
}

/** Styled data table with glowing header row */
export const DataTable = ({ headers, rows, accent = '#22D3EE' }: DataTableProps) => (
  <div
    className="rounded-xl overflow-hidden"
    style={{
      border: `1px solid ${accent}20`,
      boxShadow: `0 0 24px ${accent}08, 0 4px 16px rgba(0,0,0,0.2)`,
    }}
  >
    <table className="w-full text-sm">
      <thead>
        <tr style={{ background: `${accent}12` }}>
          {headers.map((h) => (
            <th
              key={h}
              className="px-4 py-3 text-left text-xs font-mono font-semibold uppercase tracking-wider"
              style={{ color: accent, fontFamily: 'var(--font-jetbrains)' }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr
            key={i}
            className="transition-colors hover:bg-white/[0.02]"
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              background: i % 2 === 0 ? 'rgba(15,23,42,0.3)' : 'rgba(15,23,42,0.5)',
            }}
          >
            {row.map((cell, j) => (
              <td
                key={j}
                className="px-4 py-3 text-slate-300"
                style={{ fontFamily: j === 0 ? 'var(--font-dm-sans)' : 'var(--font-jetbrains)' }}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

interface EquationCardProps {
  label: string
  equation: string
  description?: string
  accent?: string
}

/** LaTeX-style equation display card */
export const EquationCard = ({ label, equation, description, accent = '#A78BFA' }: EquationCardProps) => (
  <div
    className="rounded-xl p-5 text-center"
    style={{
      background: `linear-gradient(135deg, ${accent}06, rgba(15,23,42,0.4))`,
      border: `1px solid ${accent}25`,
      boxShadow: `0 0 20px ${accent}10`,
    }}
  >
    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-3">{label}</p>
    <p
      className="text-lg lg:text-xl font-mono text-slate-100 mb-2"
      style={{ fontFamily: 'var(--font-jetbrains)', letterSpacing: '0.02em' }}
    >
      {equation}
    </p>
    {description && <p className="text-xs text-slate-400 mt-2">{description}</p>}
  </div>
)
