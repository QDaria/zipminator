'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import type { Scenario } from '@/lib/pitch-data'
import {
  Clock,
  FileText,
  Skull,
  Atom,
  Landmark,
  ShieldAlert,
  Lock,
  AlertTriangle,
  TrendingUp,
  Building2,
  Users,
  DollarSign,
  Scale,
  Leaf,
  Globe,
} from 'lucide-react'

import { fadeUp } from '../slide-utils'

type TimelineEvent = {
  year: string
  label: string
  detail: string
  Icon: typeof Clock
  type: 'standard' | 'threat' | 'opportunity'
}

const TIMELINE: TimelineEvent[] = [
  {
    year: '2024',
    label: 'NIST publishes FIPS 203/204/205',
    detail: 'The official post-quantum cryptography standards are finalized after 8 years of evaluation.',
    Icon: FileText,
    type: 'standard',
  },
  {
    year: '2025',
    label: 'Salt Typhoon hits 200+ companies',
    detail: 'State-sponsored campaign compromises telecom and enterprise networks across 80 countries.',
    Icon: Skull,
    type: 'threat',
  },
  {
    year: '2025',
    label: 'Qubit requirements drop 95%',
    detail: 'Breaking RSA-2048 now estimated at <1M physical qubits, down from 20M. The timeline just accelerated.',
    Icon: Atom,
    type: 'threat',
  },
  {
    year: '2026',
    label: 'Norwegian Quantum Initiative',
    detail: 'NOK 1.75B ($175M) government program launches to build Norway\'s quantum industry.',
    Icon: Landmark,
    type: 'opportunity',
  },
  {
    year: '2027',
    label: 'NSA CNSA 2.0 deadline',
    detail: 'All new national security equipment must use post-quantum cryptography. No exceptions.',
    Icon: ShieldAlert,
    type: 'standard',
  },
  {
    year: '2029-30',
    label: 'Quantum cryptanalysis capability',
    detail: 'Multiple forecasts converge: fault-tolerant quantum computers capable of breaking RSA/ECC.',
    Icon: AlertTriangle,
    type: 'threat',
  },
  {
    year: '2035',
    label: 'Full NSA PQC mandate',
    detail: 'Complete transition to post-quantum cryptography across all US national security systems.',
    Icon: Lock,
    type: 'standard',
  },
]

const TYPE_STYLES: Record<TimelineEvent['type'], {
  dot: string
  border: string
  yearBg: string
  yearText: string
}> = {
  standard: {
    dot: 'bg-quantum-400',
    border: 'border-quantum-500/30',
    yearBg: 'bg-quantum-500/15',
    yearText: 'text-quantum-300',
  },
  threat: {
    dot: 'bg-red-400',
    border: 'border-red-500/30',
    yearBg: 'bg-red-500/15',
    yearText: 'text-red-300',
  },
  opportunity: {
    dot: 'bg-emerald-400',
    border: 'border-emerald-500/30',
    yearBg: 'bg-emerald-500/15',
    yearText: 'text-emerald-300',
  },
}

const REGULATORY_DEADLINES = [
  { date: 'Dec 2026', mandate: 'EU PQC Mandate', detail: 'European Cyber Resilience Act requires PQC readiness' },
  { date: 'Jan 2027', mandate: 'US CNSA 2.0', detail: 'All new NSS equipment must be CNSA 2.0-compliant' },
  { date: '2035', mandate: 'Full Migration', detail: 'Complete PQC transition across all US national security systems' },
]

const BOTTOM_STATS = [
  { Icon: Building2, value: '40+', label: 'Countries with PQC mandates', color: 'text-quantum-400' },
  { Icon: Users, value: '67%', label: 'Enterprises unaware of PQC', color: 'text-quantum-400' },
  { Icon: DollarSign, value: '$2.8-4.6B', label: 'PQC market by 2030', color: 'text-emerald-400', isGreen: true },
]

