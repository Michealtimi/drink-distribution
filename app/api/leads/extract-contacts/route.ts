import { NextRequest, NextResponse } from 'next/server'

/**
 * Extract emails and phone numbers from text (post-processing layer).
 * Use: pasted web content, scraped HTML, contact pages.
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
// Nigerian / intl: +234, 234, 0, digits with optional spaces/dashes
const PHONE_REGEX = /(?:\+?234|0)?[\s.-]?[789]\d{2}[\s.-]?\d{3}[\s.-]?\d{4}/g

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const text = typeof body.text === 'string' ? body.text : ''

    const emails = [...new Set((text.match(EMAIL_REGEX) || []).map((e: string) => e.trim()))]
    const phones = [...new Set((text.match(PHONE_REGEX) || []).map((p: string) => normalizePhone(p)))]

    return NextResponse.json({ emails, phones })
  } catch (error) {
    console.error('Extract contacts error:', error)
    return NextResponse.json(
      { error: 'Failed to extract contacts' },
      { status: 500 }
    )
  }
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('234')) return digits.slice(0, 13)
  if (digits.startsWith('0')) return '234' + digits.slice(1, 11)
  if (digits.length >= 10) return '234' + digits.slice(-10)
  return digits
}
