import { usageService, TokenUsage } from './usage-service'

export interface UsageAlert {
  id: string
  type: 'quota_warning' | 'quota_exceeded' | 'cost_alert' | 'usage_spike'
  severity: 'info' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  acknowledged: boolean
  action?: {
    label: string
    url: string
  }
}

export class UsageTracker {
  private static instance: UsageTracker
  private alerts: UsageAlert[] = []
  private alertCallbacks: ((alert: UsageAlert) => void)[] = []
  private trackingInterval: NodeJS.Timeout | null = null
  private lastUsageCheck: Date = new Date()

  private constructor() {
    this.startTracking()
  }

  static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker()
    }
    return UsageTracker.instance
  }

  // Start real-time usage tracking
  private startTracking() {
    // Check usage every 30 seconds
    this.trackingInterval = setInterval(() => {
      this.checkUsageAndAlerts()
    }, 30000)
  }

  // Stop tracking
  stopTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval)
      this.trackingInterval = null
    }
  }

  // Register alert callback
  onAlert(callback: (alert: UsageAlert) => void) {
    this.alertCallbacks.push(callback)
  }

  // Remove alert callback
  removeAlertCallback(callback: (alert: UsageAlert) => void) {
    const index = this.alertCallbacks.indexOf(callback)
    if (index > -1) {
      this.alertCallbacks.splice(index, 1)
    }
  }

  // Track usage in real-time
  trackUsage(usage: Omit<TokenUsage, 'timestamp' | 'totalTokens' | 'cost'>) {
    const totalTokens = usage.inputTokens + usage.outputTokens
    const cost = usageService.calculateCost(usage.inputTokens, usage.outputTokens, usage.model)
    
    const tokenUsage: TokenUsage = {
      ...usage,
      totalTokens,
      cost,
      timestamp: new Date()
    }

    // Record the usage
    usageService.recordUsage(usage)

    // Check for immediate alerts
    this.checkImmediateAlerts(tokenUsage)
  }

  // Check for usage spikes and cost alerts
  private checkUsageAndAlerts() {
    const userId = 'current-user' // In production, get from auth context
    const stats = usageService.getUsageStats(userId)
    const quota = usageService.getUserQuota(userId)

    // Check for usage spike (more than 2x normal usage)
    const todayUsage = stats.today.reduce((sum, u) => sum + u.totalTokens, 0)
    const avgDailyUsage = stats.thisMonth.length > 0 
      ? stats.thisMonth.reduce((sum, u) => sum + u.totalTokens, 0) / 30
      : 0

    if (avgDailyUsage > 0 && todayUsage > avgDailyUsage * 2) {
      this.createAlert({
        type: 'usage_spike',
        severity: 'warning',
        title: 'Usage Spike Detected',
        message: `Today's usage (${this.formatTokens(todayUsage)}) is more than 2x your daily average.`,
        action: {
          label: 'View Usage',
          url: '/settings'
        }
      })
    }

    // Check for high projected costs
    if (stats.projectedMonthlyCost > 50) {
      this.createAlert({
        type: 'cost_alert',
        severity: 'warning',
        title: 'High Projected Cost',
        message: `Projected monthly cost: $${stats.projectedMonthlyCost.toFixed(2)}. Consider optimizing usage.`,
        action: {
          label: 'Manage Usage',
          url: '/settings'
        }
      })
    }

    // Check quota warnings
    const quotaPercentage = usageService.getQuotaPercentage(userId)
    
    if (quotaPercentage.daily >= 90) {
      this.createAlert({
        type: 'quota_warning',
        severity: 'error',
        title: 'Daily Quota Almost Exhausted',
        message: `${quotaPercentage.daily.toFixed(1)}% of daily quota used. ${this.formatTokens(quota.dailyLimit - quota.usedToday)} tokens remaining.`,
        action: {
          label: 'Upgrade Plan',
          url: '/settings?upgrade=true'
        }
      })
    } else if (quotaPercentage.daily >= 75) {
      this.createAlert({
        type: 'quota_warning',
        severity: 'warning',
        title: 'Daily Quota Running Low',
        message: `${quotaPercentage.daily.toFixed(1)}% of daily quota used. Consider upgrading for more tokens.`,
        action: {
          label: 'View Plans',
          url: '/settings'
        }
      })
    }

    if (quotaPercentage.monthly >= 90) {
      this.createAlert({
        type: 'quota_warning',
        severity: 'error',
        title: 'Monthly Quota Almost Exhausted',
        message: `${quotaPercentage.monthly.toFixed(1)}% of monthly quota used.`,
        action: {
          label: 'Upgrade Plan',
          url: '/settings?upgrade=true'
        }
      })
    }

    this.lastUsageCheck = new Date()
  }

  // Check for immediate alerts after usage
  private checkImmediateAlerts(usage: TokenUsage) {
    // Check if this single operation was expensive
    if (usage.cost > 5) {
      this.createAlert({
        type: 'cost_alert',
        severity: 'warning',
        title: 'High Cost Operation',
        message: `Recent ${usage.operation} cost $${usage.cost.toFixed(4)}. Consider optimizing prompts.`,
        action: {
          label: 'View Details',
          url: '/settings'
        }
      })
    }

    // Check if this operation used a lot of tokens
    if (usage.totalTokens > 10000) {
      this.createAlert({
        type: 'usage_spike',
        severity: 'info',
        title: 'High Token Usage',
        message: `Recent ${usage.operation} used ${this.formatTokens(usage.totalTokens)} tokens.`,
        action: {
          label: 'View Usage',
          url: '/settings'
        }
      })
    }
  }

  // Create and dispatch alert
  private createAlert(alertData: Omit<UsageAlert, 'id' | 'timestamp' | 'acknowledged'>) {
    const alert: UsageAlert = {
      ...alertData,
      id: this.generateAlertId(),
      timestamp: new Date(),
      acknowledged: false
    }

    // Avoid duplicate alerts within 5 minutes
    const recentAlerts = this.alerts.filter(a => 
      a.type === alert.type && 
      a.timestamp > new Date(Date.now() - 5 * 60 * 1000)
    )

    if (recentAlerts.length === 0) {
      this.alerts.push(alert)
      this.dispatchAlert(alert)
    }
  }

  // Dispatch alert to callbacks
  private dispatchAlert(alert: UsageAlert) {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert)
      } catch (error) {
        console.error('Error in alert callback:', error)
      }
    })
  }

  // Get all alerts
  getAlerts(): UsageAlert[] {
    return this.alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Get unacknowledged alerts
  getUnacknowledgedAlerts(): UsageAlert[] {
    return this.alerts.filter(alert => !alert.acknowledged)
  }

  // Acknowledge alert
  acknowledgeAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
    }
  }

  // Clear all alerts
  clearAlerts() {
    this.alerts = []
  }

  // Get usage summary
  getUsageSummary(userId: string = 'current-user') {
    const stats = usageService.getUsageStats(userId)
    const quota = usageService.getUserQuota(userId)
    const remaining = usageService.getRemainingQuota(userId)

    return {
      today: {
        tokens: stats.today.reduce((sum, u) => sum + u.totalTokens, 0),
        cost: stats.today.reduce((sum, u) => sum + u.cost, 0),
        operations: stats.today.length
      },
      thisWeek: {
        tokens: stats.thisWeek.reduce((sum, u) => sum + u.totalTokens, 0),
        cost: stats.thisWeek.reduce((sum, u) => sum + u.cost, 0),
        operations: stats.thisWeek.length
      },
      thisMonth: {
        tokens: stats.thisMonth.reduce((sum, u) => sum + u.totalTokens, 0),
        cost: stats.totalCost,
        operations: stats.thisMonth.length
      },
      quota: {
        tier: quota.tier,
        dailyLimit: quota.dailyLimit,
        monthlyLimit: quota.monthlyLimit,
        usedToday: quota.usedToday,
        usedThisMonth: quota.usedThisMonth,
        remainingDaily: remaining.daily,
        remainingMonthly: remaining.monthly
      },
      projected: {
        monthlyCost: stats.projectedMonthlyCost,
        monthlyTokens: stats.totalTokens
      }
    }
  }

  // Generate unique alert ID
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Format tokens for display
  private formatTokens(tokens: number): string {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`
    } else if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`
    }
    return tokens.toString()
  }

  // Get cost optimization suggestions
  getOptimizationSuggestions(userId: string = 'current-user') {
    const stats = usageService.getUsageStats(userId)
    const suggestions = []

    // Analyze usage patterns
    const genesisUsage = stats.thisMonth.filter(u => u.operation === 'genesis')
    const consultantUsage = stats.thisMonth.filter(u => u.operation === 'consultant')
    const deploymentUsage = stats.thisMonth.filter(u => u.operation === 'deployment')

    // Check for expensive operations
    const expensiveOps = stats.thisMonth.filter(u => u.cost > 2)
    if (expensiveOps.length > 0) {
      suggestions.push({
        type: 'cost',
        title: 'Optimize Expensive Operations',
        description: `${expensiveOps.length} operations cost over $2 each. Consider using more efficient prompts.`,
        savings: expensiveOps.reduce((sum, op) => sum + op.cost * 0.3, 0) // Potential 30% savings
      })
    }

    // Check for overuse of Genesis
    if (genesisUsage.length > 10) {
      suggestions.push({
        type: 'usage',
        title: 'Reduce Project Generation',
        description: `You generated ${genesisUsage.length} projects this month. Consider modifying existing projects instead.`,
        savings: genesisUsage.length * 5 // Estimated savings per avoided generation
      })
    }

    // Check model usage efficiency
    const proUsage = stats.thisMonth.filter(u => u.model === 'gemini-pro')
    const flashUsage = stats.thisMonth.filter(u => u.model === 'gemini-flash')
    
    if (proUsage.length > flashUsage.length * 2) {
      suggestions.push({
        type: 'model',
        title: 'Use Flash Model More',
        description: 'Consider using the Flash model for simpler tasks to reduce costs.',
        savings: proUsage.reduce((sum, op) => sum + op.cost * 0.7, 0) // Potential 70% savings
      })
    }

    return suggestions
  }
}

// Export singleton instance
export const usageTracker = UsageTracker.getInstance()
