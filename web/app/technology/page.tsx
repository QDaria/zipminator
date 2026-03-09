'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Shield, Cpu, MessageSquare, Phone, Globe, Eye,
  Monitor, Mail, ScanSearch, Code2, BookOpen, Layers,
  Lock, Zap, Server, ArrowRight, ChevronRight,
} from 'lucide-react'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
}

const stagger = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
}

/* ── Data ─────────────────────────────────────────── */

const modules: {
  id: string; icon: React.ElementType; title: string
  tagline: string; features: string[]
}[] = [
  {
    id: 'encryption',
    icon: Lock,
    title: 'PQC Encryption Engine',
    tagline: 'ML-KEM-768 (Kyber) at 0.034 ms per operation with constant-time guarantees and zeroize-on-drop memory safety.',
    features: [
      'NIST FIPS 203 ML-KEM-768 key encapsulation',
      'Constant-time operations prevent timing side-channels',
      'Zeroize-on-drop: secret keys scrubbed from memory automatically',
      '166 Rust tests + NIST KAT vector validation',
      'PyO3 bindings expose native speed to Python SDK',
      '1184-byte public key, 2400-byte secret key, 1088-byte ciphertext',
    ],
  },
  {
    id: 'messenger',
    icon: MessageSquare,
    title: 'Quantum Secure Messenger',
    tagline: 'PQC Double Ratchet protocol with per-message forward secrecy. Every message gets a unique key that is destroyed after decryption.',
    features: [
      'Double Ratchet with ML-KEM replaces X25519 DH ratchet',
      'Per-message PQC key derivation (forward secrecy)',
      'Message ordering with out-of-order tolerance',
      'Session key rotation on every send/receive cycle',
      'Header encryption hides metadata from observers',
      'Group messaging via Sender Keys with PQC wrapping',
    ],
  },
  {
    id: 'voip',
    icon: Phone,
    title: 'PQ-SRTP VoIP & Video',
    tagline: 'Crystal-clear encrypted voice and video calls using RFC 3711 SRTP with a PQC key exchange layer.',
    features: [
      'RFC 3711 SRTP media encryption with PQC session keys',
      'ML-KEM key exchange during call setup',
      'Oopus/VP9 codec support for low-latency media',
      'SRTP key ratcheting every 60 seconds',
      'SRTP-to-SRTCP control channel encryption',
      'WebRTC-compatible with native mobile fallback',
    ],
  },
  {
    id: 'vpn',
    icon: Globe,
    title: 'Q-VPN (PQ-WireGuard)',
    tagline: 'Always-on quantum-resistant VPN built on WireGuard with ML-KEM handshakes, a kill switch, and real-time traffic metrics.',
    features: [
      'PQ-WireGuard: ML-KEM-768 replaces Curve25519 in handshake',
      'Always-on mode with automatic reconnection',
      'Kill switch blocks all traffic if tunnel drops',
      'Real-time bandwidth, latency, and packet-loss metrics',
      'Split tunneling for selective route protection',
      'Multi-hop routing through geographically distributed relays',
    ],
  },
  {
    id: 'anonymizer',
    icon: Eye,
    title: '10-Level Anonymizer',
    tagline: 'Progressive identity stripping from basic metadata removal (Level 1) to full quantum-anonymous routing (Level 10).',
    features: [
      'L1-L3: Strip user-agent, referrer, cookies, canvas fingerprint',
      'L4-L5: Randomize fonts, WebGL renderer, timezone, locale',
      'L6-L7: Tor-style onion routing with PQC circuit encryption',
      'L8: Traffic shaping defeats timing correlation attacks',
      'L9: Decoy traffic generation (chaff) masks real patterns',
      'L10: Full quantum-anonymous mode with entropy-seeded identities',
    ],
  },
  {
    id: 'browser',
    icon: Monitor,
    title: 'ZipBrowser',
    tagline: 'Tauri 2.x desktop browser with PQC TLS, automatic cookie rotation, fingerprint resistance, AI sidebar, and a built-in password vault.',
    features: [
      'Tauri 2.x (Rust backend + WebView2/WebKit frontend)',
      'PQC TLS 1.3 with ML-KEM key exchange for every connection',
      'Cookie jar rotation and third-party cookie blocking',
      'Canvas, WebGL, AudioContext fingerprint randomization',
      'AI sidebar: page summarization, chat, writing assistance',
      'Built-in password vault with ML-KEM-encrypted entries',
    ],
  },
  {
    id: 'email',
    icon: Mail,
    title: 'Quantum-Secure Email',
    tagline: 'OpenPGP message encryption with ML-KEM composite keys, WKD key discovery, and zero-knowledge header protection.',
    features: [
      'OpenPGP + ML-KEM composite public keys (hybrid PQC)',
      'Web Key Directory (WKD) for automatic key discovery',
      'Zero-knowledge headers: subject and recipients encrypted',
      'Automatic key rotation with forward-secret ratchet',
      'S/MIME bridge for enterprise email gateway compatibility',
      'Detached PQC signatures for message authenticity',
    ],
  },
  {
    id: 'pii',
    icon: ScanSearch,
    title: 'Device Shield / PII Scanner',
    tagline: 'Real-time PII detection scans files before encryption. Secure deletion uses DoD 5220.22-M three-pass overwrite.',
    features: [
      'Regex + NLP entity recognition for 15+ PII categories',
      'Credit card, SSN, passport, email, phone auto-detection',
      'Pre-encryption scan warns before sensitive data leaves device',
      'DoD 5220.22-M 3-pass secure deletion (overwrite-verify-zero)',
      'Self-destruct timer: set files to auto-delete after N hours',
      'Audit log of all PII detections and deletion events',
    ],
  },
]

