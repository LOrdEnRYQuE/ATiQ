'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Code2, Sparkles, Zap, CheckCircle, AlertCircle } from 'lucide-react'
import { aiManager, AIResponse, CodeAnalysis } from '@/lib/ai/ai-manager'
import { analytics } from '@/lib/analytics'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  code?: string
  language?: string
  analysis?: CodeAnalysis
  suggestions?: string[]
  isGenerating?: boolean
}

interface AdvancedAIChatProps {
  onCodeGenerated?: (code: string, language: string) => void
  initialCode?: string
  language?: string
}

export default function AdvancedAIChat({ onCodeGenerated, initialCode = '', language = 'javascript' }: AdvancedAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedModel, setSelectedModel] = useState('gemini')
  const [codeStyle, setCodeStyle] = useState<'functional' | 'object-oriented' | 'procedural'>('functional')
  const [includeTests, setIncludeTests] = useState(false)
  const [includeComments, setIncludeComments] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const availableProviders = aiManager.getAvailableProviders()

  useEffect(() => {
    // Set initial provider
    if (availableProviders.length > 0) {
      aiManager.setProvider(availableProviders[0])
    }
  }, [availableProviders])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isGenerating) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsGenerating(true)

    // Add loading message
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'Generating code...',
      timestamp: new Date(),
      isGenerating: true
    }

    setMessages(prev => [...prev, loadingMessage])

    try {
      const startTime = Date.now()
      
      const response = await aiManager.generateCode(input, {
        language,
        style: codeStyle,
        includeTests,
        includeComments
      })

      const responseTime = Date.now() - startTime

      const assistantMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: response.explanation,
        timestamp: new Date(),
        code: response.code,
        language: response.language,
        suggestions: response.suggestions,
        isGenerating: false
      }

      setMessages(prev => prev.slice(0, -1).concat([assistantMessage]))

      // Track analytics
      analytics.trackAIRequest(input, response.code, response.tokensUsed, selectedModel)
      analytics.trackPerformance('ai_response_time', responseTime, 'ms')

      // Callback with generated code
      if (onCodeGenerated && response.code) {
        onCodeGenerated(response.code, response.language)
      }

    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        isGenerating: false
      }

      setMessages(prev => prev.slice(0, -1).concat([errorMessage]))
      
      analytics.trackAIError(
        error instanceof Error ? error.message : 'Unknown error',
        input,
        selectedModel
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAnalyzeCode = async (code: string) => {
    try {
      const analysis = await aiManager.analyzeCode(code)
      
      const analysisMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Code Analysis Complete:\n\n• Complexity Score: ${analysis.complexity}/10\n• Maintainability Score: ${analysis.maintainability}/10\n• Time Complexity: ${analysis.performance.timeComplexity}\n• Space Complexity: ${analysis.performance.spaceComplexity}`,
        timestamp: new Date(),
        analysis,
        suggestions: analysis.suggestions
      }

      setMessages(prev => [...prev, analysisMessage])
    } catch (error) {
      console.error('Code analysis failed:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 8) return 'text-green-600'
    if (confidence >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSecurityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'medium':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Advanced AI Assistant</h3>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Model Selection */}
          <select
            value={selectedModel}
            onChange={(e) => {
              setSelectedModel(e.target.value)
              aiManager.setProvider(e.target.value)
            }}
            className="text-sm border rounded px-2 py-1"
            disabled={availableProviders.length === 0}
          >
            {availableProviders.map(provider => (
              <option key={provider} value={provider}>
                {provider.charAt(0).toUpperCase() + provider.slice(1)}
              </option>
            ))}
          </select>

          {/* Code Style */}
          <select
            value={codeStyle}
            onChange={(e) => setCodeStyle(e.target.value as any)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="functional">Functional</option>
            <option value="object-oriented">Object-Oriented</option>
            <option value="procedural">Procedural</option>
          </select>

          {/* Options */}
          <label className="flex items-center space-x-1 text-sm">
            <input
              type="checkbox"
              checked={includeTests}
              onChange={(e) => setIncludeTests(e.target.checked)}
              className="rounded"
            />
            <span>Tests</span>
          </label>

          <label className="flex items-center space-x-1 text-sm">
            <input
              type="checkbox"
              checked={includeComments}
              onChange={(e) => setIncludeComments(e.target.checked)}
              className="rounded"
            />
            <span>Comments</span>
          </label>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-start space-x-2">
                <div className="shrink-0 mt-1">
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="text-sm opacity-75">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                  
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {message.code && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Code2 className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {message.language || 'Code'}
                          </span>
                        </div>
                        <button
                          onClick={() => onCodeGenerated?.(message.code!, message.language!)}
                          className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded"
                        >
                          Use This Code
                        </button>
                      </div>
                      <pre className="bg-black/20 p-3 rounded text-sm overflow-x-auto">
                        <code>{message.code}</code>
                      </pre>
                    </div>
                  )}
                  
                  {message.analysis && (
                    <div className="mt-3 p-3 bg-white/10 rounded">
                      <h4 className="font-medium mb-2">Code Analysis</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Complexity: {message.analysis.complexity}/10</div>
                        <div>Maintainability: {message.analysis.maintainability}/10</div>
                        <div>Time: {message.analysis.performance.timeComplexity}</div>
                        <div>Space: {message.analysis.performance.spaceComplexity}</div>
                      </div>
                      
                      {message.analysis.securityIssues.length > 0 && (
                        <div className="mt-2">
                          <h5 className="font-medium text-sm">Security Issues:</h5>
                          {message.analysis.securityIssues.map((issue, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm mt-1">
                              {getSecurityIcon(issue.severity)}
                              <span>{issue.description}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3">
                      <h4 className="font-medium mb-2 flex items-center space-x-2">
                        <Sparkles className="w-4 h-4" />
                        <span>Suggestions</span>
                      </h4>
                      <ul className="text-sm space-y-1">
                        {message.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-blue-500">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {message.isGenerating && (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      <span className="text-sm">Thinking...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to generate code, explain concepts, or analyze your code..."
            className="flex-1 resize-none border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={isGenerating}
          />
          
          <div className="flex flex-col space-y-2">
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isGenerating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isGenerating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{isGenerating ? 'Generating' : 'Send'}</span>
            </button>
            
            {initialCode && (
              <button
                onClick={() => handleAnalyzeCode(initialCode)}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm flex items-center space-x-1"
              >
                <Zap className="w-3 h-3" />
                <span>Analyze</span>
              </button>
            )}
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  )
}
