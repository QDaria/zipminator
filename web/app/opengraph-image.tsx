import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Zipminator-PQC - Quantum-Secure Encryption Platform'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a3a 40%, #0a0a2a 100%)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Large Z letter in quantum purple */}
        <div
          style={{
            fontSize: 120,
            fontWeight: 800,
            color: '#a78bfa',
            marginBottom: 20,
            display: 'flex',
          }}
        >
          Z
        </div>
        {/* Title */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: 12,
            display: 'flex',
          }}
        >
          Zipminator-PQC
        </div>
        {/* Tagline */}
        <div
          style={{
            fontSize: 24,
            color: '#9ca3af',
            maxWidth: 700,
            textAlign: 'center',
            display: 'flex',
          }}
        >
          World&apos;s First Post-Quantum Encryption Super-App
        </div>
        {/* By QDaria */}
        <div
          style={{
            fontSize: 18,
            color: '#7c3aed',
            marginTop: 24,
            display: 'flex',
          }}
        >
          by QDaria
        </div>
      </div>
    ),
    { ...size }
  )
}
