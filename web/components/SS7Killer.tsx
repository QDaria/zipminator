'use client'

import { motion } from 'framer-motion'
import {
  ShieldOff,
  ShieldCheck,
  Phone,
  MessageSquare,
  MapPin,
  KeyRound,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'

const attacks = [
  {
    attack: 'Call Interception',
    icon: Phone,
    blocked: 'PQ-SRTP encrypts all voice/video',
    color: 'from-red-500 to-orange-500',
  },
  {
    attack: 'SMS Hijacking',
    icon: MessageSquare,
    blocked: 'PQC Messenger replaces SMS entirely',
    color: 'from-orange-500 to-yellow-500',
  },
  {
    attack: 'Location Tracking',
    icon: MapPin,
    blocked: 'Q-VPN masks all network signals',
    color: 'from-yellow-500 to-green-500',
  },
  {
    attack: 'MFA / 2FA Bypass',
    icon: KeyRound,
    blocked: 'Quantum-authenticated channels',
    color: 'from-green-500 to-cyan-500',
  },
]

const SS7Killer = () => {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-red-950/10 to-gray-950" />
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 40px,
              rgba(239, 68, 68, 0.05) 40px,
              rgba(239, 68, 68, 0.05) 41px
            )`,
          }}
        />
      </div>

      {/* Danger glow top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-500/5 rounded-full blur-3xl" />

      <div className="container-custom relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-red-900/30 border border-red-500/30 rounded-full px-5 py-2.5 mb-8">
            <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
            <span className="text-sm font-semibold text-red-300">
              Critical Vulnerability Neutralized
            </span>
          </div>

          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="text-red-400 line-through opacity-60">SS7</span>{' '}
            <span className="text-white">Is Dead.</span>
            <br />
            <span className="gradient-text">Long Live Quantum Security.</span>
          </h2>

          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            SS7 was designed in{' '}
            <span className="text-red-400 font-bold">1975</span>. It has{' '}
            <span className="text-red-400 font-bold">zero encryption</span>.
            The DHS confirmed China, Iran, Israel, and Russia have exploited it.
            Every phone call, SMS, and location ping is exposed.
          </p>
        </motion.div>

        {/* Attack Vector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-16">
          {attacks.map((item, index) => (
            <motion.div
              key={item.attack}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="relative bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 hover:border-quantum-500/40 transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-quantum-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10 flex items-center gap-4">
                  {/* Attack side */}
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-red-900/40 rounded-xl flex items-center justify-center border border-red-500/20">
                      <ShieldOff className="w-7 h-7 text-red-400" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <item.icon className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-semibold text-red-400 line-through">
                        {item.attack}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">SS7 exploit vector</div>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0">
                    <ArrowRight className="w-5 h-5 text-quantum-400" />
                  </div>

                  {/* Blocked side */}
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-quantum-900/40 rounded-xl flex items-center justify-center border border-quantum-500/30">
                      <ShieldCheck className="w-7 h-7 text-quantum-400" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-quantum-300">
                      Blocked
                    </div>
                    <div className="text-xs text-gray-400">{item.blocked}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <div className="inline-block bg-gradient-to-r from-quantum-900/50 to-purple-900/50 border border-quantum-500/20 rounded-2xl px-8 py-6 backdrop-blur-sm max-w-3xl">
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
              Zipminator wraps{' '}
              <span className="text-quantum-400 font-bold">every signal</span>{' '}
              in{' '}
              <span className="font-mono text-quantum-300 font-semibold">
                ML-KEM-768
              </span>
              . Calls, messages, location, authentication: all quantum-secure,
              all the time.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default SS7Killer
