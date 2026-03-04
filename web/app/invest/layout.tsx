import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Investor Deck | Zipminator-PQC by QDaria',
  description:
    'Post-quantum encryption super-app investor presentation. NIST FIPS 203 Kyber768, 156-qubit QRNG, 870K+ LOC production codebase.',
}

export default function InvestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen overflow-hidden bg-gray-950 text-white">
      {children}
    </div>
  )
}
