import { NextRequest, NextResponse } from 'next/server'

// Cache configuration
const CACHE_TTL = 300 // 5 minutes in seconds

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const pathname = url.pathname
  
  // Skip middleware for static assets
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/favicon.ico')) {
    return NextResponse.next()
  }

  // Cache headers for static content
  const response = NextResponse.next()
  
  if (pathname.startsWith('/public') || pathname.match(/\.(js|css|png|jpg|jpeg|gif|webp|svg|ico)$/)) {
    response.headers.set('Cache-Control', `public, max-age=${CACHE_TTL}, stale-while-revalidate=86400`)
  }

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Basic CSP suitable for Next.js; adjust as needed for third-party calls
  // Note: Next.js requires 'unsafe-inline' for scripts due to inline hydration scripts
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob: https:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "connect-src *",
    "font-src 'self' data:",
    "object-src 'none'",
    "form-action 'self'",
    "frame-src 'self' https:"
  ].join('; ')
  response.headers.set('Content-Security-Policy', csp)

  return response
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
