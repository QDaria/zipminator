'use client'

import { useState } from 'react'
import {
  Globe, Lock, Shield, ShieldCheck, Eye, EyeOff,
  Bot, Fingerprint, Wifi, ArrowLeft, ArrowRight,
  RotateCw, Star, ChevronDown, X, Minus, Maximize2
} from 'lucide-react'

const FEATURES = [
  {
    icon: Lock,
    title: 'PQC TLS 1.3',
    desc: 'Every connection uses post-quantum key exchange with Kyber768',
    active: true,
  },
  {
    icon: Wifi,
    title: 'Built-in Q-VPN',
    desc: 'Quantum-safe VPN tunnel runs automatically for all traffic',
    active: true,
  },
  {
    icon: Bot,
    title: 'Q-AI Assistant',
    desc: 'On-device AI assistant with zero data exfiltration',
    active: true,
  },
  {
    icon: EyeOff,
    title: 'Zero Telemetry',
    desc: 'No analytics, no tracking pixels, no data collection',
    active: true,
  },
  {
    icon: Fingerprint,
    title: 'Fingerprint Resistance',
    desc: 'Canvas, WebGL, AudioContext, and font fingerprinting blocked',
    active: true,
  },
  {
    icon: Shield,
    title: 'Ad & Tracker Blocking',
    desc: 'Built-in content filtering with 500K+ rule database',
    active: true,
  },
]

