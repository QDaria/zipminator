'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Lock,
  Unlock,
  Clock,
  Shield,
  ChevronDown,
  Eye,
  AlertTriangle,
  Key,
  Paperclip,
  X,
} from 'lucide-react'
import { scanForPii, PiiHighlightedText, PiiWarningBanner } from '@/components/mail/PiiOverlay'
import EncryptionBadge from '@/components/mail/EncryptionBadge'
import AnonymizationPanel from '@/components/mail/AnonymizationPanel'
import type { SelfDestructMode } from '@/components/mail/SelfDestructTimer'

// ── Types ────────────────────────────────────────────────────────────────────

interface SelfDestructOption {
  label: string
  value: string
  mode: SelfDestructMode | null
  durationMs: number | null
}

const SELF_DESTRUCT_OPTIONS: SelfDestructOption[] = [
  { label: 'No self-destruct', value: 'none', mode: null, durationMs: null },
  { label: 'After 1 hour', value: '1h', mode: 'after_send', durationMs: 3600_000 },
  { label: 'After 24 hours', value: '24h', mode: 'after_send', durationMs: 86400_000 },
  { label: 'After 7 days', value: '7d', mode: 'after_send', durationMs: 604800_000 },
  { label: 'Read once', value: 'read_once', mode: 'read_once', durationMs: null },
]

