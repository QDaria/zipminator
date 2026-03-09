'use client'

import { motion } from 'framer-motion'
import { ResponsiveContainer } from 'recharts'
import { chartEntrance } from './slide-utils'

interface ChartCardProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  height?: number
  delay?: number
  className?: string
  legend?: React.ReactNode
  children: React.ReactNode
}

/**
 * Reusable chart wrapper with consistent styling:
 * - Framer Motion entrance animation (fadeUp + scale)
 * - card-quantum background with glassmorphism
 * - Title + subtitle header
 * - ResponsiveContainer wrapper
 * - Optional legend slot
 */
export default function ChartCard({
  title,
  subtitle,
  icon,
  height = 280,
  delay = 0,
  className = '',
  legend,
  children,
}: ChartCardProps) {
  return (
    <motion.div
      {...chartEntrance(delay)}
      className={`card-quantum chart-glow ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {subtitle && (
              <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      {legend && <div className="mt-3">{legend}</div>}
    </motion.div>
  )
}
