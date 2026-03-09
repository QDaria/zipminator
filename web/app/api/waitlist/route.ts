import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'

const waitlistSchema = z.object({
  fullName: z.string().min(2).max(100),
  companyName: z.string().min(2).max(100),
  email: z.string().email().max(255),
  industry: z.enum(['gaming', 'banking', 'defense', 'healthcare', 'infrastructure', 'crypto', 'telecom', 'government', 'other']),
  expectedVolume: z.enum(['<10k', '10k-100k', '100k-1m', '1m+']),
  useCase: z.string().max(500).optional(),
  couponCode: z.string().max(50).optional(),
  ndaConsent: z.boolean().refine(val => val === true, { message: 'NDA consent required' }),
  userId: z.string().optional(),
})

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (record.count >= 3) return false
  record.count++
  return true
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'waitlist-api',
    supabase: supabase ? 'configured' : 'not configured',
  })
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Try again in a minute.', code: 'RATE_LIMIT_EXCEEDED' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'INVALID_JSON' }, { status: 400 })
  }

  const result = waitlistSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', details: result.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data = result.data

  if (!supabase) {
    console.log(`[${requestId}] Supabase not configured — returning mock success for ${data.email}`)
    return NextResponse.json({
      success: true,
      message: 'Successfully joined the waitlist! We will contact you within 48 hours.',
      submissionId: requestId,
      mode: 'demo',
    })
  }

  const { data: submission, error: dbError } = await supabase
    .from('waitlist')
    .insert([{
      full_name: data.fullName,
      company_name: data.companyName,
      email: data.email.toLowerCase(),
      industry: data.industry,
      expected_volume: data.expectedVolume,
      use_case: data.useCase || undefined,
      coupon_code: data.couponCode || undefined,
      nda_consent: data.ndaConsent,
      status: 'pending',
      ip_address: ip !== 'unknown' ? ip : undefined,
      user_agent: request.headers.get('user-agent') || undefined,
      referrer: request.headers.get('referer') || undefined,
      user_id: data.userId || undefined,
    }])
    .select()
    .single()

  if (dbError) {
    if (dbError.code === '23505') {
      return NextResponse.json(
        { error: 'This email is already on the waitlist.', code: 'DUPLICATE_EMAIL' },
        { status: 409 }
      )
    }
    console.error(`[${requestId}] DB error:`, dbError)
    return NextResponse.json(
      { error: 'Failed to save. Please try again or contact mo@qdaria.com', code: 'DATABASE_ERROR' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Successfully joined the waitlist! We will contact you within 48 hours.',
    submissionId: submission?.id || requestId,
  })
}
