'use client'

import { motion } from 'framer-motion'
import {
  ShieldCheck,
  Building2,
  Heart,
  Landmark,
  Scale,
  Briefcase,
  TrendingUp,
  ArrowRight,
  MessageCircle,
  Mail,
  Globe,
} from 'lucide-react'

const verticals = [
  { icon: ShieldCheck, label: 'Defense & Intel', color: 'from-green-500 to-emerald-500' },
  { icon: Heart, label: 'Healthcare', color: 'from-red-500 to-pink-500' },
  { icon: Landmark, label: 'Finance & Banking', color: 'from-blue-500 to-cyan-500' },
  { icon: Building2, label: 'Government', color: 'from-purple-500 to-indigo-500' },
  { icon: Scale, label: 'Legal', color: 'from-amber-500 to-yellow-500' },
  { icon: Briefcase, label: 'Enterprise', color: 'from-orange-500 to-red-500' },
]

const comparisons = [
  {
    competitor: 'Signal',
    category: 'Messaging',
    icon: MessageCircle,
    lacks: 'PQC messaging only — no VPN, no email, no browser, no VoIP encryption',
  },
  {
    competitor: 'ProtonMail',
    category: 'Email',
    icon: Mail,
    lacks: 'PQC email only — no VPN, no messaging, no VoIP',
  },
  {
    competitor: 'NordVPN',
    category: 'VPN',
    icon: Globe,
    lacks: 'No PQC, no messaging, no email, no encryption engine',
  },
]

const mandates = [
  {
    org: 'NSA CNSA 2.0',
    deadline: '2025-2033',
    requirement: 'All national security systems must transition to PQC',
  },
  {
    org: 'NIST',
    deadline: '2024-2035',
    requirement: 'Deprecate RSA/ECC, mandate ML-KEM and ML-DSA',
  },
  {
    org: 'White House OMB',
    deadline: 'M-23-02',
    requirement: 'Federal agencies must inventory and migrate cryptographic systems',
  },
]

const IndustryImpact = () => {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900/50 to-gray-950" />

      <div className="container-custom relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-quantum-900/30 border border-quantum-500/30 rounded-full px-5 py-2.5 mb-8">
            <TrendingUp className="w-4 h-4 text-quantum-400" />
            <span className="text-sm font-semibold text-quantum-300">
              $35B+ Market Opportunity
            </span>
          </div>

          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="gradient-text">The Quantum Mandate</span>
            <br />
            <span className="text-white">Is Here</span>
          </h2>

          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Governments worldwide are mandating post-quantum cryptography.
            Zipminator already implements NIST FIPS 203 and 204.
          </p>
        </motion.div>

        {/* Government mandates */}
        <div className="max-w-4xl mx-auto mb-20">
          <motion.h3
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-lg font-semibold text-gray-300 mb-6 text-center"
          >
            Active Government Mandates
          </motion.h3>

          <div className="space-y-3">
            {mandates.map((mandate, index) => (
              <motion.div
                key={mandate.org}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex items-center gap-4 bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-quantum-500/30 transition-all duration-300"
              >
                <div className="flex-shrink-0 px-3 py-1.5 bg-quantum-900/50 border border-quantum-500/20 rounded-lg">
                  <span className="text-sm font-bold text-quantum-300 font-mono">
                    {mandate.org}
                  </span>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-xs font-mono text-gray-500">
                    {mandate.deadline}
                  </span>
                </div>
                <div className="flex-1">
                  <span className="text-sm text-gray-400">
                    {mandate.requirement}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Target verticals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <h3 className="text-lg font-semibold text-gray-300 mb-8 text-center">
            Built for Every Regulated Industry
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {verticals.map((vertical, index) => (
              <motion.div
                key={vertical.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
                className="group"
              >
                <div className="card-quantum text-center h-full hover:scale-105 transition-all duration-300">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${vertical.color} rounded-xl flex items-center justify-center mx-auto mb-3 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300`}
                  >
                    <vertical.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {vertical.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Competitive comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <h3 className="text-lg font-semibold text-gray-300 mb-8 text-center">
            Why Not Just Use...?
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comparisons.map((comp, index) => (
              <motion.div
                key={comp.competitor}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 h-full hover:border-quantum-500/30 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <comp.icon className="w-5 h-5 text-gray-500" />
                    <span className="font-semibold text-white">
                      {comp.competitor}
                    </span>
                    <span className="text-xs text-gray-600">
                      ({comp.category})
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{comp.lacks}</p>
                  <div className="flex items-center gap-2 text-xs text-quantum-400 font-semibold">
                    <span>Zipminator does it all</span>
                    <ArrowRight className="w-3 h-3" />
                    <span className="text-quantum-300">Quantum-safe</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default IndustryImpact
