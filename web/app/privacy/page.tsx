import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | Zipminator',
  description: 'Zipminator privacy policy — how we handle your data with post-quantum encryption.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-300">
      <div className="container mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-12">Last updated: March 15, 2026</p>

        <div className="space-y-10 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              QDaria AS (&quot;QDaria&quot;, &quot;we&quot;, &quot;us&quot;) operates the Zipminator application
              and website at <Link href="https://www.zipminator.zip" className="text-cyan-400 hover:underline">www.zipminator.zip</Link>.
              This Privacy Policy explains how we collect, use, and protect your information when you use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <h3 className="text-lg font-medium text-white mb-2">2.1 Account Information</h3>
            <p className="mb-3">
              When you create an account, we collect your email address and display name. If you sign in via
              OAuth (GitHub, Google, LinkedIn), we receive your public profile information from those providers.
            </p>
            <h3 className="text-lg font-medium text-white mb-2">2.2 Usage Data</h3>
            <p className="mb-3">
              We collect anonymized usage analytics (page views, feature usage) to improve the product. We do not
              track individual user behavior across sessions.
            </p>
            <h3 className="text-lg font-medium text-white mb-2">2.3 Encrypted Content</h3>
            <p>
              Zipminator encrypts your files, messages, and communications using post-quantum cryptography
              (NIST FIPS 203 ML-KEM-768). <strong className="text-white">We cannot access your encrypted content.</strong> Encryption
              keys are generated and stored locally on your device; they never leave your device unencrypted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>To provide and maintain the Zipminator service</li>
              <li>To authenticate your identity and manage your account</li>
              <li>To send service-related notifications (security alerts, updates)</li>
              <li>To improve and optimize the application</li>
              <li>To respond to support requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Data Sharing</h2>
            <p>
              We do not sell, rent, or share your personal information with third parties for marketing purposes.
              We may share data with service providers who assist in operating the platform (hosting, analytics)
              under strict data processing agreements. We will disclose information if required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Security</h2>
            <p>
              All data in transit is protected by TLS 1.3. All data at rest is encrypted using
              ML-KEM-768 (NIST FIPS 203). Our Rust cryptographic engine is memory-safe, constant-time,
              and verified against NIST Known Answer Test vectors. Server infrastructure uses encrypted
              storage with access controls.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Data Retention</h2>
            <p>
              We retain account information for as long as your account is active. You may request deletion
              of your account and associated data at any time by contacting{' '}
              <a href="mailto:privacy@qdaria.com" className="text-cyan-400 hover:underline">privacy@qdaria.com</a>.
              Encrypted content stored locally on your device is under your control.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights</h2>
            <p className="mb-3">
              Under GDPR and applicable Norwegian data protection law, you have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Access, correct, or delete your personal data</li>
              <li>Export your data in a portable format</li>
              <li>Withdraw consent at any time</li>
              <li>Lodge a complaint with the Norwegian Data Protection Authority (Datatilsynet)</li>
            </ul>
          </section>

          <section id="cookies">
            <h2 className="text-xl font-semibold text-white mb-3">8. Cookies</h2>
            <p>
              We use essential cookies for authentication and session management. We use anonymized analytics
              cookies (Google Analytics) to understand usage patterns. You can disable non-essential cookies
              in your browser settings. The Zipminator mobile and desktop apps do not use cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Children&apos;s Privacy</h2>
            <p>
              Zipminator is not intended for children under 16. We do not knowingly collect personal
              information from children under 16.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes
              via email or in-app notification. Continued use of Zipminator after changes constitutes
              acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Contact</h2>
            <p>
              For privacy-related inquiries, contact us at{' '}
              <a href="mailto:privacy@qdaria.com" className="text-cyan-400 hover:underline">privacy@qdaria.com</a>.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              QDaria AS, Oslo, Norway
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
