import type { EncryptionLevel } from '@/components/mail/EncryptionBadge'
import type { SelfDestructMode } from '@/components/mail/SelfDestructTimer'
import type { KeyVerificationState } from '@/components/mail/KeyVerification'

// ── Types ────────────────────────────────────────────────────────────────────

export interface EmailDetail {
  id: string
  from: {
    name: string
    email: string
    avatar: string
    color: string
  }
  to: string
  subject: string
  body: string
  timestamp: number
  encryption: EncryptionLevel
  fingerprint: string
  keyState: KeyVerificationState
  selfDestruct?: {
    expiresAt: number
    mode: SelfDestructMode
  }
  hasAttachment: boolean
  attachmentName?: string
  legalHold?: boolean
}

// ── Mock data ────────────────────────────────────────────────────────────────

const NOW = Date.now()

export const EMAIL_DB: Record<string, EmailDetail> = {
  e1: {
    id: 'e1',
    from: {
      name: 'Dr. Elena Vasquez',
      email: 'elena.v@cern-quantum.org',
      avatar: 'EV',
      color: 'bg-quantum-600',
    },
    to: 'you@qdaria.com',
    subject: 'Re: Lattice-based KEM benchmarks for Q4 report',
    body: `Hi team,

The ML-KEM-768 results from our latest test suite are promising. We achieved a median encapsulation time of 0.034ms across 10k iterations on the IBM Heron r2 processor.

Key findings:
- Keygen: 0.028ms median (std dev 0.003ms)
- Encapsulate: 0.034ms median (std dev 0.005ms)
- Decapsulate: 0.031ms median (std dev 0.004ms)
- Memory footprint: 3.2 KB per session context

The hybrid X25519+ML-KEM-768 composite adds roughly 0.008ms overhead, which is negligible for our use case. I have attached the full benchmark report with statistical breakdowns.

For the Q4 report, I recommend we highlight the comparison against classical ECDH, where we see only a 12% latency increase for quantum resistance. That is a compelling story for enterprise adoption.

Let me know if you need the raw data for the Rust FFI benchmarks.

Best regards,
Dr. Elena Vasquez
Quantum Cryptography Division, CERN`,
    timestamp: NOW - 1800_000,
    encryption: 'pqc',
    fingerprint: 'a3f8c912d4e7b6a10f2c8d5e7b9a4c3fe1d2a3b4c5d6e7f80011223344556677',
    keyState: 'verified',
    hasAttachment: true,
    attachmentName: 'kem-benchmarks-q4-2026.pdf',
  },
  e2: {
    id: 'e2',
    from: {
      name: 'Legal Team',
      email: 'legal@qdaria.com',
      avatar: 'LT',
      color: 'bg-emerald-600',
    },
    to: 'you@qdaria.com',
    subject: 'CONFIDENTIAL: Series B term sheet - Final draft',
    body: `CONFIDENTIAL - DO NOT FORWARD

Please review the attached term sheet for the Series B round. The financial projections on pages 12-15 contain sensitive valuation data.

Key terms:
- Pre-money valuation: [REDACTED]
- Lead investor: [REDACTED]
- Liquidation preference: 1x non-participating
- Board composition: 2 founders, 2 investors, 1 independent

Action items:
1. Review and redline by Friday
2. Schedule a call with outside counsel
3. Prepare data room access for due diligence

This message is protected by attorney-client privilege. Self-destruct timer is active.`,
    timestamp: NOW - 7200_000,
    encryption: 'pqc',
    fingerprint: 'b4c5d6e7f80011223344556677a3f8c912d4e7b6a10f2c8d5e7b9a4c3fe1d2a3',
    keyState: 'verified',
    hasAttachment: true,
    attachmentName: 'series-b-term-sheet-v3.pdf',
    selfDestruct: {
      expiresAt: NOW + 604800_000,
      mode: 'after_send',
    },
  },
  e3: {
    id: 'e3',
    from: {
      name: 'Marcus Chen',
      email: 'marcus@team.zipminator.zip',
      avatar: 'MC',
      color: 'bg-blue-600',
    },
    to: 'you@qdaria.com',
    subject: 'Standup notes + demo prep for Thursday',
    body: `Hey team,

Quick recap from today:
- The mobile SDK is passing all integration tests on Android
- iOS needs one more fix for the keychain bridging (SecItemCopyMatching issue)
- Web dashboard build time is down to 8s with the new chunking config

For the Thursday demo, I have set up a staging environment at staging.zipminator.zip. The PQC key exchange flow is working end-to-end through the React Native bridge.

Can someone test the self-destruct flow on iOS? I want to make sure the countdown timer renders correctly in the notification center.

Thanks!
Marcus`,
    timestamp: NOW - 14400_000,
    encryption: 'tls',
    fingerprint: '',
    keyState: 'unverified',
    hasAttachment: false,
  },
  e4: {
    id: 'e4',
    from: {
      name: 'Security Bot',
      email: 'noreply@auth.qdaria.com',
      avatar: 'SB',
      color: 'bg-red-600',
    },
    to: 'you@qdaria.com',
    subject: 'Password reset requested for your QDaria account',
    body: `A password reset was requested for your account (m***@qdaria.com).

If this was you, use the link below within the next hour:

[Reset Password] (link expires in 1 hour)

If you did not request this, please ignore this email or contact security@qdaria.com.

This is an automated message. Do not reply.
IP Address: 192.168.***
User Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)`,
    timestamp: NOW - 28800_000,
    encryption: 'tls',
    fingerprint: '',
    keyState: 'unverified',
    hasAttachment: false,
    selfDestruct: {
      expiresAt: NOW + 3600_000,
      mode: 'read_once',
    },
  },
  e5: {
    id: 'e5',
    from: {
      name: 'HR Department',
      email: 'hr@qdaria.com',
      avatar: 'HR',
      color: 'bg-purple-600',
    },
    to: 'you@qdaria.com',
    subject: 'Employee onboarding documents - CONTAINS PII',
    body: `Attached are the signed onboarding documents for the new engineering hires.

These documents contain:
- Social Security Numbers
- Home addresses
- Bank account details for direct deposit
- Emergency contact information

LEGAL HOLD ACTIVE: These documents are subject to a legal hold order (Case #QD-2026-0142). Do not delete or modify.

Please store in the secure HR vault and confirm receipt.

HR Department
QDaria Inc.`,
    timestamp: NOW - 86400_000,
    encryption: 'pqc',
    fingerprint: 'c5d6e7f80011223344556677a3f8c912d4e7b6a10f2c8d5e7b9a4c3fe1d2a3b4',
    keyState: 'verified',
    hasAttachment: true,
    attachmentName: 'onboarding-docs-2026-q1.zip.enc',
    legalHold: true,
  },
  e6: {
    id: 'e6',
    from: {
      name: 'Aria Quantum Lab',
      email: 'notifications@arialab.io',
      avatar: 'AQ',
      color: 'bg-cyan-600',
    },
    to: 'you@qdaria.com',
    subject: 'Entropy harvesting report: 2.4 MB collected',
    body: `Quantum Entropy Harvesting Report
==================================

Harvest completed: 2026-03-03 02:00:00 UTC
Backend: IBM Marrakesh via qBraid
Fallback: IBM Fez (not needed)

Results:
- Bytes collected: 2,457,600
- Circuits executed: 48
- Qubits used: 127 of 127
- Error rate: 0.023 (within tolerance)

Pool Status:
- Current size: 14.2 MB
- Integrity check: PASS (SHA-256 verified)
- Last consumed: 2026-03-02 23:45:12 UTC

Next scheduled harvest: 2026-03-04 02:00:00 UTC

--
Aria Quantum Lab Automation`,
    timestamp: NOW - 172800_000,
    encryption: 'pqc',
    fingerprint: 'd6e7f80011223344556677a3f8c912d4e7b6a10f2c8d5e7b9a4c3fe1d2a3b4c5',
    keyState: 'unverified',
    hasAttachment: false,
  },
  e7: {
    id: 'e7',
    from: {
      name: 'GitHub',
      email: 'noreply@github.com',
      avatar: 'GH',
      color: 'bg-gray-600',
    },
    to: 'you@qdaria.com',
    subject: '[qdaria/zipminator-pqc] PR #247 merged: SRTP ratchet implementation',
    body: `Pull Request #247 merged into main

feat: implement SRTP double-ratchet for PQC voice channels

47 files changed, 2,841 insertions(+), 312 deletions(-)

Approved by: @elena-v, @marcus-c
CI Status: All checks passed (14/14)

View on GitHub: https://github.com/qdaria/zipminator-pqc/pull/247`,
    timestamp: NOW - 259200_000,
    encryption: 'none',
    fingerprint: '',
    keyState: 'unverified',
    hasAttachment: false,
  },
}
