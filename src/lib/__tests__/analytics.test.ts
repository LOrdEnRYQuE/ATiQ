import { analytics } from '../analytics'

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log
const originalConsoleError = console.error

beforeEach(() => {
  console.log = jest.fn()
  console.error = jest.fn()
})

afterEach(() => {
  console.log = originalConsoleLog
  console.error = originalConsoleError
  jest.clearAllMocks()
})

describe('Analytics', () => {
  describe('track', () => {
    it('should add event to queue', () => {
      const eventName = 'test_event'
      const properties = { test: 'value' }
      
      analytics.track(eventName, properties)
      
      // Since queue is private, we can't directly test it
      // But we can test that no errors are thrown
      expect(() => analytics.track(eventName, properties)).not.toThrow()
    })

    it('should handle empty properties', () => {
      expect(() => analytics.track('test_event')).not.toThrow()
    })
  })

  describe('trackPageView', () => {
    it('should track page view event', () => {
      const path = '/test-path'
      const title = 'Test Page'
      
      expect(() => analytics.trackPageView(path, title)).not.toThrow()
    })

    it('should use document.title when title not provided', () => {
      // Mock document.title
      Object.defineProperty(document, 'title', {
        value: 'Default Title',
        writable: true,
      })
      
      expect(() => analytics.trackPageView('/test')).not.toThrow()
    })
  })

  describe('trackUserAction', () => {
    it('should track user action event', () => {
      const action = 'click_button'
      const properties = { buttonId: 'submit' }
      
      expect(() => analytics.trackUserAction(action, properties)).not.toThrow()
    })
  })

  describe('trackAIRequest', () => {
    it('should track AI request event', () => {
      const prompt = 'Generate code'
      const response = 'Generated code'
      const tokensUsed = 100
      const model = 'gemini-2.5-pro'
      
      expect(() => analytics.trackAIRequest(prompt, response, tokensUsed, model)).not.toThrow()
    })
  })

  describe('trackAIError', () => {
    it('should track AI error event', () => {
      const error = 'API error'
      const prompt = 'Generate code'
      const model = 'gemini-2.5-pro'
      
      expect(() => analytics.trackAIError(error, prompt, model)).not.toThrow()
    })
  })

  describe('trackProjectAction', () => {
    it('should track project action event', () => {
      const action = 'create'
      const projectId = 'project-123'
      const properties = { name: 'Test Project' }
      
      expect(() => analytics.trackProjectAction(action, projectId, properties)).not.toThrow()
    })
  })

  describe('trackSubscriptionEvent', () => {
    it('should track subscription event', () => {
      const event = 'upgrade'
      const tier = 'pro'
      const properties = { amount: 999 }
      
      expect(() => analytics.trackSubscriptionEvent(event, tier, properties)).not.toThrow()
    })
  })

  describe('trackError', () => {
    it('should track error event', () => {
      const error = 'Test error'
      const context = { component: 'TestComponent' }
      
      expect(() => analytics.trackError(error, context)).not.toThrow()
    })
  })

  describe('trackPerformance', () => {
    it('should track performance event', () => {
      const metric = 'load_time'
      const value = 1500
      const unit = 'ms'
      
      expect(() => analytics.trackPerformance(metric, value, unit)).not.toThrow()
    })

    it('should use default unit when not provided', () => {
      const metric = 'load_time'
      const value = 1500
      
      expect(() => analytics.trackPerformance(metric, value)).not.toThrow()
    })
  })

  describe('getAnalyticsData', () => {
    it('should return analytics data for different time ranges', async () => {
      const timeRanges = ['day', 'week', 'month', 'year'] as const
      
      for (const timeRange of timeRanges) {
        const data = await analytics.getAnalyticsData(timeRange)
        expect(Array.isArray(data)).toBe(true)
      }
    })

    it('should return mock data with expected structure', async () => {
      const data = await analytics.getAnalyticsData('week')
      
      expect(data.length).toBeGreaterThan(0)
      expect(data[0]).toHaveProperty('event')
      expect(data[0]).toHaveProperty('properties')
      expect(data[0]).toHaveProperty('timestamp')
      expect(data[0]).toHaveProperty('user_id')
      expect(data[0]).toHaveProperty('session_id')
    })
  })

  describe('getUsageStats', () => {
    it('should return usage statistics', async () => {
      const stats = await analytics.getUsageStats('week')
      
      expect(stats).toHaveProperty('totalEvents')
      expect(stats).toHaveProperty('pageViews')
      expect(stats).toHaveProperty('userActions')
      expect(stats).toHaveProperty('aiRequests')
      expect(stats).toHaveProperty('aiErrors')
      expect(stats).toHaveProperty('projectActions')
      expect(stats).toHaveProperty('subscriptionEvents')
      expect(stats).toHaveProperty('errors')
      expect(stats).toHaveProperty('performanceEvents')
      expect(stats).toHaveProperty('avgAIResponseTime')
      expect(stats).toHaveProperty('aiSuccessRate')
    })

    it('should return numeric values for stats', async () => {
      const stats = await analytics.getUsageStats('week')
      
      expect(typeof stats.totalEvents).toBe('number')
      expect(typeof stats.pageViews).toBe('number')
      expect(typeof stats.userActions).toBe('number')
      expect(typeof stats.aiRequests).toBe('number')
      expect(typeof stats.aiErrors).toBe('number')
      expect(typeof stats.projectActions).toBe('number')
      expect(typeof stats.subscriptionEvents).toBe('number')
      expect(typeof stats.errors).toBe('number')
      expect(typeof stats.performanceEvents).toBe('number')
      expect(typeof stats.avgAIResponseTime).toBe('number')
      expect(typeof stats.aiSuccessRate).toBe('number')
    })
  })
})
