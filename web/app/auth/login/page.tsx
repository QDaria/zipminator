import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import OAuthButtonsWrapper from './OAuthButtonsWrapper'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
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
      <OAuthButtonsWrapper />

      {/* Back to home */}
      <div className="text-center pt-4">
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
