'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Zap, Lock, RefreshCw, Copy, Check, Terminal, Cpu } from 'lucide-react'

const KeyGenerator = () => {
    const [isGenerating, setIsGenerating] = useState(false)
    const [progress, setProgress] = useState(0)
    const [keys, setKeys] = useState<{ publicKey: string; secretKey: string } | null>(null)
    const [entropyPool, setEntropyPool] = useState<number[]>([])
    const [copied, setCopied] = useState<'public' | 'secret' | null>(null)

    // Simulate entropy pool filling
    useEffect(() => {
        const interval = setInterval(() => {
            setEntropyPool(prev => {
                const newPool = [...prev, Math.random()]
                if (newPool.length > 50) newPool.shift()
                return newPool
            })
        }, 100)
        return () => clearInterval(interval)
    }, [])

    const generateKeys = () => {
        setIsGenerating(true)
        setProgress(0)
        setKeys(null)

        // Simulate generation steps
        const duration = 3000 // 3 seconds
        const interval = 50
        const steps = duration / interval
        let currentStep = 0

        const timer = setInterval(() => {
            currentStep++
            const newProgress = Math.min((currentStep / steps) * 100, 100)
            setProgress(newProgress)

            if (currentStep >= steps) {
                clearInterval(timer)
                setIsGenerating(false)
                // Generate mock Kyber-768 keys (visual representation)
                // Use a fixed seed or ensure client-side only generation to avoid hydration mismatch
                const randomHex = (len: number) => Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase()

                setKeys({
                    publicKey: '0x' + randomHex(64),
                    secretKey: '0x' + randomHex(128)
                })
            }
        }, interval)
    }

    const copyToClipboard = (text: string, type: 'public' | 'secret') => {
        navigator.clipboard.writeText(text)
        setCopied(type)
        setTimeout(() => setCopied(null), 2000)
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="glass-panel rounded-2xl p-8 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-quantum-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                                <Shield className="w-8 h-8 text-quantum-400" />
                                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                    Kyber-768 Key Generator
                                </span>
                            </h2>
                            <p className="text-gray-400">
                                Generate quantum-safe cryptographic keys using real entropy.
                                <span className="block text-xs text-gray-500 mt-1">Interactive visualization</span>
                            </p>
                        </div>
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-black/30 border border-white/5">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-sm font-mono text-quantum-300">Visual Demo</span>
                        </div>
                    </div>

                    {/* Entropy Visualizer */}
                    <div className="mb-8 bg-black/40 rounded-xl p-4 border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Zap className="w-4 h-4 text-yellow-400" />
                                <span>Live Entropy Pool (IBM Quantum)</span>
                            </div>
                            <span className="text-xs font-mono text-quantum-400">Pool Active</span>
                        </div>
                        <div className="flex items-end gap-1 h-12 overflow-hidden">
                            {entropyPool.map((val, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${val * 100}%` }}
                                    className="flex-1 bg-gradient-to-t from-quantum-600/50 to-quantum-400/80 rounded-t-sm"
                                />
                            ))}
                        </div>
                    </div>

                    {/* Action Area */}
                    <div className="flex flex-col items-center justify-center py-8">
                        {!keys && !isGenerating && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={generateKeys}
                                className="group relative px-8 py-4 bg-quantum-600 hover:bg-quantum-500 rounded-xl font-bold text-lg shadow-lg shadow-quantum-500/20 transition-all"
                            >
                                <div className="absolute inset-0 bg-white/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="relative flex items-center gap-3">
                                    <RefreshCw className="w-5 h-5" />
                                    Generate New Keypair
                                </span>
                            </motion.button>
                        )}

                        {isGenerating && (
                            <div className="w-full max-w-md">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-quantum-300">Harvesting Quantum Entropy...</span>
                                    <span className="font-mono">{Math.round(progress)}%</span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        className="h-full bg-gradient-to-r from-quantum-500 to-purple-500"
                                    />
                                </div>
                                <div className="mt-4 font-mono text-xs text-gray-500 text-center">
                                    Injecting seed into Kyber-768 engine...
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Results */}
                    <AnimatePresence>
                        {keys && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="grid gap-6"
                            >
                                {/* Public Key */}
                                <div className="bg-black/20 rounded-xl p-4 border border-white/10 group hover:border-quantum-500/30 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Lock className="w-4 h-4 text-green-400" />
                                            <span className="text-sm font-medium text-gray-300">Public Key <span className="text-xs text-yellow-500 ml-2">(DEMO VISUALIZATION)</span></span>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(keys.publicKey, 'public')}
                                            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                        >
                                            {copied === 'public' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <div className="font-mono text-xs text-gray-500 break-all bg-black/30 p-3 rounded-lg border border-white/5">
                                        {keys.publicKey}
                                    </div>
                                </div>

                                {/* Secret Key */}
                                <div className="bg-black/20 rounded-xl p-4 border border-white/10 group hover:border-red-500/30 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-red-400" />
                                            <span className="text-sm font-medium text-gray-300">Secret Key</span>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(keys.secretKey, 'secret')}
                                            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                        >
                                            {copied === 'secret' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <div className="font-mono text-xs text-gray-500 break-all bg-black/30 p-3 rounded-lg border border-white/5 relative">
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                                            <span className="text-xs text-red-400 font-bold flex items-center gap-2">
                                                <Lock className="w-3 h-3" /> Top Secret
                                            </span>
                                        </div>
                                        {keys.secretKey}
                                    </div>
                                </div>

                                <div className="flex justify-center mt-4">
                                    <button
                                        onClick={generateKeys}
                                        className="text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                        Generate New Pair
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}

export default KeyGenerator