export default function WhyNowSlide({ scenario: _scenario }: { scenario?: Scenario }) {
  return (
    <SlideWrapper>
      {/* Section header */}
      <motion.div {...fadeUp(0.1)} className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Clock className="w-5 h-5 text-quantum-400" />
          <span className="text-xs font-mono uppercase tracking-widest text-quantum-400/80">
            Slide 4 / 20
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
          Why{' '}
          <span className="gradient-text">Now?</span>
        </h2>
        <p className="text-gray-400 max-w-2xl text-lg">
          Multiple converging deadlines are creating a narrow window of opportunity.
          The quantum threat is no longer theoretical.
        </p>
      </motion.div>

      {/* Timeline */}
      <div className="relative mb-8">
        {/* Vertical connector line */}
        <div className="absolute left-[23px] top-4 bottom-4 w-px bg-gradient-to-b from-quantum-500/40 via-red-500/30 to-emerald-500/40" />

        <div className="space-y-3">
          {TIMELINE.map((event, i) => {
            const styles = TYPE_STYLES[event.type]
            return (
              <motion.div
                key={`${event.year}-${event.label}`}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className={`relative flex items-start gap-4 pl-12 pr-4 py-3 rounded-xl bg-white/[0.02] border ${styles.border}`}
              >
                {/* Timeline dot */}
                <div className="absolute left-[17px] top-[18px] w-3 h-3 rounded-full border-2 border-gray-900 z-10">
                  <div className={`w-full h-full rounded-full ${styles.dot}`} />
                </div>

                {/* Year badge */}
                <span
                  className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded ${styles.yearBg} ${styles.yearText} shrink-0 mt-0.5`}
                >
                  {event.year}
                </span>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <event.Icon className={`w-3.5 h-3.5 ${styles.yearText} shrink-0`} />
                    <p className="text-sm font-semibold text-white truncate">{event.label}</p>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{event.detail}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Regulatory Tsunami callout */}
      <motion.div
        {...fadeUp(0.7)}
        className="mb-6 px-5 py-4 rounded-xl bg-orange-500/[0.05] border border-orange-500/20"
      >
        <div className="flex items-center gap-2 mb-3">
          <Scale className="w-4 h-4 text-orange-400" />
          <p className="text-white font-semibold text-sm">Regulatory Tsunami</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {REGULATORY_DEADLINES.map((reg, i) => (
            <motion.div
              key={reg.mandate}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 + i * 0.06 }}
              className="text-center"
            >
              <p className="text-sm font-mono font-bold text-orange-400">{reg.date}</p>
              <p className="text-[11px] font-semibold text-white/90 mt-0.5">{reg.mandate}</p>
              <p className="text-[9px] text-gray-500 mt-0.5 leading-tight">{reg.detail}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Positive momentum: TLS hybrid PQC */}
      <motion.div
        {...fadeUp(0.8)}
        className="mb-6 flex items-start gap-3 px-5 py-3 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/20"
      >
        <Globe className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-white font-semibold text-sm">
            <span className="text-emerald-400 font-mono">60%</span> of TLS traffic already using hybrid PQC
          </p>
          <p className="text-gray-400 text-xs">
            The migration is underway. Cloudflare reports majority of web traffic now uses post-quantum key exchange.
            <span className="text-gray-600 font-mono text-[10px] ml-1">Source: Cloudflare 2025</span>
          </p>
        </div>
      </motion.div>

      {/* Harvest Now, Decrypt Later box */}
      <motion.div
        {...fadeUp(0.85)}
        className="mb-6 px-5 py-4 rounded-xl bg-red-500/[0.06] border border-red-500/20"
      >
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-semibold text-sm mb-1">
              &ldquo;Harvest Now, Decrypt Later&rdquo;
            </p>
            <p className="text-gray-400 text-xs leading-relaxed">
              Adversaries are intercepting encrypted data TODAY and storing it for future
              quantum decryption. Any data with a confidentiality requirement beyond 5-10
              years is ALREADY at risk. Financial records, medical data, state secrets,
              intellectual property &mdash; all being collected now for decryption later.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Bottom stats with green opportunity card */}
      <motion.div
        {...fadeUp(0.9)}
        className="grid grid-cols-3 gap-3"
      >
        {BOTTOM_STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.95 + i * 0.08 }}
            className={`card-quantum text-center py-4 ${stat.isGreen ? 'border-emerald-500/25 bg-emerald-500/[0.04]' : ''}`}
          >
            <stat.Icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
            <p className={`text-2xl font-bold font-mono ${stat.isGreen ? 'text-emerald-400' : 'gradient-text'}`}>
              {stat.value}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </SlideWrapper>
  )
}
