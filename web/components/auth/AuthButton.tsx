'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import UserMenu from '@/components/auth/UserMenu'

export default function AuthButton() {
  const { status } = useSession()

  if (status === 'loading') return null

  if (status === 'authenticated') {
    return <UserMenu />
  }

  return (
    <Link
      href="/auth/login"
      className="btn-primary text-sm px-4 py-2"
    >
      Sign In
    </Link>
  )
}
