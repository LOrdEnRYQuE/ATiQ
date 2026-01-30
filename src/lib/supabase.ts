import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Hardcoded fallback for production - this will work regardless of env vars
const FALLBACK_URL = 'https://lcxywtcbbzoqtopvopwh.supabase.co'
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjeHl3dGNiYnpvcXRvcHZvcHdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTg1MzIsImV4cCI6MjA4NTIzNDUzMn0.ozOU9fBvB9Bsy6uY2bwUqjatnj9BvM1ERZbdpT0LQJI'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY

// console.log('🔥 Supabase URL:', supabaseUrl ? 'SET' : 'NOT SET')
// console.log('🔥 Supabase Key:', supabaseAnonKey ? 'SET' : 'NOT SET')

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
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

// Test connection in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && false) {
  supabase.auth.getSession().then(({ data, error }) => {
    console.log('🔥 Supabase connection test:', { 
      hasSession: !!data.session, 
      error: error?.message 
    })
  })
}

// Create a Supabase client for server-side usage
export const getSupabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_3dWlNbnZYJ0gnEA6qBMWiQ_AOgmaaqH'
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service role key. Please check your environment configuration.')
  }
  
  return createClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Legacy export for backward compatibility
export const supabaseAdmin = getSupabaseAdmin

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
