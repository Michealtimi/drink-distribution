import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// No auth required – personal CRM, all routes open.
// For production: add auth and protect /api/* (except cron) and dashboard routes.
// Cron is protected by CRON_SECRET in app/api/cron/follow-ups/route.ts when set.
export function middleware(request: NextRequest) {
  return NextResponse.next()
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
