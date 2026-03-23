'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const SB1PitchDeck = dynamic(
  () => import('@/components/pitch/SB1PitchDeck').then(mod => ({ default: mod.SB1PitchDeck })),
  { ssr: false }
)

const PASS = 'zip2026sp1'
const STORAGE_KEY = 'sb1-pitch-auth'

export default function SpareBank1PitchPage() {
  const [authed, setAuthed] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === '1') setAuthed(true)
  }, [])

  if (authed) return <SB1PitchDeck />

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input === PASS) {
      sessionStorage.setItem(STORAGE_KEY, '1')
      setAuthed(true)
    } else {
      setError(true)
      setInput('')
    }
  }

  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: '100vw',
        height: '100vh',
        background: '#020817',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center gap-5 p-10 rounded-2xl"
        style={{
          background: 'rgba(34,211,238,0.04)',
          border: '1px solid rgba(34,211,238,0.2)',
          boxShadow: '0 0 40px rgba(34,211,238,0.08)',
          minWidth: 340,
        }}
      >
        <div className="flex flex-col items-center gap-1">
          <span
            className="text-xs font-mono tracking-widest uppercase text-red-400"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            KONFIDENSIELT
          </span>
          <h1
            className="text-2xl font-semibold text-slate-100"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            QDaria × SpareBank 1
          </h1>
          <p className="text-slate-400 text-sm">Skriv inn passord for tilgang</p>
        </div>

        <input
          type="password"
          value={input}
          onChange={e => { setInput(e.target.value); setError(false) }}
          autoFocus
          placeholder="Passord"
          className="w-full px-4 py-3 rounded-lg text-sm text-slate-100 placeholder-slate-500 outline-none"
          style={{
            background: 'rgba(15,22,41,0.8)',
            border: error
              ? '1.5px solid rgba(251,113,133,0.6)'
              : '1px solid rgba(34,211,238,0.2)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        />

        {error && (
          <p
            className="text-rose-400 text-xs font-mono"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Feil passord. Prov igjen.
          </p>
        )}

        <button
          type="submit"
          className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: 'rgba(34,211,238,0.9)',
            color: '#020817',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Logg inn
        </button>
      </form>
    </div>
  )
}
