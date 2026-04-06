'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { BlueprintSidebar } from '@/components/blueprint/BlueprintSidebar'
import { BlueprintSection } from '@/components/blueprint/BlueprintSection'
import { BlueprintScenarioToggle, type BpScenario } from '@/components/blueprint/BlueprintScenarioToggle'
import { SECTION_LIST } from '@/lib/blueprint-data'

import { SectionPatentStack } from '@/components/blueprint/sections/SectionPatentStack'
import { SectionRegulatoryMoat } from '@/components/blueprint/sections/SectionRegulatoryMoat'
import { SectionPatentDeepDives } from '@/components/blueprint/sections/SectionPatentDeepDives'
import { SectionNovelty } from '@/components/blueprint/sections/SectionNovelty'
import { SectionValuation } from '@/components/blueprint/sections/SectionValuation'
import { SectionComparables } from '@/components/blueprint/sections/SectionComparables'
import { SectionCompanyVal } from '@/components/blueprint/sections/SectionCompanyVal'
import { SectionUseCases } from '@/components/blueprint/sections/SectionUseCases'
import { SectionPillars } from '@/components/blueprint/sections/SectionPillars'
import { SectionCompetitors } from '@/components/blueprint/sections/SectionCompetitors'
import { SectionMarketSize } from '@/components/blueprint/sections/SectionMarketSize'
import { SectionFloorMatters } from '@/components/blueprint/sections/SectionFloorMatters'

const PASS = 'zip2026bp'
const STORAGE_KEY = 'blueprint-pitch-auth'

