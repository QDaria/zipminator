'use client'

import { useState, useEffect } from 'react'
import {
  Phone, PhoneCall, Wifi, WifiOff, Shield, Lock, Globe,
  Signal, Server, CheckCircle2, MapPin
} from 'lucide-react'

const VPN_SERVERS = [
  { city: 'Oslo', country: 'Norway', ping: 8, load: 23 },
  { city: 'Zurich', country: 'Switzerland', ping: 14, load: 41 },
  { city: 'Reykjavik', country: 'Iceland', ping: 32, load: 18 },
  { city: 'Singapore', country: 'Singapore', ping: 58, load: 55 },
  { city: 'Tokyo', country: 'Japan', ping: 72, load: 37 },
]

export default function VoipVpnPanel() {
  const [vpnActive, setVpnActive] = useState(true)
  const [selectedServer, setSelectedServer] = useState(0)
  const [bandwidth, setBandwidth] = useState(142.5)
  const [callDuration, setCallDuration] = useState(0)
  const [inCall, setInCall] = useState(false)

  useEffect(() => {
    const iv = setInterval(() => setBandwidth(prev => Math.max(80, Math.min(200, prev + (Math.random() - 0.5) * 20))), 1000)
    return () => clearInterval(iv)
  }, [])
  useEffect(() => {
    if (!inCall) return
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [inCall])

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="space-y-6">
      {/* SS7 Protection Banner */}
      <div className="glass-panel rounded-2xl p-5 border-l-[3px] border-l-quantum-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-60 h-60 bg-quantum-500/[0.03] rounded-full blur-[60px] -translate-y-1/2 translate-x-1/3" />
        <div className="relative flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-quantum-500/15 flex items-center justify-center flex-shrink-0 ring-1 ring-quantum-500/20">
            <Shield className="w-5 h-5 text-quantum-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm tracking-tight">SS7 Intercept Protection Active</h3>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Calls protected by PQ-SRTP cannot be intercepted via SS7 vulnerabilities or IMSI catchers
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VoIP Call Interface */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-quantum-400" />
              <h3 className="font-bold text-lg">Quantum VoIP</h3>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <Lock className="w-3 h-3 text-green-400" />
              <span className="text-xs font-mono text-green-400">PQ-SRTP Active</span>
            </div>
          </div>

          {/* Call Display */}
          <div className="bg-black/30 rounded-2xl p-8 text-center border border-white/[0.04] mb-5 relative overflow-hidden">
            {inCall && (
              <div className="absolute inset-0 bg-green-500/[0.03] animate-pulse" />
            )}
            <div className="relative">
              {inCall ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4 ring-2 ring-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                    <PhoneCall className="w-9 h-9 text-green-400" />
                  </div>
                  <div className="text-lg font-bold text-white mb-0.5 tracking-tight">Bob Eriksen</div>
                  <div className="text-sm text-green-400 font-mono mb-2 tabular-nums">{formatDuration(callDuration)}</div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] text-gray-500 bg-black/30 rounded-full px-3 py-1 border border-white/[0.04]">
                    <Lock className="w-2.5 h-2.5 text-quantum-500" />
                    <span className="font-mono">Kyber768 + AES-256-GCM</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-gray-800/40 flex items-center justify-center mx-auto mb-4 ring-1 ring-white/[0.06]">
                    <Phone className="w-9 h-9 text-gray-600" />
                  </div>
                  <div className="text-base text-gray-500 mb-0.5">No active call</div>
                  <div className="text-xs text-gray-600">All calls use PQ-SRTP encryption</div>
                </>
              )}
            </div>
          </div>

          {/* Call Button */}
          <button
            onClick={() => {
              if (inCall) {
                setInCall(false)
                setCallDuration(0)
              } else {
                setInCall(true)
              }
            }}
            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
              inCall
                ? 'bg-red-600/90 hover:bg-red-500 shadow-lg shadow-red-500/15 ring-1 ring-red-500/20'
                : 'bg-green-600/90 hover:bg-green-500 shadow-lg shadow-green-500/15 ring-1 ring-green-500/20'
            }`}
          >
            {inCall ? (
              <>
                <Phone className="w-4 h-4" />
                End Secure Call
              </>
            ) : (
              <>
                <PhoneCall className="w-4 h-4" />
                Start Secure Call
              </>
            )}
          </button>

          {/* Call Stats */}
          <div className="grid grid-cols-3 gap-2.5 mt-4">
            <div className="bg-black/20 rounded-xl p-3 text-center border border-white/[0.04]">
              <div className="text-[10px] text-gray-600 mb-1 uppercase tracking-wider font-medium">Latency</div>
              <div className="font-mono text-sm text-white tabular-nums">{VPN_SERVERS[selectedServer].ping}ms</div>
            </div>
            <div className="bg-black/20 rounded-xl p-3 text-center border border-white/[0.04]">
              <div className="text-[10px] text-gray-600 mb-1 uppercase tracking-wider font-medium">Bandwidth</div>
              <div className="font-mono text-sm text-white tabular-nums">{bandwidth.toFixed(0)} kbps</div>
            </div>
            <div className="bg-black/20 rounded-xl p-3 text-center border border-white/[0.04]">
              <div className="text-[10px] text-gray-600 mb-1 uppercase tracking-wider font-medium">Encryption</div>
              <div className="font-mono text-sm text-quantum-300">PQ-SRTP</div>
            </div>
          </div>
        </div>

        {/* VPN Panel */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-quantum-400" />
              <h3 className="font-bold text-lg">Q-VPN</h3>
            </div>
            {/* Toggle */}
            <button
              onClick={() => setVpnActive(!vpnActive)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                vpnActive ? 'bg-green-500' : 'bg-gray-700'
              }`}
            >
              <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-lg transition-transform duration-300 ${
                vpnActive ? 'translate-x-7' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Connection Status */}
          <div className={`bg-black/30 rounded-xl p-4 mb-5 border transition-all duration-300 ${
            vpnActive ? 'border-green-500/15' : 'border-white/[0.04]'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              {vpnActive ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-gray-600" />
              )}
              <span className={`font-bold text-sm ${vpnActive ? 'text-green-400' : 'text-gray-600'}`}>
                {vpnActive ? 'Connected' : 'Disconnected'}
              </span>
              {vpnActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-sm shadow-green-400/50" />
              )}
            </div>
            {vpnActive && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-gray-500">Server</span>
                  <span className="text-white font-mono">
                    {VPN_SERVERS[selectedServer].city}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-gray-500">Protocol</span>
                  <span className="text-quantum-300 font-mono">WireGuard + Kyber768</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-gray-500">IP Status</span>
                  <span className="text-green-400 font-mono">Masked</span>
                </div>
              </div>
            )}
          </div>

          {/* Server List */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Server className="w-3.5 h-3.5 text-gray-600" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Server Locations</span>
            </div>
            <div className="space-y-1">
              {VPN_SERVERS.map((server, i) => (
                <button
                  key={server.city}
                  onClick={() => setSelectedServer(i)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 text-left group ${
                    i === selectedServer
                      ? 'bg-quantum-500/10 border border-quantum-500/15 shadow-sm shadow-quantum-500/5'
                      : 'hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <MapPin className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                    i === selectedServer ? 'text-quantum-400' : 'text-gray-600 group-hover:text-gray-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-white">{server.city}</div>
                    <div className="text-[10px] text-gray-600">{server.country}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[10px] font-mono text-gray-500 tabular-nums mb-1">{server.ping}ms</div>
                    <div className="w-14 h-1 bg-gray-800/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          server.load < 30 ? 'bg-green-500/70' :
                          server.load < 60 ? 'bg-yellow-500/70' : 'bg-red-500/70'
                        }`}
                        style={{ width: `${server.load}%` }}
                      />
                    </div>
                  </div>
                  {i === selectedServer && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-quantum-400 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Network Shield */}
          <div className="bg-black/20 rounded-xl p-3.5 border border-white/[0.04] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-quantum-500/10 flex items-center justify-center flex-shrink-0">
              <Signal className="w-4 h-4 text-quantum-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white">Network Shield</div>
              <div className="text-[10px] text-gray-600">Kill switch + DNS leak protection</div>
            </div>
            <CheckCircle2 className="w-4 h-4 text-green-500/70 flex-shrink-0" />
          </div>
        </div>
      </div>
    </div>
  )
}
