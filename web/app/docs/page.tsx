'use client'

import { motion } from 'framer-motion'
import {
  Code2, Terminal, Shield, Layers, FlaskConical,
  Notebook, Rocket, Key, FileCode, Lock, Server, Building2,
  ArrowRight, Copy, Check
} from 'lucide-react'
import { Fragment, useState } from 'react'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative group">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/60 rounded-t-lg border border-b-0 border-white/10 text-xs text-gray-400">
        <span>{language}</span>
        <button onClick={handleCopy} className="hover:text-white transition-colors" aria-label="Copy code">
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <pre className="p-4 bg-gray-900/80 rounded-b-lg border border-white/10 overflow-x-auto text-sm leading-relaxed font-mono text-gray-300">
        <code>{code}</code>
      </pre>
    </div>
  )
}

const quickStartSteps = [
  { step: '1', title: 'Install', code: 'pip install zipminator-pqc', lang: 'bash' },
  { step: '2', title: 'Generate Keys', code: 'from zipminator import keypair\npk, sk = keypair()', lang: 'python' },
  { step: '3', title: 'Encrypt', code: 'from zipminator import encapsulate\nct, shared_secret = encapsulate(pk)', lang: 'python' },
  { step: '4', title: 'Deploy', code: 'docker run -p 8000:8000 qdaria/zipminator-api', lang: 'bash' },
]

const docSections = [
  { icon: Rocket, title: 'Getting Started', desc: 'Installation, first key generation, and basic encryption in under 5 minutes.', href: '#quickstart', color: 'text-green-400' },
  { icon: Code2, title: 'API Reference', desc: 'Full SDK documentation for Python, Rust, and Node.js bindings.', href: '#sdk', color: 'text-blue-400' },
  { icon: Terminal, title: 'CLI Reference', desc: 'Command-line tool for key management, encryption, and PII scanning.', href: '#sdk', color: 'text-purple-400' },
  { icon: Layers, title: '10-Level Anonymization', desc: 'From basic redaction to quantum-secure k-anonymity with differential privacy.', href: '#anonymization', color: 'text-orange-400' },
  { icon: Shield, title: 'Compliance & Standards', desc: 'NIST FIPS 203 (ML-KEM-768), NIST Security Level 3, KAT vector verification.', href: '#compliance', color: 'text-cyan-400' },
  { icon: FlaskConical, title: 'JupyterLab Integration', desc: 'Magic commands, interactive widgets, and quantum entropy visualization.', href: '#jupyter', color: 'text-yellow-400' },
]

const notebooks = [
  { num: '01', title: 'Quickstart', desc: 'First encryption in 3 cells. Key generation, encapsulation, and decapsulation.' },
  { num: '02', title: 'Key Management', desc: 'Key storage, rotation, export/import, and multi-recipient workflows.' },
  { num: '03', title: 'File Encryption', desc: 'Encrypt files of any size with streaming Kyber768 + AES-256-GCM.' },
  { num: '04', title: 'PII Scanner', desc: 'Detect and redact 40+ PII types before encryption. Configurable rulesets.' },
  { num: '05', title: 'Compliance Workflows', desc: 'GDPR, HIPAA, and SOX compliance automation with audit trails.' },
  { num: '06', title: 'Quantum Capabilities', desc: 'Real quantum entropy harvesting from IBM 156-qubit hardware.' },
]

const sdkExamples: Record<string, { code: string; lang: string }> = {
  Python: {
    lang: 'python',
    code: `from zipminator import keypair, encapsulate, decapsulate

# Generate ML-KEM-768 keypair
pk, sk = keypair()

# Sender: encapsulate shared secret
ciphertext, shared_secret = encapsulate(pk)

# Receiver: decapsulate to recover shared secret
recovered = decapsulate(ciphertext, sk)
assert shared_secret == recovered`,
  },
  Rust: {
    lang: 'rust',
    code: `use zipminator_core::{keypair, encapsulate, decapsulate};

fn main() {
    let (pk, sk) = keypair();
    let (ct, shared_secret) = encapsulate(&pk);
    let recovered = decapsulate(&ct, &sk);
    assert_eq!(shared_secret, recovered);
}`,
  },
  'Node.js': {
    lang: 'typescript',
    code: `import { keypair, encapsulate, decapsulate } from '@qdaria/zipminator';

const { publicKey, secretKey } = keypair();
const { ciphertext, sharedSecret } = encapsulate(publicKey);
const recovered = decapsulate(ciphertext, secretKey);
// sharedSecret === recovered (32 bytes)`,
  },
}

