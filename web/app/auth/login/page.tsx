'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import OAuthButtons from '@/components/auth/OAuthButtons'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSending(true)
    try {
      await signIn('resend', { email, callbackUrl: '/dashboard' })
    } catch {
      setSending(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Logo & Heading */}
      <div className="text-center space-y-4">
        <img
          src="/logos/Z.svg"
          alt="Zipminator"
          className="h-12 w-auto mx-auto"
        />
        <h1 className="text-2xl font-bold text-white font-outfit">
          Sign in to Zipminator
        </h1>
        <p className="text-gray-400 text-sm">
          Quantum-secure encryption for everyone
        </p>
      </div>

      {/* OAuth Providers */}
      <OAuthButtons />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-gray-900 px-3 text-gray-400">
            or continue with email
          </span>
        </div>
      </div>

      {/* Magic Link Form */}
      {sent ? (
        <div className="text-center py-4">
          <p className="text-quantum-400 font-medium">Magic link sent!</p>
          <p className="text-gray-400 text-sm mt-1">Check your inbox for {email}</p>
        </div>
      ) : (
        <form onSubmit={handleMagicLink} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-quantum-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={sending || !email}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send magic link'
            )}
          </button>
        </form>
      )}

      {/* Back to home */}
      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-quantum-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>
    </div>
  )
}
