import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter, RATE_LIMITS, createRateLimitErrorResponse, createRateLimitHeaders } from '@/lib/rate-limiter'
import { InputValidator, VALIDATION_SCHEMAS } from '@/lib/input-validation'
import { analytics } from '@/lib/analytics'
import { supabase } from '@/lib/supabase'

export const maxDuration = 60 // Allow 60 seconds (Hobby) or 300 (Pro)
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not available' },
      { status: 500 }
    )
  }

  try {
    // Rate limiting check
    const rateLimitResult = rateLimiter.check(RATE_LIMITS.AI_REQUESTS, req)
    
    if (!rateLimitResult.success) {
      return createRateLimitErrorResponse(rateLimitResult)
    }

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check user's subscription limits
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    const subscriptionTier = userData?.subscription_tier || 'free'
    
    // Get current usage for this month
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const { count: currentUsage } = await supabase
      .from('ai_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', firstDayOfMonth.toISOString())

    // Define limits based on subscription tier
    const limits = {
      free: 100,
      pro: 5000,
      enterprise: Infinity
    }

    const userLimit = limits[subscriptionTier as keyof typeof limits]
    
    if (currentUsage && currentUsage >= userLimit) {
      return NextResponse.json(
        { 
          error: 'Usage limit exceeded',
          message: `You have reached your monthly limit of ${userLimit} AI requests`,
          currentUsage,
          limit: userLimit,
          subscriptionTier
        },
        { status: 429 }
      )
    }

    // Validate request body
    const body = await req.json()
    const validation = InputValidator.validateRequestBody(body, VALIDATION_SCHEMAS.AI_REQUEST)

    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    const { prompt, model = 'gemini-2.5-pro' } = validation.sanitized ? JSON.parse(validation.sanitized) : body

    // Additional security checks
    const securityCheck = InputValidator.securityCheck(prompt)
    if (!securityCheck.isValid) {
      return NextResponse.json(
        { 
          error: 'Security check failed',
          details: securityCheck.errors
        },
        { status: 400 }
      )
    }

    // Generate AI content (mock implementation for now)
    const response = {
      content: `Generated response for: ${prompt}`,
      tokensUsed: Math.floor(Math.random() * 100) + 50,
      model
    }
    const responseTime = Date.now() - startTime

    // Store AI request in database
    const { error: dbError } = await supabase
      .from('ai_requests')
      .insert({
        user_id: user.id,
        prompt,
        response: response.content,
        model,
        tokens_used: response.tokensUsed,
        created_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('Failed to store AI request:', dbError)
    }

    // Track analytics
    analytics.trackAIRequest(prompt, response.content, response.tokensUsed, model)
    analytics.trackPerformance('ai_response_time', responseTime, 'ms')

    // Create response with rate limit headers
    const headers = createRateLimitHeaders(rateLimitResult)
    
    return NextResponse.json({
      success: true,
      response,
      model,
      responseTime,
      tokensUsed: response.tokensUsed || 0,
      usage: {
        current: (currentUsage || 0) + 1,
        limit: userLimit,
        remaining: Math.max(0, userLimit - ((currentUsage || 0) + 1))
      }
    }, {
      headers
    })

  } catch (error: unknown) {
    const responseTime = Date.now() - startTime
    
    // Track error
    analytics.trackAIError(
      error instanceof Error ? error.message : 'Unknown error',
      'Unknown prompt',
      'gemini-2.5-pro'
    )
    analytics.trackPerformance('ai_response_time', responseTime, 'ms')

    console.error('AI generation error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate content',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not available' },
      { status: 500 }
    )
  }

  try {
    // Rate limiting check
    const rateLimitResult = rateLimiter.check(RATE_LIMITS.API, req)
    
    if (!rateLimitResult.success) {
      return createRateLimitErrorResponse(rateLimitResult)
    }

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's AI usage statistics
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const { count: currentUsage } = await supabase
      .from('ai_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', firstDayOfMonth.toISOString())

    // Get user's subscription tier
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    const subscriptionTier = userData?.subscription_tier || 'free'
    
    // Define limits based on subscription tier
    const limits = {
      free: 100,
      pro: 5000,
      enterprise: Infinity
    }

    const userLimit = limits[subscriptionTier as keyof typeof limits]

    // Get recent AI requests
    const { data: recentRequests } = await supabase
      .from('ai_requests')
      .select('created_at, model, tokens_used')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // For now, use a simple average response time calculation
    // TODO: Implement proper response time tracking with request_time field
    const avgResponseTime = recentRequests && recentRequests.length > 0 ? 1200 : 0

    const headers = createRateLimitHeaders(rateLimitResult)

    return NextResponse.json({
      usage: {
        current: currentUsage || 0,
        limit: userLimit,
        remaining: Math.max(0, userLimit - (currentUsage || 0)),
        percentage: userLimit === Infinity ? 0 : ((currentUsage || 0) / userLimit) * 100
      },
      subscriptionTier,
      statistics: {
        totalRequests: currentUsage || 0,
        averageResponseTime: Math.round(avgResponseTime),
        recentRequests: recentRequests || []
      }
    }, {
      headers
    })

  } catch (error: unknown) {
    console.error('AI usage fetch error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch AI usage',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