export default function BlueprintPage() {
  const [authed, setAuthed] = useState(false)
  const [input, setInput] = useState('')
  const [passError, setPassError] = useState(false)
  const [scenario, setScenario] = useState<BpScenario>('moderate')
  const [activeId, setActiveId] = useState(SECTION_LIST[0].id)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === '1') setAuthed(true)
  }, [])

  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        setActiveId(entry.target.id)
        break
      }
    }
  }, [])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    })

    SECTION_LIST.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observerRef.current?.observe(el)
    })

    return () => observerRef.current?.disconnect()
  }, [handleIntersect])

  const handlePassSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input === PASS) {
      sessionStorage.setItem(STORAGE_KEY, '1')
      setAuthed(true)
    } else {
      setPassError(true)
      setInput('')
    }
  }

  if (!authed) {
    return (
      <div
        className="flex items-center justify-center"
        style={{
          width: '100vw',
          height: '100vh',
          background: '#020817',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <form
          onSubmit={handlePassSubmit}
          className="flex flex-col items-center gap-5 p-10 rounded-2xl"
          style={{
            background: 'rgba(167,139,250,0.04)',
            border: '1px solid rgba(167,139,250,0.2)',
            boxShadow: '0 0 40px rgba(167,139,250,0.08)',
            minWidth: 340,
          }}
        >
          <div className="flex flex-col items-center gap-1">
            <span
              className="text-xs font-mono tracking-widest uppercase text-red-400"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              CONFIDENTIAL
            </span>
            <h1
              className="text-2xl font-semibold text-slate-100"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              IP Valuation Blueprint
            </h1>
            <p className="text-slate-400 text-sm">Enter password to access</p>
          </div>

          <input
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setPassError(false) }}
            autoFocus
            placeholder="Password"
            className="w-full px-4 py-3 rounded-lg text-sm text-slate-100 placeholder-slate-500 outline-none"
            style={{
              background: 'rgba(15,22,41,0.8)',
              border: passError
                ? '1.5px solid rgba(251,113,133,0.6)'
                : '1px solid rgba(167,139,250,0.2)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          />

          {passError && (
            <p
              className="text-rose-400 text-xs font-mono"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Wrong password. Try again.
            </p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: 'rgba(167,139,250,0.9)',
              color: '#020817',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Enter
          </button>

          <p className="text-slate-500 text-xs mt-2">
            Need access?{' '}
            <a href="mailto:mo@qdaria.com" className="text-violet-400 hover:underline">
              mo@qdaria.com
            </a>
          </p>
        </form>
      </div>
    )
  }

  return (
    <>
      <BlueprintSidebar
        sections={SECTION_LIST}
        activeId={activeId}
        scenario={scenario}
        onScenarioChange={setScenario}
      />

      <main className="lg:ml-60">
        {/* Hero */}
        <header className="relative px-6 pt-20 pb-16 lg:pt-28 lg:pb-24 max-w-6xl mx-auto text-center">
          <p
            className="text-xs font-mono tracking-[0.25em] uppercase mb-4"
            style={{ color: '#A78BFA', fontFamily: 'var(--font-jetbrains)' }}
          >
            QDaria AS · Confidential
          </p>
          <h1
            className="text-4xl lg:text-6xl font-bold text-slate-50 mb-6"
            style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
          >
            IP Valuation Blueprint
          </h1>
          <p
            className="text-lg text-slate-400 max-w-2xl mx-auto mb-8"
            style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            Three-patent PQC portfolio analysis: complementarity, regulatory moat,
            and pre-revenue valuation framework for the world's first quantum-certified
            encryption infrastructure.
          </p>

          {/* Mobile scenario toggle */}
          <div className="lg:hidden flex justify-center">
            <BlueprintScenarioToggle value={scenario} onChange={setScenario} />
          </div>

          {/* Hero stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-3xl mx-auto">
            {[
              { label: 'Patents', value: '3', sub: '1 filed, 2 drafted' },
              { label: 'Claims', value: '40', sub: 'code-verified' },
              { label: 'Regulations', value: '8', sub: 'compliance moat' },
              { label: 'Platforms', value: '6', sub: 'single codebase' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-2xl font-bold text-slate-50" style={{ fontFamily: 'var(--font-jetbrains)' }}>
                  {s.value}
                </p>
                <p className="text-xs text-slate-400 mt-1">{s.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </header>

        {/* Sections */}
        <BlueprintSection id="patent-stack" number={1} title="Three-Patent Stack">
          <SectionPatentStack />
        </BlueprintSection>

        <BlueprintSection id="regulatory-moat" number={2} title="Regulatory Moat">
          <SectionRegulatoryMoat />
        </BlueprintSection>

        <BlueprintSection id="patent-deep-dives" number={3} title="Patent Deep Dives">
          <SectionPatentDeepDives scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="novelty" number={4} title="Novelty Assessment">
          <SectionNovelty />
        </BlueprintSection>

        <BlueprintSection id="valuation" number={5} title="Valuation Analysis">
          <SectionValuation scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="comparables" number={6} title="Comparable Transactions">
          <SectionComparables />
        </BlueprintSection>

        <BlueprintSection id="company-valuation" number={7} title="Company Valuation">
          <SectionCompanyVal scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="use-cases" number={8} title="Use Cases">
          <SectionUseCases />
        </BlueprintSection>

        <BlueprintSection id="pillars" number={9} title="9 Pillars">
          <SectionPillars />
        </BlueprintSection>

        <BlueprintSection id="competitors" number={10} title="Competitor Analysis">
          <SectionCompetitors />
        </BlueprintSection>

        <BlueprintSection id="market-size" number={11} title="Market Size">
          <SectionMarketSize scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="floor-matters" number={12} title="Why the Floor Matters">
          <SectionFloorMatters />
        </BlueprintSection>

        {/* Footer */}
        <footer className="px-6 py-16 max-w-6xl mx-auto text-center border-t border-white/5">
          <p className="text-xs text-slate-500 font-mono">
            QDaria AS · Oslo, Norway · mo@qdaria.com · {new Date().getFullYear()}
          </p>
          <p className="text-[10px] text-slate-600 mt-2">
            This document is confidential and intended for authorized recipients only.
            Patent applications referenced herein are pending or filed at Patentstyret.
          </p>
        </footer>
      </main>
    </>
  )
}
