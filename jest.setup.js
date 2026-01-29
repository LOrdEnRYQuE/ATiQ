import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock analytics
jest.mock('@/lib/analytics', () => ({
  analytics: {
    track: jest.fn(),
    trackPageView: jest.fn(),
    trackUserAction: jest.fn(),
    trackAIRequest: jest.fn(),
    trackAIError: jest.fn(),
    trackProjectAction: jest.fn(),
    trackSubscriptionEvent: jest.fn(),
    trackError: jest.fn(),
    trackPerformance: jest.fn(),
    getAnalyticsData: jest.fn().mockResolvedValue([
      {
        event: 'page_view',
        properties: { path: '/dashboard', title: 'Dashboard' },
        timestamp: new Date().toISOString(),
        user_id: 'demo-user',
        session_id: 'demo-session'
      },
      {
        event: 'ai_request',
        properties: { model: 'gemini-2.5-pro', tokensUsed: 150 },
        timestamp: new Date().toISOString(),
        user_id: 'demo-user',
        session_id: 'demo-session'
      }
    ]),
    getUsageStats: jest.fn().mockResolvedValue({
      totalEvents: 10,
      pageViews: 5,
      userActions: 3,
      aiRequests: 2,
      aiErrors: 0,
      projectActions: 1,
      subscriptionEvents: 0,
      errors: 0,
      performanceEvents: 1,
      avgAIResponseTime: 1500,
      aiSuccessRate: 100
    }),
  },
}))
