'use client'

import { motion } from 'framer-motion'
import { Zap, Cpu, Shield, CheckCircle } from 'lucide-react'

const stats = [
  {
    icon: Zap,
    value: '0.034ms',
    label: 'Encryption Speed',
    description: 'Lightning-fast quantum-secure encryption',
  },
  {
    icon: Cpu,
    value: '127',
    label: 'Qubits',
    description: 'Real quantum hardware access',
  },
  {
    icon: Shield,
    value: 'NIST Level 3',
    label: 'Security',
    description: 'Government-approved standard',
  },
  {
    icon: CheckCircle,
    value: '95%+',
    label: 'Test Coverage',
    description: 'Comprehensive quality assurance',
  },
]

const StatsBar = () => {
  return (
    <section className="section-padding quantum-bg">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-quantum-900/50 to-purple-900/50 backdrop-blur-sm rounded-2xl p-12 border border-quantum-500/20"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-quantum-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-quantum-400" />
                </div>
                <div className="text-4xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-lg font-semibold text-white mb-2">
                  {stat.label}
                </div>
                <div className="text-sm text-gray-400">
                  {stat.description}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default StatsBar
