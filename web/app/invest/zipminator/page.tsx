'use client'

import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import PitchSidebar from '@/components/pitch/PitchSidebar'
import { SLIDE_TITLES, type Scenario } from '@/lib/pitch-data'

import TitleSlide from '@/components/pitch/slides/TitleSlide'
import CompanySlide from '@/components/pitch/slides/CompanySlide'
import ProblemSlide from '@/components/pitch/slides/ProblemSlide'
import WhyNowSlide from '@/components/pitch/slides/WhyNowSlide'
import SolutionSlide from '@/components/pitch/slides/SolutionSlide'
import ProductSlide from '@/components/pitch/slides/ProductSlide'
import DemoSlide from '@/components/pitch/slides/DemoSlide'
import TechnologySlide from '@/components/pitch/slides/TechnologySlide'
import UseCasesSlide from '@/components/pitch/slides/UseCasesSlide'
import MarketSlide from '@/components/pitch/slides/MarketSlide'
import CompetitiveSlide from '@/components/pitch/slides/CompetitiveSlide'
import TractionSlide from '@/components/pitch/slides/TractionSlide'
import BusinessModelSlide from '@/components/pitch/slides/BusinessModelSlide'
import TeamSlide from '@/components/pitch/slides/TeamSlide'
import RoadmapSlide from '@/components/pitch/slides/RoadmapSlide'
import FinancialsSlide from '@/components/pitch/slides/FinancialsSlide'
import FundingStrategySlide from '@/components/pitch/slides/FundingStrategySlide'
import RiskSlide from '@/components/pitch/slides/RiskSlide'
import AskSlide from '@/components/pitch/slides/AskSlide'
import PricingSlide from '@/components/pitch/slides/PricingSlide'
import ESGSlide from '@/components/pitch/slides/ESGSlide'
import ContactSlide from '@/components/pitch/slides/ContactSlide'

const SLIDES = [
  TitleSlide,         // 1
  CompanySlide,       // 2
  ProblemSlide,       // 3
  WhyNowSlide,        // 4
  SolutionSlide,      // 5
  ProductSlide,       // 6
  DemoSlide,          // 7
  TechnologySlide,    // 8
  UseCasesSlide,      // 9
  MarketSlide,        // 10
  CompetitiveSlide,   // 11
  TractionSlide,      // 12
  BusinessModelSlide, // 13
  TeamSlide,          // 14
  RoadmapSlide,       // 15
  FinancialsSlide,    // 16
  FundingStrategySlide, // 17
  RiskSlide,          // 18
  PricingSlide,       // 19
  ESGSlide,           // 20
  AskSlide,           // 21
  ContactSlide,       // 22
]

const PASS = 'zip2026inv'
const STORAGE_KEY = 'zipminator-pitch-auth'

export default function InvestPage() {
  const [authed, setAuthed] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [scenario, setScenario] = useState<Scenario>('all')

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === '1') setAuthed(true)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input === PASS) {
      sessionStorage.setItem(STORAGE_KEY, '1')
      setAuthed(true)
    } else {
      setError(true)
      setInput('')
    }
  }

  const goToSlide = useCallback(
    (index: number) => {
      if (index >= 0 && index < SLIDES.length) setCurrentSlide(index)
    },
    []
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        goToSlide(currentSlide + 1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToSlide(currentSlide - 1)
      } else if (e.key === 'Escape') {
        setSidebarOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentSlide, goToSlide])

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
          onSubmit={handleSubmit}
          className="flex flex-col items-center gap-5 p-10 rounded-2xl"
          style={{
            background: 'rgba(34,211,238,0.04)',
            border: '1px solid rgba(34,211,238,0.2)',
            boxShadow: '0 0 40px rgba(34,211,238,0.08)',
            minWidth: 340,
          }}
        >
          <div className="flex flex-col items-center gap-1">
            <span
              className="text-xs font-mono tracking-widest uppercase"
              style={{ color: '#22D3EE', fontFamily: "'JetBrains Mono', monospace" }}
            >
              INVESTOR MATERIALS
            </span>
            <h1
              className="text-2xl font-semibold text-slate-100"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Zipminator-PQC
            </h1>
            <p className="text-slate-400 text-sm">Enter password for access</p>
          </div>

          <input
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false) }}
            autoFocus
            placeholder="Password"
            className="w-full px-4 py-3 rounded-lg text-sm text-slate-100 placeholder-slate-500 outline-none"
            style={{
              background: 'rgba(15,22,41,0.8)',
              border: error
                ? '1.5px solid rgba(251,113,133,0.6)'
                : '1px solid rgba(34,211,238,0.2)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          />

          {error && (
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
              background: 'rgba(34,211,238,0.9)',
              color: '#020817',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Enter
          </button>
        </form>
      </div>
    )
  }

  const SlideComponent = SLIDES[currentSlide]

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <PitchSidebar
        slides={SLIDE_TITLES}
        currentSlide={currentSlide}
        onSlideSelect={goToSlide}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        scenario={scenario}
        onScenarioChange={setScenario}
      />

      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <SlideComponent key={currentSlide} scenario={scenario} />
        </AnimatePresence>
      </main>
    </div>
  )
}
