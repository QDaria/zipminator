'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, MessageSquare, Phone, Globe, Eye, Mail, Smartphone, Bot,
  Lock, Atom
} from 'lucide-react'

const modules = [
  {
    id: 'encryption',
    icon: Lock,
    name: 'PQC Encryption',
    color: 'from-quantum-500 to-indigo-500',
    description: 'ML-KEM-768 (Kyber768) core engine with NIST FIPS 203 compliance. 0.034ms encryption, constant-time operations, memory-safe Rust implementation.',
  },
  {
    id: 'entropy',
    icon: Atom,
    name: 'Quantum Entropy',
    color: 'from-purple-500 to-pink-500',
    description: 'Real IBM 156-qubit quantum hardware via qBraid pipeline. Ever-growing entropy pool with multi-source fallback chain.',
  },
  {
    id: 'messenger',
    icon: MessageSquare,
    name: 'Secure Messenger',
    color: 'from-blue-500 to-cyan-500',
    description: 'PQC Double Ratchet protocol with forward secrecy, deniable authentication, and self-destructing messages.',
  },
  {
    id: 'voip',
    icon: Phone,
    name: 'PQ-SRTP VoIP',
    color: 'from-green-500 to-emerald-500',
    description: 'Quantum-safe voice and video calls. Post-quantum SRTP makes SS7 interception irrelevant.',
  },
  {
    id: 'vpn',
    icon: Globe,
    name: 'Q-VPN',
    color: 'from-teal-500 to-cyan-500',
    description: 'PQ-WireGuard tunnel with always-on protection and zero-knowledge routing.',
  },
  {
    id: 'anonymizer',
    icon: Eye,
    name: '10-Level Anonymizer',
    color: 'from-orange-500 to-red-500',
    description: 'Graduated anonymization from L1 basic pseudonymization to L10 quantum-randomized identity.',
  },
  {
    id: 'browser',
    icon: Shield,
    name: 'ZipBrowser',
    color: 'from-yellow-500 to-orange-500',
    description: 'Built-in PQC TLS, integrated Q-VPN, AI sidebar, zero telemetry. Browse without compromise.',
  },
  {
    id: 'email',
    icon: Mail,
    name: 'PQC Email',
    color: 'from-rose-500 to-pink-500',
    description: 'Quantum-secure SMTP/IMAP with self-destruct timers, PII scanning, and end-to-end PQC encryption.',
  },
  {
    id: 'device',
    icon: Smartphone,
    name: 'Device Shield',
    color: 'from-violet-500 to-purple-500',
    description: 'Install once, protect everything. System-wide PQC encryption for all network traffic.',
  },
  {
    id: 'ai',
    icon: Bot,
    name: 'Q-AI Assistant',
    color: 'from-cyan-500 to-blue-500',
    description: 'PQC tunnel mode for AI queries, prompt injection defense, and encrypted model inference.',
  },
]

const EcosystemDiagram = () => {
  const [selected, setSelected] = useState<string | null>(null)
  const active = modules.find((m) => m.id === selected)

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-quantum-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
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
            The <span className="gradient-text">Super-App</span> Ecosystem
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Eight interconnected security modules, one unified platform. Tap any module to explore.
          </p>
        </motion.div>

        {/* Module Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
          {modules.map((mod, i) => (
            <motion.button
              key={mod.id}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              onClick={() => setSelected(selected === mod.id ? null : mod.id)}
              className={`relative group rounded-2xl p-5 border transition-all duration-300 text-left ${
                selected === mod.id
                  ? 'border-quantum-500 bg-quantum-900/30 shadow-lg shadow-quantum-500/20'
                  : 'border-white/10 bg-white/[0.03] hover:border-quantum-500/40 hover:bg-white/[0.06]'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                <mod.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-sm font-semibold text-white">{mod.name}</div>
              {selected === mod.id && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-quantum-400 rounded-full animate-pulse" />
              )}
            </motion.button>
          ))}
        </div>

        {/* Expanded Detail */}
        <AnimatePresence mode="wait">
          {active && (
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className={`card-quantum p-8 border-quantum-500/30`}>
                <div className="flex items-start gap-5">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${active.color} flex items-center justify-center shrink-0`}>
                    <active.icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{active.name}</h3>
                    <p className="text-gray-300 leading-relaxed">{active.description}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

export default EcosystemDiagram
