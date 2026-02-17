import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'dashboard_pin_ok'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 // 7 days

export async function POST(request: NextRequest) {
  const pin = process.env.DASHBOARD_PIN
  if (!pin) {
    return NextResponse.json({ success: true })
  }

  try {
    const body = await request.json()
    const submitted = String(body?.pin ?? '').trim()
    if (submitted !== pin) {
      return NextResponse.json({ success: false, error: 'Wrong PIN' }, { status: 401 })
    }

    const res = NextResponse.json({ success: true })
    res.cookies.set(COOKIE_NAME, '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })
    return res
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}
