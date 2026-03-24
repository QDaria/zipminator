import { Fraunces, JetBrains_Mono, DM_Sans } from 'next/font/google'

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' })

export const metadata = {
  title: 'Investor Deck | Zipminator-PQC by QDaria',
  description:
    'Post-quantum encryption super-app investor presentation. NIST FIPS 203 Kyber768, 156-qubit QRNG.',
}

export default function ZiminatorInvestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className={`h-screen overflow-hidden ${fraunces.variable} ${jetbrains.variable} ${dmSans.variable}`}
      style={{ background: '#020817' }}
    >
      <style>{`
        #site-nav, #site-footer { display: none !important; }
      `}</style>
      {children}
    </div>
  )
}
