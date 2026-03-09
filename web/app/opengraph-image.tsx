import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Zipminator-PQC - Post-Quantum Encryption for Everyone'
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
          background: 'linear-gradient(145deg, #0a0a0f 0%, #0d1117 50%, #0a0a0f 100%)',
          fontFamily: 'Inter, system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle grid overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              'linear-gradient(rgba(0,206,209,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,206,209,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            display: 'flex',
          }}
        />
        {/* Teal glow accent */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,206,209,0.15) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        {/* Large Z lettermark */}
        <div
          style={{
            fontSize: 140,
            fontWeight: 900,
            color: '#00CED1',
            marginBottom: 16,
            display: 'flex',
            letterSpacing: '-4px',
          }}
        >
          Z
        </div>
        {/* Title */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: 16,
            display: 'flex',
          }}
        >
          Zipminator
        </div>
        {/* Tagline */}
        <div
          style={{
            fontSize: 26,
            color: '#00CED1',
            maxWidth: 700,
            textAlign: 'center',
            display: 'flex',
          }}
        >
          Post-Quantum Encryption for Everyone
        </div>
        {/* Subtitle */}
        <div
          style={{
            fontSize: 16,
            color: '#6b7280',
            marginTop: 20,
            display: 'flex',
            gap: 16,
          }}
        >
          <span>NIST FIPS 203</span>
          <span style={{ color: '#00CED1' }}>|</span>
          <span>Kyber768</span>
          <span style={{ color: '#00CED1' }}>|</span>
          <span>Quantum Entropy</span>
        </div>
        {/* By QDaria */}
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            fontSize: 14,
            color: '#4b5563',
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
