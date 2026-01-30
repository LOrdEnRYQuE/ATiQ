'use client'

import { useEffect, useRef } from 'react'
import { 
  Terminal, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Clock,
  ExternalLink,
  Download,
  Zap
} from 'lucide-react'
import { useBuildStream, BuildStatus } from '@/hooks/use-build-stream'

interface LiveTerminalProps {
  repo: string
  token: string
  runId?: number
  onComplete?: (result: 'success' | 'failure') => void
  className?: string
}

export default function LiveTerminal({ 
  repo, 
  token, 
  runId, 
  onComplete,
  className = '' 
}: LiveTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const { buildRun, logs, status, error, isPolling, progress } = useBuildStream({
    repo,
    token,
    runId
  })

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [logs])

  // Notify parent when build completes
  useEffect(() => {
    if ((status === 'success' || status === 'failure') && onComplete) {
      onComplete(status)
    }
  }, [status, onComplete])

  const getStatusIcon = () => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-400" />
      case 'in_progress':
        return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'failure':
        return <XCircle className="h-4 w-4 text-red-400" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-400" />
      default:
        return <Terminal className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'queued':
        return 'Build queued...'
      case 'in_progress':
        return `Building... ${progress > 0 ? `(${Math.round(progress)}%)` : ''}`
      case 'success':
        return '🚀 Build completed successfully!'
      case 'failure':
        return '❌ Build failed'
      case 'cancelled':
        return 'Build cancelled'
      default:
        return 'Initializing...'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'queued':
        return 'text-yellow-400 border-yellow-400/30'
      case 'in_progress':
        return 'text-blue-400 border-blue-400/30'
      case 'success':
        return 'text-green-400 border-green-400/30'
      case 'failure':
        return 'text-red-400 border-red-400/30'
      case 'cancelled':
        return 'text-gray-400 border-gray-400/30'
      default:
        return 'text-gray-400 border-gray-400/30'
    }
  }

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'success':
        return '✓'
      case 'error':
        return '✗'
      case 'warn':
        return '⚠'
      case 'info':
        return 'ℹ'
      default:
        return '→'
    }
  }

  const getLogColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'text-green-400'
      case 'error':
        return 'text-red-400'
      case 'warn':
        return 'text-yellow-400'
      case 'info':
        return 'text-blue-400'
      default:
        return 'text-gray-300'
    }
  }

  const getDownloadLinks = () => {
    if (status !== 'success' || !buildRun) return null

    // Check if this is a desktop build with artifacts
    const hasArtifacts = buildRun.jobs.some(job => 
      job.name.toLowerCase().includes('build') && job.status === 'success'
    )

    if (!hasArtifacts) return null

    return (
      <div className="mt-4 p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Download className="h-4 w-4 text-green-400" />
          <span className="text-sm font-medium text-green-400">Build Artifacts Ready</span>
        </div>
        <div className="flex space-x-2">
          <a
            href={buildRun.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-green-300 hover:text-green-200 flex items-center space-x-1"
          >
            <ExternalLink className="h-3 w-3" />
            <span>Download Builds</span>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-black border border-gray-800 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900/50 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <div className="font-medium text-white flex items-center space-x-2">
              {getStatusText()}
              {status === 'in_progress' && (
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-linear-to-r from-blue-400 to-cyan-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{Math.round(progress)}%</span>
                </div>
              )}
            </div>
            {buildRun && (
              <div className="text-xs text-gray-400">
                Run #{buildRun.run_number} on {buildRun.head_branch}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isPolling && (
            <div className="flex items-center space-x-1">
              <Zap className="h-3 w-3 text-blue-400 animate-pulse" />
              <span className="text-xs text-gray-400">Live</span>
            </div>
          )}
          
          {buildRun && (
            <a
              href={buildRun.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-white flex items-center space-x-1"
            >
              <ExternalLink className="h-3 w-3" />
              <span>GitHub</span>
            </a>
          )}
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={terminalRef}
        className="h-96 overflow-y-auto p-4 bg-gray-950 font-mono text-sm"
        style={{ 
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(255,255,255,0.02) 20px, rgba(255,255,255,0.02) 21px)',
          backgroundSize: '100% 21px'
        }}
      >
        {error ? (
          <div className="text-red-400">
            <div className="flex items-center space-x-2 mb-2">
              <XCircle className="h-4 w-4" />
              <span className="font-medium">Connection Error</span>
            </div>
            <div className="text-sm text-red-300">{error}</div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-gray-500">
            {isPolling ? 'Waiting for build to start...' : 'No logs available'}
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div key={index} className={`${getLogColor(log.level)} font-mono text-sm`}>
                <span className="text-gray-500 mr-2">[{log.timestamp}]</span>
                <span className="mr-2">{getLogIcon(log.level)}</span>
                <span>{log.message}</span>
                {log.progress && (
                  <span className="ml-2 text-xs bg-gray-800 px-2 py-1 rounded">
                    {log.progress}%
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className={`px-4 py-2 bg-gray-900/50 border-t border-gray-800 flex items-center justify-between ${getStatusColor()}`}>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-xs font-medium">{getStatusText()}</span>
        </div>
        
        <div className="text-xs">
          {logs.length} lines logged
        </div>
      </div>

      {/* Download Links for successful builds */}
      {getDownloadLinks()}
    </div>
  )
}
