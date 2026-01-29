import { NextRequest, NextResponse } from 'next/server'

// Edge proxy for authentication and analytics
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

export async function proxy(request: NextRequest) {
  const url = new URL(request.url)
  const pathname = url.pathname

  // Skip proxy for static files and API routes that don't need auth
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
      const { getSupabaseAdmin } = await import('@/lib/supabase')
      
      // Try to get supabase admin client, but handle errors gracefully
      let supabaseAdmin
      try {
        supabaseAdmin = getSupabaseAdmin()
      } catch (error) {
        console.warn('Supabase admin client not available:', error)
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
      // If supabaseAdmin fails, continue without auth
      return NextResponse.next()
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