const securityStack = [
  'ML-KEM-768 (FIPS 203)', 'ML-DSA-65 (FIPS 204)', 'PQC Double Ratchet',
  'PQ-SRTP (RFC 3711)', 'PQ-WireGuard', 'PQC TLS 1.3',
  'IBM Quantum QRNG (156 qubits)', 'AES-256-GCM', 'HMAC-SHA-384',
  'X25519 (hybrid fallback)', 'Ed25519 (hybrid signatures)', 'Argon2id KDF',
  'HKDF-SHA-256', 'ChaCha20-Poly1305', 'BLAKE3 hashing',
  'OpenPGP Composite Keys', 'WKD Key Discovery', 'DoD 5220.22-M Secure Delete',
  'Zeroize-on-Drop Memory', 'Constant-Time Operations', 'Canvas Fingerprint Randomization',
  'WebGL Renderer Spoofing', 'Cookie Jar Rotation', 'Tor-Style Onion Routing',
  'Traffic Shaping / Chaff', 'Decoy Identity Generation',
]

const sdkExamples = [
  {
    lang: 'Python',
    code: `from zipminator import keypair, encapsulate, decapsulate

pk, sk = keypair()
ct, shared_secret = encapsulate(pk)
recovered = decapsulate(ct, sk)
assert shared_secret == recovered  # 32-byte shared key`,
  },
  {
    lang: 'Rust',
    code: `use zipminator_core::{keypair, encapsulate, decapsulate};

let (pk, sk) = keypair();
let (ct, shared) = encapsulate(&pk);
let recovered = decapsulate(&ct, &sk);
assert_eq!(shared, recovered);`,
  },
  {
    lang: 'Node.js',
    code: `import { keypair, encapsulate, decapsulate } from '@zipminator/pqc';

const { publicKey, secretKey } = keypair();
const { ciphertext, sharedSecret } = encapsulate(publicKey);
const recovered = decapsulate(ciphertext, secretKey);
// sharedSecret === recovered (32 bytes)`,
  },
]

const jupyterMagics = [
  { cmd: '%kyber_keygen', desc: 'Generate ML-KEM-768 keypair in notebook cell' },
  { cmd: '%encrypt <data>', desc: 'Encrypt cell output with generated key' },
  { cmd: '%decrypt <ct>', desc: 'Decrypt ciphertext back to plaintext' },
  { cmd: '%entropy_status', desc: 'Show quantum entropy pool size and source' },
  { cmd: '%pii_scan <file>', desc: 'Scan file for PII before sharing notebook' },
  { cmd: '%benchmark', desc: 'Run keygen/encaps/decaps microbenchmarks' },
]

/* ── Component ────────────────────────────────────── */

