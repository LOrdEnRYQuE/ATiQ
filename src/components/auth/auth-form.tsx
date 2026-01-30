'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthForm() {
  console.log('🔍 BASIC DEBUG: AuthForm component rendering')
  
  // Immediate alert to test if component renders at all
  React.useEffect(() => {
    alert('🔍 AuthForm component mounted! If you see this, JavaScript is working.')
  }, [])
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  
  console.log('🔍 BASIC DEBUG: Router available:', !!router)
  console.log('🔍 BASIC DEBUG: Supabase client available:', !!supabase)
  
  // Test Supabase connection immediately
  React.useEffect(() => {
    console.log('🔍 BASIC DEBUG: Component mounted, testing Supabase connection')
    
    if (supabase) {
      console.log('🔍 BASIC DEBUG: Testing Supabase auth methods')
      console.log('🔍 BASIC DEBUG: getUser method available:', typeof supabase.auth.getUser)
      console.log('🔍 BASIC DEBUG: signInWithPassword method available:', typeof supabase.auth.signInWithPassword)
      
      // Test getting current session
      supabase.auth.getSession().then(({ data, error }) => {
        console.log('🔍 BASIC DEBUG: Current session test:', {
          hasSession: !!data.session,
          hasError: !!error,
          error: error?.message
        })
      }).catch(err => {
        console.error('🔍 BASIC DEBUG: Session test error:', err)
      })
    } else {
      console.error('🔍 BASIC DEBUG: Supabase client is null/undefined')
    }
  }, [])

  const handleTest = () => {
    console.log('🔍 TEST: Test button clicked!')
    alert('JavaScript is working! Test button clicked.')
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    console.log('🔍 DEBUG: Starting authentication process')
    console.log('🔍 DEBUG: Supabase client available:', !!supabase)
    console.log('🔍 DEBUG: Email:', email)
    console.log('🔍 DEBUG: Is sign up:', isSignUp)

    if (!supabase) {
      console.error('🔍 DEBUG: Supabase client not available')
      setError('Authentication service not available')
      setLoading(false)
      return
    }

    try {
      if (isSignUp) {
        console.log('🔍 DEBUG: Attempting sign up')
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        })
        
        console.log('🔍 DEBUG: Sign up result:', { error })
        
        if (error) throw error
        
        // Show success message for sign up
        setError('Check your email to confirm your account!')
      } else {
        console.log('🔍 DEBUG: Attempting sign in with password')
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        console.log('🔍 DEBUG: Sign in result:', { 
          error, 
          hasData: !!data,
          hasSession: !!data?.session,
          hasUser: !!data?.user,
          sessionExpiresAt: data?.session?.expires_at
        })
        
        if (error) throw error
        
        // Wait a moment for session to be established
        if (data.session) {
          console.log('🔍 DEBUG: Session established, setting auth token cookie')
          // Set auth token cookie for middleware
          document.cookie = `auth-token=${data.session.access_token}; path=/; max-age=3600; secure; samesite=strict`
          console.log('🔍 DEBUG: Auth token cookie set')
          
          // Small delay to ensure session is persisted
          console.log('🔍 DEBUG: Waiting 500ms for session persistence')
          await new Promise(resolve => setTimeout(resolve, 500))
          
          console.log('🔍 DEBUG: Redirecting to dashboard')
          router.push('/dashboard')
        } else {
          console.error('🔍 DEBUG: No session created after successful login')
          setError('Login successful but no session created. Please try again.')
        }
      }
    } catch (error: unknown) {
      console.error('🔍 DEBUG: Authentication error:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
      console.log('🔍 DEBUG: Authentication process completed')
    }
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    setError(null)

    if (!supabase) {
      setError('Authentication service not available')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse animation-delay-4000" />
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </h1>
            <p className="text-gray-400">
              {isSignUp 
                ? 'Start building with AI-powered coding' 
                : 'Welcome back to your AI coding workspace'
              }
            </p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-4">
              <div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>
              <div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>
            </div>
            
            {error && (
              <div className={`p-4 rounded-lg text-sm ${
                error.includes('Check your email') 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {error}
              </div>
            )}
            
            {/* Electro gradient submit button */}
            <div className="group relative inline-block w-full">
              <div className="absolute inset-0 rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-r from-yellow-400 via-cyan-400 to-purple-400 opacity-20 animate-pulse" />
                <div className="absolute inset-0 bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 opacity-30 animate-pulse animation-delay-500" />
                <div className="absolute inset-0 bg-linear-to-tl from-cyan-400 via-blue-400 to-indigo-400 opacity-25 animate-pulse animation-delay-1000" />
              </div>
              <div className="absolute inset-0 rounded-lg p-px">
                <div className="w-full h-full rounded-lg bg-linear-to-r from-yellow-400 via-cyan-400 to-purple-400 opacity-60 animate-pulse" 
                     style={{ 
                       background: 'linear-gradient(45deg, #fbbf24, #06b6d4, #a855f7, #fbbf24)',
                       backgroundSize: '200% 200%',
                       animation: 'electro 2s ease-in-out infinite'
                     }} />
              </div>
              <button 
                type="submit" 
                className="relative w-full px-6 py-3 bg-black text-white font-bold rounded-lg border border-gray-800 hover:border-yellow-400/50 hover:bg-gray-900 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-400/25 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </button>
            </div>
            
            {/* Test button for debugging */}
            <button
              type="button"
              onClick={handleTest}
              className="w-full px-6 py-3 bg-red-600 text-white font-bold rounded-lg border border-red-700 hover:bg-red-700 transition-all duration-300"
            >
              🧪 TEST JavaScript
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-900 px-2 text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>
            
            {/* Google button with matching theme */}
            <button
              type="button"
              className="w-full px-6 py-3 bg-black/50 border border-gray-700 rounded-lg text-white font-medium hover:border-gray-600 hover:bg-gray-800/70 transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
              onClick={handleGoogleAuth}
              disabled={loading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>
            
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
