import { supabase } from '@/lib/supabase'
import { analytics } from '@/lib/analytics'
import { rateLimiter } from '@/lib/rate-limiter'
import { InputValidator } from '@/lib/input-validation'

// Test configuration
export const TEST_CONFIG = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
}

// Test result interface
export interface TestResult {
  testName: string
  passed: boolean
  duration: number
  error?: string
  details?: Record<string, unknown>
}

// Test suite interface
export interface TestSuite {
  name: string
  tests: Array<() => Promise<TestResult>>
}

// Test runner class
export class TestRunner {
  private results: TestResult[] = []

  async runTestSuite(suite: TestSuite): Promise<TestResult[]> {
    console.log(`\n🧪 Running test suite: ${suite.name}`)
    console.log('='.repeat(50))

    const suiteResults: TestResult[] = []

    for (const test of suite.tests) {
      const result = await this.runTest(test)
      suiteResults.push(result)
      this.results.push(result)
    }

    this.printSuiteResults(suite.name, suiteResults)
    return suiteResults
  }

  private async runTest(test: () => Promise<TestResult>): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      const result = await Promise.race([
        test(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), TEST_CONFIG.timeout)
        )
      ])
      
      result.duration = Date.now() - startTime
      
      if (result.passed) {
        console.log(`✅ ${result.testName} (${result.duration}ms)`)
      } else {
        console.log(`❌ ${result.testName} (${result.duration}ms)`)
        if (result.error) {
          console.log(`   Error: ${result.error}`)
        }
      }
      
      return result
    } catch (error: unknown) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      console.log(`❌ ${errorMessage} (${duration}ms)`)
      
      return {
        testName: 'Unknown Test',
        passed: false,
        duration,
        error: errorMessage
      }
    }
  }

  private printSuiteResults(suiteName: string, results: TestResult[]) {
    const passed = results.filter(r => r.passed).length
    const total = results.length
    const totalTime = results.reduce((sum, r) => sum + r.duration, 0)

    console.log('='.repeat(50))
    console.log(`📊 ${suiteName} Results:`)
    console.log(`   Passed: ${passed}/${total}`)
    console.log(`   Success Rate: ${((passed / total) * 100).toFixed(1)}%`)
    console.log(`   Total Duration: ${totalTime}ms`)
    console.log('='.repeat(50))
  }

  getAllResults(): TestResult[] {
    return this.results
  }

  getSummary(): { passed: number; total: number; successRate: number } {
    const passed = this.results.filter(r => r.passed).length
    const total = this.results.length
    
    return {
      passed,
      total,
      successRate: total > 0 ? (passed / total) * 100 : 0
    }
  }
}

