'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { Send, CheckCircle, AlertCircle, Loader2, Shield, Zap, Lock } from 'lucide-react'

const INDUSTRIES = [
  { value: 'banking', label: 'Banking & Finance' },
  { value: 'defense', label: 'Defense & Government' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'telecom', label: 'Telecommunications' },
  { value: 'infrastructure', label: 'Critical Infrastructure' },
  { value: 'crypto', label: 'Crypto & Blockchain' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'government', label: 'Government' },
  { value: 'other', label: 'Other' },
]

const VOLUMES = [
  { value: '<10k', label: 'Under 10K ops/month' },
  { value: '10k-100k', label: '10K - 100K ops/month' },
  { value: '100k-1m', label: '100K - 1M ops/month' },
  { value: '1m+', label: '1M+ ops/month' },
]

type Status = 'idle' | 'loading' | 'success' | 'error' | 'duplicate'

const oauthProviders = [
  {
    id: 'google',
    name: 'Google',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.77.01-.54z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    ),
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
]

export default function WaitlistForm() {
  const { data: session, status: authStatus } = useSession()
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (authStatus === 'authenticated' && session?.user) {
      if (session.user.name) setFullName(session.user.name)
      if (session.user.email) setEmail(session.user.email)
    }
  }, [authStatus, session])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const form = e.currentTarget
    const fd = new FormData(form)

    const payload = {
      fullName: fullName || fd.get('fullName') as string,
      companyName: fd.get('companyName') as string,
      email: email || fd.get('email') as string,
      industry: fd.get('industry') as string,
      expectedVolume: fd.get('expectedVolume') as string,
      useCase: fd.get('useCase') as string || undefined,
      couponCode: fd.get('couponCode') as string || undefined,
      ndaConsent: fd.get('ndaConsent') === 'on',
      userId: session?.user?.id || undefined,
    }

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setStatus('success')
        form.reset()
      } else if (data.code === 'DUPLICATE_EMAIL') {
        setStatus('duplicate')
      } else {
        setErrorMsg(data.error || 'Something went wrong. Please try again.')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Unable to connect. Please check your connection or email mo@qdaria.com')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <section id="waitlist" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-quantum-900/20 via-transparent to-transparent" />
        <div className="container-custom relative">
          <div className="max-w-2xl mx-auto text-center card-quantum p-12">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
            <h3 className="text-3xl font-bold text-white mb-4 font-display">You&apos;re on the list!</h3>
            <p className="text-gray-300 text-lg">
              We&apos;ll contact you within 48 hours with next steps. Check your email for a confirmation.
            </p>
          </div>
        </div>
      </section>
    )
  }

  // Loading state
  if (authStatus === 'loading') {
    return (
      <section id="waitlist" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-quantum-900/20 via-transparent to-transparent" />
        <div className="container-custom relative">
          <div className="max-w-2xl mx-auto text-center card-quantum p-12">
            <Loader2 className="w-8 h-8 text-quantum-400 mx-auto animate-spin" />
          </div>
        </div>
      </section>
    )
  }

  // Unauthenticated: show sign-in card
  if (authStatus !== 'authenticated') {
    return (
      <section id="waitlist" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-quantum-900/20 via-transparent to-transparent" />
        <div className="container-custom relative">
          <div className="text-center mb-12">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-quantum-500/20 text-quantum-300 border border-quantum-500/50 mb-4">
              <span className="w-2 h-2 bg-quantum-400 rounded-full mr-2 animate-pulse" />
              Enterprise Beta — Q2 2026
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-display">
              Join the <span className="gradient-text">Beta Program</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Be among the first to deploy quantum-safe encryption. Beta participants receive priority onboarding,
              early access pricing locked for 12 months, and direct engineering support.
            </p>
          </div>

          {/* Benefits badges */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {[
              { icon: Shield, text: 'Priority Onboarding' },
              { icon: Zap, text: 'Locked-In Pricing' },
              { icon: CheckCircle, text: 'Direct Engineering Support' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300">
                <Icon className="w-4 h-4 text-quantum-400" />
                {text}
              </div>
            ))}
          </div>

          {/* Sign-in card */}
          <div className="max-w-md mx-auto card-quantum p-8 text-center">
            <Shield className="w-12 h-12 text-quantum-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2 font-display">Sign in to join</h3>
            <p className="text-gray-400 mb-6 text-sm">
              Your name and email will be filled automatically
            </p>

            <div className="space-y-3">
              {oauthProviders.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => signIn(provider.id, { callbackUrl: '/#waitlist' })}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-white/10 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-all duration-200 font-medium"
                >
                  {provider.icon}
                  Continue with {provider.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Authenticated: show form with auto-filled fields
  return (
    <section id="waitlist" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-quantum-900/20 via-transparent to-transparent" />
      <div className="container-custom relative">
        <div className="text-center mb-12">
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-quantum-500/20 text-quantum-300 border border-quantum-500/50 mb-4">
            <span className="w-2 h-2 bg-quantum-400 rounded-full mr-2 animate-pulse" />
            Enterprise Beta — Q2 2026
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-display">
            Join the <span className="gradient-text">Beta Program</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Be among the first to deploy quantum-safe encryption. Beta participants receive priority onboarding,
            early access pricing locked for 12 months, and direct engineering support.
          </p>
        </div>

        {/* Benefits badges */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {[
            { icon: Shield, text: 'Priority Onboarding' },
            { icon: Zap, text: 'Locked-In Pricing' },
            { icon: CheckCircle, text: 'Direct Engineering Support' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300">
              <Icon className="w-4 h-4 text-quantum-400" />
              {text}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto card-quantum p-8 space-y-6">
          {/* Signed-in badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-quantum-500/10 border border-quantum-500/30 text-quantum-300 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Signed in as {session.user?.email}
          </div>

          {status === 'error' && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              {errorMsg}
            </div>
          )}
          {status === 'duplicate' && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-quantum-500/10 border border-quantum-500/30 text-quantum-300 text-sm">
              <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
              You&apos;re already on the waitlist! We&apos;ll be in touch soon.
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-200 mb-2">
                Full Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text" id="fullName" name="fullName" required minLength={2} maxLength={100}
                  placeholder="Jane Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  readOnly={!!session?.user?.name}
                  className={`w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-quantum-500 focus:ring-2 focus:ring-quantum-500/20 transition ${session?.user?.name ? 'bg-gray-800/60 text-gray-300' : ''}`}
                />
                {session?.user?.name && <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />}
              </div>
            </div>
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-200 mb-2">
                Company <span className="text-red-400">*</span>
              </label>
              <input
                type="text" id="companyName" name="companyName" required minLength={2} maxLength={100}
                placeholder="Acme Corp"
                className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-quantum-500 focus:ring-2 focus:ring-quantum-500/20 transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
              Work Email <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="email" id="email" name="email" required maxLength={255}
                placeholder="jane@acme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={!!session?.user?.email}
                className={`w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-quantum-500 focus:ring-2 focus:ring-quantum-500/20 transition ${session?.user?.email ? 'bg-gray-800/60 text-gray-300' : ''}`}
              />
              {session?.user?.email && <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-200 mb-2">
                Industry <span className="text-red-400">*</span>
              </label>
              <select
                id="industry" name="industry" required
                className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-quantum-500 focus:ring-2 focus:ring-quantum-500/20 transition"
              >
                <option value="">Select industry...</option>
                {INDUSTRIES.map(i => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="expectedVolume" className="block text-sm font-medium text-gray-200 mb-2">
                Expected Volume <span className="text-red-400">*</span>
              </label>
              <select
                id="expectedVolume" name="expectedVolume" required
                className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-quantum-500 focus:ring-2 focus:ring-quantum-500/20 transition"
              >
                <option value="">Select volume...</option>
                {VOLUMES.map(v => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="useCase" className="block text-sm font-medium text-gray-200 mb-2">
              Use Case <span className="text-gray-500">(optional)</span>
            </label>
            <textarea
              id="useCase" name="useCase" rows={3} maxLength={500}
              placeholder="Describe how you plan to use quantum-safe encryption..."
              className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-quantum-500 focus:ring-2 focus:ring-quantum-500/20 transition resize-none"
            />
          </div>

          <div>
            <label htmlFor="couponCode" className="block text-sm font-medium text-gray-200 mb-2">
              Coupon Code <span className="text-gray-500">(optional)</span>
            </label>
            <input
              type="text" id="couponCode" name="couponCode" maxLength={50}
              placeholder="BETA2026"
              className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-quantum-500 focus:ring-2 focus:ring-quantum-500/20 transition font-mono uppercase"
            />
            <p className="text-sm text-gray-500 mt-1">
              Follow us on LinkedIn for exclusive early access codes.
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox" name="ndaConsent" required
              className="mt-1 h-4 w-4 rounded border-white/20 bg-gray-900/50 text-quantum-500 focus:ring-quantum-500/20"
            />
            <span className="text-sm text-gray-300">
              I agree to sign an NDA for beta testing and understand that early access is subject to availability.
              <span className="text-red-400 ml-1">*</span>
            </span>
          </label>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Join the Beta Waitlist
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  )
}
