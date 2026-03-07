import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await auth()
  const username = session?.user?.name ?? 'Zipminator User'
  const starred = request.nextUrl.searchParams.get('starred') === 'true'

  if (!starred) {
    return NextResponse.json(
      { error: 'Star the repo first to get your badge' },
      { status: 400 }
    )
  }

  // Generate an SVG badge for LinkedIn sharing
  const svg = `
<svg width="600" height="314" viewBox="0 0 600 314" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#92400E"/>
      <stop offset="100%" style="stop-color:#78350F"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="600" height="314" rx="16" fill="url(#bg)"/>
  <rect x="2" y="2" width="596" height="310" rx="15" fill="none" stroke="#FF6600" stroke-width="2" opacity="0.6"/>

  <!-- Logo placeholder (Z letter) -->
  <rect x="40" y="40" width="60" height="60" rx="12" fill="#FF6600" opacity="0.9"/>
  <text x="70" y="82" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="white" text-anchor="middle">Z</text>

  <!-- Title -->
  <text x="120" y="62" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="white">Zipminator</text>
  <text x="120" y="88" font-family="Arial, sans-serif" font-size="14" fill="#FCD34D">Post-Quantum Security Platform</text>

  <!-- Divider -->
  <line x1="40" y1="120" x2="560" y2="120" stroke="#FF6600" stroke-width="1" opacity="0.4"/>

  <!-- Star badge -->
  <text x="300" y="170" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#FCD34D" text-anchor="middle">&#9733; Star Supporter</text>

  <!-- Username -->
  <text x="300" y="210" font-family="Arial, sans-serif" font-size="18" fill="white" text-anchor="middle">${escapeXml(username)}</text>

  <!-- Features unlocked -->
  <text x="300" y="250" font-family="Arial, sans-serif" font-size="13" fill="#D4D4D8" text-anchor="middle">Developer Tier Unlocked: PQC API + Levels 1-5 + 10GB</text>

  <!-- Footer -->
  <text x="300" y="290" font-family="Arial, sans-serif" font-size="11" fill="#9CA3AF" text-anchor="middle">zipminator.zip | Quantum-safe encryption for everyone</text>
</svg>`.trim()

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
