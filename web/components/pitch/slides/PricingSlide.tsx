'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { PRICING_TIERS } from '@/lib/pitch-data'
import { Check, Star, Sparkles } from 'lucide-react'

export default function PricingSlide() {
  return (
    <SlideWrapper>
      <div className="flex flex-col items-center justify-center min-h-full px-4 py-12">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold mb-3 text-center"
        >
          <span className="gradient-text">Pricing</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-gray-400 mb-8 text-center max-w-xl"
        >
          Early-adopter pricing available during beta. All plans include PQC encryption.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 w-full max-w-6xl">
          {PRICING_TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className={`relative rounded-xl border p-6 flex flex-col ${
                tier.highlighted
                  ? 'border-quantum-500 bg-quantum-500/10 shadow-lg shadow-quantum-500/20'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              {tier.earlyAdopter && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-medium">
                    <Sparkles className="w-3 h-3" />
                    Early Adopter
                  </span>
                </div>
              )}

              {tier.highlighted && (
                <div className="absolute -top-3 right-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-quantum-500/30 border border-quantum-400/50 text-quantum-300 text-xs font-medium">
                    <Star className="w-3 h-3" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-xl font-bold">{tier.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {tier.characterName} &middot; Levels {tier.levels}
                </p>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold">{tier.price}</span>
                {tier.earlyAdopter && tier.priceStandard !== tier.price && (
                  <span className="ml-2 text-sm text-gray-500 line-through">
                    {tier.priceStandard}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-400 mb-4">{tier.target}</p>

              <ul className="space-y-2 flex-1 mb-6">
                {tier.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  tier.highlighted
                    ? 'bg-quantum-600 hover:bg-quantum-500 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-gray-200'
                }`}
              >
                {tier.cta}
              </button>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex items-center gap-3 px-5 py-3 rounded-xl bg-amber-900/20 border border-amber-500/20"
        >
          <Star className="w-5 h-5 text-amber-400" />
          <p className="text-sm text-amber-200">
            <strong>Star us on GitHub</strong> to unlock Developer features (levels 1-5) for free!
          </p>
        </motion.div>
      </div>
    </SlideWrapper>
  )
}
