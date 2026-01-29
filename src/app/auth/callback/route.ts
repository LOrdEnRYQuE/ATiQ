import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  if (!supabase) {
    return NextResponse.redirect(`${new URL(request.url).origin}/auth/auth-code-error`)
  }

  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.session) {
      // Create response with auth token cookie
      const response = NextResponse.redirect(`${origin}${next}`)
      response.cookies.set('auth-token', data.session.access_token, {
        path: '/',
        maxAge: 3600, // 1 hour
        secure: true,
        sameSite: 'strict',
        httpOnly: false // Allow client-side access
      })
      return response
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
