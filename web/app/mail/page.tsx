'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Paperclip, Star, MailOpen } from 'lucide-react'
import Link from 'next/link'
import EncryptionBadge, { type EncryptionLevel } from '@/components/mail/EncryptionBadge'
import SelfDestructTimer, { type SelfDestructMode } from '@/components/mail/SelfDestructTimer'

// ── Types ────────────────────────────────────────────────────────────────────

interface MockEmail {
  id: string
  from: {
    name: string
    email: string
    avatar: string // initials
    color: string // avatar bg color
  }
  subject: string
  preview: string
  timestamp: number
  read: boolean
  starred: boolean
  hasAttachment: boolean
  encryption: EncryptionLevel
  selfDestruct?: {
    expiresAt: number
    mode: SelfDestructMode
  }
  legalHold?: boolean
}

// ── Mock data ────────────────────────────────────────────────────────────────

const NOW = Date.now()

const MOCK_EMAILS: MockEmail[] = [
  {
    id: 'e1',
    from: {
      name: 'Dr. Elena Vasquez',
      email: 'elena.v@cern-quantum.org',
      avatar: 'EV',
      color: 'bg-quantum-600',
    },
    subject: 'Re: Lattice-based KEM benchmarks for Q4 report',
    preview:
      'The ML-KEM-768 results from our latest test suite are promising. We achieved a median encapsulation time of 0.034ms across 10k iterations on the IBM Heron r2...',
    timestamp: NOW - 1800_000, // 30 min ago
    read: false,
    starred: true,
    hasAttachment: true,
    encryption: 'pqc',
  },
  {
    id: 'e2',
    from: {
      name: 'Legal Team',
      email: 'legal@qdaria.com',
      avatar: 'LT',
      color: 'bg-emerald-600',
    },
    subject: 'CONFIDENTIAL: Series B term sheet - Final draft',
    preview:
      'Please review the attached term sheet for the Series B round. The financial projections on pages 12-15 contain sensitive valuation data. Do not forward without...',
    timestamp: NOW - 7200_000, // 2 hours ago
    read: false,
    starred: false,
    hasAttachment: true,
    encryption: 'pqc',
    selfDestruct: {
      expiresAt: NOW + 604800_000, // 7 days
      mode: 'after_send',
    },
  },
  {
    id: 'e3',
    from: {
      name: 'Marcus Chen',
      email: 'marcus@team.zipminator.zip',
      avatar: 'MC',
      color: 'bg-blue-600',
    },
    subject: 'Standup notes + demo prep for Thursday',
    preview:
      'Hey team, quick recap from today: the mobile SDK is passing all integration tests on Android. iOS needs one more fix for the keychain bridging...',
    timestamp: NOW - 14400_000, // 4 hours ago
    read: true,
    starred: false,
    hasAttachment: false,
    encryption: 'tls',
  },
  {
    id: 'e4',
    from: {
      name: 'Security Bot',
      email: 'noreply@auth.qdaria.com',
      avatar: 'SB',
      color: 'bg-red-600',
    },
    subject: 'Password reset requested for your QDaria account',
    preview:
      'A password reset was requested for your account (m***@qdaria.com). If this was you, use the link below within the next...',
    timestamp: NOW - 28800_000, // 8 hours ago
    read: true,
    starred: false,
    hasAttachment: false,
    encryption: 'tls',
    selfDestruct: {
      expiresAt: NOW + 3600_000, // 1 hour from now
      mode: 'read_once',
    },
  },
  {
    id: 'e5',
    from: {
      name: 'HR Department',
      email: 'hr@qdaria.com',
      avatar: 'HR',
      color: 'bg-purple-600',
    },
    subject: 'Employee onboarding documents - CONTAINS PII',
    preview:
      'Attached are the signed onboarding documents for the new engineering hires. These contain SSNs, addresses, and banking details. Legal hold is active on...',
    timestamp: NOW - 86400_000, // 1 day ago
    read: true,
    starred: true,
    hasAttachment: true,
    encryption: 'pqc',
    legalHold: true,
  },
  {
    id: 'e6',
    from: {
      name: 'Aria Quantum Lab',
      email: 'notifications@arialab.io',
      avatar: 'AQ',
      color: 'bg-cyan-600',
    },
    subject: 'Entropy harvesting report: 2.4 MB collected',
    preview:
      'Your scheduled QRNG harvest completed successfully. 2,457,600 bytes of quantum entropy were collected from IBM Marrakesh via qBraid. Pool integrity check: PASS...',
    timestamp: NOW - 172800_000, // 2 days ago
    read: true,
    starred: false,
    hasAttachment: false,
    encryption: 'pqc',
  },
  {
    id: 'e7',
    from: {
      name: 'GitHub',
      email: 'noreply@github.com',
      avatar: 'GH',
      color: 'bg-gray-600',
    },
    subject: '[qdaria/zipminator-pqc] PR #247 merged: SRTP ratchet implementation',
    preview:
      'The pull request "feat: implement SRTP double-ratchet for PQC voice channels" has been merged into main. 47 files changed, 2,841 insertions, 312 deletions...',
    timestamp: NOW - 259200_000, // 3 days ago
    read: true,
    starred: false,
    hasAttachment: false,
    encryption: 'none',
  },
]

