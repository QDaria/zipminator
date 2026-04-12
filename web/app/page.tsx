import Hero from '@/components/Hero'
import ProviderShowcase from '@/components/ProviderShowcase'
import SS7Killer from '@/components/SS7Killer'
import SuperAppShowcase from '@/components/SuperAppShowcase'
import DeviceShield from '@/components/DeviceShield'
import KeyFeatures from '@/components/KeyFeatures'
import EncryptionStack from '@/components/EncryptionStack'
import ProjectScale from '@/components/ProjectScale'
import ReleaseHighlights from '@/components/ReleaseHighlights'
import StatsBar from '@/components/StatsBar'
import WorldFirst from '@/components/WorldFirst'
import IndustryImpact from '@/components/IndustryImpact'
import HowItWorks from '@/components/HowItWorks'
import TrustSignals from '@/components/TrustSignals'
import UseCases from '@/components/UseCases'
import CTA from '@/components/CTA'
import WaitlistForm from '@/components/WaitlistForm'

export default function Home() {
  return (
    <>
      <Hero />
      <WorldFirst />
      <ReleaseHighlights />
      <ProjectScale />
      <ProviderShowcase />
      <SS7Killer />
      <SuperAppShowcase />
      <DeviceShield />
      <KeyFeatures />
      <EncryptionStack />
      <StatsBar />
      <IndustryImpact />
      <TrustSignals />
      <UseCases />
      <HowItWorks />
      <WaitlistForm />
      <CTA />
    </>
  )
}
