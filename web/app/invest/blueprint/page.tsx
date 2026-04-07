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
import { SectionIPScoring } from '@/components/blueprint/sections/SectionIPScoring'
import { SectionValuation } from '@/components/blueprint/sections/SectionValuation'
import { SectionComparables } from '@/components/blueprint/sections/SectionComparables'
import { SectionCompanyVal } from '@/components/blueprint/sections/SectionCompanyVal'
import { SectionUseCases } from '@/components/blueprint/sections/SectionUseCases'
import { SectionPillars } from '@/components/blueprint/sections/SectionPillars'
import { SectionCompetitors } from '@/components/blueprint/sections/SectionCompetitors'
import { SectionMarketSize } from '@/components/blueprint/sections/SectionMarketSize'
import { SectionAddressableUniverse } from '@/components/blueprint/sections/SectionAddressableUniverse'
import { SectionResearch } from '@/components/blueprint/sections/SectionResearch'
import { SectionRoadmap } from '@/components/blueprint/sections/SectionRoadmap'
import { SectionFloorMatters } from '@/components/blueprint/sections/SectionFloorMatters'
import { SectionComprehensiveStatus } from '@/components/blueprint/sections/SectionComprehensiveStatus'

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
        <header className="relative px-6 pt-20 pb-16 lg:pt-28 lg:pb-24 max-w-6xl mx-auto text-center overflow-hidden">
          {/* Animated gradient background */}
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34,211,238,0.15), transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(167,139,250,0.1), transparent 60%)',
            }}
          />

          <p
            className="relative text-xs font-mono tracking-[0.25em] uppercase mb-4"
            style={{ color: '#A78BFA', fontFamily: 'var(--font-jetbrains)' }}
          >
            QDaria AS · Confidential · April 2026
          </p>
          <h1
            className="relative text-4xl lg:text-6xl font-bold text-slate-50 mb-6"
            style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
          >
            IP Valuation Blueprint
          </h1>
          <p
            className="text-lg text-slate-400 max-w-2xl mx-auto mb-4"
            style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            Three-patent PQC portfolio analysis: complementarity, regulatory moat,
            and pre-revenue valuation framework for the world&apos;s first quantum-certified
            encryption infrastructure.
          </p>
          <p
            className="text-sm text-slate-500 max-w-xl mx-auto mb-8"
            style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            46 claims. 1,584 tests. 6.8 MB real quantum entropy from IBM Quantum (156 qubits).
            Zero blocking prior art across 48 exhaustive patent searches.
          </p>

          {/* Mobile scenario toggle */}
          <div className="lg:hidden flex justify-center">
            <BlueprintScenarioToggle value={scenario} onChange={setScenario} />
          </div>

          {/* Hero stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
            {[
              { label: 'Patents Filed', value: '3', sub: 'All at Patentstyret', accent: '#22D3EE' },
              { label: 'Total Claims', value: '46', sub: '9 independent, 37 dependent', accent: '#F59E0B' },
              { label: 'Regulations', value: '8', sub: 'GDPR, DORA, NIS2, CNSA 2.0...', accent: '#34D399' },
              { label: 'Platforms', value: '6', sub: 'macOS, Win, Linux, iOS, Android, Web', accent: '#A78BFA' },
              { label: 'Tests Passing', value: '1,584', sub: 'Rust + Python + Flutter + Browser', accent: '#FB7185' },
              { label: 'Prior Art', value: '0', sub: '48 searches, zero results', accent: '#ef4444' },
              { label: 'ePrint Papers', value: '3', sub: 'CCS 2026 + PoPETs 2027', accent: '#6366f1' },
              { label: 'Portfolio Value', value: '$10B+', sub: 'Conservative floor', accent: '#f97316' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-5 transition-all duration-300 hover:scale-[1.03]"
                style={{
                  background: `linear-gradient(135deg, ${s.accent}12, rgba(15,23,42,0.8))`,
                  border: `1px solid ${s.accent}40`,
                  boxShadow: `0 0 24px ${s.accent}18, 0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)`,
                  backdropFilter: 'blur(12px)',
                }}
              >
                <p
                  className="text-3xl font-bold text-slate-50 mb-1"
                  style={{ fontFamily: 'var(--font-jetbrains)', textShadow: `0 0 20px ${s.accent}40` }}
                >
                  {s.value}
                </p>
                <p className="text-xs font-medium text-slate-300 mt-1">{s.label}</p>
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

        <BlueprintSection id="ip-scoring" number={5} title="IP Portfolio Scoring">
          <SectionIPScoring />
        </BlueprintSection>

        <BlueprintSection id="valuation" number={6} title="Valuation Analysis">
          <SectionValuation scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="comparables" number={7} title="Comparable Transactions">
          <SectionComparables />
        </BlueprintSection>

        <BlueprintSection id="company-valuation" number={8} title="Company Valuation">
          <SectionCompanyVal scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="use-cases" number={9} title="Use Cases">
          <SectionUseCases />
        </BlueprintSection>

        <BlueprintSection id="pillars" number={10} title="9 Pillars">
          <SectionPillars />
        </BlueprintSection>

        <BlueprintSection id="competitors" number={11} title="Competitor Analysis">
          <SectionCompetitors />
        </BlueprintSection>

        <BlueprintSection id="market-size" number={12} title="Market Size">
          <SectionMarketSize scenario={scenario} />
        </BlueprintSection>

        <BlueprintSection id="addressable-universe" number={13} title="Addressable Universe">
          <SectionAddressableUniverse />
        </BlueprintSection>

        <BlueprintSection id="research" number={14} title="Research & Publications">
          <SectionResearch />
        </BlueprintSection>

        <BlueprintSection id="roadmap" number={15} title="Roadmap">
          <SectionRoadmap />
        </BlueprintSection>

        <BlueprintSection id="floor-matters" number={16} title="Why the Floor Matters">
          <SectionFloorMatters />
        </BlueprintSection>

        <BlueprintSection id="comprehensive-status" number={17} title="Comprehensive Platform Status">
          <SectionComprehensiveStatus />
        </BlueprintSection>

        {/* Footer */}
        <footer className="px-6 py-16 max-w-6xl mx-auto text-center border-t border-white/5">
          <p className="text-xs text-slate-500 font-mono">
            QDaria AS · Oslo, Norway · mo@qdaria.com · 2026
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