export default function BrowserPreview() {
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Encryption Banner */}
      <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-quantum-500/20 flex items-center justify-center flex-shrink-0">
          <Globe className="w-6 h-6 text-quantum-400" />
        </div>
        <div>
          <h3 className="font-bold text-white">Every web connection is quantum-encrypted</h3>
          <p className="text-sm text-gray-400">
            ZipBrowser wraps all traffic in PQC TLS with built-in Q-VPN and zero telemetry
          </p>
        </div>
      </div>

      {/* Browser Chrome Mockup */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl shadow-black/30">
        {/* Title Bar */}
        <div className="bg-gray-900/90 px-4 py-2 flex items-center gap-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/70 hover:bg-red-500 transition-colors cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70 hover:bg-yellow-500 transition-colors cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-green-500/70 hover:bg-green-500 transition-colors cursor-pointer" />
          </div>
          <div className="flex-1" />
          <span className="text-[10px] text-gray-600 font-mono tracking-wider">ZipBrowser v1.0</span>
        </div>

        {/* Tab Bar */}
        <div className="bg-gray-900/70 px-2 pt-1.5 flex items-end gap-px border-b border-white/[0.04]">
          <div className="px-4 py-1.5 bg-gray-950/60 rounded-t-lg border border-white/[0.06] border-b-0 flex items-center gap-2 text-xs">
            <Lock className="w-3 h-3 text-green-400" />
            <span className="text-gray-300 font-medium">qdaria.com</span>
            <X className="w-3 h-3 text-gray-600 ml-2 hover:text-gray-400 cursor-pointer transition-colors" />
          </div>
          <div className="px-4 py-1.5 rounded-t-lg flex items-center gap-2 text-xs text-gray-600 hover:bg-white/[0.03] cursor-pointer transition-colors">
            <Lock className="w-3 h-3 text-green-500/50" />
            <span>github.com</span>
          </div>
        </div>

        {/* Address Bar */}
        <div className="bg-gray-900/50 px-3 py-1.5 flex items-center gap-1.5 border-b border-white/[0.04]">
          <div className="flex items-center gap-0.5">
            <button className="p-1.5 hover:bg-white/[0.04] rounded-md transition-colors">
              <ArrowLeft className="w-3.5 h-3.5 text-gray-600" />
            </button>
            <button className="p-1.5 hover:bg-white/[0.04] rounded-md transition-colors">
              <ArrowRight className="w-3.5 h-3.5 text-gray-600" />
            </button>
            <button className="p-1.5 hover:bg-white/[0.04] rounded-md transition-colors">
              <RotateCw className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>

          {/* URL Bar */}
          <div className="flex-1 flex items-center gap-2 bg-black/30 rounded-lg px-3 py-1.5 border border-white/[0.06]">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-green-400" />
              <span className="text-[10px] text-green-400/80 font-mono font-medium tracking-wide">PQC-TLS</span>
            </div>
            <div className="w-px h-3.5 bg-white/[0.08]" />
            <span className="text-xs text-gray-400">https://qdaria.com/dashboard</span>
            <div className="ml-auto flex items-center gap-1 bg-quantum-500/[0.08] px-1.5 py-0.5 rounded">
              <Shield className="w-3 h-3 text-quantum-400" />
              <span className="text-[9px] text-quantum-400 font-mono tracking-wider">Q-VPN</span>
            </div>
          </div>

          <button className="p-1.5 hover:bg-white/[0.04] rounded-md transition-colors">
            <Star className="w-3.5 h-3.5 text-gray-600" />
          </button>
          <button
            onClick={() => setAiSidebarOpen(!aiSidebarOpen)}
            className={`p-1.5 rounded-md transition-all duration-200 ${
              aiSidebarOpen ? 'bg-quantum-500/15 text-quantum-400 ring-1 ring-quantum-500/20' : 'hover:bg-white/[0.04] text-gray-600'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex min-h-[320px]">
          {/* Page Content */}
          <div className="flex-1 bg-gray-950 p-6">
            <div className="max-w-lg mx-auto">
              {/* Simulated Page Content */}
              <div className="h-7 w-44 bg-white/[0.06] rounded-lg mb-4 animate-pulse" />
              <div className="h-3 w-full bg-white/[0.03] rounded mb-2" />
              <div className="h-3 w-3/4 bg-white/[0.03] rounded mb-6" />

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="h-20 bg-white/[0.02] rounded-xl border border-white/[0.04]" />
                <div className="h-20 bg-white/[0.02] rounded-xl border border-white/[0.04]" />
              </div>

              <div className="h-3 w-full bg-white/[0.03] rounded mb-2" />
              <div className="h-3 w-5/6 bg-white/[0.03] rounded mb-2" />
              <div className="h-3 w-2/3 bg-white/[0.03] rounded mb-6" />

              <div className="h-28 bg-white/[0.02] rounded-xl border border-white/[0.04]" />
            </div>
          </div>

          {/* AI Sidebar */}
          {aiSidebarOpen && (
            <div className="w-72 bg-black/50 border-l border-white/[0.06] p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-4 h-4 text-quantum-400" />
                <span className="font-bold text-xs tracking-tight">Q-AI Assistant</span>
                <span className="ml-auto text-[9px] text-green-400 font-mono bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/10">On-Device</span>
              </div>
              <div className="flex-1 space-y-2.5">
                <div className="bg-white/[0.04] rounded-xl rounded-bl-md p-3 text-xs text-gray-400 leading-relaxed border border-white/[0.03]">
                  How can I help you navigate this page securely?
                </div>
                <div className="bg-quantum-500/[0.08] rounded-xl rounded-br-md p-3 text-xs text-gray-300 leading-relaxed ml-4 border border-quantum-500/10">
                  Summarize the security features on this site.
                </div>
                <div className="bg-white/[0.04] rounded-xl rounded-bl-md p-3 text-xs text-gray-400 leading-relaxed border border-white/[0.03]">
                  This site uses PQC TLS 1.3 with Kyber768 key exchange. All connections are quantum-safe. No trackers detected.
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 bg-black/30 rounded-xl p-2 border border-white/[0.06]">
                <div className="flex-1 text-[10px] text-gray-600 px-2">Ask Q-AI...</div>
                <Bot className="w-3.5 h-3.5 text-quantum-500" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon
          return (
            <div key={feature.title} className="glass-panel rounded-xl p-4 hover:border-quantum-500/15 transition-all duration-300 group">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-quantum-500/10 flex items-center justify-center flex-shrink-0 ring-1 ring-quantum-500/10 group-hover:bg-quantum-500/15 transition-colors">
                  <Icon className="w-4 h-4 text-quantum-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white text-[13px] mb-0.5">{feature.title}</div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
                <ShieldCheck className="w-3.5 h-3.5 text-green-500/60 flex-shrink-0 mt-0.5" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Fingerprint Resistance Meter */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Fingerprint className="w-5 h-5 text-quantum-400" />
          <h3 className="font-bold text-lg tracking-tight">Fingerprint Resistance</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Canvas', score: 98 },
            { label: 'WebGL', score: 95 },
            { label: 'AudioContext', score: 97 },
            { label: 'Font Enum', score: 99 },
          ].map((item) => (
            <div key={item.label} className="text-center group">
              <div className="w-[72px] h-[72px] rounded-full mx-auto flex items-center justify-center mb-2.5 relative">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="5" className="text-gray-800/50" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="url(#fpGrad)" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${item.score * 2.64} ${100 * 2.64}`} className="transition-all duration-1000" />
                  <defs>
                    <linearGradient id="fpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#34d399" stopOpacity="0.9" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="text-sm font-bold text-green-400 relative tabular-nums">{item.score}%</span>
              </div>
              <span className="text-[11px] text-gray-500 font-medium group-hover:text-gray-400 transition-colors">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
