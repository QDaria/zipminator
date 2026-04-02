'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, CheckCircle2, Loader2, Lock } from 'lucide-react'

export default function DropZone() {
  const [isDragActive, setIsDragActive] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [encryptionState, setEncryptionState] = useState<'idle' | 'encrypting' | 'success' | 'error'>('idle')

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files)
      setFiles(droppedFiles)
      
      setEncryptionState('encrypting')
      
      const formData = new FormData()
      droppedFiles.forEach((f, idx) => formData.append(`file-${idx}`, f))

      try {
        const res = await fetch('/api/encrypt', {
          method: 'POST',
          body: formData
        })
        
        if (res.ok) {
           setEncryptionState('success')
        } else {
           setEncryptionState('error')
        }
      } catch (err) {
        setEncryptionState('error')
      }
    }
  }, [])

  return (
    <div className="w-full max-w-3xl mx-auto mt-16 mb-24 relative z-10 px-4">
      {/* Dynamic Animated Glass Border matching BMAD trigger */}
      <motion.div
        animate={{
          boxShadow: isDragActive 
            ? '0 0 50px 15px rgba(0, 229, 255, 0.4), inset 0 0 30px 10px rgba(0, 229, 255, 0.2)' 
            : '0 0 0px 0px rgba(99, 102, 241, 0)'
        }}
        className={`relative w-full rounded-3xl backdrop-blur-xl overflow-hidden bg-obsidian-900/60 border-2 transition-all duration-300 ${
          isDragActive ? 'border-bmad-action bg-obsidian-900/80 scale-[1.02]' : 'border-white/10 hover:border-white/20'
        }`}
      >
        <div 
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={handleDrop}
          className="p-16 flex flex-col items-center justify-center min-h-[350px] cursor-pointer"
        >
          <AnimatePresence mode="wait">
            {encryptionState === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center text-center space-y-6"
              >
                <div className={`p-5 rounded-full transition-colors duration-300 ${isDragActive ? 'bg-bmad-action/20 text-bmad-action' : 'bg-white/5 text-gray-400'}`}>
                  <UploadCloud className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-white tracking-tight mb-2">
                    {isDragActive ? 'Drop to Encrypt' : 'Drop sensitive files here'}
                  </h3>
                  <p className="text-gray-400 max-w-sm mx-auto text-sm">
                    Initiate Post-Quantum Anonymization sequence. Data is automatically sharded into the Hive-Mind.
                  </p>
                </div>
              </motion.div>
            )}

            {encryptionState === 'encrypting' && (
              <motion.div
                key="encrypting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-center space-y-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-bmad-action/20 blur-xl rounded-full animate-pulse" />
                  <Loader2 className="w-16 h-16 text-bmad-action animate-spin relative z-10" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-white mb-2 flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4 text-bmad-action" />
                    Engaging Dilithium Crystals
                  </h3>
                  <p className="text-gray-400 text-sm animate-pulse">Running PQC L1 Python interop layer...</p>
                </div>
              </motion.div>
            )}

            {encryptionState === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center space-y-6"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, 10, 0] }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className="bg-bmad-investment/20 p-5 rounded-full"
                >
                  <CheckCircle2 className="w-16 h-16 text-bmad-investment drop-shadow-[0_0_15px_rgba(57,255,20,0.6)]" />
                </motion.div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Anonymization Complete</h3>
                  <p className="text-gray-400 text-sm tracking-wide">
                    {files.length} quantum states collapsed & encrypted perfectly.
                  </p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEncryptionState('idle'); setFiles([]) }}
                    className="mt-6 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full text-white text-sm transition-colors border border-white/10 hover:border-white/20"
                  >
                    Encrypt More Files
                  </button>
                </div>
              </motion.div>
            )}
            
            {encryptionState === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center space-y-6"
              >
                <div className="bg-bmad-trigger/20 p-5 rounded-full">
                  <Lock className="w-16 h-16 text-bmad-trigger drop-shadow-[0_0_15px_rgba(255,51,102,0.6)]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Decoherence Detected</h3>
                  <p className="text-gray-400 text-sm tracking-wide">
                    Failed to establish Python interoperability binding.
                  </p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEncryptionState('idle'); setFiles([]) }}
                    className="mt-6 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full text-white text-sm transition-colors border border-white/10 hover:border-white/20"
                  >
                    Recalibrate & Retry
                  </button>
                </div>
              </motion.div>
            )}
            
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
