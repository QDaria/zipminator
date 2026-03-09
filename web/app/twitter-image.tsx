import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Zipminator-PQC - Post-Quantum Encryption for Everyone'
export const size = { width: 1200, height: 600 }
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
        {/* Teal glow accent */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 350,
            height: 350,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,206,209,0.15) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        {/* Large Z lettermark */}
        <div
          style={{
            fontSize: 120,
            fontWeight: 900,
            color: '#00CED1',
            marginBottom: 12,
            display: 'flex',
            letterSpacing: '-4px',
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
          Zipminator
        </div>
        {/* Tagline */}
        <div
          style={{
            fontSize: 24,
            color: '#00CED1',
            display: 'flex',
          }}
        >
          Post-Quantum Encryption for Everyone
        </div>
        {/* By QDaria */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
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
