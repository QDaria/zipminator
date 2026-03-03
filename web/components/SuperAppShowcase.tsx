'use client'

import { motion } from 'framer-motion'
import {
  Shield,
  MessageCircle,
  Phone,
  Globe,
  Layers,
  Compass,
  Mail,
  Smartphone,
} from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'PQC Encryption Engine',
    description: 'Kyber768 core with real quantum entropy from IBM 156-qubit hardware',
    gradient: 'from-quantum-500 to-purple-600',
    tag: 'NIST FIPS 203',
  },
  {
    icon: MessageCircle,
    title: 'Quantum Secure Messenger',
    description: 'PQC Double Ratchet protocol for forward-secret, quantum-safe messaging',
    gradient: 'from-blue-500 to-cyan-500',
    tag: 'E2E PQC',
  },
  {
    icon: Phone,
    title: 'PQ-SRTP VoIP & Video',
    description: 'Crystal-clear calls and video encrypted with post-quantum SRTP',
    gradient: 'from-green-500 to-emerald-500',
    tag: 'Real-time',
  },
  {
    icon: Globe,
    title: 'Q-VPN',
    description: 'PQ-WireGuard VPN tunneling all device traffic through quantum-safe channels',
    gradient: 'from-orange-500 to-red-500',
    tag: 'Always-on',
  },
  {
    icon: Layers,
    title: '10-Level Anonymizer',
    description: 'Progressive anonymization pipeline from basic to NSA-grade stealth',
    gradient: 'from-pink-500 to-rose-500',
    tag: 'Multi-layer',
  },
  {
    icon: Compass,
    title: 'ZipBrowser',
    description: 'PQC TLS + built-in Q-VPN + AI assistant. Zero telemetry, zero fingerprints',
    gradient: 'from-violet-500 to-purple-500',
    tag: 'AI-powered',
  },
  {
    icon: Mail,
    title: 'Quantum-Secure Email',
    description: 'PQC-encrypted email with key discovery, zero-knowledge headers',
    gradient: 'from-cyan-500 to-blue-500',
    tag: 'WKD + PQC',
  },
  {
    icon: Smartphone,
    title: 'Device Shield',
    description: 'Always-on protection layer: PII scanner, cookie rotation, leak prevention',
    gradient: 'from-amber-500 to-orange-500',
    tag: 'Always-on',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
}

const SuperAppShowcase = () => {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 quantum-bg opacity-50" />
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-quantum-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-3xl" />
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
          <div className="inline-flex items-center space-x-2 bg-quantum-900/30 border border-quantum-500/30 rounded-full px-5 py-2.5 mb-8">
            <Shield className="w-4 h-4 text-quantum-400" />
            <span className="text-sm font-semibold text-quantum-300">
              8 Security Modules. 1 Super-App.
            </span>
          </div>

          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="gradient-text">Everything Quantum-Secure</span>
            <br />
            <span className="text-white">In Your Pocket</span>
          </h2>

          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto">
            Messaging, calls, browsing, email, VPN, and more.
            All wrapped in NIST-approved post-quantum cryptography.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group relative"
            >
              <div className="relative h-full bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 hover:border-transparent transition-all duration-300 overflow-hidden">
                {/* Gradient border on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`}
                />
                <div className="absolute inset-[1px] bg-gray-900 rounded-2xl" />

                <div className="relative z-10">
                  {/* Tag */}
                  <div className="mb-4">
                    <span
                      className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-gradient-to-r ${feature.gradient} text-white`}
                    >
                      {feature.tag}
                    </span>
                  </div>

                  {/* Icon */}
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-white mb-2">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                    {feature.description}
                  </p>
                </div>

                {/* Glow effect */}
                <div
                  className={`absolute -inset-1 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-15 blur-2xl transition-opacity duration-300 -z-10`}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default SuperAppShowcase
