'use client'

import { useState, type FormEvent } from 'react'
import { Send, CheckCircle, AlertCircle, Loader2, Shield, Zap } from 'lucide-react'

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

export default function WaitlistForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const form = e.currentTarget
    const fd = new FormData(form)

    const payload = {
      fullName: fd.get('fullName') as string,
      companyName: fd.get('companyName') as string,
      email: fd.get('email') as string,
      industry: fd.get('industry') as string,
      expectedVolume: fd.get('expectedVolume') as string,
      useCase: fd.get('useCase') as string || undefined,
      couponCode: fd.get('couponCode') as string || undefined,
      ndaConsent: fd.get('ndaConsent') === 'on',
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
            <h3 className="text-3xl font-bold text-white mb-4 font-display">You're on the list!</h3>
            <p className="text-gray-300 text-lg">
              We'll contact you within 48 hours with next steps. Check your email for a confirmation.
            </p>
          </div>
        </div>
      </section>
    )
  }

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
          {status === 'error' && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              {errorMsg}
            </div>
          )}
          {status === 'duplicate' && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-quantum-500/10 border border-quantum-500/30 text-quantum-300 text-sm">
              <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
              You're already on the waitlist! We'll be in touch soon.
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-200 mb-2">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text" id="fullName" name="fullName" required minLength={2} maxLength={100}
                placeholder="Jane Smith"
                className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-quantum-500 focus:ring-2 focus:ring-quantum-500/20 transition"
              />
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
            <input
              type="email" id="email" name="email" required maxLength={255}
              placeholder="jane@acme.com"
              className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-quantum-500 focus:ring-2 focus:ring-quantum-500/20 transition"
            />
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
