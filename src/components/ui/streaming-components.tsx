'use client'

import { useState } from 'react'
import { XmlStreamParser, ParsedBlock, StreamState, handleFileWrite } from '@/lib/streaming-parser'

/**
 * Hook for managing streaming state in React components
 */
export function useStreamParser() {
  const [streamState, setStreamState] = useState<StreamState>({
    status: 'idle',
    blocks: []
  })
  const [parser] = useState(() => new XmlStreamParser())

  const processChunk = (chunk: string): void => {
    const blocks = parser.parse(chunk)
    
    setStreamState(prev => {
      const newState = { ...prev, blocks: [...prev.blocks, ...blocks] }
      
      // Update status based on latest blocks
      const latestBlock = blocks[blocks.length - 1]
      if (latestBlock) {
        switch (latestBlock.type) {
          case 'thinking':
            newState.status = latestBlock.isComplete ? 'idle' : 'thinking'
            newState.thinking = latestBlock.isComplete ? latestBlock.content : parser.getIncompleteThinking() || undefined
            break
          case 'shell':
            newState.status = latestBlock.isComplete ? 'idle' : 'shell'
            newState.shellCommand = latestBlock.isComplete ? latestBlock.content : parser.getIncompleteShell() || undefined
            break
          case 'file':
            newState.status = latestBlock.isComplete ? 'idle' : 'writing'
            newState.currentFile = latestBlock.attributes?.path
            break
        }
      }
      
      return newState
    })
  }

  const reset = (): void => {
    parser.reset()
    setStreamState({
      status: 'idle',
      blocks: []
    })
  }

  const isComplete = (): boolean => {
    return !parser.hasIncompleteBlocks()
  }

  return {
    streamState,
    processChunk,
    reset,
    isComplete,
    parser
  }
}

/**
 * React component for displaying real-time streaming status
 */
export function StreamingStatus({ streamState }: { streamState: StreamState }) {
  const getStatusIcon = () => {
    switch (streamState.status) {
      case 'thinking':
        return '🧠'
      case 'shell':
        return '⚡'
      case 'writing':
        return '📝'
      case 'complete':
        return '✅'
      default:
        return '⏳'
    }
  }

  const getStatusText = () => {
    switch (streamState.status) {
      case 'thinking':
        return 'Thinking...'
      case 'shell':
        return `Running: ${streamState.shellCommand || 'command'}`
      case 'writing':
        return `Writing: ${streamState.currentFile || 'file'}`
      case 'complete':
        return 'Complete!'
      default:
        return 'Processing...'
    }
  }

  if (streamState.status === 'idle') return null

  return (
    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
      <span>{getStatusIcon()}</span>
      <span>{getStatusText()}</span>
    </div>
  )
}

/**
 * React component for displaying thinking process in real-time
 */
export function ThinkingDisplay({ thinking }: { thinking?: string }) {
  if (!thinking) return null

  return (
    <div className="bg-gray-800 border border-gray-700 rounded p-3 mb-3">
      <div className="flex items-center space-x-2 mb-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        <span className="text-xs font-medium text-gray-300">Thinking Process</span>
      </div>
      <div className="text-xs text-gray-400 font-mono whitespace-pre-wrap">
        {thinking}
      </div>
    </div>
  )
}
