'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, File, Lock, Shield, Check, X, Download, Unlock } from 'lucide-react'

const FileVault = () => {
    const [isDragging, setIsDragging] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [isComplete, setIsComplete] = useState(false)
    const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0])
            setIsComplete(false)
            setProgress(0)
        }
    }, [])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setIsComplete(false)
            setProgress(0)
        }
    }

    const handleProcess = () => {
        if (!file) return
        setIsProcessing(true)

        // Simulate process
        let currentProgress = 0
        const interval = setInterval(() => {
            currentProgress += 5
            setProgress(currentProgress)
            if (currentProgress >= 100) {
                clearInterval(interval)
                setIsProcessing(false)
                setIsComplete(true)
            }
        }, 100)
    }

    const reset = () => {
        setFile(null)
        setIsComplete(false)
        setProgress(0)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="glass-panel rounded-2xl p-8 relative overflow-hidden">
                {/* Background Glow */}
                <div className={`absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 transition-colors duration-500 ${mode === 'encrypt' ? 'bg-blue-500/10' : 'bg-green-500/10'}`} />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                                {mode === 'encrypt' ? <Lock className="w-8 h-8 text-quantum-400" /> : <Unlock className="w-8 h-8 text-green-400" />}
                                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                    Quantum File Vault
                                </span>
                            </h2>
                            <p className="text-gray-400">
                                {mode === 'encrypt' ? 'Encrypt files with Kyber-768.' : 'Decrypt your secure files.'} Drag, drop, and secure.
                            </p>
                        </div>

                        {/* Mode Toggle */}
                        <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                            <button
                                onClick={() => { setMode('encrypt'); reset(); }}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'encrypt' ? 'bg-quantum-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                Encrypt
                            </button>
                            <button
                                onClick={() => { setMode('decrypt'); reset(); }}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'decrypt' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                Decrypt
                            </button>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {!file ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className={`
                  border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer
                  ${isDragging
                                        ? 'border-quantum-400 bg-quantum-400/10 scale-[1.02]'
                                        : 'border-gray-700 hover:border-quantum-500/50 hover:bg-white/5'
                                    }
                `}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    title="File Upload"
                                    aria-label="Upload file to vault"
                                />
                                <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Upload className={`w-10 h-10 text-gray-400 ${isDragging ? 'text-quantum-400' : ''}`} />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Drop your files here</h3>
                                <p className="text-gray-400 mb-6">or click to browse</p>
                                <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> Kyber-768 Encrypted</span>
                                    <span className="flex items-center gap-1"><Lock className="w-4 h-4" /> Zero Knowledge</span>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-black/30 rounded-2xl p-8 border border-white/10"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${mode === 'encrypt' ? 'bg-quantum-900/50' : 'bg-green-900/50'}`}>
                                            <File className={`w-6 h-6 ${mode === 'encrypt' ? 'text-quantum-400' : 'text-green-400'}`} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{file.name}</h3>
                                            <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                                        </div>
                                    </div>
                                    {!isComplete && !isProcessing && (
                                        <button
                                            onClick={reset}
                                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                        >
                                            <X className="w-5 h-5 text-gray-400" />
                                        </button>
                                    )}
                                </div>

                                {isProcessing && (
                                    <div className="mb-8">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-quantum-300">{mode === 'encrypt' ? 'Encrypting' : 'Decrypting'} with Kyber-768...</span>
                                            <span className="font-mono">{progress}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                className={`h-full bg-gradient-to-r ${mode === 'encrypt' ? 'from-quantum-500 to-purple-500' : 'from-green-500 to-emerald-500'}`}
                                            />
                                        </div>
                                    </div>
                                )}

                                {!isComplete && !isProcessing && (
                                    <button
                                        onClick={handleProcess}
                                        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${mode === 'encrypt'
                                            ? 'bg-quantum-600 hover:bg-quantum-500 shadow-quantum-500/20'
                                            : 'bg-green-600 hover:bg-green-500 shadow-green-500/20'
                                            }`}
                                    >
                                        {mode === 'encrypt' ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                                        {mode === 'encrypt' ? 'Encrypt File' : 'Decrypt File'}
                                    </button>
                                )}

                                {isComplete && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center"
                                    >
                                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Check className="w-8 h-8 text-green-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-green-400 mb-2">{mode === 'encrypt' ? 'Encryption' : 'Decryption'} Complete</h3>
                                        <p className="text-gray-400 mb-6">
                                            {mode === 'encrypt'
                                                ? 'Your file is now secured against quantum threats.'
                                                : 'Your file has been successfully restored.'}
                                        </p>

                                        <div className="flex gap-4 justify-center">
                                            <button className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold flex items-center gap-2 transition-colors">
                                                <Download className="w-5 h-5" />
                                                Download {mode === 'encrypt' ? '.enc' : 'File'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (mode === 'encrypt') {
                                                        setMode('decrypt')
                                                        reset()
                                                    } else {
                                                        reset()
                                                    }
                                                }}
                                                className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
                                            >
                                                {mode === 'encrypt' ? 'Decrypt This File' : 'Process Another'}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}

export default FileVault
