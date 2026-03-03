'use client'

import { useState, useEffect } from 'react'
import {
  MessageSquare, Lock, Shield, ShieldCheck, UserCircle2,
  Paperclip, Send, CheckCheck, Key, ArrowLeftRight
} from 'lucide-react'

const CONTACTS = [
  { name: 'Alice Nakamura', level: 'Quantum', status: 'online', unread: 2 },
  { name: 'Bob Eriksen', level: 'Quantum', status: 'online', unread: 0 },
  { name: 'Charlie Zhang', level: 'PQC', status: 'away', unread: 1 },
  { name: 'Diana Okafor', level: 'Quantum', status: 'offline', unread: 0 },
  { name: 'Eve Martinez', level: 'PQC', status: 'online', unread: 0 },
]

const MESSAGES = [
  {
    id: 1, from: 'Alice Nakamura', self: false, time: '14:21',
    text: 'The new firmware is ready for review. Sending the encrypted package now.',
    encrypted: true,
  },
  {
    id: 2, from: 'You', self: true, time: '14:22',
    text: 'Received. Verifying the Kyber768 signature before extracting.',
    encrypted: true,
  },
  {
    id: 3, from: 'Alice Nakamura', self: false, time: '14:24',
    text: 'Perfect. The double ratchet should have rotated keys since our last exchange.',
    encrypted: true,
  },
  {
    id: 4, from: 'You', self: true, time: '14:25',
    text: 'Confirmed, new session key is active. All clear.',
    encrypted: true,
  },
]

