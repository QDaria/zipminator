'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import {
  Code2,
  FileCode,
  Lock,
  Layers,
  Cpu,
  Monitor,
  Puzzle,
  Terminal,
  Users,
  Clock,
  DollarSign,
  FlaskConical,
  Wifi,
  ScrollText,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'

const stats = [
  { icon: FlaskConical, value: 556, suffix: '', label: 'Rust tests', format: false },
  { icon: Code2, value: 429, suffix: '', label: 'Python SDK tests (17 skipped)', format: false },
  { icon: Wifi, value: 106, suffix: '', label: 'Mesh tests', format: false },
  { icon: Lock, value: 513, suffix: '', label: 'Total workspace tests', format: false },
  { icon: Smartphone, value: 11, suffix: '', label: 'Flutter screens', format: false },
  { icon: Layers, value: 17, suffix: '', label: 'Riverpod providers', format: false },
  { icon: Puzzle, value: 6, suffix: '', label: 'Mesh Wave 1 modules', format: false },
  { icon: ScrollText, value: 3, suffix: '', label: 'Public research papers', format: false },
  { icon: ShieldCheck, value: 3, suffix: '', label: 'Patents filed (46 claims)', format: false },
  { icon: Cpu, value: 156, suffix: '-qubit', label: 'IBM Quantum (ibm_kingston)', format: false },
  { icon: FileCode, value: 35, suffix: '', label: 'IBM Quantum jobs (6.8 MB entropy)', format: false },
  { icon: Monitor, value: 6, suffix: '', label: 'iOS, Android, macOS, Windows, Linux, Web', format: false },
]

function AnimatedNumber({
  value,
  suffix,
  format,
  inView,
}: {
  value: number
  suffix: string
  format: boolean
  inView: boolean
}) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    let start = 0
    const duration = 2000
    const stepTime = 16
    const steps = duration / stepTime
    const increment = value / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        current = value
        clearInterval(timer)
      }
      setDisplay(Math.floor(current))
    }, stepTime)

    return () => clearInterval(timer)
  }, [inView, value])

  const formatted = format
    ? display.toLocaleString('en-US')
    : display.toString()

  return (
    <span>
      {formatted}
      {suffix}
    </span>
  )
}

const ProjectScale = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <section ref={ref} className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 to-gray-900" />
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-quantum-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
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
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="text-white">The Numbers Behind</span>
            <br />
            <span className="gradient-text">Zipminator</span>
          </h2>

          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            A project of this scope and ambition, measured in raw engineering output
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className="group"
            >
              <div className="card-quantum text-center h-full hover:scale-105 transition-all duration-300">
                <div className="w-12 h-12 bg-quantum-900/50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-quantum-900/80 group-hover:scale-110 transition-all duration-300">
                  <stat.icon className="w-6 h-6 text-quantum-400" />
                </div>
                <div className="text-2xl md:text-3xl font-bold gradient-text mb-1 font-mono">
                  <AnimatedNumber
                    value={stat.value}
                    suffix={stat.suffix}
                    format={stat.format}
                    inView={isInView}
                  />
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Comparison card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-gradient-to-r from-quantum-900/40 to-purple-900/40 border border-quantum-500/20 rounded-2xl p-8 md:p-10 backdrop-blur-sm">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-6 text-center">
              What It Would Take to Build This From Scratch
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-quantum-900/50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-7 h-7 text-quantum-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  35-50
                </div>
                <div className="text-sm text-gray-400">
                  Senior engineers needed
                </div>
              </div>

              <div className="text-center">
                <div className="w-14 h-14 bg-quantum-900/50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-7 h-7 text-quantum-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  18-24
                </div>
                <div className="text-sm text-gray-400">Months of development</div>
              </div>

              <div className="text-center">
                <div className="w-14 h-14 bg-quantum-900/50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-7 h-7 text-quantum-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  $15-25M+
                </div>
                <div className="text-sm text-gray-400">
                  Estimated development cost
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-400 text-sm">
                Zipminator delivers all of this in a single, install-and-go
                application.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default ProjectScale
