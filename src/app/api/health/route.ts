import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  if (!supabase) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Database not available',
        error: 'Supabase client not initialized'
      },
      { status: 500 }
    )
  }

  try {
    // Test database connection
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (error) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Database connection failed',
          error: error.message 
        },
        { status: 500 }
      )
    }

    // Test environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'GEMINI_API_KEY',
      'STRIPE_SECRET_KEY',
      'NEXT_PUBLIC_STRIPE_PK'
    ]

    const missingEnvVars = requiredEnvVars.filter(
      envVar => !process.env[envVar]
    )

    return NextResponse.json({
      status: 'ok',
      message: 'Application is healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: {
        missing: missingEnvVars,
        configured: requiredEnvVars.length - missingEnvVars.length,
        total: requiredEnvVars.length
      },
      version: process.env.npm_package_version || '1.0.0'
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