const apiEndpoints = [
  { method: 'POST', path: '/v1/keys/generate', desc: 'Generate a new ML-KEM-768 keypair' },
  { method: 'POST', path: '/v1/encrypt', desc: 'Encapsulate a shared secret with a public key' },
  { method: 'POST', path: '/v1/decrypt', desc: 'Decapsulate ciphertext with a secret key' },
  { method: 'POST', path: '/v1/pii/scan', desc: 'Scan text for 40+ PII types and return findings' },
  { method: 'POST', path: '/v1/files/encrypt', desc: 'Encrypt a file with streaming KEM + AES-256-GCM' },
  { method: 'GET', path: '/v1/entropy/status', desc: 'Quantum entropy pool health and fill level' },
]

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState('Python')

  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* Hero */}
      <section className="container-custom text-center py-16">
        <motion.div variants={stagger} initial="hidden" animate="visible">
          <motion.p variants={fadeUp} className="text-sm font-semibold tracking-widest uppercase text-quantum-400 mb-4">
            Developer Resources
          </motion.p>
          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="gradient-text">Documentation</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-lg text-gray-400 max-w-2xl mx-auto">
            Everything you need to integrate quantum-secure encryption into your applications.
            SDKs for Python, Rust, and Node.js with full API reference.
          </motion.p>
        </motion.div>
      </section>

      {/* Quick Start */}
      <section id="quickstart" className="container-custom py-16">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.h2 variants={fadeUp} className="text-3xl font-bold mb-2">Quick Start</motion.h2>
          <motion.p variants={fadeUp} className="text-gray-400 mb-10">From zero to quantum-secure in four steps.</motion.p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickStartSteps.map((s) => (
              <motion.div key={s.step} variants={fadeUp} className="card-quantum">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-quantum-500/20 text-quantum-400 text-sm font-bold">
                    {s.step}
                  </span>
                  <h3 className="font-semibold text-white">{s.title}</h3>
                </div>
                <CodeBlock code={s.code} language={s.lang} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Documentation Sections */}
      <section className="container-custom py-16">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.h2 variants={fadeUp} className="text-3xl font-bold mb-10">Documentation</motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {docSections.map((s) => (
              <motion.a
                key={s.title}
                href={s.href}
                variants={fadeUp}
                className="card-quantum group flex flex-col"
              >
                <s.icon className={`w-8 h-8 mb-4 ${s.color}`} />
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-quantum-400 transition-colors">
                  {s.title}
                </h3>
                <p className="text-sm text-gray-400 flex-1">{s.desc}</p>
                <span className="mt-4 text-sm text-quantum-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Read more <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </motion.a>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Anonymization Levels */}
      <section id="anonymization" className="container-custom py-16">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.h2 variants={fadeUp} className="text-3xl font-bold mb-2">10-Level Anonymization</motion.h2>
          <motion.p variants={fadeUp} className="text-gray-400 mb-8">
            Progressive anonymization from basic redaction to quantum-secure differential privacy.
          </motion.p>
          <motion.div variants={fadeUp} className="card-quantum overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_1fr] gap-px bg-white/5 text-sm">
              <div className="bg-gray-900 px-4 py-3 font-semibold text-gray-300">Level</div>
              <div className="bg-gray-900 px-4 py-3 font-semibold text-gray-300">Technique</div>
              <div className="bg-gray-900 px-4 py-3 font-semibold text-gray-300">Use Case</div>
              {[
                ['0', 'Passthrough', 'Development / testing'],
                ['1', 'Basic Redaction', 'Internal logs'],
                ['2', 'Pattern Masking', 'Support tickets'],
                ['3', 'Tokenization', 'Payment processing'],
                ['4', 'Format-Preserving Encryption', 'Legacy systems'],
                ['5', 'k-Anonymity', 'Analytics datasets'],
                ['6', 'l-Diversity', 'Medical records'],
                ['7', 't-Closeness', 'Research data sharing'],
                ['8', 'Differential Privacy', 'Public datasets'],
                ['9', 'Quantum-Secure DP', 'Government / defense'],
              ].map(([level, tech, use]) => (
                <Fragment key={level}>
                  <div className="bg-gray-900/50 px-4 py-2.5 text-quantum-400 font-mono font-bold">{level}</div>
                  <div className="bg-gray-900/50 px-4 py-2.5 text-gray-200">{tech}</div>
                  <div className="bg-gray-900/50 px-4 py-2.5 text-gray-400">{use}</div>
                </Fragment>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Jupyter Notebooks */}
      <section id="jupyter" className="container-custom py-16">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.h2 variants={fadeUp} className="text-3xl font-bold mb-2">Jupyter Notebooks</motion.h2>
          <motion.p variants={fadeUp} className="text-gray-400 mb-8">
            Interactive tutorials with live quantum entropy visualization.
          </motion.p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notebooks.map((nb) => (
              <motion.div key={nb.num} variants={fadeUp} className="card-quantum group">
                <div className="flex items-center gap-3 mb-3">
                  <Notebook className="w-5 h-5 text-yellow-400" />
                  <span className="text-xs font-mono text-gray-500">{nb.num}_</span>
                  <h3 className="font-semibold text-white">{nb.title}</h3>
                </div>
                <p className="text-sm text-gray-400">{nb.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* SDK Examples */}
      <section id="sdk" className="container-custom py-16">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.h2 variants={fadeUp} className="text-3xl font-bold mb-2">SDK Reference</motion.h2>
          <motion.p variants={fadeUp} className="text-gray-400 mb-8">
            Native bindings for every major language. Same Kyber768 core, zero compromise.
          </motion.p>
          <motion.div variants={fadeUp}>
            <div className="flex gap-1 mb-4">
              {Object.keys(sdkExamples).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-quantum-500/20 text-quantum-400 border border-quantum-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <CodeBlock code={sdkExamples[activeTab].code} language={sdkExamples[activeTab].lang} />
          </motion.div>
        </motion.div>
      </section>

      {/* API Endpoints */}
      <section id="api" className="container-custom py-16">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.h2 variants={fadeUp} className="text-3xl font-bold mb-2">REST API</motion.h2>
          <motion.p variants={fadeUp} className="text-gray-400 mb-8">
            Production-ready endpoints with rate limiting, auth, and OpenAPI spec.
          </motion.p>
          <motion.div variants={fadeUp} className="space-y-3">
            {apiEndpoints.map((ep) => (
              <div key={ep.path} className="card-quantum flex items-center gap-4 py-4">
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded ${
                  ep.method === 'GET' ? 'bg-green-500/15 text-green-400' : 'bg-blue-500/15 text-blue-400'
                }`}>
                  {ep.method}
                </span>
                <code className="text-sm font-mono text-gray-200">{ep.path}</code>
                <span className="text-sm text-gray-500 ml-auto hidden sm:block">{ep.desc}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Compliance */}
      <section id="compliance" className="container-custom py-16">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.h2 variants={fadeUp} className="text-3xl font-bold mb-8">Compliance & Standards</motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'NIST FIPS 203', desc: 'Implements ML-KEM-768 (Kyber768) as specified in the NIST post-quantum standard.' },
              { icon: Key, title: 'NIST Level 3 Security', desc: 'Equivalent to AES-192 classical security. Resistant to both classical and quantum attacks.' },
              { icon: Lock, title: 'KAT Verified', desc: 'All Known Answer Test vectors pass. Constant-time implementation with no timing side-channels.' },
            ].map((item) => (
              <motion.div key={item.title} variants={fadeUp} className="card-quantum text-center">
                <item.icon className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Enterprise */}
      <section id="enterprise" className="container-custom py-16">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="card-quantum text-center py-12 px-8"
        >
          <motion.div variants={fadeUp}>
            <Building2 className="w-12 h-12 text-quantum-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Enterprise & On-Premise</h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-8">
              Deploy Zipminator in air-gapped environments, private clouds, or on-premise infrastructure.
              Includes dedicated support, SLA guarantees, custom integration, and hardware security module (HSM) support.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="mailto:enterprise@qdaria.com" className="btn-primary">
                <Server className="w-4 h-4 mr-2" /> Contact Sales
              </a>
              <a href="/" className="btn-secondary">
                <FileCode className="w-4 h-4 mr-2" /> View Pricing
              </a>
            </div>
          </motion.div>
        </motion.div>
      </section>
    </div>
  )
}