// ── Components ───────────────────────────────────────────────────────────────

function EmailRow({ email, index }: { email: MockEmail; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/mail/${email.id}`}
        className={`
          flex items-center gap-4 px-4 py-3.5 border-b border-white/[0.04]
          transition-all duration-200 group
          ${email.read
            ? 'hover:bg-white/[0.02]'
            : 'bg-quantum-900/10 hover:bg-quantum-900/20'
          }
        `}
      >
        {/* Avatar */}
        <div
          className={`
            shrink-0 w-10 h-10 rounded-full flex items-center justify-center
            text-xs font-bold text-white ${email.from.color}
          `}
        >
          {email.from.avatar}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {/* Sender */}
            <span
              className={`text-sm truncate ${email.read ? 'text-gray-300 font-medium' : 'text-white font-semibold'}`}
            >
              {email.from.name}
            </span>
            {/* Star */}
            {email.starred && (
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
            )}
            {/* Attachment */}
            {email.hasAttachment && (
              <Paperclip className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            )}
            {/* Legal hold */}
            {email.legalHold && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30 shrink-0">
                HOLD
              </span>
            )}
          </div>

          {/* Subject */}
          <div
            className={`text-sm truncate ${email.read ? 'text-gray-400' : 'text-gray-200 font-medium'}`}
          >
            {email.subject}
          </div>

          {/* Preview */}
          <div className="text-xs text-gray-600 truncate mt-0.5">
            {email.preview}
          </div>
        </div>

        {/* Right side: badges and timestamp */}
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          {/* Timestamp */}
          <span className="text-[11px] text-gray-500 font-mono tabular-nums whitespace-nowrap">
            {formatTimestamp(email.timestamp)}
          </span>

          {/* Badges */}
          <div className="flex items-center gap-1.5">
            <EncryptionBadge level={email.encryption} compact showTooltip={false} />
            {email.selfDestruct && (
              <SelfDestructTimer
                expiresAt={email.selfDestruct.expiresAt}
                mode={email.selfDestruct.mode}
                compact
              />
            )}
          </div>

          {/* Unread indicator */}
          {!email.read && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-quantum-500"
            />
          )}
        </div>
      </Link>
    </motion.div>
  )
}

function formatTimestamp(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`
  if (diff < 604800_000) return `${Math.floor(diff / 86400_000)}d ago`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const [emails] = useState(MOCK_EMAILS)

  const unreadCount = emails.filter((e) => !e.read).length
  const encryptedCount = emails.filter((e) => e.encryption === 'pqc').length

  return (
    <div className="h-full flex flex-col">
      {/* Inbox header */}
      <div className="px-4 py-3 border-b border-white/[0.06] bg-black/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-quantum-400" />
            <h1 className="text-lg font-semibold text-white font-display">Inbox</h1>
            {unreadCount > 0 && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-quantum-500/20 text-quantum-400 border border-quantum-500/30">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <MailOpen className="w-3.5 h-3.5" />
              {emails.length} messages
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <EncryptionBadge level="pqc" compact showTooltip={false} />
              {encryptedCount} encrypted
            </span>
          </div>
        </div>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto">
        {emails.map((email, index) => (
          <EmailRow key={email.id} email={email} index={index} />
        ))}

        {/* End of list */}
        <div className="py-8 text-center text-xs text-gray-600">
          <div className="font-mono">All messages loaded</div>
          <div className="mt-1 text-gray-700">
            {encryptedCount} of {emails.length} protected with ML-KEM-768
          </div>
        </div>
      </div>
    </div>
  )
}
