'use client'

import { motion } from 'framer-motion'
import {
  Smartphone,
  Shield,
  Wifi,
  MessageCircle,
  Compass,
  ScanEye,
  Lock,
} from 'lucide-react'

const protectionLayers = [
  {
    icon: Wifi,
    label: 'Q-VPN encrypts ALL traffic',
    description: 'Every packet leaving your device passes through PQ-WireGuard',
  },
  {
    icon: MessageCircle,
    label: 'PQC replaces vulnerable SMS & calls',
    description: 'No more SS7 exposure; quantum-safe double ratchet messaging',
  },
  {
    icon: Compass,
    label: 'Browser blocks telemetry & fingerprinting',
    description: 'ZipBrowser with PQC TLS, cookie rotation, zero-knowledge browsing',
  },
  {
    icon: ScanEye,
    label: 'PII scanner catches leaks',
    description: 'Real-time detection and redaction before data leaves the device',
  },
  {
    icon: Lock,
    label: 'DoD 5220.22-M secure deletion',
    description: '3-pass overwrite ensures deleted data is irrecoverable',
  },
]

const shieldRings = [
  { size: 280, delay: 0, opacity: 0.08, duration: 8 },
  { size: 220, delay: 0.5, opacity: 0.12, duration: 7 },
  { size: 160, delay: 1, opacity: 0.18, duration: 6 },
]

const DeviceShield = () => {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-quantum-950/20 to-gray-950" />

      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Visual */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative flex items-center justify-center"
          >
            <div className="relative w-[320px] h-[320px] md:w-[400px] md:h-[400px]">
              {/* Animated shield rings */}
              {shieldRings.map((ring, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border border-quantum-500"
                  style={{
                    width: ring.size,
                    height: ring.size,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    opacity: ring.opacity,
                  }}
                  animate={{
                    scale: [1, 1.08, 1],
                    opacity: [ring.opacity, ring.opacity * 1.5, ring.opacity],
                  }}
                  transition={{
                    duration: ring.duration,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: ring.delay,
                  }}
                />
              ))}

              {/* Center device */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative"
                >
                  {/* Phone body */}
                  <div className="w-24 h-40 md:w-28 md:h-48 bg-gray-800 rounded-2xl border-2 border-gray-700 flex items-center justify-center shadow-2xl shadow-quantum-500/20">
                    <div className="w-20 h-36 md:w-24 md:h-44 bg-gray-900 rounded-xl flex items-center justify-center">
                      <Shield className="w-10 h-10 md:w-12 md:h-12 text-quantum-400" />
                    </div>
                  </div>

                  {/* Shield glow */}
                  <div className="absolute -inset-4 bg-quantum-500/10 rounded-3xl blur-xl" />
                </motion.div>
              </div>

              {/* Orbiting icons */}
              {[Wifi, MessageCircle, Compass, Lock, ScanEye].map((Icon, i) => {
                const angle = (i / 5) * Math.PI * 2 - Math.PI / 2
                const radius = 140
                const x = Math.cos(angle) * radius
                const y = Math.sin(angle) * radius
                return (
                  <motion.div
                    key={i}
                    className="absolute w-10 h-10 bg-quantum-900/60 border border-quantum-500/30 rounded-xl flex items-center justify-center"
                    style={{
                      top: `calc(50% + ${y}px - 20px)`,
                      left: `calc(50% + ${x}px - 20px)`,
                    }}
                    animate={{
                      scale: [1, 1.15, 1],
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.4,
                    }}
                  >
                    <Icon className="w-5 h-5 text-quantum-400" />
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center space-x-2 bg-quantum-900/30 border border-quantum-500/30 rounded-full px-4 py-2 mb-6">
              <Smartphone className="w-4 h-4 text-quantum-400" />
              <span className="text-sm font-medium text-quantum-300">
                Zero-Config Protection
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="text-white">One App.</span>
              <br />
              <span className="gradient-text">Every Communication Secured.</span>
            </h2>

            <p className="text-lg text-gray-400 mb-10 leading-relaxed">
              Zipminator activates a quantum shield around every
              communication channel. No configuration, no technical knowledge needed.
            </p>

            {/* Protection layers */}
            <div className="space-y-4">
              {protectionLayers.map((layer, index) => (
                <motion.div
                  key={layer.label}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="group flex items-start gap-4 p-4 rounded-xl bg-gray-900/30 border border-gray-800 hover:border-quantum-500/30 transition-all duration-300"
                >
                  <div className="w-10 h-10 bg-quantum-900/50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-quantum-900/80 transition-colors">
                    <layer.icon className="w-5 h-5 text-quantum-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm mb-0.5">
                      {layer.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {layer.description}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default DeviceShield
