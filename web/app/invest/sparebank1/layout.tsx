import { Fraunces, JetBrains_Mono, DM_Sans } from 'next/font/google'

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' })

export const metadata = {
  title: 'SpareBank 1 Pitch | QDaria Quantum',
  description: 'Quantum-safe banking pitch for SpareBank 1 Markets TMT analysts',
}

export default function SpareBank1Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className={`h-screen overflow-hidden ${fraunces.variable} ${jetbrains.variable} ${dmSans.variable}`}
      style={{ background: '#020817' }}
    >
      {children}
    </div>
  )
}
