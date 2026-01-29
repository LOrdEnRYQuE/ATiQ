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

  console.log('🔍 DEBUG: Proxy - Processing request for:', pathname)

  // Skip proxy for static files and API routes that don't need auth
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/health') ||
    pathname.includes('.') // static files
  ) {
    console.log('🔍 DEBUG: Proxy - Skipping auth check for:', pathname)
    return NextResponse.next()
  }

  // Get auth token from cookies or headers
  const token = request.cookies.get('auth-token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')

  console.log('🔍 DEBUG: Proxy - Auth token present:', !!token)
  console.log('🔍 DEBUG: Proxy - Token from cookie:', !!request.cookies.get('auth-token')?.value)
  console.log('🔍 DEBUG: Proxy - Token from header:', !!request.headers.get('authorization'))

  // Protected routes
  const protectedRoutes = ['/dashboard', '/workspace', '/settings', '/billing', '/collaborate', '/templates']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  console.log('🔍 DEBUG: Proxy - Is protected route:', isProtectedRoute)

  if (isProtectedRoute && !token) {
    console.log('🔍 DEBUG: Proxy - No token for protected route, redirecting to auth')
    // Redirect to auth if no token
    const loginUrl = new URL('/auth', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verify token if present
  if (token) {
    console.log('🔍 DEBUG: Proxy - Verifying token')
    try {
      const { getSupabaseAdmin } = await import('@/lib/supabase')
      
      // Try to get supabase admin client, but handle errors gracefully
      let supabaseAdmin
      try {
        supabaseAdmin = getSupabaseAdmin()
        console.log('🔍 DEBUG: Proxy - Supabase admin client obtained')
      } catch (error) {
        console.warn('🔍 DEBUG: Proxy - Supabase admin client not available:', error)
        return NextResponse.next()
      }
      
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      
      console.log('🔍 DEBUG: Proxy - Token verification result:', {
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email,
        error
      })
      
      if (error || !user) {
        console.log('🔍 DEBUG: Proxy - Invalid token, clearing and redirecting')
        // Invalid token, clear it and redirect
        const response = NextResponse.redirect(new URL('/auth', request.url))
        response.cookies.delete('auth-token')
        return response
      }

      console.log('🔍 DEBUG: Proxy - Token valid, user authenticated')
      // Add user info to headers for downstream use
      const response = NextResponse.next()
      response.headers.set('x-user-id', user.id)
      response.headers.set('x-user-email', user.email || '')
      
      return response
    } catch (error) {
      console.error('🔍 DEBUG: Proxy - Auth verification error:', error)
      // If supabaseAdmin fails, continue without auth
      return NextResponse.next()
    }
  }

  // Track analytics
  try {
    console.log('🔍 DEBUG: Proxy - Tracking analytics for:', pathname)
  } catch (error) {
    // Don't let analytics errors break the request
    console.error('Analytics tracking error:', error)
  }

  console.log('🔍 DEBUG: Proxy - Allowing request to proceed')
  return NextResponse.next()
}
