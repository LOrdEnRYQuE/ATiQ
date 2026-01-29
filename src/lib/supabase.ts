import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
    // Return a mock client during build to prevent failures
    if (typeof window === 'undefined') {
      console.warn('Supabase environment variables not found. Returning mock client for build.')
      return {
        auth: {
          getUser: () => Promise.resolve({ data: { user: null }, error: null }),
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
          signInWithOAuth: () => Promise.resolve({ data: {}, error: new Error('Supabase not configured') }),
          signUp: () => Promise.resolve({ data: {}, error: new Error('Supabase not configured') }),
          signOut: () => Promise.resolve({ error: null })
        },
        from: () => ({
          select: () => ({ data: null, error: new Error('Supabase not configured') }),
          insert: () => ({ data: null, error: new Error('Supabase not configured') }),
          update: () => ({ data: null, error: new Error('Supabase not configured') }),
          delete: () => ({ data: null, error: new Error('Supabase not configured') }),
          eq: () => ({ single: () => ({ data: null, error: new Error('Supabase not configured') }) }),
          lt: () => ({ data: null, error: new Error('Supabase not configured') }),
          gte: () => ({ data: null, error: new Error('Supabase not configured') }),
          lte: () => ({ data: null, error: new Error('Supabase not configured') }),
          order: () => ({ data: null, error: new Error('Supabase not configured') }),
          limit: () => ({ data: null, error: new Error('Supabase not configured') }),
          maybeSingle: () => ({ data: null, error: new Error('Supabase not configured') })
        })
      } as any
    }
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
    // Return a mock client during build to prevent failures
    if (typeof window === 'undefined') {
      console.warn('Supabase service role key not found. Returning mock client for build.')
      return {
        auth: {
          getUser: () => Promise.resolve({ data: { user: null }, error: null }),
          getUserById: () => Promise.resolve({ data: { user: null }, error: null })
        },
        from: () => ({
          select: () => ({ data: null, error: new Error('Supabase not configured') }),
          insert: () => ({ data: null, error: new Error('Supabase not configured') }),
          update: () => ({ data: null, error: new Error('Supabase not configured') }),
          delete: () => ({ data: null, error: new Error('Supabase not configured') }),
          eq: () => ({ single: () => ({ data: null, error: new Error('Supabase not configured') }) }),
          lt: () => ({ data: null, error: new Error('Supabase not configured') }),
          gte: () => ({ data: null, error: new Error('Supabase not configured') }),
          lte: () => ({ data: null, error: new Error('Supabase not configured') }),
          order: () => ({ data: null, error: new Error('Supabase not configured') }),
          limit: () => ({ data: null, error: new Error('Supabase not configured') }),
          maybeSingle: () => ({ data: null, error: new Error('Supabase not configured') })
        })
      } as any
    }
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
