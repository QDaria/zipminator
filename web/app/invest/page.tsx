'use client'

import Link from 'next/link'

const decks = [
  {
    title: 'Zipminator · Investor Deck',
    description: '22-slide general investor presentation',
    href: '/invest/zipminator',
    badge: 'General',
    badgeColor: '#22D3EE',
  },
  {
    title: 'SpareBank 1 Markets · TMT Pitch',
    description: '12-slide quantum banking pitch for TMT analysts',
    href: '/invest/sparebank1',
    badge: 'Banking',
    badgeColor: '#F59E0B',
  },
  {
    title: 'IP Valuation Blueprint',
    description: 'Three-patent portfolio analysis, regulatory moat, and valuation framework',
    href: '/invest/blueprint',
    badge: 'IP Analysis',
    badgeColor: '#A78BFA',
  },
]

export default function InvestSelectorPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8 px-6 pt-16"
      style={{ background: '#020817' }}
    >
      <div className="text-center mb-4">
        <p
          className="text-xs font-mono tracking-widest uppercase mb-3"
          style={{ color: '#22D3EE', fontFamily: "'JetBrains Mono', monospace" }}
        >
          Investor Materials
        </p>
        <h1
          className="text-4xl lg:text-5xl font-semibold text-slate-50"
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          Choose a Deck
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {decks.map((deck) => (
          <Link
            key={deck.href}
            href={deck.href}
            className="group rounded-xl p-6 flex flex-col gap-3 transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: 'rgba(15,22,41,0.8)',
              border: `1px solid ${deck.badgeColor}25`,
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-mono px-2.5 py-1 rounded"
                style={{
                  color: deck.badgeColor,
                  background: `${deck.badgeColor}15`,
                  border: `1px solid ${deck.badgeColor}40`,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {deck.badge}
              </span>
              <span
                className="text-slate-600 text-lg transition-transform group-hover:translate-x-1"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                →
              </span>
            </div>
            <h2
              className="text-xl font-semibold text-slate-100"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              {deck.title}
            </h2>
            <p
              className="text-slate-400 text-sm"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {deck.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
