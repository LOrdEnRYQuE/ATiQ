'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Code } from 'lucide-react'
import { aiService } from '@/lib/gemini'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIChatProps {
  onCodeGenerated?: (code: string, language: string) => void
}

export default function AIChat({ onCodeGenerated }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await aiService.generateCode(input.trim(), 'javascript')
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      
      // Notify parent component about generated code
      if (onCodeGenerated) {
        onCodeGenerated(response, 'javascript')
      }
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error generating code. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const quickPrompts = [
    { icon: Code, text: 'Create a React component', prompt: 'Create a React component with useState and useEffect hooks' },
    { icon: Code, text: 'API endpoint', prompt: 'Create a Node.js Express API endpoint with error handling' }
  ]

  return (
    <div className="h-full bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-lg flex flex-col">
      <div className="p-4 border-b border-gray-800">
        {/* Empty header - removed AI Assistant text and icon */}
      </div>
      
      <div className="flex-1 flex flex-col p-0">
        {/* Quick Prompts */}
        <div className="p-6 border-b border-gray-800">
          <p className="text-sm text-gray-400 mb-4">Quick prompts:</p>
          <div className="space-y-3">
            {quickPrompts.map((prompt, index) => (
              <button
                key={index}
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-left text-sm text-gray-300 hover:border-gray-600 hover:bg-gray-800/70 transition-all duration-300 transform hover:scale-105 flex items-center"
                onClick={() => setInput(prompt.prompt)}
              >
                <prompt.icon className="h-5 w-5 mr-3 text-cyan-400" />
                {prompt.text}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-800 text-gray-100'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                <div className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-cyan-100' : 'text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                  <span className="text-sm text-gray-300">Generating code...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-gray-800">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me to generate code..."
              disabled={isLoading}
              className="w-full px-4 py-4 pr-16 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-sm resize-none h-24"
              rows={3}
            />
            {/* Electro gradient send button inside textarea */}
            <div className="absolute right-3 bottom-3">
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
                  className="relative p-2 bg-black text-white rounded-lg border border-gray-800 hover:border-yellow-400/50 hover:bg-gray-900 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-400/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
