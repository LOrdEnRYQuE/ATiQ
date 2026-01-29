'use client'

import { supabase } from '@/lib/supabase'

interface AnalyticsEvent {
  event: string
  properties: Record<string, unknown>
  timestamp: string
  userId?: string
  sessionId?: string
  userAgent?: string
  url?: string
}

class Analytics {
  private static instance: Analytics
  private queue: AnalyticsEvent[] = []
  private isProcessing = false

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics()
    }
    return Analytics.instance
  }

  constructor() {
    // Process queue every 5 seconds
    setInterval(() => {
      this.processQueue()
    }, 5000)

    // Process queue on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.processQueue()
      })
    }
  }

  track(event: string, properties: Record<string, unknown> = {}) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    }

    this.queue.push(analyticsEvent)
  }

  trackPageView(path: string, title?: string) {
    this.track('page_view', {
      path,
      title: title || document.title
    })
  }

  trackUserAction(action: string, properties: Record<string, unknown> = {}) {
    this.track('user_action', {
      action,
      ...properties
    })
  }

  trackAIRequest(prompt: string, response: string, tokensUsed: number, model: string) {
    this.track('ai_request', {
      promptLength: prompt.length,
      responseLength: response.length,
      tokensUsed,
      model,
      success: true
    })
  }

  trackAIError(error: string, prompt: string, model: string) {
    this.track('ai_error', {
      error,
      promptLength: prompt.length,
      model
    })
  }

  trackProjectAction(action: 'create' | 'update' | 'delete', projectId: string, properties: Record<string, unknown> = {}) {
    this.track('project_action', {
      action,
      projectId,
      ...properties
    })
  }

  trackSubscriptionEvent(event: 'upgrade' | 'downgrade' | 'cancel' | 'renewal', tier: string, properties: Record<string, unknown> = {}) {
    this.track('subscription_event', {
      event,
      tier,
      ...properties
    })
  }

  trackError(error: string, context: Record<string, unknown> = {}) {
    this.track('error', {
      error,
      context,
      stack: new Error().stack
    })
  }

  trackPerformance(metric: string, value: number, unit: string = 'ms') {
    this.track('performance', {
      metric,
      value,
      unit
    })
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return

    this.isProcessing = true
    const events = [...this.queue]
    this.queue = []

    try {
      // Store events in database
      for (const event of events) {
        await this.storeEvent(event)
      }
    } catch (error) {
      console.error('Failed to store analytics events:', error)
      // Re-add failed events to queue
      this.queue.unshift(...events)
    } finally {
      this.isProcessing = false
    }
  }

  private async storeEvent(event: AnalyticsEvent) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Store in a generic table or log for now
      console.log('Analytics Event:', {
        ...event,
        user_id: user?.id,
        session_id: this.getSessionId()
      })
      
      // In a real implementation, you would have an analytics_events table
      // For now, we'll just log the events
    } catch (error) {
      console.error('Failed to store analytics event:', error)
    }
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server'
    
    let sessionId = sessionStorage.getItem('analytics_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('analytics_session_id', sessionId)
    }
    return sessionId
  }

  // Get analytics data for dashboard
  async getAnalyticsData(timeRange: 'day' | 'week' | 'month' | 'year' = 'week') {
    try {
      // Calculate date range for filtering
      const endDate = new Date()
      const startDate = new Date()
      
      switch (timeRange) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1)
          break
        case 'week':
          startDate.setDate(startDate.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1)
          break
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
      }

      // Query actual analytics data from database
      const { data: aiRequests, error: aiError } = await supabase
        .from('ai_requests')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })

      if (aiError) {
        console.error('Error fetching analytics data:', aiError)
        return []
      }

      // Transform AI requests into analytics events
      const analyticsEvents = (aiRequests || []).map((request: {
        model: string;
        tokens_used: number | null;
        prompt: string;
        response: string;
        created_at: string | null;
        user_id: string | null;
      }) => ({
        event: 'ai_request',
        properties: {
          model: request.model,
          tokensUsed: request.tokens_used || 0,
          promptLength: request.prompt.length,
          responseLength: request.response.length
        },
        timestamp: request.created_at,
        user_id: request.user_id,
        session_id: `session-${request.user_id}`
      }))

      return analyticsEvents
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
      return []
    }
  }

  // Get usage statistics
  async getUsageStats(timeRange: 'day' | 'week' | 'month' | 'year' = 'week') {
    try {
      const events = await this.getAnalyticsData(timeRange)
      
      const stats = {
        totalEvents: events.length,
        pageViews: events.filter((e: { event: string }) => e.event === 'page_view').length,
        userActions: events.filter((e: { event: string }) => e.event === 'user_action').length,
        aiRequests: events.filter((e: { event: string }) => e.event === 'ai_request').length,
        aiErrors: events.filter((e: { event: string }) => e.event === 'ai_error').length,
        projectActions: events.filter((e: { event: string }) => e.event === 'project_action').length,
        subscriptionEvents: events.filter((e: { event: string }) => e.event === 'subscription_event').length,
        errors: events.filter((e: { event: string }) => e.event === 'error').length,
        performanceEvents: events.filter((e: { event: string }) => e.event === 'performance').length
      }

      // Calculate average response time for AI requests
      const aiRequestEvents = events.filter((e: { event: string }) => e.event === 'ai_request')
      const avgResponseTime = aiRequestEvents.length > 0
        ? aiRequestEvents.reduce((sum: number) => sum + 1500, 0) / aiRequestEvents.length // Mock response time
        : 0

      return {
        ...stats,
        avgAIResponseTime: Math.round(avgResponseTime),
        aiSuccessRate: stats.aiRequests > 0 ? ((stats.aiRequests - stats.aiErrors) / stats.aiRequests) * 100 : 0
      }
    } catch (error) {
      console.error('Failed to get usage stats:', error)
      return {
        totalEvents: 0,
        pageViews: 0,
        userActions: 0,
        aiRequests: 0,
        aiErrors: 0,
        projectActions: 0,
        subscriptionEvents: 0,
        errors: 0,
        performanceEvents: 0,
        avgAIResponseTime: 0,
        aiSuccessRate: 0
      }
    }
  }
}

export const analytics = Analytics.getInstance()
