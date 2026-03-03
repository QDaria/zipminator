'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, FileWarning, TrendingUp, Calendar } from 'lucide-react'

const timeline = [
  { year: '2024', event: 'NIST finalizes PQC standards (FIPS 203-205)', status: 'done' },
  { year: '2025', event: 'NSA CNSA 2.0 mandates PQC for classified systems', status: 'done' },
  { year: '2026', event: 'Executive Order 14028 compliance deadlines begin', status: 'active' },
  { year: '2027', event: 'Major browsers deprecate RSA-only TLS certificates', status: 'upcoming' },
  { year: '2028', event: 'Financial sector PQC migration deadline (projected)', status: 'upcoming' },
  { year: '2030', event: 'Healthcare HIPAA PQC requirements (projected)', status: 'upcoming' },
  { year: '2033', event: 'NIST target: full federal PQC transition', status: 'upcoming' },
  { year: '2035', event: 'Cryptographically relevant quantum computers expected', status: 'upcoming' },
]

const mandates = [
  {
    icon: FileWarning,
    title: 'NSA CNSA 2.0',
    description: 'Requires quantum-resistant algorithms for all classified and sensitive information by 2025-2030.',
  },
  {
    icon: AlertTriangle,
    title: 'Executive Order 14028',
    description: 'Federal agencies must inventory cryptographic systems and create PQC migration plans.',
  },
  {
    icon: TrendingUp,
    title: 'Market: $35B+ by 2030',
    description: 'Post-quantum cybersecurity market projected to reach $35 billion within 4 years.',
  },
  {
    icon: Calendar,
    title: 'Harvest Now, Decrypt Later',
    description: 'Nation-state adversaries are storing encrypted data today to break it with future quantum computers.',
  },
]

const IndustryLandscape = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-quantum-500/5 rounded-full blur-3xl" />
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
            Industry <span className="gradient-text">Landscape</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            The quantum threat is not theoretical. Governments and industries are already mandating migration.
          </p>
        </motion.div>

        {/* Mandates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
          {mandates.map((m, i) => (
            <motion.div
              key={m.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="card-quantum p-7"
            >
              <m.icon className="w-8 h-8 text-quantum-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">{m.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{m.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h3 className="text-3xl font-bold text-white mb-3">Quantum Threat Timeline</h3>
          <p className="text-gray-400">Key milestones from standards finalization to cryptographic break</p>
        </motion.div>

        <div className="relative max-w-3xl mx-auto">
          {/* Vertical line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-quantum-500/50 via-quantum-500/20 to-transparent" />

          {timeline.map((item, i) => (
            <motion.div
              key={item.year}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`relative flex items-start gap-6 mb-6 ${
                i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
              }`}
            >
              {/* Dot */}
              <div className="absolute left-6 md:left-1/2 -translate-x-1/2 mt-1.5 z-10">
                <div
                  className={`w-3 h-3 rounded-full border-2 ${
                    item.status === 'done'
                      ? 'bg-green-400 border-green-400'
                      : item.status === 'active'
                      ? 'bg-quantum-400 border-quantum-400 animate-pulse'
                      : 'bg-gray-700 border-gray-600'
                  }`}
                />
              </div>

              {/* Content */}
              <div className={`ml-14 md:ml-0 md:w-[calc(50%-2rem)] ${i % 2 === 0 ? 'md:text-right md:pr-8' : 'md:text-left md:pl-8'}`}>
                <div className={`text-sm font-bold font-mono ${
                  item.status === 'done' ? 'text-green-400' : item.status === 'active' ? 'text-quantum-400' : 'text-gray-500'
                }`}>
                  {item.year}
                </div>
                <div className="text-sm text-gray-300 mt-1">{item.event}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default IndustryLandscape
