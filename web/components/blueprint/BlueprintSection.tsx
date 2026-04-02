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
          className="flex-none w-10 h-10 rounded-lg flex items-center justify-center text-sm font-mono font-bold"
          style={{ background: 'rgba(34,211,238,0.15)', color: '#22D3EE' }}
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
