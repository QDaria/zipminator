'use client'

import dynamic from 'next/dynamic'

const SB1PitchDeck = dynamic(
  () => import('@/components/pitch/SB1PitchDeck').then(mod => ({ default: mod.SB1PitchDeck })),
  { ssr: false }
)

export default function SpareBank1PitchPage() {
  return <SB1PitchDeck />
}
