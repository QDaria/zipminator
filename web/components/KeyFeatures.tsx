'use client'

import { motion } from 'framer-motion'
import { Atom, ShieldCheck, Zap, Github, PuzzleIcon, Clock } from 'lucide-react'

const features = [
  {
    icon: Atom,
    title: 'True Quantum Randomness',
    description: 'Entropy harvested from IBM\'s 156-qubit quantum computer, not pseudo-random algorithms',
    gradient: 'from-quantum-500 via-blue-500 to-purple-500',
    animationDelay: 0,
  },
  {
    icon: ShieldCheck,
    title: 'FIPS 203 Kyber768',
    description: 'NIST-approved post-quantum cryptography resistant to quantum attacks',
    gradient: 'from-purple-500 via-pink-500 to-red-500',
    animationDelay: 0.1,
  },
  {
    icon: Zap,
    title: '0.034ms Encryption',
    description: 'Quantum-secure without sacrificing performance',
    gradient: 'from-yellow-500 via-orange-500 to-red-500',
    animationDelay: 0.2,
  },
  {
    icon: Github,
    title: 'Transparent Security',
    description: 'Fully auditable code, MIT + Commercial licensing',
    gradient: 'from-green-500 via-emerald-500 to-teal-500',
    animationDelay: 0.3,
  },
  {
    icon: PuzzleIcon,
    title: 'Multi-Language SDKs',
    description: 'Python, Rust, C++, Node.js with simple APIs',
    gradient: 'from-blue-500 via-indigo-500 to-purple-500',
    animationDelay: 0.4,
  },
  {
    icon: Clock,
    title: 'Quantum-Ready Today',
    description: 'Protect your data before quantum computers break current encryption',
    gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
    animationDelay: 0.5,
  },
]

const KeyFeatures = () => {
  return (
    <section className="section-padding relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 quantum-bg opacity-50" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-quantum-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
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
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance">
            Why <span className="gradient-text">Zipminator-PQC?</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto text-balance">
            The only encryption platform powered by{' '}
            <span className="text-quantum-400 font-semibold">real quantum hardware</span>
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: feature.animationDelay }}
              className="group relative"
            >
              {/* Card Container */}
              <div className="relative h-full bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-white/[0.08] hover:border-transparent transition-all duration-300 overflow-hidden">
                {/* Gradient Border on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
                <div className="absolute inset-[1px] bg-gray-900 rounded-2xl" />

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon with Animated Background */}
                  <div className="relative mb-6">
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-20 rounded-xl blur-xl group-hover:opacity-40 transition-opacity duration-300`} />
                    <div className={`relative w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-br group-hover:from-white group-hover:to-gray-300 transition-all duration-300">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                    {feature.description}
                  </p>

                  {/* Animated Particles */}
                  <div className="absolute top-4 right-4 w-2 h-2 bg-quantum-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping" />
                  <div className="absolute bottom-4 left-4 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse" />
                </div>

                {/* Hover Glow Effect */}
                <div className={`absolute -inset-1 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-300 -z-10`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900/50 border border-quantum-500/30 rounded-full">
            <div className="w-2 h-2 bg-quantum-400 rounded-full animate-pulse" />
            <span className="text-gray-300">
              Start securing your quantum future today
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default KeyFeatures
