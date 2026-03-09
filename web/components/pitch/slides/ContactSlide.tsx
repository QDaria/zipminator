'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import SlideWrapper from '../SlideWrapper'
import { CONTACT_INFO } from '@/lib/pitch-data'
import type { Scenario } from '@/lib/pitch-data'
import {
  Mail,
  Globe,
  Github,
  Linkedin,
  ArrowUpRight,
  Leaf,
  Shield,
  PhoneCall,
  FileText,
  Handshake,
  Landmark,
} from 'lucide-react'

import { fadeUp } from '../slide-utils'

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

const NEXT_STEPS = [
  { step: 1, icon: PhoneCall, label: 'Schedule a call', detail: '30-min intro with founding team' },
  { step: 2, icon: FileText, label: 'Technical deep-dive', detail: 'Live demo + architecture review' },
  { step: 3, icon: Handshake, label: 'Term sheet discussion', detail: 'Align on structure and timeline' },
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

          {/* Z Logo */}
          <div className="relative w-40 h-24 rounded-2xl bg-gradient-to-br from-[#FF6600] to-[#CC5200] flex items-center justify-center shadow-2xl shadow-[#FF6600]/30">
            <Image
              src="/logos/Z-contact.svg"
              alt="Z"
              width={200}
              height={120}
              className="w-32 h-auto select-none"
            />
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div {...fadeUp(0.1)}>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white mb-4">
            Let&apos;s Build the Future
            <br />
            <span className="gradient-text">of Security</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-4">
            Quantum threats are not theoretical. The migration deadline is real.
            We are building the tools the world needs.
          </p>

          {/* Trust line */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Shield className="w-4 h-4 text-quantum-400" />
            <p className="text-sm text-quantum-400 font-mono">
              Norwegian-built &middot; GDPR-native &middot; Five Eyes-free
            </p>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div {...fadeUp(0.15)} className="mb-10">
          <a
            href={`mailto:${CONTACT_INFO.email}?subject=Zipminator%20Investment%20Inquiry`}
            className="btn-primary text-lg px-10 py-4 gap-2"
          >
            Schedule a Meeting
            <ArrowUpRight className="w-5 h-5" />
          </a>
        </motion.div>

        {/* Next Steps */}
        <motion.div {...fadeUp(0.17)} className="w-full max-w-2xl mb-10">
          <h3 className="text-base font-semibold text-white mb-4">Next Steps</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {NEXT_STEPS.map((s) => (
              <div key={s.step} className="card-quantum flex flex-col items-center gap-2 py-4 relative">
                <span className="absolute top-2 left-3 text-[11px] font-mono text-gray-600">
                  {s.step}
                </span>
                <s.icon className="w-6 h-6 text-quantum-400" />
                <p className="text-sm font-semibold text-white">{s.label}</p>
                <p className="text-xs text-gray-500">{s.detail}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contact Links */}
        <motion.div
          {...fadeUp(0.2)}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl mb-10"
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

        {/* ESG & Sustainability Badge */}
        <motion.div {...fadeUp(0.22)} className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 border border-green-500/20 px-4 py-2">
            <Leaf className="w-4 h-4 text-green-400" />
            <span className="text-xs text-green-400 font-mono">
              ESG Committed: 98% Renewable Energy &middot; Carbon-Neutral Data Centers &middot; PQC ~1000x More Efficient
            </span>
          </div>
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

        {/* Norway Quantum Initiative Footer Badge */}
        <motion.div {...fadeUp(0.28)} className="mt-6">
          <div className="inline-flex items-center gap-2 text-xs text-gray-500 font-mono">
            <Landmark className="w-3.5 h-3.5 text-gray-500" />
            Backed by Norway&apos;s NOK 1.75B Quantum Initiative
          </div>
        </motion.div>

        {/* Subtle animated particles -- quantum blue + sustainability green */}
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
          {/* Green sustainability particles */}
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={`green-${i}`}
              className="absolute w-1.5 h-1.5 rounded-full bg-green-500/25"
              style={{
                left: `${25 + i * 18}%`,
                top: `${35 + (i % 2) * 30}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.15, 0.4, 0.15],
              }}
              transition={{
                duration: 4 + i * 0.7,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.5 + i * 0.6,
              }}
            />
          ))}
        </div>
      </div>
    </SlideWrapper>
  )
}
