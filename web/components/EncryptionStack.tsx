'use client'

import { motion } from 'framer-motion'
import {
  Shield,
  Key,
  Lock,
  Globe,
  Cpu,
  Fingerprint,
  Trash2,
  Layers,
  ScanEye,
  Cookie,
  FileCheck,
} from 'lucide-react'

const stackLayers = [
  {
    icon: Shield,
    name: 'ML-KEM-768 (Kyber768)',
    standard: 'NIST FIPS 203',
    description: 'Lattice-based key encapsulation mechanism; the foundation of all PQC in Zipminator',
    color: 'from-quantum-500 to-purple-600',
  },
  {
    icon: Key,
    name: 'PQC Double Ratchet',
    standard: 'Custom Protocol',
    description: 'Forward-secret, post-quantum messaging ratchet with per-message key derivation',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Lock,
    name: 'PQ-SRTP',
    standard: 'RFC 3711 + PQC',
    description: 'Quantum-safe Secure Real-time Transport Protocol for voice and video',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Globe,
    name: 'PQ-WireGuard',
    standard: 'WireGuard + ML-KEM',
    description: 'Quantum-resistant VPN tunnel using post-quantum key exchange',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: FileCheck,
    name: 'PQC TLS',
    standard: 'TLS 1.3 + ML-KEM',
    description: 'Quantum-safe transport layer security for all web and API traffic',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: Cpu,
    name: 'IBM 156-Qubit QRNG',
    standard: 'Hardware Entropy',
    description: 'True quantum randomness from IBM 156-qubit quantum processors',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Fingerprint,
    name: 'ML-DSA (Dilithium)',
    standard: 'NIST FIPS 204',
    description: 'Lattice-based digital signatures for authentication and integrity',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Trash2,
    name: 'DoD 5220.22-M Deletion',
    standard: 'Military Standard',
    description: '3-pass overwrite ensuring data is irrecoverable after secure deletion',
    color: 'from-red-500 to-orange-500',
  },
  {
    icon: Layers,
    name: '10-Level Anonymization',
    standard: 'Proprietary Pipeline',
    description: 'Progressive identity stripping from basic pseudonym to full stealth',
    color: 'from-amber-500 to-yellow-500',
  },
  {
    icon: ScanEye,
    name: 'PII Scanning & Redaction',
    standard: 'Real-time Analysis',
    description: 'Automatic detection and removal of personally identifiable information',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Cookie,
    name: 'Cookie Rotation & FP Resistance',
    standard: 'Browser Defense',
    description: 'Automated cookie cycling and fingerprint randomization to prevent tracking',
    color: 'from-purple-500 to-indigo-500',
  },
  {
    icon: Shield,
    name: 'AES-256-GCM + AES-256-KW',
    standard: 'NIST / RFC 3394',
    description: 'Symmetric encryption for email bodies and key wrapping for content encryption keys',
    color: 'from-slate-500 to-gray-500',
  },
  {
    icon: Key,
    name: 'HKDF-SHA-256',
    standard: 'RFC 5869 / SP 800-56C',
    description: 'Key derivation for SRTP, VPN hybrid keys, email KEK, and composite KEM combiner',
    color: 'from-lime-500 to-green-500',
  },
  {
    icon: Lock,
    name: 'Argon2 Password Hashing',
    standard: 'PHC Winner',
    description: 'Memory-hard key derivation for browser password vault master keys',
    color: 'from-sky-500 to-blue-500',
  },
  {
    icon: Fingerprint,
    name: 'Composite KEM (ML-KEM + X25519)',
    standard: 'draft-ietf-openpgp-pqc',
    description: 'Hybrid post-quantum + classical key encapsulation for maximum security assurance',
    color: 'from-fuchsia-500 to-pink-500',
  },
  {
    icon: Shield,
    name: 'Constant-Time + Zeroize-on-Drop',
    standard: 'subtle / zeroize crates',
    description: 'Side-channel resistant comparisons and automatic memory wiping of secrets',
    color: 'from-stone-500 to-zinc-500',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
}

const EncryptionStack = () => {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950" />
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
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
            <Lock className="w-4 h-4 text-quantum-400" />
            <span className="text-sm font-semibold text-quantum-300">
              26 Security Technologies
            </span>
          </div>

          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="text-white">The</span>{' '}
            <span className="gradient-text">Encryption Stack</span>
          </h2>

          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Every layer of communication protected by military-grade,
            NIST-approved post-quantum cryptography
          </p>
        </motion.div>

        {/* Stack layers */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-4xl mx-auto space-y-3"
        >
          {stackLayers.map((layer, index) => (
            <motion.div
              key={layer.name}
              variants={itemVariants}
              className="group"
            >
              <div className="relative bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 hover:border-quantum-500/40 transition-all duration-300 overflow-hidden">
                {/* Left accent bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${layer.color} opacity-60 group-hover:opacity-100 transition-opacity`}
                />

                <div className="flex items-center gap-4 p-4 pl-6">
                  {/* Index */}
                  <div className="flex-shrink-0 w-8 text-center">
                    <span className="text-xs font-mono text-gray-600">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${layer.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                  >
                    <layer.icon className="w-5 h-5 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <h3 className="font-bold text-white text-sm md:text-base">
                        {layer.name}
                      </h3>
                      <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-semibold text-quantum-300 bg-quantum-900/40 border border-quantum-500/20 rounded-full w-fit">
                        {layer.standard}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 hidden sm:block">
                      {layer.description}
                    </p>
                  </div>
                </div>

                {/* Hover glow */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${layer.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom connector line */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex justify-center mt-8"
        >
          <div className="w-px h-12 bg-gradient-to-b from-quantum-500/50 to-transparent" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-quantum-900/30 border border-quantum-500/20 rounded-full">
            <div className="w-2 h-2 bg-quantum-400 rounded-full animate-pulse" />
            <span className="text-sm text-gray-300">
              All layers active simultaneously on every Zipminator device
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default EncryptionStack
