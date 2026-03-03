'use client'

import { motion } from 'framer-motion'
import { Shield, Award, Lock, GitBranch, Cpu, Globe } from 'lucide-react'

const ProviderShowcase = () => {
  const providers = [
    {
      name: 'IBM Quantum',
      description: '156-qubit hardware partner',
      icon: Cpu,
      color: 'from-blue-500 to-cyan-500',
      verified: true
    },
    {
      name: 'NIST',
      description: 'FIPS 203 Standards',
      icon: Award,
      color: 'from-purple-500 to-pink-500',
      verified: true
    },
    {
      name: 'GitHub',
      description: 'Open Source',
      icon: GitBranch,
      color: 'from-gray-500 to-gray-400',
      verified: true
    },
    {
      name: 'Kyber',
      description: 'ML-KEM Algorithm',
      icon: Shield,
      color: 'from-quantum-500 to-purple-500',
      verified: true
    },
    {
      name: 'OpenSSL',
      description: 'Cryptographic Engine',
      icon: Lock,
      color: 'from-red-500 to-orange-500',
      verified: false
    },
    {
      name: 'IETF',
      description: 'Standards Compliance',
      icon: Globe,
      color: 'from-green-500 to-emerald-500',
      verified: false
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  }

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950" />

      {/* Quantum grid effect */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
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
          <div className="inline-flex items-center space-x-2 bg-quantum-900/30 border border-quantum-500/30 rounded-full px-4 py-2 mb-6">
            <Shield className="w-4 h-4 text-quantum-400" />
            <span className="text-sm font-medium text-quantum-300">
              Industry Leaders
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">
              Trusted by Leading
            </span>
            <br />
            <span className="text-white">
              Quantum & Security Organizations
            </span>
          </h2>

          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Powered by real quantum hardware and certified cryptographic standards
          </p>
        </motion.div>

        {/* Provider Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto"
        >
          {providers.map((provider, index) => (
            <motion.div
              key={provider.name}
              variants={itemVariants}
              className="group relative"
            >
              {/* Card */}
              <div className="relative h-full bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-quantum-500/50 transition-all duration-300 overflow-hidden">
                {/* Hover gradient effect */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br ${provider.color}`} />

                {/* Verified badge */}
                {provider.verified && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-quantum-500/20 rounded-full flex items-center justify-center border border-quantum-500/30">
                      <Shield className="w-3 h-3 text-quantum-400" />
                    </div>
                  </div>
                )}

                {/* Icon */}
                <div className="relative mb-4">
                  <div className={`w-16 h-16 mx-auto rounded-xl bg-gradient-to-br ${provider.color} opacity-20 group-hover:opacity-30 transition-opacity duration-300 flex items-center justify-center`}>
                    <provider.icon className="w-8 h-8 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Content */}
                <div className="relative text-center">
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-quantum-400 transition-colors">
                    {provider.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {provider.description}
                  </p>
                </div>

                {/* Glow effect on hover */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.3)]`} />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          <div className="card-quantum text-center">
            <div className="text-3xl font-bold text-quantum-400 mb-2">156</div>
            <div className="text-gray-400">Qubit Quantum Hardware</div>
          </div>

          <div className="card-quantum text-center">
            <div className="text-3xl font-bold text-quantum-400 mb-2">NIST Level 3</div>
            <div className="text-gray-400">Security Certification</div>
          </div>

          <div className="card-quantum text-center">
            <div className="text-3xl font-bold text-quantum-400 mb-2">100%</div>
            <div className="text-gray-400">Open Source</div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-gray-400 mb-6">
            Join the quantum-secure revolution
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#demo" className="btn-primary">
              Get Started Free
            </a>
            <a href="https://github.com/zipminator" target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center space-x-2">
              <GitBranch className="w-5 h-5" />
              <span>View on GitHub</span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default ProviderShowcase
