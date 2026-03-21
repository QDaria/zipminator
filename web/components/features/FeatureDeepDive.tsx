'use client'

import { motion } from 'framer-motion'
import {
  Lock, Atom, MessageSquare, Phone, Globe, Eye, Shield, Mail,
  Smartphone, Bot
} from 'lucide-react'

const features = [
  {
    icon: Lock,
    title: 'PQC Encryption Engine',
    tag: 'NIST FIPS 203',
    metric: '0.034ms',
    metricLabel: 'encryption',
    description: 'ML-KEM-768 (Kyber768) lattice-based key encapsulation. Constant-time Rust implementation with memory-safe guarantees. Resistant to both classical and quantum attacks.',
    gradient: 'from-quantum-500 to-indigo-500',
  },
  {
    icon: Atom,
    title: 'Quantum Entropy',
    tag: 'IBM 156-Qubit',
    metric: '156',
    metricLabel: 'qubits',
    description: 'Real quantum randomness from IBM hardware via qBraid pipeline. Multi-source fallback: Rigetti, IBM Quantum, qBraid, then OS entropy. Ever-growing entropy pool.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: MessageSquare,
    title: 'Secure Messenger',
    tag: 'PQC Double Ratchet',
    metric: 'Level 3+',
    metricLabel: 'security',
    description: 'Extended Signal protocol with post-quantum key exchange. Forward secrecy, future secrecy, deniable authentication, self-destructing messages.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Phone,
    title: 'PQ-SRTP VoIP',
    tag: 'Quantum-Safe Voice',
    metric: '<50ms',
    metricLabel: 'latency',
    description: 'Post-quantum Secure Real-time Transport Protocol. Voice and video calls that cannot be intercepted, even by quantum computers. Makes SS7 attacks irrelevant.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: Globe,
    title: 'Q-VPN',
    tag: 'PQ-WireGuard',
    metric: 'Always-On',
    metricLabel: 'protection',
    description: 'Quantum-safe WireGuard tunnel with zero-knowledge routing. All traffic encrypted with post-quantum algorithms. Seamless handover between networks.',
    gradient: 'from-teal-500 to-cyan-500',
  },
  {
    icon: Eye,
    title: '10-Level Anonymizer',
    tag: 'L1 to L10',
    metric: '10',
    metricLabel: 'levels',
    description: 'Graduated anonymization: L1 regex masking, L5 k-anonymity, L10 irreversible quantum anonymization via QRNG one-time pad.',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    icon: Shield,
    title: 'ZipBrowser',
    tag: 'Zero Telemetry',
    metric: '0',
    metricLabel: 'trackers',
    description: 'PQC TLS for every connection, built-in Q-VPN, AI sidebar for private queries, zero telemetry. The browser that treats privacy as non-negotiable.',
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Mail,
    title: 'Quantum-Secure Email',
    tag: 'PQC SMTP/IMAP',
    metric: 'E2E',
    metricLabel: 'encrypted',
    description: 'End-to-end post-quantum email encryption. Self-destruct timers, automatic PII scanning, key directory with WKD compatibility.',
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    icon: Smartphone,
    title: 'Device Shield',
    tag: 'System-Wide',
    metric: '5',
    metricLabel: 'platforms',
    description: 'Install once, protect every app and connection. System-wide PQC encryption for iOS, Android, macOS, Windows, and Linux.',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: Bot,
    title: 'Q-AI Assistant',
    tag: 'PQC AI Tunnel',
    metric: 'Zero',
    metricLabel: 'data leaks',
    description: 'Route AI queries through a PQC-encrypted tunnel. Prompt injection defense, encrypted inference, and no data retention by providers.',
    gradient: 'from-cyan-500 to-blue-500',
  },
]

const FeatureDeepDive = () => {
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
            Feature <span className="gradient-text">Deep Dives</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Every module purpose-built for the post-quantum era
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.1 }}
              className="group relative"
            >
              <div className="relative h-full bg-gray-900/50 backdrop-blur-sm rounded-2xl p-7 border border-gray-800 hover:border-transparent transition-all duration-300 overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${feat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
                <div className="absolute inset-[1px] bg-gray-900 rounded-2xl" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                      <feat.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold gradient-text">{feat.metric}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">{feat.metricLabel}</div>
                    </div>
                  </div>

                  <div className="inline-block px-3 py-1 bg-quantum-900/50 border border-quantum-500/30 rounded-full text-xs text-quantum-300 font-medium mb-3">
                    {feat.tag}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3">{feat.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm">{feat.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeatureDeepDive
