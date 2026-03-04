'use client'

import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'

export default function VerifyRequestPage() {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="p-4 rounded-full bg-quantum-500/10">
          <Mail className="w-10 h-10 text-quantum-400" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white font-outfit">
          Check your email
        </h1>
        <p className="text-gray-400 text-sm">
          We sent a magic link to your email. Click the link to sign in.
        </p>
      </div>

      <div className="pt-2">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-quantum-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>
      </div>
    </div>
  )
}
