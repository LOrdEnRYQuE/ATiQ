// Cost per 1,000 tokens (USD)
export const COST_PER_1K_TOKENS = {
  'gemini-2.0-flash': 0.0001, // $0.10 per 1M tokens - incredibly cheap
  'gemini-pro': 0.0005,       // $0.50 per 1M tokens - more capable
  'gemini-1.5-pro': 0.0005,   // Legacy support
  'gemini-1.5-flash': 0.0001, // Legacy support
} as const

// Tier limits (tokens per day)
export const TIER_LIMITS = {
  free: 50000,    // ~10 small projects or 50 consultations
  pro: 10000000,  // Effectively unlimited for power users
  enterprise: 50000000, // For teams and heavy usage
} as const

// Operation cost estimates (conservative)
export const OPERATION_COSTS = {
  genesis: {
    low: 2000,    // Simple project
    medium: 5000,  // Medium complexity
    high: 10000,   // Complex project
  },
  consult: {
    low: 500,     // Quick question
    medium: 1500,  // Detailed consultation
    high: 3000,    // Complex analysis
  },
  modify: {
    low: 200,     // Small change
    medium: 800,  // Medium refactor
    high: 2000,    // Large modification
  },
  deployment: {
    low: 500,     // Simple config
    medium: 1500,  // Complex setup
    high: 3000,    // Full pipeline
  }
} as const

// Model types
export type ModelType = keyof typeof COST_PER_1K_TOKENS
export type OperationType = keyof typeof OPERATION_COSTS
export type ComplexityType = 'low' | 'medium' | 'high'
export type TierType = keyof typeof TIER_LIMITS

/**
 * Estimate tokens from text (rough approximation)
 * Gemini typically uses ~4 characters per token
 */
export function estimateTokens(text: string): number {
  if (!text) return 0
  return Math.ceil(text.length / 4)
}

/**
 * Calculate cost based on tokens and model
 */
export function calculateCost(
  tokens: number, 
  model: ModelType = 'gemini-2.0-flash'
): number {
  return (tokens / 1000) * COST_PER_1K_TOKENS[model]
}

/**
 * Get estimated cost for an operation
 */
export function getOperationCost(
  operation: OperationType,
  complexity: ComplexityType = 'medium',
  model: ModelType = 'gemini-2.0-flash'
): { tokens: number; cost: number } {
  const tokens = OPERATION_COSTS[operation][complexity]
  const cost = calculateCost(tokens, model)
  
  return { tokens, cost }
}

/**
 * Format tokens for display
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`
  }
  return tokens.toString()
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 6
  }).format(cost)
}

/**
 * Check if user can afford an operation
 */
export function canAffordOperation(
  currentUsage: number,
  dailyLimit: number,
  operation: OperationType,
  complexity: ComplexityType = 'medium'
): boolean {
  const { tokens } = getOperationCost(operation, complexity)
  return (currentUsage + tokens) <= dailyLimit
}

/**
 * Get remaining tokens
 */
export function getRemainingTokens(currentUsage: number, dailyLimit: number): number {
  return Math.max(0, dailyLimit - currentUsage)
}

/**
 * Get usage percentage
 */
export function getUsagePercentage(currentUsage: number, dailyLimit: number): number {
  return Math.min((currentUsage / dailyLimit) * 100, 100)
}

/**
 * Get tier color based on usage
 */
export function getUsageColor(percentage: number): {
  bg: string
  text: string
  border: string
} {
  if (percentage >= 100) {
    return {
      bg: 'bg-red-500',
      text: 'text-red-500',
      border: 'border-red-500'
    }
  } else if (percentage >= 80) {
    return {
      bg: 'bg-yellow-500',
      text: 'text-yellow-500',
      border: 'border-yellow-500'
    }
  } else if (percentage >= 60) {
    return {
      bg: 'bg-orange-500',
      text: 'text-orange-500',
      border: 'border-orange-500'
    }
  } else {
    return {
      bg: 'bg-purple-500',
      text: 'text-purple-500',
      border: 'border-purple-500'
    }
  }
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: TierType): string {
  switch (tier) {
    case 'free':
      return 'Starter'
    case 'pro':
      return 'Commander'
    case 'enterprise':
      return 'Admiral'
    default:
      return 'Unknown'
  }
}

/**
 * Get tier icon
 */
export function getTierIcon(tier: TierType): string {
  switch (tier) {
    case 'free':
      return '⚡'
    case 'pro':
      return '👑'
    case 'enterprise':
      return '🚀'
    default:
      return '❓'
  }
}

/**
 * Estimate daily cost based on current usage rate
 */
export function projectDailyCost(
  currentUsage: number,
  hoursElapsed: number = new Date().getHours() + new Date().getMinutes() / 60
): number {
  if (hoursElapsed === 0) return 0
  
  const usageRate = currentUsage / hoursElapsed
  const projectedDailyUsage = usageRate * 24
  return calculateCost(projectedDailyUsage, 'gemini-2.0-flash')
}

/**
 * Get cost optimization suggestions
 */
export function getOptimizationSuggestions(usage: {
  genesis: number
  consult: number
  modify: number
  deployment: number
}): Array<{
  type: 'usage' | 'cost' | 'model'
  title: string
  description: string
  potentialSavings: number
}> {
  const suggestions: {
    type: 'usage' | 'cost' | 'model'
    title: string
    description: string
    potentialSavings: number
  }[] = []
  
  // Check for excessive Genesis usage
  if (usage.genesis > 10) {
    suggestions.push({
      type: 'usage',
      title: 'Reduce Project Generation',
      description: `You generated ${usage.genesis} projects. Consider modifying existing projects.`,
      potentialSavings: usage.genesis * 0.002 // Estimated savings
    })
  }
  
  // Check for high consultation usage
  if (usage.consult > 50) {
    suggestions.push({
      type: 'cost',
      title: 'Optimize Consultations',
      description: `${usage.consult} consultations this month. Try batching questions.`,
      potentialSavings: usage.consult * 0.0002
    })
  }
  
  return suggestions
}
