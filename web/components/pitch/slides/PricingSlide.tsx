'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { PRICING_TIERS } from '@/lib/pitch-data'
import { Check, Star, Sparkles } from 'lucide-react'

import { fadeUp } from '../slide-utils'

export default function PricingSlide() {
  return (
    <SlideWrapper>
      {/* Header */}
      <motion.div {...fadeUp()} className="text-center mb-6">
        <p className="text-xs font-mono uppercase tracking-widest text-quantum-400/80 mb-3">
          Plans &amp; Pricing
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
          <span className="gradient-text">Pricing</span>
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Early-adopter pricing available during beta. All plans include PQC encryption.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 w-full max-w-6xl mx-auto mb-6">
        {PRICING_TIERS.map((tier, i) => (
          <motion.div
            key={tier.name}
            {...fadeUp(0.05 + i * 0.06)}
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
              <h3 className="text-base font-semibold text-white">{tier.name}</h3>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-0.5">
                {tier.characterName} &middot; Levels {tier.levels}
              </p>
            </div>

            <div className="mb-4">
              <span className="text-2xl font-bold gradient-text font-mono">{tier.price}</span>
              {tier.earlyAdopter && tier.priceStandard !== tier.price && (
                <span className="ml-2 text-sm text-gray-500 line-through">
                  {tier.priceStandard}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-400 leading-relaxed mb-4">{tier.target}</p>

            <ul className="space-y-2 flex-1 mb-6">
              {tier.features.map((feature, j) => (
                <li key={j} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-400 leading-relaxed">{feature}</span>
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
        {...fadeUp(0.35)}
        className="flex items-center gap-3 px-5 py-3 rounded-xl bg-amber-900/20 border border-amber-500/20"
      >
        <Star className="w-5 h-5 text-amber-400" />
        <p className="text-sm text-gray-400 leading-relaxed">
          <strong className="text-amber-200">Star us on GitHub</strong> to unlock Developer features (levels 1-5) for free!
        </p>
      </motion.div>
    </SlideWrapper>
  )
}
