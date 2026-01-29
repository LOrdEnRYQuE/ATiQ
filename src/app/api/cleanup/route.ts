import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'edge'
export const maxDuration = 300 // 5 minutes

export async function POST() {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Database not available' },
      { status: 500 }
    )
  }

  try {
    const results = {
      oldAiRequests: 0,
      errors: [] as string[]
    }

    // Clean up old AI requests (older than 30 days)
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { error: deleteError } = await supabaseAdmin
        .from('ai_requests')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString())

      if (deleteError) {
        results.errors.push(`AI requests cleanup: ${deleteError.message}`)
      } else {
        results.oldAiRequests = 1
      }
    } catch (error) {
      results.errors.push(`AI requests cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { 
        error: 'Cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

// Only allow cron job requests
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return POST()
}
