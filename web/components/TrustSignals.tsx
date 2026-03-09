'use client'

import { motion } from 'framer-motion'
import { Shield, Award, Lock } from 'lucide-react'

const certifications = [
  {
    name: 'NIST FIPS 203',
    description: 'Post-Quantum Cryptography Standard',
    icon: Shield,
  },
  {
    name: 'Memory-Safe Rust',
    description: 'No unsafe blocks in crypto core',
    icon: Lock,
  },
  {
    name: 'NIST Level 3',
    description: 'AES-192 equivalent post-quantum security',
    icon: Award,
  },
]

const TrustSignals = () => {
  return (
    <section className="section-padding bg-gray-900/50">
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Trusted by <span className="gradient-text">Quantum Innovators</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Leading enterprises securing quantum-safe data with Zipminator-PQC
          </p>
        </motion.div>

        {/* Certifications */}
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mb-8"
          >
            <h3 className="text-2xl font-bold text-white mb-2">Security Standards</h3>
            <p className="text-gray-400">Meeting the highest standards in post-quantum cryptography</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {certifications.map((cert, index) => (
              <motion.div
                key={cert.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-quantum-500/20 hover:border-quantum-500/40 transition-all duration-300"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-quantum-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <cert.icon className="w-6 h-6 text-quantum-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2">{cert.name}</h4>
                    <p className="text-sm text-gray-400">{cert.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trust Statement */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <div className="inline-block bg-quantum-900/30 border border-quantum-500/30 rounded-full px-6 py-3">
            <p className="text-lg text-quantum-300">
              <span className="font-bold">287</span> tests passing • <span className="font-bold">Memory-safe</span> Rust core • <span className="font-bold">Constant-time</span> crypto
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default TrustSignals
