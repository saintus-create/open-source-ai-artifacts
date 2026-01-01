import { NextRequest, NextResponse } from 'next/server'

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100 // requests per window

// Cache configuration
const CACHE_TTL = 300 // 5 minutes in seconds

// Performance monitoring
const performanceMetrics = new Map()

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const pathname = url.pathname
  
  // Skip middleware for static assets
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/favicon.ico')) {
    return NextResponse.next()
  }

  // Rate limiting
  const clientIP = request.ip || 'unknown'
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS
  
  // Clean up old entries
  if (performanceMetrics.has(clientIP)) {
    const clientRequests = performanceMetrics.get(clientIP)
    const validRequests = clientRequests.filter((timestamp: number) => timestamp > windowStart)
    performanceMetrics.set(clientIP, validRequests)
  }

  // Check rate limit
  const clientRequests = performanceMetrics.get(clientIP) || []
  if (clientRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '60',
        'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(now + RATE_LIMIT_WINDOW_MS).toISOString()
      }
    })
  }

  // Add request to tracking
  clientRequests.push(now)
  performanceMetrics.set(clientIP, clientRequests)

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
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-eval'",
    "connect-src *",
    "font-src 'self' data:",
    "object-src 'none'",
    "form-action 'self'"
  ].join('; ')
  response.headers.set('Content-Security-Policy', csp)

  return response

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
