'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock,
  Reply,
  Forward,
  Trash2,
  AlertTriangle,
  Paperclip,
  Star,
  MoreHorizontal,
} from 'lucide-react'
import EncryptionBadge from '@/components/mail/EncryptionBadge'
import SelfDestructTimer from '@/components/mail/SelfDestructTimer'
import KeyVerification from '@/components/mail/KeyVerification'
import { EMAIL_DB } from '../mockData'

// ── Component ────────────────────────────────────────────────────────────────

export default function EmailViewer({ id }: { id: string }) {
  const router = useRouter()
  const email = EMAIL_DB[id]

  const [showReadConfirm, setShowReadConfirm] = useState(
    !!email?.selfDestruct
  )
  const [showKeyPanel, setShowKeyPanel] = useState(false)

  if (!email) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Email not found
      </div>
    )
  }

  // Read confirmation dialog for self-destruct messages
  if (showReadConfirm && email.selfDestruct) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full rounded-2xl border border-orange-500/30 bg-orange-500/5 backdrop-blur-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white font-display">
                Self-Destruct Active
              </h2>
              <p className="text-xs text-gray-400">
                {email.selfDestruct.mode === 'read_once'
                  ? 'This message will be destroyed after you close it.'
                  : 'Opening this email starts the self-destruct timer.'}
              </p>
            </div>
          </div>

          <div className="bg-black/30 rounded-lg p-3 mb-4 text-xs text-gray-400 space-y-1 font-mono">
            <div>From: {email.from.email}</div>
            <div>Subject: {email.subject}</div>
            <div>
              Destruction:{' '}
              {email.selfDestruct.mode === 'read_once'
                ? 'After closing'
                : new Date(email.selfDestruct.expiresAt).toLocaleString()}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowReadConfirm(false)}
              className="flex-1 btn-primary text-sm py-2.5"
            >
              Open Message
            </button>
            <button
              onClick={() => router.push('/mail')}
              className="flex-1 py-2.5 rounded-xl border border-gray-700 text-sm text-gray-400 hover:bg-gray-800/50 transition-colors font-semibold"
            >
              Go Back
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="h-full flex flex-col"
    >
      {/* Email header */}
      <div className="px-4 sm:px-6 py-4 border-b border-white/[0.06] bg-black/20 space-y-3">
        {/* Subject row */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-lg sm:text-xl font-semibold text-white font-display leading-tight">
            {email.subject}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            {email.legalHold && (
              <span className="text-[9px] font-mono font-bold px-2 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30">
                LEGAL HOLD
              </span>
            )}
            <button className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
              <Star className="w-4 h-4 text-gray-500" />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Sender row */}
        <div className="flex items-center gap-3">
          <div
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white ${email.from.color}`}
          >
            {email.from.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white">
                {email.from.name}
              </span>
              <span className="text-xs text-gray-500 font-mono">
                &lt;{email.from.email}&gt;
              </span>
            </div>
            <div className="text-xs text-gray-500">
              to {email.to} &middot;{' '}
              {new Date(email.timestamp).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* CSP note: in production, email body would be rendered in a sandboxed iframe
              with strict Content-Security-Policy headers:
              default-src 'none'; style-src 'unsafe-inline'; img-src data: https:;
              This prevents XSS from email content. */}
          <EncryptionBadge level={email.encryption} />

          {email.encryption === 'pqc' && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] font-mono text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded-full border border-gray-700"
            >
              Decrypted with ML-KEM-768 + X25519
            </motion.span>
          )}

          {email.selfDestruct && (
            <SelfDestructTimer
              expiresAt={email.selfDestruct.expiresAt}
              mode={email.selfDestruct.mode}
            />
          )}

          {email.hasAttachment && (
            <span className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded-full border border-gray-700">
              <Paperclip className="w-3 h-3" />
              {email.attachmentName || 'Attachment'}
            </span>
          )}
        </div>
      </div>

      {/* Email body */}
      {/* Note: In production, this content would be rendered inside a sandboxed iframe
          with Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline';
          to prevent any XSS or script injection from email content. */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 py-6">
          <div className="max-w-3xl">
            <pre className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">
              {email.body}
            </pre>

            {/* Attachment block */}
            {email.hasAttachment && email.attachmentName && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-quantum-900/40 flex items-center justify-center">
                  <Paperclip className="w-5 h-5 text-quantum-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-200 truncate">
                    {email.attachmentName}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono">
                    {email.encryption === 'pqc'
                      ? 'AES-256-GCM + ML-KEM-768 wrapped'
                      : 'Standard attachment'}
                  </div>
                </div>
                <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-quantum-400 border border-quantum-500/30 hover:bg-quantum-500/10 transition-colors">
                  Download
                </button>
              </motion.div>
            )}

            {/* Key verification panel toggle */}
            {email.encryption === 'pqc' && (
              <div className="mt-6">
                <button
                  onClick={() => setShowKeyPanel(!showKeyPanel)}
                  className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {showKeyPanel ? 'Hide' : 'Show'} sender key verification
                </button>
                <AnimatePresence>
                  {showKeyPanel && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3"
                    >
                      <KeyVerification
                        fingerprint={email.fingerprint}
                        state={email.keyState}
                        senderName={email.from.name}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="shrink-0 px-4 sm:px-6 py-3 border-t border-white/[0.06] bg-black/20 flex items-center gap-2 flex-wrap">
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-quantum-500 to-quantum-700 hover:shadow-lg hover:shadow-quantum-500/30 transition-all active:scale-[0.98]">
          <Reply className="w-4 h-4" />
          Reply Encrypted
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-white/[0.08] text-gray-300 hover:bg-white/[0.04] transition-all">
          <Forward className="w-4 h-4" />
          Forward Encrypted
        </button>
        <div className="flex-1" />
        {!email.legalHold && (
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        )}
        {email.legalHold && (
          <span className="text-[10px] text-orange-400 font-mono">
            Deletion blocked: legal hold active
          </span>
        )}
      </div>
    </motion.div>
  )
}