export default function MessengerPreview() {
  const [handshakeStep, setHandshakeStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setHandshakeStep(prev => (prev + 1) % 5)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const handshakeSteps = [
    'Generating ephemeral Kyber768 keypair...',
    'Encapsulating shared secret with peer public key...',
    'Deriving root key via HKDF-SHA256...',
    'Initializing double ratchet chain keys...',
    'Secure session established.',
  ]

  return (
    <div className="space-y-6">
      {/* Encryption Banner */}
      <div className="glass-panel rounded-2xl p-5 flex items-center gap-4 border-quantum-500/10">
        <div className="w-11 h-11 rounded-xl bg-quantum-500/15 flex items-center justify-center flex-shrink-0 ring-1 ring-quantum-500/20">
          <ShieldCheck className="w-5 h-5 text-quantum-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-sm tracking-tight">PQC Double Ratchet Encryption</h3>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            Every message is wrapped in Kyber768 double ratchet encryption with forward secrecy
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact List */}
        <div className="glass-panel rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3 px-2">
            <MessageSquare className="w-4 h-4 text-quantum-400" />
            <span className="font-bold text-xs uppercase tracking-wider text-gray-400">Contacts</span>
          </div>
          <div className="space-y-0.5">
            {CONTACTS.map((contact) => (
              <div
                key={contact.name}
                className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                  contact.name === 'Alice Nakamura'
                    ? 'bg-quantum-500/10 border border-quantum-500/15 shadow-sm shadow-quantum-500/5'
                    : 'hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <UserCircle2 className="w-9 h-9 text-gray-600" />
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-gray-900 ${
                    contact.status === 'online' ? 'bg-green-400 shadow-sm shadow-green-400/50' :
                    contact.status === 'away' ? 'bg-yellow-400' : 'bg-gray-700'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-white truncate">{contact.name}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Lock className="w-2.5 h-2.5 text-quantum-500" />
                    <span className="text-[10px] text-quantum-500 font-mono">{contact.level}</span>
                  </div>
                </div>
                {contact.unread > 0 && (
                  <div className="w-5 h-5 rounded-full bg-quantum-500 text-white text-[10px] flex items-center justify-center font-bold shadow-sm shadow-quantum-500/30">
                    {contact.unread}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2 glass-panel rounded-2xl flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCircle2 className="w-8 h-8 text-gray-500" />
              <div>
                <div className="font-medium text-white text-sm">Alice Nakamura</div>
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  Online
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <Shield className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs font-mono text-green-400">E2E Quantum</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 space-y-3 min-h-[300px]">
            {MESSAGES.map((msg) => (
              <div key={msg.id} className={`flex ${msg.self ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${
                  msg.self
                    ? 'bg-quantum-600/20 border border-quantum-500/15'
                    : 'bg-white/[0.04] border border-white/[0.06]'
                } rounded-2xl px-3.5 py-2.5 ${msg.self ? 'rounded-br-lg' : 'rounded-bl-lg'}`}>
                  <p className="text-[13px] text-gray-300 leading-relaxed">{msg.text}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 justify-end">
                    {msg.encrypted && (
                      <Lock className="w-2.5 h-2.5 text-quantum-500/70" />
                    )}
                    <span className="text-[10px] text-gray-600 font-mono tabular-nums">{msg.time}</span>
                    {msg.self && <CheckCheck className="w-3.5 h-3.5 text-quantum-400" />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 bg-black/30 rounded-xl p-1.5 border border-white/[0.06]">
              <button className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors duration-200">
                <Paperclip className="w-4 h-4 text-gray-600 hover:text-gray-400" />
              </button>
              <div className="flex-1 text-xs text-gray-600 px-1.5">Type a quantum-encrypted message...</div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-quantum-500/[0.08]">
                <Lock className="w-2.5 h-2.5 text-quantum-500" />
                <span className="text-[9px] text-quantum-500 font-mono font-medium tracking-wider">PQC</span>
              </div>
              <button className="p-2 bg-quantum-600 hover:bg-quantum-500 rounded-lg transition-all duration-200 shadow-sm shadow-quantum-500/20 hover:shadow-quantum-500/30">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Exchange Animation */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Key className="w-5 h-5 text-quantum-400" />
          <h3 className="font-bold text-lg">Kyber768 Key Exchange</h3>
          <span className="ml-auto flex items-center gap-1 text-xs font-mono text-quantum-400">
            <ArrowLeftRight className="w-3 h-3" /> Live ratchet
          </span>
        </div>

        {/* Handshake Steps */}
        <div className="space-y-2">
          {handshakeSteps.map((step, i) => (
            <div key={i} className={`flex items-center gap-3 py-1.5 px-3 rounded-lg transition-all duration-500 ${
              i === handshakeStep ? 'bg-quantum-500/[0.06]' : ''
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono flex-shrink-0 transition-all duration-500 ${
                i < handshakeStep
                  ? 'bg-green-500/15 text-green-400 ring-1 ring-green-500/25'
                  : i === handshakeStep
                  ? 'bg-quantum-500/20 text-quantum-300 ring-1 ring-quantum-500/30 animate-pulse'
                  : 'bg-gray-800/40 text-gray-700 ring-1 ring-white/[0.04]'
              }`}>
                {i < handshakeStep ? '\u2713' : i + 1}
              </div>
              <span className={`text-xs font-mono transition-colors duration-500 ${
                i < handshakeStep ? 'text-green-400/80' :
                i === handshakeStep ? 'text-quantum-300' : 'text-gray-700'
              }`}>
                {step}
              </span>
            </div>
          ))}
        </div>

        {/* Visual Representation */}
        <div className="mt-6 flex items-center justify-center gap-6">
          <div className="text-center">
            <div className="w-11 h-11 rounded-full bg-quantum-500/15 flex items-center justify-center mx-auto mb-1.5 ring-1 ring-quantum-500/20">
              <UserCircle2 className="w-5 h-5 text-quantum-400" />
            </div>
            <span className="text-[10px] text-gray-500 font-medium">You</span>
          </div>
          <div className="flex-1 max-w-[200px] h-px bg-gradient-to-r from-quantum-500/50 to-green-500/50 relative">
            <div className="absolute inset-0 h-[3px] -top-[1px] bg-gradient-to-r from-quantum-500/10 to-green-500/10 blur-sm" />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-quantum-400 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000"
              style={{ left: `${(handshakeStep / 4) * 100}%` }}
            />
          </div>
          <div className="text-center">
            <div className="w-11 h-11 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-1.5 ring-1 ring-green-500/20">
              <UserCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-[10px] text-gray-500 font-medium">Alice</span>
          </div>
        </div>
      </div>
    </div>
  )
}
