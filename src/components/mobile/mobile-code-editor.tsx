'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Share2, 
  Copy, 
  Check,
  X,
  ChevronDown,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react'

interface MobileCodeEditorProps {
  code: string
  language: string
  onChange: (code: string) => void
  onRun?: (code: string) => void
  onSave?: (code: string) => void
  readOnly?: boolean
  placeholder?: string
  theme?: 'light' | 'dark'
  fontSize?: 'small' | 'medium' | 'large'
  showLineNumbers?: boolean
  enableVim?: boolean
}

export default function MobileCodeEditor({
  code,
  language,
  onChange,
  onRun,
  onSave,
  readOnly = false,
  placeholder = '// Start typing your code here...',
  theme = 'dark',
  fontSize = 'medium',
  showLineNumbers = true,
  enableVim = false
}: MobileCodeEditorProps) {
  const [localCode, setLocalCode] = useState(code)
  const [isRunning, setIsRunning] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showDevicePreview, setShowDevicePreview] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    setLocalCode(code)
  }, [code])

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value
    setLocalCode(newCode)
    onChange(newCode)
  }

  const handleRun = async () => {
    if (onRun) {
      setIsRunning(true)
      try {
        await onRun(localCode)
      } finally {
        setIsRunning(false)
      }
    }
  }

  const handleSave = () => {
    if (onSave) {
      onSave(localCode)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(localCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Code from Vibe Coding',
          text: localCode,
          url: window.location.href
        })
      } catch (error) {
        console.error('Share failed:', error)
        // Fallback to copying
        handleCopy()
      }
    } else {
      // Fallback to copying
      handleCopy()
    }
  }

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small': return 'text-xs'
      case 'large': return 'text-lg'
      default: return 'text-sm'
    }
  }

  const getDeviceIcon = () => {
    switch (selectedDevice) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />
      case 'tablet':
        return <Tablet className="w-4 h-4" />
      case 'desktop':
        return <Monitor className="w-4 h-4" />
    }
  }

  const getDeviceWidth = () => {
    switch (selectedDevice) {
      case 'mobile':
        return 'w-full max-w-sm'
      case 'tablet':
        return 'w-full max-w-2xl'
      case 'desktop':
        return 'w-full max-w-4xl'
      default:
        return 'w-full'
    }
  }

  const insertTab = () => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newCode = localCode.substring(0, start) + '  ' + localCode.substring(end)
      setLocalCode(newCode)
      onChange(newCode)
      
      // Restore cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
        textarea.focus()
      }, 0)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle tab key
    if (e.key === 'Tab') {
      e.preventDefault()
      insertTab()
    }
    
    // Handle Ctrl/Cmd + S for save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      handleSave()
    }
    
    // Handle Ctrl/Cmd + Enter for run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleRun()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Mobile Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <select
            value={language}
            onChange={(e) => onChange(localCode)}
            className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            disabled={readOnly}
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="json">JSON</option>
            <option value="markdown">Markdown</option>
          </select>
          
          <button
            onClick={() => setShowDevicePreview(!showDevicePreview)}
            className="flex items-center space-x-1 px-2 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {getDeviceIcon()}
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handleRun}
            disabled={isRunning || readOnly}
            className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-sm">Running</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span className="text-sm">Run</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleSave}
            disabled={readOnly}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Save</span>
          </button>
          
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600 hidden sm:inline">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Copy</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleShare}
            className="flex items-center space-x-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      {/* Device Preview */}
      {showDevicePreview && (
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => setSelectedDevice('mobile')}
              className={`p-2 rounded ${selectedDevice === 'mobile' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedDevice('tablet')}
              className={`p-2 rounded ${selectedDevice === 'tablet' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedDevice('desktop')}
              className={`p-2 rounded ${selectedDevice === 'desktop' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Code Editor */}
      <div className="flex-1 relative">
        <div className={`${getDeviceWidth()} mx-auto ${showDevicePreview ? 'border-x border-gray-300 dark:border-gray-700' : ''}`}>
          <div className="relative">
            {/* Line Numbers */}
            {showLineNumbers && (
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-mono p-3 select-none overflow-hidden">
                {localCode.split('\n').map((_, index) => (
                  <div key={index} className="text-right">
                    {index + 1}
                  </div>
                ))}
              </div>
            )}
            
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={localCode}
              onChange={handleCodeChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              readOnly={readOnly}
              className={`w-full h-full resize-none font-mono ${getFontSizeClass()} ${
                showLineNumbers ? 'pl-16' : 'p-3'
              } bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-0 focus:outline-none ${
                isFocused ? 'ring-2 ring-blue-500' : ''
              } ${readOnly ? 'cursor-not-allowed' : ''}`}
              style={{
                minHeight: '400px',
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                tabSize: 2,
              }}
              spellCheck={false}
            />
            
            {/* Cursor indicator */}
            {isFocused && !readOnly && (
              <div className="absolute top-3 left-3 w-0.5 h-4 bg-blue-600 animate-pulse"></div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Status Bar */}
      <div className="flex items-center justify-between p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="text-xs text-gray-500">
          {localCode.split('\n').length} lines • {localCode.length} chars
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          {language && <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
            {language}
          </span>}
          <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
            {theme}
          </span>
        </div>
      </div>
    </div>
  )
}
