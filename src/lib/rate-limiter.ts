import { NextRequest } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string // Custom key generator
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

class RateLimiter {
  private static instance: RateLimiter
  private storage = new Map<string, { count: number; resetTime: number }>()

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter()
    }
    return RateLimiter.instance
  }

  // Clean up expired entries
  private cleanup() {
    const now = Date.now()
    for (const [key, data] of this.storage.entries()) {
      if (now > data.resetTime) {
        this.storage.delete(key)
      }
    }
  }

  // Check rate limit
  check(config: RateLimitConfig, req: NextRequest): RateLimitResult {
    this.cleanup()

    const key = config.keyGenerator ? config.keyGenerator(req) : this.getDefaultKey(req)
    const now = Date.now()
    const windowStart = now - config.windowMs

    // Get or create rate limit data
    let data = this.storage.get(key)
    if (!data || now > data.resetTime) {
      data = { count: 0, resetTime: now + config.windowMs }
      this.storage.set(key, data)
    }

    // Check if request is within limit
    const success = data.count < config.maxRequests
    const remaining = Math.max(0, config.maxRequests - data.count - 1)
    const retryAfter = success ? undefined : Math.ceil((data.resetTime - now) / 1000)

    // Increment count if request should be counted
    const shouldCount = 
      (!config.skipSuccessfulRequests || req.method !== 'GET') &&
      (!config.skipFailedRequests || req.method === 'GET')

    if (shouldCount) {
      data.count++
    }

    return {
      success,
      limit: config.maxRequests,
      remaining,
      resetTime: data.resetTime,
      retryAfter
    }
  }

  // Default key generator (IP-based)
  private getDefaultKey(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0] || realIp || 'unknown'
    return `rate_limit:${ip}`
  }

  // User-based rate limiting
  checkUserRateLimit(config: RateLimitConfig, userId: string): RateLimitResult {
    this.cleanup()

    const key = `user_rate_limit:${userId}`
    const now = Date.now()
    const windowStart = now - config.windowMs

    let data = this.storage.get(key)
    if (!data || now > data.resetTime) {
      data = { count: 0, resetTime: now + config.windowMs }
      this.storage.set(key, data)
    }

    const success = data.count < config.maxRequests
    const remaining = Math.max(0, config.maxRequests - data.count - 1)
    const retryAfter = success ? undefined : Math.ceil((data.resetTime - now) / 1000)

    if (success) {
      data.count++
    }

    return {
      success,
      limit: config.maxRequests,
      remaining,
      resetTime: data.resetTime,
      retryAfter
    }
  }

  // Global rate limiting
  checkGlobalRateLimit(config: RateLimitConfig): RateLimitResult {
    this.cleanup()

    const key = 'global_rate_limit'
    const now = Date.now()

    let data = this.storage.get(key)
    if (!data || now > data.resetTime) {
      data = { count: 0, resetTime: now + config.windowMs }
      this.storage.set(key, data)
    }

    const success = data.count < config.maxRequests
    const remaining = Math.max(0, config.maxRequests - data.count - 1)
    const retryAfter = success ? undefined : Math.ceil((data.resetTime - now) / 1000)

    if (success) {
      data.count++
    }

    return {
      success,
      limit: config.maxRequests,
      remaining,
      resetTime: data.resetTime,
      retryAfter
    }
  }

  // Get current status for a key
  getStatus(key: string): { count: number; resetTime: number } | null {
    this.cleanup()
    return this.storage.get(key) || null
  }

  // Reset rate limit for a key
  reset(key: string): void {
    this.storage.delete(key)
  }

  // Get all active rate limits
  getAllActiveLimits(): Array<{ key: string; count: number; resetTime: number }> {
    this.cleanup()
    return Array.from(this.storage.entries()).map(([key, data]) => ({
      key,
      count: data.count,
      resetTime: data.resetTime
    }))
  }
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // API endpoints
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
  },
  
  // AI requests (more restrictive)
  AI_REQUESTS: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
  },
  
  // Authentication endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts per 15 minutes
  },
  
  // File uploads
  FILE_UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20, // 20 uploads per hour
  },
  
  // Project creation
  PROJECT_CREATION: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 projects per hour
  },
  
  // Global rate limit
  GLOBAL: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000, // 1000 requests per minute globally
  }
} as const

// Rate limiting middleware
export function createRateLimiter(config: RateLimitConfig) {
  const rateLimiter = RateLimiter.getInstance()

  return async (req: NextRequest): Promise<RateLimitResult> => {
    return rateLimiter.check(config, req)
  }
}

// User-based rate limiting
export function createUserRateLimiter(config: RateLimitConfig) {
  const rateLimiter = RateLimiter.getInstance()

  return async (userId: string): Promise<RateLimitResult> => {
    return rateLimiter.checkUserRateLimit(config, userId)
  }
}

// Global rate limiting
export function createGlobalRateLimiter(config: RateLimitConfig) {
  const rateLimiter = RateLimiter.getInstance()

  return async (): Promise<RateLimitResult> => {
    return rateLimiter.checkGlobalRateLimit(config)
  }
}

// Helper function to create rate limit response headers
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toUTCString(),
  }

  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString()
  }

  return headers
}

// Rate limit error response
export function createRateLimitErrorResponse(result: RateLimitResult): Response {
  const headers = createRateLimitHeaders(result)
  
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded',
      retryAfter: result.retryAfter,
      limit: result.limit,
      remaining: result.remaining,
      resetTime: result.resetTime
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }
  )
}

export const rateLimiter = RateLimiter.getInstance()
