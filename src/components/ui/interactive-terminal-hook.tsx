'use client'

import { useState } from 'react'
import { InteractiveShellExecutor, TerminalPrompt } from '@/lib/interactive-terminal'

/**
 * React hook for managing interactive terminal state
 */
export function useInteractiveTerminal() {
  const [executor] = useState(() => new InteractiveShellExecutor())
  const [currentCommand, setCurrentCommand] = useState<string | null>(null)
  const [output, setOutput] = useState<string>('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [pendingPrompt, setPendingPrompt] = useState<TerminalPrompt | null>(null)

  const executeCommand = async (command: string) => {
    setCurrentCommand(command)
    setIsExecuting(true)
    setOutput('')

    try {
      const result = await executor.executeCommand(command)
      setOutput(result.output)
      
      if (result.error) {
        setOutput((prev: string) => prev + `\nError: ${result.error}`)
      }
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsExecuting(false)
      setCurrentCommand(null)
    }
  }

  const respondToPrompt = async (response: string) => {
    if (pendingPrompt) {
      // Continue execution with user response
      setOutput((prev: string) => prev + `\nUser: ${response}\n`)
      // Would continue the hanging process here
      setPendingPrompt(null)
    }
  }

  return {
    executeCommand,
    respondToPrompt,
    currentCommand,
    output,
    isExecuting,
    pendingPrompt
  }
}
