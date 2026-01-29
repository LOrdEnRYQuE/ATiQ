import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'edge'
export const maxDuration = 300 // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const results = {
      expiredInvitations: 0,
      oldNotifications: 0,
      oldAnalytics: 0,
      expiredApiKeys: 0,
      errors: [] as string[]
    }

    // Clean up expired team invitations
    try {
      const { error: inviteError } = await supabaseAdmin
        .from('team_invitations')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .is('accepted_at', null)

      if (inviteError) {
        results.errors.push(`Invitation cleanup: ${inviteError.message}`)
      } else {
        const { count } = await supabaseAdmin
          .from('team_invitations')
          .select('*', { count: 'exact', head: true })
          .lt('expires_at', new Date().toISOString())
          .is('accepted_at', null)
        
        results.expiredInvitations = count || 0
      }
    } catch (error) {
      results.errors.push(`Invitation cleanup error: ${error}`)
    }

    // Clean up old notifications (older than 30 days)
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      
      const { error: notifError } = await supabaseAdmin
        .from('notifications')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString())

      if (notifError) {
        results.errors.push(`Notification cleanup: ${notifError.message}`)
      } else {
        const { count } = await supabaseAdmin
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .lt('created_at', thirtyDaysAgo.toISOString())
        
        results.oldNotifications = count || 0
      }
    } catch (error) {
      results.errors.push(`Notification cleanup error: ${error}`)
    }

    // Clean up old analytics data (older than 90 days)
    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      
      const { error: analyticsError } = await supabaseAdmin
        .from('usage_analytics')
        .delete()
        .lt('created_at', ninetyDaysAgo.toISOString())

      if (analyticsError) {
        results.errors.push(`Analytics cleanup: ${analyticsError.message}`)
      } else {
        const { count } = await supabaseAdmin
          .from('usage_analytics')
          .select('*', { count: 'exact', head: true })
          .lt('created_at', ninetyDaysAgo.toISOString())
        
        results.oldAnalytics = count || 0
      }
    } catch (error) {
      results.errors.push(`Analytics cleanup error: ${error}`)
    }

    // Clean up expired API keys
    try {
      const { error: apiKeyError } = await supabaseAdmin
        .from('api_keys')
        .delete()
        .lt('expires_at', new Date().toISOString())

      if (apiKeyError) {
        results.errors.push(`API key cleanup: ${apiKeyError.message}`)
      } else {
        const { count } = await supabaseAdmin
          .from('api_keys')
          .select('*', { count: 'exact', head: true })
          .lt('expires_at', new Date().toISOString())
        
        results.expiredApiKeys = count || 0
      }
    } catch (error) {
      results.errors.push(`API key cleanup error: ${error}`)
    }

    // Update project last_activity_at for active projects
    try {
      const { error: activityError } = await supabaseAdmin
        .from('projects')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('status', 'active')
        .lt('last_activity_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      if (activityError) {
        results.errors.push(`Activity update error: ${activityError.message}`)
      }
    } catch (error) {
      results.errors.push(`Activity update error: ${error}`)
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    })

  } catch (error) {
    console.error('Cleanup job error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
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

  return POST(request)
}
