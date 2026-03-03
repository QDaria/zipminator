'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Clock, AlertTriangle } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'

export type SelfDestructMode = 'after_send' | 'after_read' | 'read_once'

interface SelfDestructTimerProps {
  expiresAt: number // Unix timestamp in ms
  mode: SelfDestructMode
  compact?: boolean
}

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return 'EXPIRED'
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

function getTimerColor(ms: number): string {
  if (ms <= 0) return 'text-red-500'
  if (ms < 3600_000) return 'text-red-400' // < 1 hour
  if (ms < 86400_000) return 'text-orange-400' // < 1 day
  if (ms < 604800_000) return 'text-yellow-400' // < 7 days
  return 'text-emerald-400'
}

function getBorderColor(ms: number): string {
  if (ms <= 0) return 'border-red-500/40'
  if (ms < 3600_000) return 'border-red-500/30'
  if (ms < 86400_000) return 'border-orange-500/30'
  if (ms < 604800_000) return 'border-yellow-500/30'
  return 'border-emerald-500/30'
}

function getBgColor(ms: number): string {
  if (ms <= 0) return 'bg-red-500/10'
  if (ms < 3600_000) return 'bg-red-500/10'
  if (ms < 86400_000) return 'bg-orange-500/10'
  if (ms < 604800_000) return 'bg-yellow-500/10'
  return 'bg-emerald-500/10'
}

const MODE_LABELS: Record<SelfDestructMode, string> = {
  after_send: 'After send',
  after_read: 'After read',
  read_once: 'Read once',
}

export default function SelfDestructTimer({
  expiresAt,
  mode,
  compact = false,
}: SelfDestructTimerProps) {
  const [now, setNow] = useState(Date.now())

  const tick = useCallback(() => setNow(Date.now()), [])

  useEffect(() => {
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [tick])

  const remaining = expiresAt - now
  const isExpired = remaining <= 0
  const isUrgent = remaining > 0 && remaining < 3600_000

  if (mode === 'read_once') {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`
          inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1
          bg-red-500/10 text-red-400 border-red-500/30
          ${compact ? 'text-[10px]' : 'text-xs'}
        `}
      >
        <AlertTriangle className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span className="font-mono font-semibold">Read Once</span>
      </motion.div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {isExpired ? (
        <motion.div
          key="expired"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0.5, 1, 0.5], scale: 1 }}
          transition={{ opacity: { duration: 2, repeat: Infinity }, scale: { duration: 0.3 } }}
          className={`
            inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1
            bg-red-500/10 text-red-500 border-red-500/40
            ${compact ? 'text-[10px]' : 'text-xs'}
          `}
        >
          <AlertTriangle className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          <span className="font-mono font-bold">EXPIRED</span>
        </motion.div>
      ) : (
        <motion.div
          key="countdown"
          className={`
            inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1
            ${getBgColor(remaining)} ${getTimerColor(remaining)} ${getBorderColor(remaining)}
            ${compact ? 'text-[10px]' : 'text-xs'}
          `}
        >
          {isUrgent ? (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Clock className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            </motion.div>
          ) : (
            <Clock className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          )}
          <span className="font-mono font-semibold tabular-nums">
            {formatTimeLeft(remaining)}
          </span>
          {!compact && (
            <span className="text-gray-500 font-sans">
              ({MODE_LABELS[mode]})
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
