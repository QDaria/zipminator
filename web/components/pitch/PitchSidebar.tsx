'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { Scenario } from '@/lib/pitch-data'
import {
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'

interface PitchSidebarProps {
  slides: string[]
  currentSlide: number
  onSlideSelect: (index: number) => void
  isOpen: boolean
  onToggle: () => void
  scenario: Scenario
  onScenarioChange: (scenario: Scenario) => void
}

const SCENARIO_CONFIG: Array<{
  key: Scenario
  label: string
  icon: typeof BarChart3
  color: string
}> = [
  { key: 'conservative', label: 'Conservative', icon: TrendingDown, color: 'text-blue-400' },
  { key: 'base', label: 'Base', icon: BarChart3, color: 'text-quantum-400' },
  { key: 'upside', label: 'Upside', icon: TrendingUp, color: 'text-green-400' },
]

export default function PitchSidebar({
  slides,
  currentSlide,
  onSlideSelect,
  isOpen,
  onToggle,
  scenario,
  onScenarioChange,
}: PitchSidebarProps) {
  const progress = ((currentSlide + 1) / slides.length) * 100

  return (
    <>
      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed md:relative z-50 h-full w-72 flex flex-col bg-gray-900/95 backdrop-blur-xl border-r border-white/10 shrink-0"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <div>
                <h2 className="text-sm font-semibold gradient-text">
                  Investor Deck
                </h2>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  QDaria / Zipminator-PQC
                </p>
              </div>
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close sidebar"
              >
                <ChevronLeft className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="px-4 py-3 border-b border-white/5">
              <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1.5">
                <span>Progress</span>
                <span>
                  {currentSlide + 1} of {slides.length}
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-quantum-500 to-quantum-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Slide list */}
            <nav className="flex-1 overflow-y-auto py-2 scrollbar-hide">
              {slides.map((title, index) => {
                const isActive = index === currentSlide
                const isPast = index < currentSlide

                return (
                  <button
                    key={index}
                    onClick={() => onSlideSelect(index)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-200 group ${
                      isActive
                        ? 'bg-quantum-600/20 border-r-2 border-quantum-400'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <span
                      className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-mono font-medium transition-colors ${
                        isActive
                          ? 'bg-quantum-500 text-white'
                          : isPast
                          ? 'bg-quantum-600/30 text-quantum-300'
                          : 'bg-gray-800 text-gray-500 group-hover:text-gray-400'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span
                      className={`text-sm truncate transition-colors ${
                        isActive
                          ? 'text-white font-medium'
                          : isPast
                          ? 'text-gray-400'
                          : 'text-gray-500 group-hover:text-gray-300'
                      }`}
                    >
                      {title}
                    </span>
                  </button>
                )
              })}
            </nav>

            {/* Scenario selector */}
            <div className="px-4 py-3 border-t border-white/10">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">
                Scenario
              </p>
              <div className="flex gap-1">
                {SCENARIO_CONFIG.map(({ key, label, icon: Icon, color }) => (
                  <button
                    key={key}
                    onClick={() => onScenarioChange(key)}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-[11px] font-medium transition-all ${
                      scenario === key
                        ? 'bg-white/10 border border-white/20 ' + color
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Keyboard hints */}
            <div className="px-4 py-2.5 border-t border-white/5">
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-600">
                <span>
                  <kbd className="px-1 py-0.5 rounded bg-gray-800 text-gray-500 font-mono">
                    &larr;&rarr;
                  </kbd>{' '}
                  Navigate
                </span>
                <span>
                  <kbd className="px-1 py-0.5 rounded bg-gray-800 text-gray-500 font-mono">
                    Esc
                  </kbd>{' '}
                  Toggle
                </span>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Collapsed toggle button (desktop) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="hidden md:flex fixed top-4 left-4 z-50 items-center justify-center w-9 h-9 rounded-lg bg-gray-900/80 backdrop-blur border border-white/10 hover:bg-white/10 transition-colors"
          aria-label="Open sidebar"
        >
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
      )}
    </>
  )
}
