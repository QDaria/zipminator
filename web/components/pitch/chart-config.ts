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

// ---------------------------------------------------------------------------
// Gradient definitions for AreaCharts / BarCharts
// ---------------------------------------------------------------------------
export const GRADIENT_DEFS = {
  quantum: { id: 'gradQuantum', color: '#6366f1', opacity: [0.4, 0.05] as [number, number] },
  green:   { id: 'gradGreen',   color: '#22c55e', opacity: [0.3, 0.05] as [number, number] },
  blue:    { id: 'gradBlue',    color: '#3b82f6', opacity: [0.3, 0.05] as [number, number] },
  amber:   { id: 'gradAmber',   color: '#f59e0b', opacity: [0.3, 0.05] as [number, number] },
  red:     { id: 'gradRed',     color: '#ef4444', opacity: [0.3, 0.05] as [number, number] },
  purple:  { id: 'gradPurple',  color: '#a855f7', opacity: [0.3, 0.05] as [number, number] },
  cyan:    { id: 'gradCyan',    color: '#06b6d4', opacity: [0.3, 0.05] as [number, number] },
  emerald: { id: 'gradEmerald', color: '#10b981', opacity: [0.3, 0.05] as [number, number] },
  pink:    { id: 'gradPink',    color: '#ec4899', opacity: [0.3, 0.05] as [number, number] },
}

// ---------------------------------------------------------------------------
// Standard tooltip styling for consistent look across all charts
// ---------------------------------------------------------------------------
export const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '12px',
    color: '#f9fafb',
    backdropFilter: 'blur(8px)',
    fontFamily: 'monospace',
  } as React.CSSProperties,
  labelStyle: { color: '#9ca3af', marginBottom: '4px', fontWeight: 600 } as React.CSSProperties,
  itemStyle: { color: '#f9fafb' } as React.CSSProperties,
}

// ---------------------------------------------------------------------------
// Standard axis tick styling
// ---------------------------------------------------------------------------
export const AXIS_STYLE = {
  tick: { fill: '#6b7280', fontSize: 11, fontFamily: 'monospace' } as Record<string, unknown>,
  axisLine: { stroke: 'rgba(255,255,255,0.06)' },
  tickLine: false as const,
}

// ---------------------------------------------------------------------------
// Module chart colors (consistent across BusinessModel, Financials, etc.)
// ---------------------------------------------------------------------------
export const MODULE_COLORS = [
  '#6366f1', '#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899',
  '#06b6d4', '#10b981',
]

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------
export function formatCurrency(value: number, suffix = 'M'): string {
  return `$${value}${suffix}`
}

export function formatPercent(value: number): string {
  return `${value}%`
}
