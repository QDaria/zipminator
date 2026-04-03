import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Investor Deck | Zipminator-PQC by QDaria',
  description:
    'Post-quantum encryption super-app investor presentation. NIST FIPS 203 Kyber768, 156-qubit QRNG, 300K+ LOC production codebase.',
}

export default function InvestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-y-auto">
      {children}
    </div>
  )
}
