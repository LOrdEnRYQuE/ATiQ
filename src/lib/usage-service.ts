export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number
  model: 'gemini-flash' | 'gemini-pro'
  timestamp: Date
  operation: 'genesis' | 'consultant' | 'deployment' | 'chat'
  projectId?: string
}

export interface UserQuota {
  userId: string
  tier: 'free' | 'pro' | 'enterprise'
  dailyLimit: number // tokens per day
  monthlyLimit: number // tokens per month
  usedToday: number
  usedThisMonth: number
  lastReset: Date
  features: {
    localPreview: boolean
    githubDeployment: boolean
    vercelDeployment: boolean
    expoDeployment: boolean
    advancedAi: boolean
  }
}

export interface UsageStats {
  today: TokenUsage[]
  thisWeek: TokenUsage[]
  thisMonth: TokenUsage[]
  totalCost: number
  totalTokens: number
  projectedMonthlyCost: number
}

// Token pricing (in USD per 1M tokens)
const TOKEN_PRICING = {
  'gemini-flash': {
    input: 0.075,  // $0.075 per 1M input tokens
    output: 0.15   // $0.15 per 1M output tokens
  },
  'gemini-pro': {
    input: 0.50,   // $0.50 per 1M input tokens  
    output: 1.50   // $1.50 per 1M output tokens
  }
}

// Tier definitions
const TIER_LIMITS = {
  free: {
    dailyLimit: 50000,      // 50k tokens/day
    monthlyLimit: 1000000,  // 1M tokens/month
    features: {
      localPreview: true,
      githubDeployment: false,
      vercelDeployment: false,
      expoDeployment: false,
      advancedAi: false
    }
  },
  pro: {
    dailyLimit: 500000,     // 500k tokens/day
    monthlyLimit: 10000000, // 10M tokens/month
    features: {
      localPreview: true,
      githubDeployment: true,
      vercelDeployment: true,
      expoDeployment: true,
      advancedAi: true
    }
  },
  enterprise: {
    dailyLimit: 5000000,    // 5M tokens/day
    monthlyLimit: 100000000, // 100M tokens/month
    features: {
      localPreview: true,
      githubDeployment: true,
      vercelDeployment: true,
      expoDeployment: true,
      advancedAi: true
    }
  }
}

export class UsageService {
  private storageKey = 'vibe-usage-data'
  private quotaKey = 'vibe-user-quota'

  // Calculate cost based on token usage and model
  calculateCost(inputTokens: number, outputTokens: number, model: 'gemini-flash' | 'gemini-pro'): number {
    const pricing = TOKEN_PRICING[model]
    const inputCost = (inputTokens / 1000000) * pricing.input
    const outputCost = (outputTokens / 1000000) * pricing.output
    return inputCost + outputCost
  }

  // Record token usage
  recordUsage(usage: Omit<TokenUsage, 'timestamp' | 'totalTokens' | 'cost'>): void {
    const totalTokens = usage.inputTokens + usage.outputTokens
    const cost = this.calculateCost(usage.inputTokens, usage.outputTokens, usage.model)
    
    const tokenUsage: TokenUsage = {
      ...usage,
      totalTokens,
      cost,
      timestamp: new Date()
    }

    // Store in local storage (in production, this would go to your database)
    const existingUsage = this.getUsageData()
    existingUsage.push(tokenUsage)
    
    // Keep only last 30 days of data
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const filteredUsage = existingUsage.filter(u => new Date(u.timestamp) > thirtyDaysAgo)
    
    localStorage.setItem(this.storageKey, JSON.stringify(filteredUsage))
    
    // Update quota
    this.updateQuotaUsage(totalTokens)
  }

