'use client'

import { useState } from 'react'
import { PreviewError, RuntimeRepairRequest, RuntimeRepairOrchestrator, AIOrchestrator } from '@/lib/runtime-repair'

/**
 * React hook for runtime error monitoring and auto-repair
 */
export function useRuntimeErrorMonitor(aiOrchestrator: AIOrchestrator) {
  const [runtimeError, setRuntimeError] = useState<PreviewError | null>(null)
  const [isRepairing, setIsRepairing] = useState(false)
  const [repairHistory, setRepairHistory] = useState<RuntimeRepairRequest[]>([])
  const [spyActive, setSpyActive] = useState(false)

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
    }
  })

  const handleError = (error: PreviewError, context: {
    files: Record<string, string>
    activeFile?: string
    lastOperation: string
  }) => {
    setRuntimeError(error)
    repairOrchestrator.triggerRuntimeRepair(error, context, aiOrchestrator)
  }

  const clearError = () => {
    setRuntimeError(null)
  }

  return {
    runtimeError,
    isRepairing,
    repairHistory,
    spyActive,
    setSpyActive,
    handleError,
    clearError
  }
}
