'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Lock, Eye, EyeOff, Cpu, Zap, ChevronDown, CheckCircle, Loader2 } from 'lucide-react'

// ── Level metadata ────────────────────────────────────────────────────────────

interface LevelMeta {
  name: string
  description: string
  color: string
  bg: string
  border: string
  requiresQuantum: boolean
}

const LEVELS: Record<number, LevelMeta> = {
  1:  { name: 'Minimal Masking',                   description: 'Regex redaction of common PII patterns (SSN, email)',        color: 'text-emerald-400', bg: 'bg-emerald-500/10',  border: 'border-emerald-500/30', requiresQuantum: false },
  2:  { name: 'Partial Redaction',                 description: 'Exposes first/last character; masks the middle',             color: 'text-green-400',   bg: 'bg-green-500/10',    border: 'border-green-500/30',   requiresQuantum: false },
  3:  { name: 'Static Masking',                    description: 'All sensitive values replaced with [REDACTED]',              color: 'text-lime-400',    bg: 'bg-lime-500/10',     border: 'border-lime-500/30',    requiresQuantum: false },
  4:  { name: 'PQC Pseudonymization',              description: 'SHA-3 hashing seeded with Kyber-768 private key',            color: 'text-yellow-400',  bg: 'bg-yellow-500/10',   border: 'border-yellow-500/30',  requiresQuantum: false },
  5:  { name: 'Data Generalization',               description: 'Numeric values bucketed into statistical ranges',            color: 'text-amber-400',   bg: 'bg-amber-500/10',    border: 'border-amber-500/30',   requiresQuantum: false },
  6:  { name: 'Data Suppression',                  description: 'Entire columns dropped from the output',                    color: 'text-orange-400',  bg: 'bg-orange-500/10',   border: 'border-orange-500/30',  requiresQuantum: false },
  7:  { name: 'Quantum Jitter',                    description: 'QRNG Gaussian noise injected (5% std-dev)',                 color: 'text-violet-400',  bg: 'bg-violet-500/10',   border: 'border-violet-500/30',  requiresQuantum: true  },
  8:  { name: 'Quantum Differential Privacy',      description: 'ε-DP Laplace mechanism driven by QRNG entropy',             color: 'text-purple-400',  bg: 'bg-purple-500/10',   border: 'border-purple-500/30',  requiresQuantum: true  },
  9:  { name: 'Enhanced K-Anonymity',              description: 'QRNG-assisted quantile clustering for k-anonymity',         color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10',  border: 'border-fuchsia-500/30', requiresQuantum: true  },
  10: { name: 'Total Quantum Pseudoanonymization', description: 'One-time-pad mapping generated from live QRNG entropy',     color: 'text-quantum-400', bg: 'bg-quantum-500/10',  border: 'border-quantum-500/30', requiresQuantum: true  },
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AttachmentStatus {
  file: File
  level: number
  anonymized: boolean
  processing: boolean
  error: string | null
}

export interface Props {
  attachments: File[]
  onAnonymize: (fileIndex: number, level: number) => Promise<void>
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LevelSlider({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (v: number) => void
  disabled: boolean
}) {
  const meta = LEVELS[value]

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold font-mono ${meta.color}`}>
          L{value} — {meta.name}
        </span>
        {meta.requiresQuantum && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-quantum-500/10 border border-quantum-500/30 text-quantum-400">
            <Zap className="w-2.5 h-2.5" />
            Robindra tier
          </span>
        )}
      </div>

      <div className="relative">
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right,
              #10b981 0%,
              #84cc16 30%,
              #eab308 50%,
              #f97316 60%,
              #8b5cf6 70%,
              #a855f7 ${((value - 1) / 9) * 100}%,
              rgba(255,255,255,0.1) ${((value - 1) / 9) * 100}%)`,
          }}
        />
        <div className="flex justify-between mt-1">
          {[1, 5, 10].map((n) => (
            <span key={n} className="text-[9px] text-gray-600 font-mono">
              L{n}
            </span>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-gray-500 font-mono leading-relaxed">{meta.description}</p>
    </div>
  )
}

function AttachmentRow({
  status,
  index,
  onLevelChange,
  onAnonymize,
}: {
  status: AttachmentStatus
  index: number
  onLevelChange: (index: number, level: number) => void
  onAnonymize: (index: number) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const meta = LEVELS[status.level]
  const sizeMb = (status.file.size / 1024 / 1024).toFixed(2)

  return (
    <motion.div
      layout
      className={`rounded-xl border overflow-hidden transition-colors ${
        status.anonymized
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : `${meta.bg} ${meta.border}`
      }`}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="shrink-0">
          {status.anonymized ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : status.processing ? (
            <Loader2 className="w-4 h-4 text-quantum-400 animate-spin" />
          ) : (
            <Shield className={`w-4 h-4 ${meta.color}`} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-200 font-medium truncate">
              {status.file.name}
            </span>
            <span className="shrink-0 text-[10px] text-gray-500 font-mono">{sizeMb} MB</span>
          </div>
          {status.anonymized && (
            <span className="text-[10px] text-emerald-400 font-mono">
              Anonymized at L{status.level} — {LEVELS[status.level].name}
            </span>
          )}
          {status.error && (
            <span className="text-[10px] text-red-400 font-mono">{status.error}</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!status.anonymized && (
            <button
              onClick={() => onAnonymize(index)}
              disabled={status.processing}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                transition-all duration-200 border
                ${status.processing
                  ? 'bg-gray-800/50 border-gray-700 text-gray-500 cursor-not-allowed'
                  : `bg-gradient-to-r from-quantum-500/80 to-quantum-700/80 border-quantum-500/40 text-white hover:from-quantum-500 hover:to-quantum-700`
                }
              `}
            >
              <Lock className="w-3 h-3" />
              {status.processing ? 'Processing…' : 'Anonymize'}
            </button>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] transition-colors"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Expanded controls */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/[0.06] px-4 py-3"
          >
            <LevelSlider
              value={status.level}
              onChange={(v) => onLevelChange(index, v)}
              disabled={status.processing || status.anonymized}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AnonymizationPanel({ attachments, onAnonymize }: Props) {
  const [statuses, setStatuses] = useState<AttachmentStatus[]>(
    () => attachments.map((file) => ({
      file,
      level: 5,
      anonymized: false,
      processing: false,
      error: null,
    }))
  )

  // Keep statuses in sync when attachments prop changes
  const handleLevelChange = useCallback((index: number, level: number) => {
    setStatuses((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], level }
      return next
    })
  }, [])

  const handleAnonymize = useCallback(async (index: number) => {
    setStatuses((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], processing: true, error: null }
      return next
    })

    try {
      await onAnonymize(index, statuses[index].level)
      setStatuses((prev) => {
        const next = [...prev]
        next[index] = { ...next[index], processing: false, anonymized: true }
        return next
      })
    } catch (err) {
      setStatuses((prev) => {
        const next = [...prev]
        next[index] = {
          ...next[index],
          processing: false,
          error: err instanceof Error ? err.message : 'Anonymization failed',
        }
        return next
      })
    }
  }, [onAnonymize, statuses])

  const handleAnonymizeAll = useCallback(async () => {
    for (let i = 0; i < statuses.length; i++) {
      if (!statuses[i].anonymized) {
        await handleAnonymize(i)
      }
    }
  }, [statuses, handleAnonymize])

  const allDone = statuses.every((s) => s.anonymized)
  const anyProcessing = statuses.some((s) => s.processing)
  const doneCount = statuses.filter((s) => s.anonymized).length

  if (attachments.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-1"
    >
      {/* Section header */}
      <div className="flex items-center justify-between px-1 pb-1">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-quantum-400" />
          <span className="text-xs text-gray-400 uppercase tracking-wider font-mono">
            Attachment Anonymization
          </span>
          <span className="text-[10px] font-mono text-gray-600">
            {doneCount}/{statuses.length} processed
          </span>
        </div>

        {!allDone && statuses.length > 1 && (
          <button
            onClick={handleAnonymizeAll}
            disabled={anyProcessing}
            className="flex items-center gap-1.5 text-[10px] font-mono text-quantum-400 hover:text-quantum-300 transition-colors disabled:text-gray-600"
          >
            <Eye className="w-3 h-3" />
            Anonymize all
          </button>
        )}

        {allDone && (
          <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
            <CheckCircle className="w-3 h-3" />
            All secure
          </span>
        )}
      </div>

      {/* Attachment rows */}
      <div className="space-y-2">
        {statuses.map((status, i) => (
          <AttachmentRow
            key={`${status.file.name}-${i}`}
            status={status}
            index={i}
            onLevelChange={handleLevelChange}
            onAnonymize={handleAnonymize}
          />
        ))}
      </div>

      {/* Level legend */}
      <div className="flex items-center gap-3 pt-1 px-1 flex-wrap">
        {[
          { range: 'L1-L3', label: 'Masking', color: 'text-emerald-500' },
          { range: 'L4-L6', label: 'Hashing', color: 'text-yellow-500' },
          { range: 'L7-L10', label: 'Quantum', color: 'text-quantum-400' },
        ].map(({ range, label, color }) => (
          <span key={range} className="flex items-center gap-1 text-[9px] font-mono text-gray-600">
            <span className={`font-bold ${color}`}>{range}</span>
            {label}
          </span>
        ))}
      </div>
    </motion.div>
  )
}
