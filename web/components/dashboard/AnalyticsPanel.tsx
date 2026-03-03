'use client'

import { useState, useEffect } from 'react'
import {
  BarChart3, Code2, FileCode2, Shield, Layers, Monitor,
  Languages, DollarSign, Users, Clock, Cpu, Lock
} from 'lucide-react'

const STATS = [
  { label: 'Lines of Code', value: 289000, suffix: '+', icon: Code2, color: 'text-quantum-400' },
  { label: 'Source Files', value: 1780, suffix: '+', icon: FileCode2, color: 'text-purple-400' },
  { label: 'Encryption Algorithms', value: 11, suffix: '+', icon: Shield, color: 'text-green-400' },
  { label: 'Security Layers', value: 10, suffix: '', icon: Layers, color: 'text-yellow-400' },
  { label: 'Platforms', value: 5, suffix: '', icon: Monitor, color: 'text-blue-400' },
  { label: 'Languages', value: 5, suffix: '+', icon: Languages, color: 'text-pink-400' },
]

const ENCRYPTION_TYPES = [
  { name: 'Kyber768 KEM', percentage: 100, color: 'from-quantum-500 to-quantum-400' },
  { name: 'AES-256-GCM', percentage: 95, color: 'from-purple-500 to-purple-400' },
  { name: 'ChaCha20-Poly1305', percentage: 88, color: 'from-blue-500 to-blue-400' },
  { name: 'HMAC-SHA256', percentage: 100, color: 'from-green-500 to-green-400' },
  { name: 'PQ Double Ratchet', percentage: 92, color: 'from-yellow-500 to-yellow-400' },
  { name: 'PQ-SRTP', percentage: 85, color: 'from-pink-500 to-pink-400' },
  { name: 'Dilithium Signatures', percentage: 78, color: 'from-cyan-500 to-cyan-400' },
  { name: 'SPHINCS+ Hash Sigs', percentage: 72, color: 'from-orange-500 to-orange-400' },
]

const LANGUAGES = [
  { name: 'Rust', percentage: 38, color: 'bg-orange-500' },
  { name: 'TypeScript', percentage: 28, color: 'bg-blue-500' },
  { name: 'Python', percentage: 18, color: 'bg-yellow-500' },
  { name: 'Swift/Kotlin', percentage: 10, color: 'bg-green-500' },
  { name: 'Other', percentage: 6, color: 'bg-gray-500' },
]

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [target])

  return (
    <span className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  )
}

