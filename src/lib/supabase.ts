import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Debug: Log environment variables in production
if (typeof window === 'undefined') {
  console.log('=== ENVIRONMENT VARIABLES DEBUG ===')
  console.log('NODE_ENV:', process.env.NODE_ENV)
  console.log('VERCEL:', process.env.VERCEL)
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'NOT SET')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET')
  console.log('All env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')))
  console.log('================================')
}

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    throw new Error('Missing Supabase environment variables. Please check your environment configuration.')
  }
  // During build, we'll create a dummy client to prevent build failures
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
    console.warn('Supabase environment variables not found during Vercel build. This may indicate missing environment variables in Vercel dashboard.')
  }
}

export const supabase = (() => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your environment configuration.')
  }
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    global: {
      headers: {
        'X-Client-Info': 'vibe-coding/1.0.0'
      }
    }
  })
})()

// Create a Supabase client for server-side usage
export const supabaseAdmin = (() => {
  if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase service role key. Please check your environment configuration.')
  }
  
  return createClient<Database>(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
})()

// Helper function to create Supabase client with custom auth
export function createSupabaseClient(accessToken: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables.')
  }
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  })
}
