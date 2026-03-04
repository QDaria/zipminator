'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { PRICING_TIERS } from '@/lib/pitch-data'
import type { Scenario } from '@/lib/pitch-data'
import { CreditCard, CheckCircle2, Star, Zap } from 'lucide-react'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
})

const REVENUE_STREAMS = [
  {
    name: 'QCaaS',
    full: 'Quantum Cryptography as a Service',
    detail: 'Subscription access to PQC-protected communications suite',
    icon: Zap,
  },
  {
    name: 'QCaaP',
    full: 'Quantum Cryptography as a Platform',
    detail: 'API/SDK licensing for developers building PQC into their products',
    icon: CreditCard,
  },
]

export default function BusinessModelSlide({ scenario: _scenario }: { scenario?: Scenario }) {
  return (
    <SlideWrapper>
      {/* Header */}
      <motion.div {...fadeUp()} className="text-center mb-10">
        <p className="text-quantum-400 font-mono text-sm tracking-widest uppercase mb-3">
          Business Model
        </p>
        <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-3">
          <span className="gradient-text">QCaaS + QCaaP</span> Dual Engine
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Two complementary revenue streams: consumer subscriptions and developer platform licensing
        </p>
      </motion.div>

      {/* Revenue Streams */}
      <motion.div {...fadeUp(0.05)} className="grid sm:grid-cols-2 gap-4 mb-10">
        {REVENUE_STREAMS.map((rs) => (
          <div key={rs.name} className="card-quantum border-t-2 border-quantum-500/30">
            <div className="flex items-center gap-3 mb-3">
              <rs.icon className="w-5 h-5 text-quantum-400" />
              <div>
                <span className="text-lg font-bold text-white font-mono">{rs.name}</span>
                <span className="text-xs text-gray-500 ml-2">{rs.full}</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">{rs.detail}</p>
          </div>
        ))}
      </motion.div>

      {/* Pricing Tiers */}
      <motion.div {...fadeUp(0.1)}>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-quantum-400" />
          Four-Tier Pricing
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRICING_TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + i * 0.06 }}
              className={`card-quantum relative flex flex-col ${
                tier.highlighted
                  ? 'border-quantum-500/40 ring-1 ring-quantum-500/20'
                  : ''
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-quantum-500 text-white text-[10px] font-bold uppercase tracking-wider">
                    <Star className="w-3 h-3" />
                    Popular
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-white mb-1">{tier.name}</h4>
                <p className="text-xs text-gray-500">{tier.target}</p>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold gradient-text font-mono">
                  {tier.price}
                </span>
                {tier.price !== '$0' && tier.price !== 'Custom' && !tier.price.includes('/mo') && (
                  <span className="text-xs text-gray-500 ml-1">/mo</span>
                )}
              </div>

              <ul className="space-y-2 flex-1">
                {tier.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-xs text-gray-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-quantum-500 mt-0.5 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Unit Economics */}
      <motion.div {...fadeUp(0.2)} className="grid sm:grid-cols-3 gap-4 mt-8">
        {[
          { label: 'Gross Margins', value: '70%+', detail: 'Software-native model' },
          { label: 'LTV:CAC Target', value: '3:1+', detail: 'Network effects drive organic growth' },
          { label: 'Payback Period', value: '<12 mo', detail: 'Annual contracts for Pro/Enterprise' },
        ].map((m) => (
          <div key={m.label} className="card-quantum text-center">
            <p className="text-2xl font-bold gradient-text font-mono">{m.value}</p>
            <p className="text-sm font-semibold text-white mt-1">{m.label}</p>
            <p className="text-xs text-gray-400 mt-1">{m.detail}</p>
          </div>
        ))}
      </motion.div>
    </SlideWrapper>
  )
}
