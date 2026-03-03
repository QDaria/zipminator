'use client'

import { motion } from 'framer-motion'
import { Shield, Layers } from 'lucide-react'
import EcosystemDiagram from '@/components/features/EcosystemDiagram'
import FeatureDeepDive from '@/components/features/FeatureDeepDive'
import EncryptionTable from '@/components/features/EncryptionTable'

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-quantum-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />

        <div className="container-custom relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center space-x-2 bg-quantum-900/40 border border-quantum-400/30 rounded-full px-5 py-2.5 mb-8 backdrop-blur-sm">
              <Layers className="w-4 h-4 text-quantum-400" />
              <span className="text-sm font-semibold text-quantum-300">
                Complete Feature Reference
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-[1.1]"
          >
            <span className="gradient-text">Every Feature.</span>{' '}
            <span className="text-white">One Platform.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
          >
            Zipminator integrates{' '}
            <span className="text-quantum-400 font-semibold">10 security modules</span>,{' '}
            <span className="text-quantum-400 font-semibold">11+ encryption algorithms</span>, and{' '}
            <span className="text-quantum-400 font-semibold">5 platform SDKs</span>{' '}
            into a single installable super-app.
          </motion.p>

          {/* Quick stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-wrap items-center justify-center gap-6 mt-12"
          >
            {[
              { value: '10', label: 'Security Modules' },
              { value: '11+', label: 'Algorithms' },
              { value: '5', label: 'Platforms' },
              { value: '0.034ms', label: 'Encryption' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 px-5 py-3 glass-panel rounded-xl">
                <Shield className="w-4 h-4 text-quantum-400" />
                <span className="text-xl font-bold gradient-text">{stat.value}</span>
                <span className="text-sm text-gray-400">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <EcosystemDiagram />
      <FeatureDeepDive />
      <EncryptionTable />
    </>
  )
}
