import Hero from '@/components/Hero'
import ProviderShowcase from '@/components/ProviderShowcase'
import TrustSignals from '@/components/TrustSignals'
import KeyFeatures from '@/components/KeyFeatures'
import HowItWorks from '@/components/HowItWorks'
import StatsBar from '@/components/StatsBar'
import UseCases from '@/components/UseCases'
import CTA from '@/components/CTA'

export default function Home() {
  return (
    <>
      <Hero />
      <ProviderShowcase />
      <TrustSignals />
      <KeyFeatures />
      <HowItWorks />
      <StatsBar />
      <UseCases />
      <CTA />
    </>
  )
}
