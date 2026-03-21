'use client'

import { motion } from 'framer-motion'
import { Check, X, Minus } from 'lucide-react'

type CellValue = 'yes' | 'no' | 'na' | 'partial'

const features = [
  'PQC Messaging',
  'PQ VPN',
  'PQC Email',
  'PQC Browser',
  'Quantum Entropy',
  '10-Level Anonymizer',
  'PQ VoIP',
  'AI Assistant',
  'Quantum Anonymization',
]

const competitors: { name: string; highlight?: boolean; values: CellValue[] }[] = [
  { name: 'Zipminator', highlight: true, values: ['yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes'] },
  { name: 'Signal', values: ['no', 'na', 'na', 'na', 'no', 'no', 'no', 'no', 'no'] },
  { name: 'ProtonMail', values: ['no', 'partial', 'no', 'na', 'no', 'no', 'na', 'no', 'no'] },
  { name: 'NordVPN', values: ['na', 'no', 'na', 'na', 'no', 'no', 'na', 'no', 'no'] },
  { name: 'Brave', values: ['na', 'na', 'na', 'no', 'no', 'no', 'na', 'partial', 'no'] },
  { name: 'Wire', values: ['no', 'na', 'na', 'na', 'no', 'no', 'no', 'no', 'no'] },
]

function CellIcon({ value }: { value: CellValue }) {
  switch (value) {
    case 'yes':
      return <Check className="w-5 h-5 text-green-400" />
    case 'no':
      return <X className="w-5 h-5 text-red-400/60" />
    case 'na':
      return <Minus className="w-5 h-5 text-gray-600" />
    case 'partial':
      return (
        <div className="w-5 h-5 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
        </div>
      )
  }
}

const CompetitiveMatrix = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Competitive <span className="gradient-text">Matrix</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            No other product combines all eight quantum-secure modules in a single platform
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="overflow-x-auto"
        >
          <div className="min-w-[750px]">
            <div className="glass-panel rounded-2xl overflow-hidden">
              {/* Header row */}
              <div className="grid gap-0" style={{ gridTemplateColumns: `180px repeat(${competitors.length}, 1fr)` }}>
                <div className="px-5 py-4 bg-quantum-900/30 border-b border-white/10 text-sm font-semibold text-quantum-300 uppercase tracking-wider">
                  Feature
                </div>
                {competitors.map((c) => (
                  <div
                    key={c.name}
                    className={`px-3 py-4 bg-quantum-900/30 border-b border-white/10 text-center text-sm font-semibold uppercase tracking-wider ${
                      c.highlight ? 'text-quantum-300 bg-quantum-900/50' : 'text-gray-400'
                    }`}
                  >
                    {c.name}
                  </div>
                ))}
              </div>

              {/* Data rows */}
              {features.map((feat, fi) => (
                <div
                  key={feat}
                  className={`grid gap-0 ${fi < features.length - 1 ? 'border-b border-white/5' : ''}`}
                  style={{ gridTemplateColumns: `180px repeat(${competitors.length}, 1fr)` }}
                >
                  <div className="px-5 py-3.5 text-sm font-medium text-white">{feat}</div>
                  {competitors.map((c) => (
                    <div
                      key={`${feat}-${c.name}`}
                      className={`px-3 py-3.5 flex items-center justify-center ${
                        c.highlight ? 'bg-quantum-900/10' : ''
                      }`}
                    >
                      <CellIcon value={c.values[fi]} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" /> Supported
          </div>
          <div className="flex items-center gap-2">
            <X className="w-4 h-4 text-red-400/60" /> Not supported
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" /> Partial
          </div>
          <div className="flex items-center gap-2">
            <Minus className="w-4 h-4 text-gray-600" /> N/A
          </div>
        </div>
      </div>
    </section>
  )
}

export default CompetitiveMatrix
