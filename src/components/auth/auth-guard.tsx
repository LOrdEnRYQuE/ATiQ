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
      if (!supabase) {
        router.push('/auth')
        setLoading(false)
        return
      }

      // Retry session check a few times to handle race conditions
      let session = null
      for (let i = 0; i < 3; i++) {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (currentSession) {
          session = currentSession
          break
        }
        // Wait a bit between retries
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      if (session) {
        setAuthenticated(true)
      } else {
        router.push('/auth')
      }
      
      setLoading(false)
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
