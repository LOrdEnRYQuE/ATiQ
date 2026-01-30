'use client'

import { useState, useEffect, useRef } from 'react'
import { WebContainer } from '@webcontainer/api'
import { Monitor, Smartphone, Tablet, RotateCcw, ExternalLink, Loader2, AlertCircle, Activity } from 'lucide-react'
import { injectSpyScript, hasSpyScript } from '@/lib/spy-script'
import { PreviewError, AIOrchestrator } from '@/lib/runtime-repair'
import { useRuntimeErrorMonitor } from '@/lib/runtime-error-monitor'
import webContainerManager from '@/lib/webcontainer-manager'

interface WebContainerPreviewProps {
  files: Record<string, string>
  onRuntimeError?: (error: PreviewError) => void
  aiOrchestrator?: AIOrchestrator
}

interface ServerInfo {
  url: string
  port: number
}

export default function WebContainerPreview({ files, onRuntimeError, aiOrchestrator }: WebContainerPreviewProps) {
  const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null)
  const [appStatus, setAppStatus] = useState<'loading' | 'running' | 'crashed' | 'repairing' | 'circuit-tripped'>('loading')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  
  // Runtime error monitoring
  const { 
    runtimeError, 
    isRepairing, 
    handleError, 
    clearError,
    circuitBreakerTripped,
    circuitBreakerReason,
    resetCircuitBreaker,
    getCircuitBreakerStats 
  } = useRuntimeErrorMonitor(aiOrchestrator)

  const viewModes = {
    desktop: { width: '100%', height: '100%', icon: Monitor },
    tablet: { width: '768px', height: '1024px', icon: Tablet },
    mobile: { width: '375px', height: '667px', icon: Smartphone }
  }

  // Listen for messages from iframe (Spy Script)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security: Only accept messages from our iframe
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) {
        return
      }

      if (event.data.type === 'ATIQ_PREVIEW_ERROR') {
        const errorPayload = event.data.payload
        console.log('🚨 Runtime error detected in preview:', errorPayload)
        
        // Update app status
        if (errorPayload?.severity === 'error') {
          setAppStatus('crashed')
        }
        
        // Handle error with runtime monitoring
        handleError(errorPayload, {
          files,
          lastOperation: 'preview-update'
        })
        
        // Notify parent component
        if (onRuntimeError) {
          onRuntimeError(errorPayload)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [files, handleError, onRuntimeError])

  // Update app status based on loading states
  useEffect(() => {
    if (isLoading || isInstalling || isStarting) {
      setAppStatus('loading')
    } else if (circuitBreakerTripped) {
      setAppStatus('circuit-tripped')
    } else if (isRepairing) {
      setAppStatus('repairing')
    } else if (previewUrl && !runtimeError) {
      setAppStatus('running')
    }
  }, [isLoading, isInstalling, isStarting, isRepairing, previewUrl, runtimeError, circuitBreakerTripped])

  // Initialize WebContainer
  useEffect(() => {
    let mounted = true

    const initWebContainer = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Check if WebContainer is supported
        if (typeof window === 'undefined') {
          throw new Error('WebContainer requires a browser environment')
        }

        // Use the WebContainer manager to get or create a container
        const wc = await webContainerManager.getContainer('workspace')
        
        if (mounted) {
          setWebcontainer(wc)
          console.log('WebContainer initialized successfully')
        }
      } catch (error: unknown) {
        if (mounted) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to initialize WebContainer'
          setError(errorMessage)
          console.error('WebContainer initialization error:', error)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initWebContainer()

    return () => {
      mounted = false
    }
  }, [])

  // Setup project files and start dev server
  useEffect(() => {
    if (!webcontainer || Object.keys(files).length === 0) return

    let mounted = true

    const setupProject = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Check if we have a package.json or create one
        const packageJson = files['package.json'] || generatePackageJson(files)
        const projectFiles = {
          ...files,
          'package.json': packageJson
        }

        // Inject spy script into HTML files
        const processedFiles: Record<string, string> = {}
        
        Object.entries(projectFiles).forEach(([path, content]) => {
          if (path.endsWith('.html') && !hasSpyScript(content)) {
            processedFiles[path] = injectSpyScript(content, {
              enableConsoleCapture: true,
              enableNetworkErrorCapture: true,
              enablePerformanceMonitoring: false
            })
            console.log('🕵️ Spy script injected into:', path)
          } else {
            processedFiles[path] = content
          }
        })

        console.log('Setting up project with files:', Object.keys(processedFiles))

        // Convert files to WebContainer format
        const webcontainerFiles: Record<string, { file: { contents: string } }> = {}
        
        Object.entries(processedFiles).forEach(([path, content]) => {
          webcontainerFiles[path] = {
            file: {
              contents: content
            }
          }
        })

        // Mount files
        await webcontainer.mount(webcontainerFiles)

        // Install dependencies
        if (hasDependencies(packageJson)) {
          setIsInstalling(true)
          console.log('Installing dependencies...')
          
          const installProcess = await webcontainer.spawn('npm', ['install'])
          installProcess.output.pipeTo(new WritableStream({
            write(data) {
              console.log('npm install:', data)
            }
          }))
          
          const installResult = await installProcess.exit
          console.log('npm install result:', installResult)
          
          if (installResult !== 0) {
            throw new Error('Failed to install dependencies')
          }
        }

        // Start dev server
        setIsStarting(true)
        console.log('Starting dev server...')
        
        const devServer = await webcontainer.spawn('npm', ['run', 'dev'])
        
        // Listen for server-ready event
        webcontainer.on('server-ready', (port: number, url: string) => {
          console.log('Server ready:', { port, url })
          if (mounted) {
            setPreviewUrl(url)
            setServerInfo({ url, port })
            setIsStarting(false)
          }
        })

        // Capture dev server output
        devServer.output.pipeTo(new WritableStream({
          write(data) {
            console.log('dev server:', data)
          }
        }))

        const devResult = await devServer.exit
        if (devResult !== 0 && mounted) {
          throw new Error('Dev server failed to start')
        }

      } catch (error: unknown) {
        if (mounted) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to setup project'
          setError(errorMessage)
          console.error('Project setup error:', error)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
          setIsInstalling(false)
          setIsStarting(false)
        }
      }
    }

    setupProject()

    return () => {
      mounted = false
    }
  }, [webcontainer, files])

  const generatePackageJson = (projectFiles: Record<string, string>): string => {
    const hasHtml = Object.keys(projectFiles).some(file => file.endsWith('.html'))
    const hasJs = Object.keys(projectFiles).some(file => file.endsWith('.js'))
    const hasTs = Object.keys(projectFiles).some(file => file.endsWith('.ts'))
    const hasReact = Object.keys(projectFiles).some(file => 
      file.includes('react') || file.includes('jsx') || file.includes('tsx')
    )

    let scripts = {}
    let dependencies = {}

    if (hasHtml && !hasJs && !hasTs) {
      // Simple HTML project
      scripts = {
        "dev": "npx serve . -l 3000",
        "build": "echo 'Static build complete'"
      }
      dependencies = {
        "serve": "^14.2.1"
      }
    } else if (hasReact) {
      // React project
      scripts = {
        "dev": "npx vite",
        "build": "npx vite build",
        "preview": "npx vite preview"
      }
      dependencies = {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "vite": "^5.0.0"
      }
    } else if (hasTs) {
      // TypeScript project
      scripts = {
        "dev": "npx tsx index.ts",
        "build": "npx tsc"
      }
      dependencies = {
        "tsx": "^4.7.0",
        "typescript": "^5.0.0"
      }
    } else {
      // Vanilla JavaScript project
      scripts = {
        "dev": "npx serve . -l 3000",
        "start": "node index.js"
      }
      dependencies = {
        "serve": "^14.2.1"
      }
    }

    return JSON.stringify({
      name: "vibe-coding-project",
      version: "0.1.0",
      type: "module",
      scripts,
      dependencies,
      devDependencies: {}
    }, null, 2)
  }

  const hasDependencies = (packageJson: string): boolean => {
    try {
      const pkg = JSON.parse(packageJson)
      return Object.keys(pkg.dependencies || {}).length > 0
    } catch {
      return false
    }
  }

  const resetPreview = async () => {
    if (!webcontainer) return
    
    try {
      setIsLoading(true)
      setPreviewUrl('')
      setServerInfo(null)
      
      // Restart the project setup
      const projectFiles = {
        ...files,
        'package.json': files['package.json'] || generatePackageJson(files)
      }
      
      // Convert files to WebContainer format
      const webcontainerFiles: Record<string, { file: { contents: string } }> = {}
      
      Object.entries(projectFiles).forEach(([path, content]) => {
        webcontainerFiles[path] = {
          file: {
            contents: content
          }
        }
      })
      
      await webcontainer.mount(webcontainerFiles)
      
      // Restart dev server
      await webcontainer.spawn('npm', ['run', 'dev'])
      
      webcontainer.on('server-ready', (port: number, url: string) => {
        setPreviewUrl(url)
        setServerInfo({ url, port })
        setIsLoading(false)
      })
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset preview'
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  const currentViewMode = viewModes[viewMode]

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h3 className="text-sm font-medium text-white">Live Preview</h3>
          
          {/* Status Indicators */}
          <div className="flex items-center space-x-4">
            {serverInfo && (
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <div className={`w-2 h-2 rounded-full ${
                  appStatus === 'running' ? 'bg-green-500 animate-pulse' :
                  appStatus === 'crashed' ? 'bg-red-500' :
                  appStatus === 'repairing' ? 'bg-yellow-500 animate-pulse' :
                  appStatus === 'circuit-tripped' ? 'bg-orange-500' :
                  'bg-blue-500 animate-pulse'
                }`} />
                <span>
                  {appStatus === 'running' ? 'Running' :
                   appStatus === 'crashed' ? 'Crashed' :
                   appStatus === 'repairing' ? 'Repairing' :
                   appStatus === 'circuit-tripped' ? 'Circuit Tripped' :
                   'Loading'}
                </span>
                <span>Port {serverInfo.port}</span>
              </div>
            )}
            
            {(isLoading || isInstalling || isStarting) && (
              <div className="flex items-center space-x-2 text-xs text-blue-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>
                  {isInstalling ? 'Installing dependencies...' : 
                   isStarting ? 'Starting server...' : 
                   'Initializing...'}
                </span>
              </div>
            )}
            
            {isRepairing && (
              <div className="flex items-center space-x-2 text-xs text-yellow-400">
                <Activity className="h-3 w-3 animate-pulse" />
                <span>Auto-repairing runtime error...</span>
              </div>
            )}
            
            {circuitBreakerTripped && (
              <div className="flex items-center space-x-2 text-xs text-orange-400">
                <AlertCircle className="h-3 w-3" />
                <span>Emergency brake activated</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Buttons */}
          <div className="flex items-center bg-gray-800 rounded-lg p-1">
            {Object.entries(viewModes).map(([mode, config]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as keyof typeof viewModes)}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === mode 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
                title={mode.charAt(0).toUpperCase() + mode.slice(1)}
              >
                <config.icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <button
            onClick={resetPreview}
            disabled={isLoading}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
            title="Reset Preview"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          {previewUrl && (
            <button
              onClick={() => window.open(previewUrl, '_blank')}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="Open in New Tab"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-center p-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Preview Error</h3>
            <p className="text-gray-400 text-sm max-w-md">{error}</p>
            <button
              onClick={resetPreview}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : isLoading && !previewUrl ? (
          <div className="text-center p-8">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Setting Up Environment</h3>
            <p className="text-gray-400 text-sm">
              {isInstalling ? 'Installing dependencies...' : 
               isStarting ? 'Starting development server...' : 
               'Initializing WebContainer...'}
            </p>
          </div>
        ) : previewUrl ? (
          <div className="w-full h-full flex flex-col">
            {/* Circuit Breaker Alert */}
            {circuitBreakerTripped && (
              <div className="mx-4 mt-4 p-3 bg-orange-900/50 border border-orange-700 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-orange-400">Emergency Brake Activated</h4>
                    <p className="text-xs text-orange-300 mt-1">
                      {circuitBreakerReason || 'Too many crashes detected. Auto-repair disabled to prevent token waste.'}
                    </p>
                    <div className="mt-2 flex items-center space-x-2">
                      <button
                        onClick={resetCircuitBreaker}
                        className="px-2 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors"
                      >
                        Reset Circuit Breaker
                      </button>
                      <button
                        onClick={() => {
                          const stats = getCircuitBreakerStats()
                          console.log('Circuit Breaker Stats:', stats)
                        }}
                        className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                      >
                        View Stats
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Runtime Error Alert */}
            {runtimeError && runtimeError.payload?.severity === 'error' && !circuitBreakerTripped && (
              <div className="mx-4 mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-red-400">Runtime Error Detected</h4>
                    <p className="text-xs text-red-300 mt-1 wrap-break-word">
                      {runtimeError.payload.message}
                    </p>
                    {runtimeError.payload.source && (
                      <p className="text-xs text-red-400 mt-1">
                        Source: {runtimeError.payload.source}
                        {runtimeError.payload.line && ` (line ${runtimeError.payload.line})`}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Type: {runtimeError.type}
                    </p>
                    {runtimeError.payload?.severity && (
                      <p className="text-xs text-gray-400 mt-1">
                        Severity: {runtimeError.payload.severity}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  {isRepairing && (
                    <div className="flex items-center space-x-2 text-xs text-yellow-400">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Auto-repairing...</span>
                    </div>
                  )}
                  {!isRepairing && (
                    <button
                      onClick={clearError}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* iframe Preview */}
            <div className="flex-1 flex items-center justify-center p-4">
              <iframe
                ref={iframeRef}
                src={previewUrl}
                className={`border rounded-lg bg-white ${
                  runtimeError?.payload?.severity === 'error' ? 'border-red-700' : 'border-gray-700'
                }`}
                style={{
                  width: currentViewMode.width,
                  height: currentViewMode.height,
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                title="Live Preview"
              />
            </div>
          </div>
        ) : (
          <div className="text-center p-8">
            <div className="w-12 h-12 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Monitor className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Preview Available</h3>
            <p className="text-gray-400 text-sm max-w-md">
              Add files to your project to start the live preview. WebContainer will automatically set up the development environment.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
