'use client'

import React, { useState, useEffect } from 'react'
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: string
}

interface WebContainerErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: string) => void
}

export class WebContainerErrorBoundary extends React.Component<
  WebContainerErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: WebContainerErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo: errorInfo.componentStack || undefined
    })

    this.props.onError?.(error, errorInfo.componentStack || '')
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="h-full flex items-center justify-center bg-gray-900">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-2">
              WebContainer Error
            </h3>
            
            <p className="text-gray-400 text-sm mb-4">
              Something went wrong with the WebContainer environment. This might be due to:
            </p>
            
            <ul className="text-left text-gray-400 text-sm mb-6 space-y-1">
              <li>• Browser compatibility issues</li>
              <li>• Insufficient memory or resources</li>
              <li>• Network connectivity problems</li>
              <li>• Invalid project configuration</li>
            </ul>
            
            {this.state.error && (
              <details className="mb-4 text-left">
                <summary className="text-gray-500 text-sm cursor-pointer hover:text-gray-400">
                  Technical Details
                </summary>
                <div className="mt-2 p-2 bg-gray-800 rounded text-xs text-gray-500 font-mono">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1">
                        {this.state.errorInfo}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
            
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

interface WebContainerStatusProps {
  isSupported: boolean
  isLoading: boolean
  error?: string
  onRetry?: () => void
}

export function WebContainerStatus({ 
  isSupported, 
  isLoading, 
  error, 
  onRetry 
}: WebContainerStatusProps) {
  if (!isSupported) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiOff className="h-8 w-8 text-yellow-500" />
          </div>
          
          <h3 className="text-xl font-semibold text-white mb-2">
            Browser Not Supported
          </h3>
          
          <p className="text-gray-400 text-sm mb-4">
            WebContainer requires a modern browser with cross-origin isolation enabled.
          </p>
          
          <div className="text-left bg-gray-800 rounded p-4 mb-4">
            <h4 className="text-white font-medium mb-2">Requirements:</h4>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• Chrome 90+ / Edge 90+ / Firefox 115+</li>
              <li>• Cross-Origin Isolation headers</li>
              <li>• Secure context (HTTPS or localhost)</li>
              <li>• Sufficient memory (2GB+ recommended)</li>
            </ul>
          </div>
          
          <div className="text-left bg-gray-800 rounded p-4">
            <h4 className="text-white font-medium mb-2">How to fix:</h4>
            <ol className="text-gray-400 text-sm space-y-1 list-decimal list-inside">
              <li>Use a supported browser</li>
              <li>Ensure you're on HTTPS or localhost</li>
              <li>Check browser console for specific errors</li>
              <li>Try refreshing the page</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          
          <h3 className="text-xl font-semibold text-white mb-2">
            WebContainer Failed
          </h3>
          
          <p className="text-gray-400 text-sm mb-4">
            {error}
          </p>
          
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
          
          <h3 className="text-xl font-semibold text-white mb-2">
            Initializing WebContainer
          </h3>
          
          <p className="text-gray-400 text-sm">
            Setting up your development environment...
          </p>
        </div>
      </div>
    )
  }

  return null
}

interface ConnectionStatusProps {
  isConnected: boolean
  latency?: number
}

export function ConnectionStatus({ isConnected, latency }: ConnectionStatusProps) {
  return (
    <div className="flex items-center space-x-2 text-xs">
      {isConnected ? (
        <>
          <Wifi className="h-3 w-3 text-green-500" />
          <span className="text-green-500">Connected</span>
          {latency && (
            <span className="text-gray-500">({latency}ms)</span>
          )}
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 text-red-500" />
          <span className="text-red-500">Disconnected</span>
        </>
      )}
    </div>
  )
}

interface WebContainerLoadingProps {
  stage: 'init' | 'installing' | 'starting' | 'ready'
  progress?: number
  message?: string
}

export function WebContainerLoading({ stage, progress, message }: WebContainerLoadingProps) {
  const stages = {
    init: { icon: '🚀', label: 'Initializing', color: 'blue' },
    installing: { icon: '📦', label: 'Installing Dependencies', color: 'yellow' },
    starting: { icon: '▶️', label: 'Starting Server', color: 'purple' },
    ready: { icon: '✅', label: 'Ready', color: 'green' }
  }

  const currentStage = stages[stage]

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-900">
      <div className="text-center">
        <div className="text-4xl mb-4">{currentStage.icon}</div>
        
        <h3 className="text-lg font-semibold text-white mb-2">
          {currentStage.label}
        </h3>
        
        {message && (
          <p className="text-gray-400 text-sm mb-4">{message}</p>
        )}
        
        {progress !== undefined && (
          <div className="w-64 bg-gray-700 rounded-full h-2 mb-4">
            <div 
              className={`bg-${currentStage.color}-500 h-2 rounded-full transition-all duration-300`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span>Please wait...</span>
        </div>
      </div>
    </div>
  )
}

// Hook to check WebContainer support
export function useWebContainerSupport() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkSupport = async () => {
      try {
        // Check if we're in a browser
        if (typeof window === 'undefined') {
          setIsSupported(false)
          return
        }

        // Check for cross-origin isolation
        if (!window.crossOriginIsolated) {
          setIsSupported(false)
          return
        }

        // Check for required APIs
        if (!window.OffscreenCanvas || !window.Worker) {
          setIsSupported(false)
          return
        }

        // Try to import WebContainer
        const { WebContainer } = await import('@webcontainer/api')
        
        // Try to boot a minimal WebContainer to test support
        const testContainer = await WebContainer.boot()
        await testContainer.teardown()
        
        setIsSupported(true)
      } catch (error) {
        console.error('WebContainer support check failed:', error)
        setIsSupported(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkSupport()
  }, [])

  return { isSupported, isChecking }
}

// Error types for better error handling
export enum WebContainerErrorType {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  MOUNT_FAILED = 'MOUNT_FAILED',
  INSTALL_FAILED = 'INSTALL_FAILED',
  START_FAILED = 'START_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  MEMORY_ERROR = 'MEMORY_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class WebContainerError extends Error {
  constructor(
    public type: WebContainerErrorType,
    message: string,
    public cause?: Error
  ) {
    super(message)
    this.name = 'WebContainerError'
  }
}

// Utility function to create user-friendly error messages
export function getErrorMessage(error: WebContainerError): string {
  switch (error.type) {
    case WebContainerErrorType.INITIALIZATION_FAILED:
      return 'Failed to initialize WebContainer. Your browser might not support this feature.'
    
    case WebContainerErrorType.MOUNT_FAILED:
      return 'Failed to mount project files. Please check your project structure.'
    
    case WebContainerErrorType.INSTALL_FAILED:
      return 'Failed to install dependencies. Please check your package.json and try again.'
    
    case WebContainerErrorType.START_FAILED:
      return 'Failed to start the development server. Please check your project configuration.'
    
    case WebContainerErrorType.NETWORK_ERROR:
      return 'Network error occurred. Please check your internet connection.'
    
    case WebContainerErrorType.MEMORY_ERROR:
      return 'Insufficient memory. Try closing other tabs or restarting your browser.'
    
    case WebContainerErrorType.TIMEOUT_ERROR:
      return 'Operation timed out. Please try again.'
    
    default:
      return error.message || 'An unknown error occurred.'
  }
}
