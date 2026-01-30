'use client'

import { useState } from 'react'
import { PreviewError, RuntimeRepairRequest, AIOrchestrator } from '@/lib/runtime-repair'
import { RuntimeRepairOrchestrator } from '@/lib/runtime-repair'

/**
 * React hook for runtime error monitoring and auto-repair
 */
export function useRuntimeErrorMonitor(aiOrchestrator?: AIOrchestrator) {
  const [runtimeError, setRuntimeError] = useState<PreviewError | null>(null)
  const [isRepairing, setIsRepairing] = useState(false)
  const [repairHistory, setRepairHistory] = useState<RuntimeRepairRequest[]>([])
  const [spyActive, setSpyActive] = useState(false)
  const [circuitBreakerTripped, setCircuitBreakerTripped] = useState(false)
  const [circuitBreakerReason, setCircuitBreakerReason] = useState<string | null>(null)

  const repairOrchestrator = new RuntimeRepairOrchestrator({
    onStart: (request) => {
      setIsRepairing(true)
      setRepairHistory((prev: RuntimeRepairRequest[]) => [...prev, request])
    },
    onSuccess: (request, patches) => {
      setIsRepairing(false)
      console.log('✅ Runtime repair successful:', patches.length, 'patches applied')
    },
    onError: (request, error) => {
      setIsRepairing(false)
      console.error('❌ Runtime repair failed:', error)
    },
    onCircuitBreakerTripped: (reason, stats) => {
      console.warn('🚨 Circuit breaker tripped:', reason)
      console.warn('📊 Circuit breaker stats:', stats)
      setCircuitBreakerTripped(true)
      setCircuitBreakerReason(reason)
    }
  })

  const handleError = (error: PreviewError, context: {
    files: Record<string, string>
    activeFile?: string
    lastOperation: string
  }) => {
    setRuntimeError(error)
    if (aiOrchestrator) {
      repairOrchestrator.triggerRuntimeRepair(error, context, aiOrchestrator)
    }
  }

  const clearError = () => {
    setRuntimeError(null)
  }

  const resetCircuitBreaker = () => {
    setCircuitBreakerTripped(false)
    setCircuitBreakerReason(null)
    repairOrchestrator.resetCircuitBreaker()
  }

  return {
    runtimeError,
    isRepairing,
    repairHistory,
    spyActive,
    setSpyActive,
    handleError,
    clearError,
    circuitBreakerTripped,
    circuitBreakerReason,
    resetCircuitBreaker,
    getCircuitBreakerStats: () => repairOrchestrator.getStats()
  }
}
