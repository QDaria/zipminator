'use client'

import { motion, useInView } from 'framer-motion'
import { Download, Copy, Check, Terminal } from 'lucide-react'
import { useRef, useState } from 'react'

type TabKey = 'python' | 'rust' | 'docker'

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'python', label: 'Python', icon: '\uD83D\uDC0D' },
  { key: 'rust', label: 'Rust', icon: '\uD83E\uDD80' },
  { key: 'docker', label: 'Docker', icon: '\uD83D\uDC33' },
]

interface CodeStep {
  title: string
  code: string
  language: string
}

const tabContent: Record<TabKey, CodeStep[]> = {
  python: [
    {
      title: 'Set up a quantum-ready Python environment',
      code: `# Install micromamba (lightweight conda)
curl -Ls https://micro.mamba.pm/api/micromamba/osx-arm64/latest | tar -xvj bin/micromamba

# Create quantum-ready environment
micromamba create -n zip-pqc python=3.11 -c conda-forge -y
micromamba activate zip-pqc

# Install UV for fast package management
pip install uv`,
      language: 'bash',
    },
    {
      title: 'Clone and install Zipminator from source',
      code: `# Clone and install from source
git clone https://github.com/qdaria/zipminator-pqc.git
cd zipminator-pqc
uv pip install -e ".[dev]"

# Build Rust bindings
uv pip install maturin
maturin develop --release`,
      language: 'bash',
    },
    {
      title: 'Verify quantum-secure encryption works',
      code: `from zipminator import Kyber768

# Generate quantum-secure keypair
pk, sk = Kyber768.keygen()

# Encrypt
ct, shared_secret = Kyber768.encapsulate(pk)

# Decrypt
recovered = Kyber768.decapsulate(ct, sk)
assert shared_secret == recovered
print("Quantum-secure encryption verified!")`,
      language: 'python',
    },
  ],
  rust: [
    {
      title: 'Clone the repository',
      code: `# Clone the repo
git clone https://github.com/qdaria/zipminator-pqc.git
cd zipminator-pqc`,
      language: 'bash',
    },
    {
      title: 'Run the test suite',
      code: `# Run all 166 tests
cargo test --workspace`,
      language: 'bash',
    },
    {
      title: 'Add to your Rust project',
      code: `# In your Cargo.toml:
# [dependencies]
# zipminator-core = { path = "crates/zipminator-core" }

use zipminator_core::Kyber768;

let (pk, sk) = Kyber768::keygen();
let (ct, shared_secret) = Kyber768::encapsulate(&pk);
let recovered = Kyber768::decapsulate(&ct, &sk);
assert_eq!(shared_secret, recovered);`,
      language: 'rust',
    },
  ],
  docker: [
    {
      title: 'Clone and launch the full stack',
      code: `# Full stack with one command
git clone https://github.com/qdaria/zipminator-pqc.git
cd zipminator-pqc
docker-compose up`,
      language: 'bash',
    },
    {
      title: 'Access the services',
      code: `# Web dashboard:  http://localhost:3099
# API server:     http://localhost:8000
# API docs:       http://localhost:8000/docs`,
      language: 'bash',
    },
  ],
}

function syntaxHighlight(code: string, language: string): React.ReactNode[] {
  const lines = code.split('\n')
  return lines.map((line, i) => {
    // Comment lines
    if (line.trimStart().startsWith('#') || line.trimStart().startsWith('//')) {
      return (
        <span key={i}>
          <span className="text-gray-500">{line}</span>
          {i < lines.length - 1 ? '\n' : ''}
        </span>
      )
    }

    // Keyword highlighting for bash
    if (language === 'bash') {
      const highlighted = line
        .replace(
          /\b(curl|tar|micromamba|pip|uv|git|cd|cargo|docker-compose|maturin)\b/g,
          '\x00CMD\x01$1\x00END\x01'
        )
        .replace(
          /\b(install|create|activate|clone|test|develop|up)\b/g,
          '\x00KW\x01$1\x00END\x01'
        )
        .replace(/(--?\w[\w-]*)/g, '\x00FLAG\x01$1\x00END\x01')
        .replace(/("(?:[^"\\]|\\.)*")/g, '\x00STR\x01$1\x00END\x01')

      const parts = highlighted.split(/\x00(CMD|KW|FLAG|STR|END)\x01/)
      const elements: React.ReactNode[] = []
      let currentType: string | null = null

      for (let j = 0; j < parts.length; j++) {
        const part = parts[j]
        if (part === 'CMD') { currentType = 'cmd'; continue }
        if (part === 'KW') { currentType = 'kw'; continue }
        if (part === 'FLAG') { currentType = 'flag'; continue }
        if (part === 'STR') { currentType = 'str'; continue }
        if (part === 'END') { currentType = null; continue }

        if (currentType === 'cmd') {
          elements.push(<span key={`${i}-${j}`} className="text-cyan-400">{part}</span>)
        } else if (currentType === 'kw') {
          elements.push(<span key={`${i}-${j}`} className="text-green-400">{part}</span>)
        } else if (currentType === 'flag') {
          elements.push(<span key={`${i}-${j}`} className="text-yellow-300">{part}</span>)
        } else if (currentType === 'str') {
          elements.push(<span key={`${i}-${j}`} className="text-amber-300">{part}</span>)
        } else {
          elements.push(<span key={`${i}-${j}`}>{part}</span>)
        }
      }
      return (
        <span key={i}>
          {elements}
          {i < lines.length - 1 ? '\n' : ''}
        </span>
      )
    }

    // Python / Rust highlighting
    const highlighted = line
      .replace(
        /\b(from|import|let|use|assert|assert_eq|print|fn|pub|const|mut)\b/g,
        '\x00KW\x01$1\x00END\x01'
      )
      .replace(/("(?:[^"\\]|\\.)*")/g, '\x00STR\x01$1\x00END\x01')
      .replace(/(Kyber768|Zipminator|QuantumEntropy)/g, '\x00TYPE\x01$1\x00END\x01')
      .replace(/\b(keygen|encapsulate|decapsulate)\b/g, '\x00FN\x01$1\x00END\x01')

    const parts = highlighted.split(/\x00(KW|STR|TYPE|FN|END)\x01/)
    const elements: React.ReactNode[] = []
    let currentType: string | null = null

    for (let j = 0; j < parts.length; j++) {
      const part = parts[j]
      if (part === 'KW') { currentType = 'kw'; continue }
      if (part === 'STR') { currentType = 'str'; continue }
      if (part === 'TYPE') { currentType = 'type'; continue }
      if (part === 'FN') { currentType = 'fn'; continue }
      if (part === 'END') { currentType = null; continue }

      if (currentType === 'kw') {
        elements.push(<span key={`${i}-${j}`} className="text-purple-400">{part}</span>)
      } else if (currentType === 'str') {
        elements.push(<span key={`${i}-${j}`} className="text-amber-300">{part}</span>)
      } else if (currentType === 'type') {
        elements.push(<span key={`${i}-${j}`} className="text-cyan-400">{part}</span>)
      } else if (currentType === 'fn') {
        elements.push(<span key={`${i}-${j}`} className="text-green-400">{part}</span>)
      } else {
        elements.push(<span key={`${i}-${j}`}>{part}</span>)
      }
    }
    return (
      <span key={i}>
        {elements}
        {i < lines.length - 1 ? '\n' : ''}
      </span>
    )
  })
}

