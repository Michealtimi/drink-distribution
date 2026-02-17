import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PIN_COOKIE = 'dashboard_pin_ok'

// When DASHBOARD_PIN is set, require PIN cookie to access dashboard and API (except auth and cron).
// When not set, all routes are open (personal project, no gate).
export function middleware(request: NextRequest) {
  const pin = process.env.DASHBOARD_PIN
  if (!pin) return NextResponse.next()

  const path = request.nextUrl.pathname
  if (path === '/login' || path.startsWith('/api/auth/')) return NextResponse.next()
  if (path.startsWith('/api/cron/')) return NextResponse.next()

  if (request.cookies.get(PIN_COOKIE)?.value === '1') return NextResponse.next()
  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
