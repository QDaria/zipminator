'use client'

import { motion } from 'framer-motion'
import { Lock, Shield, ShieldOff } from 'lucide-react'
import { useState } from 'react'

export type EncryptionLevel = 'pqc' | 'tls' | 'none'

interface EncryptionBadgeProps {
  level: EncryptionLevel
  compact?: boolean
  showTooltip?: boolean
}

const CONFIG: Record<
  EncryptionLevel,
  {
    label: string
    detail: string
    bg: string
    text: string
    border: string
    glow: string
    icon: typeof Lock
  }
> = {
  pqc: {
    label: 'PQC',
    detail: 'ML-KEM-768 + X25519 hybrid encryption',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/20',
    icon: Shield,
  },
  tls: {
    label: 'TLS',
    detail: 'TLS 1.3 transport encryption',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    glow: 'shadow-blue-500/20',
    icon: Lock,
  },
  none: {
    label: 'None',
    detail: 'No end-to-end encryption',
    bg: 'bg-gray-500/10',
    text: 'text-gray-400',
    border: 'border-gray-500/30',
    glow: '',
    icon: ShieldOff,
  },
}

export default function EncryptionBadge({
  level,
  compact = false,
  showTooltip = true,
}: EncryptionBadgeProps) {
  const [hovered, setHovered] = useState(false)
  const cfg = CONFIG[level]
  const Icon = cfg.icon

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`
          inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1
          ${cfg.bg} ${cfg.text} ${cfg.border}
          ${level === 'pqc' ? `shadow-lg ${cfg.glow}` : ''}
          transition-all duration-200
        `}
      >
        {level === 'pqc' ? (
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Icon className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          </motion.div>
        ) : (
          <Icon className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        )}
        <span
          className={`font-mono font-semibold ${compact ? 'text-[10px]' : 'text-xs'}`}
        >
          {cfg.label}
        </span>
      </motion.div>

      {/* Tooltip */}
      {showTooltip && hovered && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-700 text-xs text-gray-300 whitespace-nowrap z-50 shadow-xl"
        >
          {cfg.detail}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 border-r border-b border-gray-700 rotate-45 -mt-1" />
        </motion.div>
      )}
    </div>
  )
}
