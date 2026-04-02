import { Fraunces, JetBrains_Mono, DM_Sans } from 'next/font/google'

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' })

export const metadata = {
  title: 'IP Valuation Blueprint | QDaria Quantum',
  description: 'Three-patent PQC portfolio analysis: complementarity, regulatory moat, valuation framework',
}

export default function BlueprintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`min-h-screen overflow-y-auto ${fraunces.variable} ${jetbrains.variable} ${dmSans.variable}`}
      style={{ background: '#020817' }}
    >
      <style>{`
        #site-nav, #site-footer { display: none !important; }
        @media print {
          * { background: white !important; color: #111 !important; }
          [data-blueprint-sidebar], [data-scenario-toggle] { display: none !important; }
          * { animation: none !important; transition: none !important; }
          [data-blueprint-section] { page-break-before: always; }
          [data-blueprint-section]:first-of-type { page-break-before: avoid; }
          .recharts-responsive-container { width: 100% !important; }
        }
      `}</style>
      {children}
    </div>
  )
}
