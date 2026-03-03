'use client'

import { motion } from 'framer-motion'
import { Key, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

export type KeyVerificationState = 'verified' | 'unverified' | 'mismatch'

interface KeyVerificationProps {
  fingerprint: string // 64 hex chars (32 bytes)
  state: KeyVerificationState
  senderName?: string
  compact?: boolean
}

const STATE_CONFIG: Record<
  KeyVerificationState,
  {
    label: string
    icon: typeof CheckCircle
    text: string
    bg: string
    border: string
  }
> = {
  verified: {
    label: 'Verified',
    icon: CheckCircle,
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  unverified: {
    label: 'Unverified',
    icon: AlertTriangle,
    text: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
  },
  mismatch: {
    label: 'Key Mismatch',
    icon: XCircle,
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
  },
}

// Generate an emoji hash from a hex fingerprint for visual comparison
function fingerprintToEmoji(hex: string): string {
  const emojis = [
    '🔒','🛡️','⚡','🔑','🌀','💎','🔮','🧬',
    '🌐','🔥','❄️','🌊','🎯','🦋','🚀','🌟',
  ]
  const result: string[] = []
  for (let i = 0; i < 8; i++) {
    const byte = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
    result.push(emojis[byte % emojis.length])
  }
  return result.join('')
}

// Format fingerprint into groups of 4 hex chars
function formatFingerprint(hex: string): string[] {
  const groups: string[] = []
  const clean = hex.replace(/\s/g, '').toUpperCase()
  for (let i = 0; i < clean.length; i += 4) {
    groups.push(clean.slice(i, i + 4))
  }
  return groups
}

export default function KeyVerification({
  fingerprint,
  state,
  senderName,
  compact = false,
}: KeyVerificationProps) {
  const cfg = STATE_CONFIG[state]
  const Icon = cfg.icon
  const groups = formatFingerprint(fingerprint)
  const emojiHash = fingerprintToEmoji(fingerprint)

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 ${cfg.text}`}>
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">{cfg.label}</span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Key className={`w-4 h-4 ${cfg.text}`} />
          <h4 className="text-sm font-semibold text-gray-200">
            {senderName ? `${senderName}'s` : 'Sender'} Composite Key
          </h4>
        </div>
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}
        >
          <Icon className="w-3.5 h-3.5" />
          {cfg.label}
        </div>
      </div>

      {/* Fingerprint Grid */}
      <div className="bg-black/30 rounded-lg p-3 mb-3">
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 font-mono text-xs">
          {groups.map((group, i) => (
            <span
              key={i}
              className={`
                ${i % 2 === 0 ? 'text-quantum-400' : 'text-purple-400'}
                tracking-wider
              `}
            >
              {group}
            </span>
          ))}
        </div>
      </div>

      {/* Emoji Hash */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
            Visual Hash
          </div>
          <div className="text-lg tracking-wider">{emojiHash}</div>
        </div>
        {/* QR code placeholder */}
        <div className="w-16 h-16 rounded-lg border border-gray-700 bg-gray-800/50 flex items-center justify-center">
          <div className="text-[8px] text-gray-500 text-center leading-tight font-mono">
            QR
            <br />
            VERIFY
          </div>
        </div>
      </div>

      {state === 'mismatch' && (
        <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
          The sender's key does not match your stored fingerprint. This message
          may not be from the expected sender.
        </div>
      )}
    </motion.div>
  )
}