export default function TechnologyPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-quantum-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />

        <div className="container-custom relative z-10 text-center">
          <motion.div {...fadeUp}>
            <div className="inline-flex items-center space-x-2 bg-quantum-900/40 border border-quantum-400/30 rounded-full px-5 py-2.5 mb-8 backdrop-blur-sm">
              <Cpu className="w-4 h-4 text-quantum-400" />
              <span className="text-sm font-semibold text-quantum-300">
                Technology Deep-Dive
              </span>
            </div>
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-[1.1]"
          >
            The Technology Behind{' '}
            <span className="gradient-text">Zipminator</span>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
          >
            <span className="text-quantum-400 font-semibold">26 security technologies</span>,{' '}
            <span className="text-quantum-400 font-semibold">8 integrated modules</span>, and{' '}
            <span className="text-quantum-400 font-semibold">870K+ lines of code</span>{' '}
            engineered to withstand quantum-era threats.
          </motion.p>

          {/* Quick nav pills */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-wrap justify-center gap-2 mt-12"
          >
            {modules.map((m) => (
              <a
                key={m.id}
                href={`#${m.id}`}
                className="px-4 py-2 text-sm rounded-full bg-gray-900/60 border border-gray-700/50 text-gray-300 hover:border-quantum-500/60 hover:text-quantum-300 transition-colors"
              >
                {m.title}
              </a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Architecture Overview */}
      <section id="architecture" className="py-20">
        <div className="container-custom">
          <motion.div {...fadeUp} className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Architecture</span> Overview
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              A Rust-first design with native bindings for every platform.
            </p>
          </motion.div>

          <motion.div {...fadeUp} className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Cpu, title: 'Rust Core', desc: 'ML-KEM-768 in constant-time Rust with zeroize-on-drop. 166 tests + NIST KAT vectors.' },
              { icon: Code2, title: 'PyO3 Bindings', desc: 'Native Python module via maturin. Call keypair(), encapsulate(), decapsulate() at Rust speed.' },
              { icon: Zap, title: 'Quantum Entropy', desc: 'IBM 156-qubit hardware seeds the entropy pool. OS CSPRNG fallback ensures availability.' },
              { icon: Shield, title: 'PQC Protocols', desc: 'Double Ratchet, PQ-SRTP, PQ-WireGuard, and PQC TLS 1.3 built on the core engine.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                {...stagger}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-quantum-500/40 transition-colors"
              >
                <item.icon className="w-8 h-8 text-quantum-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Data flow */}
          <motion.div {...fadeUp} className="mt-10 flex items-center justify-center gap-3 text-sm text-gray-500 flex-wrap">
            {['Rust Core', 'PyO3', 'Python SDK', 'REST API', 'Web / Mobile / Desktop'].map((step, i, arr) => (
              <span key={step} className="flex items-center gap-3">
                <span className="px-3 py-1.5 rounded-lg bg-gray-800/70 text-gray-300 font-mono text-xs">
                  {step}
                </span>
                {i < arr.length - 1 && <ChevronRight className="w-4 h-4 text-quantum-500/60" />}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Module Deep-Dives */}
      {modules.map((mod, idx) => (
        <section
          key={mod.id}
          id={mod.id}
          className={`py-20 ${idx % 2 === 0 ? '' : 'bg-gray-950/50'}`}
        >
          <div className="container-custom">
            <motion.div {...fadeUp} className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Left: heading */}
              <div>
                <div className="inline-flex items-center space-x-2 bg-quantum-900/30 border border-quantum-500/20 rounded-full px-4 py-1.5 mb-5">
                  <mod.icon className="w-4 h-4 text-quantum-400" />
                  <span className="text-xs font-semibold text-quantum-300 uppercase tracking-wider">
                    Module {idx + 1} of {modules.length}
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {mod.title}
                </h2>
                <p className="text-gray-400 leading-relaxed text-lg">
                  {mod.tagline}
                </p>
              </div>

              {/* Right: features list */}
              <div className="space-y-3">
                {mod.features.map((feat, fi) => (
                  <motion.div
                    key={fi}
                    {...stagger}
                    transition={{ duration: 0.3, delay: fi * 0.06 }}
                    className="flex items-start gap-3 bg-gray-900/40 border border-gray-800/60 rounded-lg px-4 py-3"
                  >
                    <Shield className="w-4 h-4 text-quantum-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-300">{feat}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      ))}

      {/* Developer SDK */}
      <section id="sdk" className="py-20 bg-gray-950/50">
        <div className="container-custom">
          <motion.div {...fadeUp} className="text-center mb-14">
            <div className="inline-flex items-center space-x-2 bg-quantum-900/30 border border-quantum-500/20 rounded-full px-4 py-1.5 mb-5">
              <Code2 className="w-4 h-4 text-quantum-400" />
              <span className="text-xs font-semibold text-quantum-300 uppercase tracking-wider">
                Developer SDK
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Ship <span className="gradient-text">Quantum-Safe</span> in Minutes
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Three lines of code to generate a post-quantum keypair, encapsulate a shared secret, and decrypt.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {sdkExamples.map((ex, i) => (
              <motion.div
                key={ex.lang}
                {...stagger}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden"
              >
                <div className="px-4 py-2.5 border-b border-gray-800 flex items-center justify-between">
                  <span className="text-sm font-semibold text-quantum-300">{ex.lang}</span>
                  <span className="text-xs text-gray-600 font-mono">example.{ex.lang === 'Python' ? 'py' : ex.lang === 'Rust' ? 'rs' : 'ts'}</span>
                </div>
                <pre className="p-4 text-sm text-gray-300 font-mono overflow-x-auto leading-relaxed">
                  <code>{ex.code}</code>
                </pre>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* JupyterLab Integration */}
      <section id="jupyter" className="py-20">
        <div className="container-custom">
          <motion.div {...fadeUp} className="text-center mb-14">
            <div className="inline-flex items-center space-x-2 bg-quantum-900/30 border border-quantum-500/20 rounded-full px-4 py-1.5 mb-5">
              <BookOpen className="w-4 h-4 text-quantum-400" />
              <span className="text-xs font-semibold text-quantum-300 uppercase tracking-wider">
                JupyterLab Integration
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              PQC in Your <span className="gradient-text">Notebook</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              IPython magic commands and interactive widgets bring quantum-safe cryptography directly into data science workflows.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {jupyterMagics.map((m, i) => (
              <motion.div
                key={m.cmd}
                {...stagger}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-4"
              >
                <code className="text-sm font-mono text-quantum-400 block mb-2">{m.cmd}</code>
                <p className="text-xs text-gray-500">{m.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Encryption Stack */}
      <section id="stack" className="py-20 bg-gray-950/50">
        <div className="container-custom">
          <motion.div {...fadeUp} className="text-center mb-14">
            <div className="inline-flex items-center space-x-2 bg-quantum-900/30 border border-quantum-500/20 rounded-full px-4 py-1.5 mb-5">
              <Layers className="w-4 h-4 text-quantum-400" />
              <span className="text-xs font-semibold text-quantum-300 uppercase tracking-wider">
                Full Stack
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">26</span> Security Technologies
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Every algorithm, protocol, and hardening technique integrated into Zipminator.
            </p>
          </motion.div>

          <motion.div {...fadeUp} className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {securityStack.map((tech, i) => (
              <motion.span
                key={tech}
                {...stagger}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className="px-4 py-2 text-sm rounded-lg bg-gray-900/60 border border-gray-800 text-gray-300 hover:border-quantum-500/50 hover:text-quantum-300 transition-colors cursor-default"
              >
                {tech}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Enterprise */}
      <section id="enterprise" className="py-20">
        <div className="container-custom">
          <motion.div {...fadeUp} className="text-center mb-14">
            <div className="inline-flex items-center space-x-2 bg-quantum-900/30 border border-quantum-500/20 rounded-full px-4 py-1.5 mb-5">
              <Server className="w-4 h-4 text-quantum-400" />
              <span className="text-xs font-semibold text-quantum-300 uppercase tracking-wider">
                Enterprise
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Built for <span className="gradient-text">Enterprise</span> Scale
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              On-premise deployment, HSM integration, and dedicated support for organizations with the highest security requirements.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'On-Premise Deploy', desc: 'Air-gapped Kubernetes or bare-metal installation with no external dependencies.' },
              { title: 'HSM Support', desc: 'Hardware Security Module integration for key storage (Thales Luna, AWS CloudHSM).' },
              { title: '99.99% SLA', desc: 'Enterprise availability guarantee with 24/7 incident response and status page.' },
              { title: 'Dedicated CSM', desc: 'Customer Success Manager, onboarding workshops, and custom integration support.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                {...stagger}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-quantum-500/40 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-quantum-500/10 via-transparent to-purple-500/10" />
        <div className="container-custom relative z-10 text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Go <span className="gradient-text">Quantum-Safe</span>?
            </h2>
            <p className="text-lg text-gray-400 max-w-xl mx-auto mb-10">
              Start with the free SDK or talk to us about enterprise deployment.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/demo" className="btn-primary inline-flex items-center gap-2">
                Try the Demo <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/invest"
                className="px-6 py-3 rounded-lg border border-gray-700 text-gray-300 hover:border-quantum-500/50 hover:text-white transition-colors"
              >
                View Pitch Deck
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
