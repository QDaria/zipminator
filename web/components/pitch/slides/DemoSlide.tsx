'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import type { Scenario } from '@/lib/pitch-data'
import {
  Shield,
  MessageSquare,
  Phone,
  Globe,
  Mail,
  Eye,
  Bot,
  Monitor,
  Lock,
  Upload,
  FileKey,
  Trash2,
  Fingerprint,
  Wifi,
  Zap,
  Send,
  ShieldCheck,
  Waves,
  Table2,
  Sparkles,
  Search,
  Leaf,
  EyeOff,
} from 'lucide-react'

interface ModuleTab {
  id: string
  name: string
  tagline: string
  icon: typeof Shield
  keyPoint: string
  accentColor: string
  accentBg: string
  accentBorder: string
  visual: React.ReactNode
}

function VaultVisual() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-full max-w-xs mx-auto">
        <div className="rounded-xl border border-dashed border-quantum-500/30 bg-quantum-500/5 p-5 flex flex-col items-center gap-2">
          <Upload className="w-8 h-8 text-quantum-400" />
          <p className="text-sm text-gray-400">Drop files to encrypt</p>
          <div className="flex gap-2 mt-1">
            {['report.pdf', 'keys.json', 'photo.jpg'].map((f) => (
              <span key={f} className="text-[10px] font-mono bg-white/5 border border-white/10 rounded px-2 py-1 text-gray-500">{f}</span>
            ))}
          </div>
        </div>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: 'spring' }} className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
          <Lock className="w-5 h-5 text-green-400" />
        </motion.div>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <FileKey className="w-3.5 h-3.5 text-quantum-400" /><span>Kyber768 KEM</span>
        <span className="text-white/20">|</span>
        <Trash2 className="w-3.5 h-3.5 text-red-400" /><span>DoD 5220.22-M wipe</span>
      </div>
    </div>
  )
}

function MessengerVisual() {
  return (
    <div className="w-full max-w-xs mx-auto space-y-3">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
        <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />
        <span className="text-xs font-mono text-green-400">PQC handshake complete</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-end">
          <div className="bg-quantum-500/20 border border-quantum-500/20 rounded-2xl rounded-tr-sm px-4 py-2 max-w-[75%]">
            <p className="text-sm text-white">Sending the signed contract now</p>
          </div>
        </div>
        <div className="flex justify-start">
          <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-2 max-w-[75%]">
            <p className="text-sm text-gray-300">Received. Verified with your PQ key.</p>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="bg-quantum-500/20 border border-quantum-500/20 rounded-2xl rounded-tr-sm px-4 py-2 max-w-[75%]">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-quantum-400" />
              <p className="text-sm text-white">contract_final.pdf.enc</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5">
        <Send className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-xs text-gray-500">Type a message...</span>
      </div>
    </div>
  )
}

