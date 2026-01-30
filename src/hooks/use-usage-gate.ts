import { useUsageStore } from '@/lib/store/usage'
import type { OperationType, ComplexityType } from '@/lib/token-utils'

export interface UsageGateOptions {
  operation: OperationType
  complexity?: ComplexityType
  customTokens?: number
  onQuotaExceeded?: (message: string) => void
  onSuccess?: () => void
  onError?: (error: string) => void
}

/**
 * Hook for gating API calls based on usage quota
 * Returns a function that wraps API calls with quota checking
 */
export function useUsageGate() {
  const { checkAvailability, trackUsage, getUsageStats, upgradeTier } = useUsageStore()

  /**
   * Execute an API call with quota checking
   * @param options Configuration for the usage gate
   * @param apiCall The API function to call
   * @returns Promise with success status and data
   */
  async function withUsageCheck<T>(
    options: UsageGateOptions,
    apiCall: () => Promise<T>
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const { operation, complexity = 'medium', customTokens, onQuotaExceeded, onSuccess, onError } = options

    // Check availability first
    if (!checkAvailability(operation, complexity)) {
      const stats = getUsageStats()
      const message = `Daily limit reached. ${stats.formattedRemaining} tokens remaining. Upgrade to ${stats.tierName} for more.`
      
      onQuotaExceeded?.(message)
      return { success: false, error: message }
    }

    try {
      // Make the API call
      const data = await apiCall()
      
      // Track the usage
      const tracked = trackUsage(operation, complexity, customTokens)
      
      if (!tracked) {
        const error = 'Failed to track usage. Please try again.'
        onError?.(error)
        return { success: false, error }
      }
      
      onSuccess?.()
      return { success: true, data }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'API call failed'
      onError?.(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Quick check without executing API call
   */
  function canExecute(operation: OperationType, complexity: ComplexityType = 'medium'): boolean {
    return checkAvailability(operation, complexity)
  }

  /**
   * Get current usage stats
   */
  function getStats() {
    return getUsageStats()
  }

  /**
   * Upgrade tier
   */
  function upgrade() {
    const currentTier = useUsageStore.getState().tier
    if (currentTier === 'free') {
      upgradeTier('pro')
    } else if (currentTier === 'pro') {
      upgradeTier('enterprise')
    }
  }

  return {
    withUsageCheck,
    canExecute,
    getStats,
    upgrade
  }
}

/**
 * Higher-order component for wrapping API calls
 */
export function withUsageGate<T extends any[], R>(
  operation: OperationType,
  apiFunction: (...args: T) => Promise<R>,
  complexity: ComplexityType = 'medium'
) {
  return async function(...args: T): Promise<{ success: boolean; data?: R; error?: string }> {
    const { checkAvailability, trackUsage, getUsageStats } = useUsageStore.getState()

    // Check availability
    if (!checkAvailability(operation, complexity)) {
      const stats = getUsageStats()
      const message = `Daily limit reached. ${stats.formattedRemaining} tokens remaining. Upgrade to ${stats.tierName} for more.`
      return { success: false, error: message }
    }

    try {
      // Execute API call
      const data = await apiFunction(...args)
      
      // Track usage
      const tracked = trackUsage(operation, complexity)
      
      if (!tracked) {
        return { success: false, error: 'Failed to track usage. Please try again.' }
      }
      
      return { success: true, data }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'API call failed'
      return { success: false, error: errorMessage }
    }
  }
}
