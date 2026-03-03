'use client'

import { motion } from 'framer-motion'
import { Users, DollarSign, Clock, ArrowRight } from 'lucide-react'

const roles = [
  { role: 'PQC Cryptographers', count: '3-5', salary: '$200-300K', color: 'bg-quantum-500' },
  { role: 'Rust / Systems Engineers', count: '8-12', salary: '$180-250K', color: 'bg-indigo-500' },
  { role: 'Mobile Developers', count: '4-6', salary: '$160-220K', color: 'bg-blue-500' },
  { role: 'Full-Stack Web Developers', count: '3-4', salary: '$150-200K', color: 'bg-cyan-500' },
  { role: 'Quantum Computing Specialists', count: '2-3', salary: '$220-350K', color: 'bg-purple-500' },
  { role: 'DevOps / SRE', count: '2-3', salary: '$170-230K', color: 'bg-green-500' },
  { role: 'Security Auditors', count: '2-3', salary: '$180-260K', color: 'bg-yellow-500' },
  { role: 'QA Engineers', count: '2-3', salary: '$130-180K', color: 'bg-orange-500' },
  { role: 'UX / UI Designers', count: '1-2', salary: '$140-200K', color: 'bg-pink-500' },
  { role: 'Project Managers', count: '2-3', salary: '$150-220K', color: 'bg-rose-500' },
]

const totals = [
  { icon: Users, label: 'Engineers Required', value: '35-50', sub: 'across 10 specializations' },
  { icon: Clock, label: 'Timeline', value: '18-24 mo', sub: 'minimum development cycle' },
  { icon: DollarSign, label: 'Total Cost', value: '$15-25M+', sub: 'salaries, infra, tooling' },
]

const TeamCostAnalysis = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            What It Would <span className="gradient-text">Take</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Building this from scratch requires deep expertise, significant capital, and years of effort
          </p>
        </motion.div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-12">
          {roles.map((r, i) => (
            <motion.div
              key={r.role}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="flex items-center gap-4 px-5 py-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-quantum-500/30 transition-colors"
            >
              <div className={`w-3 h-3 rounded-full ${r.color} shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{r.role}</div>
              </div>
              <div className="text-sm font-mono text-quantum-300 shrink-0">{r.count}</div>
              <div className="text-xs text-gray-500 shrink-0 hidden sm:block">{r.salary}/yr</div>
            </motion.div>
          ))}
        </div>

        {/* Totals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {totals.map((t) => (
            <div key={t.label} className="card-quantum text-center py-8">
              <t.icon className="w-8 h-8 text-quantum-400 mx-auto mb-3" />
              <div className="text-3xl font-bold gradient-text mb-1">{t.value}</div>
              <div className="text-sm font-semibold text-white">{t.label}</div>
              <div className="text-xs text-gray-500 mt-1">{t.sub}</div>
            </div>
          ))}
        </motion.div>

        {/* Punchline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-quantum-900/40 to-purple-900/40 border border-quantum-500/30">
            <ArrowRight className="w-5 h-5 text-quantum-400" />
            <span className="text-lg font-semibold text-white">
              Zipminator delivers all of this as a{' '}
              <span className="gradient-text">single installable app</span>.
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default TeamCostAnalysis
