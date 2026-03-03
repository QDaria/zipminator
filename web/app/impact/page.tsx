'use client'

import { motion } from 'framer-motion'
import { BarChart3, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import AnimatedCounters from '@/components/impact/AnimatedCounters'
import TeamCostAnalysis from '@/components/impact/TeamCostAnalysis'
import IndustryLandscape from '@/components/impact/IndustryLandscape'
import CompetitiveMatrix from '@/components/impact/CompetitiveMatrix'

export default function ImpactPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-quantum-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />

        <div className="container-custom relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center space-x-2 bg-quantum-900/40 border border-quantum-400/30 rounded-full px-5 py-2.5 mb-8 backdrop-blur-sm">
              <BarChart3 className="w-4 h-4 text-quantum-400" />
              <span className="text-sm font-semibold text-quantum-300">Impact &amp; Value Assessment</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-[1.1]"
          >
            The Scale of{' '}
            <span className="gradient-text">Quantum Security</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
          >
            289,000 lines of code. 35+ engineers worth of expertise.
            Delivered as a single installable application.
          </motion.p>
        </div>
      </section>

      <AnimatedCounters />
      <TeamCostAnalysis />
      <IndustryLandscape />
      <CompetitiveMatrix />

      {/* Bottom CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-quantum-500/10 via-transparent to-purple-500/10" />
        <div className="container-custom relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to secure your <span className="gradient-text">quantum future</span>?
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
              Get started in minutes with pip install, or request an enterprise evaluation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/demo" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
                Try the Demo <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/features" className="btn-secondary inline-flex items-center gap-2 text-lg px-8 py-4">
                Explore Features
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
