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
  AskSlide,           // 20
  ContactSlide,       // 21
]

export default function InvestPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [scenario, setScenario] = useState<Scenario>('all')

  const totalSlides = SLIDES.length

  const goToSlide = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalSlides) {
        setCurrentSlide(index)
      }
    },
    [totalSlides]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore keyboard nav if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          goToSlide(Math.min(currentSlide + 1, totalSlides - 1))
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          goToSlide(Math.max(currentSlide - 1, 0))
          break
        case 'PageDown':
          e.preventDefault()
          goToSlide(Math.min(currentSlide + 1, totalSlides - 1))
          break
        case 'PageUp':
          e.preventDefault()
          goToSlide(Math.max(currentSlide - 1, 0))
          break
        case 'Home':
          e.preventDefault()
          goToSlide(0)
          break
        case 'End':
          e.preventDefault()
          goToSlide(totalSlides - 1)
          break
        case 'Escape':
          e.preventDefault()
          setSidebarOpen((prev) => !prev)
          break
      }
    },
    [currentSlide, totalSlides, goToSlide]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const CurrentSlide = SLIDES[currentSlide]

  return (
    <div className="flex h-[calc(100vh-4rem)] mt-16">
      <PitchSidebar
        slides={SLIDE_TITLES}
        currentSlide={currentSlide}
        onSlideSelect={goToSlide}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        scenario={scenario}
        onScenarioChange={setScenario}
      />

      <main
        className="relative flex-1 h-full overflow-hidden"
      >
        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className={`fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-900/80 backdrop-blur border border-white/10 md:hidden ${
            sidebarOpen ? 'hidden' : ''
          }`}
          aria-label="Open navigation"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Slide navigation footer */}
        <div className="absolute bottom-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-3 bg-gray-950/80 backdrop-blur border-t border-white/5">
          <button
            onClick={() => goToSlide(currentSlide - 1)}
            disabled={currentSlide === 0}
            className="px-4 py-1.5 text-sm rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span className="text-sm text-gray-400 font-mono">
            {currentSlide + 1} / {totalSlides}
          </span>

          <button
            onClick={() => goToSlide(currentSlide + 1)}
            disabled={currentSlide === totalSlides - 1}
            className="px-4 py-1.5 text-sm rounded-lg bg-quantum-600 hover:bg-quantum-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>

        {/* Slide content */}
        <AnimatePresence mode="wait">
          <CurrentSlide key={currentSlide} scenario={scenario} />
        </AnimatePresence>
      </main>
    </div>
  )
}
