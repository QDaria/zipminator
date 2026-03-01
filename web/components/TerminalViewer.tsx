'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, Terminal, Play } from 'lucide-react'

const COMMANDS = [
    {
        name: 'Generate Keys',
        cmd: 'zipminator keygen --quantum -p public.bin -s secret.bin',
        desc: 'Generate a Kyber-768 keypair using quantum entropy.'
    },
    {
        name: 'Encrypt File',
        cmd: 'zipminator encrypt -i top_secret.pdf -o encrypted.bin -p public.bin --quantum',
        desc: 'Encrypt a file with quantum-resistant encryption.'
    },
    {
        name: 'Decrypt File',
        cmd: 'zipminator decrypt -i encrypted.bin -o decrypted.pdf -s secret.bin',
        desc: 'Decrypt a file using your secret key.'
    },
    {
        name: 'Sign Document',
        cmd: 'zipminator sign -i contract.pdf -s secret.bin --quantum',
        desc: 'Cryptographically sign a document (Dilithium-5).'
    },
    {
        name: 'Verify Signature',
        cmd: 'zipminator verify -i contract.pdf -s signature.sig -p public.bin',
        desc: 'Verify a digital signature.'
    }
]

export default function TerminalViewer() {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
    const [activeCmd, setActiveCmd] = useState(0)

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text)
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Command List */}
                <div className="space-y-2">
                    {COMMANDS.map((cmd, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveCmd(idx)}
                            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${activeCmd === idx
                                    ? 'bg-quantum-900/40 border-quantum-500/50 shadow-lg shadow-quantum-500/10'
                                    : 'bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={`font-semibold ${activeCmd === idx ? 'text-quantum-400' : 'text-gray-300'}`}>
                                    {cmd.name}
                                </span>
                                {activeCmd === idx && <Play className="w-3 h-3 text-quantum-400 fill-current" />}
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-1">{cmd.desc}</p>
                        </button>
                    ))}
                </div>

                {/* Terminal Window */}
                <div className="md:col-span-2">
                    <div className="bg-[#0c0c0c] rounded-xl border border-white/10 overflow-hidden shadow-2xl h-full flex flex-col">
                        {/* Terminal Header */}
                        <div className="bg-white/5 px-4 py-3 flex items-center gap-2 border-b border-white/5">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                            </div>
                            <div className="ml-4 flex items-center gap-2 text-xs text-gray-500 font-mono">
                                <Terminal className="w-3 h-3" />
                                <span>user@zipminator-pro ~</span>
                            </div>
                        </div>

                        {/* Terminal Content */}
                        <div className="p-6 font-mono text-sm flex-1 flex flex-col justify-center">
                            <motion.div
                                key={activeCmd}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="text-gray-500 mb-2"># {COMMANDS[activeCmd].desc}</div>
                                <div className="flex items-start gap-3 group relative">
                                    <span className="text-green-500 shrink-0">➜</span>
                                    <span className="text-gray-100 break-all">{COMMANDS[activeCmd].cmd}</span>

                                    <button
                                        onClick={() => copyToClipboard(COMMANDS[activeCmd].cmd, activeCmd)}
                                        className="absolute -right-2 top-0 p-2 rounded-md bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
                                        title="Copy command"
                                    >
                                        {copiedIndex === activeCmd ? (
                                            <Check className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-gray-300" />
                                        )}
                                    </button>
                                </div>

                                {/* Simulated Output */}
                                <div className="mt-4 text-gray-400 opacity-50">
                                    <div className="animate-pulse">_</div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
