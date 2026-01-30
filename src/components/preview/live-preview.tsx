'use client'

import { useState, useEffect, useRef } from 'react'
import { Monitor, Smartphone, Tablet, RotateCcw, ExternalLink } from 'lucide-react'
import { PreviewFrame } from './preview-frame'

interface LivePreviewProps {
  files: Record<string, string>
  activeFile?: string
}

export default function LivePreview({ files, activeFile }: LivePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Read project metadata from .vibe.json
  const projectMetadata = files['.vibe.json'] ? JSON.parse(files['.vibe.json']) : null

  const viewModes = {
    desktop: { width: '100%', height: '100%', icon: Monitor },
    tablet: { width: '768px', height: '1024px', icon: Tablet },
    mobile: { width: '375px', height: '667px', icon: Smartphone }
  }

  const generatePreview = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Create HTML content from files
      const htmlContent = generateHTML(files)
      
      // Create blob URL for the preview
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)

      // Clean up previous URL
      return () => {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
        }
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to generate preview')
    } finally {
      setIsLoading(false)
    }
  }

  const generateHTML = (files: Record<string, string>): string => {
    const htmlFile = files['index.html'] || files['index.htm'] || ''
    const cssFile = files['style.css'] || files['styles.css'] || ''
    const jsFile = files['script.js'] || files['main.js'] || files['index.js'] || ''

    // If HTML file exists, inject CSS and JS
    if (htmlFile) {
      let modifiedHTML = htmlFile

      // Inject CSS if not already present
      if (cssFile && !modifiedHTML.includes('<style>') && !modifiedHTML.includes('<link')) {
        const styleTag = `<style>\n${cssFile}\n</style>`
        modifiedHTML = modifiedHTML.replace('</head>', `${styleTag}\n</head>`)
      }

      // Inject JS if not already present
      if (jsFile && !modifiedHTML.includes('<script>')) {
        const scriptTag = `<script>\n${jsFile}\n</script>`
        modifiedHTML = modifiedHTML.replace('</body>', `${scriptTag}\n</body>`)
      }

      return modifiedHTML
    }

    // Generate default HTML from separate files
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    ${cssFile ? `<style>\n${cssFile}\n</style>` : ''}
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
        }
        .preview-container {
            max-width: 800px;
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        <h1>Live Preview</h1>
        <p>Your project is running!</p>
        ${activeFile ? `<p>Currently viewing: <code>${activeFile}</code></p>` : ''}
        <div id="app"></div>
    </div>
    ${jsFile ? `<script>\n${jsFile}\n</script>` : ''}
</body>
</html>`
  }

  const refreshPreview = () => {
    generatePreview()
  }

  const openInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank')
    }
  }

  useEffect(() => {
    generatePreview()
  }, [files]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (iframeRef.current && previewUrl) {
      iframeRef.current.src = previewUrl
    }
  }, [previewUrl, viewMode])

  const currentViewMode = viewModes[viewMode]

  return (
    <div className="h-full bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-lg flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-lg font-semibold text-white">
            <Monitor className="h-5 w-5 mr-2 text-cyan-400" />
            Live Preview
            {projectMetadata && (
              <span className="ml-2 text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
                {projectMetadata.framework?.toUpperCase()} • {projectMetadata.type?.replace('_', ' ')}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* Electro gradient refresh button */}
            <div className="group relative inline-block">
              <div className="absolute inset-0 rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-r from-yellow-400 via-cyan-400 to-purple-400 opacity-20 animate-pulse" />
                <div className="absolute inset-0 bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 opacity-30 animate-pulse animation-delay-500" />
                <div className="absolute inset-0 bg-linear-to-tl from-cyan-400 via-blue-400 to-indigo-400 opacity-25 animate-pulse animation-delay-1000" />
              </div>
              <div className="absolute inset-0 rounded-lg p-px">
                <div className="w-full h-full rounded-lg bg-linear-to-r from-yellow-400 via-cyan-400 to-purple-400 opacity-60 animate-pulse" 
                     style={{ 
                       background: 'linear-gradient(45deg, #fbbf24, #06b6d4, #a855f7, #fbbf24)',
                       backgroundSize: '200% 200%',
                       animation: 'electro 2s ease-in-out infinite'
                     }} />
              </div>
              <button 
                className="relative px-3 py-1 bg-black text-white text-sm font-medium rounded-lg border border-gray-800 hover:border-yellow-400/50 hover:bg-gray-900 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-400/25 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={refreshPreview}
                disabled={isLoading}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Refresh
              </button>
            </div>
            
            {/* Electro gradient open button */}
            <div className="group relative inline-block">
              <div className="absolute inset-0 rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-r from-yellow-400 via-cyan-400 to-purple-400 opacity-20 animate-pulse" />
                <div className="absolute inset-0 bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 opacity-30 animate-pulse animation-delay-500" />
                <div className="absolute inset-0 bg-linear-to-tl from-cyan-400 via-blue-400 to-indigo-400 opacity-25 animate-pulse animation-delay-1000" />
              </div>
              <div className="absolute inset-0 rounded-lg p-px">
                <div className="w-full h-full rounded-lg bg-linear-to-r from-yellow-400 via-cyan-400 to-purple-400 opacity-60 animate-pulse" 
                     style={{ 
                       background: 'linear-gradient(45deg, #fbbf24, #06b6d4, #a855f7, #fbbf24)',
                       backgroundSize: '200% 200%',
                       animation: 'electro 2s ease-in-out infinite'
                     }} />
              </div>
              <button 
                className="relative px-3 py-1 bg-black text-white text-sm font-medium rounded-lg border border-gray-800 hover:border-yellow-400/50 hover:bg-gray-900 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-400/25 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={openInNewTab}
                disabled={!previewUrl}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Open
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-0">
        {/* Custom tabs implementation */}
        <div className="border-b border-gray-800">
          <div className="grid grid-cols-3 m-2">
            {Object.entries(viewModes).map(([mode, config]) => (
              <button
                key={mode}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center ${
                  viewMode === mode
                    ? 'bg-cyan-600 text-white'
                    : 'bg-black/50 text-gray-300 hover:bg-gray-800 border border-gray-700'
                }`}
                onClick={() => setViewMode(mode as 'desktop' | 'tablet' | 'mobile')}
              >
                <config.icon className="h-4 w-4 mr-1" />
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[calc(100%-3rem)] m-0">
          <div className="h-full flex items-center justify-center bg-black/30 p-4">
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                <span className="ml-2 text-sm text-gray-300">Generating preview...</span>
              </div>
            ) : error ? (
              <div className="text-center">
                <div className="text-red-400 mb-2">Preview Error</div>
                <p className="text-sm text-gray-400">{error}</p>
                <button 
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  onClick={refreshPreview}
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div 
                className="bg-black border border-gray-700 rounded-lg shadow-lg overflow-hidden"
                style={{ 
                  width: currentViewMode.width, 
                  height: currentViewMode.height,
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
              >
                <PreviewFrame metadata={projectMetadata}>
                  <iframe
                    ref={iframeRef}
                    src={previewUrl}
                    className="w-full h-full border-0"
                    title="Live Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                  />
                </PreviewFrame>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
