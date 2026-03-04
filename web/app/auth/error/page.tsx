'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const errorMessages: Record<string, string> = {
    Configuration: 'There is a problem with the server configuration.',
    AccessDenied: 'Access denied. You do not have permission to sign in.',
    Verification: 'The verification link has expired or has already been used.',
    OAuthSignin: 'Could not start the sign-in process. Please try again.',
    OAuthCallback: 'Could not complete the sign-in process. Please try again.',
    OAuthAccountNotLinked: 'This email is already associated with another account.',
    Default: 'An unexpected authentication error occurred.',
  }

  const message = errorMessages[error || ''] || errorMessages.Default

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="p-4 rounded-full bg-red-500/10">
          <ShieldAlert className="w-10 h-10 text-red-400" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white font-outfit">
          Authentication Error
        </h1>
        <p className="text-gray-400 text-sm">{message}</p>
        {error && (
          <p className="text-xs text-gray-500 font-mono mt-2">
            Error code: {error}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Link href="/auth/login" className="btn-primary w-full text-center">
          Try again
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-quantum-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="text-center text-gray-400">Loading...</div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