const HowItWorks = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('python')
  const [copiedStep, setCopiedStep] = useState<number | null>(null)
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  const handleCopy = (stepIndex: number, code: string) => {
    // Strip comment-only lines for cleaner copy
    const cleaned = code
      .split('\n')
      .filter((line) => !line.match(/^#\s[A-Z]/))
      .join('\n')
      .trim()
    navigator.clipboard.writeText(cleaned)
    setCopiedStep(stepIndex)
    setTimeout(() => setCopiedStep(null), 2000)
  }

  const steps = tabContent[activeTab]

  return (
    <section
      ref={sectionRef}
      className="section-padding bg-gradient-to-b from-gray-900 via-gray-900/50 to-gray-900"
    >
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">
            How to Get Started with{' '}
            <span className="gradient-text">Quantum Security</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
            Deploy quantum-resistant encryption in minutes, not months
          </p>
        </motion.div>

        {/* Code Terminal Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="rounded-xl border border-gray-700/50 overflow-hidden shadow-2xl shadow-black/40">
            {/* Terminal Top Bar */}
            <div className="bg-[#161b22] flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
              {/* Traffic lights */}
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>

              {/* Language Tabs */}
              <div className="flex gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${
                      activeTab === tab.key
                        ? 'bg-gray-700/60 text-white'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                    }`}
                  >
                    <span className="text-base">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Terminal icon */}
              <Terminal className="w-4 h-4 text-gray-500" />
            </div>

            {/* Code Content */}
            <div className="bg-[#0d1117]">
              {steps.map((step, index) => (
                <div key={`${activeTab}-${index}`} className="border-b border-gray-800/50 last:border-b-0">
                  {/* Step Header */}
                  <div className="flex items-center gap-3 px-5 pt-4 pb-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-quantum-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-400">{step.title}</span>
                  </div>

                  {/* Code Block */}
                  <div className="relative group">
                    <pre className="px-5 pb-4 pt-1 text-sm leading-relaxed font-mono overflow-x-auto text-gray-300">
                      <code>{syntaxHighlight(step.code, step.language)}</code>
                    </pre>
                    <button
                      onClick={() => handleCopy(index, step.code)}
                      className="absolute top-2 right-3 p-1.5 rounded-md bg-gray-800/80 hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
                      title="Copy to clipboard"
                    >
                      {copiedStep === index ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Note */}
            <div className="bg-[#161b22] px-5 py-3 border-t border-gray-700/50">
              <p className="text-xs text-gray-500 text-center">
                Coming soon:{' '}
                <code className="text-gray-400 bg-gray-800/50 px-1.5 py-0.5 rounded">
                  pip install zipminator-pqc
                </code>{' '}
                (PyPI) &middot;{' '}
                <code className="text-gray-400 bg-gray-800/50 px-1.5 py-0.5 rounded">
                  cargo add zipminator-core
                </code>{' '}
                (crates.io)
              </p>
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <a
            href="https://github.com/qdaria/zipminator-pqc"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-quantum-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-quantum-500/50 transition-all duration-300 hover:scale-105"
          >
            <Download className="w-5 h-5" />
            View on GitHub
          </a>
        </motion.div>
      </div>
    </section>
  )
}

export default HowItWorks