export default function AnalyticsPanel() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {STATS.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="glass-panel rounded-xl p-4 text-center hover:border-white/15 transition-all duration-300 group">
              <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center mx-auto mb-3 group-hover:bg-white/[0.06] transition-colors">
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className="text-xl font-bold text-white mb-0.5 tracking-tight">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">{stat.label}</div>
            </div>
          )
        })}
      </div>

      {/* Development Equivalent */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-quantum-500/[0.03] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-5">
            <DollarSign className="w-5 h-5 text-quantum-400" />
            <h3 className="font-bold text-lg tracking-tight">Development Equivalent</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/20 rounded-xl p-5 border border-white/[0.04] text-center hover:border-green-500/15 transition-colors duration-300">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-xl font-bold text-green-400 mb-0.5 tracking-tight">$15-25M+</div>
              <div className="text-xs text-gray-400 font-medium">Estimated Value</div>
              <div className="text-[10px] text-gray-600 mt-1">Enterprise development cost</div>
            </div>
            <div className="bg-black/20 rounded-xl p-5 border border-white/[0.04] text-center hover:border-quantum-500/15 transition-colors duration-300">
              <div className="w-10 h-10 rounded-xl bg-quantum-500/10 flex items-center justify-center mx-auto mb-3">
                <Users className="w-5 h-5 text-quantum-400" />
              </div>
              <div className="text-xl font-bold text-quantum-300 mb-0.5 tracking-tight">35-50</div>
              <div className="text-xs text-gray-400 font-medium">Engineers</div>
              <div className="text-[10px] text-gray-600 mt-1">Full-stack + cryptography</div>
            </div>
            <div className="bg-black/20 rounded-xl p-5 border border-white/[0.04] text-center hover:border-yellow-500/15 transition-colors duration-300">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="text-xl font-bold text-yellow-400 mb-0.5 tracking-tight">18-24 mo</div>
              <div className="text-xs text-gray-400 font-medium">Timeline</div>
              <div className="text-[10px] text-gray-600 mt-1">Conventional development</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Encryption Algorithms Bar Chart */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Lock className="w-5 h-5 text-quantum-400" />
            <h3 className="font-bold text-lg tracking-tight">Encryption Coverage</h3>
          </div>
          <div className="space-y-3">
            {ENCRYPTION_TYPES.map((algo) => (
              <div key={algo.name} className="group">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-400 group-hover:text-gray-300 transition-colors">{algo.name}</span>
                  <span className="text-gray-600 font-mono tabular-nums">{algo.percentage}%</span>
                </div>
                <div className="h-1.5 bg-gray-800/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${algo.color} transition-all duration-1000 opacity-70 group-hover:opacity-100`}
                    style={{ width: `${algo.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Language Distribution */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Code2 className="w-5 h-5 text-quantum-400" />
            <h3 className="font-bold text-lg tracking-tight">Language Distribution</h3>
          </div>

          {/* CSS-only Pie Chart (stacked bar visual) */}
          <div className="mb-6">
            <div className="h-4 rounded-full overflow-hidden flex shadow-inner shadow-black/20">
              {LANGUAGES.map((lang, i) => (
                <div
                  key={lang.name}
                  className={`${lang.color} transition-all duration-1000 opacity-70 hover:opacity-100 ${i === 0 ? 'rounded-l-full' : ''} ${i === LANGUAGES.length - 1 ? 'rounded-r-full' : ''}`}
                  style={{ width: `${lang.percentage}%` }}
                  title={`${lang.name}: ${lang.percentage}%`}
                />
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            {LANGUAGES.map((lang) => (
              <div key={lang.name} className="flex items-center gap-3 group">
                <div className={`w-2.5 h-2.5 rounded-[3px] ${lang.color} flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity`} />
                <span className="text-xs text-gray-400 flex-1 group-hover:text-gray-300 transition-colors">{lang.name}</span>
                <span className="text-xs font-mono text-gray-600 tabular-nums">{lang.percentage}%</span>
                <div className="w-20 h-1 bg-gray-800/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${lang.color} opacity-60`}
                    style={{ width: `${lang.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Platform Support */}
          <div className="mt-6 pt-5 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 mb-3">
              <Monitor className="w-3.5 h-3.5 text-gray-600" />
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Platform Support</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['macOS', 'Linux', 'Windows', 'iOS', 'Android'].map((platform) => (
                <span
                  key={platform}
                  className="px-2.5 py-1 rounded-lg bg-quantum-500/[0.06] border border-quantum-500/10 text-[10px] font-mono text-quantum-400 hover:bg-quantum-500/10 transition-colors cursor-default"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Architecture Overview */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Cpu className="w-5 h-5 text-quantum-400" />
          <h3 className="font-bold text-lg tracking-tight">Architecture Stack</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {[
            { layer: 'Core Engine', tech: 'Rust + Kyber768', desc: 'Constant-time crypto' },
            { layer: 'Bindings', tech: 'PyO3 + FFI + WASM', desc: 'Cross-platform bridge' },
            { layer: 'Mobile', tech: 'Swift + Kotlin', desc: 'Native performance' },
            { layer: 'Desktop', tech: 'Electron + Tauri', desc: 'Cross-platform GUI' },
            { layer: 'API', tech: 'FastAPI + REST', desc: 'Backend services' },
            { layer: 'Web', tech: 'Next.js + React', desc: 'Dashboard & landing' },
            { layer: 'Browser', tech: 'Chromium + PQC', desc: 'Quantum-safe browsing' },
            { layer: 'Network', tech: 'WireGuard + SRTP', desc: 'VPN + VoIP layer' },
          ].map((item) => (
            <div key={item.layer} className="bg-black/20 rounded-xl p-3.5 border border-white/[0.04] hover:border-quantum-500/15 transition-all duration-300 group">
              <div className="text-[10px] text-quantum-500 font-mono mb-1.5 uppercase tracking-wider">{item.layer}</div>
              <div className="text-[13px] font-medium text-white mb-0.5 tracking-tight group-hover:text-quantum-200 transition-colors">{item.tech}</div>
              <div className="text-[10px] text-gray-600">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
