import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  TIER_LIMITS, 
  getOperationCost, 
  formatTokens, 
  formatCost,
  getRemainingTokens,
  getUsagePercentage,
  getTierDisplayName,
  getTierIcon,
  type TierType,
  type OperationType,
  type ComplexityType
} from '@/lib/token-utils'

interface UsageState {
  // Current usage tracking
  tokensUsed: number
  dailyLimit: number
  tier: TierType
  lastReset: string
  
  // Usage history (for analytics)
  usageHistory: Array<{
    date: string
    tokensUsed: number
    operations: {
      genesis: number
      consult: number
      modify: number
      deployment: number
    }
  }>
  
  // Today's operations breakdown
  todayOperations: {
    genesis: number
    consult: number
    modify: number
    deployment: number
  }
  
  // Actions
  trackUsage: (operation: OperationType, complexity?: ComplexityType, tokens?: number) => boolean
  checkAvailability: (operation: OperationType, complexity?: ComplexityType) => boolean
  upgradeTier: (newTier: TierType) => void
  resetDaily: () => void
  getUsageStats: () => {
    remaining: number
    percentage: number
    formattedRemaining: string
    formattedUsed: string
    tierName: string
    tierIcon: string
    costToday: number
  }
  getOperationBreakdown: () => {
    genesis: { count: number; tokens: number; cost: number }
    consult: { count: number; tokens: number; cost: number }
    modify: { count: number; tokens: number; cost: number }
    deployment: { count: number; tokens: number; cost: number }
  }
}

export const useUsageStore = create<UsageState>()(
  persist(
    (set, get) => ({
      tokensUsed: 0,
      dailyLimit: TIER_LIMITS.free,
      tier: 'free',
      lastReset: new Date().toDateString(),
      
      usageHistory: [],
      todayOperations: {
        genesis: 0,
        consult: 0,
        modify: 0,
        deployment: 0
      },

      trackUsage: (operation, complexity = 'medium', customTokens) => {
        const state = get()
        
        // Auto-reset if it's a new day
        if (state.lastReset !== new Date().toDateString()) {
          state.resetDaily()
        }
        
        let tokensToUse = customTokens
        let cost = 0
        
        if (!customTokens) {
          const operationCost = getOperationCost(operation, complexity)
          tokensToUse = operationCost.tokens
          cost = operationCost.cost
        } else {
          cost = (customTokens / 1000) * 0.0001 // Flash model pricing
        }
        
        // Check if we have enough tokens
        if (tokensToUse && (state.tokensUsed + tokensToUse) > state.dailyLimit) {
          return false // Not enough tokens
        }
        
        // Update usage
        const newTokensUsed = state.tokensUsed + (tokensToUse || 0)
        
        set((prevState) => ({
          tokensUsed: newTokensUsed,
          todayOperations: {
            ...prevState.todayOperations,
            [operation]: prevState.todayOperations[operation] + 1
          }
        }))
        
        console.log(`Usage tracked: ${operation} (${formatTokens(tokensToUse || 0)} tokens, ${formatCost(cost)})`)
        return true
      },

      checkAvailability: (operation, complexity = 'medium') => {
        const state = get()
        
        // Auto-reset if it's a new day
        if (state.lastReset !== new Date().toDateString()) {
          state.resetDaily()
          return true
        }
        
        const { tokens } = getOperationCost(operation, complexity)
        return (state.tokensUsed + tokens) <= state.dailyLimit
      },

      upgradeTier: (newTier) => {
        set((state) => ({
          tier: newTier,
          dailyLimit: TIER_LIMITS[newTier]
        }))
        
        console.log(`Upgraded to ${getTierDisplayName(newTier)} tier`)
      },

      resetDaily: () => {
        const state = get()
        
        // Save yesterday's usage to history
        if (state.tokensUsed > 0) {
          set((prevState) => ({
            usageHistory: [
              ...prevState.usageHistory.slice(-29), // Keep last 30 days
              {
                date: prevState.lastReset,
                tokensUsed: prevState.tokensUsed,
                operations: { ...prevState.todayOperations }
              }
            ]
          }))
        }
        
        set(() => ({
          tokensUsed: 0,
          lastReset: new Date().toDateString(),
          todayOperations: {
            genesis: 0,
            consult: 0,
            modify: 0,
            deployment: 0
          }
        }))
      },

      getUsageStats: () => {
        const state = get()
        const remaining = getRemainingTokens(state.tokensUsed, state.dailyLimit)
        const percentage = getUsagePercentage(state.tokensUsed, state.dailyLimit)
        
        // Calculate today's cost
        const breakdown = state.getOperationBreakdown()
        const costToday = Object.values(breakdown).reduce((sum, op) => sum + op.cost, 0)
        
        return {
          remaining,
          percentage,
          formattedRemaining: formatTokens(remaining),
          formattedUsed: formatTokens(state.tokensUsed),
          tierName: getTierDisplayName(state.tier),
          tierIcon: getTierIcon(state.tier),
          costToday
        }
      },

      getOperationBreakdown: () => {
        const state = get()
        
        return {
          genesis: {
            count: state.todayOperations.genesis,
            tokens: state.todayOperations.genesis * 5000, // Average tokens per genesis
            cost: state.todayOperations.genesis * 0.0005 // Average cost per genesis
          },
          consult: {
            count: state.todayOperations.consult,
            tokens: state.todayOperations.consult * 1500,
            cost: state.todayOperations.consult * 0.00015
          },
          modify: {
            count: state.todayOperations.modify,
            tokens: state.todayOperations.modify * 800,
            cost: state.todayOperations.modify * 0.00008
          },
          deployment: {
            count: state.todayOperations.deployment,
            tokens: state.todayOperations.deployment * 1500,
            cost: state.todayOperations.deployment * 0.00015
          }
        }
      }
    }),
    {
      name: 'vibe-treasury',
      version: 1
    }
  )
)

// Helper hook for checking availability before making API calls
export function useUsageCheck() {
  const checkAvailability = useUsageStore((state) => state.checkAvailability)
  const trackUsage = useUsageStore((state) => state.trackUsage)
  const upgradeTier = useUsageStore((state) => state.upgradeTier)
  const getUsageStats = useUsageStore((state) => state.getUsageStats)
  
  const withUsageCheck = async function <T>(
    operation: OperationType,
    apiCall: () => Promise<T>,
    complexity?: ComplexityType
  ): Promise<{ success: boolean; data?: T; error?: string }> {
      // Check availability first
      if (!checkAvailability(operation, complexity)) {
        const stats = getUsageStats()
        return {
          success: false,
          error: `Daily limit reached. ${stats.formattedRemaining} tokens remaining. Upgrade to ${stats.tierName} for more.`
        }
      }
      
      try {
        // Make the API call
        const data = await apiCall()
        
        // Track the usage (we'll estimate tokens since we don't get exact counts from Gemini API)
        const tracked = trackUsage(operation, complexity)
        
        if (!tracked) {
          return {
            success: false,
            error: 'Failed to track usage. Please try again.'
          }
        }
        
        return { success: true, data }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'API call failed'
        }
      }
    }
  
  return {
    checkAvailability,
    trackUsage,
    upgradeTier,
    getUsageStats,
    withUsageCheck
  }
}
