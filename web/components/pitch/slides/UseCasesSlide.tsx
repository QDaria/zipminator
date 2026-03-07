'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import type { Scenario } from '@/lib/pitch-data'
import {
  Shield,
  Heart,
  Landmark,
  Zap,
  Scale,
  Server,
  GraduationCap,
  Target,
  Globe,
  CheckCircle2,
} from 'lucide-react'

interface IndustryCard {
  name: string
  icon: typeof Shield
  description: string
  badges: string[]
  accentColor: string
  accentBg: string
  accentBorder: string
  badgeBg: string
  badgeText: string
}

const INDUSTRIES: IndustryCard[] = [
  {
    name: 'Government & Defense',
    icon: Shield,
    description: 'Protect classified communications from harvest-now-decrypt-later attacks',
    badges: ['CNSA 2.0', 'FedRAMP', 'NATO DIANA'],
    accentColor: 'text-blue-400',
    accentBg: 'bg-blue-500/15',
    accentBorder: 'border-blue-500/25',
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-400',
  },
  {
    name: 'Healthcare',
    icon: Heart,
    description: 'Patient records with 50+ year confidentiality. PQC ensures they stay private.',
    badges: ['HIPAA', 'GDPR', 'NorHealthData'],
    accentColor: 'text-red-400',
    accentBg: 'bg-red-500/15',
    accentBorder: 'border-red-500/25',
    badgeBg: 'bg-red-500/10',
    badgeText: 'text-red-400',
  },
  {
    name: 'Finance & Banking',
    icon: Landmark,
    description: 'Transaction data, trading algorithms, and client records quantum-proofed',
    badges: ['PCI-DSS', 'SOX', 'SWIFT PQC'],
    accentColor: 'text-green-400',
    accentBg: 'bg-green-500/15',
    accentBorder: 'border-green-500/25',
    badgeBg: 'bg-green-500/10',
    badgeText: 'text-green-400',
  },
  {
    name: 'Critical Infrastructure',
    icon: Zap,
    description: 'Power grids, water systems, telecom. SS7 attacks stop here.',
    badges: ['DHS Advisory', 'NERC CIP', 'ICS-CERT'],
    accentColor: 'text-orange-400',
    accentBg: 'bg-orange-500/15',
    accentBorder: 'border-orange-500/25',
    badgeBg: 'bg-orange-500/10',
    badgeText: 'text-orange-400',
  },
  {
    name: 'Legal & IP',
    icon: Scale,
    description: 'Attorney-client privilege and trade secrets protected for decades',
    badges: ['ABA Ethics', 'Trade Secret Act', '2050+ Safe'],
    accentColor: 'text-purple-400',
    accentBg: 'bg-purple-500/15',
    accentBorder: 'border-purple-500/25',
    badgeBg: 'bg-purple-500/10',
    badgeText: 'text-purple-400',
  },
  {
    name: 'Enterprise Tech',
    icon: Server,
    description: 'API security, code signing, and DevOps secrets with PQC',
    badges: ['SOC 2', 'ISO 27001', '3-Line SDK'],
    accentColor: 'text-cyan-400',
    accentBg: 'bg-cyan-500/15',
    accentBorder: 'border-cyan-500/25',
    badgeBg: 'bg-cyan-500/10',
    badgeText: 'text-cyan-400',
  },
  {
    name: 'Education & Research',
    icon: GraduationCap,
    description: 'Universities, research institutions, and student data protected for the long term',
    badges: ['FERPA', 'GDPR', 'HECVAT'],
    accentColor: 'text-indigo-400',
    accentBg: 'bg-indigo-500/15',
    accentBorder: 'border-indigo-500/25',
    badgeBg: 'bg-indigo-500/10',
    badgeText: 'text-indigo-400',
  },
]

export default function UseCasesSlide({ scenario: _scenario }: { scenario?: Scenario }) {
  return (
    <SlideWrapper>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-3">
          <Target className="w-5 h-5 text-quantum-400" />
          <span className="text-xs font-mono uppercase tracking-widest text-quantum-400/80">
            Slide 9 / 20
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
          Who{' '}
          <span className="gradient-text">Needs</span>{' '}
          Zipminator
        </h2>
        <p className="text-gray-400 max-w-2xl text-lg">
          Any organization where data stolen today could be decrypted tomorrow.
          That means everyone handling sensitive information.
        </p>
      </motion.div>

      {/* Social Impact header callout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="mb-6 flex flex-wrap items-center justify-between gap-4 px-5 py-3 rounded-xl bg-white/[0.03] border border-white/10"
      >
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-quantum-400 shrink-0" />
          <p className="text-sm font-semibold text-white">
            Protecting the data society depends on
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <span className="text-xs font-mono text-green-400">
            12+ compliance frameworks supported
          </span>
        </div>
      </motion.div>

      {/* Industry grid: responsive with 7 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {INDUSTRIES.map((industry, i) => {
          const Icon = industry.icon
          return (
            <motion.div
              key={industry.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}
              whileHover={{ scale: 1.02 }}
              className="card-quantum group hover:border-white/15 transition-all"
            >
              {/* Icon + Title */}
              <div className="flex items-start gap-3 mb-3">
                <div className={`shrink-0 w-10 h-10 rounded-xl ${industry.accentBg} border ${industry.accentBorder} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${industry.accentColor}`} />
                </div>
                <h3 className="text-base font-semibold text-white font-display pt-1.5">
                  {industry.name}
                </h3>
              </div>

              {/* Description */}
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                {industry.description}
              </p>

              {/* Compliance badges */}
              <div className="flex flex-wrap gap-1.5">
                {industry.badges.map((badge) => (
                  <span
                    key={badge}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${industry.badgeBg} ${industry.badgeText} border ${industry.accentBorder}`}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Bottom callout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-6 flex items-center gap-3 px-5 py-3 rounded-xl bg-quantum-500/[0.06] border border-quantum-500/15"
      >
        <Shield className="w-5 h-5 text-quantum-400 shrink-0" />
        <p className="text-sm text-gray-300">
          <span className="text-quantum-400 font-semibold">7.8B people. $3.2T in assets.</span>{' '}
          One platform to protect them all. Per NSA CNSA 2.0 mandate timelines, migration must begin now.
        </p>
      </motion.div>
    </SlideWrapper>
  )
}