const DEMO_RECIPIENT_KEY = 'a3f8 c912 d4e7 b6a1 0f2c 8d5e 7b9a 4c3f'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3600_000)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`
  return `${hours} hour${hours > 1 ? 's' : ''}`
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ComposePage() {
  const [to, setTo] = useState('')
  const [cc, setCc] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [pqcEnabled, setPqcEnabled] = useState(true)
  const [selfDestructValue, setSelfDestructValue] = useState('none')
  const [showDestructDropdown, setShowDestructDropdown] = useState(false)
  const [showPiiPreview, setShowPiiPreview] = useState(false)
  const [sent, setSent] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedDestruct = SELF_DESTRUCT_OPTIONS.find(
    (o) => o.value === selfDestructValue
  )!

  const piiMatches = useMemo(() => scanForPii(body), [body])

  const recipientHasKey = useMemo(() => {
    // Simulated lookup: keys found for qdaria.com addresses
    return to.includes('@') && to.includes('qdaria')
  }, [to])

  const handleRedact = useCallback(() => {
    let redacted = body
    for (const match of [...piiMatches].reverse()) {
      const replacement = '[REDACTED]'
      redacted =
        redacted.slice(0, match.start) +
        replacement +
        redacted.slice(match.end)
    }
    setBody(redacted)
  }, [body, piiMatches])

  const handleSendAnyway = useCallback(() => {
    setSent(true)
  }, [])

  const handleSend = useCallback(() => {
    if (piiMatches.length > 0) {
      setShowPiiPreview(true)
      return
    }
    setSent(true)
  }, [piiMatches])

  const handleFilesDrop = useCallback((files: FileList | null) => {
    if (!files) return
    setAttachments((prev) => [...prev, ...Array.from(files)])
  }, [])

  const handleRemoveAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleAnonymize = useCallback(async (fileIndex: number, level: number): Promise<void> => {
    const file = attachments[fileIndex]
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`/v1/anonymize-attachment?level=${level}`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const detail = await response.json().catch(() => ({ detail: response.statusText }))
      throw new Error(detail.detail ?? 'Anonymization failed')
    }

    // Replace the attachment with the anonymized version
    const blob = await response.blob()
    const disposition = response.headers.get('Content-Disposition') ?? ''
    const nameMatch = disposition.match(/filename="([^"]+)"/)
    const newName = nameMatch ? nameMatch[1] : `anon_L${level}_${file.name}`
    const anonymizedFile = new File([blob], newName, { type: blob.type })

    setAttachments((prev) => {
      const next = [...prev]
      next[fileIndex] = anonymizedFile
      return next
    })
  }, [attachments])

  // Sent confirmation
  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center h-full"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4"
          >
            <Shield className="w-10 h-10 text-emerald-400" />
          </motion.div>
          <h2 className="text-xl font-semibold text-white mb-2 font-display">
            Message Sent Securely
          </h2>
          <p className="text-sm text-gray-400 mb-1">
            Encrypted with {pqcEnabled ? 'ML-KEM-768 + X25519' : 'TLS 1.3'}
          </p>
          {selectedDestruct.mode && (
            <p className="text-xs text-gray-500 font-mono">
              Self-destruct:{' '}
              {selectedDestruct.value === 'read_once'
                ? 'After first read'
                : formatDuration(selectedDestruct.durationMs!)}
            </p>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="h-full flex flex-col"
    >
      {/* Compose header */}
      <div className="px-4 py-3 border-b border-white/[0.06] bg-black/20">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white font-display">
            New Message
          </h1>
          <div className="flex items-center gap-3">
            <EncryptionBadge level={pqcEnabled ? 'pqc' : 'tls'} />
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* To */}
        <div className="space-y-1">
          <label className="text-xs text-gray-500 uppercase tracking-wider font-mono">
            To
          </label>
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="recipient@example.com"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-quantum-500/50 focus:border-quantum-500/30 transition-all"
          />
          {to.length > 3 && pqcEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-1"
            >
              {recipientHasKey ? (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <Key className="w-3 h-3" />
                  <span>Composite key found</span>
                  <code className="font-mono text-[10px] text-gray-500">
                    {DEMO_RECIPIENT_KEY}
                  </code>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-yellow-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span>No composite key published for this recipient</span>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* CC */}
        <div className="space-y-1">
          <label className="text-xs text-gray-500 uppercase tracking-wider font-mono">
            CC
          </label>
          <input
            type="email"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            placeholder="cc@example.com"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-quantum-500/50 focus:border-quantum-500/30 transition-all"
          />
        </div>

        {/* Subject */}
        <div className="space-y-1">
          <label className="text-xs text-gray-500 uppercase tracking-wider font-mono">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Message subject"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-quantum-500/50 focus:border-quantum-500/30 transition-all"
          />
        </div>

        {/* Body */}
        <div className="space-y-1">
          <label className="text-xs text-gray-500 uppercase tracking-wider font-mono">
            Body
          </label>
          <div className="relative">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message... (try typing an SSN like 123-45-6789 or email@example.com to see PII detection)"
              rows={10}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-quantum-500/50 focus:border-quantum-500/30 transition-all resize-none font-sans"
            />
            {/* PII scan indicator */}
            {body.length > 0 && (
              <div className="absolute top-3 right-3">
                <button
                  onClick={() => setShowPiiPreview(!showPiiPreview)}
                  className={`
                    flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono
                    border transition-all duration-200
                    ${piiMatches.length > 0
                      ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                    }
                  `}
                >
                  <Eye className="w-3 h-3" />
                  {piiMatches.length > 0
                    ? `${piiMatches.length} PII found`
                    : 'Clean'}
                </button>
              </div>
            )}
          </div>

          {/* PII Preview */}
          <AnimatePresence>
            {showPiiPreview && piiMatches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-sm text-gray-300 leading-relaxed"
              >
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-mono mb-2">
                  PII Scan Preview
                </div>
                <PiiHighlightedText text={body} matches={piiMatches} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* PII Warning Banner */}
          <AnimatePresence>
            {piiMatches.length > 0 && (
              <PiiWarningBanner
                matches={piiMatches}
                onRedact={handleRedact}
                onSendAnyway={handleSendAnyway}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Attachment drop zone */}
        <div className="space-y-1">
          <label className="text-xs text-gray-500 uppercase tracking-wider font-mono">
            Attachments
          </label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFilesDrop(e.target.files)}
          />
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFilesDrop(e.dataTransfer.files) }}
            onClick={() => fileInputRef.current?.click()}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed cursor-pointer
              transition-all duration-200 text-sm
              ${isDragOver
                ? 'border-quantum-500/60 bg-quantum-500/10 text-quantum-400'
                : 'border-white/[0.08] bg-white/[0.02] text-gray-500 hover:border-white/20 hover:bg-white/[0.04]'
              }
            `}
          >
            <Paperclip className="w-4 h-4 shrink-0" />
            <span>Drop files here or click to attach</span>
          </div>

          {/* Attachment chips */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {attachments.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-gray-300"
                >
                  <Paperclip className="w-3 h-3 text-gray-500 shrink-0" />
                  <span className="max-w-[120px] truncate">{f.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemoveAttachment(i) }}
                    className="ml-0.5 text-gray-600 hover:text-gray-300 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Anonymization panel — shown when there are attachments */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <div className="space-y-1">
              <AnonymizationPanel attachments={attachments} onAnonymize={handleAnonymize} />
            </div>
          )}
        </AnimatePresence>

        {/* Controls row */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          {/* Encryption toggle */}
          <div className="flex-1">
            <label className="text-xs text-gray-500 uppercase tracking-wider font-mono block mb-2">
              Encryption
            </label>
            <button
              onClick={() => setPqcEnabled(!pqcEnabled)}
              className={`
                flex items-center gap-3 w-full px-4 py-3 rounded-xl border
                transition-all duration-300
                ${pqcEnabled
                  ? 'bg-emerald-500/5 border-emerald-500/30 hover:bg-emerald-500/10'
                  : 'bg-blue-500/5 border-blue-500/30 hover:bg-blue-500/10'
                }
              `}
            >
              {pqcEnabled ? (
                <Lock className="w-5 h-5 text-emerald-400" />
              ) : (
                <Unlock className="w-5 h-5 text-blue-400" />
              )}
              <div className="text-left">
                <div className={`text-sm font-semibold ${pqcEnabled ? 'text-emerald-400' : 'text-blue-400'}`}>
                  {pqcEnabled ? 'End-to-End PQC' : 'Standard TLS'}
                </div>
                <div className="text-[10px] text-gray-500 font-mono">
                  {pqcEnabled ? 'ML-KEM-768 + X25519' : 'TLS 1.3 transport only'}
                </div>
              </div>
            </button>
          </div>

          {/* Self-destruct selector */}
          <div className="flex-1">
            <label className="text-xs text-gray-500 uppercase tracking-wider font-mono block mb-2">
              Self-Destruct
            </label>
            <div className="relative">
              <button
                onClick={() => setShowDestructDropdown(!showDestructDropdown)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.06] transition-all"
              >
                <Clock className={`w-5 h-5 ${selectedDestruct.mode ? 'text-orange-400' : 'text-gray-500'}`} />
                <div className="text-left flex-1">
                  <div className={`text-sm font-semibold ${selectedDestruct.mode ? 'text-orange-400' : 'text-gray-400'}`}>
                    {selectedDestruct.label}
                  </div>
                  {selectedDestruct.mode && selectedDestruct.mode !== 'read_once' && (
                    <div className="text-[10px] text-gray-500 font-mono">
                      Mode: {selectedDestruct.mode}
                    </div>
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform ${showDestructDropdown ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {showDestructDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-gray-700 bg-gray-900/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50"
                  >
                    {SELF_DESTRUCT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSelfDestructValue(opt.value)
                          setShowDestructDropdown(false)
                        }}
                        className={`
                          w-full text-left px-4 py-3 text-sm transition-colors
                          ${opt.value === selfDestructValue
                            ? 'bg-quantum-900/30 text-quantum-400'
                            : 'text-gray-300 hover:bg-gray-800/60'
                          }
                        `}
                      >
                        <div className="font-medium">{opt.label}</div>
                        {opt.mode && (
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                            {opt.mode === 'read_once'
                              ? 'Destroyed after first open'
                              : `Destroyed ${formatDuration(opt.durationMs!)} after send`}
                          </div>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Self-destruct preview */}
            <AnimatePresence>
              {selectedDestruct.mode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 px-3 py-2 rounded-lg bg-orange-500/5 border border-orange-500/20 text-xs text-orange-300"
                >
                  <div className="font-semibold mb-1">Recipient will see:</div>
                  <div className="text-orange-400/70 font-mono text-[10px]">
                    {selectedDestruct.value === 'read_once'
                      ? '"This message will self-destruct after you close it."'
                      : `"This message expires in ${formatDuration(selectedDestruct.durationMs!)}." with a countdown timer.`}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Send bar */}
      <div className="shrink-0 px-4 py-3 border-t border-white/[0.06] bg-black/20 flex items-center justify-between">
        <div className="text-xs text-gray-600 font-mono">
          {pqcEnabled ? 'End-to-end encrypted' : 'Transport encrypted only'}
        </div>
        <button
          onClick={handleSend}
          disabled={!to || !subject}
          className={`
            flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm
            transition-all duration-300
            ${!to || !subject
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-quantum-500 to-quantum-700 text-white hover:shadow-lg hover:shadow-quantum-500/30 active:scale-[0.98]'
            }
          `}
        >
          <Send className="w-4 h-4" />
          {pqcEnabled ? 'Send Encrypted' : 'Send'}
        </button>
      </div>
    </motion.div>
  )
}
