import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | Zipminator',
  description: 'Zipminator terms of service — usage terms for our post-quantum encryption platform.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-300">
      <div className="container mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-12">Last updated: March 15, 2026</p>

        <div className="space-y-10 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Zipminator (&quot;the Service&quot;), operated by QDaria AS (&quot;QDaria&quot;,
              &quot;we&quot;, &quot;us&quot;), you agree to be bound by these Terms of Service. If you do not agree,
              do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p>
              Zipminator is a post-quantum cryptography (PQC) platform that provides encrypted communications,
              file storage, and data protection using NIST FIPS 203 (ML-KEM-768) algorithms. The Service
              includes mobile, desktop, and web applications.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Account Registration</h2>
            <p>
              You must provide accurate information when creating an account. You are responsible for
              maintaining the security of your account credentials and encryption keys. QDaria cannot
              recover lost encryption keys; loss of your keys means permanent loss of access to encrypted data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Acceptable Use</h2>
            <p className="mb-3">You agree not to use Zipminator to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Violate any applicable law or regulation</li>
              <li>Transmit malware, viruses, or destructive code</li>
              <li>Attempt to gain unauthorized access to other users&apos; data or systems</li>
              <li>Engage in activity that disrupts or degrades the Service</li>
              <li>Circumvent security measures or encryption mechanisms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Encryption and Data Ownership</h2>
            <p>
              You retain full ownership of all data you encrypt using Zipminator. Encryption keys are generated
              and stored on your device; QDaria does not have access to your encryption keys or decrypted content.
              You are solely responsible for backing up your keys and encrypted data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Intellectual Property</h2>
            <p>
              The Zipminator software, branding, and documentation are the property of QDaria AS.
              The core cryptographic engine is licensed under Apache-2.0. The application layer is proprietary.
              You may not reverse-engineer, decompile, or create derivative works from the proprietary portions
              of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Service Availability</h2>
            <p>
              We aim to provide reliable service but do not guarantee 100% uptime. We may perform
              maintenance, updates, or modifications that temporarily affect availability. We will
              provide reasonable notice for planned downtime.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by Norwegian law, QDaria shall not be liable for any indirect,
              incidental, special, or consequential damages arising from your use of the Service. Our total
              liability shall not exceed the amount you paid for the Service in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Disclaimer of Warranties</h2>
            <p>
              The Service is provided &quot;as is&quot; without warranties of any kind. While Zipminator
              implements NIST FIPS 203 algorithms verified against Known Answer Test vectors, we do not
              warrant that the Service will be error-free or that encryption will be unbreakable under
              all future computational advances.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Termination</h2>
            <p>
              You may terminate your account at any time. We may suspend or terminate your access if you
              violate these Terms. Upon termination, your right to use the Service ceases immediately.
              Locally stored encrypted data remains on your device.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Governing Law</h2>
            <p>
              These Terms are governed by Norwegian law. Any disputes shall be resolved in the courts
              of Oslo, Norway.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. Material changes will be communicated via email
              or in-app notification at least 30 days before taking effect. Continued use after changes
              constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">13. Contact</h2>
            <p>
              For questions about these Terms, contact us at{' '}
              <a href="mailto:legal@qdaria.com" className="text-cyan-400 hover:underline">legal@qdaria.com</a>.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              QDaria AS, Oslo, Norway
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 text-sm text-gray-500">
          <p>
            See also our <Link href="/privacy" className="text-cyan-400 hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
