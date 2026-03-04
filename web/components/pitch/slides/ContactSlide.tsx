'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { CONTACT_INFO } from '@/lib/pitch-data'
import type { Scenario } from '@/lib/pitch-data'
import { Mail, Globe, Github, Linkedin, ArrowUpRight } from 'lucide-react'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
})

const SOCIAL_LINKS = [
  {
    icon: Mail,
    label: 'Email',
    href: `mailto:${CONTACT_INFO.email}`,
    value: CONTACT_INFO.email,
  },
  {
    icon: Globe,
    label: 'Website',
    href: CONTACT_INFO.website,
    value: 'zipminator.zip',
  },
  {
    icon: Github,
    label: 'GitHub',
    href: CONTACT_INFO.github,
    value: 'github.com/qdaria',
  },
  {
    icon: Linkedin,
    label: 'LinkedIn',
    href: CONTACT_INFO.linkedin,
    value: 'company/qdaria',
  },
]

export default function ContactSlide({ scenario: _scenario = 'base' }: { scenario?: Scenario }) {
  return (
    <SlideWrapper>
      <div className="flex flex-col items-center justify-center text-center py-8">
        {/* Animated "Z" Logo */}
        <motion.div {...fadeUp()} className="relative mb-10">
          {/* Glow rings */}
          <motion.div
            className="absolute inset-0 rounded-full bg-quantum-500/20 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-2 rounded-full bg-purple-500/15 blur-2xl"
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Z Letter */}
          <div className="relative w-28 h-28 rounded-2xl bg-gradient-to-br from-quantum-500 to-quantum-700 flex items-center justify-center shadow-2xl shadow-quantum-500/30">
            <span className="text-6xl font-display font-black text-white select-none">
              Z
            </span>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div {...fadeUp(0.1)}>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white mb-4">
            Let&apos;s Build the Future
            <br />
            <span className="gradient-text">of Security</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-8">
            Quantum threats are not theoretical. The migration deadline is real.
            We are building the tools the world needs.
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.div {...fadeUp(0.15)} className="mb-12">
          <a
            href={`mailto:${CONTACT_INFO.email}?subject=Zipminator%20Investment%20Inquiry`}
            className="btn-primary text-lg px-10 py-4 gap-2"
          >
            Schedule a Meeting
            <ArrowUpRight className="w-5 h-5" />
          </a>
        </motion.div>

        {/* Contact Links */}
        <motion.div
          {...fadeUp(0.2)}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl mb-12"
        >
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.label === 'Email' ? undefined : '_blank'}
              rel={link.label === 'Email' ? undefined : 'noopener noreferrer'}
              className="card-quantum flex flex-col items-center gap-2 py-4 group"
            >
              <link.icon className="w-5 h-5 text-quantum-400 group-hover:text-quantum-300 transition-colors" />
              <span className="text-xs text-gray-400 font-mono">{link.label}</span>
              <span className="text-xs text-gray-500 truncate max-w-full px-2">
                {link.value}
              </span>
            </a>
          ))}
        </motion.div>

        {/* Thank You + Branding */}
        <motion.div {...fadeUp(0.25)} className="space-y-3">
          <p className="text-lg text-gray-300 font-display">Thank you.</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-quantum-500" />
            <span>
              A <span className="text-gray-400 font-semibold">QDaria</span> Company
            </span>
          </div>
        </motion.div>

        {/* Subtle animated particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-1 h-1 rounded-full bg-quantum-500/30"
              style={{
                left: `${15 + i * 14}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.4,
              }}
            />
          ))}
        </div>
      </div>
    </SlideWrapper>
  )
}
