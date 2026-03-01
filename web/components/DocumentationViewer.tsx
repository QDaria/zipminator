'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, ChevronRight, Terminal, Shield, Book } from 'lucide-react'

const DOCS = {
    'overview': {
        title: 'Overview',
        icon: Shield,
        content: `# Zipminator Cybersecurity Suite 🛡️

> **The World's Most Sophisticated Cybersecurity Suite**
> *Quantum-Powered. Homomorphically Encrypted. DoD-Secure.*

**Zipminator** is the world's first multi-provider quantum cybersecurity platform. We collaborate with **Rigetti Computing** and **IBM Quantum** to deliver true, non-deterministic entropy for the post-quantum era.

## 🚀 Why Zipminator?

### 🌍 Unique in the World

Zipminator is the only platform that combines **Multi-Provider Quantum Entropy** (Rigetti & IBM) with **Homomorphic Encryption** and **DoD-Grade Deletion** in a single, installable suite.

### ⚛️ Quantum Entropy Pool

We aggregate entropy from multiple quantum sources:

* **Rigetti Computing:** Primary source for production-grade entropy.
* **IBM Quantum:** Used for rigorous testing and demonstration.

### 🔒 FIPS 203 Ready

Built on **ML-KEM (Kyber)** standards, Zipminator is ready for the transition to Post-Quantum Cryptography (PQC).

## 📦 Features

* **Homomorphic Encryption:** Compute on encrypted data (Paillier).
* **DoD 5220.22-M Deletion:** 3-pass overwrite for forensic-proof deletion.
* **PII Auto-Redaction:** GDPR-compliant scanning.
* **No-Account Mode:** Use our centralized API to access quantum entropy without needing your own quantum hardware tokens.`
    },
    'cli': {
        title: 'CLI Reference',
        icon: Terminal,
        content: `# Zipminator CLI

Post-Quantum Cryptography CLI tool with CRYSTALS-Kyber-768 and Quantum Entropy support.

## Features

- **Quantum Random Number Generation**: Generate true random numbers using quantum entropy
- **Kyber768 Key Generation**: Create post-quantum secure keypairs
- **File Encryption/Decryption**: Protect files with quantum-resistant encryption
- **Performance Benchmarking**: Measure cryptographic operation performance

## CLI Usage

### Generate Quantum Random Numbers

\`\`\`bash
# Generate 32 bytes of pseudo-random data
zipminator rng --bytes 32

# Generate quantum random numbers (requires entropy pool)
zipminator rng --bytes 32 --quantum --output random.bin
\`\`\`

### Generate Keypair

\`\`\`bash
# Generate Kyber768 keypair
zipminator keygen --public-key public.bin --secret-key secret.bin --quantum
\`\`\`

### Encrypt Files

\`\`\`bash
# Encrypt a file
zipminator encrypt \\
  --input plaintext.txt \\
  --output ciphertext.bin \\
  --public-key public.bin \\
  --quantum
\`\`\`

### Decrypt Files

\`\`\`bash
# Decrypt a file
zipminator decrypt \\
  --input plaintext.txt \\
  --output decrypted.txt \\
  --secret-key secret.bin \\
  --ciphertext ciphertext.bin
\`\`\`
`
    },
    'rust': {
        title: 'Rust Core (Kyber-768)',
        icon: Book,
        content: `# Rust Kyber-768 Implementation

## Implementation Status

✅ **Core Functionality**: Complete
- KeyGen (deterministic and random)
- Encaps (with random and deterministic coins)
- Decaps (with implicit rejection)
- NTT/INTT transformations

✅ **Security Features**: Implemented
- Memory safety (Rust guarantees)
- Constant-time primitives (\`subtle\` crate)
- Overflow-safe arithmetic

## Performance Targets

**C++/AVX2 Baseline**: 34 µs total
**Rust Expected**: 50-100 µs (Initial), 40-60 µs (Optimized)

## Key Sizes

- **Public Key**: 1,184 bytes
- **Secret Key**: 2,400 bytes
- **Ciphertext**: 1,088 bytes
- **Shared Secret**: 32 bytes
`
    }
}

const MarkdownRenderer = ({ content }: { content: string }) => {
    const lines = content.split('\n')
    return (
        <div className="space-y-4 text-gray-300">
            {lines.map((line, i) => {
                if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold text-white mt-8 mb-4">{line.replace('# ', '')}</h1>
                if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-semibold text-quantum-400 mt-6 mb-3">{line.replace('## ', '')}</h2>
                if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-semibold text-white mt-4 mb-2">{line.replace('### ', '')}</h3>
                if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-quantum-500 pl-4 italic text-gray-400 my-4">{line.replace('> ', '')}</blockquote>
                if (line.startsWith('```')) return null // Skip code block markers for simple rendering
                if (line.startsWith('    ') || line.startsWith('\t')) return <pre key={i} className="bg-black/50 p-4 rounded-lg font-mono text-sm overflow-x-auto text-green-400">{line.trim()}</pre>
                if (line.startsWith('* ') || line.startsWith('- ')) return <ul key={i} className="list-disc ml-6"><li className="pl-2">{line.replace(/^[*|-] /, '')}</li></ul>
                if (line === '') return <br key={i} />
                return <p key={i} className="leading-relaxed">{line}</p>
            })}
        </div>
    )
}

export default function DocumentationViewer() {
    const [activeDoc, setActiveDoc] = useState<keyof typeof DOCS>('overview')

    return (
        <div className="flex h-[600px] border border-white/10 rounded-2xl overflow-hidden bg-black/20 backdrop-blur-sm">
            {/* Sidebar */}
            <div className="w-64 border-r border-white/10 bg-black/20 p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">Documentation</h3>
                <div className="space-y-1">
                    {(Object.keys(DOCS) as Array<keyof typeof DOCS>).map((key) => {
                        const doc = DOCS[key]
                        const Icon = doc.icon
                        return (
                            <button
                                key={key}
                                onClick={() => setActiveDoc(key)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeDoc === key
                                    ? 'bg-quantum-500/20 text-quantum-400'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {doc.title}
                                {activeDoc === key && <ChevronRight className="w-3 h-3 ml-auto" />}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <motion.div
                    key={activeDoc}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <MarkdownRenderer content={DOCS[activeDoc].content} />
                </motion.div>
            </div>
        </div>
    )
}
