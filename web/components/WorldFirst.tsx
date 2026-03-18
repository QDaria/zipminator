'use client'

import { motion } from 'framer-motion'
import {
  Trophy,
  Shield,
  Cpu,
  Wifi,
  Globe,
  Compass,
  Mail,
  Sparkles,
} from 'lucide-react'

const firsts = [
  {
    icon: Shield,
    claim: 'First consumer super-app with NIST-approved PQC across all channels',
    detail:
      'Messaging, calls, email, VPN, and browsing: all protected by ML-KEM-768 in a single application',
  },
  {
    icon: Cpu,
    claim: 'First app combining real quantum hardware entropy with PQC',
    detail:
      'True randomness from 156-qubit quantum processors seeds every key generation and nonce',
  },
  {
    icon: Wifi,
    claim: 'First app making SS7 completely irrelevant',
    detail:
      'Quantum-secure overlay on messaging, voice, and location eliminates all SS7 attack vectors',
  },
  {
    icon: Globe,
    claim: 'First PQ-WireGuard consumer VPN',
    detail:
      'WireGuard protocol extended with ML-KEM post-quantum key exchange for always-on protection',
  },
  {
    icon: Compass,
    claim: 'First browser with built-in PQC TLS + Q-VPN + AI',
    detail:
      'ZipBrowser combines quantum-safe transport, integrated VPN tunnel, and privacy-first AI in one',
  },
  {
    icon: Mail,
    claim: 'First all-in-one app with PQC email, messaging, VoIP, VPN, and browser',
    detail:
      'No other product combines quantum-secure email, messaging, voice, VPN, and browsing in a single install',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}

const WorldFirst = () => {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-quantum-950/10 to-gray-950" />
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-quantum-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container-custom relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-amber-900/30 border border-amber-500/30 rounded-full px-5 py-2.5 mb-8">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-300">
              Industry Firsts
            </span>
          </div>

          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white">World&apos;s</span>{' '}
            <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
              First
            </span>
          </h2>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Zipminator sets records no other security product has reached
          </p>
        </motion.div>

        {/* First claims */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-4xl mx-auto space-y-5"
        >
          {firsts.map((first, index) => (
            <motion.div key={index} variants={itemVariants} className="group">
              <div className="relative bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800 hover:border-amber-500/30 transition-all duration-300 overflow-hidden">
                {/* Gold accent line */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-yellow-600 opacity-50 group-hover:opacity-100 transition-opacity" />

                <div className="p-6 pl-8 flex items-start gap-5">
                  {/* Number badge */}
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center">
                    <first.icon className="w-6 h-6 text-amber-400" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-1" />
                      <h3 className="text-lg font-bold text-white leading-snug">
                        {first.claim}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed pl-6">
                      {first.detail}
                    </p>
                  </div>
                </div>

                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/[0.02] to-yellow-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default WorldFirst
