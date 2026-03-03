import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Outfit } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Script from 'next/script'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Zipminator-PQC | Quantum-Secure Encryption Platform by QDaria',
  description: 'Real quantum entropy from 156-qubit IBM hardware + NIST FIPS 203 Kyber768 cryptography. Post-quantum encryption that\'s fast, secure, and easy to integrate.',
  keywords: [
    'quantum encryption',
    'post-quantum cryptography',
    'Kyber768',
    'NIST FIPS 203',
    'quantum security',
    'PQC',
    'quantum random number generator',
    'QRNG',
    'IBM Quantum',
    'quantum-safe encryption',
    'QDaria',
    'Zipminator',
  ],
  authors: [{ name: 'QDaria', url: 'https://qdaria.com' }],
  creator: 'QDaria',
  publisher: 'QDaria',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://zipminator.zip'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Zipminator-PQC | Quantum-Secure Encryption Platform by QDaria',
    description: 'Real quantum entropy from 156-qubit IBM hardware + NIST FIPS 203 Kyber768 cryptography. Post-quantum encryption that\'s fast, secure, and easy to integrate.',
    url: 'https://zipminator.zip',
    siteName: 'Zipminator-PQC',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Zipminator-PQC - Quantum-Secure Encryption Platform',
        type: 'image/png',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zipminator-PQC | Quantum-Secure Encryption Platform by QDaria',
    description: 'Real quantum entropy from 156-qubit IBM hardware + NIST FIPS 203 Kyber768 cryptography. Post-quantum encryption that\'s fast, secure, and easy to integrate.',
    images: ['/og-image.png'],
    site: '@qdaria',
    creator: '@qdaria',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
  manifest: '/manifest.json',
  // verification: {
  //   google: 'your-google-verification-code-here',
  //   yandex: 'your-yandex-verification-code-here',
  //   other: {
  //     'msvalidate.01': 'your-bing-verification-code-here',
  //   },
  // },
  category: 'technology',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#6366f1',
}

// Schema.org structured data
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'QDaria',
  url: 'https://qdaria.com',
  logo: 'https://zipminator.zip/logo.png',
  sameAs: [
    'https://github.com/qdaria',
    'https://twitter.com/qdaria',
  ],
  description: 'Quantum-secure encryption solutions for the post-quantum era',
}

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Zipminator-PQC',
  applicationCategory: 'SecurityApplication',
  operatingSystem: 'Cross-platform',
  description: 'Real quantum entropy from 156-qubit IBM hardware + NIST FIPS 203 Kyber768 cryptography. Post-quantum encryption that\'s fast, secure, and easy to integrate.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Open source with MIT and commercial licensing options',
  },
  author: {
    '@type': 'Organization',
    name: 'QDaria',
    url: 'https://qdaria.com',
  },
  softwareVersion: '1.0.0',
  featureList: [
    'NIST FIPS 203 Kyber768 encryption',
    'Real quantum entropy from IBM 156-qubit hardware',
    'Cross-platform support (Rust, Python, JavaScript)',
    'Easy integration',
    'Open source',
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        {/* Additional Meta Tags */}
        <meta name="theme-color" content="#6366f1" />
        <meta name="color-scheme" content="dark" />
        <meta name="language" content="English" />
        <link rel="canonical" href="https://zipminator.zip" />

        {/* Schema.org JSON-LD */}
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <Script
          id="software-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareSchema),
          }}
        />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${outfit.variable} font-sans bg-gray-950 text-white antialiased`}>
        <Navigation />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
