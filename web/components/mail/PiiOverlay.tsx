'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, ShieldAlert, Eye } from 'lucide-react'

export type PiiSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

interface PiiPattern {
  id: string
  name: string
  regex: RegExp
  severity: PiiSeverity
}

export interface PiiMatch {
  patternId: string
  patternName: string
  severity: PiiSeverity
  text: string
  start: number
  end: number
}

const DEMO_PATTERNS: PiiPattern[] = [
  {
    id: 'us_ssn',
    name: 'US SSN',
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    severity: 'CRITICAL',
  },
  {
    id: 'credit_card',
    name: 'Credit Card',
    regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    severity: 'CRITICAL',
  },
  {
    id: 'api_key',
    name: 'API Key',
    regex: /\b(sk|pk|api)[_-][a-zA-Z0-9]{20,}\b/g,
    severity: 'CRITICAL',
  },
  {
    id: 'pem_key',
    name: 'PEM Private Key',
    regex: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g,
    severity: 'CRITICAL',
  },
  {
    id: 'phone',
    name: 'Phone Number',
    regex: /\b(\+\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
    severity: 'HIGH',
  },
  {
    id: 'email',
    name: 'Email Address',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    severity: 'MEDIUM',
  },
]

const SEVERITY_STYLES: Record<
  PiiSeverity,
  { bg: string; border: string; text: string; label: string }
> = {
  CRITICAL: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/40',
    text: 'text-red-400',
    label: 'CRITICAL',
  },
  HIGH: {
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/40',
    text: 'text-orange-400',
    label: 'HIGH',
  },
  MEDIUM: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/40',
    text: 'text-yellow-400',
    label: 'MEDIUM',
  },
  LOW: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/40',
    text: 'text-blue-400',
    label: 'LOW',
  },
}

export function scanForPii(text: string): PiiMatch[] {
  const matches: PiiMatch[] = []

  for (const pattern of DEMO_PATTERNS) {
    // Reset regex state for each scan
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags)
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        patternId: pattern.id,
        patternName: pattern.name,
        severity: pattern.severity,
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      })
    }
  }

  // Sort by position
  matches.sort((a, b) => a.start - b.start)
  return matches
}

interface PiiOverlayProps {
  text: string
  matches: PiiMatch[]
}

export function PiiHighlightedText({ text, matches }: PiiOverlayProps) {
  const [hoveredMatch, setHoveredMatch] = useState<PiiMatch | null>(null)

  if (matches.length === 0) {
    return <span>{text}</span>
  }

  const segments: React.ReactNode[] = []
  let lastIndex = 0

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]
    // Skip overlapping matches
    if (m.start < lastIndex) continue

    // Text before the match
    if (m.start > lastIndex) {
      segments.push(
        <span key={`text-${lastIndex}`}>{text.slice(lastIndex, m.start)}</span>
      )
    }

    const styles = SEVERITY_STYLES[m.severity]

    segments.push(
      <span
        key={`match-${i}`}
        className="relative inline-block"
        onMouseEnter={() => setHoveredMatch(m)}
        onMouseLeave={() => setHoveredMatch(null)}
      >
        <span
          className={`
            ${styles.bg} ${styles.text} underline decoration-wavy decoration-2
            px-0.5 rounded cursor-help transition-colors duration-200
            ${m.severity === 'CRITICAL' ? 'animate-pulse' : ''}
          `}
        >
          {m.text}
        </span>
        {/* Tooltip */}
        <AnimatePresence>
          {hoveredMatch === m && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute bottom-full left-0 mb-2 px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-xs whitespace-nowrap z-50 shadow-xl"
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`font-mono font-bold ${styles.text} text-[10px] px-1.5 py-0.5 rounded ${styles.bg} border ${styles.border}`}
                >
                  {styles.label}
                </span>
                <span className="text-gray-300 font-medium">
                  {m.patternName}
                </span>
              </div>
              <div className="text-gray-400">
                Consider redacting before sending
              </div>
              <div className="absolute top-full left-4 w-2 h-2 bg-gray-900 border-r border-b border-gray-700 rotate-45 -mt-1" />
            </motion.div>
          )}
        </AnimatePresence>
      </span>
    )

    lastIndex = m.end
  }

  // Remaining text
  if (lastIndex < text.length) {
    segments.push(
      <span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>
    )
  }

  return <>{segments}</>
}

interface PiiWarningBannerProps {
  matches: PiiMatch[]
  onRedact: () => void
  onSendAnyway: () => void
}

export function PiiWarningBanner({
  matches,
  onRedact,
  onSendAnyway,
}: PiiWarningBannerProps) {
  if (matches.length === 0) return null

  const bySeverity = matches.reduce(
    (acc, m) => {
      acc[m.severity] = (acc[m.severity] || 0) + 1
      return acc
    },
    {} as Record<PiiSeverity, number>
  )

  const hasCritical = (bySeverity.CRITICAL || 0) > 0

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`
        rounded-xl border p-4 mt-3
        ${hasCritical ? 'bg-red-500/5 border-red-500/30' : 'bg-yellow-500/5 border-yellow-500/30'}
      `}
    >
      <div className="flex items-start gap-3">
        {hasCritical ? (
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <h4
            className={`font-semibold text-sm ${hasCritical ? 'text-red-400' : 'text-yellow-400'}`}
          >
            PII Detected ({matches.length} pattern
            {matches.length !== 1 ? 's' : ''})
          </h4>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(bySeverity).map(([severity, count]) => {
              const s = SEVERITY_STYLES[severity as PiiSeverity]
              return (
                <span
                  key={severity}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${s.bg} ${s.text} border ${s.border}`}
                >
                  {severity}: {count}
                </span>
              )
            })}
          </div>
          <div className="mt-2 text-xs text-gray-400 space-y-1">
            {matches.slice(0, 4).map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <Eye className="w-3 h-3" />
                <span className="text-gray-300">{m.patternName}:</span>
                <code className="font-mono text-gray-500">
                  {m.text.slice(0, 4)}{'*'.repeat(Math.max(0, m.text.length - 4))}
                </code>
              </div>
            ))}
            {matches.length > 4 && (
              <div className="text-gray-500">
                +{matches.length - 4} more...
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-800">
        <button
          onClick={onRedact}
          className="btn-primary text-xs px-4 py-2 bg-gradient-to-r from-quantum-500 to-quantum-700"
        >
          Redact & Send
        </button>
        <button
          onClick={onSendAnyway}
          className={`
            text-xs px-4 py-2 rounded-xl border font-semibold transition-colors
            ${hasCritical
              ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
              : 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10'
            }
          `}
        >
          Send Anyway
        </button>
      </div>
    </motion.div>
  )
}
