'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Code2, FileText, Shield, Layers, Cpu, Monitor, Boxes, Zap
} from 'lucide-react'

function useCounter(end: number, duration = 1400, start = 0) {
  const [value, setValue] = useState(start)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return
        started.current = true
        const t0 = performance.now()
        const tick = () => {
          const elapsed = performance.now() - t0
          const progress = Math.min(elapsed / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setValue(Math.floor(start + (end - start) * eased))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.2 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration, start])

  return { value, ref }
}

const stats = [
  { icon: Code2, end: 870000, suffix: '+', label: 'Total Project Lines', format: true },
  { icon: FileText, end: 1902, suffix: '+', label: 'Project Files', format: true },
  { icon: Shield, end: 26, suffix: '', label: 'Security Technologies', format: false },
  { icon: Layers, end: 10, suffix: '', label: 'Anonymization Levels', format: false },
  { icon: Cpu, end: 156, suffix: '-qubit', label: 'Quantum Hardware', format: false },
  { icon: Monitor, end: 5, suffix: '', label: 'Platforms Supported', format: false },
  { icon: Boxes, end: 7, suffix: '', label: 'Programming Languages', format: false },
  { icon: Zap, end: 34, suffix: 'us', label: 'Encryption Speed', format: false, prefix: '0.0' },
]

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

const AnimatedCounters = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-quantum-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            By The <span className="gradient-text">Numbers</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            The scale of engineering behind quantum-secure protection
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => {
            const counter = useCounter(stat.end, 1400 + i * 100)
            return (
              <motion.div
                key={stat.label}
                ref={counter.ref}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="card-quantum text-center py-8 group"
              >
                <div className="w-14 h-14 bg-quantum-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="w-7 h-7 text-quantum-400" />
                </div>
                <div className="text-3xl md:text-4xl font-bold gradient-text font-mono mb-1">
                  {stat.prefix || ''}{stat.format ? formatNumber(counter.value) : counter.value}{stat.suffix}
                </div>
                <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default AnimatedCounters