  // Get usage data from storage
  getUsageData(): TokenUsage[] {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data).map((u: any) => ({
        ...u,
        timestamp: new Date(u.timestamp)
      })) : []
    } catch {
      return []
    }
  }

  // Get usage statistics
  getUsageStats(userId: string): UsageStats {
    const allUsage = this.getUsageData()
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1)

    const todayUsage = allUsage.filter(u => new Date(u.timestamp) >= today)
    const weekUsage = allUsage.filter(u => new Date(u.timestamp) >= weekAgo)
    const monthUsage = allUsage.filter(u => new Date(u.timestamp) >= monthAgo)

    const totalCost = monthUsage.reduce((sum, u) => sum + u.cost, 0)
    const totalTokens = monthUsage.reduce((sum, u) => sum + u.totalTokens, 0)

    // Project monthly cost based on current usage rate
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const dailyAverage = todayUsage.reduce((sum, u) => sum + u.cost, 0)
    const projectedMonthlyCost = dailyAverage * daysInMonth

    return {
      today: todayUsage,
      thisWeek: weekUsage,
      thisMonth: monthUsage,
      totalCost,
      totalTokens,
      projectedMonthlyCost
    }
  }

  // Get or initialize user quota
  getUserQuota(userId: string): UserQuota {
    try {
      const data = localStorage.getItem(this.quotaKey)
      if (data) {
        const quota = JSON.parse(data)
        return {
          ...quota,
          lastReset: new Date(quota.lastReset)
        }
      }
    } catch {
      // Fall through to default
    }

    // Default to free tier
    return this.initializeQuota(userId, 'free')
  }

  // Initialize user quota for a tier
  initializeQuota(userId: string, tier: 'free' | 'pro' | 'enterprise'): UserQuota {
    const limits = TIER_LIMITS[tier]
    const quota: UserQuota = {
      userId,
      tier,
      dailyLimit: limits.dailyLimit,
      monthlyLimit: limits.monthlyLimit,
      usedToday: 0,
      usedThisMonth: 0,
      lastReset: new Date(),
      features: limits.features
    }

    localStorage.setItem(this.quotaKey, JSON.stringify(quota))
    return quota
  }

  // Update quota usage
  private updateQuotaUsage(tokensUsed: number): void {
    const quota = this.getUserQuota('current-user') // In production, use actual user ID
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Reset daily usage if it's a new day
    if (quota.lastReset < today) {
      quota.usedToday = 0
      quota.lastReset = now
    }

    // Reset monthly usage if it's a new month
    if (quota.lastReset < thisMonth) {
      quota.usedThisMonth = 0
    }

    quota.usedToday += tokensUsed
    quota.usedThisMonth += tokensUsed

    localStorage.setItem(this.quotaKey, JSON.stringify(quota))
  }

  // Check if user has enough quota
  hasQuota(userId: string, tokensNeeded: number): { allowed: boolean; reason?: string } {
    const quota = this.getUserQuota(userId)
    
    if (quota.usedToday + tokensNeeded > quota.dailyLimit) {
      return {
        allowed: false,
        reason: `Daily limit exceeded. Used: ${quota.usedToday.toLocaleString()}/${quota.dailyLimit.toLocaleString()} tokens`
      }
    }

    if (quota.usedThisMonth + tokensNeeded > quota.monthlyLimit) {
      return {
        allowed: false,
        reason: `Monthly limit exceeded. Used: ${quota.usedThisMonth.toLocaleString()}/${quota.monthlyLimit.toLocaleString()} tokens`
      }
    }

    return { allowed: true }
  }

  // Check if user can access a feature
  canAccessFeature(userId: string, feature: keyof UserQuota['features']): boolean {
    const quota = this.getUserQuota(userId)
    return quota.features[feature]
  }

  // Upgrade user tier
  upgradeTier(userId: string, newTier: 'free' | 'pro' | 'enterprise'): void {
    const quota = this.getUserQuota(userId)
    const limits = TIER_LIMITS[newTier]
    
    quota.tier = newTier
    quota.dailyLimit = limits.dailyLimit
    quota.monthlyLimit = limits.monthlyLimit
    quota.features = limits.features
    
    localStorage.setItem(this.quotaKey, JSON.stringify(quota))
  }

  // Get remaining quota
  getRemainingQuota(userId: string): { daily: number; monthly: number } {
    const quota = this.getUserQuota(userId)
    return {
      daily: Math.max(0, quota.dailyLimit - quota.usedToday),
      monthly: Math.max(0, quota.monthlyLimit - quota.usedThisMonth)
    }
  }

  // Get quota usage percentage
  getQuotaPercentage(userId: string): { daily: number; monthly: number } {
    const quota = this.getUserQuota(userId)
    return {
      daily: (quota.usedToday / quota.dailyLimit) * 100,
      monthly: (quota.usedThisMonth / quota.monthlyLimit) * 100
    }
  }

  // Reset usage data (for testing or admin)
  resetUsage(): void {
    localStorage.removeItem(this.storageKey)
    localStorage.removeItem(this.quotaKey)
  }
}

// Singleton instance
export const usageService = new UsageService()

// Helper function to estimate tokens for common operations
export function estimateTokens(operation: 'genesis' | 'consultant' | 'deployment', complexity: 'low' | 'medium' | 'high'): { input: number; output: number } {
  const estimates = {
    genesis: {
      low: { input: 2000, output: 8000 },
      medium: { input: 4000, output: 15000 },
      high: { input: 6000, output: 25000 }
    },
    consultant: {
      low: { input: 500, output: 1000 },
      medium: { input: 1500, output: 3000 },
      high: { input: 3000, output: 6000 }
    },
    deployment: {
      low: { input: 1000, output: 2000 },
      medium: { input: 2000, output: 4000 },
      high: { input: 3000, output: 6000 }
    }
  }

  return estimates[operation][complexity]
}
