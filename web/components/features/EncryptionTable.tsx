'use client'

import { motion } from 'framer-motion'

const technologies = [
  { tech: 'ML-KEM-768', standard: 'NIST FIPS 203', useCase: 'Key encapsulation', level: 'Level 3', levelColor: 'text-green-400' },
  { tech: 'PQC Double Ratchet', standard: 'Custom / Signal+', useCase: 'Messaging', level: 'Level 3+', levelColor: 'text-green-400' },
  { tech: 'PQ-SRTP', standard: 'Custom', useCase: 'Voice / Video', level: 'Level 3', levelColor: 'text-green-400' },
  { tech: 'PQ-WireGuard', standard: 'Custom', useCase: 'VPN tunnel', level: 'Level 3', levelColor: 'text-green-400' },
  { tech: 'ML-DSA (Dilithium)', standard: 'NIST FIPS 204', useCase: 'Digital signatures', level: 'Level 3', levelColor: 'text-green-400' },
  { tech: 'SLH-DSA (SPHINCS+)', standard: 'NIST FIPS 205', useCase: 'Stateless signatures', level: 'Level 3', levelColor: 'text-green-400' },
  { tech: 'QRNG', standard: 'IBM Quantum', useCase: 'Entropy source', level: 'Hardware', levelColor: 'text-cyan-400' },
  { tech: 'AES-256-GCM', standard: 'NIST', useCase: 'Symmetric encryption', level: 'Level 5', levelColor: 'text-emerald-400' },
  { tech: 'SHA-3 / SHAKE', standard: 'NIST FIPS 202', useCase: 'Hashing / KDF', level: 'Level 5', levelColor: 'text-emerald-400' },
  { tech: 'X3DH + PQ', standard: 'Custom', useCase: 'Key agreement', level: 'Level 3+', levelColor: 'text-green-400' },
  { tech: 'DoD 5220.22-M', standard: 'US DoD', useCase: 'Secure delete', level: '3-Pass', levelColor: 'text-yellow-400' },
]

const platforms = [
  { platform: 'iOS', sdk: 'Swift', status: 'Full', statusColor: 'text-green-400' },
  { platform: 'Android', sdk: 'Kotlin', status: 'Full', statusColor: 'text-green-400' },
  { platform: 'macOS', sdk: 'Rust / Swift', status: 'Full', statusColor: 'text-green-400' },
  { platform: 'Windows', sdk: 'Rust / C++', status: 'Full', statusColor: 'text-green-400' },
  { platform: 'Linux', sdk: 'Rust', status: 'Full', statusColor: 'text-green-400' },
  { platform: 'Web', sdk: 'WASM / JS', status: 'Beta', statusColor: 'text-yellow-400' },
  { platform: 'Python SDK', sdk: 'PyO3', status: 'Stable', statusColor: 'text-green-400' },
  { platform: 'Node.js SDK', sdk: 'NAPI', status: 'Stable', statusColor: 'text-green-400' },
  { platform: 'C/C++ SDK', sdk: 'FFI', status: 'Stable', statusColor: 'text-green-400' },
]

const EncryptionTable = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-quantum-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container-custom relative z-10">
        {/* Encryption Technologies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Encryption <span className="gradient-text">Technologies</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Every algorithm, every standard, every use case
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="overflow-x-auto mb-24"
        >
          <div className="min-w-[700px]">
            <div className="glass-panel rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-4 gap-4 px-6 py-4 bg-quantum-900/30 border-b border-white/10 text-sm font-semibold text-quantum-300 uppercase tracking-wider">
                <div>Technology</div>
                <div>Standard</div>
                <div>Use Case</div>
                <div>Security Level</div>
              </div>
              {/* Rows */}
              {technologies.map((row, i) => (
                <div
                  key={row.tech}
                  className={`grid grid-cols-4 gap-4 px-6 py-4 text-sm transition-colors hover:bg-white/[0.03] ${
                    i < technologies.length - 1 ? 'border-b border-white/5' : ''
                  }`}
                >
                  <div className="font-semibold text-white font-mono">{row.tech}</div>
                  <div className="text-gray-400">{row.standard}</div>
                  <div className="text-gray-300">{row.useCase}</div>
                  <div className={`font-semibold ${row.levelColor}`}>{row.level}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Platform Support Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Platform <span className="gradient-text">Support</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Native performance on every platform, every SDK
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="overflow-x-auto"
        >
          <div className="min-w-[500px]">
            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-quantum-900/30 border-b border-white/10 text-sm font-semibold text-quantum-300 uppercase tracking-wider">
                <div>Platform</div>
                <div>SDK / Language</div>
                <div>Status</div>
              </div>
              {platforms.map((row, i) => (
                <div
                  key={row.platform}
                  className={`grid grid-cols-3 gap-4 px-6 py-4 text-sm transition-colors hover:bg-white/[0.03] ${
                    i < platforms.length - 1 ? 'border-b border-white/5' : ''
                  }`}
                >
                  <div className="font-semibold text-white">{row.platform}</div>
                  <div className="text-gray-400 font-mono">{row.sdk}</div>
                  <div className={`font-semibold ${row.statusColor}`}>{row.status}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default EncryptionTable