function VoIPVisual() {
  return (
    <div className="w-full max-w-xs mx-auto flex flex-col items-center gap-3">
      <div className="relative w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center">
        <Phone className="w-8 h-8 text-green-400" />
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 rounded-full border-2 border-green-400/30" />
      </div>
      <div className="text-center">
        <p className="text-white font-semibold text-sm">Encrypted Call Active</p>
        <p className="text-gray-500 text-xs font-mono">02:47 | PQ-SRTP</p>
      </div>
      <div className="w-full flex items-center gap-1 justify-center">
        {Array.from({ length: 24 }).map((_, i) => (
          <motion.div key={i} animate={{ height: [4, Math.random() * 20 + 4, 4] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.05 }} className="w-1 rounded-full bg-quantum-400/60" style={{ height: 4 }} />
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Waves className="w-3.5 h-3.5 text-quantum-400" /><span>Quantum-derived session keys</span>
      </div>
    </div>
  )
}

function VPNVisual() {
  return (
    <div className="w-full max-w-xs mx-auto flex flex-col items-center gap-4">
      <div className="relative">
        <Globe className="w-16 h-16 text-gray-600" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border border-dashed border-quantum-500/30"
        />
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-quantum-500/20 border border-quantum-500/30 flex items-center justify-center">
          <Shield className="w-4 h-4 text-quantum-400" />
        </div>
      </div>
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-xs">
          <span className="text-gray-400">Protocol</span>
          <span className="font-mono text-quantum-400">PQ-WireGuard</span>
        </div>
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-xs">
          <span className="text-gray-400">Key Exchange</span>
          <span className="font-mono text-quantum-400">ML-KEM-768</span>
        </div>
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-green-500/5 border border-green-500/15 text-xs">
          <span className="text-gray-400">Status</span>
          <span className="font-mono text-green-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Connected
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/5 border border-green-500/15 text-xs">
          <Leaf className="w-3.5 h-3.5 text-green-400 shrink-0" />
          <span className="text-green-400/80 font-mono">Norwegian servers, 98% renewable</span>
        </div>
      </div>
    </div>
  )
}

function MailVisual() {
  return (
    <div className="w-full max-w-xs mx-auto space-y-3">
      <div className="rounded-lg bg-white/[0.03] border border-white/10 p-3 space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">To:</span>
          <span className="text-white font-mono">partner@acme.com</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">From:</span>
          <span className="text-quantum-400 font-mono">you@zipminator.zip</span>
        </div>
        <div className="border-t border-white/5 pt-2">
          <p className="text-sm text-gray-300">Here are the quarterly figures...</p>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400">
          <Fingerprint className="w-3 h-3" />
          SSN detected
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400">
          <Eye className="w-3 h-3" />
          Phone # found
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
        <Zap className="w-3.5 h-3.5" />
        Self-destruct: 72 hours
      </div>
    </div>
  )
}

function PIIVisual() {
  const rows = [
    { level: 1, label: 'Pseudonymize', color: 'bg-blue-400', sample: 'John D.' },
    { level: 3, label: 'Mask', color: 'bg-cyan-400', sample: 'J*** D**' },
    { level: 5, label: 'Generalize', color: 'bg-yellow-400', sample: 'Male, 30-40' },
    { level: 7, label: 'Quantum noise', color: 'bg-orange-400', sample: 'x9f#2kL...' },
    { level: 10, label: 'Full erasure', color: 'bg-red-400', sample: '[REDACTED]' },
  ]
  return (
    <div className="w-full max-w-xs mx-auto space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Table2 className="w-4 h-4 text-quantum-400" />
        <span className="text-xs font-semibold text-white">Anonymization Levels</span>
      </div>
      {rows.map((row) => (
        <div key={row.level} className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs">
          <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-black ${row.color}`}>{row.level}</span>
          <span className="text-gray-400 w-24">{row.label}</span>
          <span className="font-mono text-gray-500 flex-1 text-right">{row.sample}</span>
        </div>
      ))}
    </div>
  )
}

function AIVisual() {
  return (
    <div className="w-full max-w-xs mx-auto space-y-3">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-quantum-500/10 border border-quantum-500/20">
        <ShieldCheck className="w-4 h-4 text-quantum-400 shrink-0" />
        <span className="text-xs font-mono text-quantum-400">PQC Tunnel Active</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-end">
          <div className="bg-quantum-500/20 border border-quantum-500/20 rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%]">
            <p className="text-sm text-white">Summarize this NDA and flag risks</p>
          </div>
        </div>
        <div className="flex justify-start">
          <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-2 max-w-[80%]">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3 h-3 text-quantum-400" />
              <span className="text-[10px] text-quantum-400 font-mono">On-device AI</span>
            </div>
            <p className="text-sm text-gray-300">3 clauses flagged. Non-compete in Section 4 is unusually broad...</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Lock className="w-3.5 h-3.5 text-green-400" />
        <span>Zero data leaves your device</span>
      </div>
    </div>
  )
}

function BrowserVisual() {
  return (
    <div className="w-full max-w-xs mx-auto space-y-3">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-white/[0.02]">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
          </div>
          <div className="flex-1 flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 text-xs">
            <Search className="w-3 h-3 text-gray-500" />
            <span className="text-gray-400 font-mono">zipminator.zip/docs</span>
            <span className="ml-auto px-1.5 py-0.5 rounded bg-green-500/20 text-[9px] font-mono text-green-400">PQC TLS</span>
          </div>
        </div>
        <div className="p-3 flex gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-2 bg-white/5 rounded w-full" />
            <div className="h-2 bg-white/5 rounded w-4/5" />
            <div className="h-2 bg-white/5 rounded w-3/5" />
            <div className="h-8 bg-white/[0.03] rounded mt-3" />
          </div>
          <div className="w-20 rounded-lg bg-quantum-500/10 border border-quantum-500/20 p-2 flex flex-col items-center gap-1">
            <Bot className="w-4 h-4 text-quantum-400" />
            <span className="text-[8px] text-quantum-400">AI Agent</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><Wifi className="w-3 h-3 text-green-400" />VPN</span>
        <span className="text-white/20">|</span>
        <span className="flex items-center gap-1"><Bot className="w-3 h-3 text-quantum-400" />AI</span>
        <span className="text-white/20">|</span>
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
          <EyeOff className="w-3 h-3 text-red-400" />
          <span className="text-red-400 font-semibold">Zero Telemetry</span>
        </span>
      </div>
    </div>
  )
}

const MODULES: ModuleTab[] = [
  {
    id: 'vault',
    name: 'Quantum Vault',
    tagline: 'Lock your files with math that quantum computers can\'t crack',
    icon: Shield,
    keyPoint: 'Military-grade self-destruct. Files overwritten 3 times then deleted.',
    accentColor: 'text-quantum-400',
    accentBg: 'bg-quantum-500/10',
    accentBorder: 'border-quantum-500/20',
    visual: <VaultVisual />,
  },
  {
    id: 'messenger',
    name: 'Secure Messenger',
    tagline: 'Chat knowing nobody can read your messages. Not even us.',
    icon: MessageSquare,
    keyPoint: 'Post-quantum Double Ratchet. Every message uses a fresh encryption key.',
    accentColor: 'text-blue-400',
    accentBg: 'bg-blue-500/10',
    accentBorder: 'border-blue-500/20',
    visual: <MessengerVisual />,
  },
  {
    id: 'voip',
    name: 'Quantum VoIP',
    tagline: 'Crystal clear calls wrapped in quantum-safe encryption',
    icon: Phone,
    keyPoint: 'PQ-SRTP: Your voice is encrypted with keys from quantum hardware.',
    accentColor: 'text-green-400',
    accentBg: 'bg-green-500/10',
    accentBorder: 'border-green-500/20',
    visual: <VoIPVisual />,
  },
  {
    id: 'vpn',
    name: 'Q-VPN',
    tagline: 'Your entire internet connection, quantum-proofed',
    icon: Globe,
    keyPoint: 'PQ-WireGuard replaces vulnerable key exchange with Kyber768.',
    accentColor: 'text-cyan-400',
    accentBg: 'bg-cyan-500/10',
    accentBorder: 'border-cyan-500/20',
    visual: <VPNVisual />,
  },
  {
    id: 'mail',
    name: 'Quantum Mail',
    tagline: 'Self-destructing emails that scan for leaked personal data',
    icon: Mail,
    keyPoint: 'username@zipminator.zip. The world\'s most secure email domain.',
    accentColor: 'text-amber-400',
    accentBg: 'bg-amber-500/10',
    accentBorder: 'border-amber-500/20',
    visual: <MailVisual />,
  },
  {
    id: 'pii',
    name: 'PII Anonymizer',
    tagline: '10 levels of data protection, from masking to quantum noise',
    icon: Eye,
    keyPoint: 'Levels 7-10 use real quantum randomness from IBM hardware.',
    accentColor: 'text-orange-400',
    accentBg: 'bg-orange-500/10',
    accentBorder: 'border-orange-500/20',
    visual: <PIIVisual />,
  },
  {
    id: 'ai',
    name: 'AI Assistant',
    tagline: 'Security-aware AI that never leaks your data',
    icon: Bot,
    keyPoint: 'On-device AI with optional quantum-encrypted cloud routing.',
    accentColor: 'text-purple-400',
    accentBg: 'bg-purple-500/10',
    accentBorder: 'border-purple-500/20',
    visual: <AIVisual />,
  },
  {
    id: 'browser',
    name: 'ZipBrowser',
    tagline: 'The world\'s only quantum-safe AI browser',
    icon: Monitor,
    keyPoint: 'Built-in VPN + AI agent + zero telemetry. No one watches you browse.',
    accentColor: 'text-rose-400',
    accentBg: 'bg-rose-500/10',
    accentBorder: 'border-rose-500/20',
    visual: <BrowserVisual />,
  },
]

export default function DemoSlide({ scenario: _scenario }: { scenario?: Scenario }) {
  const [activeTab, setActiveTab] = useState(0)
  const active = MODULES[activeTab]

  return (
    <SlideWrapper>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-3">
          <Monitor className="w-5 h-5 text-quantum-400" />
          <span className="text-xs font-mono uppercase tracking-widest text-quantum-400/80">
            Slide 7 / 20
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-2">
          Product{' '}
          <span className="gradient-text">Demo</span>
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl">
          Eight modules. One quantum-safe super app. Tap each to explore.
        </p>
        <p className="text-gray-600 text-sm mt-1 sm:hidden">
          Touch any tab to explore
        </p>
      </motion.div>

      {/* Tab bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex gap-1 overflow-x-auto pb-2 mb-6 scrollbar-none"
      >
        {MODULES.map((mod, i) => {
          const Icon = mod.icon
          const isActive = i === activeTab
          return (
            <button
              key={mod.id}
              onClick={() => setActiveTab(i)}
              className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? mod.accentColor : ''}`} />
              <span className="hidden sm:inline">{mod.name}</span>
              {isActive && (
                <motion.div
                  layoutId="demo-tab-indicator"
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-quantum-400 to-quantum-600"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </motion.div>

      {/* Tab content */}
      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="card-quantum"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Left: Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl ${active.accentBg} border ${active.accentBorder} flex items-center justify-center`}>
                    <active.icon className={`w-5 h-5 ${active.accentColor}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white font-display">
                      {active.name}
                    </h3>
                    <p className="text-sm text-gray-400">{active.tagline}</p>
                  </div>
                </div>
                <div className={`px-4 py-3 rounded-lg ${active.accentBg} border ${active.accentBorder}`}>
                  <p className={`text-sm font-medium ${active.accentColor}`}>
                    {active.keyPoint}
                  </p>
                </div>
              </div>

              {/* Right: Visual mockup */}
              <div className="flex items-center justify-center py-4">
                {active.visual}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </SlideWrapper>
  )
}
