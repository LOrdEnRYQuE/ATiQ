'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 DEBUG: AuthGuard - Starting authentication check')
      console.log('🔍 DEBUG: AuthGuard - Supabase client available:', !!supabase)
      
      if (!supabase) {
        console.error('🔍 DEBUG: AuthGuard - Supabase client not available, redirecting to auth')
        router.push('/auth')
        setLoading(false)
        return
      }

      // Retry session check a few times to handle race conditions
      let session = null
      for (let i = 0; i < 3; i++) {
        console.log(`🔍 DEBUG: AuthGuard - Session check attempt ${i + 1}/3`)
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()
        
        console.log(`🔍 DEBUG: AuthGuard - Session check ${i + 1} result:`, {
          hasSession: !!currentSession,
          hasUser: !!currentSession?.user,
          userId: currentSession?.user?.id,
          error
        })
        
        if (currentSession) {
          session = currentSession
          console.log('🔍 DEBUG: AuthGuard - Session found, breaking retry loop')
          break
        }
        // Wait a bit between retries
        if (i < 2) {
          console.log(`🔍 DEBUG: AuthGuard - Waiting 500ms before retry ${i + 2}`)
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      
      if (session) {
        console.log('🔍 DEBUG: AuthGuard - Authentication successful, user authenticated')
        console.log('🔍 DEBUG: AuthGuard - User ID:', session.user?.id)
        console.log('🔍 DEBUG: AuthGuard - User Email:', session.user?.email)
        setAuthenticated(true)
      } else {
        console.error('🔍 DEBUG: AuthGuard - No session found after all retries, redirecting to auth')
        router.push('/auth')
      }
      
      setLoading(false)
      console.log('🔍 DEBUG: AuthGuard - Authentication check completed')
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!authenticated) {
    return null // Will redirect
  }

  return <>{children}</>
}
