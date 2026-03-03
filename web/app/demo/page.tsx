'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Terminal, Play, ArrowRight, Key, Lock, Unlock, Cpu, Code2,
  Copy, Check, BookOpen, Download
} from 'lucide-react'
import Link from 'next/link'

/* ------------------------------------------------------------------ */
/* Animated counter hook                                               */
/* ------------------------------------------------------------------ */
function useCounter(end: number, duration = 1200, start = 0) {
  const [value, setValue] = useState(start)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        const t0 = performance.now()
        const tick = () => {
          const elapsed = performance.now() - t0
          const progress = Math.min(elapsed / duration, 1)
          setValue(Math.floor(start + (end - start) * progress))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
        observer.disconnect()
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration, start])

  return { value, ref }
}

/* ------------------------------------------------------------------ */
/* Code block with copy                                                */
/* ------------------------------------------------------------------ */
function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group rounded-xl overflow-hidden border border-white/10">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900/80 border-b border-white/5">
        <span className="text-xs text-gray-500 font-mono">{lang}</span>
        <button
          onClick={handleCopy}
          className="text-gray-500 hover:text-quantum-400 transition-colors"
          aria-label="Copy code"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <pre className="bg-gray-950 px-4 py-4 overflow-x-auto text-sm font-mono leading-relaxed text-gray-300">
        <code>{code}</code>
      </pre>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Terminal mock animation                                             */
/* ------------------------------------------------------------------ */
const terminalLines = [
  { text: '$ zipminator keygen --algorithm kyber768', delay: 0 },
  { text: 'Generating ML-KEM-768 keypair...', delay: 600, color: 'text-quantum-400' },
  { text: 'Public key:  1184 bytes  (pk_alice.pub)', delay: 1200, color: 'text-green-400' },
  { text: 'Secret key:  2400 bytes  (sk_alice.key)', delay: 1600, color: 'text-green-400' },
  { text: '', delay: 2000 },
  { text: '$ zipminator encrypt report.pdf --recipient alice@company.com', delay: 2400 },
  { text: 'Encapsulating shared secret with Kyber768...', delay: 3000, color: 'text-quantum-400' },
  { text: 'Ciphertext:  1088 bytes', delay: 3400, color: 'text-yellow-400' },
  { text: 'Encrypting with AES-256-GCM...', delay: 3800, color: 'text-quantum-400' },
  { text: 'Done in 0.034ms. Output: report.pdf.zpq', delay: 4200, color: 'text-green-400' },
]

