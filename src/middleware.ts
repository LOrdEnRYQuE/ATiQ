import { NextRequest, NextResponse } from 'next/server'

// Edge middleware for authentication and analytics
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

export async function middleware(request: NextRequest) {
  const url = new URL(request.url)
  const pathname = url.pathname

  // Skip middleware for static files and API routes that don't need auth
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/health') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next()
  }

  // Get auth token from cookies or headers
  const token = request.cookies.get('auth-token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')

  // Protected routes
  const protectedRoutes = ['/dashboard', '/workspace', '/settings', '/billing', '/collaborate', '/templates']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute && !token) {
    // Redirect to auth if no token
    const loginUrl = new URL('/auth', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verify token if present
  if (token) {
    try {
      const { supabaseAdmin } = await import('@/lib/supabase')
      if (!supabaseAdmin) {
        console.warn('Supabase admin client not available during build')
        return NextResponse.next()
      }
      
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      
      if (error || !user) {
        // Invalid token, clear it and redirect
        const response = NextResponse.redirect(new URL('/auth', request.url))
        response.cookies.delete('auth-token')
        return response
      }

      // Add user info to headers for downstream use
      const response = NextResponse.next()
      response.headers.set('x-user-id', user.id)
      response.headers.set('x-user-email', user.email || '')
      
      return response
    } catch (error) {
      console.error('Auth verification error:', error)
      return NextResponse.redirect(new URL('/auth', request.url))
    }
  }

  // Track analytics
  try {
    console.log('Page view:', pathname)
  } catch (error) {
    // Don't let analytics errors break the request
    console.error('Analytics tracking error:', error)
  }

  return NextResponse.next()
}

// CORS handling for API routes
export function handleCORS() {
  const response = NextResponse.next()
  
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
  response.headers.set('Access-Control-Max-Age', '86400')
  
  return response
}

// Rate limiting helper
export class RateLimiter {
  private static requests = new Map<string, { count: number; resetTime: number }>()
  
  static check(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now()
    const record = this.requests.get(key)
    
    if (!record || now > record.resetTime) {
      this.requests.set(key, { count: 1, resetTime: now + windowMs })
      return true
    }
    
    if (record.count >= limit) {
      return false
    }
    
    record.count++
    return true
  }
}

// Security headers helper
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  return response
}

// Cache control helper
export function setCacheControl(response: NextResponse, type: 'static' | 'api' | 'no-cache'): NextResponse {
  switch (type) {
    case 'static':
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
      break
    case 'api':
      response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600')
      break
    case 'no-cache':
      response.headers.set('Cache-Control', 'no-store, must-revalidate')
      break
  }
  
  return response
}
