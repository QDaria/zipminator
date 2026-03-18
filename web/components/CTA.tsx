'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Shield, Clock, Star, Github, BookOpen } from 'lucide-react'
import Link from 'next/link'

const CTA = () => {
  const [particles, setParticles] = useState<Array<{ left: number; top: number; duration: number }>>([])

  useEffect(() => {
    setParticles(
      Array.from({ length: 12 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 3 + Math.random() * 2,
      }))
    )
  }, [])

  // Particle animation variants
  const particleVariants = {
    animate: {
      y: [0, -20, 0],
      opacity: [0.3, 0.6, 0.3],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  return (
    <section className="relative py-24 md:py-32 overflow-hidden" id="demo">
      {/* Quantum Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-quantum-500/20 via-purple-600/20 to-quantum-900/20" />

      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Floating Quantum Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-quantum-400/30 rounded-full"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
            }}
            variants={particleVariants}
            animate="animate"
            transition={{
              delay: i * 0.2,
              duration: p.duration
            }}
          />
        ))}
      </div>

      {/* Dark Overlay for Text Contrast */}
      <div className="absolute inset-0 bg-gray-950/60" />

      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 bg-quantum-900/50 border border-quantum-400/40 rounded-full px-5 py-2.5 mb-8 backdrop-blur-sm"
          >
            <Shield className="w-4 h-4 text-quantum-400" />
            <span className="text-sm font-semibold text-quantum-300">
              Ready to Secure Your Future?
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            Be First to Access{' '}
            <span className="gradient-text">Quantum-Secure</span>
            <br />
            Encryption
          </motion.h2>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Protect your data with NIST-approved post-quantum cryptography.
            Join the beta. Ships free to early adopters.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-12"
          >
            {/* TODO: Inconsistent CTA - manually recreates gradient style instead of using btn-primary class from globals.css */}
            <Link
              href="#waitlist"
              className="group relative inline-flex items-center space-x-2 bg-gradient-to-r from-quantum-500 to-purple-600 text-white font-semibold text-lg px-10 py-5 rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-quantum-500/50 w-full sm:w-auto"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-quantum-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center space-x-2">
                <span>Join the Beta — Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            <Link
              href="#contact"
              className="group inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white font-semibold text-lg px-10 py-5 rounded-lg border-2 border-white/20 transition-all duration-300 hover:bg-white/20 hover:border-quantum-400/50 hover:scale-105 w-full sm:w-auto"
            >
              <span>Schedule a Demo</span>
            </Link>
          </motion.div>

          {/* Trust Signals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col md:flex-row items-center justify-center gap-8 text-sm text-gray-400 mb-16"
          >
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-quantum-400" />
              <span className="font-semibold text-white">Open-Source Licensed (MIT)</span>
              <span>MIT-Licensed Crypto Core</span>
            </div>
            <div className="hidden md:block w-px h-6 bg-gray-700" />
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-quantum-400" />
              <span className="font-semibold text-white">408+</span>
              <span>Tests Passing</span>
            </div>
            <div className="hidden md:block w-px h-6 bg-gray-700" />
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-quantum-400" />
              <span className="font-semibold text-white">SOC 2</span>
              <span>Ready</span>
            </div>
          </motion.div>

          {/* Additional Trust Signal */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-sm text-gray-500 mb-12"
          >
            No credit card required
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col md:flex-row items-center justify-center gap-6"
          >
            <Link
              href="https://github.com/qdaria/zipminator-pqc"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-400 hover:text-quantum-400 transition-colors group"
            >
              <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>View on GitHub</span>
            </Link>
            <div className="hidden md:block w-px h-6 bg-gray-700" />
            <Link
              href="/docs"
              className="flex items-center space-x-2 text-gray-400 hover:text-quantum-400 transition-colors group"
            >
              <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Read Documentation</span>
            </Link>
          </motion.div>

          {/* Trust Indicators - Industry Sectors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-20 pt-12 border-t border-gray-800/50"
          >
            <p className="text-sm text-gray-500 mb-8 uppercase tracking-wider">Built For</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              <div className="text-2xl font-bold text-gray-600 hover:text-gray-500 transition-colors">
                Fortune 500
              </div>
              <div className="text-2xl font-bold text-gray-600 hover:text-gray-500 transition-colors">
                Government
              </div>
              <div className="text-2xl font-bold text-gray-600 hover:text-gray-500 transition-colors">
                Healthcare
              </div>
              <div className="text-2xl font-bold text-gray-600 hover:text-gray-500 transition-colors">
                Finance
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Glow Effect */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-quantum-500/50 to-transparent" />
    </section>
  )
}

export default CTA
