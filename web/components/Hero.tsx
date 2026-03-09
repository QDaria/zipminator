'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Shield, Zap, Book, Cpu } from 'lucide-react'
import Link from 'next/link'
import QuantumBackground from './QuantumBackground'

const Hero = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  const statCardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-32 pt-24">
      {/* Animated Quantum Background */}
      <QuantumBackground />

      {/* Radial Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-quantum-900/20 via-transparent to-transparent pointer-events-none z-[1]" />

      {/* Content */}
      <div className="container-custom relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="inline-block mb-8">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-quantum-900/40 to-purple-900/40 border border-quantum-400/30 rounded-full px-5 py-2.5 backdrop-blur-sm shadow-lg shadow-quantum-500/20 hover:shadow-quantum-500/40 transition-shadow duration-300">
              <Shield className="w-4 h-4 text-quantum-400 animate-pulse" />
              <span className="text-sm font-semibold bg-gradient-to-r from-quantum-300 to-purple-300 bg-clip-text text-transparent">
                NIST FIPS 203 Approved Post-Quantum Cryptography
              </span>
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-[1.05] tracking-tight"
          >
            <span className="block bg-gradient-to-r from-quantum-300 via-quantum-400 to-purple-400 bg-clip-text text-transparent drop-shadow-2xl">
              The Quantum-Secure
            </span>
            <span className="block text-white drop-shadow-lg mt-2">
              Encryption Platform
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="text-lg md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Real quantum entropy from{' '}
            <span className="text-quantum-400 font-bold">156-qubit IBM hardware</span>
            {' '}combined with{' '}
            <span className="text-quantum-400 font-bold">NIST FIPS 203 Kyber768</span>
            {' '}cryptography for unbreakable security
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <Link
              href="#waitlist"
              className="btn-primary flex items-center space-x-2 group relative overflow-hidden px-8 py-4 text-lg font-semibold shadow-xl shadow-quantum-500/30 hover:shadow-quantum-500/50"
            >
              <span className="relative z-10">Join the Beta</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-r from-quantum-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
            <Link
              href="/features"
              className="btn-secondary flex items-center space-x-2 group px-8 py-4 text-lg font-semibold hover:border-quantum-400 transition-all duration-300"
            >
              <Book className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              <span>Explore Features</span>
            </Link>
          </motion.div>

          {/* Key Stats Cards */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.8,
                },
              },
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            {/* Speed Card */}
            <motion.div
              variants={statCardVariants}
              whileHover={{
                scale: 1.05,
                transition: { duration: 0.2 },
              }}
              className="card-quantum text-center group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-quantum-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-quantum-900/60 to-purple-900/60 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-quantum-500/20">
                  <Zap className="w-7 h-7 text-quantum-400" />
                </div>
                <div className="text-3xl font-bold bg-gradient-to-br from-quantum-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  0.034ms
                </div>
                <div className="text-gray-400 font-medium">Encryption Speed</div>
              </div>
            </motion.div>

            {/* Hardware Card */}
            <motion.div
              variants={statCardVariants}
              whileHover={{
                scale: 1.05,
                transition: { duration: 0.2 },
              }}
              className="card-quantum text-center group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-quantum-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-quantum-900/60 to-purple-900/60 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-quantum-500/20">
                  <Cpu className="w-7 h-7 text-quantum-400" />
                </div>
                <div className="text-3xl font-bold bg-gradient-to-br from-quantum-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  156 Qubits
                </div>
                <div className="text-gray-400 font-medium">IBM Quantum Hardware</div>
              </div>
            </motion.div>

            {/* Security Card */}
            <motion.div
              variants={statCardVariants}
              whileHover={{
                scale: 1.05,
                transition: { duration: 0.2 },
              }}
              className="card-quantum text-center group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-quantum-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-quantum-900/60 to-purple-900/60 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-quantum-500/20">
                  <Shield className="w-7 h-7 text-quantum-400" />
                </div>
                <div className="text-3xl font-bold bg-gradient-to-br from-quantum-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  NIST Level 3
                </div>
                <div className="text-gray-400 font-medium">Security Standard</div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
      >
        <div className="flex flex-col items-center space-y-2">
          <span className="text-sm text-gray-400 font-medium">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-6 h-10 border-2 border-quantum-500/50 rounded-full flex items-start justify-center p-2 backdrop-blur-sm bg-quantum-900/20"
          >
            <motion.div
              animate={{
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-1.5 h-1.5 bg-quantum-500 rounded-full shadow-lg shadow-quantum-500/50"
            />
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

export default Hero
