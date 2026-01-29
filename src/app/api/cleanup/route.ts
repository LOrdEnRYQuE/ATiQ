import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'edge'
export const maxDuration = 300 // 5 minutes

export async function POST() {
  let supabaseAdmin
  try {
    supabaseAdmin = getSupabaseAdmin()
  } catch (error) {
    return NextResponse.json(
      { error: 'Database not available' },
      { status: 500 }
    )
  }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const results = {
    deletedAiRequests: 0,
    errors: [] as string[]
  }

  try {
    // Clean up old AI requests
    const { error: deleteError } = await supabaseAdmin
      .from('ai_requests')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString())

    if (deleteError) {
      results.errors.push(`Failed to delete AI requests: ${deleteError.message}`)
    } else {
      results.deletedAiRequests = 1 // We'll just indicate success
    }
  } catch (error) {
    results.errors.push(`AI requests cleanup failed: ${error}`)
  }

  try {
    return NextResponse.json(results)
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
