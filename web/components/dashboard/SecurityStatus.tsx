'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Shield, ShieldCheck, Wifi, Lock, Eye, Activity,
  AlertTriangle, CheckCircle2, Zap, Layers
} from 'lucide-react'

const ANONYMIZATION_LAYERS = [
  'IP Masking', 'DNS Encryption', 'Traffic Obfuscation', 'Header Stripping',
  'Metadata Scrubbing', 'Timing Jitter', 'Payload Padding', 'Route Randomization',
  'Fingerprint Spoofing', 'Exit Decoupling',
]

const THREAT_LOG = [
  { time: '14:32:01', msg: 'Blocked TLS downgrade attempt from 91.214.x.x', level: 'warn' },
  { time: '14:28:47', msg: 'Quantum key rotation completed successfully', level: 'info' },
  { time: '14:25:12', msg: 'Suspicious handshake pattern detected and rejected', level: 'warn' },
  { time: '14:20:03', msg: 'PQC certificate chain validated', level: 'info' },
  { time: '14:15:55', msg: 'Entropy pool replenished from QRNG source', level: 'info' },
  { time: '14:10:22', msg: 'Replay attack attempt neutralized on channel 3', level: 'warn' },
]

export default function SecurityStatus() {
  const [trafficCount, setTrafficCount] = useState(1_847_293)
  const [entropyRefresh, setEntropyRefresh] = useState('2 min ago')
  const [layerWidths, setLayerWidths] = useState<number[]>(() => Array(ANONYMIZATION_LAYERS.length).fill(90))

  useEffect(() => {
    const interval = setInterval(() => {
      setTrafficCount(prev => prev + Math.floor(Math.random() * 50) + 10)
    }, 200)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setLayerWidths(ANONYMIZATION_LAYERS.map(() => 85 + Math.random() * 15))
  }, [])

  useEffect(() => {
    const times = ['just now', '1 min ago', '2 min ago', '3 min ago']
    let idx = 0
    const interval = setInterval(() => {
      idx = (idx + 1) % times.length
      setEntropyRefresh(times[idx])
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      {/* Top Status Banner */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border-green-500/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/[0.04] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-quantum-500/[0.03] rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-green-500/15 flex items-center justify-center shadow-lg shadow-green-500/10 ring-1 ring-green-500/20">
            <ShieldCheck className="w-7 h-7 text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-green-400 tracking-tight">Your device is protected</h3>
            <p className="text-gray-500 text-sm mt-0.5">11 quantum-safe encryption layers active across all channels</p>
          </div>
          <div className="hidden md:flex items-center gap-2.5 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/15">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-sm shadow-green-400/50" />
            <span className="text-xs font-mono text-green-400 tracking-wider">ALL CLEAR</span>
          </div>
        </div>
      </div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Device Shield */}
        <div className="glass-panel rounded-xl p-5 hover:border-green-500/20 transition-colors duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Device Shield</span>
            <Shield className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center ring-1 ring-green-500/20 shadow-[0_0_12px_rgba(34,197,94,0.15)]">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="font-bold text-green-400 text-sm">ACTIVE</div>
              <div className="text-[11px] text-gray-600">Full protection</div>
            </div>
          </div>
        </div>

        {/* Q-VPN */}
        <div className="glass-panel rounded-xl p-5 hover:border-quantum-500/20 transition-colors duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Q-VPN</span>
            <Wifi className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-quantum-500/15 flex items-center justify-center ring-1 ring-quantum-500/20">
              <Lock className="w-5 h-5 text-quantum-400" />
            </div>
            <div>
              <div className="font-bold text-quantum-300 text-sm">Connected</div>
              <div className="text-[11px] text-gray-600">Oslo, Norway</div>
            </div>
          </div>
        </div>

        {/* PQC Channels */}
        <div className="glass-panel rounded-xl p-5 hover:border-quantum-500/20 transition-colors duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">PQC Channels</span>
            <Layers className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-quantum-500/15 flex items-center justify-center ring-1 ring-quantum-500/20">
              <Lock className="w-5 h-5 text-quantum-400" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">11 / 11</div>
              <div className="text-[11px] text-gray-600">All encrypted</div>
            </div>
          </div>
        </div>

        {/* Traffic Counter */}
        <div className="glass-panel rounded-xl p-5 hover:border-quantum-500/20 transition-colors duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Traffic Encrypted</span>
            <Activity className="w-4 h-4 text-gray-600" />
          </div>
          <div className="font-mono text-2xl font-bold text-white tabular-nums tracking-tight">
            {trafficCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-600 mt-0.5">packets this session</div>
        </div>
      </div>

      {/* Anonymization Layers + Entropy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 10-Level Anonymization */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Eye className="w-5 h-5 text-quantum-400" />
            <h3 className="font-bold text-lg">10-Level Anonymization</h3>
          </div>
          <div className="space-y-2.5">
            {ANONYMIZATION_LAYERS.map((layer, i) => (
              <div key={layer} className="flex items-center gap-3 group">
                <span className="text-[10px] font-mono text-gray-600 w-5 text-right tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-xs text-gray-400 w-36 truncate group-hover:text-gray-300 transition-colors">{layer}</span>
                <div className="flex-1 h-1.5 bg-gray-800/80 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-quantum-600 to-quantum-400 transition-all duration-1000"
                    style={{ width: `${layerWidths[i]}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-gray-600 w-8 text-right tabular-nums">{Math.round(layerWidths[i])}%</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500/70 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Entropy Pool Status */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h3 className="font-bold text-lg tracking-tight">Entropy Pool</h3>
          </div>
          <div className="text-center mb-5">
            <div className="w-28 h-28 rounded-full mx-auto flex items-center justify-center relative">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-800/60" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="url(#entropyGrad)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${98 * 2.64} ${100 * 2.64}`} />
                <defs>
                  <linearGradient id="entropyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-2xl font-bold text-quantum-300 relative">98%</span>
            </div>
            <div className="mt-3 text-xs text-gray-500 uppercase tracking-wider font-medium">Pool Saturation</div>
          </div>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
              <span className="text-gray-500 text-xs">Source</span>
              <span className="text-quantum-300 font-mono text-xs">QRNG + OS</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
              <span className="text-gray-500 text-xs">Last Refresh</span>
              <span className="text-green-400 font-mono text-xs">{entropyRefresh}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
              <span className="text-gray-500 text-xs">Pool Size</span>
              <span className="text-white font-mono text-xs">128 KB</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500 text-xs">Quality</span>
              <span className="text-green-400 font-mono text-xs">Optimal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Threat Detection Log */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <h3 className="font-bold text-lg tracking-tight">Threat Detection Log</h3>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">Live feed</span>
          </div>
        </div>
        <div className="space-y-1.5">
          {THREAT_LOG.map((entry, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 px-3.5 py-2.5 rounded-lg transition-colors hover:bg-white/[0.03] ${
                entry.level === 'warn' ? 'bg-yellow-500/[0.03] border border-yellow-500/[0.08]' : 'bg-black/20 border border-white/[0.03]'
              }`}
            >
              <span className="text-[11px] font-mono text-gray-600 mt-[1px] w-16 flex-shrink-0 tabular-nums">
                {entry.time}
              </span>
              {entry.level === 'warn' ? (
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-500/80 mt-[2px] flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500/70 mt-[2px] flex-shrink-0" />
              )}
              <span className="text-[13px] text-gray-400 leading-relaxed">{entry.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