function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState(0)
  const [running, setRunning] = useState(false)

  const run = () => {
    setVisibleLines(0)
    setRunning(true)
    terminalLines.forEach((_, i) => {
      setTimeout(() => setVisibleLines(i + 1), terminalLines[i].delay)
    })
    setTimeout(() => setRunning(false), terminalLines[terminalLines.length - 1].delay + 400)
  }

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-gray-900/60">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className="ml-3 text-xs text-gray-500 font-mono">zipminator-terminal</span>
        </div>
        <button
          onClick={run}
          disabled={running}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-quantum-600/30 border border-quantum-500/30 text-xs font-medium text-quantum-300 hover:bg-quantum-600/50 transition-colors disabled:opacity-50"
        >
          <Play className="w-3 h-3" />
          {running ? 'Running...' : 'Run Demo'}
        </button>
      </div>
      <div className="px-5 py-4 font-mono text-sm min-h-[280px] bg-gray-950/80">
        {terminalLines.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            className={`${line.color || 'text-gray-300'} leading-7`}
          >
            {line.text || '\u00A0'}
          </motion.div>
        ))}
        {visibleLines === 0 && (
          <span className="text-gray-600">Press &quot;Run Demo&quot; to start...</span>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Key size visualizer                                                 */
/* ------------------------------------------------------------------ */
function KeySizes() {
  const pk = useCounter(1184)
  const sk = useCounter(2400)
  const ct = useCounter(1088)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[
        { label: 'Public Key', counter: pk, icon: Key, unit: 'bytes' },
        { label: 'Secret Key', counter: sk, icon: Lock, unit: 'bytes' },
        { label: 'Ciphertext', counter: ct, icon: Unlock, unit: 'bytes' },
      ].map((item) => (
        <div key={item.label} ref={item.counter.ref} className="card-quantum text-center py-6">
          <item.icon className="w-8 h-8 text-quantum-400 mx-auto mb-3" />
          <div className="text-3xl font-bold gradient-text font-mono">{item.counter.value}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{item.unit}</div>
          <div className="text-sm font-semibold text-white mt-2">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function DemoPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-quantum-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="container-custom relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center space-x-2 bg-quantum-900/40 border border-quantum-400/30 rounded-full px-5 py-2.5 mb-8 backdrop-blur-sm">
              <Terminal className="w-4 h-4 text-quantum-400" />
              <span className="text-sm font-semibold text-quantum-300">Interactive Demos &amp; Tutorials</span>
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-[1.1]"
          >
            See Zipminator{' '}
            <span className="gradient-text">in Action</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-300 max-w-2xl mx-auto"
          >
            From pip install to quantum-secure encryption in three commands
          </motion.p>
        </div>
      </section>

      {/* Tutorial 1: Quick Start */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <SectionTitle number={1} title="Quick Start" />
          <CodeBlock
            lang="bash"
            code={`pip install zipminator
zipminator keygen --algorithm kyber768
zipminator encrypt secret.pdf --recipient alice@company.com`}
          />
        </div>
      </section>

      {/* Tutorial 2: Interactive Terminal */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <SectionTitle number={2} title="PQC Key Generation Demo" />
          <p className="text-gray-400 mb-6">
            Watch Kyber768 lattice-based key generation and AES-256-GCM file encryption happen in real time.
          </p>
          <TerminalDemo />
          <div className="mt-8">
            <KeySizes />
          </div>
          <p className="text-gray-500 text-sm mt-6 text-center">
            Kyber768 keys are derived from a structured lattice problem believed hard for both classical and quantum computers.
          </p>
        </div>
      </section>

      {/* Tutorial 3: Round-Trip */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <SectionTitle number={3} title="Encryption Round-Trip" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              { step: '1', label: 'Generate Keys', icon: Key },
              { step: '2', label: 'Encapsulate', icon: Lock },
              { step: '3', label: 'Decapsulate', icon: Unlock },
              { step: '4', label: 'Shared Secret', icon: Cpu },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-quantum text-center py-5"
              >
                <s.icon className="w-7 h-7 text-quantum-400 mx-auto mb-2" />
                <div className="text-xs text-gray-500 uppercase tracking-wider">Step {s.step}</div>
                <div className="text-sm font-semibold text-white mt-1">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tutorial 4: API Integration */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <SectionTitle number={4} title="API Integration" />
          <CodeBlock
            lang="python"
            code={`from zipminator import keypair, encapsulate, decapsulate

# Generate a Kyber768 keypair
pk, sk = keypair()

# Sender encapsulates a shared secret
ct, shared_secret = encapsulate(pk)

# Receiver decapsulates to recover the same secret
recovered = decapsulate(ct, sk)

assert shared_secret == recovered  # Quantum-safe!`}
          />
        </div>
      </section>

      {/* Tutorial 5: Government Demo */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <SectionTitle number={5} title="Enterprise / Government Demo" />
          <div className="card-quantum p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-3">Request an Enterprise Evaluation</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Includes guided installer, on-premises deployment options, SOC 2 compliance documentation, and dedicated support.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="#contact" className="btn-primary flex items-center gap-2 text-sm">
                  <Download className="w-4 h-4" />
                  Request Gov Demo
                </Link>
                <Link href="/features" className="btn-secondary flex items-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4" />
                  View All Features
                </Link>
              </div>
            </div>
            <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-quantum-900/40 to-purple-900/40 border border-quantum-500/20 flex items-center justify-center shrink-0">
              <Code2 className="w-16 h-16 text-quantum-400/60" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to go <span className="gradient-text">quantum-safe</span>?
            </h2>
            <Link href="/impact" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
              See the Impact <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Shared section title                                                */
/* ------------------------------------------------------------------ */
function SectionTitle({ number, title }: { number: number; title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex items-center gap-4 mb-6"
    >
      <div className="w-10 h-10 rounded-xl bg-quantum-600/30 border border-quantum-500/30 flex items-center justify-center text-quantum-300 font-bold text-sm shrink-0">
        {number}
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-white">{title}</h2>
    </motion.div>
  )
}
