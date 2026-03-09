import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase before importing the route
vi.mock('@/lib/supabase', () => ({
  supabase: null,
}))

// Import after mocking
const { POST } = await import('../route')

function makeRequest(body: Record<string, unknown>, ip = '127.0.0.1') {
  return new Request('http://localhost:3099/api/waitlist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  }) as any
}

const validPayload = {
  fullName: 'Jane Smith',
  companyName: 'Acme Corp',
  email: 'jane@acme.com',
  industry: 'banking',
  expectedVolume: '10k-100k',
  ndaConsent: true,
}

describe('POST /api/waitlist', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('validates required fields via Zod schema', async () => {
    const res = await POST(makeRequest({}))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.code).toBe('VALIDATION_ERROR')
    expect(data.details).toBeDefined()
  })

  it('rejects invalid email', async () => {
    const res = await POST(makeRequest({ ...validPayload, email: 'not-an-email' }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.code).toBe('VALIDATION_ERROR')
  })

  it('rejects invalid industry enum value', async () => {
    const res = await POST(makeRequest({ ...validPayload, industry: 'invalid' }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.code).toBe('VALIDATION_ERROR')
  })

  it('accepts optional userId field', async () => {
    const res = await POST(makeRequest({ ...validPayload, userId: 'user-123' }, '10.0.0.1'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.mode).toBe('demo') // supabase is null, so demo mode
  })

  it('returns success in demo mode when supabase is not configured', async () => {
    const res = await POST(makeRequest(validPayload, '10.0.0.2'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.mode).toBe('demo')
    expect(data.submissionId).toBeDefined()
  })

  it('returns 429 on rate limit (>3 requests per minute from same IP)', async () => {
    const ip = '192.168.99.99'
    // First 3 should succeed
    await POST(makeRequest(validPayload, ip))
    await POST(makeRequest(validPayload, ip))
    await POST(makeRequest(validPayload, ip))

    // 4th should be rate limited
    const res = await POST(makeRequest(validPayload, ip))
    const data = await res.json()

    expect(res.status).toBe(429)
    expect(data.code).toBe('RATE_LIMIT_EXCEEDED')
  })

  it('rejects ndaConsent=false', async () => {
    const res = await POST(makeRequest({ ...validPayload, ndaConsent: false }, '10.0.0.3'))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.code).toBe('VALIDATION_ERROR')
  })

  it('accepts all valid industry enum values', async () => {
    const industries = ['gaming', 'banking', 'defense', 'healthcare', 'infrastructure', 'crypto', 'telecom', 'government', 'other']
    for (const [i, industry] of industries.entries()) {
      const res = await POST(makeRequest({ ...validPayload, industry }, `10.1.0.${i}`))
      const data = await res.json()
      expect(data.success).toBe(true)
    }
  })
})