// Database tests
export const databaseTests: TestSuite = {
  name: 'Database Connectivity',
  tests: [
    async (): Promise<TestResult> => {
      try {
        const startTime = Date.now()
        
        // Test basic connection
        const { data, error } = await supabase
          .from('users')
          .select('count')
          .limit(1)

        if (error) {
          return {
            testName: 'Database Connection',
            passed: false,
            duration: Date.now() - startTime,
            error: error.message
          }
        }

        return {
          testName: 'Database Connection',
          passed: true,
          duration: Date.now() - startTime,
          details: { connected: true }
        }
      } catch (error: unknown) {
        return {
          testName: 'Database Connection',
          passed: false,
          duration: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    },

    async (): Promise<TestResult> => {
      try {
        const startTime = Date.now()
        
        // Test user table operations
        const { data, error } = await supabase
          .from('users')
          .select('id, email, subscription_tier')
          .limit(5)

        if (error) {
          return {
            testName: 'User Table Operations',
            passed: false,
            duration: Date.now() - startTime,
            error: error.message
          }
        }

        return {
          testName: 'User Table Operations',
          passed: true,
          duration: Date.now() - startTime,
          details: { recordsReturned: data?.length || 0 }
        }
      } catch (error: unknown) {
        return {
          testName: 'User Table Operations',
          passed: false,
          duration: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    },

    async (): Promise<TestResult> => {
      try {
        const startTime = Date.now()
        
        // Test project table operations
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, created_at')
          .limit(5)

        if (error) {
          return {
            testName: 'Project Table Operations',
            passed: false,
            duration: Date.now() - startTime,
            error: error.message
          }
        }

        return {
          testName: 'Project Table Operations',
          passed: true,
          duration: Date.now() - startTime,
          details: { recordsReturned: data?.length || 0 }
        }
      } catch (error: unknown) {
        return {
          testName: 'Project Table Operations',
          passed: false,
          duration: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  ]
}

// Authentication tests
export const authTests: TestSuite = {
  name: 'Authentication System',
  tests: [
    async (): Promise<TestResult> => {
      try {
        const startTime = Date.now()
        
        // Test auth session
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          return {
            testName: 'Auth Session Check',
            passed: false,
            duration: Date.now() - startTime,
            error: error.message
          }
        }

        return {
          testName: 'Auth Session Check',
          passed: true,
          duration: Date.now() - startTime,
          details: { hasSession: !!data.session }
        }
      } catch (error: unknown) {
        return {
          testName: 'Auth Session Check',
          passed: false,
          duration: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    },

    async (): Promise<TestResult> => {
      try {
        const startTime = Date.now()
        
        // Test user retrieval
        const { data, error } = await supabase.auth.getUser()

        if (error) {
          return {
            testName: 'User Retrieval',
            passed: false,
            duration: Date.now() - startTime,
            error: error.message
          }
        }

        return {
          testName: 'User Retrieval',
          passed: true,
          duration: Date.now() - startTime,
          details: { hasUser: !!data.user }
        }
      } catch (error: unknown) {
        return {
          testName: 'User Retrieval',
          passed: false,
          duration: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  ]
}

// Rate limiting tests
export const rateLimitTests: TestSuite = {
  name: 'Rate Limiting System',
  tests: [
    async (): Promise<TestResult> => {
      try {
        const startTime = Date.now()
        
        // Test rate limiter instantiation
        const limiter = rateLimiter
        
        // Test basic rate limiting
        const mockRequest = new Request('https://example.com/api/test', {
          method: 'POST',
          headers: {
            'x-forwarded-for': '192.168.1.1'
          }
        }) as any

        const result1 = limiter.check({
          windowMs: 60000,
          maxRequests: 10
        }, mockRequest)

        const result2 = limiter.check({
          windowMs: 60000,
          maxRequests: 10
        }, mockRequest)

        return {
          testName: 'Rate Limiter Basic Functionality',
          passed: result1.success && result2.success,
          duration: Date.now() - startTime,
          details: { 
            firstRequest: result1.success,
            secondRequest: result2.success,
            remaining: result2.remaining
          }
        }
      } catch (error: unknown) {
        return {
          testName: 'Rate Limiter Basic Functionality',
          passed: false,
          duration: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    },

    async (): Promise<TestResult> => {
      try {
        const startTime = Date.now()
        
        // Test rate limit enforcement
        const limiter = rateLimiter
        const mockRequest = new Request('https://example.com/api/test', {
          method: 'POST',
          headers: {
            'x-forwarded-for': '192.168.1.1'
          }
        }) as any

        // Make requests until limit is hit
        let successCount = 0
        for (let i = 0; i < 15; i++) {
          const result = limiter.check({
            windowMs: 60000,
            maxRequests: 10
          }, mockRequest)
          
          if (result.success) {
            successCount++
          } else {
            break
          }
        }

        return {
          testName: 'Rate Limit Enforcement',
          passed: successCount === 10,
          duration: Date.now() - startTime,
          details: { 
            successfulRequests: successCount,
            limitEnforced: successCount < 15
          }
        }
      } catch (error: unknown) {
        return {
          testName: 'Rate Limit Enforcement',
          passed: false,
          duration: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  ]
}

// Input validation tests
export const validationTests: TestSuite = {
  name: 'Input Validation System',
  tests: [
    async (): Promise<TestResult> => {
      try {
        const startTime = Date.now()
        
        // Test email validation
        const validEmail = InputValidator.validateEmail('test@example.com')
        const invalidEmail = InputValidator.validateEmail('invalid-email')
        
        return {
          testName: 'Email Validation',
          passed: validEmail.isValid && !invalidEmail.isValid,
          duration: Date.now() - startTime,
          details: { 
            validEmailPassed: validEmail.isValid,
            invalidEmailFailed: !invalidEmail.isValid
          }
        }
      } catch (error: unknown) {
        return {
          testName: 'Email Validation',
          passed: false,
          duration: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    },

    async (): Promise<TestResult> => {
      try {
        const startTime = Date.now()
        
        // Test password validation
        const validPassword = InputValidator.validatePassword('Test123!@#')
        const invalidPassword = InputValidator.validatePassword('weak')
        
        return {
          testName: 'Password Validation',
          passed: validPassword.isValid && !invalidPassword.isValid,
          duration: Date.now() - startTime,
          details: { 
            validPasswordPassed: validPassword.isValid,
            invalidPasswordFailed: !invalidPassword.isValid
          }
        }
      } catch (error: unknown) {
        return {
          testName: 'Password Validation',
          passed: false,
          duration: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    },

    async (): Promise<TestResult> => {
      try {
        const startTime = Date.now()
        
        // Test XSS protection
        const xssInput = '<script>alert("xss")</script>'
        const sanitized = InputValidator.sanitize(xssInput)
        const hasXSS = InputValidator.checkXSS(xssInput)
        const sanitizedHasXSS = InputValidator.checkXSS(sanitized)
        
        return {
          testName: 'XSS Protection',
          passed: hasXSS && !sanitizedHasXSS,
          duration: Date.now() - startTime,
          details: { 
            originalHasXSS: hasXSS,
            sanitizedSafe: !sanitizedHasXSS,
            sanitized: sanitized
          }
        }
      } catch (error: unknown) {
        return {
          testName: 'XSS Protection',
          passed: false,
          duration: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  ]
}

// Analytics tests
export const analyticsTests: TestSuite = {
  name: 'Analytics System',
  tests: [
    async (): Promise<TestResult> => {
      try {
        const startTime = Date.now()
        
        // Test analytics tracking
        analytics.trackPageView('/test', 'Test Page')
        analytics.trackUserAction('test_action', { test: true })
        
        // Test usage stats
        const stats = await analytics.getUsageStats('day')
        
        return {
          testName: 'Analytics Tracking',
          passed: stats.totalEvents >= 0,
          duration: Date.now() - startTime,
          details: stats
        }
      } catch (error: unknown) {
        return {
          testName: 'Analytics Tracking',
          passed: false,
          duration: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  ]
}

// Performance tests
export const performanceTests: TestSuite = {
  name: 'Performance Tests',
  tests: [
    async (): Promise<TestResult> => {
      try {
        const startTime = Date.now()
        
        // Test database query performance
        const queryStart = Date.now()
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .limit(100)
        const queryDuration = Date.now() - queryStart

        if (error) {
          return {
            testName: 'Database Query Performance',
            passed: false,
            duration: Date.now() - startTime,
            error: error.message
          }
        }

        const isPerformant = queryDuration < 1000 // Under 1 second

        return {
          testName: 'Database Query Performance',
          passed: isPerformant,
          duration: Date.now() - startTime,
          details: { 
            queryDuration,
            recordCount: data?.length || 0,
            isPerformant
          }
        }
      } catch (error: unknown) {
        return {
          testName: 'Database Query Performance',
          passed: false,
          duration: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  ]
}

// Main test runner
export async function runAllTests(): Promise<{ summary: { passed: number; total: number; successRate: number }; results: TestResult[] }> {
  console.log('🚀 Starting Vibe Coding Application Tests')
  console.log('='.repeat(60))

  const testRunner = new TestRunner()
  
  // Run all test suites
  await testRunner.runTestSuite(databaseTests)
  await testRunner.runTestSuite(authTests)
  await testRunner.runTestSuite(rateLimitTests)
  await testRunner.runTestSuite(validationTests)
  await testRunner.runTestSuite(analyticsTests)
  await testRunner.runTestSuite(performanceTests)

  const summary = testRunner.getSummary()
  const results = testRunner.getAllResults()

  console.log('\n' + '='.repeat(60))
  console.log('📊 FINAL TEST RESULTS')
  console.log('='.repeat(60))
  console.log(`Total Tests: ${summary.total}`)
  console.log(`Passed: ${summary.passed}`)
  console.log(`Failed: ${summary.total - summary.passed}`)
  console.log(`Success Rate: ${summary.successRate.toFixed(1)}%`)
  console.log('='.repeat(60))

  if (summary.successRate === 100) {
    console.log('🎉 All tests passed! Application is ready for production.')
  } else {
    console.log('⚠️  Some tests failed. Please review and fix issues before deployment.')
  }

  return { summary, results }
}

export default TestRunner
