import type { Scenario } from '@/lib/pitch-data'

export const SCENARIO_COLORS: Record<Scenario | 'all', string> = {
  base: '#6366f1',       // quantum-500
  upside: '#22c55e',     // green-500
  conservative: '#3b82f6', // blue-500
  all: '#a855f7',        // purple-500 (used for combined views)
}

export const SCENARIO_FILL_COLORS: Record<Scenario, string> = {
  base: 'rgba(99, 102, 241, 0.15)',
  upside: 'rgba(34, 197, 94, 0.15)',
  conservative: 'rgba(59, 130, 246, 0.15)',
  all: 'rgba(168, 85, 247, 0.15)',
}

export const CHART_THEME = {
  background: 'transparent',
  text: '#9ca3af',       // gray-400
  grid: 'rgba(255, 255, 255, 0.06)',
  tooltip: {
    bg: 'rgba(17, 24, 39, 0.95)',
    border: 'rgba(255, 255, 255, 0.1)',
    text: '#f9fafb',
  },
}

export const CHART_ANIMATION_DURATION = 1200

export const REGION_COLORS: Record<string, string> = {
  norway: '#22c55e',     // green-500
  eu: '#6366f1',         // quantum-500
  us: '#a855f7',         // purple-500
  nato: '#3b82f6',       // blue-500
}

export const PRIORITY_COLORS: Record<string, string> = {
  immediate: '#22c55e',  // emerald
  year1: '#6366f1',      // quantum
  year2: '#6b7280',      // gray
}

export const PHASE_COLORS: Record<string, string> = {
  done: '#22c55e',
  progress: '#6366f1',
  planned: '#6b7280',
}
