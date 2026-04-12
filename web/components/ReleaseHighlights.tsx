'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Rocket, Package, FileText, Wifi, ArrowRight, ExternalLink } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/constants'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
}

type Highlight = {
  date: string
  icon: typeof Rocket
  title: string
  body: string
  href: string
  external: boolean
  color: string
}

const highlights: Highlight[] = [
  {
    date: '2026-04-02',
    icon: Package,
    title: 'Python SDK v0.5.0 shipped',
    body: 'Now on PyPI. Nine extras (data, anonymisation, cli, quantum, jupyter, email, benchmark, dev, all). 429 tests passing.',
    href: SITE_CONFIG.links.pypi,
    external: true,
    color: 'text-blue-400',
  },
  {
    date: '2026-04-06',
    icon: Rocket,
    title: 'Flutter super-app on TestFlight',
    body: 'Build 43 (v0.5.0+43). Eleven feature screens across iOS, Android, macOS, Windows, Linux and Web.',
    href: '/blueprint#roadmap',
    external: false,
    color: 'text-green-400',
  },
  {
    date: '2026-04-08',
    icon: FileText,
    title: '50K-word IP valuation published',
    body: 'Comprehensive investor blueprint covering pillars, patents, comparables and market sizing.',
    href: '/blueprint',
    external: false,
    color: 'text-amber-400',
  },
  {
    date: '2026-03-20',
    icon: Wifi,
    title: 'Physical Cryptography Wave 1',
    body: 'Six new mesh modules: CSI entropy, PUEK, EM canary, vital-auth, topo-auth, spatiotemporal non-repudiation. 106 mesh tests.',
    href: '/blueprint#mesh',
    external: false,
    color: 'text-purple-400',
  },
]

export default function ReleaseHighlights() {
  return (
    <section className="container-custom py-20">
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <motion.h2
          variants={fadeUp}
          className="text-3xl md:text-5xl font-bold mb-3"
        >
          <span className="gradient-text">Latest milestones</span>
        </motion.h2>
        <motion.p
          variants={fadeUp}
          className="text-gray-400 text-lg mb-10"
        >
          April 2026 shipping cadence.
        </motion.p>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item) => {
            const Icon = item.icon
            const CardInner = (
              <>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-mono text-slate-500 rounded-full px-2 py-0.5 bg-white/5 border border-white/10">
                    {item.date}
                  </span>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <h3 className="text-base font-semibold text-slate-100 mb-2 group-hover:text-quantum-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-400 mb-4">
                  {item.body}
                </p>
                <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-quantum-400 opacity-80 group-hover:opacity-100 transition-opacity">
                  {item.external ? 'Open' : 'Read more'}
                  {item.external ? (
                    <ExternalLink className="w-3 h-3" />
                  ) : (
                    <ArrowRight className="w-3 h-3" />
                  )}
                </span>
              </>
            )

            return (
              <motion.div key={item.title} variants={fadeUp}>
                {item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-quantum group flex flex-col h-full"
                  >
                    {CardInner}
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className="card-quantum group flex flex-col h-full"
                  >
                    {CardInner}
                  </Link>
                )}
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </section>
  )
}
